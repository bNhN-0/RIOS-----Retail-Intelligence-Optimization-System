"use client";

import {
  keepPreviousData,
  useQuery,
  type QueryClient,
} from "@tanstack/react-query";
import {
  type ReadonlyURLSearchParams,
} from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchOverviewInventoryExplorerPage,
  fetchProductExplorerPage,
  getExplorerBaseUrl,
  getPageFilterOptions,
  type InventoryExplorerRequest,
  type StockItem,
} from "@/features/inventory/services/inventoryExplorerApi";
import {
  BACKGROUND_REVALIDATION_STALE_TIME_MS,
  DEFAULT_QUERY_GC_TIME_MS,
} from "@/lib/api/reactQuery";
import {
  usePathname,
  useSearchParams,
} from "@/lib/hooks/navigationHooks";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

export const INVENTORY_EXPLORER_PAGE_SIZE = 50;
export const INVENTORY_EXPLORER_QUERY_KEY = ["inventory-explorer"] as const;

const SEARCH_DEBOUNCE_MS = 250;
const DEFAULT_FILTER_VALUE = "All";
const INVENTORY_EXPLORER_STORAGE_PREFIX = "rios.inventory-explorer";

type ExplorerType = "overview" | "product";
type InventoryExplorerPageData = Awaited<
  ReturnType<typeof fetchOverviewInventoryExplorerPage>
>;
type HistoryMode = "push" | "replace";

export type InventoryExplorerSortOption = {
  label: string;
  value: string;
};

type InventoryExplorerFilterMode = "client" | "server";

type InventoryExplorerHookConfig = {
  applyClientView?: (
    pageData: InventoryExplorerPageData,
    state: InventoryExplorerViewState,
  ) => InventoryExplorerPageData;
  defaultSort: string;
  explorerType: ExplorerType;
  filterMode?: {
    brand?: InventoryExplorerFilterMode;
    category?: InventoryExplorerFilterMode;
  };
  sortOptions: InventoryExplorerSortOption[];
  supportsPagination?: boolean;
};

type InventoryExplorerViewState = {
  page: number;
  search: string;
  selectedBrand: string;
  selectedCategoryFilter: string;
  selectedProduct: string | null;
  sort: string;
};

type PersistedInventoryExplorerViewState = Pick<
  InventoryExplorerViewState,
  "page" | "search" | "selectedBrand" | "selectedCategoryFilter" | "sort"
>;

const pageFetchers = {
  overview: fetchOverviewInventoryExplorerPage,
  product: fetchProductExplorerPage,
} satisfies Record<
  ExplorerType,
  (request: InventoryExplorerRequest) => Promise<InventoryExplorerPageData>
>;

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function getInventoryExplorerStorageKey(pathname: string) {
  return `${INVENTORY_EXPLORER_STORAGE_PREFIX}:${pathname}`;
}

function readPersistedViewState(
  pathname: string,
): PersistedInventoryExplorerViewState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(
      getInventoryExplorerStorageKey(pathname),
    );

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<
      PersistedInventoryExplorerViewState
    >;

    return {
      page: parsePositiveInteger(
        typeof parsed.page === "number" ? String(parsed.page) : null,
        1,
      ),
      search: typeof parsed.search === "string" ? parsed.search : "",
      selectedBrand:
        typeof parsed.selectedBrand === "string"
          ? parsed.selectedBrand
          : DEFAULT_FILTER_VALUE,
      selectedCategoryFilter:
        typeof parsed.selectedCategoryFilter === "string"
          ? parsed.selectedCategoryFilter
          : DEFAULT_FILTER_VALUE,
      sort: typeof parsed.sort === "string" ? parsed.sort : "",
    };
  } catch {
    return null;
  }
}

function persistViewState(
  pathname: string,
  state: PersistedInventoryExplorerViewState,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    getInventoryExplorerStorageKey(pathname),
    JSON.stringify(state),
  );
}

function hasExplicitViewState(searchParams: ReadonlyURLSearchParams) {
  return ["page", "search", "brand", "category", "sort"].some((key) =>
    searchParams.has(key),
  );
}

function writeViewStateToParams(
  params: URLSearchParams,
  state: Pick<
    InventoryExplorerViewState,
    "page" | "search" | "selectedBrand" | "selectedCategoryFilter" | "sort"
  >,
  defaultSort: string,
) {
  if (state.page > 1) {
    params.set("page", String(state.page));
  } else {
    params.delete("page");
  }

  if (state.search) {
    params.set("search", state.search);
  } else {
    params.delete("search");
  }

  if (state.selectedBrand !== DEFAULT_FILTER_VALUE) {
    params.set("brand", state.selectedBrand);
  } else {
    params.delete("brand");
  }

  if (state.selectedCategoryFilter !== DEFAULT_FILTER_VALUE) {
    params.set("category", state.selectedCategoryFilter);
  } else {
    params.delete("category");
  }

  if (state.sort !== defaultSort) {
    params.set("sort", state.sort);
  } else {
    params.delete("sort");
  }
}

function commitSearchParams(
  pathname: string,
  params: URLSearchParams,
  mode: HistoryMode,
) {
  if (typeof window === "undefined") {
    return;
  }

  const nextQuery = params.toString();
  const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

  if (mode === "push") {
    window.history.pushState(null, "", nextUrl);
    return;
  }

  window.history.replaceState(null, "", nextUrl);
}

function getNormalizedPage(
  requestedPage: number,
  supportsPagination: boolean,
) {
  return supportsPagination ? requestedPage : 1;
}

function getPageQueryKey(
  explorerType: ExplorerType,
  state: Pick<
    InventoryExplorerViewState,
    "page" | "search" | "selectedBrand" | "selectedCategoryFilter" | "sort"
  >,
) {
  return [
    ...INVENTORY_EXPLORER_QUERY_KEY,
    explorerType,
    {
      brand: state.selectedBrand,
      category: state.selectedCategoryFilter,
      page: state.page,
      search: state.search,
      sort: state.sort,
    },
  ] as const;
}

function getFilterMode(
  config: InventoryExplorerHookConfig,
) {
  return {
    brand: config.filterMode?.brand ?? "server",
    category: config.filterMode?.category ?? "server",
  } as const;
}

async function fetchInventoryExplorerPageData(
  explorerType: ExplorerType,
  state: Pick<
    InventoryExplorerViewState,
    "page" | "search" | "selectedBrand" | "selectedCategoryFilter" | "sort"
  >,
  signal?: AbortSignal,
) {
  const result = await pageFetchers[explorerType]({
    limit: INVENTORY_EXPLORER_PAGE_SIZE,
    page: state.page,
    search: state.search,
    selectedBrand: state.selectedBrand,
    selectedCategoryFilter: state.selectedCategoryFilter,
    sort: state.sort,
    signal,
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return result;
}

function getPageQueryOptions(
  explorerType: ExplorerType,
  state: Pick<
    InventoryExplorerViewState,
    "page" | "search" | "selectedBrand" | "selectedCategoryFilter" | "sort"
  >,
) {
  return {
    queryKey: getPageQueryKey(explorerType, state),
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchInventoryExplorerPageData(explorerType, state, signal),
    staleTime: BACKGROUND_REVALIDATION_STALE_TIME_MS,
    gcTime: DEFAULT_QUERY_GC_TIME_MS,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  };
}

function collectProductIdsFromInventoryExplorerData(data: unknown) {
  if (!data || typeof data !== "object") {
    return [];
  }

  const record = data as Partial<{ items: StockItem[] }>;

  return (Array.isArray(record.items) ? record.items : [])
    .map((item) => item?.product_id || null)
    .filter((productId): productId is string => typeof productId === "string");
}

function mergeFilterOptions(
  options: string[],
  selectedValue: string,
) {
  if (
    selectedValue &&
    selectedValue !== DEFAULT_FILTER_VALUE &&
    !options.includes(selectedValue)
  ) {
    return [selectedValue, ...options];
  }

  return options;
}

export async function invalidateInventoryExplorerQueries(
  queryClient: QueryClient,
  productIds?: string[],
) {
  const normalizedProductIds = new Set(
    (productIds || []).map((productId) => productId.trim()).filter(Boolean),
  );
  const invalidateAll = normalizedProductIds.size === 0;

  await queryClient.invalidateQueries({
    predicate: (query) => {
      if (!Array.isArray(query.queryKey)) {
        return false;
      }

      if (query.queryKey[0] !== INVENTORY_EXPLORER_QUERY_KEY[0]) {
        return false;
      }

      if (invalidateAll) {
        return true;
      }

      return collectProductIdsFromInventoryExplorerData(query.state.data).some(
        (productId) => normalizedProductIds.has(productId),
      );
    },
  });
}

export function usePaginatedInventoryExplorer(
  config: InventoryExplorerHookConfig,
) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supportsPagination = config.supportsPagination ?? true;
  const [persistedViewState] = useState(() =>
    readPersistedViewState(pathname),
  );

  const hasExplicitViewParams = hasExplicitViewState(searchParams);
  const requestedPage = getNormalizedPage(
    hasExplicitViewParams
      ? parsePositiveInteger(searchParams.get("page"), 1)
      : persistedViewState?.page || 1,
    supportsPagination,
  );
  const selectedBrand = hasExplicitViewParams
    ? searchParams.get("brand") || DEFAULT_FILTER_VALUE
    : persistedViewState?.selectedBrand || DEFAULT_FILTER_VALUE;
  const selectedCategoryFilter = hasExplicitViewParams
    ? searchParams.get("category") || DEFAULT_FILTER_VALUE
    : persistedViewState?.selectedCategoryFilter || DEFAULT_FILTER_VALUE;
  const selectedProduct = searchParams.get("product_id");
  const sort = hasExplicitViewParams
    ? searchParams.get("sort") || config.defaultSort
    : persistedViewState?.sort || config.defaultSort;
  const searchParam = hasExplicitViewParams
    ? searchParams.get("search") || ""
    : persistedViewState?.search || "";
  const [search, setSearch] = useState(searchParam);
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);

  useEffect(() => {
    if (hasExplicitViewParams || !persistedViewState) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());

    writeViewStateToParams(
      nextParams,
      {
        ...persistedViewState,
        page: getNormalizedPage(persistedViewState.page, supportsPagination),
      },
      config.defaultSort,
    );

    if (nextParams.toString() !== searchParams.toString()) {
      commitSearchParams(pathname, nextParams, "replace");
    }
  }, [
    config.defaultSort,
    hasExplicitViewParams,
    pathname,
    persistedViewState,
    searchParams,
    supportsPagination,
  ]);

  useEffect(() => {
    persistViewState(pathname, {
      page: requestedPage,
      search: searchParam,
      selectedBrand,
      selectedCategoryFilter,
      sort,
    });
  }, [
    pathname,
    requestedPage,
    searchParam,
    selectedBrand,
    selectedCategoryFilter,
    sort,
  ]);

  const updateParams = useCallback(
    (
      updates: Record<string, string | null>,
      {
        history = "replace",
        resetPage = false,
      }: {
        history?: HistoryMode;
        resetPage?: boolean;
      } = {},
    ) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          nextParams.delete(key);
          return;
        }

        nextParams.set(key, value);
      });

      if (resetPage || !supportsPagination) {
        nextParams.delete("page");
      }

      commitSearchParams(pathname, nextParams, history);
    },
    [pathname, searchParams, supportsPagination],
  );

  useEffect(() => {
    if (debouncedSearch === searchParam) {
      return;
    }

    updateParams(
      {
        search: debouncedSearch || null,
      },
      { resetPage: true },
    );
  }, [debouncedSearch, searchParam, updateParams]);

  const queryState = useMemo(
    () =>
      ({
        page: requestedPage,
        search: searchParam,
        selectedBrand,
        selectedCategoryFilter,
        sort,
      }) as const,
    [
      requestedPage,
      searchParam,
      selectedBrand,
      selectedCategoryFilter,
      sort,
    ],
  );
  const viewState = useMemo(
    () =>
      ({
        ...queryState,
        selectedProduct,
      }) as const,
    [queryState, selectedProduct],
  );
  const filterMode = useMemo(
    () => getFilterMode(config),
    [config],
  );
  const requestState = useMemo(
    () =>
      ({
        ...queryState,
        selectedBrand:
          filterMode.brand === "client"
            ? DEFAULT_FILTER_VALUE
            : queryState.selectedBrand,
        selectedCategoryFilter:
          filterMode.category === "client"
            ? DEFAULT_FILTER_VALUE
            : queryState.selectedCategoryFilter,
      }) as const,
    [filterMode.brand, filterMode.category, queryState],
  );

  const query = useQuery({
    ...getPageQueryOptions(config.explorerType, requestState),
    placeholderData: keepPreviousData,
  });

  const clientFilteredQueryData = useMemo(() => {
    if (!query.data) {
      return null;
    }
    const items = query.data.items.filter((item) => {
      if (
        filterMode.brand === "client" &&
        selectedBrand !== DEFAULT_FILTER_VALUE &&
        item.brand !== selectedBrand
      ) {
        return false;
      }

      if (
        filterMode.category === "client" &&
        selectedCategoryFilter !== DEFAULT_FILTER_VALUE &&
        item.categoryName !== selectedCategoryFilter
      ) {
        return false;
      }

      return true;
    });

    return {
      ...query.data,
      items,
    };
  }, [
    filterMode.brand,
    filterMode.category,
    query.data,
    selectedBrand,
    selectedCategoryFilter,
  ]);
  const pageData = config.applyClientView
    ? clientFilteredQueryData
      ? config.applyClientView(clientFilteredQueryData, viewState)
      : null
    : clientFilteredQueryData;
  const pageFilterOptions = getPageFilterOptions(query.data?.items ?? []);
  const brands = mergeFilterOptions(pageFilterOptions.brands, selectedBrand);
  const categories = mergeFilterOptions(
    pageFilterOptions.categories,
    selectedCategoryFilter,
  );
  const displayPage = query.data?.page ?? requestedPage;
  const isTransitioningPage =
    query.isPlaceholderData && displayPage !== requestedPage;
  const queryError =
    query.error instanceof Error ? query.error.message : null;

  const setPage = useCallback(
    (value: number | ((current: number) => number)) => {
      if (!supportsPagination) {
        return;
      }

      const nextPage =
        typeof value === "function" ? value(requestedPage) : value;
      const normalizedPage = Math.max(1, nextPage);

      updateParams(
        {
          page: normalizedPage > 1 ? String(normalizedPage) : null,
        },
        { history: "push" },
      );
    },
    [requestedPage, supportsPagination, updateParams],
  );

  const setSelectedBrand = useCallback(
    (value: string) => {
      updateParams(
        {
          brand: value !== DEFAULT_FILTER_VALUE ? value : null,
        },
        { resetPage: true },
      );
    },
    [updateParams],
  );

  const setSelectedCategoryFilter = useCallback(
    (value: string) => {
      updateParams(
        {
          category: value !== DEFAULT_FILTER_VALUE ? value : null,
        },
        { resetPage: true },
      );
    },
    [updateParams],
  );

  const setSort = useCallback(
    (value: string) => {
      updateParams(
        {
          sort: value !== config.defaultSort ? value : null,
        },
        { resetPage: true },
      );
    },
    [config.defaultSort, updateParams],
  );

  return {
    baseUrl: getExplorerBaseUrl(),
    brandOptions: [DEFAULT_FILTER_VALUE, ...brands],
    categoryOptions: [DEFAULT_FILTER_VALUE, ...categories],
    backgroundError: query.data ? queryError : null,
    displayPage,
    fetchError: !pageData ? queryError : null,
    hasNextPage: pageData?.hasNextPage ?? false,
    hasPrevPage: supportsPagination && requestedPage > 1,
    isFetchingPage: query.isFetching && Boolean(query.data),
    isTransitioningPage,
    items: pageData?.items ?? [],
    loading: !pageData && query.isPending,
    page: requestedPage,
    pageSize: INVENTORY_EXPLORER_PAGE_SIZE,
    requestedPage,
    search,
    selectedBrand,
    selectedCategoryFilter,
    selectedProduct,
    setPage,
    setSearch,
    setSelectedBrand,
    setSelectedCategoryFilter,
    setSort,
    sort,
    sortOptions: config.sortOptions,
  };
}

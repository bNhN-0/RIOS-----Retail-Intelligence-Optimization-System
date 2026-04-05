"use client";

import { formatCurrencyTHB } from "@/lib/formatters/currency";
import {
  fetchAllBackendTableRows,
  fetchBackendJson,
  fetchBackendQuery,
  getBackendBaseUrl,
  getBackendRequestUrl,
  normalizeRows,
  pickNumber,
  pickString,
  type BackendRow,
} from "@/lib/api/riosBackend";

export type StockItem = {
  product_id: string;
  product_name: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  stock: number;
  reorder: number;
  velocity: number;
  demand: number;
  demandScore: number;
  holdingValue: number;
  inventoryScore: number;
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  costPrice: number;
  nlpScore: number;
};

export type ProductScoreboardRow = {
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  demandScore: number;
  inventoryScore: number;
  latestDemandUpdate: string;
  latestInventoryUpdate: string;
  latestNlpUpdate: string;
  nlpScore: number;
};

export type ProductScoreboardData = {
  byProductId: Record<string, ProductScoreboardRow>;
  itemCount: number;
  rows: ProductScoreboardRow[];
};

export type InventoryFilterOption = {
  label: string;
  value: string;
};

export type ProductExplorerReferenceData = {
  brands: string[];
  categories: InventoryFilterOption[];
  categoryNameById: Record<string, string>;
  referenceError: string | null;
  supplierNameById: Record<string, string>;
};

export type InventoryExplorerRequest = {
  limit: number;
  page: number;
  search: string;
  selectedBrand: string;
  selectedCategoryFilter: string;
  sort: string;
  signal?: AbortSignal;
};

type ExplorerPageResult = {
  items: StockItem[];
  hasNextPage: boolean;
  error: string | null;
  limit: number;
  page: number;
};

type ProductSortDescriptor = {
  sortBy: string;
  sortOrder: "asc" | "desc";
};

type OverviewSortDescriptor = {
  sortBy: string;
  sortOrder: "asc" | "desc";
};

const DEFAULT_FILTER_VALUE = "All";

export const PRODUCT_EXPLORER_REFERENCE_QUERY_KEY = [
  "inventory-explorer",
  "product-reference",
] as const;
export const PRODUCT_SCOREBOARD_QUERY_KEY = [
  "inventory-explorer",
  "product-scoreboard",
] as const;

function getProductSortDescriptor(sort: string): ProductSortDescriptor {
  switch (sort) {
    case "brand-asc":
      return { sortBy: "brand", sortOrder: "asc" };
    case "category-asc":
      return { sortBy: "category_id", sortOrder: "asc" };
    case "cost-price-desc":
      return { sortBy: "cost_price", sortOrder: "desc" };
    case "unit-price-desc":
      return { sortBy: "unit_price", sortOrder: "desc" };
    default:
      return { sortBy: "product_name", sortOrder: "asc" };
  }
}

function getOverviewSortDescriptor(sort: string): OverviewSortDescriptor {
  switch (sort) {
    case "holding-asc":
      return { sortBy: "value_in_hold", sortOrder: "asc" };
    case "holding-desc":
      return { sortBy: "value_in_hold", sortOrder: "desc" };
    case "inventory-asc":
      return { sortBy: "inventory_score", sortOrder: "asc" };
    case "inventory-desc":
      return { sortBy: "inventory_score", sortOrder: "desc" };
    case "stock-desc":
      return { sortBy: "stock_in_hand", sortOrder: "desc" };
    case "stock-asc":
      return { sortBy: "stock_in_hand", sortOrder: "asc" };
    default:
      return { sortBy: "product_name", sortOrder: "asc" };
  }
}

function normalizeProductExplorerRow(row: BackendRow): StockItem | null {
  const productId = pickString(row, ["product_id", "id"]);
  const productName = pickString(row, ["product_name", "name"]);

  if (!productId || !productName) {
    return null;
  }

  const brand = pickString(row, ["brand"], "Unbranded");
  const categoryId = pickString(row, ["category_id", "categoryId"]);
  const supplierId = pickString(row, ["supplier_id", "supplierId"]);

  return {
    product_id: productId,
    product_name: productName,
    brand,
    categoryId,
    categoryName: pickString(
      row,
      ["category_name", "category"],
      categoryId || "Uncategorized",
    ),
    stock: 0,
    reorder: 0,
    velocity: 0,
    demand: 0,
    demandScore: 0,
    holdingValue: 0,
    inventoryScore: 0,
    supplierId,
    supplierName: pickString(
      row,
      ["supplier_name", "supplier"],
      supplierId,
    ),
    unitPrice: pickNumber(row, ["unit_price", "price", "selling_price"]),
    costPrice: pickNumber(row, ["cost_price", "unit_cost", "purchase_price"]),
    nlpScore: 0,
  };
}

function normalizeOverviewRow(row: BackendRow): StockItem | null {
  const productName = pickString(
    row,
    ["product_name", "name", "label", "product"],
  );

  if (!productName) {
    return null;
  }

  const productId =
    pickString(row, ["product_id", "id", "sku"], productName) || productName;
  const rawInventoryScore = pickNumber(row, ["inventory_score", "score"]);

  return {
    product_id: productId,
    product_name: productName,
    brand: pickString(row, ["brand"], "Unspecified"),
    categoryId: pickString(row, ["category_id", "category"], ""),
    categoryName: pickString(
      row,
      ["category_name", "category"],
      "Uncategorized",
    ),
    stock: pickNumber(row, [
      "inventory_quantity",
      "quantity_on_hand",
      "stock",
      "number_in_inventory",
      "inventory",
      "current_stock",
    ]),
    reorder: pickNumber(row, ["reorder_level", "min_stock"]),
    velocity: 0,
    demand: 0,
    demandScore: 0,
    holdingValue: pickNumber(row, ["holding_value", "value", "current_value"]),
    inventoryScore:
      rawInventoryScore > 0 && rawInventoryScore <= 1
        ? rawInventoryScore * 100
        : rawInventoryScore,
    supplierId: "",
    supplierName: "",
    unitPrice: 0,
    costPrice: 0,
    nlpScore: 0,
  };
}

function normalizeScoreValue(value: number) {
  if (value > 1) {
    return value / 100;
  }

  return value;
}

function normalizeProductScoreboardRow(
  row: BackendRow,
): ProductScoreboardRow | null {
  const productId = pickString(row, ["product_id", "id"]);

  if (!productId) {
    return null;
  }

  return {
    productId,
    productName: pickString(row, ["product_name", "name"], productId),
    categoryId: pickString(row, ["category_id"], ""),
    categoryName: pickString(
      row,
      ["category_name", "category"],
      pickString(row, ["category_id"], ""),
    ),
    nlpScore: normalizeScoreValue(pickNumber(row, ["nlp_score"], 0)),
    inventoryScore: normalizeScoreValue(
      pickNumber(row, ["inventory_score"], 0),
    ),
    demandScore: normalizeScoreValue(pickNumber(row, ["demand_score"], 0)),
    latestNlpUpdate: pickString(row, ["latest_nlp_update"], ""),
    latestInventoryUpdate: pickString(row, ["latest_inventory_update"], ""),
    latestDemandUpdate: pickString(row, ["latest_demand_update"], ""),
  };
}

function normalizeCategoryOption(row: BackendRow): InventoryFilterOption | null {
  const categoryId = pickString(row, ["category_id", "id"]);
  const categoryName = pickString(
    row,
    ["category_name", "name", "category"],
    categoryId,
  );

  if (!categoryId && !categoryName) {
    return null;
  }

  return {
    label: categoryName || categoryId,
    value: categoryName || categoryId,
  };
}

function normalizeSupplierOption(row: BackendRow): InventoryFilterOption | null {
  const supplierId = pickString(row, ["supplier_id", "id"]);
  const supplierName = pickString(
    row,
    ["supplier_name", "name", "supplier"],
    supplierId,
  );

  if (!supplierId && !supplierName) {
    return null;
  }

  return {
    label: supplierName || supplierId,
    value: supplierId || supplierName,
  };
}

function sortFilterOptions(options: InventoryFilterOption[]) {
  return [...options].sort((left, right) => left.label.localeCompare(right.label));
}

function getUniqueFilterOptions(options: Array<InventoryFilterOption | null>) {
  const deduplicated = new Map<string, InventoryFilterOption>();

  options.forEach((option) => {
    if (!option || !option.value.trim()) {
      return;
    }

    if (!deduplicated.has(option.value)) {
      deduplicated.set(option.value, {
        label: option.label.trim() || option.value,
        value: option.value,
      });
    }
  });

  return sortFilterOptions(Array.from(deduplicated.values()));
}

function buildOptionLookup(options: InventoryFilterOption[]) {
  return options.reduce<Record<string, string>>((lookup, option) => {
    lookup[option.value] = option.label;
    return lookup;
  }, {});
}

function buildOverviewUrl({
  limit,
  search,
  selectedBrand,
  selectedCategoryFilter,
  sort,
}: Pick<
  InventoryExplorerRequest,
  "limit" | "search" | "selectedBrand" | "selectedCategoryFilter" | "sort"
>) {
  const { sortBy, sortOrder } = getOverviewSortDescriptor(sort);
  const params = new URLSearchParams({
    limit: String(limit),
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (selectedBrand !== DEFAULT_FILTER_VALUE) {
    params.set("brand", selectedBrand);
  }

  if (selectedCategoryFilter !== DEFAULT_FILTER_VALUE) {
    params.set("category", selectedCategoryFilter);
  }

  return `/inventory/analytics/table?${params.toString()}`;
}

export function getPriorityScore(item: StockItem) {
  if (item.inventoryScore > 0) {
    return Math.round(item.inventoryScore);
  }

  const stockPressure =
    item.reorder > 0
      ? Math.max(0, (item.reorder - item.stock) / item.reorder)
      : item.stock === 0
        ? 1
        : 0;

  return Math.min(100, Math.round(stockPressure * 100));
}

export function getValueInHold(item: StockItem) {
  return item.holdingValue;
}

export function formatCurrency(value: number) {
  return formatCurrencyTHB(value);
}

export function getPriorityClasses(score: number) {
  if (score >= 70) {
    return "bg-red-50 text-red-700";
  }

  if (score >= 40) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-emerald-50 text-emerald-700";
}

export function getExplorerBaseUrl() {
  return getBackendBaseUrl();
}

export function getPageFilterOptions(items: StockItem[]) {
  return {
    brands: Array.from(
      new Set(items.map((item) => item.brand).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right)),
    categories: Array.from(
      new Set(items.map((item) => item.categoryName).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right)),
  };
}

export function buildStockItemRowKeys(items: StockItem[]) {
  const occurrences = new Map<string, number>();

  return items.map((item) => {
    const baseKey = [
      item.product_id || "product",
      item.product_name || "unknown",
      item.brand || "brand",
      item.categoryName || item.categoryId || "category",
    ].join("::");
    const occurrence = occurrences.get(baseKey) ?? 0;

    occurrences.set(baseKey, occurrence + 1);

    return occurrence === 0 ? baseKey : `${baseKey}::${occurrence}`;
  });
}

export async function fetchProductExplorerReferenceData(
  signal?: AbortSignal,
): Promise<ProductExplorerReferenceData> {
  const [brandResult, categoryResult, supplierResult] = await Promise.all([
    fetchBackendQuery({
      tableName: "Product",
      groupBy: "brand",
      selectColumns: ["brand"],
      limit: 1000,
      signal,
    }),
    fetchAllBackendTableRows("Category", { signal }),
    fetchAllBackendTableRows("Supplier", { signal }),
  ]);
  const referenceError =
    brandResult.error || categoryResult.error || supplierResult.error || null;
  const hasSourceData =
    brandResult.rows.length > 0 ||
    categoryResult.rows.length > 0 ||
    supplierResult.rows.length > 0;

  if (referenceError && !hasSourceData) {
    throw new Error(referenceError);
  }

  const categoryDirectory = getUniqueFilterOptions(
    categoryResult.rows.map((row) => normalizeCategoryOption(row)),
  );
  const categoryNameById = categoryResult.rows.reduce<Record<string, string>>(
    (lookup, row) => {
      const categoryId = pickString(row, ["category_id", "id"]);
      const categoryName = pickString(
        row,
        ["category_name", "name", "category"],
        categoryId,
      );

      if (categoryId && categoryName) {
        lookup[categoryId] = categoryName;
      }

      return lookup;
    },
    {},
  );
  const supplierDirectory = getUniqueFilterOptions(
    supplierResult.rows.map((row) => normalizeSupplierOption(row)),
  );
  const supplierNameById = buildOptionLookup(supplierDirectory);
  const brands = Array.from(
    new Set(
      brandResult.rows
        .map((row) => pickString(row, ["brand"], ""))
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));
  const categories =
    categoryDirectory.length > 0
      ? categoryDirectory
      : getUniqueFilterOptions(
          categoryResult.rows.map((row) => normalizeCategoryOption(row)),
        );

  return {
    brands,
    categories,
    categoryNameById,
    referenceError,
    supplierNameById,
  };
}

export async function fetchProductScoreboard(
  {
    limit = 500,
    signal,
  }: {
    limit?: number;
    signal?: AbortSignal;
  } = {},
): Promise<ProductScoreboardData> {
  const result = await fetchBackendJson(
    `/insights/products/scoreboard?limit=${limit}`,
    signal,
  );

  if (result.error || !result.data) {
    throw new Error(result.error ?? "Unable to load product scores.");
  }

  const payload =
    result.data && typeof result.data === "object" && !Array.isArray(result.data)
      ? (result.data as BackendRow)
      : {};
  const rows = normalizeRows(result.data)
    .map((row) => normalizeProductScoreboardRow(row))
    .filter((row): row is ProductScoreboardRow => Boolean(row));

  return {
    itemCount: pickNumber(payload, ["item_count", "count", "total"], rows.length),
    rows,
    byProductId: rows.reduce<Record<string, ProductScoreboardRow>>(
      (lookup, row) => {
        lookup[row.productId] = row;
        return lookup;
      },
      {},
    ),
  };
}

export async function fetchOverviewInventoryExplorerPage(
  request: InventoryExplorerRequest,
): Promise<ExplorerPageResult> {
  const {
    limit,
    search,
    selectedBrand,
    selectedCategoryFilter,
    signal,
    sort,
  } = request;

  const result = await fetchBackendJson(
    buildOverviewUrl({
      limit,
      search,
      selectedBrand,
      selectedCategoryFilter,
      sort,
    }),
    signal,
  );

  if (result.error) {
    return {
      items: [],
      hasNextPage: false,
      error: result.error,
      limit,
      page: 1,
    };
  }

  const rows = normalizeRows(result.data)
    .map((row) => normalizeOverviewRow(row))
    .filter((row): row is StockItem => Boolean(row));

  return {
    items: rows,
    hasNextPage: false,
    error: null,
    limit,
    page: 1,
  };
}

export async function fetchProductExplorerPage({
  limit,
  page,
  search,
  selectedBrand,
  selectedCategoryFilter,
  sort,
  signal,
}: InventoryExplorerRequest): Promise<ExplorerPageResult> {
  const { sortBy, sortOrder } = getProductSortDescriptor(sort);
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (selectedBrand !== DEFAULT_FILTER_VALUE) {
    params.set("brand", selectedBrand);
  }

  if (selectedCategoryFilter !== DEFAULT_FILTER_VALUE) {
    params.set("category", selectedCategoryFilter);
  }

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (sortBy) {
    params.set("sort_by", sortBy);
    params.set("sort_order", sortOrder);
  }

  let response: Response;

  try {
    response = await fetch(
      getBackendRequestUrl(`/products/catalog?${params.toString()}`),
      {
        cache: "no-store",
        signal,
      },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        items: [],
        hasNextPage: false,
        error: "Request aborted.",
        limit,
        page,
      };
    }

    return {
      items: [],
      hasNextPage: false,
      error: "Unable to reach backend data service.",
      limit,
      page,
    };
  }

  if (!response.ok) {
    return {
      items: [],
      hasNextPage: false,
      error: `API error ${response.status}`,
      limit,
      page,
    };
  }

  const payload = (await response.json()) as unknown;
  const payloadRecord =
    payload && typeof payload === "object" ? (payload as BackendRow) : {};
  const rows = normalizeRows(payload)
    .map((row) => normalizeProductExplorerRow(row))
    .filter((row): row is StockItem => Boolean(row));

  return {
    items: rows,
    hasNextPage:
      typeof payloadRecord.hasNext === "boolean"
        ? payloadRecord.hasNext
        : rows.length === limit,
    error: null,
    limit: pickNumber(payloadRecord, ["limit"], limit) || limit,
    page: pickNumber(payloadRecord, ["page"], page) || page,
  };
}

"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import { SalesPageHeader } from "@/features/sales/components/SalesPageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrencyTHB } from "@/lib/formatters/currency";
import {
  fetchProductExplorerPage,
  fetchProductExplorerReferenceData,
  PRODUCT_EXPLORER_REFERENCE_QUERY_KEY,
  type InventoryFilterOption,
  type StockItem,
} from "@/features/inventory/services/inventoryExplorerApi";
import {
  fetchProductSalesAnalytics,
  type ProductSalesAnalytics,
} from "@/features/sales/services/salesProductAnalyticsApi";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

const DEFAULT_FILTER_VALUE = "All";
const PRODUCT_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 250;

type ProductCatalogItem = {
  id: string;
  name: string;
  category: string;
  brand: string;
  unitPrice: number;
  costPrice: number;
};

function formatCurrency(value: number) {
  return formatCurrencyTHB(value);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatMarginFromValues(revenue: number, profit: number | null) {
  if (profit === null || revenue <= 0) {
    return "-";
  }

  return `${((profit / revenue) * 100).toFixed(1)}%`;
}

function mergeSelectedOption(
  options: InventoryFilterOption[],
  selectedValue: string,
) {
  if (
    selectedValue !== DEFAULT_FILTER_VALUE &&
    selectedValue &&
    !options.some((option) => option.value === selectedValue)
  ) {
    return [
      {
        label: selectedValue,
        value: selectedValue,
      },
      ...options,
    ];
  }

  return options;
}

function buildProductCatalogItems(
  items: StockItem[],
  categoryNameById: Record<string, string>,
): ProductCatalogItem[] {
  return items.map((item) => ({
    id: item.product_id,
    name: item.product_name,
    brand: item.brand || "Unbranded",
    category:
      categoryNameById[item.categoryId] ||
      item.categoryName ||
      item.categoryId ||
      "Uncategorized",
    unitPrice: item.unitPrice,
    costPrice: item.costPrice,
  }));
}

export default function ProductPerformancePage() {
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(DEFAULT_FILTER_VALUE);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_FILTER_VALUE);
  const [page, setPage] = useState(1);
  const [preferredProductId, setPreferredProductId] = useState<string | null>(
    null,
  );
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const timeframe = "month" as const;
  const activeGranularity = "day" as const;

  const referenceQuery = useQuery({
    queryKey: PRODUCT_EXPLORER_REFERENCE_QUERY_KEY,
    queryFn: ({ signal }) => fetchProductExplorerReferenceData(signal),
  });

  const catalogQuery = useQuery({
    queryKey: [
      "sales-product-analytics",
      "catalog",
      {
        brand: selectedBrand,
        category: selectedCategory,
        page,
        search: debouncedSearch,
      },
    ],
    queryFn: ({ signal }) =>
      fetchProductExplorerPage({
        limit: PRODUCT_PAGE_SIZE,
        page,
        search: debouncedSearch,
        selectedBrand,
        selectedCategoryFilter: selectedCategory,
        sort: "product-asc",
        signal,
    }),
    placeholderData: keepPreviousData,
  });

  const catalogItems = useMemo(
    () =>
      buildProductCatalogItems(
        catalogQuery.data?.items ?? [],
        referenceQuery.data?.categoryNameById ?? {},
      ),
    [catalogQuery.data?.items, referenceQuery.data?.categoryNameById],
  );

  const selectedProductId = useMemo(() => {
    if (catalogItems.length === 0) {
      return null;
    }

    if (
      preferredProductId &&
      catalogItems.some((product) => product.id === preferredProductId)
    ) {
      return preferredProductId;
    }

    return catalogItems[0].id;
  }, [catalogItems, preferredProductId]);

  const selectedProduct = useMemo(
    () =>
      catalogItems.find((product) => product.id === selectedProductId) ?? null,
    [catalogItems, selectedProductId],
  );

  const analyticsQuery = useQuery({
    queryKey: [
      "sales-product-analytics",
      "detail",
      selectedProductId,
      timeframe,
      activeGranularity,
    ],
    queryFn: ({ signal }) =>
      fetchProductSalesAnalytics(
        {
          productId: selectedProductId || "",
          timeframe,
          granularity: activeGranularity,
        },
        signal,
      ),
    enabled: Boolean(selectedProductId),
  });

  const analytics: ProductSalesAnalytics | null = analyticsQuery.data ?? null;
  const coreProductMetrics = useMemo(() => {
    if (!selectedProduct || !analytics) {
      return [];
    }

    const { kpiSummary } = analytics;

    return [
      {
        label: "Revenue",
        value: formatCurrency(kpiSummary.revenue),
      },
      {
        label: "Units Sold",
        value: formatCount(kpiSummary.quantity),
      },
      {
        label: "ASP",
        value: formatCurrency(kpiSummary.averageUnitPrice),
      },
      {
        label: "Cost Price",
        value: formatCurrency(selectedProduct.costPrice),
      },
      {
        label: "Profit",
        value:
          kpiSummary.profit !== null ? formatCurrency(kpiSummary.profit) : "-",
      },
      {
        label: "Margin %",
        value: formatMarginFromValues(kpiSummary.revenue, kpiSummary.profit),
      },
    ] as const;
  }, [analytics, selectedProduct]);

  const brandOptions = useMemo(() => {
    const options =
      referenceQuery.data?.brands.map((option) => ({
        label: option,
        value: option,
      })) ?? [];

    return [
      {
        label: DEFAULT_FILTER_VALUE,
        value: DEFAULT_FILTER_VALUE,
      },
      ...mergeSelectedOption(options, selectedBrand),
    ];
  }, [referenceQuery.data?.brands, selectedBrand]);
  const categoryOptions = useMemo(() => {
    const options = referenceQuery.data?.categories ?? [];

    return [
      {
        label: DEFAULT_FILTER_VALUE,
        value: DEFAULT_FILTER_VALUE,
      },
      ...mergeSelectedOption(options, selectedCategory),
    ];
  }, [referenceQuery.data?.categories, selectedCategory]);

  const visibleContextInput = useMemo(
    () => ({
      page: "sales-products",
      title: "Product Sales Analytics",
      filters: {
        search: debouncedSearch,
        brand: selectedBrand,
        category: selectedCategory,
        catalogPage: page,
        timeframe,
        granularity: activeGranularity,
      },
      visibleKpis: analytics
        ? {
            Revenue: formatCurrency(analytics.kpiSummary.revenue),
            "Units Sold": formatCount(analytics.kpiSummary.quantity),
            ASP: formatCurrency(analytics.kpiSummary.averageUnitPrice),
            "Cost Price": formatCurrency(selectedProduct?.costPrice ?? 0),
            ...(analytics.kpiSummary.profit !== null
              ? { Profit: formatCurrency(analytics.kpiSummary.profit) }
              : {}),
            "Margin %": formatMarginFromValues(
              analytics.kpiSummary.revenue,
              analytics.kpiSummary.profit,
            ),
          }
        : {},
      visibleTables: [
        ...(catalogItems.length
          ? [
              {
                name: "Product Catalog",
                columns: [
                  "Product ID",
                  "Product",
                  "Category",
                  "Brand",
                  "Unit Price",
                ],
                rows: catalogItems.map((product) => ({
                  productId: product.id,
                  product: product.name,
                  category: product.category,
                  brand: product.brand,
                  unitPrice: product.unitPrice,
                })),
              },
            ]
          : []),
      ],
      visibleCharts: [],
      selectedEntity: selectedProduct
        ? {
            type: "product",
            id: selectedProduct.id,
            label: selectedProduct.name,
          }
        : undefined,
    }),
    [
      analytics,
      activeGranularity,
      catalogItems,
      debouncedSearch,
      page,
      selectedBrand,
      selectedCategory,
      selectedProduct,
      timeframe,
    ],
  );
  useRegisterAIVisibleContext("sales-products-main", visibleContextInput);

  return (
    <div className="space-y-6">
      <SalesPageHeader />

      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        
        <CardContent className="pt-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search product, category, or brand"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-500"
              />
            </label>

            <select
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-500"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={selectedBrand}
              onChange={(event) => {
                setSelectedBrand(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-500"
            >
              {brandOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {referenceQuery.error instanceof Error ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Product filters are partially unavailable. Showing catalog results without full reference data.
            </div>
          ) : null}

          {catalogQuery.isPending ? (
            <div className="mt-4 h-80 rounded-2xl border border-slate-200 bg-slate-50 animate-pulse dark:border-slate-800 dark:bg-slate-900" />
          ) : catalogQuery.error instanceof Error ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Product catalog unavailable</p>
              <p className="mt-2">
                The sales backend is currently unavailable. Try again once the service is back online.
              </p>
            </div>
          ) : catalogItems.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-500">
              No products matched the current filters.
            </div>
          ) : (
            <>
              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)] xl:items-start">
                <div>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                          <tr className="border-b border-slate-200 dark:border-slate-800">
                            <th className="px-4 py-3 font-semibold">Product</th>
                            <th className="px-4 py-3 font-semibold">Category</th>
                            <th className="px-4 py-3 font-semibold">Brand</th>
                            <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                            <th className="px-4 py-3 text-right font-semibold">Cost Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
                          {catalogItems.map((product) => (
                            <tr
                              key={product.id}
                              onClick={() => setPreferredProductId(product.id)}
                              className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 ${
                                selectedProductId === product.id
                                  ? "bg-slate-100 dark:bg-slate-800/80"
                                  : ""
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                  {product.name}
                                </div>
                                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {product.id}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                {product.category}
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                {product.brand}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                                {formatCurrency(product.unitPrice)}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                                {formatCurrency(product.costPrice)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    <span>
                      Page {catalogQuery.data?.page ?? page}
                      {catalogQuery.isFetching && !catalogQuery.isPending ? " - updating..." : ""}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        disabled={page <= 1 || catalogQuery.isFetching}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((current) => current + 1)}
                        disabled={!catalogQuery.data?.hasNextPage || catalogQuery.isFetching}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <aside className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-4 dark:border-slate-800 dark:bg-[linear-gradient(180deg,#0f172a_0%,#020617_100%)]">
                  <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      Core Metrics
                    </p>
                    <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      Real product performance
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Revenue, volume, pricing, and margin for the selected product.
                    </p>
                  </div>

                  {!selectedProduct ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                      Select a product from the table to view core metrics.
                    </div>
                  ) : analyticsQuery.isPending ? (
                    <div className="mt-4 space-y-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-[72px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
                        />
                      ))}
                    </div>
                  ) : analyticsQuery.error instanceof Error || !analytics ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      Core product metrics are unavailable for the current selection.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {selectedProduct.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {selectedProduct.id} / {selectedProduct.category} / {selectedProduct.brand}
                        </p>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                        <dl className="divide-y divide-slate-200 dark:divide-slate-800">
                          {coreProductMetrics.map((metric) => (
                            <div
                              key={metric.label}
                              className="flex items-center justify-between gap-4 px-4 py-3"
                            >
                              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                {metric.label}
                              </dt>
                              <dd className="text-right text-base font-semibold text-slate-900 dark:text-slate-100">
                                {metric.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

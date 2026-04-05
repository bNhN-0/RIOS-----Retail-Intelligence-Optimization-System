"use client";

import { useMemo } from "react";

import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import { Link } from "@/i18n/navigation";
import {
  buildStockItemRowKeys,
  formatCurrency,
  type StockItem,
} from "@/features/inventory/services/inventoryExplorerApi";
import { useProductExplorerModel } from "@/features/inventory/hooks/useProductExplorerModel";

function buildCreatePurchaseOrderHref(item: StockItem) {
  const params = new URLSearchParams({
    product: item.product_name,
    product_id: item.product_id,
    qty: "1",
    supplier_id: item.supplierId,
  });

  return `/inventory/replenishment?${params.toString()}`;
}

function normalizeScoreValue(value: number) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return value > 1 ? value / 100 : value;
}

function formatScore(value: number) {
  const normalized = normalizeScoreValue(value);

  if (normalized === null) {
    return "-";
  }

  return normalized.toFixed(4);
}

function getScoreToneClass(value: number) {
  const normalized = normalizeScoreValue(value) ?? 0;

  if (normalized >= 0.7) {
    return "text-red-700 dark:text-red-300";
  }

  if (normalized >= 0.35) {
    return "text-amber-700 dark:text-amber-300";
  }

  return "text-emerald-700 dark:text-emerald-300";
}

export default function InventoryExplorerContent() {
  const {
    baseUrl,
    backgroundError,
    brandOptions,
    categoryOptionLabels,
    categoryOptions,
    displayPage,
    fetchError,
    hasNextPage,
    hasPrevPage,
    isFetchingPage,
    isTransitioningPage,
    items,
    loading,
    page,
    pageSize,
    search,
    selectedBrand,
    selectedCategoryFilter,
    selectedProduct,
    scoreError,
    setPage,
    setSearch,
    setSelectedBrand,
    setSelectedCategoryFilter,
    setSort,
    sort,
    sortOptions,
  } = useProductExplorerModel();
  const rangeStart = items.length === 0 ? 0 : (displayPage - 1) * pageSize + 1;
  const rangeEnd = items.length === 0 ? 0 : (displayPage - 1) * pageSize + items.length;
  const purchaseOrderReadyCount = items.filter((item) => Boolean(item.supplierId)).length;
  const productsWithScores = items.filter(
    (item) =>
      item.nlpScore > 0 || item.inventoryScore > 0 || item.demandScore > 0,
  ).length;
  const rowKeys = useMemo(() => buildStockItemRowKeys(items), [items]);
  const visibleBrandCount = new Set(
    items.map((item) => item.brand).filter((brand) => Boolean(brand)),
  ).size;
  const visibleContextInput = useMemo(
    () => ({
      page: "inventory-explorer",
      title: "Inventory Product Explorer",
      filters: {
        search,
        brand: selectedBrand,
        category: selectedCategoryFilter,
        sort,
        page: displayPage,
      },
      visibleKpis: {
        "Visible Products": items.length,
        "Purchase Order Ready": purchaseOrderReadyCount,
        "Visible Brands": visibleBrandCount,
        "Page Range": `${rangeStart}-${rangeEnd}`,
        "Products With Scores": productsWithScores,
      },
      visibleTables: [
        {
          name: "Product Explorer",
          columns: [
            "Product Name",
            "Brand",
            "Category Name",
            "Supplier Name",
            "NLP Score",
            "Inventory Score",
            "Demand Score",
            "Unit Price",
            "Cost Price",
            "Order Action",
          ],
          rows: items.map((item) => ({
            productName: item.product_name,
            productId: item.product_id,
            brand: item.brand,
            categoryName: item.categoryName,
            supplierName: item.supplierName || item.supplierId || "Unassigned",
            nlpScore: formatScore(item.nlpScore),
            inventoryScore: formatScore(item.inventoryScore),
            demandScore: formatScore(item.demandScore),
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            orderAction: item.supplierId ? "Create PO" : "Unavailable",
          })),
        },
      ],
      selectedEntity: selectedProduct
        ? {
            type: "product",
            id: selectedProduct,
            label:
              items.find((item) => item.product_id === selectedProduct)?.product_name ??
              selectedProduct,
          }
        : undefined,
    }),
    [
      displayPage,
      items,
      purchaseOrderReadyCount,
      productsWithScores,
      rangeEnd,
      rangeStart,
      search,
      selectedBrand,
      selectedCategoryFilter,
      selectedProduct,
      sort,
      visibleBrandCount,
    ],
  );
  useRegisterAIVisibleContext("inventory-explorer-main", visibleContextInput);

  if (loading) {
    return <div className="p-4 text-sm text-slate-600 dark:text-slate-300">Loading inventory...</div>;
  }

  if (fetchError) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-200">
        <p className="font-semibold">Inventory data service unavailable</p>
        <p className="mt-2">
          Start the backend at <code>{baseUrl}</code> or set <code>NEXT_PUBLIC_API_BASE_URL</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {backgroundError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-200">
          Showing cached inventory data while the latest refresh failed.
        </div>
      ) : null}

      {scoreError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-200">
          Product scores are temporarily unavailable. Score columns will show fallback values until the scoreboard endpoint recovers.
        </div>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Product Explorer</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Search products, review supplier coverage, compare NLP, inventory, and demand scores, and jump into purchase-order flow.
        </p>
      </div>

      {!selectedProduct && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <input
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
          />

          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={selectedBrand}
              onChange={(event) => setSelectedBrand(event.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500"
            >
              {brandOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={selectedCategoryFilter}
              onChange={(event) => setSelectedCategoryFilter(event.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {categoryOptionLabels[option] ?? option}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <table className="min-w-[1420px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2.5 text-left">Product Name</th>
              <th className="px-3 py-2.5 text-left">Brand</th>
              <th className="px-3 py-2.5 text-left">Category Name</th>
              <th className="px-3 py-2.5 text-left">Supplier Name</th>
              <th className="px-3 py-2.5 text-center">NLP Score</th>
              <th className="px-3 py-2.5 text-center">Inventory Score</th>
              <th className="px-3 py-2.5 text-center">Demand Score</th>
              <th className="px-3 py-2.5 text-center">Unit Price</th>
              <th className="px-3 py-2.5 text-center">Cost Price</th>
              <th className="w-36 px-3 py-2.5 text-center">Order Action</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                  No products found on this page.
                </td>
              </tr>
            ) : items.map((item, index) => {
              const isSelected = selectedProduct === item.product_id;
              const canCreatePurchaseOrder = Boolean(item.supplierId);

              return (
                <tr
                  key={rowKeys[index]}
                  className={`border-t border-slate-200 dark:border-slate-800 ${
                    isSelected
                      ? "bg-sky-50 dark:bg-sky-950/30"
                      : "transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/70"
                  }`}
                >
                  <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                    {item.product_name}
                  </td>

                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                    {item.brand}
                  </td>

                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                    {item.categoryName}
                  </td>

                  <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                    {item.supplierName || item.supplierId || "Unassigned"}
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-semibold tabular-nums ${getScoreToneClass(item.nlpScore)}`}>
                      {formatScore(item.nlpScore)}
                    </span>
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-semibold tabular-nums ${getScoreToneClass(item.inventoryScore)}`}>
                      {formatScore(item.inventoryScore)}
                    </span>
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-semibold tabular-nums ${getScoreToneClass(item.demandScore)}`}>
                      {formatScore(item.demandScore)}
                    </span>
                  </td>

                  <td className="px-3 py-2.5 text-center text-slate-700 dark:text-slate-300">
                    {formatCurrency(item.unitPrice)}
                  </td>

                  <td className="px-3 py-2.5 text-center text-slate-700 dark:text-slate-300">
                    {formatCurrency(item.costPrice)}
                  </td>

                  <td className="w-36 px-3 py-2.5 text-center">
                    {canCreatePurchaseOrder ? (
                      <Link
                        href={buildCreatePurchaseOrderHref(item)}
                        prefetch={false}
                        className="inline-flex min-w-24 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                      >
                        Create PO
                      </Link>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Unavailable
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        <span>
          {isTransitioningPage
            ? `Showing cached page ${displayPage} while page ${page} loads`
            : `Showing ${rangeStart}-${rangeEnd} on page ${displayPage}`}
        </span>

        <div className="flex items-center gap-2.5">
          {isFetchingPage ? (
            <span className="text-xs text-slate-400 dark:text-slate-500">Updating...</span>
          ) : null}

          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!hasPrevPage || isTransitioningPage}
            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            &lt;
          </button>

          <span className="text-slate-700 dark:text-slate-200">
            Page {displayPage}
          </span>

          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!hasNextPage || isTransitioningPage}
            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}

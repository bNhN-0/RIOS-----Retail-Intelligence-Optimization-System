"use client";

import { useMemo } from "react";

import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import {
  buildStockItemRowKeys,
  formatCurrency,
  getPriorityClasses,
  getPriorityScore,
  getValueInHold,
} from "@/features/inventory/services/inventoryExplorerApi";
import { useOverviewInventoryExplorerModel } from "@/features/inventory/hooks/useOverviewInventoryExplorerModel";

export function OverviewInventoryExplorerContent() {
  const {
    backgroundError,
    brandOptions,
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
    setPage,
    setSearch,
    setSelectedBrand,
    setSelectedCategoryFilter,
    setSort,
    sort,
    sortOptions,
    baseUrl,
  } = useOverviewInventoryExplorerModel();
  const rangeStart = items.length === 0 ? 0 : (displayPage - 1) * pageSize + 1;
  const rangeEnd = items.length === 0 ? 0 : (displayPage - 1) * pageSize + items.length;
  const rowKeys = useMemo(() => buildStockItemRowKeys(items), [items]);
  const visibleContextInput = useMemo(
    () => ({
      filters: {
        search,
        brand: selectedBrand,
        category: selectedCategoryFilter,
        sort,
        page: displayPage,
      },
      visibleTables: [
        {
          name: "Overview Inventory Explorer",
          columns: ["Product", "Stock", "Value in Hold", "Inventory Score"],
          rows: items.map((item) => {
            const priorityScore = getPriorityScore(item);

            return {
              product: item.product_name,
              productId: item.product_id,
              stock: item.stock,
              valueInHold: getValueInHold(item),
              inventoryScore: priorityScore,
            };
          }),
        },
      ],
      selectedEntity: selectedProduct
        ? {
            type: "product",
            id: selectedProduct,
            label: selectedProduct,
          }
        : undefined,
    }),
    [displayPage, items, search, selectedBrand, selectedCategoryFilter, selectedProduct, sort],
  );
  useRegisterAIVisibleContext(
    "inventory-overview-explorer-table",
    visibleContextInput,
  );

  if (loading) {
    return <div className="p-4 text-sm">Loading inventory...</div>;
  }

  if (fetchError) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
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
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Showing cached inventory data while the latest refresh failed.
        </div>
      ) : null}

      {!selectedProduct && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm sm:w-56"
          />

          <select
            value={selectedBrand}
            onChange={(event) => setSelectedBrand(event.target.value)}
            className="rounded-md border px-3 py-2 text-sm text-gray-700"
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
            className="rounded-md border px-3 py-2 text-sm text-gray-700"
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="rounded-md border px-3 py-2 text-sm text-gray-700"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                Sort: {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-[640px] w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2.5 text-left">Product</th>
              <th className="px-3 py-2.5 text-center">Stock</th>
              <th className="px-3 py-2.5 text-center">Value in Hold</th>
              <th className="px-3 py-2.5 text-center">Inventory Score</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                  No products found on this page.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const priorityScore = getPriorityScore(item);
                const valueInHold = getValueInHold(item);
                const isSelected = selectedProduct === item.product_id;

                return (
                  <tr
                    key={rowKeys[index]}
                    className={`border-t ${
                      isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-3 py-2.5 font-medium">
                      {item.product_name}
                      <div className="text-xs text-gray-400">
                        ID: {item.product_id}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-center">
                      {item.stock}
                    </td>

                    <td className="px-3 py-2.5 text-center">
                      {formatCurrency(valueInHold)}
                    </td>

                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityClasses(
                          priorityScore,
                        )}`}
                      >
                        {priorityScore}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-600">
        <span>
          {isTransitioningPage
            ? `Showing cached page ${displayPage} while page ${page} loads`
            : `Showing ${rangeStart}-${rangeEnd} on page ${displayPage}`}
        </span>

        <div className="flex items-center gap-2.5">
          {isFetchingPage ? (
            <span className="text-xs text-slate-400">Updating...</span>
          ) : null}

          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!hasPrevPage || isTransitioningPage}
            className="rounded-md border px-2.5 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            &lt;
          </button>

          <span>
            Page {displayPage}
          </span>

          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!hasNextPage || isTransitioningPage}
            className="rounded-md border px-2.5 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}

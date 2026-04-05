"use client";

import { useMemo } from "react";

import { usePaginatedInventoryExplorer } from "@/features/inventory/hooks/usePaginatedInventoryExplorer";
import { useInventoryAnalyticsData } from "@/features/inventory/services/inventoryDashboardApi";

const sortOptions = [
  { label: "Product Name", value: "product-asc" },
  { label: "Low Stock First", value: "stock-asc" },
  { label: "Highest Inventory Score", value: "inventory-desc" },
  { label: "Highest Holding Value", value: "holding-desc" },
] as const;

export function useOverviewInventoryExplorerModel() {
  const { charts } = useInventoryAnalyticsData();
  const inventoryExplorer = usePaginatedInventoryExplorer({
    applyClientView: (pageData, state) => {
      return {
        ...pageData,
        items: state.selectedProduct
          ? pageData.items.filter((item) => item.product_id === state.selectedProduct)
          : pageData.items,
      };
    },
    defaultSort: "product-asc",
    explorerType: "overview",
    filterMode: {
      brand: "client",
      category: "client",
    },
    sortOptions: [...sortOptions],
    supportsPagination: false,
  });
  const brandOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        charts.brand
          .map((datum) => datum.name.trim())
          .filter(Boolean),
      ),
    ).sort((left, right) => left.localeCompare(right));

    if (
      inventoryExplorer.selectedBrand !== "All" &&
      !options.includes(inventoryExplorer.selectedBrand)
    ) {
      options.unshift(inventoryExplorer.selectedBrand);
    }

    return options.length > 0
      ? ["All", ...options]
      : inventoryExplorer.brandOptions;
  }, [charts.brand, inventoryExplorer.brandOptions, inventoryExplorer.selectedBrand]);
  const categoryOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        charts.category
          .map((datum) => datum.name.trim())
          .filter(Boolean),
      ),
    ).sort((left, right) => left.localeCompare(right));

    if (
      inventoryExplorer.selectedCategoryFilter !== "All" &&
      !options.includes(inventoryExplorer.selectedCategoryFilter)
    ) {
      options.unshift(inventoryExplorer.selectedCategoryFilter);
    }

    return options.length > 0
      ? ["All", ...options]
      : inventoryExplorer.categoryOptions;
  }, [
    charts.category,
    inventoryExplorer.categoryOptions,
    inventoryExplorer.selectedCategoryFilter,
  ]);

  return {
    ...inventoryExplorer,
    brandOptions,
    categoryOptions,
  };
}

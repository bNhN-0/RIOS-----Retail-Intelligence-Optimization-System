"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  fetchProductExplorerReferenceData,
  fetchProductScoreboard,
  PRODUCT_EXPLORER_REFERENCE_QUERY_KEY,
  PRODUCT_SCOREBOARD_QUERY_KEY,
} from "@/features/inventory/services/inventoryExplorerApi";
import { usePaginatedInventoryExplorer } from "@/features/inventory/hooks/usePaginatedInventoryExplorer";

const sortOptions = [
  { label: "Product", value: "product-asc" },
  { label: "Brand", value: "brand-asc" },
  { label: "Category", value: "category-asc" },
  { label: "Highest Unit Price", value: "unit-price-desc" },
  { label: "Highest Cost Price", value: "cost-price-desc" },
] as const;
const DEFAULT_FILTER_VALUE = "All";

function mergeSelectedOption(options: string[], selectedValue: string) {
  if (
    selectedValue !== DEFAULT_FILTER_VALUE &&
    selectedValue &&
    !options.includes(selectedValue)
  ) {
    return [selectedValue, ...options];
  }

  return options;
}

export function useProductExplorerModel() {
  const inventoryExplorer = usePaginatedInventoryExplorer({
    defaultSort: "product-asc",
    explorerType: "product",
    sortOptions: [...sortOptions],
  });
  const referenceQuery = useQuery({
    queryKey: PRODUCT_EXPLORER_REFERENCE_QUERY_KEY,
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchProductExplorerReferenceData(signal),
  });
  const scoreboardQuery = useQuery({
    queryKey: PRODUCT_SCOREBOARD_QUERY_KEY,
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchProductScoreboard({ limit: 500, signal }),
  });
  const referenceData = referenceQuery.data;
  const scoreData = scoreboardQuery.data;
  const referenceQueryError =
    referenceQuery.error instanceof Error ? referenceQuery.error.message : null;
  const scoreboardQueryError =
    scoreboardQuery.error instanceof Error ? scoreboardQuery.error.message : null;
  const brandOptions = useMemo(() => {
    const options = referenceData?.brands ?? [];

    if (options.length === 0) {
      return inventoryExplorer.brandOptions;
    }

    return [
      DEFAULT_FILTER_VALUE,
      ...mergeSelectedOption(options, inventoryExplorer.selectedBrand),
    ];
  }, [
    inventoryExplorer.brandOptions,
    inventoryExplorer.selectedBrand,
    referenceData?.brands,
  ]);
  const categoryOptions = useMemo(() => {
    const options = referenceData?.categories.map((option) => option.value) ?? [];

    if (options.length === 0) {
      return inventoryExplorer.categoryOptions;
    }

    return [
      DEFAULT_FILTER_VALUE,
      ...mergeSelectedOption(
        options,
        inventoryExplorer.selectedCategoryFilter,
      ),
    ];
  }, [
    inventoryExplorer.categoryOptions,
    inventoryExplorer.selectedCategoryFilter,
    referenceData?.categories,
  ]);
  const categoryOptionLabels = useMemo(() => {
    const labels: Record<string, string> = {
      [DEFAULT_FILTER_VALUE]: DEFAULT_FILTER_VALUE,
    };

    referenceData?.categories.forEach((option) => {
      labels[option.value] = option.label;
    });

    categoryOptions.forEach((option) => {
      if (!labels[option]) {
        labels[option] = option;
      }
    });

    return labels;
  }, [categoryOptions, referenceData?.categories]);
  const items = useMemo(() => {
    return inventoryExplorer.items.map((item) => ({
      ...item,
      categoryId:
        scoreData?.byProductId[item.product_id]?.categoryId || item.categoryId,
      categoryName:
        referenceData?.categoryNameById[item.categoryId] ||
        scoreData?.byProductId[item.product_id]?.categoryName ||
        item.categoryName ||
        item.categoryId,
      supplierName:
        referenceData?.supplierNameById[item.supplierId] ||
        item.supplierName ||
        item.supplierId,
      inventoryScore:
        scoreData?.byProductId[item.product_id]?.inventoryScore ??
        item.inventoryScore,
      demandScore:
        scoreData?.byProductId[item.product_id]?.demandScore ??
        item.demandScore,
      nlpScore:
        scoreData?.byProductId[item.product_id]?.nlpScore ?? item.nlpScore,
    }));
  }, [inventoryExplorer.items, referenceData, scoreData]);

  return {
    ...inventoryExplorer,
    brandOptions,
    categoryOptionLabels,
    categoryOptions,
    items,
    referenceError: referenceData?.referenceError || referenceQueryError,
    scoreError: scoreboardQueryError,
  };
}

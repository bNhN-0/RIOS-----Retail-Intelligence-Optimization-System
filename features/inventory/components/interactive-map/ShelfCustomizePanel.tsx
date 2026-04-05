"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getBackendRequestUrl,
  normalizeRows,
  pickArray,
  pickNumber,
  pickString,
  type BackendRow,
} from "@/lib/api/riosBackend";

type ShelfLayoutItem = {
  currentItem: number;
  maxStock: number;
  minStock: number;
  productId: string;
  productName: string;
};

type ShelfLayoutRow = {
  currentTotalItems: number;
  items: ShelfLayoutItem[];
  productCount: number;
  shelfCapacity: number;
  shelfId: string;
};

type ShelfLayout = {
  availableShelfGroups: string[];
  rows: ShelfLayoutRow[];
  rowCount: number;
  selectedShelfGroup: string;
};

type ShelfItem = {
  maxStock: number;
  minStock: number;
  productId: string;
  productName: string;
  shelfId: string;
  shelfProductId: string;
  totalItems: number;
};

type ShelfDetail = {
  currentTotalItems: number;
  items: ShelfLayoutItem[];
  productCount: number;
  shelfCapacity: number;
  shelfId: string;
};

const EMPTY_LAYOUT: ShelfLayout = {
  availableShelfGroups: [],
  rows: [],
  rowCount: 0,
  selectedShelfGroup: "ALL",
};

function readError(payload: unknown, status: number) {
  if (payload && typeof payload === "object") {
    return (
      pickString(
        payload as BackendRow,
        ["detail", "message", "error"],
        `API error ${status}`,
      ) || `API error ${status}`
    );
  }

  return `API error ${status}`;
}

async function fetchJson(path: string, signal?: AbortSignal) {
  const response = await fetch(getBackendRequestUrl(path), {
    cache: "no-store",
    signal,
  });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    throw new Error(readError(payload, response.status));
  }

  return payload;
}

async function sendJson(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
) {
  const response = await fetch(getBackendRequestUrl(path), {
    method,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    throw new Error(readError(payload, response.status));
  }

  return payload;
}

function normalizeLayoutItem(row: BackendRow): ShelfLayoutItem | null {
  const productId = pickString(row, ["product_id"]);

  if (!productId) {
    return null;
  }

  return {
    currentItem: pickNumber(row, ["current_item", "total_items"]),
    maxStock: pickNumber(row, ["max_stock"]),
    minStock: pickNumber(row, ["min_stock"]),
    productId,
    productName: pickString(row, ["product_name"]),
  };
}

function normalizeShelfLayout(payload: unknown): ShelfLayout {
  const record =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as BackendRow)
      : {};

  const rows = pickArray<BackendRow>(record, ["rows"])
    .map((row) => {
      const shelfId = pickString(row, ["shelf_id"]);

      if (!shelfId) {
        return null;
      }

      return {
        currentTotalItems: pickNumber(row, ["current_total_items"]),
        items: pickArray<BackendRow>(row, ["items"])
          .map(normalizeLayoutItem)
          .filter((item): item is ShelfLayoutItem => Boolean(item)),
        productCount: pickNumber(row, ["product_count"]),
        shelfCapacity: pickNumber(row, ["shelf_capacity"]),
        shelfId,
      } satisfies ShelfLayoutRow;
    })
    .filter((row): row is ShelfLayoutRow => Boolean(row));

  const availableShelfGroups = pickArray<string>(record, [
    "available_shelf_groups",
  ])
    .map((value) => String(value).trim())
    .filter(Boolean);

  return {
    availableShelfGroups,
    rows,
    rowCount: pickNumber(record, ["row_count"], rows.length),
    selectedShelfGroup:
      pickString(record, ["selected_shelf_group"], "ALL") || "ALL",
  };
}

function normalizeShelfProducts(payload: unknown) {
  return normalizeRows<BackendRow>(payload)
    .map((row) => {
      const shelfProductId = pickString(row, ["shelf_product_id", "id"]);
      const shelfId = pickString(row, ["shelf_id"]);
      const productId = pickString(row, ["product_id"]);

      if (!shelfProductId || !shelfId || !productId) {
        return null;
      }

      return {
        maxStock: pickNumber(row, ["max_stock"]),
        minStock: pickNumber(row, ["min_stock"]),
        productId,
        productName: pickString(row, ["product_name", "name"]),
        shelfId,
        shelfProductId,
        totalItems: pickNumber(row, ["total_items", "current_item"]),
      } satisfies ShelfItem;
    })
    .filter((row): row is ShelfItem => Boolean(row));
}

function normalizeShelfDetail(payload: unknown): ShelfDetail | null {
  const record =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as BackendRow)
      : {};
  const shelfId = pickString(record, ["shelf_id"]);

  if (!shelfId) {
    return null;
  }

  return {
    currentTotalItems: pickNumber(record, ["current_total_items"]),
    items: pickArray<BackendRow>(record, ["items"])
      .map(normalizeLayoutItem)
      .filter((item): item is ShelfLayoutItem => Boolean(item)),
    productCount: pickNumber(record, ["product_count"]),
    shelfCapacity: pickNumber(record, ["shelf_capacity"]),
    shelfId,
  };
}

function toGroupValue(value: string) {
  const normalized = value.trim().toUpperCase();
  return normalized || "ALL";
}

export function ShelfCustomizePanel() {
  const [selectedShelfGroup, setSelectedShelfGroup] = useState("ALL");
  const [selectedShelfId, setSelectedShelfId] = useState("");
  const [selectedShelfProductId, setSelectedShelfProductId] = useState("");
  const [productId, setProductId] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [minStock, setMinStock] = useState(0);
  const [maxStock, setMaxStock] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shelfLayoutQuery = useQuery({
    queryKey: ["shelf-customize", "layout", selectedShelfGroup],
    queryFn: ({ signal }: { signal?: AbortSignal }) => {
      const params = new URLSearchParams();

      if (selectedShelfGroup !== "ALL") {
        params.set("shelf_group", selectedShelfGroup);
      }

      const suffix = params.toString();
      const path = suffix ? `/shelf-layout?${suffix}` : "/shelf-layout";

      return fetchJson(path, signal).then(normalizeShelfLayout);
    },
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const layout = shelfLayoutQuery.data ?? EMPTY_LAYOUT;
  const shelfGroups = useMemo(() => {
    const values = layout.availableShelfGroups.length
      ? layout.availableShelfGroups
      : layout.rows
          .map((row) => row.shelfId.charAt(0).toUpperCase())
          .filter(Boolean);

    return ["ALL", ...Array.from(new Set(values))];
  }, [layout.availableShelfGroups, layout.rows]);

  const activeShelfGroup = shelfGroups.includes(selectedShelfGroup)
    ? selectedShelfGroup
    : (shelfGroups[0] ?? "ALL");
  const activeShelfId = layout.rows.some((row) => row.shelfId === selectedShelfId)
    ? selectedShelfId
    : (layout.rows[0]?.shelfId ?? "");

  const shelfDetailQuery = useQuery({
    enabled: Boolean(activeShelfId),
    queryKey: ["shelf-customize", "shelf-detail", activeShelfId],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchJson(`/shelves/${encodeURIComponent(activeShelfId)}`, signal).then(
        normalizeShelfDetail,
      ),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const shelfProductsQuery = useQuery({
    enabled: Boolean(activeShelfId),
    queryKey: ["shelf-customize", "shelf-products", activeShelfId],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchJson(
        `/shelf-products?shelf_id=${encodeURIComponent(activeShelfId)}`,
        signal,
      ).then(normalizeShelfProducts),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const shelfProducts = useMemo(
    () => shelfProductsQuery.data ?? [],
    [shelfProductsQuery.data],
  );
  const activeShelfDetail = shelfDetailQuery.data;
  const editingItem = useMemo(
    () =>
      shelfProducts.find(
        (item) => item.shelfProductId === selectedShelfProductId,
      ) ?? null,
    [selectedShelfProductId, shelfProducts],
  );
  useRegisterAIVisibleContext("inventory-shelf-customize", {
    filters: {
      mode: "customize",
      shelfGroup: activeShelfGroup,
      shelfId: activeShelfId || null,
      editingShelfProductId: selectedShelfProductId || null,
    },
    visibleKpis: {
      "Shelf Rows": layout.rowCount,
      "Visible Shelf Products": shelfProducts.length,
      "Current Shelf Capacity": activeShelfDetail?.shelfCapacity ?? 0,
      "Current Shelf Items": activeShelfDetail?.currentTotalItems ?? 0,
    },
    visibleTables: [
      {
        name: "Shelf Rows",
        columns: ["Shelf ID", "Capacity", "Current Total Items", "Product Count"],
        rows: layout.rows.map((row) => ({
          shelfId: row.shelfId,
          capacity: row.shelfCapacity,
          currentTotalItems: row.currentTotalItems,
          productCount: row.productCount,
        })),
      },
      {
        name: "Editable Shelf Products",
        columns: ["Product", "Product ID", "Current", "Min", "Max"],
        rows: shelfProducts.map((item) => ({
          product: item.productName,
          productId: item.productId,
          current: item.totalItems,
          min: item.minStock,
          max: item.maxStock,
        })),
      },
    ],
    selectedEntity: activeShelfId
      ? {
          type: "shelf-row",
          id: activeShelfId,
          label: activeShelfId,
        }
      : undefined,
    visibleAlerts: [
      ...(message
        ? [
            {
              id: "inventory-shelf-customize-message",
              title: "Shelf update",
              severity: "low",
              message,
            },
          ]
        : []),
      ...(error
        ? [
            {
              id: "inventory-shelf-customize-error",
              title: "Shelf update failed",
              severity: "high",
              message: error,
            },
          ]
        : []),
      ...(shelfLayoutQuery.error instanceof Error
        ? [
            {
              id: "inventory-shelf-layout-error",
              title: "Shelf layout unavailable",
              severity: "medium",
              message: shelfLayoutQuery.error.message,
            },
          ]
        : []),
    ],
  });

  const resetEditor = () => {
    setSelectedShelfProductId("");
    setProductId("");
    setTotalItems(0);
    setMinStock(0);
    setMaxStock(0);
  };

  const refreshShelfData = async () => {
    await Promise.all([
      shelfLayoutQuery.refetch(),
      shelfDetailQuery.refetch(),
      shelfProductsQuery.refetch(),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeShelfId || !productId) {
        throw new Error("Shelf and product are required.");
      }

      if (editingItem) {
        return sendJson(
          `/shelf-products/${encodeURIComponent(editingItem.shelfProductId)}`,
          "PATCH",
          {
            max_stock: maxStock,
            min_stock: minStock,
            total_items: totalItems,
          },
        );
      }

      return sendJson("/shelf-products", "POST", {
        max_stock: maxStock,
        min_stock: minStock,
        product_id: productId,
        shelf_id: activeShelfId,
        total_items: totalItems,
      });
    },
    onSuccess: async () => {
      setError(null);
      setMessage(editingItem ? "Shelf product updated." : "Shelf product created.");
      resetEditor();
      await refreshShelfData();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (shelfProductId: string) =>
      sendJson(
        `/shelf-products/${encodeURIComponent(shelfProductId)}`,
        "DELETE",
      ),
    onSuccess: async () => {
      setError(null);
      setMessage("Shelf product deleted.");
      resetEditor();
      await refreshShelfData();
    },
  });

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Shelf Customization
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage shelf rows by group, edit shelf products, and place items
              from inventory.
            </p>
          </div>

          <label className="w-full max-w-xs space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Shelf Group
            </span>
            <select
              value={activeShelfGroup}
              onChange={(event) =>
                setSelectedShelfGroup(toGroupValue(event.target.value))
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500"
            >
              {shelfGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/35 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="space-y-5">
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Shelf Rows</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {layout.selectedShelfGroup} group, {layout.rowCount} rows
                </p>
              </div>
              {shelfLayoutQuery.isPending ? (
                <span className="text-sm text-slate-500 dark:text-slate-400">Loading...</span>
              ) : null}
            </div>

            {shelfLayoutQuery.error instanceof Error ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-200">
                {shelfLayoutQuery.error.message}
              </div>
            ) : layout.rows.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {layout.rows.map((row) => {
                  const isActive = row.shelfId === activeShelfId;

                  return (
                    <button
                      key={row.shelfId}
                      type="button"
                      onClick={() => {
                        setSelectedShelfId(row.shelfId);
                        resetEditor();
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        isActive
                          ? "border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            {row.shelfId}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            Capacity {row.shelfCapacity} | Current{" "}
                            {row.currentTotalItems}
                          </div>
                        </div>
                        <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                          {row.productCount} products
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {row.items.length > 0 ? (
                          row.items.map((item) => (
                            <div
                              key={`${row.shelfId}-${item.productId}`}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                            >
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {item.productName}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Current {item.currentItem} | Min {item.minStock}{" "}
                                | Max {item.maxStock}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            No products placed on this shelf row.
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No shelf rows were returned for this shelf group.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 space-y-1">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                Selected Shelf Row
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Direct CRUD for products on {activeShelfId || "-"}.
              </p>
            </div>

            {activeShelfId ? (
              <>
                <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 md:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Shelf ID
                    </div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {activeShelfDetail?.shelfId || activeShelfId}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Capacity
                    </div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {activeShelfDetail?.shelfCapacity ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Current Items
                    </div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {activeShelfDetail?.currentTotalItems ?? 0}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr),320px]">
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="min-w-[640px] w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-400">
                        <tr>
                          <th className="px-3 py-2.5 text-left">Product</th>
                          <th className="px-3 py-2.5 text-center">Current</th>
                          <th className="px-3 py-2.5 text-center">Min</th>
                          <th className="px-3 py-2.5 text-center">Max</th>
                          <th className="px-3 py-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shelfProducts.length > 0 ? (
                          shelfProducts.map((item) => (
                            <tr
                              key={item.shelfProductId}
                              className="border-t border-slate-200 bg-white transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900/70"
                            >
                              <td className="px-3 py-2.5">
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                  {item.productName}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {item.productId}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center text-slate-700 dark:text-slate-300">
                                {item.totalItems}
                              </td>
                              <td className="px-3 py-2.5 text-center text-slate-700 dark:text-slate-300">
                                {item.minStock}
                              </td>
                              <td className="px-3 py-2.5 text-center text-slate-700 dark:text-slate-300">
                                {item.maxStock}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <div className="flex justify-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedShelfProductId(
                                        item.shelfProductId,
                                      );
                                      setProductId(item.productId);
                                      setTotalItems(item.totalItems);
                                      setMinStock(item.minStock);
                                      setMaxStock(item.maxStock);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        setError(null);
                                        setMessage(null);
                                        await deleteMutation.mutateAsync(
                                          item.shelfProductId,
                                        );
                                      } catch (mutationError) {
                                        setMessage(null);
                                        setError(
                                          mutationError instanceof Error
                                            ? mutationError.message
                                            : "Unable to delete shelf product.",
                                        );
                                      }
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-3 py-8 text-center text-slate-500 dark:text-slate-400"
                            >
                              No editable shelf products for this row.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="space-y-1">
                      <h5 className="font-semibold text-slate-900 dark:text-slate-100">
                        {editingItem ? "Edit Shelf Product" : "Create Shelf Product"}
                      </h5>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Use direct shelf-product CRUD for the selected row.
                      </p>
                    </div>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Product ID
                      </span>
                      <Input
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                        placeholder="P00001"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Current Stock
                      </span>
                      <Input
                        type="number"
                        value={totalItems}
                        onChange={(event) =>
                          setTotalItems(Number(event.target.value) || 0)
                        }
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Min Stock
                        </span>
                        <Input
                          type="number"
                          value={minStock}
                          onChange={(event) =>
                            setMinStock(Number(event.target.value) || 0)
                          }
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Max Stock
                        </span>
                        <Input
                          type="number"
                          value={maxStock}
                          onChange={(event) =>
                            setMaxStock(Number(event.target.value) || 0)
                          }
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={async () => {
                          try {
                            setError(null);
                            setMessage(null);
                            await saveMutation.mutateAsync();
                          } catch (mutationError) {
                            setMessage(null);
                            setError(
                              mutationError instanceof Error
                                ? mutationError.message
                                : "Unable to save shelf product.",
                            );
                          }
                        }}
                      >
                        {editingItem ? "Update" : "Create"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetEditor}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Select a shelf row to manage its shelf products.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

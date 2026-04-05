"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { useMemo, useState } from "react";

import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import { InventoryPageHeader } from "@/features/inventory/components/InventoryPageHeader";
import {
  getBackendRequestUrl,
  normalizeRows,
  pickArray,
  pickNumber,
  pickString,
  type BackendRow,
} from "@/lib/api/riosBackend";

type ReplenishmentKpis = {
  orderNeed: number;
  urgent: number;
  pendingOrders: number;
};

type SummaryTone = {
  cardClassName: string;
  labelClassName: string;
  valueClassName: string;
};

type ExecutionRow = {
  productId: string;
  productName: string;
  brand: string;
  supplierId: string;
  supplierName: string;
  stockInInventory: number;
  priorityScore: number;
  status: string;
};

type CurrentOrderProduct = {
  orderId: string;
  productId: string;
  productName: string;
  brand: string;
  supplierId: string;
  supplierName: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityPending: number;
  status: string;
  expectedArrivalDate: string;
};

type HistoryRow = {
  orderId: string;
  productId: string;
  productName: string;
  brand: string;
  supplierId: string;
  supplierName: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityPending: number;
  status: string;
  createdAt: string;
  expectedArrivalDate: string;
  receivedAt: string;
};

const PAGE_SIZE = 50;
const EMPTY_EXECUTION: ExecutionRow[] = [];
const EMPTY_HISTORY: HistoryRow[] = [];

async function fetchJson(path: string, signal?: AbortSignal) {
  const response = await fetch(getBackendRequestUrl(path), {
    cache: "no-store",
    signal,
  });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object"
        ? pickString(payload as BackendRow, ["detail", "message", "error"])
        : "";
    throw new Error(detail || `API error ${response.status}`);
  }

  return payload;
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(getBackendRequestUrl(path), {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object"
        ? pickString(payload as BackendRow, ["detail", "message", "error"])
        : "";
    throw new Error(detail || `API error ${response.status}`);
  }

  return payload;
}

function normalizeKpis(payload: unknown): ReplenishmentKpis {
  const row = payload && typeof payload === "object" ? (payload as BackendRow) : {};
  return {
    orderNeed: pickNumber(row, ["order_need"]),
    urgent: pickNumber(row, ["urgent"]),
    pendingOrders: pickNumber(row, ["pending_orders"]),
  };
}

function normalizeExecution(payload: unknown) {
  const rows = normalizeRows<BackendRow>(payload);
  const record = payload && typeof payload === "object" ? (payload as BackendRow) : {};

  return {
    hasNextPage:
      typeof record.hasNext === "boolean" ? record.hasNext : rows.length === PAGE_SIZE,
    items: rows
      .map((row) => {
        const productId = pickString(row, ["product_id"]);
        const productName = pickString(row, ["product_name"]);
        if (!productId || !productName) return null;
        return {
          productId,
          productName,
          brand: pickString(row, ["brand"]),
          supplierId: pickString(row, ["supplier_id"]),
          supplierName: pickString(row, ["supplier_name"]),
          stockInInventory: pickNumber(row, ["stock_in_inventory"]),
          priorityScore: pickNumber(row, ["priority_score"]),
          status: pickString(row, ["status"]),
        } satisfies ExecutionRow;
      })
      .filter((row): row is ExecutionRow => Boolean(row)),
    page: pickNumber(record, ["page"], 1) || 1,
  };
}

function normalizeCurrentOrderProducts(payload: unknown) {
  const rows = normalizeRows<BackendRow>(payload);

  if (rows.length > 0) {
    return rows
      .map((row) => {
        const orderId = pickString(row, ["order_id", "id"]);
        const productId = pickString(row, ["product_id"]);
        if (!orderId || !productId) return null;
        return {
          orderId,
          productId,
          productName: pickString(row, ["product_name", "name", "product"]),
          brand: pickString(row, ["brand"]),
          supplierId: pickString(row, ["supplier_id"]),
          supplierName: pickString(row, ["supplier_name"]),
          quantityOrdered: pickNumber(row, ["quantity_ordered"]),
          quantityReceived: pickNumber(row, ["quantity_received"]),
          quantityPending: pickNumber(row, ["quantity_pending"]),
          status: pickString(row, ["status", "order_status"]),
          expectedArrivalDate: pickString(row, ["expected_arrival_date"]),
        } satisfies CurrentOrderProduct;
      })
      .filter((row): row is CurrentOrderProduct => Boolean(row));
  }

  const record = payload && typeof payload === "object" ? (payload as BackendRow) : {};

  return pickArray<BackendRow>(record, ["items"])
    .map((row) => {
      const orderId = pickString(row, ["order_id", "id"]);
      const productId = pickString(row, ["product_id"]);
      if (!orderId || !productId) return null;
      return {
        orderId,
        productId,
        productName: pickString(row, ["product_name", "name", "product"]),
        brand: pickString(row, ["brand"]),
        supplierId: pickString(row, ["supplier_id"]),
        supplierName: pickString(row, ["supplier_name"]),
        quantityOrdered: pickNumber(row, ["quantity_ordered"]),
        quantityReceived: pickNumber(row, ["quantity_received"]),
        quantityPending: pickNumber(row, ["quantity_pending"]),
        status: pickString(row, ["status", "order_status"]),
        expectedArrivalDate: pickString(row, ["expected_arrival_date"]),
      } satisfies CurrentOrderProduct;
    })
    .filter((row): row is CurrentOrderProduct => Boolean(row));
}

function normalizeOrderHistory(payload: unknown) {
  const rows = normalizeRows<BackendRow>(payload);
  const record = payload && typeof payload === "object" ? (payload as BackendRow) : {};

  return {
    hasNextPage:
      typeof record.hasNext === "boolean" ? record.hasNext : rows.length === PAGE_SIZE,
    items: rows
      .map((row) => {
        const orderId = pickString(row, ["order_id", "id"]);
        const productId = pickString(row, ["product_id"]);
        if (!orderId || !productId) return null;
        return {
          orderId,
          productId,
          productName: pickString(row, ["product_name", "name", "product"]),
          brand: pickString(row, ["brand"]),
          supplierId: pickString(row, ["supplier_id"]),
          supplierName: pickString(row, ["supplier_name"]),
          quantityOrdered: pickNumber(row, ["quantity_ordered"]),
          quantityReceived: pickNumber(row, ["quantity_received"]),
          quantityPending: pickNumber(row, ["quantity_pending"]),
          status: pickString(row, ["status", "order_status"]),
          createdAt: pickString(row, ["created_at"]),
          expectedArrivalDate: pickString(row, ["expected_arrival_date"]),
          receivedAt: pickString(row, ["received_at"]),
        } satisfies HistoryRow;
      })
      .filter((row): row is HistoryRow => Boolean(row)),
    page: pickNumber(record, ["page"], 1) || 1,
  };
}

function getSummaryTone(label: string): SummaryTone {
  switch (label) {
    case "Order Needed":
      return {
        cardClassName: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/35",
        labelClassName: "text-amber-700 dark:text-amber-300",
        valueClassName: "text-amber-950 dark:text-amber-100",
      };
    case "Urgent":
      return {
        cardClassName: "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/35",
        labelClassName: "text-rose-700 dark:text-rose-300",
        valueClassName: "text-rose-950 dark:text-rose-100",
      };
    case "Pending Order":
      return {
        cardClassName: "border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/35",
        labelClassName: "text-sky-700 dark:text-sky-300",
        valueClassName: "text-sky-950 dark:text-sky-100",
      };
    default:
      return {
        cardClassName: "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900",
        labelClassName: "text-slate-500 dark:text-slate-400",
        valueClassName: "text-slate-900 dark:text-slate-100",
      };
  }
}

function getPriorityScoreTone(score: number) {
  if (score >= 80) return "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200";
  if (score >= 50) return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200";
  return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
}

function getHistoryStatusTone(status: string) {
  if (status === "CONFIRMED") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
  }

  return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200";
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  const tone = getSummaryTone(label);

  return (
    <div className={`rounded-xl border p-4 ${tone.cardClassName}`}>
      <p className={`text-sm font-medium ${tone.labelClassName}`}>{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone.valueClassName}`}>{value}</p>
    </div>
  );
}

function getHistoryStatusLabel(row: HistoryRow) {
  if (
    row.status === "RECEIVED" ||
    row.status === "CONFIRMED" ||
    row.quantityPending === 0 ||
    Boolean(row.receivedAt)
  ) {
    return "CONFIRMED";
  }

  return row.status || "ORDERED";
}

export default function ReplenishmentPage() {
  const [tableMode, setTableMode] = useState<"create" | "history">("create");
  const [createPage, setCreatePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [receiveMessage, setReceiveMessage] = useState<string | null>(null);
  const [receiveError, setReceiveError] = useState<string | null>(null);

  const kpiQuery = useQuery({
    queryKey: ["replenishment", "kpis"],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchJson("/replenishment/kpis", signal).then(normalizeKpis),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const executionQuery = useQuery({
    queryKey: ["replenishment", "execution", createPage],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchJson(`/replenishment/execution?page=${createPage}&limit=${PAGE_SIZE}`, signal).then(
        normalizeExecution,
      ),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const currentOrdersQuery = useQuery({
    queryKey: ["replenishment", "current-order-products"],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchJson("/replenishment/current-order-products", signal).then(
        normalizeCurrentOrderProducts,
      ),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
  const historyQuery = useQuery({
    queryKey: ["replenishment", "order-history", historyPage],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchJson(`/replenishment/order-history?page=${historyPage}&limit=${PAGE_SIZE}`, signal).then(
        normalizeOrderHistory,
      ),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const execution = executionQuery.data?.items ?? EMPTY_EXECUTION;
  const createDisplayPage = executionQuery.data?.page ?? createPage;
  const createHasNextPage = executionQuery.data?.hasNextPage ?? false;
  const currentOrders = useMemo(
    () => currentOrdersQuery.data ?? [],
    [currentOrdersQuery.data],
  );
  const historyItems = historyQuery.data?.items ?? EMPTY_HISTORY;
  const historyDisplayPage = historyQuery.data?.page ?? historyPage;
  const historyHasNextPage = historyQuery.data?.hasNextPage ?? false;
  const currentOrderByProductId = useMemo(() => {
    return currentOrders.reduce<Record<string, CurrentOrderProduct>>((lookup, item) => {
      if (!lookup[item.productId]) lookup[item.productId] = item;
      return lookup;
    }, {});
  }, [currentOrders]);
  const historyByOrderAndProduct = useMemo(() => {
    return historyItems.reduce<Record<string, HistoryRow>>((lookup, item) => {
      lookup[`${item.orderId}:${item.productId}`] = item;
      return lookup;
    }, {});
  }, [historyItems]);
  useRegisterAIVisibleContext("inventory-replenishment-main", {
    page: "inventory-replenishment",
    title: "Inventory Replenishment",
    filters: {
      tableMode,
      createPage: createDisplayPage,
      historyPage: historyDisplayPage,
    },
    visibleKpis: {
      "Order Needed": kpiQuery.data?.orderNeed ?? 0,
      Urgent: kpiQuery.data?.urgent ?? 0,
      "Pending Order": kpiQuery.data?.pendingOrders ?? 0,
    },
    visibleTables:
      tableMode === "create"
        ? [
            {
              name: "Purchase Execution",
              columns: [
                "Product Name",
                "Brand",
                "Supplier Name",
                "Stock In Inventory",
                "Priority Score",
              ],
              rows: execution.map((row) => ({
                productName: row.productName,
                brand: row.brand,
                supplierName: row.supplierName,
                stockInInventory: row.stockInInventory,
                priorityScore: row.priorityScore,
                status: row.status,
              })),
            },
          ]
        : [
            {
              name: "Order History",
              columns: [
                "Product Name",
                "Brand",
                "Supplier",
                "Quantity",
                "Status",
              ],
              rows: historyItems.map((row) => ({
                productName: row.productName,
                brand: row.brand,
                supplierName: row.supplierName,
                quantityOrdered: row.quantityOrdered,
                status: getHistoryStatusLabel(row),
                orderId: row.orderId,
              })),
            },
          ],
    visibleAlerts: [
      ...(receiveMessage
        ? [
            {
              id: "inventory-replenishment-success",
              title: "Arrival confirmed",
              severity: "low",
              message: receiveMessage,
            },
          ]
        : []),
      ...(receiveError
        ? [
            {
              id: "inventory-replenishment-error",
              title: "Arrival confirmation failed",
              severity: "high",
              message: receiveError,
            },
          ]
        : []),
    ],
  });

  const confirmArrivalMutation = useMutation({
    mutationFn: async (order: HistoryRow | CurrentOrderProduct) =>
      postJson(`/procurement/orders/${encodeURIComponent(order.orderId)}/receive`, {
        received_items: [
          {
            product_id: order.productId,
            quantity_received: Math.max(0, order.quantityPending),
          },
        ],
        notes: "Received and checked",
      }),
    onSuccess: async () => {
      setReceiveError(null);
      setReceiveMessage("Arrival confirmed successfully.");
      await Promise.all([
        kpiQuery.refetch(),
        currentOrdersQuery.refetch(),
        historyQuery.refetch(),
        executionQuery.refetch(),
      ]);
    },
  });

  if (!executionQuery.data && executionQuery.isPending) {
    return (
      <div className="space-y-5">
        <InventoryPageHeader />
        <div className="h-40 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <InventoryPageHeader />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Replenishment</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Order Needed" value={String(kpiQuery.data?.orderNeed || 0)} />
        <SummaryCard label="Urgent" value={String(kpiQuery.data?.urgent || 0)} />
        <SummaryCard label="Pending Order" value={String(kpiQuery.data?.pendingOrders || 0)} />
      </div>

      {receiveMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200">
          {receiveMessage}
        </div>
      ) : null}
      {receiveError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/35 dark:text-rose-200">
          {receiveError}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Purchase Execution</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTableMode("create")}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  tableMode === "create"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                }`}
              >
                Create PO
              </button>
              <button
                type="button"
                onClick={() => setTableMode("history")}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  tableMode === "history"
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                }`}
              >
                View History
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-400">
              {tableMode === "create" ? (
                <tr>
                  <th className="px-4 py-2.5 text-left">Product Name</th>
                  <th className="px-4 py-2.5 text-left">Brand</th>
                  <th className="px-4 py-2.5 text-left">Supplier Name</th>
                  <th className="px-4 py-2.5 text-center">Stock In Inventory</th>
                  <th className="px-4 py-2.5 text-center">Priority Score</th>
                  <th className="w-40 px-4 py-2.5 text-center">Create Order</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-4 py-2.5 text-left">Product Name</th>
                  <th className="px-4 py-2.5 text-left">Brand</th>
                  <th className="px-4 py-2.5 text-left">Supplier</th>
                  <th className="px-4 py-2.5 text-center">Quantity</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-center">Action</th>
                </tr>
              )}
            </thead>
            <tbody>
              {tableMode === "create" ? (
                execution.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                      No execution rows returned.
                    </td>
                  </tr>
                ) : (
                  execution.map((row) => (
                    <tr key={row.productId} className="border-t border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/70">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {row.productName}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.brand}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.supplierName}</td>
                      <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">
                        {row.stockInInventory}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex min-w-12 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityScoreTone(row.priorityScore)}`}
                        >
                          {row.priorityScore}
                        </span>
                      </td>
                      <td className="w-40 px-4 py-3 text-center">
                        <Link
                          href={`/inventory/replenishment/create?product_id=${encodeURIComponent(
                            row.productId,
                          )}&product=${encodeURIComponent(row.productName)}`}
                          className="inline-flex min-w-28 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                          Create Order
                        </Link>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                historyItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                      No order history rows returned.
                    </td>
                  </tr>
                ) : (
                  historyItems.map((row) => {
                    const currentOrder =
                      currentOrderByProductId[row.productId] ||
                      historyByOrderAndProduct[`${row.orderId}:${row.productId}`];
                    const displayStatus = getHistoryStatusLabel(row);
                    const canConfirmArrival =
                      currentOrder?.status === "ORDERED" && row.quantityPending > 0;

                    return (
                      <tr
                        key={`${row.orderId}-${row.productId}`}
                        className="border-t border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/70"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {row.productName}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.brand}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.supplierName}</td>
                        <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">
                          {row.quantityOrdered}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getHistoryStatusTone(
                              displayStatus,
                            )}`}
                          >
                            {displayStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            disabled={!canConfirmArrival || confirmArrivalMutation.isPending}
                            onClick={async () => {
                              if (!currentOrder) return;
                              try {
                                setReceiveError(null);
                                setReceiveMessage(null);
                                await confirmArrivalMutation.mutateAsync(currentOrder);
                              } catch (error) {
                                setReceiveMessage(null);
                                setReceiveError(
                                  error instanceof Error
                                    ? error.message
                                    : "Unable to confirm arrival.",
                                );
                              }
                            }}
                            className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                          >
                            {confirmArrivalMutation.isPending && currentOrder
                              ? "Confirming..."
                              : "Confirm Arrival"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
          <span>
            {tableMode === "create"
              ? `Showing ${(createDisplayPage - 1) * PAGE_SIZE + (execution.length ? 1 : 0)}-${
                  (createDisplayPage - 1) * PAGE_SIZE + execution.length
                } on page ${createDisplayPage}`
              : `Showing ${(historyDisplayPage - 1) * PAGE_SIZE + (historyItems.length ? 1 : 0)}-${
                  (historyDisplayPage - 1) * PAGE_SIZE + historyItems.length
                } on page ${historyDisplayPage}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                tableMode === "create"
                  ? setCreatePage((current) => Math.max(1, current - 1))
                  : setHistoryPage((current) => Math.max(1, current - 1))
              }
              disabled={
                tableMode === "create"
                  ? createDisplayPage <= 1 || executionQuery.isFetching
                  : historyDisplayPage <= 1 || historyQuery.isFetching
              }
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                tableMode === "create"
                  ? setCreatePage((current) => current + 1)
                  : setHistoryPage((current) => current + 1)
              }
              disabled={
                tableMode === "create"
                  ? !createHasNextPage || executionQuery.isFetching
                  : !historyHasNextPage || historyQuery.isFetching
              }
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

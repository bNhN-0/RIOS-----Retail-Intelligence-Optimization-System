"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrencyTHB } from "@/lib/formatters/currency";
import {
  getBackendRequestUrl,
  pickArray,
  normalizeRows,
  pickNumber,
  pickString,
  type BackendRow,
} from "@/lib/api/riosBackend";
import {
  selectedDefault,
  zones,
} from "@/features/inventory/services/interactiveMapMockData";
import type {
  OverlayMode,
  Zone,
} from "@/features/inventory/types/interactive-map";
import { ShelfCustomizePanel } from "./ShelfCustomizePanel";
import { StoreFloorMapCard } from "./StoreFloorMapCard";

type SummaryScope = "ALL" | "A" | "B" | "C" | "D";
type ExplorerMode = "overview" | "customize";

type ShelfSummary = {
  lowStockShelfCount: number;
  occupancyRate: number;
  shelfRowCount: number;
  shelfScope: string;
  shelfValue: number;
};

type ShelfDetailRow = {
  conversionRate: number;
  currentUnits: number;
  productName: string;
  shelfCode: string;
  shelfLevel: string;
  status: "empty" | "low_stock" | "stagnant" | "healthy" | "high_turnover";
};

type ShelfSalesDistribution = {
  currentShelfValue: number;
  currentUnitsOnShelf: number;
  saleValue: number;
  shelfGroup: string;
  unitsSold: number;
};

type MetricTone = {
  cardClassName: string;
  labelClassName: string;
  valueClassName: string;
};

const VALID_SHELF_STATUSES = new Set([
  "empty",
  "low_stock",
  "stagnant",
  "healthy",
  "high_turnover",
]);

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function normalizeShelfGroup(value: string) {
  const normalized = value.trim().toUpperCase();
  return normalized ? normalized.charAt(0) : "";
}

function normalizeShelfSummary(payload: unknown): ShelfSummary {
  const record =
    payload && typeof payload === "object" ? (payload as BackendRow) : {};

  return {
    lowStockShelfCount: pickNumber(record, ["low_stock_shelf_count"]),
    occupancyRate: pickNumber(record, ["occupancy_rate"]),
    shelfRowCount: pickNumber(record, ["shelf_row_count"]),
    shelfScope: pickString(record, ["shelf_scope"], "ALL"),
    shelfValue: pickNumber(record, ["shelf_value"]),
  };
}

function normalizeShelfStatus(row: BackendRow) {
  const status = pickString(row, ["status", "shelf_status"]).toLowerCase();

  return VALID_SHELF_STATUSES.has(status)
    ? (status as ShelfDetailRow["status"])
    : null;
}

function normalizeShelfDetailRows(
  payload: unknown,
  fallbackShelfCode: string,
): ShelfDetailRow[] {
  const payloadRecord =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as BackendRow)
      : null;
  const productRows = payloadRecord
    ? pickArray<BackendRow>(payloadRecord, ["products"])
    : [];
  const directRows = normalizeRows<BackendRow>(payload);
  const records =
    productRows.length > 0
      ? productRows
      : directRows.length > 0
      ? directRows
      : payload && typeof payload === "object" && !Array.isArray(payload)
        ? [payload as BackendRow]
        : [];

  return records
    .map((row) => {
      const status = normalizeShelfStatus(row);
      const productName = pickString(
        row,
        ["product_name", "product", "product_on_shelf", "name"],
      );
      const shelfLevel = pickString(
        row,
        ["shelf_level", "level", "shelf_group", "shelf_scope"],
      );

      if (!status || !productName) {
        return null;
      }

      return {
        conversionRate: pickNumber(row, ["conversion_rate", "conversion"]),
        currentUnits: pickNumber(row, ["current_units", "units", "quantity"]),
        productName,
        shelfCode:
          pickString(
            row,
            [
              "shelf_row_id",
              "shelf_row",
              "shelf_code",
              "shelf_id",
              "row",
              "shelf_scope",
            ],
            fallbackShelfCode,
          ) || fallbackShelfCode,
        shelfLevel,
        status,
      };
    })
    .filter((row): row is ShelfDetailRow => Boolean(row));
}

function normalizeShelfSalesDistribution(
  payload: unknown,
): ShelfSalesDistribution[] {
  const record =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as BackendRow)
      : null;
  const shelves = record ? pickArray<BackendRow>(record, ["shelves"]) : [];

  return shelves
    .map((row) => {
      const shelfGroup = normalizeShelfGroup(
        pickString(row, ["shelf_level", "shelf_group", "shelf_id"]),
      );

      if (!shelfGroup) {
        return null;
      }

      return {
        currentShelfValue: pickNumber(row, [
          "current_shelf_value",
          "shelf_value",
        ]),
        currentUnitsOnShelf: pickNumber(row, [
          "current_units_on_shelf",
          "current_units",
        ]),
        saleValue: pickNumber(row, ["sale_value"]),
        shelfGroup,
        unitsSold: pickNumber(row, ["units_sold"]),
      };
    })
    .filter((row): row is ShelfSalesDistribution => Boolean(row));
}

async function fetchDirectShelfJson(
  path: string,
  signal?: AbortSignal,
): Promise<{ data: unknown; error: string | null }> {
  try {
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

      return {
        data: null,
        error: detail || `API error ${response.status}`,
      };
    }

    return {
      data: payload,
      error: null,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        data: null,
        error: "Request aborted.",
      };
    }

    return {
      data: null,
      error: "Unable to reach backend data service.",
    };
  }
}

async function fetchShelfSummary(
  shelfGroup: string,
  signal?: AbortSignal,
): Promise<ShelfSummary> {
  const path =
    shelfGroup === "ALL"
      ? "/shelf/analytics/summary"
      : `/shelf/analytics/summary?shelf_group=${encodeURIComponent(shelfGroup)}`;
  const result = await fetchDirectShelfJson(path, signal);

  if (result.error) {
    throw new Error(result.error);
  }

  return normalizeShelfSummary(result.data);
}

async function fetchShelfDetail(
  shelfGroup: string,
  signal?: AbortSignal,
): Promise<ShelfDetailRow[]> {
  const result = await fetchDirectShelfJson(
    `/shelf/analytics/${encodeURIComponent(shelfGroup)}`,
    signal,
  );

  if (result.error) {
    throw new Error(result.error);
  }

  return normalizeShelfDetailRows(result.data, shelfGroup);
}

async function fetchShelfSalesDistribution(
  signal?: AbortSignal,
): Promise<ShelfSalesDistribution[]> {
  const result = await fetchDirectShelfJson(
    "/shelf/analytics/sales-distribution",
    signal,
  );

  if (result.error) {
    throw new Error(result.error);
  }

  return normalizeShelfSalesDistribution(result.data);
}

function getStatusClasses(status: ShelfDetailRow["status"]) {
  switch (status) {
    case "empty":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    case "low_stock":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200";
    case "stagnant":
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200";
    case "high_turnover":
      return "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200";
    default:
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
  }
}

function getMetricTone(label: string): MetricTone {
  switch (label) {
    case "Shelf Value":
      return {
        cardClassName: "border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/35",
        labelClassName: "text-sky-700 dark:text-sky-300",
        valueClassName: "text-sky-950 dark:text-sky-100",
      };
    case "Occupancy Rate":
      return {
        cardClassName: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/35",
        labelClassName: "text-emerald-700 dark:text-emerald-300",
        valueClassName: "text-emerald-950 dark:text-emerald-100",
      };
    case "Low Stock Shelf Count":
      return {
        cardClassName: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/35",
        labelClassName: "text-amber-700 dark:text-amber-300",
        valueClassName: "text-amber-950 dark:text-amber-100",
      };
    case "Shelf Row Count":
      return {
        cardClassName: "border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/35",
        labelClassName: "text-violet-700 dark:text-violet-300",
        valueClassName: "text-violet-950 dark:text-violet-100",
      };
    default:
      return {
        cardClassName: "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900",
        labelClassName: "text-slate-500 dark:text-slate-400",
        valueClassName: "text-slate-900 dark:text-slate-100",
      };
  }
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const tone = getMetricTone(label);

  return (
    <Card size="sm" className={tone.cardClassName}>
      <CardContent className="pt-1">
        <p className={`text-sm font-medium ${tone.labelClassName}`}>{label}</p>
        <p className={`mt-1 text-xl font-semibold ${tone.valueClassName}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function getZoneShelfGroup(zone: Zone) {
  if (zone.type === "shelf" || zone.type === "wallShelf") {
    return normalizeShelfGroup(zone.name.replace("Shelf", "").trim());
  }

  return "";
}

function mergeZoneWithShelfRows(zone: Zone, rows: ShelfDetailRow[]): Zone {
  if (rows.length === 0) {
    return {
      ...zone,
      conversion: zone.conversion ?? 0,
      level: zone.level ?? null,
      product: zone.product ?? null,
      stock: zone.stock ?? 0,
    };
  }

  const totalUnits = rows.reduce((sum, row) => sum + row.currentUnits, 0);
  const averageConversion =
    rows.reduce((sum, row) => sum + row.conversionRate, 0) / rows.length;
  const firstRow = rows[0];
  const hasLowStock = rows.some((row) => row.status === "low_stock");
  const hasHighTurnover = rows.some((row) => row.status === "high_turnover");
  const hasStagnant = rows.some((row) => row.status === "stagnant");

  return {
    ...zone,
    conversion: averageConversion,
    level: firstRow.shelfLevel || zone.level,
    product: rows.map((row) => row.productName).join(", "),
    shelfValue: rows.length === 0 ? zone.shelfValue : zone.shelfValue,
    status: hasLowStock
      ? "lowStock"
      : hasHighTurnover
        ? "hot"
        : hasStagnant
          ? "warning"
          : "normal",
    stock: totalUnits,
  };
}

function mergeZoneWithSalesDistribution(
  zone: Zone,
  shelfSales: ShelfSalesDistribution | undefined,
): Zone {
  const shelfGroup = getZoneShelfGroup(zone);

  if (!shelfGroup) {
    return zone;
  }

  if (!shelfSales) {
    return {
      ...zone,
      shelfValue: 0,
      stock: 0,
    };
  }

  return {
    ...zone,
    shelfValue: shelfSales.saleValue,
    stock: shelfSales.unitsSold,
  };
}

export default function InteractiveRetailShopMap() {
  const defaultShelfGroup = getZoneShelfGroup(selectedDefault) || "A";
  const [mode, setMode] = useState<ExplorerMode>("overview");
  const [summaryScope, setSummaryScope] = useState<SummaryScope>("ALL");
  const [detailShelfGroup, setDetailShelfGroup] = useState(defaultShelfGroup);
  const [selectedZone, setSelectedZone] = useState<Zone>(selectedDefault);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>("none");
  const summaryQuery = useQuery({
    queryKey: ["shelf-explorer", "summary", summaryScope],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchShelfSummary(summaryScope, signal),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
  const detailQuery = useQuery({
    enabled: Boolean(detailShelfGroup.trim()),
    queryKey: ["shelf-explorer", "detail", detailShelfGroup],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchShelfDetail(detailShelfGroup, signal),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
  const salesDistributionQuery = useQuery({
    enabled: overlayMode === "salesVolume",
    queryKey: ["shelf-explorer", "sales-distribution"],
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchShelfSalesDistribution(signal),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
  const summary = summaryQuery.data ?? {
    lowStockShelfCount: 0,
    occupancyRate: 0,
    shelfRowCount: 0,
    shelfScope: summaryScope,
    shelfValue: 0,
  };
  const detailRows = useMemo(() => detailQuery.data ?? [], [detailQuery.data]);
  const detailError =
    detailQuery.error instanceof Error ? detailQuery.error.message : null;
  const salesDistributionByGroup = useMemo(
    () =>
      new Map(
        (salesDistributionQuery.data ?? []).map((row) => [row.shelfGroup, row]),
      ),
    [salesDistributionQuery.data],
  );
  const displayZones = useMemo(
    () =>
      zones.map((zone) => {
        const shelfGroup = getZoneShelfGroup(zone);
        const zoneWithSales = mergeZoneWithSalesDistribution(
          zone,
          salesDistributionByGroup.get(shelfGroup),
        );

        return shelfGroup === detailShelfGroup
          ? mergeZoneWithShelfRows(zoneWithSales, detailRows)
          : zoneWithSales;
      }),
    [detailRows, detailShelfGroup, salesDistributionByGroup],
  );
  const selectedZoneData =
    displayZones.find((zone) => zone.id === selectedZone.id) ?? selectedZone;
  useRegisterAIVisibleContext("inventory-shelf-explorer-overview", {
    page: "inventory-shelf-explorer",
    title: "Shelf Explorer",
    filters: {
      mode,
      summaryScope,
      detailShelfGroup,
      overlayMode,
    },
    visibleKpis:
      mode === "overview"
        ? {
            "Shelf Value": formatCurrencyTHB(summary.shelfValue),
            "Occupancy Rate": formatPercent(summary.occupancyRate),
            "Low Stock Shelf Count": summary.lowStockShelfCount,
            "Shelf Row Count": summary.shelfRowCount,
          }
        : {},
    visibleTables:
      mode === "overview"
        ? [
            {
              name: "Store Floor Zones",
              columns: [
                "Zone",
                "Type",
                "Status",
                "Stock",
                "Shelf Value",
                "Conversion",
              ],
              rows: displayZones.map((zone) => ({
                zone: zone.name,
                type: zone.type,
                status: zone.status,
                stock: zone.stock ?? null,
                shelfValue: zone.shelfValue ?? null,
                conversion: zone.conversion ?? null,
              })),
            },
            {
              name: "Shelf Detail",
              columns: [
                "Product",
                "Shelf Level",
                "Current Units",
                "Conversion Rate",
                "Status",
              ],
              rows: detailRows.map((row) => ({
                product: row.productName,
                shelfCode: row.shelfCode,
                shelfLevel: row.shelfLevel,
                currentUnits: row.currentUnits,
                conversionRate: row.conversionRate,
                status: row.status,
              })),
            },
          ]
        : [],
    selectedEntity:
      selectedZoneData && mode === "overview"
        ? {
            type: selectedZoneData.type,
            id: selectedZoneData.id,
            label: selectedZoneData.name,
          }
        : undefined,
    visibleAlerts: [
      ...(summaryQuery.error instanceof Error
        ? [
            {
              id: "inventory-shelf-summary-error",
              title: "Shelf summary unavailable",
              severity: "medium",
              message: summaryQuery.error.message,
            },
          ]
        : []),
      ...(detailError
        ? [
            {
              id: "inventory-shelf-detail-error",
              title: "Shelf detail unavailable",
              severity: "medium",
              message: detailError,
            },
          ]
        : []),
      ...(salesDistributionQuery.error instanceof Error
        ? [
            {
              id: "inventory-shelf-sales-distribution-error",
              title: "Shelf sales distribution unavailable",
              severity: "medium",
              message: salesDistributionQuery.error.message,
            },
          ]
        : []),
    ],
  });

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Shelf Explorer</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Overview shows live shelf analytics. Customize manages shelf rows and
          shelf products directly.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("overview")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            mode === "overview"
              ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setMode("customize")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            mode === "customize"
              ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
          }`}
        >
          Customize
        </button>
      </div>

      {mode === "customize" ? <ShelfCustomizePanel /> : null}

      {mode === "overview" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Shelf Value"
              value={formatCurrencyTHB(summary.shelfValue)}
            />
            <MetricCard
              label="Occupancy Rate"
              value={formatPercent(summary.occupancyRate)}
            />
            <MetricCard
              label="Low Stock Shelf Count"
              value={String(summary.lowStockShelfCount)}
            />
            <MetricCard
              label="Shelf Row Count"
              value={String(summary.shelfRowCount)}
            />
          </div>

          <div className="space-y-6">
            <StoreFloorMapCard
              overlayMode={overlayMode}
              selectedZone={selectedZoneData}
              zones={displayZones}
              onOverlayModeChange={setOverlayMode}
              onSelectZone={(zone) => {
                setSelectedZone(zone);
                const group = getZoneShelfGroup(zone);

                if (group) {
                  setDetailShelfGroup(group);
                  setSummaryScope(group as SummaryScope);
                }
              }}
            />

            {summaryQuery.isPending ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                Loading shelf summary...
              </div>
            ) : null}

            {summaryQuery.error instanceof Error ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-200">
                {summaryQuery.error.message}
              </div>
            ) : null}

            {salesDistributionQuery.isPending ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                Loading shelf sales distribution...
              </div>
            ) : null}

            {salesDistributionQuery.error instanceof Error ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-200">
                {salesDistributionQuery.error.message}
              </div>
            ) : null}

            <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Shelf Detail</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  Selected shelf group: {detailShelfGroup || "-"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {detailQuery.isPending ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Loading shelf detail...
                  </div>
                ) : detailError ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-200">
                    {detailError}
                  </div>
                ) : detailRows.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="min-w-[760px] w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-400">
                        <tr>
                          <th className="px-3 py-2.5 text-left">Product</th>
                          <th className="px-3 py-2.5 text-left">
                            Shelf Level
                          </th>
                          <th className="px-3 py-2.5 text-center">
                            Current Units
                          </th>
                          <th className="px-3 py-2.5 text-center">
                            Conversion Rate
                          </th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailRows.map((row) => (
                          <tr
                            key={`${row.shelfCode}-${row.productName}`}
                            className="border-t border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/70"
                          >
                            <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                              {row.productName}
                              <div className="text-xs text-slate-400 dark:text-slate-500">
                                {row.shelfCode}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                              {row.shelfLevel || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-center text-slate-700 dark:text-slate-300">
                              {row.currentUnits}
                            </td>
                            <td className="px-3 py-2.5 text-center text-slate-700 dark:text-slate-300">
                              {formatPercent(row.conversionRate)}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                                  row.status,
                                )}`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    No shelf rows were returned for this shelf group.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

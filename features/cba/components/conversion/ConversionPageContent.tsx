"use client";

export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import { FunnelShape } from "@/features/cba/components/conversion/FunnelShape";
import { SalesPageHeader } from "@/features/sales/components/SalesPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBackendRequestUrl } from "@/lib/api/riosBackend";

type ShelfProductAnalytics = {
  product_id: string;
  product_name: string;
  brand: string | null;
  category_name: string | null;
  shelf_id: string;
  heatmap_row: number;
  column_start: number;
  column_end: number;
  current_items: number;
  individual_products: string[];
  min_stock: number;
  max_stock: number;
  inventory_quantity: number;
  touch_count: number;
  holding_count: number;
  product_remove_count: number;
  total_interactions: number;
  sold_units: number;
  sales_value: number;
  conversion_rate: number;
  popularity_score: number;
  interaction_per_item: number;
  status: string;
};

type ShelfRowAnalytics = {
  shelf_id: string;
  heatmap_row: number;
  shelf_capacity: number;
  current_total_items: number;
  total_interactions: number;
  touch_count: number;
  holding_count: number;
  product_remove_count: number;
  most_touched_product_id: string | null;
  most_touched_product_name: string | null;
  products: ShelfProductAnalytics[];
};

type CameraShelfAnalytics = {
  camera_id: number;
  shelf_group: string;
  days: number;
  heatmap_rows: number;
  heatmap_cols: number;
  total_interactions: number;
  touch_count: number;
  holding_count: number;
  product_remove_count: number;
  total_sold_units: number;
  total_sales_value: number;
  overall_conversion_rate: number;
  most_touched_product_id: string | null;
  most_touched_product_name: string | null;
  products: ShelfProductAnalytics[];
  rows: ShelfRowAnalytics[];
};

const CAMERA_OPTIONS = [
  { value: 1, label: "Camera A" },
  { value: 2, label: "Camera B" },
  { value: 3, label: "Camera C" },
  { value: 4, label: "Camera D" },
];

const DAY_OPTIONS = [7, 30, 60, 90];

async function fetchCameraShelfAnalytics(
  cameraId: number,
  days: number,
  signal?: AbortSignal,
): Promise<CameraShelfAnalytics> {
  const response = await fetch(
    getBackendRequestUrl(
      `/camera-analytics/${cameraId}/shelf-products?days=${days}`,
    ),
    {
      cache: "no-store",
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  return (await response.json()) as CameraShelfAnalytics;
}

function formatPercent(value: number) {
  const normalized = value <= 1 ? value * 100 : value;
  return `${normalized.toFixed(1)}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value);
}

export default function ConversionPage() {
  const [cameraId, setCameraId] = useState(2);
  const [days, setDays] = useState(30);

  const analyticsQuery = useQuery({
    queryKey: ["cba-conversion-analytics", cameraId, days],
    queryFn: ({ signal }) => fetchCameraShelfAnalytics(cameraId, days, signal),
  });

  const analytics = analyticsQuery.data;

  const totalShelfItems =
    analytics?.rows.reduce((sum, row) => sum + row.current_total_items, 0) ?? 0;
  const totalInventoryQuantity =
    analytics?.products.reduce((sum, product) => sum + product.inventory_quantity, 0) ?? 0;
  const averageInteractionPerItem =
    analytics?.products.length
      ? analytics.products.reduce((sum, product) => sum + product.interaction_per_item, 0) /
        analytics.products.length
      : 0;
  const highInterestProducts =
    analytics?.products.filter((product) => product.status === "high_interest_low_conversion")
      .length ?? 0;

  const funnelStages = analytics
    ? [
        { label: "Touches", value: analytics.touch_count },
        { label: "Holds", value: analytics.holding_count },
        { label: "Removals", value: analytics.product_remove_count },
        { label: "Sold Units", value: Math.round(analytics.total_sold_units) },
      ]
    : [];
  useRegisterAIVisibleContext("cba-conversion-main", {
    page: "cba-conversion",
    title: "CBA Conversion Analytics",
    filters: {
      cameraId,
      days,
    },
    visibleKpis: analytics
      ? {
          "Sales Value": formatCurrency(analytics.total_sales_value),
          "Sold Units": formatCount(analytics.total_sold_units),
          "Overall Conversion": formatPercent(analytics.overall_conversion_rate),
          "Shelf Items Visible": formatCount(totalShelfItems),
          "Inventory Quantity": formatCount(totalInventoryQuantity),
          Interactions: formatCount(analytics.total_interactions),
          "High-interest Low-conv.": formatCount(highInterestProducts),
          "Avg Interaction / Item": averageInteractionPerItem.toFixed(3),
          "Most Touched Product": analytics.most_touched_product_name ?? "None",
          "Heatmap Grid": `${analytics.heatmap_rows} x ${analytics.heatmap_cols}`,
        }
      : {},
    visibleCharts: analytics
      ? [
          {
            title: "Shopper Funnel",
            type: "funnel",
            data: funnelStages,
          },
        ]
      : [],
    visibleTables: analytics
      ? [
          {
            name: "Product Breakdown",
            columns: [
              "Product",
              "Shelf",
              "Items",
              "Interactions",
              "Sold",
              "Conversion",
              "Status",
            ],
            rows: analytics.products.map((product) => ({
              product: product.product_name,
              shelf: product.shelf_id,
              items: `${product.current_items} / ${product.inventory_quantity}`,
              interactions: product.total_interactions,
              sold: product.sold_units,
              conversion: product.conversion_rate,
              status: product.status,
            })),
          },
          {
            name: "Shelf Row Breakdown",
            columns: [
              "Shelf",
              "Row",
              "Capacity",
              "Items On Shelf",
              "Interactions",
              "Touches",
              "Holds",
              "Removals",
              "Top Product",
              "Products",
            ],
            rows: analytics.rows.map((row) => ({
              shelf: row.shelf_id,
              row: row.heatmap_row + 1,
              capacity: row.shelf_capacity,
              itemsOnShelf: row.current_total_items,
              interactions: row.total_interactions,
              touches: row.touch_count,
              holds: row.holding_count,
              removals: row.product_remove_count,
              topProduct: row.most_touched_product_name ?? "None",
              products: row.products.length,
            })),
          },
        ]
      : [],
    visibleAlerts:
      analyticsQuery.error instanceof Error
        ? [
            {
              id: "cba-conversion-error",
              title: "Conversion analytics unavailable",
              severity: "high",
              message: analyticsQuery.error.message,
            },
          ]
        : [],
  });

  return (
    <div className="space-y-6">
      <SalesPageHeader />

      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <CardHeader className="gap-3 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Conversion Analytics
              </p>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Shelf products, shopper behavior, and sales relationship
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={cameraId}
                onChange={(event) => setCameraId(Number(event.target.value))}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                {CAMERA_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                {DAY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    Last {option} days
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {analyticsQuery.isPending ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Loading conversion analytics...
        </div>
      ) : analyticsQuery.error instanceof Error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/35 dark:text-rose-200">
          {analyticsQuery.error.message}
        </div>
      ) : analytics ? (
        <>
          <section className="grid gap-4 xl:grid-cols-[1.22fr_0.78fr] xl:items-stretch">
            <Card className="h-full border-slate-200 dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Shopper funnel</CardTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Progression from shelf touches to sold units for camera {analytics.shelf_group}.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {funnelStages.map((stage) => (
                    <div
                      key={stage.label}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {stage.label}
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                        {formatCount(stage.value)}
                      </p>
                    </div>
                  ))}
                </div>

                <FunnelShape stages={funnelStages} />
              </CardContent>
            </Card>

            <Card className="h-full border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <CardHeader className="pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Key KPIs</CardTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Sales, shelf stock, and customer behavior indicators for the selected camera.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Kpi label="Sales value" value={formatCurrency(analytics.total_sales_value)} />
                <Kpi label="Sold units" value={formatCount(analytics.total_sold_units)} />
                <Kpi label="Overall conversion" value={formatPercent(analytics.overall_conversion_rate)} />
                <Kpi label="Shelf items visible" value={formatCount(totalShelfItems)} />
                <Kpi label="Inventory quantity" value={formatCount(totalInventoryQuantity)} />
                <Kpi label="Interactions" value={formatCount(analytics.total_interactions)} />
                <Kpi label="High-interest low-conv." value={formatCount(highInterestProducts)} />
                <Kpi label="Avg interaction / item" value={averageInteractionPerItem.toFixed(3)} />
                <Kpi
                  label="Most touched product"
                  value={analytics.most_touched_product_name ?? "None"}
                />
                <Kpi label="Heatmap grid" value={`${analytics.heatmap_rows} x ${analytics.heatmap_cols}`} />
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Supporting breakdowns
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Prioritize which shelf rows and products show strong shopper attention without matching sales.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-950">
                <CardHeader className="pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Product breakdown</CardTitle>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Product-level view of shelf stock, behavior, and sales outcome.
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-slate-500 dark:text-slate-400">
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          <th className="px-2 py-2 font-medium">Product</th>
                          <th className="px-2 py-2 font-medium">Shelf</th>
                          <th className="px-2 py-2 font-medium">Items</th>
                          <th className="px-2 py-2 font-medium">Interactions</th>
                          <th className="px-2 py-2 font-medium">Sold</th>
                          <th className="px-2 py-2 font-medium">Conversion</th>
                          <th className="px-2 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.products.map((product) => (
                          <tr
                            key={product.product_id}
                            className="border-b border-slate-100 last:border-b-0 dark:border-slate-900"
                          >
                            <td className="px-2 py-3">
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {product.product_name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {product.brand ?? "Unknown brand"} Â· {product.category_name ?? "Unknown category"}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-slate-600 dark:text-slate-300">{product.shelf_id}</td>
                            <td className="px-2 py-3 text-slate-600 dark:text-slate-300">
                              {product.current_items} / {product.inventory_quantity}
                            </td>
                            <td className="px-2 py-3 text-slate-600 dark:text-slate-300">
                              {product.total_interactions}
                            </td>
                            <td className="px-2 py-3 text-slate-600 dark:text-slate-300">
                              {formatCount(product.sold_units)}
                            </td>
                            <td className="px-2 py-3 text-slate-600 dark:text-slate-300">
                              {formatPercent(product.conversion_rate)}
                            </td>
                            <td className="px-2 py-3">
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-300">
                                {product.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-950">
                <CardHeader className="pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Shelf row breakdown</CardTitle>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Compare row capacity, products on shelf, and observed customer behavior.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.rows.map((row) => (
                    <div
                      key={row.shelf_id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {row.shelf_id}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Row {row.heatmap_row + 1} Â· Capacity {row.shelf_capacity}
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                          {row.current_total_items} items on shelf
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm xl:grid-cols-3">
                        <MiniStat label="Interactions" value={formatCount(row.total_interactions)} />
                        <MiniStat label="Touches" value={formatCount(row.touch_count)} />
                        <MiniStat label="Holds" value={formatCount(row.holding_count)} />
                        <MiniStat label="Removals" value={formatCount(row.product_remove_count)} />
                        <MiniStat
                          label="Top product"
                          value={row.most_touched_product_name ?? "None"}
                        />
                        <MiniStat label="Products" value={String(row.products.length)} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

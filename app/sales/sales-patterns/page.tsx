"use client";

import { Suspense, useEffect, useMemo, useState } from "react";

import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import { SalesPageHeader } from "@/features/sales/components/SalesPageHeader";
import { OverviewMetrics } from "@/components/sales/overview/OverviewMetrics";
import { HeatmapCard } from "@/components/sales/trends/HeatmapCard";
import { formatMetricValue } from "@/components/sales/trends/helpers";
import { RevenueTrendCard } from "@/components/sales/trends/RevenueTrendCard";
import { TrendsHeader } from "@/components/sales/trends/TrendsHeader";
import {
  GroupByKey,
  HeatmapApiResponse,
  HeatmapSelection,
  MetricKey,
  RangeKey,
  TimelineChartRow,
  TimelineResponse,
} from "@/components/sales/trends/types";
import {
  BackendRow,
  buildSearchParams,
  fetchBackendJson,
  getBackendBaseUrl,
  pickArray,
  pickNumber,
  pickString,
  slugify,
} from "@/lib/api/riosBackend";
import { useSearchParams } from "@/lib/hooks/navigationHooks";

const ranges: Array<{ key: RangeKey; label: string }> = [
  { key: "week", label: "Last 7 days" },
  { key: "month", label: "Last 30 days" },
  { key: "past14", label: "Last 14 days" },
];

const metricOptions: Array<{ key: MetricKey; label: string }> = [
  { key: "revenue", label: "Revenue" },
  { key: "cost", label: "Cost" },
  { key: "profit", label: "Profit" },
  { key: "quantity", label: "Quantity" },
  { key: "transactions", label: "Transactions" },
];

const groupOptions: Array<{ key: GroupByKey; label: string }> = [
  { key: "brand", label: "Brand" },
  { key: "category", label: "Category" },
  { key: "parent_category", label: "Parent category" },
  { key: "product", label: "Product" },
];

type SalesPatternsData = {
  timeline: TimelineResponse;
  heatmap: HeatmapApiResponse;
  fetchError: string | null;
};

function getValidOption<T extends string>(
  value: string | null,
  options: readonly { key: T }[],
  fallback: T,
) {
  return options.some((option) => option.key === value) ? (value as T) : fallback;
}

function getTimeframeQuery(range: RangeKey) {
  if (range === "past14") {
    return {
      timeframe: "past_days",
      days: 14,
      granularity: "day",
    } as const;
  }

  return {
    timeframe: range,
    days: undefined,
    granularity: "day",
  } as const;
}

function normalizeTimelineResponse(payload: unknown): TimelineResponse {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { buckets: [], series: [] };
  }

  const record = payload as BackendRow;
  const buckets = pickArray<string | number>(record, ["buckets"]).map(String);
  const series = pickArray<BackendRow>(record, ["series"]).map((entry, index) => ({
    label: pickString(entry, ["label", "name"], `Series ${index + 1}`),
    points: pickArray<BackendRow>(entry, ["points"])
      .map((point) => ({
        bucket: pickString(point, ["bucket", "label"]),
        value: pickNumber(point, ["value", "y"]),
      }))
      .filter((point) => point.bucket),
  }));

  return { buckets, series };
}

function normalizeHeatmapResponse(payload: unknown): HeatmapApiResponse {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      rows: [],
      columns: [],
      cells: [],
      kpis: {
        peak_slot: "",
        peak_sales: 0,
        peak_hour: "",
        slowest_hour: "",
        best_day: "",
        worst_day: "",
      },
    };
  }

  const record = payload as BackendRow;
  const rawKpis =
    record.kpis && typeof record.kpis === "object" && !Array.isArray(record.kpis)
      ? (record.kpis as BackendRow)
      : {};

  return {
    rows: pickArray<string | number>(record, ["rows"]).map(String),
    columns: pickArray<string | number>(record, ["columns"]).map(String),
    cells: pickArray<BackendRow>(record, ["cells"])
      .map((cell) => {
        const hourValue = pickNumber(cell, ["hour"], Number.NaN);

        return {
          row: pickString(cell, ["row", "day"]),
          column: pickString(
            cell,
            ["column"],
            Number.isFinite(hourValue) ? String(hourValue) : "",
          ),
          value: pickNumber(cell, ["value"]),
          transaction_count: pickNumber(cell, ["transaction_count", "transactions"]),
          quantity: pickNumber(cell, ["quantity"]),
        };
      })
      .filter((cell) => cell.row && cell.column),
    kpis: {
      peak_slot: pickString(rawKpis, ["peak_slot"]),
      peak_sales: pickNumber(rawKpis, ["peak_sales"]),
      peak_hour: pickString(rawKpis, ["peak_hour"]),
      slowest_hour: pickString(rawKpis, ["slowest_hour"]),
      best_day: pickString(rawKpis, ["best_day"]),
      worst_day: pickString(rawKpis, ["worst_day"]),
    },
  };
}

export default function SalesTrendsPage() {
  return (
    <Suspense fallback={<div className="h-[36rem] rounded-3xl border border-slate-200 bg-white" />}>
      <SalesTrendsPageContent />
    </Suspense>
  );
}

function SalesTrendsPageContent() {
  const searchParams = useSearchParams();
  const baseUrl = getBackendBaseUrl();
  const [rangeState, setRangeState] = useState<RangeKey>(
    () => getValidOption(searchParams.get("range"), ranges, "month"),
  );
  const [metricState, setMetricState] = useState<MetricKey>(
    () => getValidOption(searchParams.get("metric"), metricOptions, "revenue"),
  );
  const [groupByState, setGroupByState] = useState<GroupByKey>(
    () => getValidOption(searchParams.get("group_by"), groupOptions, "brand"),
  );
  const [selectedCell, setSelectedCell] = useState<HeatmapSelection | null>(null);
  const [dashboardData, setDashboardData] = useState<SalesPatternsData>({
    timeline: { buckets: [], series: [] },
    heatmap: {
      rows: [],
      columns: [],
      cells: [],
      kpis: {
        peak_slot: "",
        peak_sales: 0,
        peak_hour: "",
        slowest_hour: "",
        best_day: "",
        worst_day: "",
      },
    },
    fetchError: null,
  });
  const [loading, setLoading] = useState(true);

  const range = ranges.some((option) => option.key === rangeState) ? rangeState : "month";
  const metric = metricOptions.some((option) => option.key === metricState)
    ? metricState
    : "revenue";
  const groupBy = groupOptions.some((option) => option.key === groupByState)
    ? groupByState
    : "brand";

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeframeQuery = getTimeframeQuery(range);

    async function load() {
      setLoading(true);

      const timelineParams = buildSearchParams({
        timeframe: timeframeQuery.timeframe,
        days: timeframeQuery.days,
        group_by: groupBy,
        metric,
        granularity: timeframeQuery.granularity,
        top_n: 6,
      });
      const heatmapParams = buildSearchParams({
        timeframe: timeframeQuery.timeframe,
        days: timeframeQuery.days,
        metric,
      });

      const [timelineResult, heatmapResult] = await Promise.all([
        fetchBackendJson(
          `/sales/analytics/timeline?${timelineParams.toString()}`,
          controller.signal,
        ),
        fetchBackendJson(
          `/sales/analytics/heatmap?${heatmapParams.toString()}`,
          controller.signal,
        ),
      ]);

      if (!active) {
        return;
      }

      setDashboardData({
        timeline: normalizeTimelineResponse(timelineResult.data),
        heatmap: normalizeHeatmapResponse(heatmapResult.data),
        fetchError: timelineResult.error || heatmapResult.error || null,
      });
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [groupBy, metric, range]);

  const timelineSeries = useMemo(
    () =>
      dashboardData.timeline.series.map((series, index) => ({
        key: `${slugify(series.label) || "series"}-${index}`,
        label: series.label,
      })),
    [dashboardData.timeline.series],
  );

  const chartData = useMemo<TimelineChartRow[]>(
    () =>
      dashboardData.timeline.buckets.map((bucket) => {
        const row: TimelineChartRow = { bucket };

        dashboardData.timeline.series.forEach((series, index) => {
          const point = series.points.find((entry) => entry.bucket === bucket);
          row[timelineSeries[index]?.key || `series-${index}`] = point?.value ?? 0;
        });

        return row;
      }),
    [dashboardData.timeline.buckets, dashboardData.timeline.series, timelineSeries],
  );

  const activeSelectedCell = useMemo(() => {
    if (!selectedCell) {
      const firstCell = dashboardData.heatmap.cells[0];

      return firstCell
        ? {
            row: firstCell.row,
            column: firstCell.column,
          }
        : null;
    }

    const hasExistingSelection = dashboardData.heatmap.cells.some(
      (cell) =>
        cell.row === selectedCell.row && cell.column === selectedCell.column,
    );

    if (hasExistingSelection) {
      return selectedCell;
    }

    const firstCell = dashboardData.heatmap.cells[0];

    return firstCell
      ? {
          row: firstCell.row,
          column: firstCell.column,
        }
      : null;
  }, [dashboardData.heatmap.cells, selectedCell]);

  const metrics = useMemo(
    () => [
      {
        title: "Peak Value",
        value: formatMetricValue(metric, dashboardData.heatmap.kpis.peak_sales),
        highlight: metricOptions.find((option) => option.key === metric)?.label || "Metric",
        sub: [
          
        ],
        color: "emerald" as const,
      },
      {
        title: "Day",
        value: dashboardData.heatmap.kpis.best_day || "-",
        highlight: "Highest activity day",
        sub: [
          { label: "Best Day", value: dashboardData.heatmap.kpis.best_day || "-" },
          { label: "Worst day", value: dashboardData.heatmap.kpis.worst_day || "-" },
        ],
        color: "sky" as const,
      },
      {
        title: "Hour",
        value: dashboardData.heatmap.kpis.slowest_hour || "-",
        highlight: "Lowest activity hour",
        sub: [
          { label: "Best Hour", value: dashboardData.heatmap.kpis.peak_hour || "-" },
          { label: "Worst Hour", value: dashboardData.heatmap.kpis.slowest_hour || "-" },
        ],
        color: "rose" as const,
      },
      {
        title: "Filter",
        value: "Controls",
        highlight: "Adjust analytics",
        sub: [
          {
            label: "Time frame",
            value: (
              <select
                value={range}
                onChange={(e) => setRangeState(e.target.value as RangeKey)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500"
              >
                {ranges.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            ),
          },
          {
            label: "Metric",
            value: (
              <select
                value={metric}
                onChange={(e) => setMetricState(e.target.value as MetricKey)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500"
              >
                {metricOptions.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            ),
          },
          {
            label: "Group by",
            value: (
              <select
                value={groupBy}
                onChange={(e) => setGroupByState(e.target.value as GroupByKey)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500"
              >
                {groupOptions.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            ),
          },
        ],
        color: "white" as const,
      },
    ],
    [dashboardData.heatmap.kpis, metric],
  );
  const visibleContextInput = useMemo(
    () => ({
      page: "sales-patterns",
      title: "Sales Patterns",
      filters: {
        range,
        metric,
        groupBy,
      },
      visibleKpis: Object.fromEntries(
        metrics.flatMap((item) => [
          [item.title, item.value],
          ...item.sub.map((subItem) => [subItem.label, subItem.value]),
        ]),
      ),
      visibleCharts: [
        {
          title: "Revenue Trend Timeline",
          type: "multi-line",
          data: chartData,
        },
        {
          title: "Sales Heatmap",
          type: "heatmap",
          data: dashboardData.heatmap.cells,
        },
      ],
      visibleTables: dashboardData.heatmap.cells.length
        ? [
            {
              name: "Heatmap Cells",
              columns: [
                "Row",
                "Column",
                "Value",
                "Transaction Count",
                "Quantity",
              ],
              rows: dashboardData.heatmap.cells.map((cell) => ({
                row: cell.row,
                column: cell.column,
                value: cell.value,
                transactionCount: cell.transaction_count,
                quantity: cell.quantity,
              })),
            },
          ]
        : [],
      selectedEntity: activeSelectedCell
        ? {
            type: "heatmap-cell",
            id: `${activeSelectedCell.row}-${activeSelectedCell.column}`,
            label: `${activeSelectedCell.row} / ${activeSelectedCell.column}`,
          }
        : undefined,
    }),
    [activeSelectedCell, chartData, dashboardData.heatmap.cells, groupBy, metric, metrics, range],
  );
  useRegisterAIVisibleContext("sales-patterns-main", visibleContextInput);

  return (
    <div className="space-y-6">
      <SalesPageHeader />

      {loading ? (
        <div className="h-[36rem] rounded-2xl border border-slate-200 bg-white" />
      ) : dashboardData.fetchError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Sales analytics service unavailable</p>
          <p className="mt-2">
            Start the backend at <code>{baseUrl}</code> or set <code>NEXT_PUBLIC_API_BASE_URL</code>.
          </p>
        </div>
      ) : chartData.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-500">
          No sales pattern data was returned by the backend.
        </div>
      ) : (
        <>
          <TrendsHeader
            range={range}
            ranges={ranges}
            metric={metric}
            metrics={metricOptions}
            groupBy={groupBy}
            groups={groupOptions}
            onRangeChange={setRangeState}
            onMetricChange={setMetricState}
            onGroupByChange={setGroupByState}
          />
          <OverviewMetrics metrics={metrics} />
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr] xl:items-start">
            <RevenueTrendCard
              chartData={chartData}
              series={timelineSeries}
              metric={metric}
              groupBy={groupBy}
            />
            <HeatmapCard
              rows={dashboardData.heatmap.rows}
              columns={dashboardData.heatmap.columns}
              cells={dashboardData.heatmap.cells}
              metric={metric}
              peakSlot={dashboardData.heatmap.kpis.peak_slot}
              selectedCell={activeSelectedCell}
              onCellSelect={setSelectedCell}
            />
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";

import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import {
  useInventoryRateKpiData,
  useInventoryStaticKpiData,
  type InventoryMetric,
  type InventoryRateDayFilter,
} from "@/features/inventory/services/inventoryDashboardApi";

function LoadingCycle({
  inverted = false,
  label = "Updating",
}: {
  inverted?: boolean;
  label?: string;
}) {
  const dotClass = inverted ? "bg-white/80" : "bg-sky-500";
  const textClass = inverted ? "text-white/85" : "text-slate-500";

  return (
    <div className={`inline-flex items-center gap-2 text-xs font-medium ${textClass}`}>
      <span>{label}</span>
      <span className="flex items-center gap-1">
        {Array.from({ length: 3 }, (_, index) => (
          <span
            key={`loading-cycle-${index + 1}`}
            className={`h-1.5 w-1.5 rounded-full ${dotClass} animate-pulse`}
            style={{ animationDelay: `${index * 140}ms` }}
          />
        ))}
      </span>
    </div>
  );
}

function getMetricCardStyles(
  label: string,
  tone: InventoryMetric["tone"] = "default",
) {
  if (label === "Turnover Rate") {
    return {
      container:
        "border border-sky-500 bg-sky-600  dark:border-sky-500 dark:bg-sky-950 dark:shadow-[0_20px_45px_rgba(2,132,199,0.24)]",
      label: "text-sky-100/90",
      value: "text-white",
      infoButton:
        "text-sky-100/90 hover:text-white focus:ring-sky-200/60",
      infoPanel: "border-sky-100 bg-white text-slate-600 dark:border-sky-800 dark:bg-slate-950 dark:text-slate-300",
    };
  }

  if (label === "Overstock %") {
    return tone === "alert"
      ? {
          container:
            "border border-rose-500 bg-rose-500 shadow-[0_20px_45px_rgba(244,63,94,0.18)] dark:border-rose-500 dark:bg-rose-950 dark:shadow-[0_20px_45px_rgba(225,29,72,0.24)]",
          label: "text-white/85",
          value: "text-white",
          infoButton:
            "text-white/80 hover:text-white focus:ring-rose-100/60",
          infoPanel: "border-rose-100 bg-white text-slate-600 dark:border-rose-800 dark:bg-slate-950 dark:text-slate-300",
        }
      : {
          container:
            "border border-amber-300 bg-amber-100 shadow-[0_20px_45px_rgba(245,158,11,0.12)] dark:border-amber-700 dark:bg-amber-950/45 dark:shadow-[0_20px_45px_rgba(217,119,6,0.2)]",
          label: "text-amber-900 dark:text-amber-200",
          value: "text-amber-950 dark:text-amber-100",
          infoButton:
            "text-amber-600 hover:text-amber-800 focus:ring-amber-200 dark:text-amber-300 dark:hover:text-amber-100 dark:focus:ring-amber-700",
          infoPanel: "border-amber-100 bg-white text-slate-600 dark:border-amber-800 dark:bg-slate-950 dark:text-slate-300",
        };
  }

  return {
    container: "border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950",
    label: "text-slate-500 dark:text-slate-400",
    value: tone === "alert" ? "text-red-600 dark:text-rose-300" : "text-slate-900 dark:text-slate-100",
    infoButton:
      "text-slate-400 hover:text-slate-600 focus:ring-slate-300 dark:text-slate-500 dark:hover:text-slate-300 dark:focus:ring-slate-700",
    infoPanel: "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
  };
}

function MetricCard({
  label,
  value,
  tone = "default",
  info,
}: InventoryMetric) {
  const styles = getMetricCardStyles(label, tone);

  return (
    <div className={`rounded-2xl p-4 ${styles.container}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm ${styles.label}`}>{label}</p>
        {info ? (
          <div className="group relative shrink-0">
            <button
              type="button"
              aria-label={`${label} info`}
              title={info}
              className={`rounded-full p-0.5 transition focus:outline-none focus:ring-2 ${styles.infoButton}`}
            >
              <CircleHelp className="h-4 w-4" />
            </button>
            <div
              className={`pointer-events-none absolute right-0 top-6 z-10 w-60 rounded-lg border p-2 text-xs leading-5 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100 ${styles.infoPanel}`}
            >
              {info}
            </div>
          </div>
        ) : null}
      </div>
      <p className={`mt-1.5 text-xl font-semibold ${styles.value}`}>
        {value}
      </p>
    </div>
  );
}

function MetricSkeletonGrid({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={`inventory-metric-skeleton-${index + 1}`}
          className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
        />
      ))}
    </>
  );
}

function StandardMetricsPanel({
  analyticsError,
  baseUrl,
  loading,
  metrics,
}: {
  analyticsError: string | null;
  baseUrl: string;
  loading: boolean;
  metrics: InventoryMetric[];
}) {
  if (loading && metrics.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricSkeletonGrid count={3} />
      </div>
    );
  }

  if (analyticsError && metrics.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Inventory overview metrics unavailable</p>
        <p className="mt-2">
          Start the backend at <code>{baseUrl}</code> or set <code>NEXT_PUBLIC_API_BASE_URL</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </div>
  );
}

function normalizeCustomDayInput(value: string) {
  const digitsOnly = value.replace(/\D+/g, "");

  if (!digitsOnly) {
    return "";
  }

  return String(Math.max(1, Number.parseInt(digitsOnly, 10)));
}

function FeaturedKpiPanel({
  activeFilter,
  analyticsError,
  baseUrl,
  dayInput,
  isFetching,
  loading,
  metrics,
  onApplyCustomDays,
  onDayInputChange,
  onUseToday,
}: {
  activeFilter: InventoryRateDayFilter;
  analyticsError: string | null;
  baseUrl: string;
  dayInput: string;
  isFetching: boolean;
  loading: boolean;
  metrics: InventoryMetric[];
  onApplyCustomDays: () => void;
  onDayInputChange: (value: string) => void;
  onUseToday: () => void;
}) {
  const activeRangeLabel =
    activeFilter.mode === "today"
      ? "Today"
      : `Last ${activeFilter.days} days`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Rate KPIs</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active window: {activeRangeLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onUseToday}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                activeFilter.mode === "today"
                  ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
              }`}
            >
              Today
            </button>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900">
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={dayInput}
                onChange={(event) => onDayInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onApplyCustomDays();
                  }
                }}
                className="w-16 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-sky-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">days</span>
              <button
                type="button"
                onClick={onApplyCustomDays}
                className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {isFetching && metrics.length > 0 ? (
          <LoadingCycle label="Refreshing rate KPIs" />
        ) : null}

        {loading && metrics.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricSkeletonGrid count={2} />
          </div>
        ) : null}

        {analyticsError && metrics.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Rate KPIs unavailable</p>
            <p className="mt-2">
              Start the backend at <code>{baseUrl}</code> or set <code>NEXT_PUBLIC_API_BASE_URL</code>.
            </p>
          </div>
        ) : null}

        {!loading && !analyticsError ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function OverviewMetricsGrid() {
  const [activeRateFilter, setActiveRateFilter] = useState<InventoryRateDayFilter>({
    days: 1,
    mode: "today",
  });
  const [dayInput, setDayInput] = useState("7");
  const {
    analyticsError: staticAnalyticsError,
    backgroundError: staticBackgroundError,
    baseUrl: staticBaseUrl,
    loading: staticLoading,
    metrics: standardMetrics,
  } = useInventoryStaticKpiData();
  const {
    analyticsError: rateAnalyticsError,
    backgroundError: rateBackgroundError,
    baseUrl: rateBaseUrl,
    isFetching: rateIsFetching,
    loading: rateLoading,
    metrics: rateMetrics,
  } = useInventoryRateKpiData(activeRateFilter);
  const backgroundError = staticBackgroundError || rateBackgroundError;
  useRegisterAIVisibleContext("inventory-overview-metrics", {
    filters: {
      rateWindowMode: activeRateFilter.mode,
      rateWindowDays: activeRateFilter.days,
    },
    visibleKpis: Object.fromEntries(
      [...standardMetrics, ...rateMetrics].map((metric) => [
        metric.label,
        metric.value,
      ]),
    ),
    visibleAlerts: backgroundError
      ? [
          {
            id: "inventory-overview-metrics-refresh-warning",
            title: "Cached inventory analytics",
            severity: "medium",
            message:
              "Showing cached inventory analytics while the latest refresh failed.",
          },
        ]
      : [],
  });

  return (
    <div className="space-y-3">
      {backgroundError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Showing cached inventory analytics while the latest refresh failed.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(24rem,2fr)]">
        <StandardMetricsPanel
          analyticsError={staticAnalyticsError}
          baseUrl={staticBaseUrl}
          loading={staticLoading}
          metrics={standardMetrics}
        />

        <FeaturedKpiPanel
          activeFilter={activeRateFilter}
          analyticsError={rateAnalyticsError}
          baseUrl={rateBaseUrl}
          dayInput={dayInput}
          isFetching={rateIsFetching}
          loading={rateLoading}
          metrics={rateMetrics}
          onApplyCustomDays={() => {
            const normalizedDays = Number.parseInt(
              normalizeCustomDayInput(dayInput) || "1",
              10,
            );

            setDayInput(String(normalizedDays));
            setActiveRateFilter({
              days: normalizedDays,
              mode: "custom",
            });
          }}
          onDayInputChange={(value) => setDayInput(normalizeCustomDayInput(value))}
          onUseToday={() =>
            setActiveRateFilter({
              days: 1,
              mode: "today",
            })
          }
        />
      </div>
    </div>
  );
}

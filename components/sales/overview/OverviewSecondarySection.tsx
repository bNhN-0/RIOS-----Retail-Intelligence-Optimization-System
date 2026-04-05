"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatCompactCurrencyTHB,
  formatCurrencyTHB as formatCurrency,
} from "@/lib/formatters/currency";
import { formatTooltipValue } from "./helpers";
import {
  PerformancePoint,
  PerformanceView,
} from "./types";

type OverviewSecondarySectionProps = {
  view: PerformanceView;
  performanceData: PerformancePoint[];
  parentCategoryRatio: number;
  parentCategoryLabel: string;
  onViewChange: (view: PerformanceView) => void;
};

function shortenName(value: string, maxLength = 14) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}â€¦`;
}

export function OverviewSecondarySection({
  view,
  performanceData,
  parentCategoryRatio,
  parentCategoryLabel,
  onViewChange,
}: OverviewSecondarySectionProps) {
  const sortedData = useMemo(
    () => [...performanceData].sort((a, b) => b.revenue - a.revenue),
    [performanceData],
  );

  const totals = useMemo(() => {
    const totalRevenue = sortedData.reduce((total, item) => total + item.revenue, 0);
    const averageRevenue =
      sortedData.length === 0 ? 0 : totalRevenue / sortedData.length;
    const topPerformer = sortedData[0];
    const leaderShare =
      totalRevenue === 0 || !topPerformer
        ? 0
        : (topPerformer.revenue / totalRevenue) * 100;

    return {
      totalRevenue,
      averageRevenue,
      topPerformer,
      leaderShare,
    };
  }, [sortedData]);

  const viewLabel = view === "category" ? "category" : "product";
  const chartData = view === "product" ? sortedData.slice(0, 10) : sortedData;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm [--comparison-axis:#64748b] [--comparison-axis-strong:#475569] [--comparison-grid:#e5e7eb] [--comparison-tooltip-bg:#ffffff] [--comparison-tooltip-border:#d1d5db] dark:border-slate-800 dark:bg-slate-950/40 dark:[--comparison-axis:#94a3b8] dark:[--comparison-axis-strong:#cbd5e1] dark:[--comparison-grid:#334155] dark:[--comparison-tooltip-bg:#0f172a] dark:[--comparison-tooltip-border:#475569]">
      <div className="space-y-3.5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">
              Comparison
            </p>
            <h3 className="mt-2 text-base font-semibold tracking-tight text-gray-900 dark:text-slate-100">
              Product Performance
            </h3>
           
          </div>

          <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-slate-900/80">
            {(["category", "product"] as PerformanceView[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onViewChange(option)}
                className={`rounded-md px-3 py-1 text-[11px] font-medium capitalize transition ${
                  view === option
                    ? "bg-white text-gray-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                    : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-900/70 dark:bg-emerald-950/30">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
              Parent category ratio
            </p>
            <p className="mt-1.5 text-sm font-semibold text-gray-900 dark:text-slate-100">
              {parentCategoryRatio.toFixed(1)}%
            </p>
            <p className="mt-1 text-[11px] text-gray-600 dark:text-slate-400">
              {parentCategoryLabel}
            </p>
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 dark:border-sky-900/70 dark:bg-sky-950/30">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
              Top performer
            </p>
            <p className="mt-1.5 text-sm font-semibold text-gray-900 dark:text-slate-100">
              {totals.topPerformer?.name ?? "-"}
            </p>
            <p className="mt-1 text-[11px] text-gray-600 dark:text-slate-400">
              {totals.topPerformer
                ? formatCurrency(totals.topPerformer.revenue)
                : "-"}
            </p>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">
              Mix revenue
            </p>
            <p className="mt-1.5 text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">
              {formatCurrency(totals.totalRevenue)}
            </p>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
              Average {formatCurrency(totals.averageRevenue)} per {viewLabel}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">
              Leader share
            </p>
            <p className="mt-1.5 text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">
              {totals.leaderShare.toFixed(1)}%
            </p>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
              Held by {totals.topPerformer?.name ?? "the top performer"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/50">
          <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-medium text-gray-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Leader
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-gray-600 dark:bg-slate-800 dark:text-slate-300">
              Ranked by revenue 
            </span>
          </div>

          <div className="h-[15rem]">
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
              >
                <CartesianGrid
                  stroke="var(--comparison-grid)"
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--comparison-axis)" }}
                  tickFormatter={(value: number) =>
                    formatCompactCurrencyTHB(value, {
                      thousandSuffix: "k",
                    })
                  }
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={88}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--comparison-axis-strong)" }}
                  tickFormatter={(value: string) => shortenName(value)}
                />
                <Tooltip
                  formatter={formatTooltipValue}
                  contentStyle={{
                    borderRadius: 12,
                    backgroundColor: "var(--comparison-tooltip-bg)",
                    borderColor: "var(--comparison-tooltip-border)",
                    color: "var(--comparison-axis)",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
                  }}
                />
                <Bar dataKey="revenue" radius={[0, 10, 10, 0]} barSize={16}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.name === totals.topPerformer?.name
                          ? "#10b981"
                          : "#cbd5e1"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

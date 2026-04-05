"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { formatTooltipValue } from "./helpers";
import { SalesPoint, Summary } from "./types";

type OverviewPrimarySectionProps = {
  activeLabel: string;
  summary: Summary;
  chartData: SalesPoint[];
  parentCategoryOptions: readonly string[];
  categoryOptions: readonly string[];
  selectedParentCategory: string;
  selectedCategory: string;
  onParentCategoryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
};

export function OverviewPrimarySection({
  activeLabel,
  summary,
  chartData,
  parentCategoryOptions,
  categoryOptions,
  selectedParentCategory,
  selectedCategory,
  onParentCategoryChange,
  onCategoryChange,
}: OverviewPrimarySectionProps) {

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm [--overview-axis:#64748b] [--overview-grid:#d1fae5] [--overview-tooltip-bg:#ffffff] [--overview-tooltip-border:#d1d5db] dark:border-slate-800 dark:bg-slate-950/40 dark:[--overview-axis:#94a3b8] dark:[--overview-grid:#334155] dark:[--overview-tooltip-bg:#0f172a] dark:[--overview-tooltip-border:#475569]">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">
              Revenue Line Chart
            </h3>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-300">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">
                Parent Category
              </span>
              <select
                value={selectedParentCategory}
                onChange={(event) => onParentCategoryChange(event.target.value)}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-emerald-500"
              >
                {parentCategoryOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-300">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">
                Category
              </span>
              <select
                value={selectedCategory}
                onChange={(event) => onCategoryChange(event.target.value)}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-emerald-500"
              >
                {categoryOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-3 sm:grid-cols-[auto_auto] sm:items-end">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{activeLabel}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                  {summary.actual}
                </p>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {summary.variance}
                </span>
              </div>
            </div>


          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

          </div>

          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid
                  stroke="var(--overview-grid)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--overview-axis)" }}
                />
                <Tooltip
                  formatter={formatTooltipValue}
                  contentStyle={{
                    borderRadius: 12,
                    backgroundColor: "var(--overview-tooltip-bg)",
                    borderColor: "var(--overview-tooltip-border)",
                    color: "var(--overview-axis)",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: "#16a34a",
                    stroke: "#dcfce7",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

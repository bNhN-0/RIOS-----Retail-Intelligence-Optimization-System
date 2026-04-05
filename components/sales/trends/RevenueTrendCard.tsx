"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMetricAxis, formatMetricValue } from "./helpers";
import { GroupByKey, MetricKey, TimelineChartRow } from "./types";

type RevenueTrendCardProps = {
  chartData: TimelineChartRow[];
  series: Array<{ key: string; label: string }>;
  metric: MetricKey;
  groupBy: GroupByKey;
};

const lineColors = [
  "#0f766e",
  "#ea580c",
  "#2563eb",
  "#9333ea",
  "#e11d48",
  "#0891b2",
];

export function RevenueTrendCard({
  chartData,
  series,
  metric,
  groupBy,
}: RevenueTrendCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400">
              Timeline
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-100">
              Sales pattern line chart
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              One line per {groupBy.replaceAll("_", " ")} across the selected time window.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Active series
            </p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
              {series.length} line{series.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="bucket"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(value: number) => formatMetricAxis(metric, value)}
              />
              <Tooltip
                formatter={(value, name) => [
                  typeof value === "number"
                    ? formatMetricValue(metric, value)
                    : typeof value === "string"
                      ? value
                      : "-",
                  typeof name === "string" || typeof name === "number"
                    ? String(name)
                    : "",
                ]}
                contentStyle={{
                  borderRadius: 12,
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  color: "#334155",
                  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
                }}
              />
              <Legend />
              {series.map((seriesItem, index) => (
                <Line
                  key={seriesItem.key}
                  type="monotone"
                  dataKey={seriesItem.key}
                  stroke={lineColors[index % lineColors.length]}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: lineColors[index % lineColors.length],
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                  name={seriesItem.label}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

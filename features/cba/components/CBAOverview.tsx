"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CBADashboardModel } from "@/features/cba/services/cbaMockData";

type CBAOverviewProps = {
  model: CBADashboardModel;
  selectedDate: string;
  onDateChange: (value: string) => void;
};

function KPI({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className={`rounded-xl border p-3 shadow-sm ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs opacity-70">{detail}</p>
    </div>
  );
}

export function CBAOverview({ model, selectedDate, onDateChange }: CBAOverviewProps) {
  const visibleContextInput = useMemo(
    () => ({
      page: "cba-overview",
      title: "Customer Behaviour Analysis Overview",
      filters: {
        selectedDate,
      },
      visibleKpis: {
        "Foot Traffic": model.totals.footTraffic,
        Interactions: model.totals.interactions,
        Holdings: model.totals.holdings,
        "Touch Rate": `${model.totals.touchRate}%`,
        "Hold Rate": `${model.totals.holdRate}%`,
        "Conversion Proxy": `${model.totals.conversionProxy}%`,
      },
      visibleCharts: [
        {
          title: "Behavior Trend",
          type: "stacked-area",
          data: model.trend,
        },
      ],
      visibleTables: [
        {
          name: "Shelf Performance",
          columns: [
            "Shelf",
            "Traffic",
            "Interactions",
            "Holdings",
            "Touch Rate",
            "Hold Rate",
            "Conversion Rate",
          ],
          rows: model.shelfPerformance.map((row) => ({
            shelf: row.shelf,
            traffic: row.traffic,
            interactions: row.interactions,
            holdings: row.holdings,
            touchRate: row.touchRate,
            holdRate: row.holdRate,
            conversionRate: row.conversionRate,
          })),
        },
      ],
    }),
    [model, selectedDate],
  );
  useRegisterAIVisibleContext("cba-overview-main", visibleContextInput);

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Overview Date
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Review CBA overview metrics for the selected calendar day.
            </p>
          </div>
          <label className="w-full max-w-xs space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Date
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => onDateChange(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500"
            />
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <KPI label="Foot Traffic" value={model.totals.footTraffic.toLocaleString("en-US")} detail="Observed detections" tone="border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
        <KPI label="Interactions" value={model.totals.interactions.toLocaleString("en-US")} detail="Touches plus holds" tone="border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/35 dark:text-sky-100" />
        <KPI label="Holdings" value={model.totals.holdings.toLocaleString("en-US")} detail="Longer intent signals" tone="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100" />
        <KPI label="Touch Rate" value={`${model.totals.touchRate}%`} detail="Interactions / traffic" tone="border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/35 dark:text-indigo-100" />
        <KPI label="Hold Rate" value={`${model.totals.holdRate}%`} detail="Holdings / interactions" tone="border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-800 dark:bg-violet-950/35 dark:text-violet-100" />
        <KPI label="Conversion Proxy" value={`${model.totals.conversionProxy}%`} detail="Holdings / traffic" tone="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-100" />
      </div>

      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Behavior trend</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">Interactions and holdings over time.</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={model.trend}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="interactions" stackId="1" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.65} />
                <Area type="monotone" dataKey="holdings" stackId="2" stroke="#f59e0b" fill="#fde68a" fillOpacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Shelf performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2 text-left">Shelf</th>
                  <th>Traffic</th>
                  <th>Interactions</th>
                  <th>Holdings</th>
                  <th>Touch Rate</th>
                  <th>Hold Rate</th>
                  <th>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {model.shelfPerformance.map((row) => (
                  <tr key={row.shelf} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100">{row.shelf}</td>
                    <td className="text-slate-700 dark:text-slate-300">{row.traffic}</td>
                    <td className="text-slate-700 dark:text-slate-300">{row.interactions}</td>
                    <td className="text-slate-700 dark:text-slate-300">{row.holdings}</td>
                    <td className="text-sky-700 dark:text-sky-300">{row.touchRate}%</td>
                    <td className="text-amber-700 dark:text-amber-300">{row.holdRate}%</td>
                    <td className="text-emerald-700 dark:text-emerald-300">{row.conversionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

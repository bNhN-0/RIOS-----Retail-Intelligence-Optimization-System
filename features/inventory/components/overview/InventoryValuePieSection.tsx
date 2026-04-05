"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import {
  useInventoryAnalyticsData,
  useInventoryShelfRatioData,
} from "@/features/inventory/services/inventoryDashboardApi";
import { formatCurrencyTHB as formatCurrency } from "@/lib/formatters/currency";

type BreakdownView = "category" | "brand";

function LoadingCycle({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
      <span>{label}</span>
      <span className="flex items-center gap-1">
        {Array.from({ length: 3 }, (_, index) => (
          <span
            key={`inventory-loading-${index + 1}`}
            className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse"
            style={{ animationDelay: `${index * 140}ms` }}
          />
        ))}
      </span>
    </div>
  );
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

type InventoryTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      percent?: number;
      color: string;
    };
  }>;
  label?: string;
  breakdownView: BreakdownView;
};

function CustomInventoryTooltip({
  active,
  payload,
  breakdownView,
}: InventoryTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0]?.payload;

  if (!data) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-xl">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {breakdownView}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {data.name}
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Value: <span className="font-semibold text-slate-900">{formatCurrency(data.value)}</span>
      </p>
      <p className="text-sm text-slate-600">
        Share: <span className="font-semibold text-slate-900">{formatPercent(data.percent ?? 0)}</span>
      </p>
    </div>
  );
}

export function InventoryValuePieSection() {
  const [breakdownView, setBreakdownView] = useState<BreakdownView>("category");
  const {
    analyticsError,
    backgroundError: analyticsBackgroundError,
    charts,
    isFetching: analyticsIsFetching,
    loading: analyticsLoading,
  } = useInventoryAnalyticsData();
  const {
    backgroundError: shelfRatioBackgroundError,
    isFetching: shelfRatioIsFetching,
    loading: shelfRatioLoading,
    shelfRatioError,
    shelfRatio,
  } = useInventoryShelfRatioData();
  const chartData = useMemo(() => charts[breakdownView], [breakdownView, charts]);
  const shelfRatioData = useMemo(() => shelfRatio, [shelfRatio]);
  const backgroundError = analyticsBackgroundError || shelfRatioBackgroundError;
  useRegisterAIVisibleContext("inventory-overview-value-pies", {
    filters: {
      inventoryValueBreakdown: breakdownView,
    },
    visibleCharts: [
      {
        title: `Inventory Value Mix by ${breakdownView}`,
        type: "pie",
        data: chartData,
      },
      {
        title: "Inventory Shelf Ratio (Value)",
        type: "pie",
        data: shelfRatioData,
      },
    ],
    visibleAlerts: backgroundError
      ? [
          {
            id: "inventory-overview-value-refresh-warning",
            title: "Cached inventory mix",
            severity: "medium",
            message:
              "Showing cached inventory mix while the latest refresh failed.",
          },
        ]
      : [],
  });

  if (analyticsLoading && shelfRatioLoading) {
    return (
      <section className="min-h-[32rem] rounded-2xl border border-slate-200 bg-white p-4 animate-pulse" />
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-4">
        {backgroundError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Showing cached inventory mix while the latest refresh failed.
          </div>
        ) : null}

        {analyticsIsFetching || shelfRatioIsFetching ? (
          <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2">
            <LoadingCycle label="Refreshing inventory overview" />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex rounded-lg bg-slate-100 p-1">
            {(["category", "brand"] as BreakdownView[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBreakdownView(option)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${
                  breakdownView === option
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {analyticsLoading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 animate-pulse">
            <div className="mx-auto aspect-square w-full max-w-[18rem] rounded-full bg-white/70 sm:max-w-[20rem]" />
          </div>
        ) : analyticsError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Inventory mix unavailable</p>
            <p className="mt-2">
              The inventory backend is currently unavailable. Try again once the service is back online.
            </p>
          </div>
        ) : chartData.length > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4">
              <h4 className="text-base font-semibold text-slate-900">
                Inventory Value Mix
              </h4>
            </div>

            <div className="mx-auto aspect-square w-full max-w-[18rem] sm:max-w-[20rem]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={<CustomInventoryTooltip breakdownView={breakdownView} />}
                  />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="78%"
                    paddingAngle={3}
                    stroke="#ffffff"
                    strokeWidth={3}
                    labelLine={false}
                    isAnimationActive
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            No inventory value data is available.
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4">
            <h4 className="text-base font-semibold text-slate-900">
              Inventory Shelf Ratio (Value)
            </h4>
          </div>

          {shelfRatioLoading ? (
            <div className="mx-auto aspect-square w-full max-w-[16rem] rounded-full bg-white animate-pulse sm:max-w-[18rem]" />
          ) : shelfRatioError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Inventory shelf ratio unavailable</p>
              <p className="mt-2">
                The inventory backend is currently unavailable. Try again once the service is back online.
              </p>
            </div>
          ) : shelfRatioData.length > 0 ? (
            <>
              <div className="mx-auto aspect-square w-full max-w-[16rem] sm:max-w-[18rem]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      content={<CustomInventoryTooltip breakdownView={"category"} />}
                    />
                    <Pie
                      data={shelfRatioData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius="80%"
                      paddingAngle={4}
                      stroke="#ffffff"
                      strokeWidth={3}
                      labelLine={false}
                    >
                      {shelfRatioData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {shelfRatioData.map((entry) => (
                  <div
                    key={entry.name}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <p className="text-sm font-medium text-slate-900">
                        {entry.name}
                      </p>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {formatPercent(entry.percent)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatCurrency(entry.value)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              No inventory shelf ratio data is available.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

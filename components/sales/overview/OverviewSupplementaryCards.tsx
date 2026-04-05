"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { TooltipValue, TransactionsPoint } from "./types";

type DistributionPoint = {
  name: string;
  value: number;
  color: string;
};

type OverviewSupplementaryCardsProps = {
  transactionsData: TransactionsPoint[];
  mixDistribution: DistributionPoint[];
  parentCategoryOptions: readonly string[];
  categoryOptions: readonly string[];
  selectedParentCategory: string;
  selectedCategory: string;
  onParentCategoryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
};

type TrendCardProps = {
  description: string;
  data: TransactionsPoint[];
  currentColor: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function toNumber(value: TooltipValue) {
  if (typeof value === "number") {
    return value;
  }

  if (Array.isArray(value)) {
    return Number(value[0] ?? 0);
  }

  return Number(value ?? 0);
}

function formatPieTooltipValue(value: TooltipValue) {
  const numericValue = toNumber(value);

  return [`${numericValue.toFixed(0)}%`, "Share"];
}

function sumTrendValues(data: TransactionsPoint[]) {
  return data.reduce((total, point) => total + point.current, 0);
}

function formatComparisonTooltip(
  value: TooltipValue,
  name: string | number | undefined,
) {
  return [formatNumber(toNumber(value)), name === "current" ? "Actual" : String(name ?? "")];
}

function TrendCard({ description, data, currentColor }: TrendCardProps) {
  const currentTotal = sumTrendValues(data);
  const latestPoint = data[data.length - 1];

  return (
    <article className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[11px] font-semibold text-sky-700">
          Actual current
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-slate-900">
            {formatNumber(latestPoint?.current ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Latest period: {latestPoint?.label ?? "-"}
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-4 text-slate-600">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: currentColor }}
              />
              Actual total
            </span>
            <span className="font-semibold text-slate-900">
              {formatNumber(currentTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 h-44 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <ResponsiveContainer>
          <BarChart data={data} barGap={8}>
            <CartesianGrid
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <Tooltip
              formatter={formatComparisonTooltip}
              contentStyle={{
                borderRadius: 16,
                borderColor: "#e2e8f0",
                boxShadow: "0 18px 36px rgba(15, 23, 42, 0.12)",
              }}
            />
            <Bar
              dataKey="current"
              fill={currentColor}
              radius={[8, 8, 0, 0]}
              name="Actual"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function MixPieCard({
  distributionData,
  parentCategoryOptions,
  categoryOptions,
  selectedParentCategory,
  selectedCategory,
  onParentCategoryChange,
  onCategoryChange,
}: {
  distributionData: DistributionPoint[];
  parentCategoryOptions: readonly string[];
  categoryOptions: readonly string[];
  selectedParentCategory: string;
  selectedCategory: string;
  onParentCategoryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}) {
  return (
    <article className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
            Product Mix
          </p>
          <h4 className="mt-2 text-lg font-semibold tracking-tight text-gray-900">
            Product Categories Pie Chart
          </h4>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-medium text-gray-600">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              Parent category
            </span>
            <select
              value={selectedParentCategory}
              onChange={(event) => onParentCategoryChange(event.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none transition focus:border-emerald-400"
            >
              {parentCategoryOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-xs font-medium text-gray-600">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              Category
            </span>
            <select
              value={selectedCategory}
              onChange={(event) => onCategoryChange(event.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none transition focus:border-emerald-400"
            >
              {categoryOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        {distributionData.length > 0 ? (
          <div className="h-72 w-full max-w-[24rem]">
            <ResponsiveContainer>
              <PieChart>
                <Tooltip
                  formatter={formatPieTooltipValue}
                  contentStyle={{
                    borderRadius: 12,
                    borderColor: "#d1d5db",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
                  }}
                />
                <Pie
                  data={distributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={112}
                  paddingAngle={3}
                  stroke="#ffffff"
                  strokeWidth={3}
                  labelLine={false}
                >
                  {distributionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-56 w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            No product mix data is available.
          </div>
        )}
      </div>
    </article>
  );
}

export function OverviewSupplementaryCards({
  transactionsData,
  mixDistribution,
  parentCategoryOptions,
  categoryOptions,
  selectedParentCategory,
  selectedCategory,
  onParentCategoryChange,
  onCategoryChange,
}: OverviewSupplementaryCardsProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <TrendCard
        description="Order volume from transactions over time."
        data={transactionsData}
        currentColor="#2563eb"
      />
      <MixPieCard
        distributionData={mixDistribution}
        parentCategoryOptions={parentCategoryOptions}
        categoryOptions={categoryOptions}
        selectedParentCategory={selectedParentCategory}
        selectedCategory={selectedCategory}
        onParentCategoryChange={onParentCategoryChange}
        onCategoryChange={onCategoryChange}
      />
    </section>
  );
}

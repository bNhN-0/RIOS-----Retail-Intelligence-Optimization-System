import { HeatmapRow, MetricKey } from "./types";

import {
  formatCompactCurrencyTHB,
  formatCurrencyTHB,
} from "@/lib/formatters/currency";

type TooltipValue = number | string | readonly (number | string)[] | undefined | null;

export function formatCurrency(value: number) {
  return formatCurrencyTHB(value);
}

export function shortCurrency(value: number) {
  return formatCompactCurrencyTHB(value, {
    thousandSuffix: "k",
  });
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatTooltipValue(value: TooltipValue) {
  if (typeof value === "number") {
    return formatCurrency(value);
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value ?? "";
}

export function formatHour(hour: number) {
  const normalized = hour % 24;
  const suffix = normalized >= 12 ? "PM" : "AM";
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${hour12}${suffix}`;
}

export function formatMetricValue(metric: MetricKey, value: number) {
  if (metric === "quantity" || metric === "transactions") {
    return new Intl.NumberFormat("en-US").format(Math.round(value));
  }

  return formatCurrencyTHB(value);
}

export function formatMetricAxis(metric: MetricKey, value: number) {
  if (metric === "quantity" || metric === "transactions") {
    return formatCompactNumber(value);
  }

  return shortCurrency(value);
}

export function seriesLabel(value?: string) {
  if (value === "lastWeek") return "Last Week";
  if (value === "lastYear") return "Last Year";
  if (value === "previous") return "Previous";
  if (value === "forecast") return "Forecast";
  if (value === "current") return "Current";
  return value ?? "";
}

export function toneForHeatmap(value: number, heatmapOrMax: HeatmapRow[] | number) {
  const max =
    typeof heatmapOrMax === "number"
      ? heatmapOrMax
      : Math.max(...heatmapOrMax.flatMap((row) => row.values), 0);
  const ratio = max === 0 ? 0 : value / max;
  if (ratio > 0.82) return "border-rose-700 bg-rose-700 text-white dark:border-rose-400 dark:bg-rose-400 dark:text-slate-950";
  if (ratio > 0.62) return "border-orange-300 bg-orange-200 text-orange-950 dark:border-orange-500 dark:bg-orange-500/80 dark:text-white";
  if (ratio > 0.42) return "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-500/70 dark:bg-amber-500/25 dark:text-amber-100";
  if (ratio > 0.22) return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
  return "border-slate-100 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500";
}

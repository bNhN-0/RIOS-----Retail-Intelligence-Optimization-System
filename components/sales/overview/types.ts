export type Timeframe = "hour" | "day" | "week" | "month" | "year";
export type PerformanceView = "category" | "product";
export type MetricColor = "emerald" | "sky" | "violet" | "amber" | "rose" | "indigo";

export type SalesPoint = {
  label: string;
  current: number;
  forecast: number;
};

export type TransactionsPoint = {
  label: string;
  current: number;
  previous: number;
};

export type UnitsTrendPoint = {
  label: string;
  current: number;
  previous: number;
};

export type PerformancePoint = {
  name: string;
  revenue: number;
};

export type TrendBreakdownTone = "slate" | "emerald" | "amber" | "rose";

export type TrendBreakdownItem = {
  label: string;
  value: string;
  tone: TrendBreakdownTone;
};

export type TooltipValue = number | string | ReadonlyArray<number | string> | undefined;

export type Summary = {
  actual: string;
  forecast: string;
  variance: string;
  forecastStatus: string;
};

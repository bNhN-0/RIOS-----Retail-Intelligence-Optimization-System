export type RangeKey = "week" | "month" | "past14";
export type TrendMode = "category" | "product";
export type ComparisonMode = "previous" | "lastWeek" | "lastYear";

export type GroupByKey =
  | "parent_category"
  | "category"
  | "brand"
  | "product";

export type MetricKey =
  | "revenue"
  | "cost"
  | "profit"
  | "quantity"
  | "transactions";

export type RevenuePoint = {
  label: string;
  current: number;
  previous: number;
  lastWeek: number;
  lastYear: number;
  forecast: number;
};

export type HeatmapRow = {
  day: string;
  values: number[];
};

export type ConversionPoint = {
  label: string;
  orders: number;
  basketSize: number;
};

export type AlertItem = {
  type: "drop" | "spike" | "pattern";
  title: string;
  delta: string;
  detail: string;
};

export type HeatmapSelection = {
  row: string;
  column: string;
};

export type TimelinePoint = {
  bucket: string;
  value: number;
};

export type TimelineSeries = {
  label: string;
  points: TimelinePoint[];
};

export type TimelineResponse = {
  buckets: string[];
  series: TimelineSeries[];
};

export type TimelineChartRow = {
  bucket: string;
  [key: string]: string | number;
};

export type HeatmapCell = {
  row: string;
  column: string;
  value: number;
  transaction_count: number;
  quantity: number;
};

export type HeatmapApiResponse = {
  rows: string[];
  columns: string[];
  cells: HeatmapCell[];
  kpis: {
    peak_slot: string;
    peak_sales: number;
    peak_hour: string;
    slowest_hour: string;
    best_day: string;
    worst_day: string;
  };
};

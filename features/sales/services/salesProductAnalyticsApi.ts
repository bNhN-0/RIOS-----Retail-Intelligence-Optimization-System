import {
  buildSearchParams,
  fetchBackendJson,
  pickArray,
  pickDate,
  pickNumber,
  pickString,
  safeDivide,
  type BackendRow,
} from "@/lib/api/riosBackend";

export type ProductAnalyticsTimeframe = "day" | "week" | "month" | "past_days";
export type ProductAnalyticsGranularity = "hour" | "day" | "week";

export type ProductSalesKpiSummary = {
  revenue: number;
  quantity: number;
  transactionCount: number;
  averageOrderValue: number;
  averageUnitPrice: number;
  cost: number | null;
  profit: number | null;
  margin: number | null;
};

export type ProductSalesTimelinePoint = {
  label: string;
  revenue: number;
  quantity: number;
  transactionCount: number;
};

export type ProductSalesBreakdownPoint = {
  label: string;
  revenue: number;
  quantity: number;
  transactionCount: number;
};

export type ProductSalesPatternChart = {
  weekdayRows: ProductSalesBreakdownPoint[];
  hourlyRows: ProductSalesBreakdownPoint[];
};

export type ProductSalesRecentTransaction = {
  id: string;
  timestamp: string;
  quantity: number;
  revenue: number;
  unitPrice: number;
  channel?: string;
  status?: string;
};

export type ProductSalesAnalytics = {
  productId: string;
  productName: string;
  timeframe: ProductAnalyticsTimeframe;
  granularity: ProductAnalyticsGranularity;
  days: number | null;
  kpiSummary: ProductSalesKpiSummary;
  revenueTimeline: ProductSalesTimelinePoint[];
  patternChart: ProductSalesPatternChart;
  weekdayBreakdown: ProductSalesBreakdownPoint[];
  hourlyBreakdown: ProductSalesBreakdownPoint[];
  recentTransactions: ProductSalesRecentTransaction[];
};

function asRecord(value: unknown): BackendRow {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as BackendRow;
}

function pickOptionalNumber(record: BackendRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.replace(/,/g, "").trim();
      const parsed = Number(normalized);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function pickSectionRecord(payload: unknown, keys: string[]) {
  const record = asRecord(payload);

  for (const key of keys) {
    const candidate = record[key];

    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      return candidate as BackendRow;
    }
  }

  return {};
}

function pickSectionRows(
  payload: unknown,
  sectionKeys: string[],
  rowKeys: string[],
) {
  const sectionRecord = pickSectionRecord(payload, sectionKeys);
  const sectionRows = pickArray<BackendRow>(sectionRecord, rowKeys);

  if (sectionRows.length > 0) {
    return sectionRows;
  }

  const rootRecord = asRecord(payload);

  for (const key of sectionKeys) {
    const candidate = rootRecord[key];

    if (Array.isArray(candidate)) {
      return candidate as BackendRow[];
    }
  }

  return [];
}

function normalizeMargin(value: number | null) {
  if (value === null) {
    return null;
  }

  if (Math.abs(value) <= 1) {
    return value * 100;
  }

  return value;
}

function normalizeKpiSummary(payload: unknown): ProductSalesKpiSummary {
  const source = pickSectionRecord(payload, ["kpi_summary", "summary", "kpis"]);
  const revenue = pickNumber(source, ["revenue", "sales_value", "total_revenue"], 0);
  const quantity = pickNumber(
    source,
    ["quantity", "units_sold", "sold_units", "total_quantity"],
    0,
  );
  const transactionCount = pickNumber(
    source,
    ["transaction_count", "transactions", "order_count"],
    0,
  );
  const cost = pickOptionalNumber(source, ["cost", "total_cost"]);
  const profit =
    pickOptionalNumber(source, ["profit", "gross_profit"]) ??
    (cost !== null ? revenue - cost : null);
  const margin =
    normalizeMargin(
      pickOptionalNumber(source, ["margin", "profit_margin", "gross_margin"]),
    ) ??
    (profit !== null && revenue > 0 ? safeDivide(profit, revenue) * 100 : null);

  return {
    revenue,
    quantity,
    transactionCount,
    averageOrderValue:
      pickOptionalNumber(source, ["average_order_value", "avg_order_value", "aov"]) ??
      safeDivide(revenue, Math.max(transactionCount, 1)),
    averageUnitPrice:
      pickOptionalNumber(source, ["average_unit_price", "avg_unit_price", "unit_price"]) ??
      safeDivide(revenue, Math.max(quantity, 1)),
    cost,
    profit,
    margin,
  };
}

function normalizeTimelinePoint(
  row: BackendRow,
  index: number,
): ProductSalesTimelinePoint | null {
  const label = pickString(
    row,
    ["label", "bucket", "date", "timeframe_label", "period"],
    `Point ${index + 1}`,
  );

  if (!label) {
    return null;
  }

  return {
    label,
    revenue: pickNumber(row, ["revenue", "sales_value", "value", "amount"], 0),
    quantity: pickNumber(row, ["quantity", "units_sold", "sold_units"], 0),
    transactionCount: pickNumber(
      row,
      ["transaction_count", "transactions", "order_count"],
      0,
    ),
  };
}

function normalizeRevenueTimeline(payload: unknown) {
  return pickSectionRows(
    payload,
    ["revenue_timeline", "timeline"],
    ["points", "buckets", "rows", "timeline"],
  )
    .map((row, index) => normalizeTimelinePoint(row, index))
    .filter((row): row is ProductSalesTimelinePoint => Boolean(row));
}

function normalizeBreakdownPoint(
  row: BackendRow,
  index: number,
  kind: "weekday" | "hourly",
): ProductSalesBreakdownPoint | null {
  const numericHour = pickOptionalNumber(row, ["hour", "hour_of_day"]);
  const label = pickString(
    row,
    ["label", "weekday", "day", "bucket", "hour_label"],
    numericHour !== null ? String(numericHour) : `${kind}-${index + 1}`,
  );

  if (!label) {
    return null;
  }

  return {
    label,
    revenue: pickNumber(row, ["revenue", "sales_value", "value", "amount"], 0),
    quantity: pickNumber(row, ["quantity", "units_sold", "sold_units"], 0),
    transactionCount: pickNumber(
      row,
      ["transaction_count", "transactions", "order_count"],
      0,
    ),
  };
}

function normalizeWeekdayBreakdown(payload: unknown) {
  return pickSectionRows(
    payload,
    ["weekday_breakdown", "weekdays"],
    ["rows", "items", "breakdown", "days"],
  )
    .map((row, index) => normalizeBreakdownPoint(row, index, "weekday"))
    .filter((row): row is ProductSalesBreakdownPoint => Boolean(row));
}

function normalizeHourlyBreakdown(payload: unknown) {
  return pickSectionRows(
    payload,
    ["hourly_breakdown", "hourly"],
    ["rows", "items", "breakdown", "hours"],
  )
    .map((row, index) => normalizeBreakdownPoint(row, index, "hourly"))
    .filter((row): row is ProductSalesBreakdownPoint => Boolean(row));
}

function normalizePatternRows(
  payload: unknown,
  rowKeys: string[],
  kind: "weekday" | "hourly",
) {
  const source = pickSectionRecord(payload, ["pattern_chart", "patternChart"]);

  return pickArray<BackendRow>(source, rowKeys)
    .map((row, index) => normalizeBreakdownPoint(row, index, kind))
    .filter((row): row is ProductSalesBreakdownPoint => Boolean(row));
}

function normalizePatternChart(payload: unknown): ProductSalesPatternChart {
  const weekdayRows = normalizePatternRows(
    payload,
    ["weekday_rows", "weekdayRows", "weekdays"],
    "weekday",
  );
  const hourlyRows = normalizePatternRows(
    payload,
    ["hourly_rows", "hourlyRows", "hours"],
    "hourly",
  );

  return {
    weekdayRows:
      weekdayRows.length > 0 ? weekdayRows : normalizeWeekdayBreakdown(payload),
    hourlyRows:
      hourlyRows.length > 0 ? hourlyRows : normalizeHourlyBreakdown(payload),
  };
}

function normalizeRecentTransaction(
  row: BackendRow,
  index: number,
): ProductSalesRecentTransaction {
  const quantity = pickNumber(row, ["quantity", "units_sold", "sold_units"], 0);
  const revenue = pickNumber(row, ["revenue", "sales_value", "subtotal", "total"], 0);
  const unitPrice =
    pickOptionalNumber(row, ["unit_price", "selling_price", "price"]) ??
    safeDivide(revenue, Math.max(quantity, 1));
  const timestamp =
    pickDate(
      row,
      ["transaction_time", "created_at", "timestamp", "transaction_date"],
    )?.toISOString() ?? "";

  return {
    id: pickString(
      row,
      ["transaction_id", "sales_transaction_id", "id"],
      `transaction-${index + 1}`,
    ),
    timestamp,
    quantity,
    revenue,
    unitPrice,
    channel: pickString(row, ["channel", "payment_method", "register", "cashier_name"]),
    status: pickString(row, ["status"]),
  };
}

function normalizeRecentTransactions(payload: unknown) {
  return pickSectionRows(
    payload,
    ["recent_transactions", "transactions", "recent_sales"],
    ["rows", "items", "transactions", "results"],
  ).map((row, index) => normalizeRecentTransaction(row, index));
}

function normalizeProductSalesAnalytics(
  payload: unknown,
  request: {
    productId: string;
    timeframe: ProductAnalyticsTimeframe;
    granularity: ProductAnalyticsGranularity;
    days?: number;
  },
): ProductSalesAnalytics {
  const record = asRecord(payload);

  return {
    productId: pickString(record, ["product_id", "id"], request.productId),
    productName: pickString(record, ["product_name", "name"], request.productId),
    timeframe:
      (pickString(record, ["timeframe"]) as ProductAnalyticsTimeframe) ||
      request.timeframe,
    granularity:
      (pickString(record, ["granularity"]) as ProductAnalyticsGranularity) ||
      request.granularity,
    days: pickOptionalNumber(record, ["days"]) ?? request.days ?? null,
    kpiSummary: normalizeKpiSummary(record),
    revenueTimeline: normalizeRevenueTimeline(record),
    patternChart: normalizePatternChart(record),
    weekdayBreakdown: normalizeWeekdayBreakdown(record),
    hourlyBreakdown: normalizeHourlyBreakdown(record),
    recentTransactions: normalizeRecentTransactions(record),
  };
}

export async function fetchProductSalesAnalytics(
  {
    productId,
    timeframe,
    granularity,
    days,
  }: {
    productId: string;
    timeframe: ProductAnalyticsTimeframe;
    granularity: ProductAnalyticsGranularity;
    days?: number;
  },
  signal?: AbortSignal,
) {
  const params = buildSearchParams({
    timeframe,
    granularity,
    days: timeframe === "past_days" ? days : undefined,
  });
  const result = await fetchBackendJson(
    `/products/${encodeURIComponent(productId)}/sales-analytics?${params.toString()}`,
    signal,
  );

  if (result.error || !result.data) {
    throw new Error(result.error ?? "No product sales analytics were returned.");
  }

  return normalizeProductSalesAnalytics(result.data, {
    productId,
    timeframe,
    granularity,
    days,
  });
}

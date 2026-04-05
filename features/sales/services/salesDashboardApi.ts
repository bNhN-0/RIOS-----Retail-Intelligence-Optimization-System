"use client";

import { useEffect, useState } from "react";

import {
  fetchBackendJson,
  getBackendBaseUrl,
  pickDate,
  pickNumber,
  pickString,
  safeDivide,
  type BackendRow,
} from "@/lib/api/riosBackend";

export type SalesTimeframe = "hour" | "day" | "week" | "month" | "year";
export type SalesRange = "hour" | "day" | "week" | "month";
export type SalesFilter = {
  parentCategory?: string | null;
  category?: string | null;
  product?: string | null;
  brand?: string | null;
};

export type SalesLine = {
  productId: string;
  productName: string;
  parentCategory: string;
  category: string;
  brand: string;
  quantity: number;
  revenue: number;
  cost: number;
  unitPrice: number;
  transactionId: string;
  transactionCount: number;
  forecast: number;
  createdAt: Date;
};

export type SalesDashboardProduct = {
  id: string;
  name: string;
  category: string;
  brand: string;
  revenue: number;
  cost: number;
  units: number;
  transactions: number;
  stock: number;
  reorderLevel: number;
  demandScore: number;
  inventoryScore: number;
  averagePrice: number;
  trend: number[];
  rank: number;
  contribution: string;
};

export type RevenuePoint = {
  label: string;
  current: number;
  previous: number;
  lastWeek: number;
  lastYear: number;
  forecast: number;
};

export type ComparisonPoint = {
  label: string;
  current: number;
  previous: number;
};

export type PerformancePoint = {
  name: string;
  revenue: number;
};

export type DistributionPoint = {
  name: string;
  value: number;
  color: string;
};

export type HeatmapRow = {
  day: string;
  values: number[];
};

export type InsightAlert = {
  type: "drop" | "spike" | "pattern";
  title: string;
  delta: string;
  detail: string;
};

export type OrdersVsBasketPoint = {
  label: string;
  orders: number;
  basketSize: number;
};

export type SalesDashboardData = {
  baseUrl: string;
  fetchError: string | null;
  lines: SalesLine[];
  products: SalesDashboardProduct[];
  parentCategories: string[];
  categories: string[];
  categoriesByParent: Record<string, string[]>;
  brands: string[];
  productNames: string[];
  anchorDate: Date | null;
};

type SalesDashboardPayload = {
  anchor_date?: string | null;
  parent_categories?: string[];
  categories?: string[];
  categories_by_parent?: Record<string, string[]>;
  lines?: BackendRow[];
};

type BucketUnit = "hour" | "day" | "week" | "month" | "year";
type BucketWindow = {
  label: string;
  start: Date;
  end: Date;
};

type SalesDashboardCache = {
  data: SalesDashboardData;
  fetchedAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const CHART_COLORS = [
  "#10b981",
  "#2563eb",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const salesDashboardCache = new Map<string, SalesDashboardCache>();
const salesDashboardRequests = new Map<string, Promise<SalesDashboardData>>();

function createEmptySalesDashboardData(fetchError: string | null = null): SalesDashboardData {
  return {
    baseUrl: getBackendBaseUrl(),
    fetchError,
    lines: [],
    products: [],
    parentCategories: [],
    categories: [],
    categoriesByParent: {},
    brands: [],
    productNames: [],
    anchorDate: null,
  };
}

function startOfHour(date: Date) {
  const next = new Date(date);
  next.setMinutes(0, 0, 0);
  return next;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  const dayIndex = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - dayIndex);
  return next;
}

function startOfMonth(date: Date) {
  const next = startOfDay(date);
  next.setDate(1);
  return next;
}

function startOfYear(date: Date) {
  const next = startOfDay(date);
  next.setMonth(0, 1);
  return next;
}

function alignToUnit(date: Date, unit: BucketUnit) {
  if (unit === "hour") return startOfHour(date);
  if (unit === "day") return startOfDay(date);
  if (unit === "week") return startOfWeek(date);
  if (unit === "month") return startOfMonth(date);
  return startOfYear(date);
}

function addUnit(date: Date, unit: BucketUnit, amount: number) {
  const next = new Date(date);

  if (unit === "hour") {
    next.setHours(next.getHours() + amount);
    return next;
  }

  if (unit === "day") {
    next.setDate(next.getDate() + amount);
    return next;
  }

  if (unit === "week") {
    next.setDate(next.getDate() + amount * 7);
    return next;
  }

  if (unit === "month") {
    next.setMonth(next.getMonth() + amount);
    return next;
  }

  next.setFullYear(next.getFullYear() + amount);
  return next;
}

function getWeekNumber(date: Date) {
  const start = startOfYear(date);
  const diff = startOfWeek(date).getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1);
}

function formatBucketLabel(date: Date, unit: BucketUnit) {
  if (unit === "hour") {
    return `${date.getHours().toString().padStart(2, "0")}:00`;
  }

  if (unit === "day") {
    return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
  }

  if (unit === "week") {
    return `W${getWeekNumber(date)}`;
  }

  if (unit === "month") {
    return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  }

  return String(date.getFullYear());
}

function getBucketConfig(timeframe: SalesTimeframe | SalesRange) {
  if (timeframe === "hour") return { count: 8, unit: "hour" as const };
  if (timeframe === "day") return { count: 7, unit: "day" as const };
  if (timeframe === "week") return { count: 6, unit: "week" as const };
  if (timeframe === "month") return { count: 6, unit: "month" as const };
  return { count: 4, unit: "year" as const };
}

function buildBucketWindows(
  timeframe: SalesTimeframe | SalesRange,
  anchorDate: Date,
  offsetAmount = 0,
  offsetUnit?: BucketUnit,
) {
  const { count, unit } = getBucketConfig(timeframe);
  const anchor = alignToUnit(
    offsetUnit ? addUnit(anchorDate, offsetUnit, offsetAmount) : anchorDate,
    unit,
  );

  return Array.from({ length: count }, (_, index) => {
    const start = addUnit(anchor, unit, -(count - 1 - index));

    return {
      label: formatBucketLabel(start, unit),
      start,
      end: addUnit(start, unit, 1),
    };
  });
}

function normalizeDashboardLine(row: BackendRow, index: number): SalesLine | null {
  const createdAt = pickDate(row, ["transaction_time", "created_at", "timestamp"]);

  if (!createdAt) {
    return null;
  }

  const productName = pickString(row, ["product", "product_name", "name"], `Product ${index + 1}`);
  const quantity = pickNumber(row, ["quantity"], 0);
  const revenue = pickNumber(row, ["revenue"], 0);
  const cost = pickNumber(row, ["cost"], 0);
  const transactionCount = pickNumber(row, ["transactions"], 1);
  const forecast = pickNumber(row, ["forecast"], 0);

  return {
    productId: productName,
    productName,
    parentCategory: pickString(
      row,
      ["parent_category", "parent_category_name"],
      "All Catalogs",
    ),
    category: pickString(row, ["category", "category_name"], "Uncategorized"),
    brand: pickString(row, ["brand", "brand_name"], "Unbranded"),
    quantity,
    revenue,
    cost,
    unitPrice: quantity > 0 ? revenue / quantity : 0,
    transactionId: `${createdAt.toISOString()}-${index}`,
    transactionCount,
    forecast,
    createdAt,
  };
}

function filterSalesLines(lines: SalesLine[], filter: SalesFilter) {
  return lines.filter((line) => {
    const matchesParentCategory =
      !filter.parentCategory ||
      filter.parentCategory === "Parent Category" ||
      line.parentCategory === filter.parentCategory;
    const matchesCategory =
      !filter.category || filter.category === "Category" || line.category === filter.category;
    const matchesProduct =
      !filter.product || filter.product === "Product" || line.productName === filter.product;
    const matchesBrand =
      !filter.brand || filter.brand === "All Brands" || line.brand === filter.brand;

    return matchesParentCategory && matchesCategory && matchesProduct && matchesBrand;
  });
}

export function getTimeWindowLines(
  lines: SalesLine[],
  timeframe: SalesTimeframe | SalesRange,
  filter: SalesFilter,
  anchorDate: Date | null,
) {
  const resolvedAnchorDate = anchorDate || new Date();
  const windows = buildBucketWindows(timeframe, resolvedAnchorDate);

  return filterSalesLines(lines, filter).filter(
    (line) =>
      line.createdAt >= windows[0].start &&
      line.createdAt < windows[windows.length - 1].end,
  );
}

function aggregateWindowValue(
  lines: SalesLine[],
  window: BucketWindow,
  metric: "revenue" | "quantity" | "transactions" | "forecast",
) {
  const bucketLines = lines.filter(
    (line) => line.createdAt >= window.start && line.createdAt < window.end,
  );

  if (metric === "transactions") {
    return bucketLines.reduce((sum, line) => sum + line.transactionCount, 0);
  }

  if (metric === "quantity") {
    return bucketLines.reduce((sum, line) => sum + line.quantity, 0);
  }

  if (metric === "forecast") {
    return bucketLines.reduce((sum, line) => sum + line.forecast, 0);
  }

  return bucketLines.reduce((sum, line) => sum + line.revenue, 0);
}

function groupRevenueBy(
  lines: SalesLine[],
  groupBy: "parentCategory" | "category" | "product" | "brand",
) {
  const grouped = new Map<string, number>();

  lines.forEach((line) => {
    const key =
      groupBy === "parentCategory"
        ? line.parentCategory
        : groupBy === "category"
          ? line.category
          : groupBy === "brand"
            ? line.brand
            : line.productName;

    grouped.set(key, (grouped.get(key) || 0) + line.revenue);
  });

  return Array.from(grouped.entries()).sort((left, right) => right[1] - left[1]);
}

function buildDistributionPoints(entries: Array<[string, number]>) {
  const totalValue = entries.reduce((sum, [, value]) => sum + value, 0);

  return entries.slice(0, 8).map(([name, value], index) => ({
    name,
    value: totalValue === 0 ? 0 : (value / totalValue) * 100,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

function buildHeatmapRows(lines: SalesLine[]) {
  const dayIndexMap = new Map(DAYS.map((day, index) => [day, index]));
  const rows = DAYS.map<HeatmapRow>((day) => ({
    day,
    values: Array.from({ length: 24 }, () => 0),
  }));

  lines.forEach((line) => {
    const dayLabel = DAYS[(line.createdAt.getDay() + 6) % 7];
    const rowIndex = dayIndexMap.get(dayLabel);

    if (rowIndex === undefined) {
      return;
    }

    rows[rowIndex].values[line.createdAt.getHours()] += line.revenue;
  });

  return rows.map((row) => ({
    ...row,
    values: row.values.map((value) => Math.round(value)),
  }));
}

function buildProductTrend(lines: SalesLine[], productName: string, anchorDate: Date) {
  const productLines = lines.filter((line) => line.productName === productName);
  const windows = buildBucketWindows("week", anchorDate);

  return windows.map((window) => Math.round(aggregateWindowValue(productLines, window, "revenue")));
}

function buildProducts(lines: SalesLine[], anchorDate: Date | null) {
  const totalRevenue = lines.reduce((sum, line) => sum + line.revenue, 0);
  const aggregates = new Map<
    string,
    {
      id: string;
      name: string;
      category: string;
      brand: string;
      revenue: number;
      cost: number;
      units: number;
      transactions: number;
    }
  >();

  lines.forEach((line) => {
    const current = aggregates.get(line.productId) || {
      id: line.productId,
      name: line.productName,
      category: line.category,
      brand: line.brand,
      revenue: 0,
      cost: 0,
      units: 0,
      transactions: 0,
    };

    current.revenue += line.revenue;
    current.cost += line.cost;
    current.units += line.quantity;
    current.transactions += line.transactionCount;
    aggregates.set(line.productId, current);
  });

  return Array.from(aggregates.values())
    .map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      brand: item.brand,
      revenue: item.revenue,
      cost: item.cost,
      units: item.units,
      transactions: item.transactions,
      stock: 0,
      reorderLevel: 0,
      demandScore: 0,
      inventoryScore: 0,
      averagePrice: safeDivide(item.revenue, Math.max(item.units, 1)),
      trend: anchorDate ? buildProductTrend(lines, item.name, anchorDate) : [],
      rank: 0,
      contribution: "0.0",
    }))
    .sort((left, right) => right.revenue - left.revenue)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      contribution: (safeDivide(item.revenue, Math.max(totalRevenue, 1)) * 100).toFixed(1),
    }));
}

async function fetchSalesDashboardData(
  timeframe: SalesTimeframe,
  signal?: AbortSignal,
): Promise<SalesDashboardData> {
  const result = await fetchBackendJson<SalesDashboardPayload>(
    `/sales/dashboard?timeframe=${timeframe}`,
    signal,
  );

  if (result.error || !result.data) {
    return createEmptySalesDashboardData(result.error);
  }

  const payload = result.data;
  const lines = (payload.lines || [])
    .map((row, index) => normalizeDashboardLine(row, index))
    .filter((line): line is SalesLine => Boolean(line))
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());

  const anchorDate =
    pickDate(payload as unknown as BackendRow, ["anchor_date"]) ||
    (lines.length > 0 ? lines[lines.length - 1].createdAt : null);
  const parentCategorySet = new Set<string>(payload.parent_categories || []);
  const categorySet = new Set<string>(payload.categories || []);
  const categoriesByParentSource = payload.categories_by_parent || {};

  lines.forEach((line) => {
    parentCategorySet.add(line.parentCategory);
    categorySet.add(line.category);
  });

  const categoriesByParent = Object.entries(categoriesByParentSource).reduce<Record<string, string[]>>(
    (lookup, [parentCategory, categories]) => {
      lookup[parentCategory] = [...new Set(categories)].sort((left, right) =>
        left.localeCompare(right),
      );
      return lookup;
    },
    {},
  );

  lines.forEach((line) => {
    if (!categoriesByParent[line.parentCategory]) {
      categoriesByParent[line.parentCategory] = [];
    }
    if (!categoriesByParent[line.parentCategory].includes(line.category)) {
      categoriesByParent[line.parentCategory].push(line.category);
      categoriesByParent[line.parentCategory].sort((left, right) => left.localeCompare(right));
    }
  });

  const products = buildProducts(lines, anchorDate);

  return {
    baseUrl: getBackendBaseUrl(),
    fetchError: null,
    lines,
    products,
    parentCategories: Array.from(parentCategorySet).sort((left, right) =>
      left.localeCompare(right),
    ),
    categories: Array.from(categorySet).sort((left, right) => left.localeCompare(right)),
    categoriesByParent,
    brands: Array.from(new Set(products.map((item) => item.brand))).sort((left, right) =>
      left.localeCompare(right),
    ),
    productNames: Array.from(new Set(products.map((item) => item.name))).sort((left, right) =>
      left.localeCompare(right),
    ),
    anchorDate,
  };
}

export async function getSalesDashboardData(
  timeframe: SalesTimeframe,
  signal?: AbortSignal,
  forceRefresh = false,
) {
  const now = Date.now();
  const cacheKey = timeframe;
  const cached = salesDashboardCache.get(cacheKey);

  if (!forceRefresh && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  if (!forceRefresh && salesDashboardRequests.has(cacheKey)) {
    return salesDashboardRequests.get(cacheKey)!;
  }

  const request = fetchSalesDashboardData(timeframe, signal)
    .then((data) => {
      salesDashboardCache.set(cacheKey, {
        data,
        fetchedAt: Date.now(),
      });
      return data;
    })
    .finally(() => {
      salesDashboardRequests.delete(cacheKey);
    });

  salesDashboardRequests.set(cacheKey, request);
  return request;
}

export function useSalesDashboardData(timeframe: SalesTimeframe) {
  const [data, setData] = useState<SalesDashboardData>(() =>
    salesDashboardCache.get(timeframe)?.data || createEmptySalesDashboardData(),
  );
  const [loading, setLoading] = useState(!salesDashboardCache.get(timeframe));

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      setLoading(true);
      const next = await getSalesDashboardData(timeframe, controller.signal);

      if (!active) {
        return;
      }

      setData(next);
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [timeframe]);

  const refresh = async () => {
    const next = await getSalesDashboardData(timeframe, undefined, true);
    setData(next);
  };

  return {
    ...data,
    loading,
    refresh,
  };
}

export function buildRevenueSeries(
  lines: SalesLine[],
  timeframe: SalesTimeframe | SalesRange,
  filter: SalesFilter,
  anchorDate: Date | null,
): RevenuePoint[] {
  const resolvedAnchorDate = anchorDate || new Date();
  const filteredLines = filterSalesLines(lines, filter);
  const currentWindows = buildBucketWindows(timeframe, resolvedAnchorDate);
  const previousWindows = buildBucketWindows(
    timeframe,
    resolvedAnchorDate,
    -getBucketConfig(timeframe).count,
    getBucketConfig(timeframe).unit,
  );
  const lastWeekWindows = buildBucketWindows(timeframe, resolvedAnchorDate, -7, "day");
  const lastYearWindows = buildBucketWindows(timeframe, resolvedAnchorDate, -1, "year");

  const current = currentWindows.map((window) =>
    Math.round(aggregateWindowValue(filteredLines, window, "revenue")),
  );
  const previous = previousWindows.map((window) =>
    Math.round(aggregateWindowValue(filteredLines, window, "revenue")),
  );
  const lastWeek = lastWeekWindows.map((window) =>
    Math.round(aggregateWindowValue(filteredLines, window, "revenue")),
  );
  const lastYear = lastYearWindows.map((window) =>
    Math.round(aggregateWindowValue(filteredLines, window, "revenue")),
  );
  const forecast = currentWindows.map((window) =>
    Math.round(aggregateWindowValue(filteredLines, window, "forecast")),
  );

  return currentWindows.map((window, index) => ({
    label: window.label,
    current: current[index] || 0,
    previous: previous[index] || 0,
    lastWeek: lastWeek[index] || 0,
    lastYear: lastYear[index] || 0,
    forecast: forecast[index] || 0,
  }));
}

export function buildComparisonSeries(
  lines: SalesLine[],
  timeframe: SalesTimeframe | SalesRange,
  filter: SalesFilter,
  anchorDate: Date | null,
  metric: "quantity" | "transactions",
): ComparisonPoint[] {
  const resolvedAnchorDate = anchorDate || new Date();
  const filteredLines = filterSalesLines(lines, filter);
  const currentWindows = buildBucketWindows(timeframe, resolvedAnchorDate);
  const previousWindows = buildBucketWindows(
    timeframe,
    resolvedAnchorDate,
    -getBucketConfig(timeframe).count,
    getBucketConfig(timeframe).unit,
  );

  return currentWindows.map((window, index) => ({
    label: window.label,
    current: Math.round(aggregateWindowValue(filteredLines, window, metric)),
    previous: Math.round(
      aggregateWindowValue(filteredLines, previousWindows[index], metric),
    ),
  }));
}

export function buildPerformanceData(
  lines: SalesLine[],
  timeframe: SalesTimeframe,
  filter: SalesFilter,
  anchorDate: Date | null,
  view: "category" | "product",
): PerformancePoint[] {
  const filteredLines = getTimeWindowLines(lines, timeframe, filter, anchorDate);

  return groupRevenueBy(filteredLines, view === "category" ? "category" : "product").map(
    ([name, revenue]) => ({
      name,
      revenue,
    }),
  );
}

export function buildDistributionData(
  lines: SalesLine[],
  timeframe: SalesTimeframe,
  filter: SalesFilter,
  anchorDate: Date | null,
  groupBy: "category" | "product" = "category",
): DistributionPoint[] {
  const filteredLines = getTimeWindowLines(lines, timeframe, filter, anchorDate);

  return buildDistributionPoints(
    groupRevenueBy(filteredLines, groupBy === "product" ? "product" : "category"),
  );
}

export function buildOrdersVsBasketSeries(
  lines: SalesLine[],
  timeframe: SalesRange,
  filter: SalesFilter,
  anchorDate: Date | null,
): OrdersVsBasketPoint[] {
  const resolvedAnchorDate = anchorDate || new Date();
  const filteredLines = filterSalesLines(lines, filter);
  const windows = buildBucketWindows(timeframe, resolvedAnchorDate);

  return windows.map((window) => {
    const bucketLines = filteredLines.filter(
      (line) => line.createdAt >= window.start && line.createdAt < window.end,
    );
    const orderCount = bucketLines.reduce((sum, line) => sum + line.transactionCount, 0);
    const units = bucketLines.reduce((sum, line) => sum + line.quantity, 0);

    return {
      label: window.label,
      orders: orderCount,
      basketSize: Number(safeDivide(units, Math.max(orderCount, 1)).toFixed(1)),
    };
  });
}

export function buildHeatmap(
  lines: SalesLine[],
  filter: SalesFilter,
  anchorDate: Date | null,
  horizonDays = 56,
) {
  const resolvedAnchorDate = anchorDate || new Date();
  const startDate = addUnit(startOfDay(resolvedAnchorDate), "day", -horizonDays);
  const filteredLines = filterSalesLines(lines, filter).filter(
    (line) => line.createdAt >= startDate && line.createdAt <= resolvedAnchorDate,
  );

  return buildHeatmapRows(filteredLines);
}

export function buildInsightAlerts(
  revenueSeries: RevenuePoint[],
  heatmap: HeatmapRow[],
): InsightAlert[] {
  const changePoints = revenueSeries.map((point) => {
    const change = safeDivide(point.current - point.previous, Math.max(point.previous, 1)) * 100;

    return {
      label: point.label,
      change,
    };
  });

  const largestDrop = [...changePoints]
    .filter((point) => point.change < 0)
    .sort((left, right) => left.change - right.change)[0];
  const largestSpike = [...changePoints]
    .filter((point) => point.change > 0)
    .sort((left, right) => right.change - left.change)[0];

  const dayTotals = heatmap.map((row) => ({
    day: row.day,
    total: row.values.reduce((sum, value) => sum + value, 0),
  }));
  const weekendTotal =
    (dayTotals.find((row) => row.day === "Sat")?.total || 0) +
    (dayTotals.find((row) => row.day === "Sun")?.total || 0);
  const totalHeatmapValue = dayTotals.reduce((sum, row) => sum + row.total, 0);
  const weekendShare = safeDivide(weekendTotal, Math.max(totalHeatmapValue, 1)) * 100;

  const alerts: InsightAlert[] = [];

  if (largestDrop) {
    alerts.push({
      type: "drop",
      title: `${largestDrop.label} revenue drop`,
      delta: `${largestDrop.change.toFixed(1)}%`,
      detail: "Revenue is below the previous comparable period for this bucket.",
    });
  }

  if (largestSpike) {
    alerts.push({
      type: "spike",
      title: `${largestSpike.label} revenue spike`,
      delta: `+${largestSpike.change.toFixed(1)}%`,
      detail: "Revenue is running ahead of the previous comparable period.",
    });
  }

  alerts.push({
    type: "pattern",
    title: weekendShare >= 30 ? "Weekend mix is elevated" : "Weekend mix is muted",
    delta: `${weekendShare.toFixed(1)}%`,
    detail: `Weekend periods contribute ${weekendShare.toFixed(1)}% of the recent heatmap value.`,
  });

  return alerts;
}

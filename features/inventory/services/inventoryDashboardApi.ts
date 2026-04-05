"use client";
import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { formatCurrencyTHB } from "@/lib/formatters/currency";
import {
  BACKGROUND_REVALIDATION_STALE_TIME_MS,
  DEFAULT_QUERY_GC_TIME_MS,
} from "@/lib/api/reactQuery";
import {
  fetchAllBackendQueryRows,
  fetchAllBackendTableRows,
  fetchBackendJson,
  getBackendBaseUrl,
  normalizeRows,
  pickArray,
  pickNumber,
  pickString,
  safeDivide,
  slugify,
  type BackendRow,
} from "@/lib/api/riosBackend";

export type InventoryMetric = {
  label: string;
  value: string;
  tone?: "default" | "alert";
  info?: string;
};

export type InventoryKpiTimeframe = "today" | "7d" | "30d";

export type InventoryRateDayFilter = {
  days: number;
  mode: "custom" | "today";
};

export type InventoryValueRecord = {
  product: string;
  category: string;
  brand: string;
  value: number;
  shelfShare: number;
};

export type InventoryChartDatum = {
  name: string;
  value: number;
  percent: number;
  color: string;
};

export type InventorySnapshot = {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  stock: number;
  reorder: number;
  demand: number;
  velocity: number;
  inventoryScore: number;
  demandScore: number;
  nlpScore: number;
  holdingValue: number;
  shelfUnits: number;
  shelfValue: number;
  unitPrice: number;
  costPrice: number;
  supplierId: number | string;
};

export type ReplenishmentItem = {
  productId: string;
  product: string;
  supplierId: string;
  brand: string;
  currentStock: number;
  avgDailySales: number;
  leadTimeDays: number;
  safetyStock: number;
  onOrder: number;
  status: "pending" | "ordered" | "delivered";
  recommendedOrder: number;
  priority: "high" | "medium" | "low";
  inventoryScore: number;
};

export type InventoryDashboardData = {
  baseUrl: string;
  analyticsError: string | null;
  replenishmentError: string | null;
  metrics: InventoryMetric[];
  charts: {
    product: InventoryChartDatum[];
    category: InventoryChartDatum[];
    brand: InventoryChartDatum[];
  };
  shelfRatio: InventoryChartDatum[];
  records: InventoryValueRecord[];
  snapshots: InventorySnapshot[];
  replenishment: ReplenishmentItem[];
  replenishmentSummary: {
    ordersToPlace: number;
    pending: number;
    toReceive: number;
  };
};

type InventoryAnalyticsData = Pick<
  InventoryDashboardData,
  "analyticsError" | "baseUrl" | "charts" | "metrics"
>;

type InventoryKpiData = Pick<
  InventoryDashboardData,
  "analyticsError" | "baseUrl" | "metrics"
>;

type InventoryStaticKpiData = Pick<
  InventoryDashboardData,
  "analyticsError" | "baseUrl" | "metrics"
>;

type InventoryRateKpiData = Pick<
  InventoryDashboardData,
  "analyticsError" | "baseUrl" | "metrics"
>;

type InventoryChartData = Pick<
  InventoryDashboardData,
  "baseUrl" | "charts"
> & {
  analyticsError: string | null;
};

type InventoryShelfRatioData = Pick<
  InventoryDashboardData,
  "baseUrl" | "shelfRatio"
> & {
  shelfRatioError: string | null;
};

type InventorySnapshotData = Pick<
  InventoryDashboardData,
  "baseUrl" | "records" | "shelfRatio" | "snapshots"
> & {
  snapshotError: string | null;
};

type InventoryReplenishmentData = Pick<
  InventoryDashboardData,
  "baseUrl" | "replenishment" | "replenishmentError" | "replenishmentSummary"
>;

type ProductRecord = {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  unitPrice: number;
  costPrice: number;
  supplierId: string;
};

export const INVENTORY_ANALYTICS_QUERY_KEY = [
  "inventory-dashboard",
  "analytics",
] as const;
export const INVENTORY_KPI_QUERY_KEY = [
  "inventory-dashboard",
  "kpi",
] as const;
export const INVENTORY_STATIC_KPI_QUERY_KEY = [
  "inventory-dashboard",
  "kpi",
  "static",
] as const;
export const INVENTORY_RATE_KPI_QUERY_KEY = [
  "inventory-dashboard",
  "kpi",
  "rate",
] as const;
export const INVENTORY_SHELF_RATIO_QUERY_KEY = [
  "inventory-dashboard",
  "shelf-ratio",
] as const;
export const INVENTORY_SNAPSHOT_QUERY_KEY = [
  "inventory-dashboard",
  "snapshot",
] as const;
export const INVENTORY_REPLENISHMENT_QUERY_KEY = [
  "inventory-dashboard",
  "replenishment",
] as const;

const FALLBACK_LEAD_TIME_DAYS = 3;
const CHART_COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

export const INVENTORY_KPI_TIMEFRAME_OPTIONS: Array<{
  label: string;
  value: InventoryKpiTimeframe;
}> = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
];

function createEmptyInventoryAnalyticsData(): InventoryAnalyticsData {
  return {
    baseUrl: getBackendBaseUrl(),
    analyticsError: null,
    metrics: [],
    charts: {
      product: [],
      category: [],
      brand: [],
    },
  };
}

function createEmptyInventoryKpiData(): InventoryKpiData {
  return {
    analyticsError: null,
    baseUrl: getBackendBaseUrl(),
    metrics: [],
  };
}

function createEmptyInventorySnapshotData(): InventorySnapshotData {
  return {
    baseUrl: getBackendBaseUrl(),
    records: [],
    shelfRatio: [],
    snapshotError: null,
    snapshots: [],
  };
}

function createEmptyInventoryShelfRatioData(): InventoryShelfRatioData {
  return {
    baseUrl: getBackendBaseUrl(),
    shelfRatio: [],
    shelfRatioError: null,
  };
}

function createEmptyInventoryReplenishmentData(): InventoryReplenishmentData {
  return {
    baseUrl: getBackendBaseUrl(),
    replenishment: [],
    replenishmentError: null,
    replenishmentSummary: {
      ordersToPlace: 0,
      pending: 0,
      toReceive: 0,
    },
  };
}

function hasInventoryAnalyticsData(data: InventoryAnalyticsData) {
  return (
    data.metrics.length > 0 ||
    Object.values(data.charts).some((rows) => rows.length > 0)
  );
}

function hasInventoryKpiData(data: InventoryKpiData) {
  return data.metrics.length > 0;
}

function hasInventorySnapshotData(data: InventorySnapshotData) {
  return (
    data.records.length > 0 ||
    data.shelfRatio.length > 0 ||
    data.snapshots.length > 0
  );
}

function hasInventoryShelfRatioData(data: InventoryShelfRatioData) {
  return data.shelfRatio.length > 0;
}

function formatCurrency(value: number) {
  return formatCurrencyTHB(value);
}

function extractPackSize(productName: string) {
  const match = productName.match(/x\s*(\d{1,3})(?!.*x\s*\d)/i);
  const parsed = match ? Number(match[1]) : 1;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeShare(score: number) {
  if (!Number.isFinite(score) || score <= 0) {
    return 0;
  }

  return score > 1 ? score / 100 : score;
}

function normalizePercent(score: number) {
  return normalizeShare(score) * 100;
}

function normalizeRateFilterDays(days: number) {
  if (!Number.isFinite(days)) {
    return 1;
  }

  return Math.max(1, Math.round(days));
}

function getInventoryRateFilterParams(filter: InventoryRateDayFilter) {
  if (filter.mode === "today") {
    return {
      days: 1,
      label: "Today",
      searchParams: new URLSearchParams({ date_scope: "today" }),
    };
  }

  const normalizedDays = normalizeRateFilterDays(filter.days);

  return {
    days: normalizedDays,
    label: `Last ${normalizedDays} days`,
    searchParams: new URLSearchParams({
      date_scope: "past_days",
      days: String(normalizedDays),
    }),
  };
}

function getInventoryKpiDateParams(timeframe: InventoryKpiTimeframe) {
  if (timeframe === "today") {
    return {
      days: 1,
      label: "Today",
      searchParams: new URLSearchParams({ date_scope: "today" }),
    };
  }

  if (timeframe === "7d") {
    return {
      days: 7,
      label: "Last 7 days",
      searchParams: new URLSearchParams({
        date_scope: "past_days",
        days: "7",
      }),
    };
  }

  return {
    days: 30,
    label: "Last 30 days",
    searchParams: new URLSearchParams({
      date_scope: "past_days",
      days: "30",
    }),
  };
}

function normalizeProductRow(row: BackendRow): ProductRecord | null {
  const productId = pickString(row, ["product_id", "id"]);
  const productName = pickString(row, ["product_name", "name"]);

  if (!productId || !productName) {
    return null;
  }

  const brand = pickString(row, ["brand", "brand_name"], "Unbranded");
  const category = pickString(
    row,
    ["category", "category_name", "category_id"],
    "Uncategorized",
  );
  const supplierId =
    pickString(row, ["supplier_id", "supplierId"]) ||
    `SUP-${slugify(brand || productId).toUpperCase()}`;

  return {
    productId,
    productName,
    brand,
    category,
    unitPrice: pickNumber(row, ["unit_price", "price", "selling_price"]),
    costPrice: pickNumber(row, ["cost_price", "unit_cost", "purchase_price"]),
    supplierId,
  };
}

function normalizeOrderRows(payload: unknown) {
  return normalizeRows<BackendRow>(payload);
}

function extractOrderItemRows(orderRows: BackendRow[]) {
  return orderRows.flatMap((row) =>
    pickArray<BackendRow>(row, [
      "items",
      "order_items",
      "purchase_order_items",
    ]),
  );
}

function getOrderStatus(row: BackendRow) {
  return pickString(row, ["status", "order_status"]).toUpperCase();
}

function mapReplenishmentStatus(status: string): ReplenishmentItem["status"] {
  if (
    status === "ORDERED" ||
    status === "PARTIALLY_RECEIVED" ||
    status === "CREATED"
  ) {
    return "ordered";
  }

  if (status === "RECEIVED" || status === "DELIVERED") {
    return "delivered";
  }

  return "pending";
}

function computeInventoryScore(stock: number, reorder: number) {
  if (reorder <= 0) {
    return stock === 0 ? 100 : 0;
  }

  return Math.min(
    100,
    Math.round(Math.max(0, (reorder - stock) / Math.max(reorder, 1)) * 100),
  );
}

function getInventoryChartRows(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload as BackendRow[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as BackendRow;
  const slices = pickArray<BackendRow>(record, [
    "slices",
    "rows",
    "data",
    "items",
    "results",
  ]);

  if (slices.length > 0) {
    return slices;
  }

  return normalizeRows<BackendRow>(payload);
}

function buildInventoryChart(payload: unknown) {
  const rows = getInventoryChartRows(payload);
  const normalized = rows
    .map((row, index) => ({
      name:
        pickString(row, [
          "label",
          "name",
          "product_name",
          "category_name",
          "brand",
          "category",
        ]) || `Slice ${index + 1}`,
      value: pickNumber(row, ["value", "current_value", "holding_value"]),
      ratio: normalizeShare(pickNumber(row, ["ratio", "share", "percent"])),
    }))
    .filter((item) => item.value > 0);

  const totalValue = normalized.reduce((sum, item) => sum + item.value, 0);

  return normalized.map((item, index) => ({
    name: item.name,
    value: item.value,
    percent:
      item.ratio > 0
        ? item.ratio * 100
        : totalValue === 0
          ? 0
          : safeDivide(item.value, totalValue) * 100,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

function buildInventoryStandardMetrics({
  assortmentPayload,
  categoryMixPayload,
  valuePayload,
}: {
  assortmentPayload: BackendRow;
  categoryMixPayload: BackendRow;
  valuePayload: BackendRow;
}) {
  const totalValue = pickNumber(valuePayload, [
    "total_inventory_value",
    "total_value",
    "inventory_value",
    "value",
  ]);
  const totalQuantityOnHand = pickNumber(valuePayload, [
    "total_quantity_on_hand",
    "quantity_on_hand",
    "inventory_quantity",
  ]);
  const productsInScope = pickNumber(valuePayload, ["item_count", "product_count"]);
  const assortmentAvailabilityRate = normalizePercent(
    pickNumber(assortmentPayload, ["value", "availability_rate", "rate"]),
  );
  const availableProductCount = pickNumber(assortmentPayload, [
    "available_product_count",
  ]);
  const unavailableProductCount = pickNumber(assortmentPayload, [
    "unavailable_product_count",
  ]);
  const categoryMixRowsSource =
    pickArray<BackendRow>(categoryMixPayload, ["categories"]).length > 0
      ? pickArray<BackendRow>(categoryMixPayload, ["categories"])
      : normalizeRows<BackendRow>(categoryMixPayload);
  const categoryMixRows = categoryMixRowsSource
    .map((row) => ({
      category: pickString(
        row,
        ["category_name", "category", "label"],
        "Unknown",
      ),
      ratio: normalizeShare(pickNumber(row, ["ratio", "share", "percent"])),
      value: pickNumber(row, ["current_value", "value", "holding_value"]),
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 3);

  const mixRatio = categoryMixRows.length
    ? categoryMixRows
        .map((item) => Math.max(0, Math.round(item.ratio * 100)))
        .join(" : ")
    : "0 : 0 : 0";

  const mixInfo = categoryMixRows.length
    ? categoryMixRows
        .map((item) => `${item.category} ${(item.ratio * 100).toFixed(1)}%`)
        .join(" | ")
    : "No category mix data is available.";

  return [
    {
      label: "Inventory Value",
      value: formatCurrency(totalValue),
      info: `${totalQuantityOnHand.toLocaleString()} units across ${productsInScope.toLocaleString()} products currently in scope.`,
    },
    {
      label: "Assortment Availability Rate",
      value: `${assortmentAvailabilityRate.toFixed(1)}%`,
      tone:
        assortmentAvailabilityRate < 95
          ? ("alert" as const)
          : ("default" as const),
      info: `${availableProductCount.toLocaleString()} available, ${unavailableProductCount.toLocaleString()} unavailable products in scope.`,
    },
    {
      label: "Category Mix Ratio",
      value: mixRatio,
      info: `Top categories by current value: ${mixInfo}`,
    },
  ];
}

function buildInventoryRateMetrics({
  filterLabel,
  days,
  overstockPayload,
  turnoverPayload,
}: {
  filterLabel: string;
  days: number;
  overstockPayload: BackendRow;
  turnoverPayload: BackendRow;
}) {
  const turnoverRate = pickNumber(turnoverPayload, ["turnover_rate", "value"]);
  const overstockRate = normalizePercent(
    pickNumber(overstockPayload, ["value", "overstock_rate", "rate"]),
  );

  return [
    {
      label: "Turnover Rate",
      value: `${turnoverRate.toFixed(1)}x`,
      info: `Based on ${filterLabel.toLowerCase()} inventory movement.`,
    },
    {
      label: "Overstock %",
      value: `${overstockRate.toFixed(1)}%`,
      tone: overstockRate > 20 ? ("alert" as const) : ("default" as const),
      info: `Calculated across ${days.toLocaleString()} day${days === 1 ? "" : "s"} of inventory activity.`,
    },
  ];
}

function buildInventoryMetrics({
  valuePayload,
  assortmentPayload,
  categoryMixPayload,
  overstockPayload,
  timeframe,
  turnoverPayload,
}: {
  assortmentPayload: BackendRow;
  valuePayload: BackendRow;
  categoryMixPayload: BackendRow;
  overstockPayload: BackendRow;
  timeframe: InventoryKpiTimeframe;
  turnoverPayload: BackendRow;
}) {
  const timeframeConfig = getInventoryKpiDateParams(timeframe);
  const standardMetrics = buildInventoryStandardMetrics({
    assortmentPayload,
    categoryMixPayload,
    valuePayload,
  });
  const rateMetrics = buildInventoryRateMetrics({
    days: timeframeConfig.days,
    filterLabel: timeframeConfig.label,
    overstockPayload,
    turnoverPayload,
  });

  return [
    standardMetrics[0],
    rateMetrics[0],
    standardMetrics[1],
    rateMetrics[1],
    standardMetrics[2],
  ];
}

function buildInventoryShelfRatio(payload: BackendRow) {
  const inventoryValue = pickNumber(payload, ["inventory_value"]);
  const shelfValue = pickNumber(payload, ["shelf_value"]);
  const totalValue = pickNumber(payload, ["total_value"]);
  const inventoryRatio = normalizePercent(
    pickNumber(payload, ["inventory_ratio"]),
  );
  const shelfRatio = normalizePercent(pickNumber(payload, ["shelf_ratio"]));

  return [
    {
      name: "In Inventory",
      value: inventoryValue,
      percent:
        inventoryRatio > 0
          ? inventoryRatio
          : totalValue === 0
            ? 0
            : safeDivide(inventoryValue, totalValue) * 100,
      color: "#2563eb",
    },
    {
      name: "On Shelf",
      value: shelfValue,
      percent:
        shelfRatio > 0
          ? shelfRatio
          : totalValue === 0
            ? 0
            : safeDivide(shelfValue, totalValue) * 100,
      color: "#0f766e",
    },
  ];
}

function buildShelfRatio(records: InventoryValueRecord[]) {
  const totalValue = records.reduce((total, item) => total + item.value, 0);
  const onShelfValue = records.reduce(
    (total, item) => total + item.value * item.shelfShare,
    0,
  );
  const inInventoryValue = Math.max(0, totalValue - onShelfValue);

  return [
    {
      name: "On Shelf",
      value: onShelfValue,
      percent: totalValue === 0 ? 0 : (onShelfValue / totalValue) * 100,
      color: "#0f766e",
    },
    {
      name: "In Inventory",
      value: inInventoryValue,
      percent: totalValue === 0 ? 0 : (inInventoryValue / totalValue) * 100,
      color: "#2563eb",
    },
  ];
}

function buildInventorySnapshots({
  inventoryRows,
  productRows,
  salesRows,
  shelfRows,
}: {
  inventoryRows: BackendRow[];
  productRows: BackendRow[];
  salesRows: BackendRow[];
  shelfRows: BackendRow[];
}) {
  const products = productRows
    .map(normalizeProductRow)
    .filter((product): product is ProductRecord => Boolean(product));
  const productById = new Map(
    products.map((product) => [product.productId, product]),
  );

  const inventoryByProductId = new Map(
    inventoryRows
      .map((row) => ({
        productId: pickString(row, ["product_id"]),
        quantityOnHand: pickNumber(row, [
          "quantity_on_hand",
          "stock",
          "quantity",
        ]),
        reorderLevel: pickNumber(row, ["reorder_level", "min_stock"]),
      }))
      .filter((row) => Boolean(row.productId))
      .map((row) => [row.productId, row]),
  );

  const demandByProductId = new Map(
    salesRows
      .map((row) => ({
        productId: pickString(row, ["product_id"]),
        demand: pickNumber(row, ["demand", "sum_quantity"]),
      }))
      .filter((row) => Boolean(row.productId))
      .map((row) => [row.productId, row.demand]),
  );

  const shelfUnitsByProductId = new Map<string, number>();

  shelfRows.forEach((row) => {
    const productId = pickString(row, ["product_id"]);

    if (!productId) {
      return;
    }

    shelfUnitsByProductId.set(
      productId,
      (shelfUnitsByProductId.get(productId) || 0) +
        pickNumber(row, ["total_items"], 0),
    );
  });

  const productIds = new Set<string>([
    ...products.map((item) => item.productId),
    ...Array.from(inventoryByProductId.keys()),
    ...Array.from(demandByProductId.keys()),
    ...Array.from(shelfUnitsByProductId.keys()),
  ]);

  const snapshots = Array.from(productIds)
    .map<InventorySnapshot | null>((productId) => {
      const product = productById.get(productId);
      const inventory = inventoryByProductId.get(productId);
      const stock = inventory?.quantityOnHand ?? 0;
      const demand = demandByProductId.get(productId) || 0;
      const shelfUnits = shelfUnitsByProductId.get(productId) || 0;

      if (!product && !inventory) {
        return null;
      }

      const productName = product?.productName || productId;
      const brand = product?.brand || "Unbranded";
      const category = product?.category || "Uncategorized";
      const unitPrice = product?.unitPrice || product?.costPrice || 0;
      const costPrice = product?.costPrice || product?.unitPrice || 0;
      const packSize = extractPackSize(productName);
      const holdingValue = stock * (costPrice || unitPrice || 1);
      const shelfValue =
        shelfUnits *
        safeDivide(
          unitPrice || costPrice || 1,
          packSize,
          unitPrice || costPrice || 1,
        );

      return {
        productId,
        productName,
        brand,
        category,
        stock,
        reorder: inventory?.reorderLevel ?? 0,
        demand,
        velocity: demand / 30,
        inventoryScore: computeInventoryScore(
          stock,
          inventory?.reorderLevel ?? 0,
        ),
        demandScore: 0,
        nlpScore: 0,
        holdingValue,
        shelfUnits,
        shelfValue,
        unitPrice,
        costPrice,
        supplierId:
          product?.supplierId ||
          `SUP-${slugify(brand || productId).toUpperCase()}`,
      };
    })
    .filter((item): item is InventorySnapshot => Boolean(item))
    .sort((left, right) => right.holdingValue - left.holdingValue);

  const records = snapshots
    .map<InventoryValueRecord>((item) => {
      const totalValue = item.holdingValue + item.shelfValue;

      return {
        product: item.productName,
        category: item.category,
        brand: item.brand,
        value: totalValue,
        shelfShare: totalValue === 0 ? 0 : item.shelfValue / totalValue,
      };
    })
    .filter((item) => item.value > 0);

  return {
    records,
    shelfRatio: buildShelfRatio(records),
    snapshots,
  };
}

function buildReplenishmentPlan(
  snapshots: InventorySnapshot[],
  orderRows: BackendRow[],
  orderItemRows: BackendRow[],
) {
  const orderStatusById = new Map(
    orderRows
      .map(
        (row) =>
          [pickString(row, ["order_id", "id"]), getOrderStatus(row)] as const,
      )
      .filter(([orderId]) => Boolean(orderId)),
  );

  const onOrderByProductId = new Map<string, number>();
  const openStatusByProductId = new Map<string, string>();

  orderItemRows.forEach((row) => {
    const orderId = pickString(row, ["order_id"]);
    const productId = pickString(row, ["product_id"]);

    if (!orderId || !productId) {
      return;
    }

    const status =
      orderStatusById.get(orderId) ||
      pickString(row, ["line_status"], "ORDERED").toUpperCase();

    if (
      !["ORDERED", "PARTIALLY_RECEIVED", "CREATED", "PENDING"].includes(status)
    ) {
      return;
    }

    const ordered = pickNumber(row, ["quantity_ordered"], 0);
    const received = pickNumber(row, ["quantity_received"], 0);
    const outstanding = Math.max(0, ordered - received);

    onOrderByProductId.set(
      productId,
      (onOrderByProductId.get(productId) || 0) + outstanding,
    );

    if (!openStatusByProductId.has(productId)) {
      openStatusByProductId.set(productId, status);
    }
  });

  const replenishment = snapshots
    .map<ReplenishmentItem>((item) => {
      const onOrder = onOrderByProductId.get(item.productId) || 0;
      const avgDailySales = Number((item.demand / 30).toFixed(2));
      const emergencyStock =
        item.stock === 0 && item.inventoryScore >= 80 ? 1 : 0;
      const safetyStock = Math.max(
        item.reorder,
        Math.ceil(avgDailySales * 3),
        emergencyStock,
      );
      const recommendedOrder = Math.max(
        0,
        Math.ceil(
          avgDailySales * FALLBACK_LEAD_TIME_DAYS +
            safetyStock -
            item.stock -
            onOrder,
        ),
      );
      const openStatus = openStatusByProductId.get(item.productId);
      const status =
        onOrder > 0
          ? mapReplenishmentStatus(openStatus || "ORDERED")
          : recommendedOrder > 0
            ? "pending"
            : "delivered";

      let priority: ReplenishmentItem["priority"] = "low";

      if (
        item.inventoryScore >= 80 ||
        item.stock <= Math.max(1, Math.floor(safetyStock * 0.5))
      ) {
        priority = "high";
      } else if (item.inventoryScore >= 50 || item.stock <= safetyStock) {
        priority = "medium";
      }

      return {
        productId: item.productId,
        product: item.productName,
        supplierId: String(item.supplierId),
        brand: item.brand,
        currentStock: item.stock,
        avgDailySales,
        leadTimeDays: FALLBACK_LEAD_TIME_DAYS,
        safetyStock,
        onOrder,
        status,
        recommendedOrder,
        priority,
        inventoryScore: item.inventoryScore,
      };
    })
    .filter((item) => item.recommendedOrder > 0 || item.onOrder > 0)
    .sort((left, right) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };

      return priorityOrder[left.priority] - priorityOrder[right.priority];
    });

  return {
    replenishment,
    summary: {
      ordersToPlace: replenishment.filter(
        (item) => item.recommendedOrder > 0 && item.status === "pending",
      ).length,
      pending: replenishment.filter((item) => item.status === "pending").length,
      toReceive: replenishment.filter((item) => item.status === "ordered")
        .length,
    },
  };
}

async function fetchInventoryAnalyticsData(
  signal?: AbortSignal,
): Promise<InventoryAnalyticsData> {
  const [kpiData, chartData] = await Promise.all([
    fetchInventoryKpiData("today", signal),
    fetchInventoryChartData(signal),
  ]);

  return {
    analyticsError: kpiData.analyticsError || chartData.analyticsError,
    baseUrl: getBackendBaseUrl(),
    charts: chartData.charts,
    metrics: kpiData.metrics,
  };
}

async function fetchInventoryStaticKpiData(
  signal?: AbortSignal,
): Promise<InventoryStaticKpiData> {
  const todayParams = getInventoryRateFilterParams({
    days: 1,
    mode: "today",
  }).searchParams;
  const [valueResponse, assortmentResponse, categoryMixResponse] =
    await Promise.all([
      fetchBackendJson("/inventory/analytics/value", signal),
      fetchBackendJson(
        `/inventory/analysis/assortment-availability-rate?${todayParams.toString()}`,
        signal,
      ),
      fetchBackendJson("/inventory/analysis/category-mix-ratio", signal),
    ]);

  const analyticsError =
    valueResponse.error ||
    assortmentResponse.error ||
    categoryMixResponse.error ||
    null;
  const valuePayload =
    valueResponse.data && typeof valueResponse.data === "object"
      ? (valueResponse.data as BackendRow)
      : {};
  const assortmentPayload =
    assortmentResponse.data && typeof assortmentResponse.data === "object"
      ? (assortmentResponse.data as BackendRow)
      : {};
  const categoryMixPayload =
    categoryMixResponse.data && typeof categoryMixResponse.data === "object"
      ? (categoryMixResponse.data as BackendRow)
      : {};
  const hasAnalyticsSourceData =
    Boolean(valueResponse.data) ||
    Boolean(assortmentResponse.data) ||
    Boolean(categoryMixResponse.data);

  if (analyticsError && !hasAnalyticsSourceData) {
    throw new Error(analyticsError);
  }

  return {
    analyticsError,
    baseUrl: getBackendBaseUrl(),
    metrics: buildInventoryStandardMetrics({
      assortmentPayload,
      categoryMixPayload,
      valuePayload,
    }),
  };
}

async function fetchInventoryRateKpiData(
  filter: InventoryRateDayFilter,
  signal?: AbortSignal,
): Promise<InventoryRateKpiData> {
  const filterParams = getInventoryRateFilterParams(filter);
  const [ratesResponse, overstockResponse] = await Promise.all([
    fetchBackendJson(
      `/inventory/analytics/rates?${filterParams.searchParams.toString()}`,
      signal,
    ),
    fetchBackendJson(
      `/inventory/analysis/overstock-percentage?${filterParams.searchParams.toString()}`,
      signal,
    ),
  ]);

  const analyticsError =
    ratesResponse.error ||
    overstockResponse.error ||
    null;
  const ratesPayload =
    ratesResponse.data && typeof ratesResponse.data === "object"
      ? (ratesResponse.data as BackendRow)
      : {};
  const overstockPayload =
    overstockResponse.data && typeof overstockResponse.data === "object"
      ? (overstockResponse.data as BackendRow)
      : {};
  const hasAnalyticsSourceData =
    Boolean(ratesResponse.data) ||
    Boolean(overstockResponse.data);

  if (analyticsError && !hasAnalyticsSourceData) {
    throw new Error(analyticsError);
  }

  return {
    analyticsError,
    baseUrl: getBackendBaseUrl(),
    metrics: buildInventoryRateMetrics({
      days: filterParams.days,
      filterLabel: filterParams.label,
      overstockPayload,
      turnoverPayload: ratesPayload,
    }),
  };
}

async function fetchInventoryKpiData(
  timeframe: InventoryKpiTimeframe,
  signal?: AbortSignal,
): Promise<InventoryKpiData> {
  const timeframeParams = getInventoryKpiDateParams(timeframe).searchParams;
  const [
    valueResponse,
    ratesResponse,
    assortmentResponse,
    overstockResponse,
    categoryMixResponse,
  ] = await Promise.all([
    fetchBackendJson("/inventory/analytics/value", signal),
    fetchBackendJson(
      `/inventory/analytics/rates?${timeframeParams.toString()}`,
      signal,
    ),
    fetchBackendJson(
      `/inventory/analysis/assortment-availability-rate?${timeframeParams.toString()}`,
      signal,
    ),
    fetchBackendJson(
      `/inventory/analysis/overstock-percentage?${timeframeParams.toString()}`,
      signal,
    ),
    fetchBackendJson("/inventory/analysis/category-mix-ratio", signal),
  ]);

  const analyticsError =
    valueResponse.error ||
    ratesResponse.error ||
    assortmentResponse.error ||
    overstockResponse.error ||
    categoryMixResponse.error ||
    null;

  const valuePayload =
    valueResponse.data && typeof valueResponse.data === "object"
      ? (valueResponse.data as BackendRow)
      : {};
  const ratesPayload =
    ratesResponse.data && typeof ratesResponse.data === "object"
      ? (ratesResponse.data as BackendRow)
      : {};
  const assortmentPayload =
    assortmentResponse.data && typeof assortmentResponse.data === "object"
      ? (assortmentResponse.data as BackendRow)
      : {};
  const overstockPayload =
    overstockResponse.data && typeof overstockResponse.data === "object"
      ? (overstockResponse.data as BackendRow)
      : {};
  const categoryMixPayload =
    categoryMixResponse.data && typeof categoryMixResponse.data === "object"
      ? (categoryMixResponse.data as BackendRow)
      : {};
  const hasAnalyticsSourceData =
    Boolean(valueResponse.data) ||
    Boolean(ratesResponse.data) ||
    Boolean(assortmentResponse.data) ||
    Boolean(overstockResponse.data) ||
    Boolean(categoryMixResponse.data);

  if (analyticsError && !hasAnalyticsSourceData) {
    throw new Error(analyticsError);
  }

  return {
    analyticsError,
    baseUrl: getBackendBaseUrl(),
    metrics: buildInventoryMetrics({
      assortmentPayload,
      categoryMixPayload,
      overstockPayload,
      timeframe,
      turnoverPayload: ratesPayload,
      valuePayload,
    }),
  };
}

async function fetchInventoryChartData(
  signal?: AbortSignal,
): Promise<InventoryChartData> {
  const [categoryChartResponse, brandChartResponse, productChartResponse] =
    await Promise.all([
      fetchBackendJson("/inventory/charts/categories", signal),
      fetchBackendJson("/inventory/charts/brands", signal),
      fetchBackendJson("/inventory/charts/products", signal),
    ]);

  const analyticsError =
    categoryChartResponse.error ||
    brandChartResponse.error ||
    productChartResponse.error ||
    null;
  const hasChartSourceData =
    Boolean(categoryChartResponse.data) ||
    Boolean(brandChartResponse.data) ||
    Boolean(productChartResponse.data);

  if (analyticsError && !hasChartSourceData) {
    throw new Error(analyticsError);
  }

  return {
    analyticsError,
    baseUrl: getBackendBaseUrl(),
    charts: {
      category: buildInventoryChart(categoryChartResponse.data),
      brand: buildInventoryChart(brandChartResponse.data),
      product: buildInventoryChart(productChartResponse.data),
    },
  };
}

async function fetchInventoryShelfRatioData(
  signal?: AbortSignal,
): Promise<InventoryShelfRatioData> {
  const shelfRatioResponse = await fetchBackendJson(
    "/inventory/analysis/inventory-shelf-ratio",
    signal,
  );
  const payload =
    shelfRatioResponse.data && typeof shelfRatioResponse.data === "object"
      ? (shelfRatioResponse.data as BackendRow)
      : {};

  if (shelfRatioResponse.error && !shelfRatioResponse.data) {
    throw new Error(shelfRatioResponse.error);
  }

  return {
    baseUrl: getBackendBaseUrl(),
    shelfRatio: buildInventoryShelfRatio(payload),
    shelfRatioError: shelfRatioResponse.error,
  };
}

async function fetchInventorySnapshotData(
  signal?: AbortSignal,
): Promise<InventorySnapshotData> {
  const [productResult, inventoryResult, salesResult, shelfResult] =
    await Promise.all([
      fetchAllBackendTableRows("Product", { signal }),
      fetchAllBackendTableRows("Inventory", { signal }),
      fetchAllBackendQueryRows({
        tableName: "Sales Transaction Item",
        groupBy: "product_id",
        aggregates: ["sum:quantity:demand"],
        signal,
      }),
      fetchAllBackendTableRows("Shelf Product", { signal }),
    ]);

  const snapshotError =
    productResult.error ||
    inventoryResult.error ||
    salesResult.error ||
    shelfResult.error ||
    null;
  const hasSnapshotSourceData =
    productResult.rows.length > 0 ||
    inventoryResult.rows.length > 0 ||
    salesResult.rows.length > 0 ||
    shelfResult.rows.length > 0;

  if (snapshotError && !hasSnapshotSourceData) {
    throw new Error(snapshotError);
  }

  return {
    baseUrl: getBackendBaseUrl(),
    snapshotError,
    ...buildInventorySnapshots({
      inventoryRows: inventoryResult.rows,
      productRows: productResult.rows,
      salesRows: salesResult.rows,
      shelfRows: shelfResult.rows,
    }),
  };
}

async function fetchInventoryReplenishmentData(
  queryClient: QueryClient,
  signal?: AbortSignal,
): Promise<InventoryReplenishmentData> {
  const [snapshotData, orderResponse] = await Promise.all([
    queryClient.ensureQueryData({
      ...getInventorySnapshotQueryOptions(),
      revalidateIfStale: true,
    }),
    fetchBackendJson("/procurement/orders", signal),
  ]);
  const orderRows = normalizeOrderRows(orderResponse.data);
  const orderItemRows = extractOrderItemRows(orderRows);
  const replenishmentError =
    orderResponse.error || snapshotData.snapshotError || null;

  if (
    replenishmentError &&
    snapshotData.snapshots.length === 0 &&
    orderRows.length === 0
  ) {
    throw new Error(replenishmentError);
  }

  const { replenishment, summary } = buildReplenishmentPlan(
    snapshotData.snapshots,
    orderRows,
    orderItemRows,
  );

  return {
    baseUrl: getBackendBaseUrl(),
    replenishment,
    replenishmentError,
    replenishmentSummary: summary,
  };
}

export function getInventoryAnalyticsQueryOptions() {
  return {
    queryKey: INVENTORY_ANALYTICS_QUERY_KEY,
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchInventoryAnalyticsData(signal),
    staleTime: BACKGROUND_REVALIDATION_STALE_TIME_MS,
    gcTime: DEFAULT_QUERY_GC_TIME_MS,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  };
}

export function getInventoryKpiQueryOptions(timeframe: InventoryKpiTimeframe) {
  return {
    queryKey: [...INVENTORY_KPI_QUERY_KEY, timeframe] as const,
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchInventoryKpiData(timeframe, signal),
    staleTime: BACKGROUND_REVALIDATION_STALE_TIME_MS,
    gcTime: DEFAULT_QUERY_GC_TIME_MS,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  };
}

function getInventoryRateFilterQueryKey(filter: InventoryRateDayFilter) {
  if (filter.mode === "today") {
    return "today";
  }

  return `${normalizeRateFilterDays(filter.days)}d`;
}

export function getInventoryStaticKpiQueryOptions() {
  return {
    queryKey: INVENTORY_STATIC_KPI_QUERY_KEY,
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchInventoryStaticKpiData(signal),
    staleTime: BACKGROUND_REVALIDATION_STALE_TIME_MS,
    gcTime: DEFAULT_QUERY_GC_TIME_MS,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  };
}

export function getInventoryRateKpiQueryOptions(filter: InventoryRateDayFilter) {
  return {
    queryKey: [
      ...INVENTORY_RATE_KPI_QUERY_KEY,
      getInventoryRateFilterQueryKey(filter),
    ] as const,
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchInventoryRateKpiData(filter, signal),
    staleTime: BACKGROUND_REVALIDATION_STALE_TIME_MS,
    gcTime: DEFAULT_QUERY_GC_TIME_MS,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  };
}

export function getInventoryShelfRatioQueryOptions() {
  return {
    queryKey: INVENTORY_SHELF_RATIO_QUERY_KEY,
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchInventoryShelfRatioData(signal),
    staleTime: BACKGROUND_REVALIDATION_STALE_TIME_MS,
    gcTime: DEFAULT_QUERY_GC_TIME_MS,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  };
}

export function getInventorySnapshotQueryOptions() {
  return {
    queryKey: INVENTORY_SNAPSHOT_QUERY_KEY,
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchInventorySnapshotData(signal),
    staleTime: BACKGROUND_REVALIDATION_STALE_TIME_MS,
    gcTime: DEFAULT_QUERY_GC_TIME_MS,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  };
}

export function getInventoryReplenishmentQueryOptions(
  queryClient: QueryClient,
) {
  return {
    queryKey: INVENTORY_REPLENISHMENT_QUERY_KEY,
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      fetchInventoryReplenishmentData(queryClient, signal),
    staleTime: BACKGROUND_REVALIDATION_STALE_TIME_MS,
    gcTime: DEFAULT_QUERY_GC_TIME_MS,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  };
}

export function useInventoryAnalyticsData() {
  const analyticsQuery = useQuery(getInventoryAnalyticsQueryOptions());
  const analyticsData =
    analyticsQuery.data ?? createEmptyInventoryAnalyticsData();
  const analyticsQueryError =
    analyticsQuery.error instanceof Error ? analyticsQuery.error.message : null;
  const hasData = hasInventoryAnalyticsData(analyticsData);

  return {
    analyticsError: !hasData
      ? analyticsData.analyticsError ||
        (!analyticsQuery.data ? analyticsQueryError : null)
      : null,
    backgroundError: hasData
      ? analyticsData.analyticsError || analyticsQueryError
      : null,
    baseUrl: getBackendBaseUrl(),
    charts: analyticsData.charts,
    isFetching: analyticsQuery.isFetching,
    loading: !analyticsQuery.data && analyticsQuery.isPending,
    metrics: analyticsData.metrics,
    refresh: analyticsQuery.refetch,
  };
}

export function useInventoryKpiData(timeframe: InventoryKpiTimeframe) {
  const kpiQuery = useQuery(getInventoryKpiQueryOptions(timeframe));
  const kpiData = kpiQuery.data ?? createEmptyInventoryKpiData();
  const kpiQueryError =
    kpiQuery.error instanceof Error ? kpiQuery.error.message : null;
  const hasData = hasInventoryKpiData(kpiData);

  return {
    analyticsError: !hasData
      ? kpiData.analyticsError || (!kpiQuery.data ? kpiQueryError : null)
      : null,
    backgroundError: hasData ? kpiData.analyticsError || kpiQueryError : null,
    baseUrl: getBackendBaseUrl(),
    isFetching: kpiQuery.isFetching,
    loading: !kpiQuery.data && kpiQuery.isPending,
    metrics: kpiData.metrics,
    refresh: kpiQuery.refetch,
  };
}

export function useInventoryStaticKpiData() {
  const staticKpiQuery = useQuery(getInventoryStaticKpiQueryOptions());
  const staticKpiData =
    staticKpiQuery.data ?? createEmptyInventoryKpiData();
  const staticKpiQueryError =
    staticKpiQuery.error instanceof Error
      ? staticKpiQuery.error.message
      : null;
  const hasData = hasInventoryKpiData(staticKpiData);

  return {
    analyticsError: !hasData
      ? staticKpiData.analyticsError ||
        (!staticKpiQuery.data ? staticKpiQueryError : null)
      : null,
    backgroundError: hasData
      ? staticKpiData.analyticsError || staticKpiQueryError
      : null,
    baseUrl: getBackendBaseUrl(),
    isFetching: staticKpiQuery.isFetching,
    loading: !staticKpiQuery.data && staticKpiQuery.isPending,
    metrics: staticKpiData.metrics,
    refresh: staticKpiQuery.refetch,
  };
}

export function useInventoryRateKpiData(filter: InventoryRateDayFilter) {
  const rateKpiQuery = useQuery(getInventoryRateKpiQueryOptions(filter));
  const rateKpiData =
    rateKpiQuery.data ?? createEmptyInventoryKpiData();
  const rateKpiQueryError =
    rateKpiQuery.error instanceof Error ? rateKpiQuery.error.message : null;
  const hasData = hasInventoryKpiData(rateKpiData);

  return {
    analyticsError: !hasData
      ? rateKpiData.analyticsError ||
        (!rateKpiQuery.data ? rateKpiQueryError : null)
      : null,
    backgroundError: hasData
      ? rateKpiData.analyticsError || rateKpiQueryError
      : null,
    baseUrl: getBackendBaseUrl(),
    isFetching: rateKpiQuery.isFetching,
    loading: !rateKpiQuery.data && rateKpiQuery.isPending,
    metrics: rateKpiData.metrics,
    refresh: rateKpiQuery.refetch,
  };
}

export function useInventoryShelfRatioData() {
  const shelfRatioQuery = useQuery(getInventoryShelfRatioQueryOptions());
  const shelfRatioData =
    shelfRatioQuery.data ?? createEmptyInventoryShelfRatioData();
  const shelfRatioQueryError =
    shelfRatioQuery.error instanceof Error
      ? shelfRatioQuery.error.message
      : null;
  const hasData = hasInventoryShelfRatioData(shelfRatioData);

  return {
    backgroundError: hasData
      ? shelfRatioData.shelfRatioError || shelfRatioQueryError
      : null,
    baseUrl: getBackendBaseUrl(),
    isFetching: shelfRatioQuery.isFetching,
    loading: !shelfRatioQuery.data && shelfRatioQuery.isPending,
    refresh: shelfRatioQuery.refetch,
    shelfRatio: shelfRatioData.shelfRatio,
    shelfRatioError: !hasData
      ? shelfRatioData.shelfRatioError ||
        (!shelfRatioQuery.data ? shelfRatioQueryError : null)
      : null,
  };
}

export function useInventorySnapshotData() {
  const snapshotQuery = useQuery(getInventorySnapshotQueryOptions());
  const snapshotData = snapshotQuery.data ?? createEmptyInventorySnapshotData();
  const snapshotQueryError =
    snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null;
  const hasData = hasInventorySnapshotData(snapshotData);

  return {
    backgroundError: hasData
      ? snapshotData.snapshotError || snapshotQueryError
      : null,
    baseUrl: getBackendBaseUrl(),
    isFetching: snapshotQuery.isFetching,
    loading: !snapshotQuery.data && snapshotQuery.isPending,
    records: snapshotData.records,
    refresh: snapshotQuery.refetch,
    shelfRatio: snapshotData.shelfRatio,
    snapshotError: !hasData
      ? snapshotData.snapshotError ||
        (!snapshotQuery.data ? snapshotQueryError : null)
      : null,
    snapshots: snapshotData.snapshots,
  };
}

export function useInventoryDashboardData() {
  const queryClient = useQueryClient();
  const analyticsQuery = useQuery(getInventoryAnalyticsQueryOptions());
  const snapshotQuery = useQuery(getInventorySnapshotQueryOptions());
  const replenishmentQuery = useQuery(
    getInventoryReplenishmentQueryOptions(queryClient),
  );

  const analyticsData =
    analyticsQuery.data ?? createEmptyInventoryAnalyticsData();
  const snapshotData = snapshotQuery.data ?? createEmptyInventorySnapshotData();
  const replenishmentData =
    replenishmentQuery.data ?? createEmptyInventoryReplenishmentData();
  const analyticsQueryError =
    analyticsQuery.error instanceof Error ? analyticsQuery.error.message : null;
  const snapshotQueryError =
    snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null;
  const replenishmentQueryError =
    replenishmentQuery.error instanceof Error
      ? replenishmentQuery.error.message
      : null;

  return {
    analyticsError:
      analyticsData.analyticsError ||
      (!analyticsQuery.data ? analyticsQueryError : null),
    backgroundError:
      (analyticsQuery.data ? analyticsQueryError : null) ||
      (snapshotQuery.data ? snapshotQueryError : null) ||
      (replenishmentQuery.data ? replenishmentQueryError : null),
    baseUrl: getBackendBaseUrl(),
    charts: analyticsData.charts,
    isFetching:
      analyticsQuery.isFetching ||
      snapshotQuery.isFetching ||
      replenishmentQuery.isFetching,
    loading:
      (!analyticsQuery.data && analyticsQuery.isPending) ||
      (!snapshotQuery.data && snapshotQuery.isPending) ||
      (!replenishmentQuery.data && replenishmentQuery.isPending),
    metrics: analyticsData.metrics,
    records: snapshotData.records,
    refresh: async () => {
      await Promise.all([
        analyticsQuery.refetch(),
        snapshotQuery.refetch(),
        replenishmentQuery.refetch(),
      ]);
    },
    replenishment: replenishmentData.replenishment,
    replenishmentError:
      replenishmentData.replenishmentError ||
      (!replenishmentQuery.data
        ? replenishmentQueryError || snapshotQueryError
        : null),
    replenishmentSummary: replenishmentData.replenishmentSummary,
    shelfRatio: snapshotData.shelfRatio,
    snapshots: snapshotData.snapshots,
  };
}

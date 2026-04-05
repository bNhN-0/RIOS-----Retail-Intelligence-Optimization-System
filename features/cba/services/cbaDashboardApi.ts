"use client";

import { queryOptions } from "@tanstack/react-query";

import {
  fetchBackendRows,
  pickArray,
  pickDate,
  pickNumber,
  pickString,
  safeDivide,
  type BackendRow,
} from "@/lib/api/riosBackend";
import type {
  CBADashboardModel,
  CBAEvent,
  SignalItem,
  TimePoint,
} from "@/features/cba/services/cbaMockData";

type CameraRecord = {
  cameraId: string;
  shelfGroup: string;
  location: string;
  zone: string;
  isActive: boolean;
};

type CameraDailyMetric = {
  cameraId: string;
  metricDate: string;
  visitorCount: number;
  interactionCount: number;
  holdingCount: number;
  touchCount: number;
  productRemoveCount: number;
  touchRate: number;
  conversionRate: number;
};

type CameraLog = {
  cameraId: string;
  capturedAt: string;
  personCount: number;
  holdingCount: number;
  touchingShelfCount: number;
  productRemoveCount: number;
  detections: BackendRow[];
};

function toPercent(value: number) {
  return Number((value * 100).toFixed(1));
}

function normalizeShelfGroup(value: string) {
  const normalized = value.trim().toUpperCase();
  return normalized || "UNKNOWN";
}

function formatMetricLabel(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
}

function normalizeCamera(row: BackendRow): CameraRecord | null {
  const cameraId = pickString(row, ["camera_id", "id"]);

  if (!cameraId) return null;

  return {
    cameraId,
    shelfGroup: normalizeShelfGroup(
      pickString(row, ["shelf_group", "zone"], cameraId),
    ),
    location: pickString(row, ["location"]),
    zone: normalizeShelfGroup(pickString(row, ["zone", "shelf_group"], cameraId)),
    isActive:
      typeof row.is_active === "boolean"
        ? row.is_active
        : pickNumber(row, ["is_active"], 1) !== 0,
  };
}

function normalizeDailyMetric(row: BackendRow): CameraDailyMetric | null {
  const cameraId = pickString(row, ["camera_id"]);
  const metricDate =
    pickDate(row, ["metric_date"])?.toISOString().slice(0, 10) ??
    pickString(row, ["metric_date"]);

  if (!cameraId || !metricDate) return null;

  return {
    cameraId,
    metricDate,
    visitorCount: pickNumber(row, ["visitor_count"]),
    interactionCount: pickNumber(row, ["interaction_count"]),
    holdingCount: pickNumber(row, ["holding_count"]),
    touchCount: pickNumber(row, ["touch_count"]),
    productRemoveCount: pickNumber(row, ["product_remove_count"]),
    touchRate: pickNumber(row, ["touch_rate"]),
    conversionRate: pickNumber(row, ["conversion_rate"]),
  };
}

function normalizeCameraLog(row: BackendRow): CameraLog | null {
  const cameraId = pickString(row, ["camera_id"]);
  const capturedAt =
    pickDate(row, ["captured_at"])?.toISOString() ?? pickString(row, ["captured_at"]);

  if (!cameraId || !capturedAt) return null;

  return {
    cameraId,
    capturedAt,
    personCount: pickNumber(row, ["person_count"]),
    holdingCount: pickNumber(row, ["holding_count"]),
    touchingShelfCount: pickNumber(row, ["touching_shelf_count"]),
    productRemoveCount: pickNumber(row, ["product_remove_count"]),
    detections: pickArray<BackendRow>(row, ["detections"]),
  };
}

function buildEvents(logs: CameraLog[], shelfByCameraId: Map<string, string>): CBAEvent[] {
  const events: CBAEvent[] = [];

  logs.forEach((log) => {
    const shelf = shelfByCameraId.get(log.cameraId) ?? normalizeShelfGroup(log.cameraId);
    const totalVisitors = Math.max(0, log.personCount);
    const touchCount = Math.max(0, log.touchingShelfCount);
    const holdCount = Math.max(0, log.holdingCount);

    for (let index = 0; index < totalVisitors; index += 1) {
      events.push({
        timestamp: log.capturedAt,
        zone: shelf,
        product: shelf,
        interactionType: "none",
      });
    }

    for (let index = 0; index < touchCount; index += 1) {
      events.push({
        timestamp: log.capturedAt,
        zone: shelf,
        product: shelf,
        interactionType: "touch",
      });
    }

    for (let index = 0; index < holdCount; index += 1) {
      events.push({
        timestamp: log.capturedAt,
        zone: shelf,
        product: shelf,
        interactionType: "hold",
      });
    }
  });

  return events;
}

function buildTrend(metrics: CameraDailyMetric[]): TimePoint[] {
  const byDate = new Map<
    string,
    { interactions: number; holdings: number }
  >();

  metrics.forEach((metric) => {
    const current = byDate.get(metric.metricDate) ?? { interactions: 0, holdings: 0 };
    current.interactions += metric.interactionCount;
    current.holdings += metric.holdingCount;
    byDate.set(metric.metricDate, current);
  });

  return [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([metricDate, values]) => ({
      label: formatMetricLabel(metricDate),
      interactions: values.interactions,
      holdings: values.holdings,
    }));
}

function buildSignals(
  shelfPerformance: CBADashboardModel["shelfPerformance"],
  trend: TimePoint[],
): Pick<CBADashboardModel, "signals" | "rootCauses" | "recommendations"> {
  const weakestShelf =
    [...shelfPerformance].sort((left, right) => left.touchRate - right.touchRate)[0] ??
    null;
  const highestShelf =
    [...shelfPerformance].sort((left, right) => right.interactions - left.interactions)[0] ??
    null;
  const lowestConversionShelf =
    [...shelfPerformance].sort((left, right) => left.conversionRate - right.conversionRate)[0] ??
    null;
  const peakTrend =
    [...trend].sort((left, right) => right.interactions - left.interactions)[0] ?? null;

  const signals: SignalItem[] = [];

  if (weakestShelf) {
    signals.push({
      title: "Low shelf engagement",
      detail: `${weakestShelf.shelf} has the weakest touch rate in the current camera metrics.`,
      severity: "high",
    });
  }

  if (lowestConversionShelf) {
    signals.push({
      title: "Low conversion shelf",
      detail: `${lowestConversionShelf.shelf} converts the least against observed interactions.`,
      severity: "medium",
    });
  }

  if (peakTrend) {
    signals.push({
      title: "Peak interaction day",
      detail: `${peakTrend.label} shows the highest interaction count across camera daily metrics.`,
      severity: "low",
    });
  }

  return {
    signals,
    rootCauses: [
      {
        title: "Weak shelf visibility",
        detail: weakestShelf
          ? `${weakestShelf.shelf} is getting visitors without enough touch follow-through.`
          : "Camera metrics have not surfaced a weak shelf yet.",
        confidence: weakestShelf ? "74%" : "0%",
      },
      {
        title: "Low purchase follow-through",
        detail: lowestConversionShelf
          ? `${lowestConversionShelf.shelf} shows low conversion versus interaction count.`
          : "Conversion rate needs more live data.",
        confidence: lowestConversionShelf ? "68%" : "0%",
      },
      {
        title: "Traffic concentration",
        detail: highestShelf
          ? `${highestShelf.shelf} is taking the highest interaction load in the current period.`
          : "Traffic distribution is still loading.",
        confidence: highestShelf ? "71%" : "0%",
      },
    ],
    recommendations: [
      {
        title: "Audit shelf placement",
        action: weakestShelf
          ? `Review facing, signage, and product visibility for ${weakestShelf.shelf}.`
          : "Review low-engagement shelves after more camera data is collected.",
        owner: "Store Ops",
      },
      {
        title: "Check conversion blockers",
        action: lowestConversionShelf
          ? `Inspect product mix and pricing on ${lowestConversionShelf.shelf}.`
          : "Compare shelf conversion once daily metrics accumulate.",
        owner: "Merchandising",
      },
      {
        title: "Balance shelf load",
        action: highestShelf
          ? `Use ${highestShelf.shelf} as the benchmark for adjacent shelf optimization.`
          : "Rebalance exposure once shelf interaction baselines are available.",
        owner: "Analytics",
      },
    ],
  };
}

export async function fetchCBADashboardModel(
  selectedDate: string,
  signal?: AbortSignal,
): Promise<CBADashboardModel> {
  const [cameraResult, dailyMetricsResult, logsResult] = await Promise.all([
    fetchBackendRows<BackendRow>("/cameras", signal),
    fetchBackendRows<BackendRow>("/camera-daily-metrics", signal),
    fetchBackendRows<BackendRow>("/camera-logs", signal),
  ]);

  const cameras = cameraResult.rows.map(normalizeCamera).filter(Boolean) as CameraRecord[];
  const metrics = dailyMetricsResult.rows
    .map(normalizeDailyMetric)
    .filter(Boolean) as CameraDailyMetric[];
  const logs = logsResult.rows.map(normalizeCameraLog).filter(Boolean) as CameraLog[];

  const shelfByCameraId = new Map(
    cameras.map((camera) => [camera.cameraId, camera.shelfGroup]),
  );
  const activeCameras = cameras.filter((camera) => camera.isActive);
  const selectedMetrics = metrics.filter((metric) => metric.metricDate === selectedDate);

  const groupedMetrics = new Map<
    string,
    {
      shelf: string;
      traffic: number;
      interactions: number;
      holdings: number;
      touchCount: number;
      productRemoveCount: number;
      conversionRateAccumulator: number;
      conversionRateCount: number;
    }
  >();

  selectedMetrics.forEach((metric) => {
    const shelf =
      shelfByCameraId.get(metric.cameraId) ?? normalizeShelfGroup(metric.cameraId);
    const current = groupedMetrics.get(shelf) ?? {
      shelf,
      traffic: 0,
      interactions: 0,
      holdings: 0,
      touchCount: 0,
      productRemoveCount: 0,
      conversionRateAccumulator: 0,
      conversionRateCount: 0,
    };

    current.traffic += metric.visitorCount;
    current.interactions += metric.interactionCount;
    current.holdings += metric.holdingCount;
    current.touchCount += metric.touchCount;
    current.productRemoveCount += metric.productRemoveCount;
    current.conversionRateAccumulator += metric.conversionRate;
    current.conversionRateCount += 1;
    groupedMetrics.set(shelf, current);
  });

  activeCameras.forEach((camera) => {
    if (!groupedMetrics.has(camera.shelfGroup)) {
      groupedMetrics.set(camera.shelfGroup, {
        shelf: camera.shelfGroup,
        traffic: 0,
        interactions: 0,
        holdings: 0,
        touchCount: 0,
        productRemoveCount: 0,
        conversionRateAccumulator: 0,
        conversionRateCount: 0,
      });
    }
  });

  const shelfPerformance = [...groupedMetrics.values()]
    .sort((left, right) => left.shelf.localeCompare(right.shelf))
    .map((row) => ({
      shelf: row.shelf,
      traffic: row.traffic,
      interactions: row.interactions,
      holdings: row.holdings,
      touchRate: toPercent(safeDivide(row.touchCount, row.traffic)),
      holdRate: toPercent(safeDivide(row.holdings, row.interactions)),
      conversionRate:
        row.conversionRateCount > 0
          ? Number((row.conversionRateAccumulator / row.conversionRateCount).toFixed(1))
          : 0,
      productRemovals: row.productRemoveCount,
    }));

  const totals = shelfPerformance.reduce(
    (accumulator, row) => {
      accumulator.footTraffic += row.traffic;
      accumulator.interactions += row.interactions;
      accumulator.holdings += row.holdings;
      accumulator.productRemovals += row.productRemovals;
      return accumulator;
    },
    {
      footTraffic: 0,
      interactions: 0,
      holdings: 0,
      productRemovals: 0,
    },
  );

  const trend = buildTrend(metrics);
  const liveEvents = buildEvents(logs, shelfByCameraId);
  const signalBundle = buildSignals(shelfPerformance, trend);
  return {
    events: liveEvents,
    totals: {
      footTraffic: totals.footTraffic,
      interactions: totals.interactions,
      holdings: totals.holdings,
      touchRate: toPercent(safeDivide(totals.interactions, totals.footTraffic)),
      holdRate: toPercent(safeDivide(totals.holdings, totals.interactions)),
      conversionProxy: toPercent(safeDivide(totals.productRemovals, totals.interactions)),
    },
    heatmapCells: [],
    trend,
    shelfPerformance,
    insights: [],
    products: [],
    rankings: {
      mostInteracted: [],
      mostHeld: [],
      leastInteracted: [],
    },
    signals: signalBundle.signals,
    rootCauses: signalBundle.rootCauses,
    recommendations: signalBundle.recommendations,
  };
}

export function getCBADashboardQueryOptions(selectedDate: string) {
  return queryOptions({
    queryKey: ["cba-dashboard", selectedDate],
    queryFn: ({ signal }) => fetchCBADashboardModel(selectedDate, signal),
  });
}

"use client";

import { queryOptions } from "@tanstack/react-query";

import {
  fetchBackendJson,
  fetchBackendRows,
  getBackendBaseUrl,
  pickArray,
  pickDate,
  pickNumber,
  pickString,
  safeDivide,
  type BackendRow,
} from "@/lib/api/riosBackend";
import type {
  VisionCamera,
  VisionEventHighlight,
  VisionHeatmapCell,
  VisionLiveModel,
  VisionLiveStat,
  VisionShelfRowStat,
  VisionTimelineMarker,
} from "@/features/cba/types/vision";

type CameraDailyMetric = {
  metricDate: string;
  visitorCount: number;
  holdingCount: number;
  touchCount: number;
  touchRate: number;
  updatedAt: string;
};

type CameraHeatmapResponse = {
  camera_id?: number;
  shelf_group?: string;
  interaction_type?: string | null;
  shelf_zone_points?: Array<[number, number]>;
  grid_rows?: number;
  grid_cols?: number;
  rectangle_width?: number;
  rectangle_height?: number;
  total_events?: number;
  cells?: Array<{ row: number; col: number; value: number }>;
};

const VISION_LIVE_STREAM_BASE_URL = `${getBackendBaseUrl()}/camera-streams`;
const VISION_LIVE_REFETCH_INTERVAL_MS = 10_000;

function normalizeShelfGroup(value: string) {
  const normalized = value.trim().toUpperCase();
  return normalized || "UNKNOWN";
}

function formatTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function cameraNameForGroup(group: string) {
  return `Camera ${group}`;
}

function normalizePoints(row: BackendRow): Array<[number, number]> {
  const points = pickArray<unknown>(row, ["shelf_zone_points"]);

  return points
    .map((point) => {
      if (!Array.isArray(point) || point.length < 2) {
        return null;
      }

      const x = Number(point[0]);
      const y = Number(point[1]);

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return null;
      }

      return [x, y] as [number, number];
    })
    .filter((point): point is [number, number] => point !== null);
}

function normalizeCamera(row: BackendRow): VisionCamera | null {
  const id = pickString(row, ["camera_id", "id"]);

  if (!id) {
    return null;
  }

  const shelfGroup = normalizeShelfGroup(
    pickString(row, ["shelf_group", "zone"], id),
  );
  const isActive =
    typeof row.is_active === "boolean"
      ? row.is_active
      : pickNumber(row, ["is_active"], 1) !== 0;

  return {
    id,
    streamId: shelfGroup,
    name: pickString(row, ["name"], cameraNameForGroup(shelfGroup)),
    shelfGroup,
    zone: normalizeShelfGroup(
      pickString(row, ["zone", "shelf_group"], shelfGroup),
    ),
    location: pickString(row, ["location"], `${shelfGroup} shelf camera`),
    status: isActive ? "Live" : "Standby",
    isActive,
    shelfZonePoints: normalizePoints(row),
  };
}

function normalizeMetric(row: BackendRow): CameraDailyMetric | null {
  const metricDate =
    pickDate(row, ["metric_date"])?.toISOString().slice(0, 10) ??
    pickString(row, ["metric_date"]);

  if (!metricDate) {
    return null;
  }

  const visitorCount = pickNumber(row, ["visitor_count"], 0);
  const touchCount = pickNumber(row, ["touch_count"], 0);
  const rawTouchRate = pickNumber(row, ["touch_rate"], Number.NaN);

  return {
    metricDate,
    visitorCount,
    holdingCount: pickNumber(row, ["holding_count"], 0),
    touchCount,
    touchRate: Number.isFinite(rawTouchRate)
      ? rawTouchRate
      : safeDivide(touchCount, visitorCount),
    updatedAt:
      pickDate(row, ["updated_at"])?.toISOString() ||
      pickString(row, ["updated_at"], metricDate),
  };
}

function normalizeShelfRow(row: BackendRow): VisionShelfRowStat | null {
  const shelfId = pickString(row, ["shelf_id"]);

  if (!shelfId) {
    return null;
  }

  const productRows = pickArray<BackendRow>(row, ["products"]);
  const productNames = Array.from(
    new Set(
      productRows
        .map((product) => pickString(product, ["product_name"]))
        .filter((name): name is string => Boolean(name)),
    ),
  );

  return {
    shelfId,
    heatmapRow: pickNumber(row, ["heatmap_row"], 0),
    currentTotalItems: pickNumber(row, ["current_total_items"], 0),
    totalInteractions: pickNumber(row, ["total_interactions"], 0),
    touchCount: pickNumber(row, ["touch_count"], 0),
    holdingCount: pickNumber(row, ["holding_count"], 0),
    productRemoveCount: pickNumber(row, ["product_remove_count"], 0),
    topProductName:
      pickString(row, ["most_touched_product_name"], productNames[0] || "-") ||
      "-",
    productNames,
  };
}

function toneForSeverity(value: number): VisionTimelineMarker["severity"] {
  if (value >= 8) return "high";
  if (value >= 4) return "medium";
  return "low";
}

function buildStats(
  metrics: CameraDailyMetric[],
  totalEvents: number,
): VisionLiveStat[] {
  const latestMetric = metrics[0] ?? null;
  const touchRate = latestMetric ? latestMetric.touchRate : 0;

  return [
    {
      label: "Active shoppers",
      value: String(latestMetric?.visitorCount ?? 0),
      tone: "sky",
    },
    {
      label: "Touch events",
      value: String(latestMetric?.touchCount ?? 0),
      tone: "emerald",
    },
    {
      label: "Hold events",
      value: String(latestMetric?.holdingCount ?? 0),
      tone: "amber",
    },
    {
      label: "Heat events",
      value: String(totalEvents),
      tone: "slate",
    },
    {
      label: "Touch rate",
      value: `${(touchRate * 100).toFixed(1)}%`,
      tone: "slate",
    },
  ];
}

function buildTimeline(shelfRows: VisionShelfRowStat[]): VisionTimelineMarker[] {
  return [...shelfRows]
    .sort((left, right) => right.totalInteractions - left.totalInteractions)
    .slice(0, 5)
    .reverse()
    .map((row, index) => ({
      id: `${row.shelfId}-${index}`,
      time: row.shelfId,
      label: row.topProductName !== "-" ? row.topProductName : "Shelf row activity",
      value: row.totalInteractions,
      severity: toneForSeverity(row.totalInteractions),
    }));
}

function buildEvents(
  shelfRows: VisionShelfRowStat[],
  latestMetric: CameraDailyMetric | null,
): VisionEventHighlight[] {
  const activeRows = [...shelfRows]
    .filter((row) => row.totalInteractions > 0)
    .sort((left, right) => right.totalInteractions - left.totalInteractions)
    .slice(0, 3);

  if (activeRows.length > 0) {
    return activeRows.map((row, index) => ({
      id: `${row.shelfId}-event-${index}`,
      title:
        row.productRemoveCount > 0
          ? "Product removal detected"
          : row.holdingCount > 0
            ? "Hold interaction detected"
            : "Shelf touch activity detected",
      detail:
        row.productRemoveCount > 0
          ? `${row.shelfId} recorded ${row.productRemoveCount} removal events around ${row.topProductName}.`
          : row.holdingCount > 0
            ? `${row.shelfId} logged ${row.holdingCount} holds and ${row.totalInteractions} total interactions.`
            : `${row.shelfId} logged ${row.touchCount} touches${row.topProductName !== "-" ? ` around ${row.topProductName}` : ""}.`,
      time: row.shelfId,
      tone:
        row.productRemoveCount > 0
          ? "good"
          : row.holdingCount > 0
            ? "warn"
            : "alert",
    }));
  }

  if (!latestMetric) {
    return [];
  }

  return [
    {
      id: `camera-metric-${latestMetric.metricDate}`,
      title: "Camera activity snapshot",
      detail: `${latestMetric.visitorCount} active shoppers, ${latestMetric.touchCount} touches, and ${latestMetric.holdingCount} holds in the latest camera metric.`,
      time: formatTime(latestMetric.updatedAt),
      tone: "warn",
    },
  ];
}

function buildHeatmapCells(
  heatmap: CameraHeatmapResponse | null,
  shelfRows: VisionShelfRowStat[],
  selectedCamera: VisionCamera,
): VisionHeatmapCell[] {
  const cells = heatmap?.cells ?? [];

  if (cells.length === 0) {
    return [];
  }

  const shelfRowsByIndex = new Map(
    shelfRows.map((row) => [row.heatmapRow, row] as const),
  );
  const maxValue = Math.max(...cells.map((cell) => cell.value), 1);

  return cells.map((cell) => {
    const shelfRow = shelfRowsByIndex.get(cell.row);
    const fallbackShelfId = `${selectedCamera.shelfGroup}${cell.row + 1}`;

    return {
      id: `r${cell.row}-c${cell.col}`,
      zone: `${shelfRow?.shelfId ?? fallbackShelfId} / Col ${cell.col + 1}`,
      intensity: safeDivide(cell.value, maxValue),
      interactions: cell.value,
      row: cell.row,
      col: cell.col,
      shelfId: shelfRow?.shelfId ?? fallbackShelfId,
      productNames: shelfRow?.productNames ?? [],
    };
  });
}

async function fetchVisionHeatmap(
  cameraId: string,
  signal?: AbortSignal,
): Promise<CameraHeatmapResponse | null> {
  const result = await fetchBackendJson<CameraHeatmapResponse>(
    `/camera-heatmaps/${encodeURIComponent(cameraId)}`,
    signal,
  );

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data;
}

async function fetchVisionShelfRows(
  cameraId: string,
  signal?: AbortSignal,
): Promise<VisionShelfRowStat[]> {
  const result = await fetchBackendJson(
    `/camera-analytics/${encodeURIComponent(cameraId)}/shelf-products`,
    signal,
  );

  if (result.error || !result.data) {
    throw new Error(result.error ?? "Unable to load shelf row analytics.");
  }

  return pickArray<BackendRow>(result.data as BackendRow, ["rows"])
    .map((row) => normalizeShelfRow(row))
    .filter((row): row is VisionShelfRowStat => row !== null)
    .sort((left, right) => left.heatmapRow - right.heatmapRow);
}

export async function fetchVisionCameras(
  signal?: AbortSignal,
): Promise<VisionCamera[]> {
  const result = await fetchBackendRows<BackendRow>("/cameras", signal);

  if (result.error) {
    throw new Error(result.error);
  }

  return result.rows
    .map(normalizeCamera)
    .filter((camera): camera is VisionCamera => camera !== null)
    .sort((left, right) => left.shelfGroup.localeCompare(right.shelfGroup));
}

export async function fetchVisionLiveModel(
  cameraId: string,
  signal?: AbortSignal,
): Promise<VisionLiveModel> {
  const cameras = await fetchVisionCameras(signal);
  const selectedCamera =
    cameras.find((camera) => camera.id === cameraId) ?? cameras[0] ?? null;

  if (!selectedCamera) {
    return {
      cameras: [],
      selectedCamera: null,
      streamUrl: "",
      liveStats: [],
      shelfRows: [],
      timeline: [],
      events: [],
      heatmapCells: [],
      heatmapRows: 4,
      heatmapCols: 50,
      heatmapTotalEvents: 0,
    };
  }

  const [metricsResult, heatmapResult, shelfRows] = await Promise.all([
    fetchBackendRows<BackendRow>(
      `/camera-daily-metrics?camera_id=${encodeURIComponent(selectedCamera.id)}`,
      signal,
    ),
    fetchVisionHeatmap(selectedCamera.id, signal),
    fetchVisionShelfRows(selectedCamera.id, signal),
  ]);

  if (metricsResult.error) {
    throw new Error(metricsResult.error);
  }

  const metrics = metricsResult.rows
    .map((row) => normalizeMetric(row))
    .filter((metric): metric is CameraDailyMetric => metric !== null)
    .sort((left, right) => right.metricDate.localeCompare(left.metricDate));
  const latestMetric = metrics[0] ?? null;
  const streamUrl = `${VISION_LIVE_STREAM_BASE_URL}/${selectedCamera.streamId}`;
  const heatmapRows =
    heatmapResult?.grid_rows ?? Math.max(shelfRows.length, 4);
  const heatmapCols = heatmapResult?.grid_cols ?? 50;
  const totalEvents = heatmapResult?.total_events ?? 0;

  return {
    cameras,
    selectedCamera,
    streamUrl,
    liveStats: buildStats(metrics, totalEvents),
    shelfRows,
    timeline: buildTimeline(shelfRows),
    events: buildEvents(shelfRows, latestMetric),
    heatmapCells: buildHeatmapCells(heatmapResult, shelfRows, selectedCamera),
    heatmapRows,
    heatmapCols,
    heatmapTotalEvents: totalEvents,
  };
}

export function getVisionCamerasQueryOptions() {
  return queryOptions({
    queryKey: ["cba-vision-cameras"],
    queryFn: ({ signal }) => fetchVisionCameras(signal),
    refetchInterval: VISION_LIVE_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });
}

export function getVisionLiveModelQueryOptions(cameraId: string) {
  return queryOptions({
    queryKey: ["cba-vision-live", cameraId],
    queryFn: ({ signal }) => fetchVisionLiveModel(cameraId, signal),
    refetchInterval: VISION_LIVE_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });
}

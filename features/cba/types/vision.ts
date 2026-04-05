export type VisionState = {
  selectedCameraId: string;
  viewMode: "normal" | "heatmap";
};

export type VisionCamera = {
  id: string;
  streamId: string;
  name: string;
  shelfGroup: string;
  zone: string;
  location: string;
  status: "Live" | "Standby";
  isActive: boolean;
  shelfZonePoints: Array<[number, number]>;
};

export type VisionDetectionBox = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tone: "touch" | "hold" | "traffic";
};

export type VisionEventHighlight = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: "good" | "warn" | "alert";
};

export type VisionHeatmapCell = {
  id: string;
  zone: string;
  intensity: number;
  interactions: number;
  row: number;
  col: number;
  shelfId: string;
  productNames: string[];
};

export type VisionInsightSummary = {
  title: string;
  detail: string;
  indicators: Array<{
    label: string;
    value: string;
    tone: "emerald" | "amber" | "sky";
  }>;
  recommendations: string[];
};

export type VisionLiveStat = {
  label: string;
  value: string;
  tone: "slate" | "sky" | "amber" | "emerald";
};

export type VisionShelfRowStat = {
  shelfId: string;
  heatmapRow: number;
  currentTotalItems: number;
  totalInteractions: number;
  touchCount: number;
  holdingCount: number;
  productRemoveCount: number;
  topProductName: string;
  productNames: string[];
};

export type VisionTimelineMarker = {
  id: string;
  time: string;
  label: string;
  value: number;
  severity: "low" | "medium" | "high";
};

export type VisionLiveModel = {
  cameras: VisionCamera[];
  selectedCamera: VisionCamera | null;
  streamUrl: string;
  liveStats: VisionLiveStat[];
  shelfRows: VisionShelfRowStat[];
  timeline: VisionTimelineMarker[];
  events: VisionEventHighlight[];
  heatmapCells: VisionHeatmapCell[];
  heatmapRows: number;
  heatmapCols: number;
  heatmapTotalEvents: number;
};

export type TimeRange = "hour" | "day" | "week" | "month";

export type FunnelContext = {
  selectedCategory: string;
  selectedProduct: string;
  selectedTimeSlot: string | null;
};

export type FunnelStageCounts = {
  visitors: number;
  interaction: number;
  hold: number;
  purchase: number;
};

export type FunnelMetrics = FunnelStageCounts & {
  interactionRate: number;
  holdRate: number;
  purchaseRate: number;
  visitorToInteractionDrop: number;
  interactionToHoldDrop: number;
  holdToPurchaseDrop: number;
};

export type SegmentedFunnelRow = {
  key: string;
  label: string;
  visitors: number;
  interaction: number;
  hold: number;
  purchase: number;
  zone?: string;
  category?: string;
  product?: string;
};

export type DropOffInsight = {
  stage: "visitor_to_interaction" | "interaction_to_hold" | "hold_to_purchase";
  dropRate: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
  label: string;
};

export type DiagnosticsResult = {
  problem: string;
  causes: string[];
};

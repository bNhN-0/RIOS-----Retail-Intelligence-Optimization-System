export type InsightType = "problem" | "opportunity" | "optimization";
export type InsightSeverity = "high" | "medium" | "low";
export type InsightSource = "trend" | "behavior" | "product";
export type TaskStatus = "pending" | "in_progress" | "done";

export type BehaviorMetrics = {
  visitors: number;
  interactions: number;
  totalHoldTime: number;
  avgHoldTime: number;
  purchases: number;
  interactionRate: number;
  conversionRate: number;
  hesitationScore: number;
};

export type BehaviorImpact = {
  holdTimeChange: number;
  conversionChange: number;
};

export type ActionTask = {
  id: string;
  insightId: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  expectedImpact: string;
  actualImpact?: string;
  metricsBefore: BehaviorMetrics;
  metricsAfter?: BehaviorMetrics;
};

export type InsightContext = {
  interaction?: number;
  hold?: number;
  purchase?: number;
  trend?: string;
};

export type InsightImpact = {
  conversion?: string;
  revenue?: string;
};

export type InsightSourceLink = {
  label: string;
  href: string;
};

export type InsightCardModel = {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  summary: string;
  why: string;
  reasoning: string[];
  context: InsightContext;
  action: string[];
  impact: InsightImpact;
  confidence: number;
  source: InsightSource[];
  priorityScore: number;
  urgency: number;
  estimatedRevenueLift: number;
  estimatedConversionLift: number;
  targetHref: string;
  targetLabel: string;
  sourceLinks: InsightSourceLink[];
  category?: string;
  product?: string;
  timeSlot?: string;
};

export type InsightContextState = {
  selectedCategory: string;
  selectedProduct: string;
  selectedTimeSlot: string | null;
};

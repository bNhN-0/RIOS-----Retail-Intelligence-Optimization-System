import { ActionTask, BehaviorImpact, BehaviorMetrics, InsightCardModel, InsightContextState, TaskStatus } from "@/components/sales/insights/types";

const severityWeight = { high: 1.25, medium: 1, low: 0.8 } as const;
const typeLabel = { problem: "Problem", opportunity: "Opportunity", optimization: "Optimization" } as const;

const baseInsights: Array<Omit<InsightCardModel, "priorityScore" | "targetHref" | "targetLabel"> & { route: "trends" | "products" }> = [
  {
    id: "footwear-6pm-drop",
    type: "problem",
    severity: "high",
    title: "Footwear conversion drop at 6PM",
    summary: "Traffic is strong in the evening, but purchases are not keeping pace.",
    why: "Shoppers are engaging with the assortment, then hesitating before checkout. That usually points to pricing friction or poor last-mile placement.",
    reasoning: ["avg hold time increased to 7.4s", "conversion rate slipped to 9.4%", "interaction rate stayed above normal"],
    context: { interaction: 268, hold: 96, purchase: 31, trend: "Traffic high, purchase low" },
    action: ["Reposition hero pairs near checkout", "Add 10% evening offer"],
    impact: { conversion: "+12%", revenue: "+฿1,180" },
    confidence: 84,
    source: ["behavior", "trend", "product"],
    sourceLinks: [],
    urgency: 1.25,
    estimatedRevenueLift: 1180,
    estimatedConversionLift: 12,
    route: "trends",
    category: "Shoes",
    product: "Runner Pro",
    timeSlot: "6PM",
  },
  {
    id: "drinks-night-opportunity",
    type: "opportunity",
    severity: "high",
    title: "Drinks are winning late-night demand",
    summary: "Demand is concentrating late in the day and conversion stays healthy.",
    why: "Evening traffic aligns with a strong purchase rate, which suggests the current offer and placement are working during that window.",
    reasoning: ["interaction rate rose to 41%", "avg hold time stayed efficient at 4.6s", "conversion rate is above baseline at 14.2%"],
    context: { interaction: 214, hold: 128, purchase: 74, trend: "Night conversion above baseline" },
    action: ["Increase cooler facings after 7PM", "Protect stock for evening rush"],
    impact: { conversion: "+7%", revenue: "+฿940" },
    confidence: 81,
    source: ["trend", "product"],
    sourceLinks: [],
    urgency: 1.1,
    estimatedRevenueLift: 940,
    estimatedConversionLift: 7,
    route: "trends",
    category: "Drinks",
    product: "Bottle Max",
    timeSlot: "9PM",
  },
  {
    id: "snacks-afternoon-friction",
    type: "optimization",
    severity: "medium",
    title: "Snacks stall after strong afternoon traffic",
    summary: "Browsers are arriving, but too few are converting into buyers.",
    why: "The shelf is likely creating choice friction. High interaction with weak close rate usually means too many similar options or unclear value cues.",
    reasoning: ["avg hold time climbed to 6.8s", "conversion rate is only 8.3%", "interaction rate is still healthy at 34.9%"],
    context: { interaction: 192, hold: 74, purchase: 29, trend: "High browse, weak close" },
    action: ["Simplify shelf messaging", "Bundle top snack pairs"],
    impact: { conversion: "+8%", revenue: "+฿620" },
    confidence: 76,
    source: ["trend", "behavior"],
    sourceLinks: [],
    urgency: 1.05,
    estimatedRevenueLift: 620,
    estimatedConversionLift: 8,
    route: "trends",
    category: "Snacks",
    product: "Energy Bar",
    timeSlot: "3PM",
  },
  {
    id: "runner-pro-product-decline",
    type: "problem",
    severity: "medium",
    title: "Runner Pro revenue is soft despite interest",
    summary: "This SKU still attracts shoppers, but revenue is drifting under expectation.",
    why: "Interest remains healthy, so the issue is likely value perception or weak product framing rather than awareness.",
    reasoning: ["interaction rate remains at 38%", "avg hold time increased to 6.1s", "conversion rate dropped below 10%"],
    context: { interaction: 246, hold: 90, purchase: 36, trend: "Revenue trailing prior period" },
    action: ["Refresh PDP visuals in-store", "Test price ladder against adjacent SKUs"],
    impact: { conversion: "+6%", revenue: "+฿540" },
    confidence: 79,
    source: ["product", "behavior"],
    sourceLinks: [],
    urgency: 1,
    estimatedRevenueLift: 540,
    estimatedConversionLift: 6,
    route: "products",
    category: "Shoes",
    product: "Runner Pro",
    timeSlot: "6PM",
  },
  {
    id: "meals-lunch-opportunity",
    type: "opportunity",
    severity: "medium",
    title: "Meals peak cleanly at lunch",
    summary: "Lunch is the cleanest performance window in the current mix.",
    why: "Both hold and purchase rates rise together at midday, which means demand and merchandising are aligned in that slot.",
    reasoning: ["interaction rate is 36.6%", "avg hold time normalized to 4.8s", "conversion rate improved to 12.1%"],
    context: { interaction: 205, hold: 122, purchase: 68, trend: "Lunch hold and purchase both strong" },
    action: ["Expand midday meal placement", "Promote premium meal add-ons"],
    impact: { conversion: "+5%", revenue: "+฿470" },
    confidence: 74,
    source: ["trend", "product"],
    sourceLinks: [],
    urgency: 0.95,
    estimatedRevenueLift: 470,
    estimatedConversionLift: 5,
    route: "trends",
    category: "Meals",
    product: "Sandwich",
    timeSlot: "1PM",
  },
];

function buildHref(route: "trends" | "products", insight: { category?: string; product?: string; timeSlot?: string }, context: InsightContextState) {
  const params = new URLSearchParams();

  const category = context.selectedCategory !== "All Categories" ? context.selectedCategory : insight.category;
  const product = context.selectedProduct !== "All Products" ? context.selectedProduct : insight.product;
  const slot = context.selectedTimeSlot ?? insight.timeSlot ?? undefined;

  if (category) {
    params.set("category", category);
  }
  if (product) {
    params.set("product", product);
  }
  if (slot) {
    params.set("slot", slot);
  }

  if (route === "trends") {
    params.set("mode", product ? "product" : "category");
    return `/sales/sales-patterns?${params.toString()}`;
  }

  return `/sales/products?${params.toString()}`;
}

function buildSourceLinks(insight: { source: InsightCardModel["source"]; category?: string; product?: string; timeSlot?: string }, context: InsightContextState) {
  const links = [] as InsightCardModel["sourceLinks"];
  if (insight.source.includes("trend")) {
    links.push({
      label: "View Trend",
      href: buildHref("trends", insight, context),
    });
  }
  if (insight.source.includes("product")) {
    links.push({
      label: "Check Product",
      href: buildHref("products", insight, context),
    });
  }
  return links;
}

export function buildPriorityFeed(context: InsightContextState) {
  return baseInsights
    .filter((insight) => context.selectedCategory === "All Categories" || insight.category === context.selectedCategory)
    .filter((insight) => context.selectedProduct === "All Products" || insight.product === context.selectedProduct)
    .filter((insight) => !context.selectedTimeSlot || insight.timeSlot === context.selectedTimeSlot)
    .map((insight) => {
      const confidenceFactor = insight.confidence / 100;
      const impactFactor = (insight.estimatedRevenueLift / 1200 + insight.estimatedConversionLift / 12) / 2;
      const priorityScore = Number((impactFactor * insight.urgency * confidenceFactor * severityWeight[insight.severity] * 100).toFixed(1));
      return {
        ...insight,
        priorityScore,
        targetHref: buildHref(insight.route, insight, context),
        targetLabel: insight.route === "trends" ? "Open trends" : "Open product",
        sourceLinks: buildSourceLinks(insight, context),
      };
    })
    .sort((left, right) => right.priorityScore - left.priorityScore);
}

export function buildBehaviorMetrics(insight: InsightCardModel): BehaviorMetrics {
  const interactions = insight.context.interaction ?? 0;
  const holds = insight.context.hold ?? 0;
  const purchases = insight.context.purchase ?? 0;
  const visitors = Math.max(interactions + 80, Math.round(interactions / 0.38));
  const avgHoldTime = Number((holds > 0 ? 3.2 + holds / Math.max(purchases + 8, 12) : 0).toFixed(1));
  const totalHoldTime = Number((avgHoldTime * interactions).toFixed(1));
  const interactionRate = Number((visitors > 0 ? interactions / visitors : 0).toFixed(3));
  const conversionRate = Number((visitors > 0 ? purchases / visitors : 0).toFixed(3));
  const hesitationScore = Number((avgHoldTime * (1 - conversionRate) * 10).toFixed(1));

  return {
    visitors,
    interactions,
    totalHoldTime,
    avgHoldTime,
    purchases,
    interactionRate,
    conversionRate,
    hesitationScore,
  };
}

export function createTaskFromInsight(insight: InsightCardModel, assignee: string, dueDate: string): ActionTask {
  return {
    id: `${insight.id}-${Date.now()}`,
    insightId: insight.id,
    title: insight.action[0] ?? insight.title,
    assignee,
    dueDate,
    status: "pending",
    createdAt: new Date().toISOString(),
    expectedImpact: `${insight.impact.conversion ?? "-"} / ${insight.impact.revenue ?? "-"}`,
    metricsBefore: buildBehaviorMetrics(insight),
  };
}

export function simulateMetricsAfter(before: BehaviorMetrics, severity: InsightCardModel["severity"]): BehaviorMetrics {
  const holdReduction = severity === "high" ? 2.4 : severity === "medium" ? 1.6 : 0.9;
  const conversionLift = severity === "high" ? 0.07 : severity === "medium" ? 0.05 : 0.03;
  const avgHoldTime = Number(Math.max(1.5, before.avgHoldTime - holdReduction).toFixed(1));
  const conversionRate = Number(Math.min(0.95, before.conversionRate + conversionLift).toFixed(3));
  const purchases = Math.round(before.visitors * conversionRate);
  const totalHoldTime = Number((avgHoldTime * before.interactions).toFixed(1));
  const hesitationScore = Number((avgHoldTime * (1 - conversionRate) * 10).toFixed(1));

  return {
    ...before,
    avgHoldTime,
    totalHoldTime,
    purchases,
    conversionRate,
    hesitationScore,
  };
}

export function calculateImpact(before: BehaviorMetrics, after: BehaviorMetrics): BehaviorImpact {
  return {
    holdTimeChange: Number((after.avgHoldTime - before.avgHoldTime).toFixed(1)),
    conversionChange: Number((after.conversionRate - before.conversionRate).toFixed(3)),
  };
}

export function formatBehaviorImpact(impact: BehaviorImpact): string {
  const hold = `${impact.holdTimeChange >= 0 ? "+" : ""}${impact.holdTimeChange.toFixed(1)}s hold time`;
  const conversion = `${impact.conversionChange >= 0 ? "+" : ""}${Math.round(impact.conversionChange * 100)}% conversion`;
  return `${hold}, ${conversion}`;
}

export function updateTaskStatus(task: ActionTask, nextStatus: TaskStatus, insight: InsightCardModel): ActionTask {
  if (nextStatus !== "done") {
    return {
      ...task,
      status: nextStatus,
    };
  }

  const metricsAfter = simulateMetricsAfter(task.metricsBefore, insight.severity);
  const impact = calculateImpact(task.metricsBefore, metricsAfter);

  return {
    ...task,
    status: "done",
    completedAt: new Date().toISOString(),
    metricsAfter,
    actualImpact: formatBehaviorImpact(impact),
  };
}

export function getSeverityClasses(severity: InsightCardModel["severity"]) {
  if (severity === "high") return "border-red-200 bg-red-50 text-red-700";
  if (severity === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function getTypeLabel(type: InsightCardModel["type"]) {
  return typeLabel[type];
}

export function formatConfidence(confidence: number) {
  return `${confidence}%`;
}

export function buildEvidence(insight: InsightCardModel) {
  const evidence = [] as string[];
  if (insight.source.includes("trend")) evidence.push("7-day pattern");
  if (insight.source.includes("behavior")) evidence.push("Shopper behavior signal");
  if (insight.source.includes("product")) evidence.push("SKU performance drift");
  return evidence;
}

export function buildRecommendationFeed(insights: InsightCardModel[]) {
  return insights.slice(0, 5).flatMap((insight) =>
    insight.action.slice(0, 2).map((action, index) => ({
      id: `${insight.id}-${index}`,
      title: insight.title,
      action,
      impact: insight.impact.revenue ?? insight.impact.conversion ?? "Impact pending",
      href: insight.targetHref,
      severity: insight.severity,
    })),
  );
}

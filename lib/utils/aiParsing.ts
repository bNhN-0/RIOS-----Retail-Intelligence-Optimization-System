import type {
  AlertItem,
  Recommendation,
  TrendPoint,
} from "@/features/ai/services/aiFallbackData";
import { formatCurrencyTHB } from "@/lib/formatters/currency";

const priorityLevels = ["High", "Medium", "Low"] as const;

export function formatTrendContext(trendData: TrendPoint[]) {
  if (!trendData.length) {
    return "No trend data was provided.";
  }

  const totals = trendData.reduce(
    (acc, item) => {
      acc.traffic += item.traffic;
      acc.interaction += item.interaction;
      acc.purchase += item.purchase;
      acc.revenue += item.revenue;
      return acc;
    },
    { traffic: 0, interaction: 0, purchase: 0, revenue: 0 }
  );

  const strongestDay = trendData.reduce((best, current) =>
    current.revenue > best.revenue ? current : best
  );
  const weakestDay = trendData.reduce((worst, current) =>
    current.revenue < worst.revenue ? current : worst
  );
  const interactionRate = ((totals.interaction / totals.traffic) * 100).toFixed(1);
  const conversionRate = ((totals.purchase / totals.traffic) * 100).toFixed(1);

  return [
    `Weekly revenue: ${formatCurrencyTHB(totals.revenue)}`,
    `Weekly traffic: ${totals.traffic.toLocaleString()}`,
    `Interaction rate: ${interactionRate}%`,
    `Conversion rate: ${conversionRate}%`,
    `Strongest day by revenue: ${strongestDay.name} (${formatCurrencyTHB(strongestDay.revenue)})`,
    `Weakest day by revenue: ${weakestDay.name} (${formatCurrencyTHB(weakestDay.revenue)})`,
    `Daily trend data: ${JSON.stringify(trendData)}`,
  ].join("\n");
}

export function parseJsonResponse<T>(content: string | null | undefined) {
  if (!content) {
    return null;
  }

  const trimmed = content.trim();
  const withoutCodeFence = trimmed.replace(/^```json\s*|^```\s*|\s*```$/g, "");

  try {
    return JSON.parse(withoutCodeFence) as T;
  } catch {
    const firstBrace = withoutCodeFence.indexOf("{");
    const lastBrace = withoutCodeFence.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    try {
      return JSON.parse(withoutCodeFence.slice(firstBrace, lastBrace + 1)) as T;
    } catch {
      return null;
    }
  }
}

export function normalizeRecommendationsResult(
  value: unknown,
  fallback: {
    alerts: AlertItem[];
    recommendations: Recommendation[];
  }
) {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const candidate = value as {
    alerts?: unknown[];
    recommendations?: unknown[];
  };

  const alerts = Array.isArray(candidate.alerts)
    ? candidate.alerts
        .map(normalizeAlert)
        .filter((item): item is AlertItem => item !== null)
    : [];

  const recommendations = Array.isArray(candidate.recommendations)
    ? candidate.recommendations
        .map(normalizeRecommendation)
        .filter((item): item is Recommendation => item !== null)
    : [];

  return {
    alerts: alerts.length ? alerts : fallback.alerts,
    recommendations: recommendations.length
      ? recommendations
      : fallback.recommendations,
  };
}

function normalizeAlert(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const title = asText(candidate.title);
  const detail = asText(candidate.detail);
  const level = asPriority(candidate.level, "Medium");

  if (!title || !detail) {
    return null;
  }

  return { title, detail, level } satisfies AlertItem;
}

function normalizeRecommendation(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const title = asText(candidate.title);
  const reason = asText(candidate.reason);
  const impact = asText(candidate.impact);
  const priority = asPriority(candidate.priority, "Medium");

  if (!title || !reason || !impact) {
    return null;
  }

  return { title, reason, impact, priority } satisfies Recommendation;
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asPriority(
  value: unknown,
  fallback: (typeof priorityLevels)[number]
) {
  return priorityLevels.includes(value as (typeof priorityLevels)[number])
    ? (value as (typeof priorityLevels)[number])
    : fallback;
}

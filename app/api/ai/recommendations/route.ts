import { NextRequest, NextResponse } from "next/server";

import {
  alerts as fallbackAlerts,
  recommendations as fallbackRecommendations,
} from "@/features/ai/services/aiFallbackData";
import {
  formatTrendContext,
  normalizeRecommendationsResult,
  parseJsonResponse,
} from "@/lib/utils/aiParsing";
import { generateGeminiText, hasGeminiApiKey } from "@/lib/api/gemini";

export const runtime = "nodejs";

const MAX_TREND_DATA_ITEMS = 500;
const GENERIC_AI_UNAVAILABLE_ERROR = "AI recommendations are not available.";

type RecommendationResult = {
  alerts: unknown[];
  recommendations: unknown[];
};

export async function POST(req: NextRequest) {
  try {
    if (!hasGeminiApiKey()) {
      return NextResponse.json(
        { error: GENERIC_AI_UNAVAILABLE_ERROR },
        { status: 503 }
      );
    }

    const body = await req.json();
    const trendData = Array.isArray(body.trendData) ? body.trendData : [];

    if (trendData.length > MAX_TREND_DATA_ITEMS) {
      return NextResponse.json(
        { error: "Trend data payload is too large." },
        { status: 400 }
      );
    }

    const content = await generateGeminiText({
      system:
        'You are a retail AI engine. Return ONLY valid JSON with this shape: {"alerts":[{"title":"string","detail":"string","level":"High|Medium|Low"}],"recommendations":[{"title":"string","reason":"string","impact":"string","priority":"High|Medium|Low"}]}. No markdown. No explanation.',
      user: formatTrendContext(trendData),
      temperature: 0.2,
    });

    const parsed = parseJsonResponse<RecommendationResult>(
      content
    );
    const result = normalizeRecommendationsResult(parsed, {
      alerts: fallbackAlerts,
      recommendations: fallbackRecommendations,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "AI recommendations request failed",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Failed to generate recommendations." },
      { status: 500 }
    );
  }
}

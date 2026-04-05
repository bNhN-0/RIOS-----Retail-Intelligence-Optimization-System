import { NextRequest, NextResponse } from "next/server";

import {
  buildReportPrompt,
  isAIReportType,
  normalizeAIReportResult,
  renderReportAsHtml,
  renderReportAsMarkdown,
} from "@/features/ai/utils/aiReport";
import { type AIVisibleContext } from "@/features/ai/utils/visibleContext";
import { generateGeminiText, hasGeminiApiKey } from "@/lib/api/gemini";

export const runtime = "nodejs";

const MAX_REPORT_PROMPT_LENGTH = 2_000;
const GENERIC_AI_UNAVAILABLE_ERROR = "AI reporting is not available.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const reportType = isAIReportType(body.reportType)
      ? body.reportType
      : "quick-summary";
    const visibleContext = isAIVisibleContext(body.visibleContext)
      ? body.visibleContext
      : null;

    if (!prompt) {
      return NextResponse.json(
        { error: "A report prompt is required." },
        { status: 400 },
      );
    }

    if (prompt.length > MAX_REPORT_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: "Report prompt is too long." },
        { status: 400 },
      );
    }

    if (!visibleContext) {
      return NextResponse.json(
        { error: "Visible dashboard context is required." },
        { status: 400 },
      );
    }

    if (!hasGeminiApiKey()) {
      return NextResponse.json(
        { error: GENERIC_AI_UNAVAILABLE_ERROR },
        { status: 503 },
      );
    }
    const content = await generateGeminiText({
      system:
        "You are a retail reporting assistant. Use only the provided dashboard context. Return valid JSON only. The report should be practical, concise, and focused on decisions a retail operator can make now.",
      user: buildReportPrompt({
        prompt,
        reportType,
        visibleContext,
        hasScreenshot: reportType !== "quick-summary",
      }),
      temperature: 0.3,
    });

    const report = normalizeAIReportResult(
      content ?? null,
      reportType,
      visibleContext,
    );

    return NextResponse.json({
      report,
      markdown: renderReportAsMarkdown(report),
      printableHtml: renderReportAsHtml(report),
    });
  } catch (error) {
    console.error(
      "AI report request failed",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Failed to generate report." },
      { status: 500 },
    );
  }
}

function isAIVisibleContext(value: unknown): value is AIVisibleContext {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.page === "string" &&
    typeof candidate.route === "string" &&
    typeof candidate.title === "string" &&
    !!candidate.filters &&
    typeof candidate.filters === "object" &&
    !Array.isArray(candidate.filters)
  );
}

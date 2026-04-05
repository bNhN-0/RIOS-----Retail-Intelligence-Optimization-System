import { NextRequest, NextResponse } from "next/server";

import {
  formatVisibleContext,
  type AIVisibleContext,
} from "@/features/ai/utils/visibleContext";
import { generateGeminiText, hasGeminiApiKey } from "@/lib/api/gemini";

export const runtime = "nodejs";

const MAX_CHAT_MESSAGE_LENGTH = 1_000;
const MAX_VISIBLE_CONTEXT_LENGTH = 50_000;
const GENERIC_AI_UNAVAILABLE_ERROR = "AI assistant is not available.";
const RETAIL_TOPIC_KEYWORDS = [
  "retail",
  "dashboard",
  "page",
  "view",
  "sales",
  "inventory",
  "stock",
  "shelf",
  "customer",
  "behavior",
  "shopper",
  "traffic",
  "conversion",
  "revenue",
  "product",
  "store",
  "kpi",
  "report",
  "alert",
  "insight",
  "recommendation",
  "cba",
];
const CONTEXTUAL_VIEW_KEYWORDS = [
  "analyze",
  "analyse",
  "explain",
  "seeing",
  "see",
  "shown",
  "showing",
  "screen",
  "here",
  "this",
  "what am i seeing",
  "what is this",
  "what do you see",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message =
      typeof body.message === "string" ? body.message.trim() : "";
    const visibleContext = isAIVisibleContext(body.visibleContext)
      ? body.visibleContext
      : null;

    if (!message) {
      return NextResponse.json(
        { error: "A message is required." },
        { status: 400 }
      );
    }

    if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: "Message is too long." },
        { status: 400 }
      );
    }

    if (!hasGeminiApiKey()) {
      return NextResponse.json(
        { error: GENERIC_AI_UNAVAILABLE_ERROR },
        { status: 503 }
      );
    }

    const messageIntent = classifyMessageIntent(message, visibleContext);

    if (messageIntent === "greeting") {
      return NextResponse.json({
        reply:
          "Hello. Ask me about sales, inventory, customer behavior, or the current dashboard view.",
      });
    }

    if (messageIntent === "unrelated") {
      return NextResponse.json({
        reply:
          "I'm optimized for this retail dashboard. Ask about the current view, sales, inventory, or customer behavior.",
      });
    }

    const formattedVisibleContext = visibleContext
      ? formatVisibleContext(visibleContext)
      : "No visible dashboard context was provided.";

    if (formattedVisibleContext.length > MAX_VISIBLE_CONTEXT_LENGTH) {
      return NextResponse.json(
        { error: "Visible context is too large." },
        { status: 400 }
      );
    }

    const reply = await generateGeminiText({
      system:
        "You are a retail AI assistant. Answer only from the structured visible dashboard context provided by the user. Do not assume hidden data, unseen tabs, or full application state. Give concise, practical answers with likely causes and next actions. If the visible context is insufficient, say that briefly.",
      user: `Question:\n${message}\n\nVisible Context:\n${formattedVisibleContext}`,
      temperature: 0.4,
    });

    return NextResponse.json({
      reply: sanitizeAIReply(
        reply || "No response was generated."
      ),
    });
  } catch (error) {
    console.error(
      "AI chat request failed",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Failed to generate chat response." },
      { status: 500 }
    );
  }
}

function classifyMessageIntent(
  message: string,
  visibleContext: AIVisibleContext | null
) {
  const normalized = message.trim().toLowerCase();
  const compact = normalized.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

  if (!compact) {
    return "unrelated" as const;
  }

  if (
    /^(hi|hii+|hello|helllo|hey|yo|sup|good morning|good afternoon|good evening)\b/.test(
      compact
    ) &&
    compact.split(" ").length <= 4
  ) {
    return "greeting" as const;
  }

  if (
    /^(thanks|thank you|ok|okay|cool|nice|great|bye|goodbye|see you)\b/.test(
      compact
    ) &&
    compact.split(" ").length <= 4
  ) {
    return "greeting" as const;
  }

  if (RETAIL_TOPIC_KEYWORDS.some((keyword) => compact.includes(keyword))) {
    return "retail" as const;
  }

  if (
    visibleContext &&
    CONTEXTUAL_VIEW_KEYWORDS.some((keyword) => compact.includes(keyword))
  ) {
    return "retail" as const;
  }

  if (compact.split(" ").length <= 6) {
    return "unrelated" as const;
  }

  return "retail" as const;
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

function sanitizeAIReply(reply: string) {
  const trimmed = reply.trim();

  const withoutGroundingIntro = trimmed
    .replace(
      /^This answer is grounded in the visible[^\n]*\n*/i,
      ""
    )
    .replace(/^Visible signals:[^\n]*\n*/i, "")
    .trim();

  if (withoutGroundingIntro) {
    return withoutGroundingIntro;
  }

  return trimmed;
}

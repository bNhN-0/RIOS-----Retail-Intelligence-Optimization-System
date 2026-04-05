import { parseJsonResponse } from "@/lib/utils/aiParsing";
import {
  formatVisibleContext,
  type AIVisibleContext,
} from "@/features/ai/utils/visibleContext";

export const AI_REPORT_TYPES = [
  "quick-summary",
  "screenshot-summary",
  "full-pdf",
] as const;

export type AIReportType = (typeof AI_REPORT_TYPES)[number];

export type AIReportSection = {
  title: string;
  body: string;
};

export type AIReportResult = {
  reportType: AIReportType;
  title: string;
  generatedAt: string;
  pageTitle: string;
  route: string;
  selectedFilters: Array<{ label: string; value: string }>;
  kpiSummary: Array<{ label: string; value: string }>;
  topFindings: string[];
  notableProducts: string[];
  recommendedActions: string[];
  screenshotNarrative?: string;
  sections: AIReportSection[];
};

type AIReportCandidate = Partial<AIReportResult>;

export function isAIReportType(value: unknown): value is AIReportType {
  return AI_REPORT_TYPES.includes(value as AIReportType);
}

export function buildReportPrompt({
  prompt,
  reportType,
  visibleContext,
  hasScreenshot,
}: {
  prompt: string;
  reportType: AIReportType;
  visibleContext: AIVisibleContext;
  hasScreenshot: boolean;
}) {
  const reportLabel =
    reportType === "quick-summary"
      ? "Quick Summary Report"
      : reportType === "screenshot-summary"
        ? "Screenshot-Based Report"
        : "Full PDF Report";

  return [
    `User request: ${prompt}`,
    `Requested report type: ${reportLabel}`,
    `Screenshot provided: ${hasScreenshot ? "yes" : "no"}`,
    "Return strict JSON with these keys:",
    JSON.stringify(
      {
        title: "string",
        pageTitle: "string",
        route: "string",
        selectedFilters: [{ label: "string", value: "string" }],
        kpiSummary: [{ label: "string", value: "string" }],
        topFindings: ["string"],
        notableProducts: ["string"],
        recommendedActions: ["string"],
        screenshotNarrative: "string optional",
        sections: [{ title: "string", body: "string" }],
      },
      null,
      2,
    ),
    "Use only the visible dashboard context. Do not invent unseen charts, hidden tabs, or unavailable products.",
    "Keep findings practical and action-oriented.",
    `Visible dashboard context:\n${formatVisibleContext(visibleContext)}`,
  ].join("\n\n");
}

export function normalizeAIReportResult(
  content: string | null | undefined,
  reportType: AIReportType,
  visibleContext: AIVisibleContext,
) {
  const parsed = parseJsonResponse<AIReportCandidate>(content);

  const selectedFilters = toLabelValuePairs(
    parsed?.selectedFilters,
    visibleContext.filters,
  );
  const kpiSummary = toLabelValuePairs(
    parsed?.kpiSummary,
    visibleContext.visibleKpis ?? {},
  );
  const topFindings = toStringList(
    parsed?.topFindings,
    deriveTopFindings(visibleContext),
  );
  const notableProducts = toStringList(
    parsed?.notableProducts,
    deriveNotableProducts(visibleContext),
  );
  const recommendedActions = toStringList(
    parsed?.recommendedActions,
    deriveRecommendedActions(visibleContext),
  );
  const screenshotNarrative = asOptionalString(parsed?.screenshotNarrative);
  const title =
    asOptionalString(parsed?.title) ??
    buildDefaultReportTitle(reportType, visibleContext.title);
  const pageTitle = asOptionalString(parsed?.pageTitle) ?? visibleContext.title;
  const route = asOptionalString(parsed?.route) ?? visibleContext.route;

  const fallbackSections = buildFallbackSections({
    pageTitle,
    selectedFilters,
    kpiSummary,
    topFindings,
    notableProducts,
    recommendedActions,
    screenshotNarrative,
    reportType,
  });

  return {
    reportType,
    title,
    generatedAt: new Date().toISOString(),
    pageTitle,
    route,
    selectedFilters,
    kpiSummary,
    topFindings,
    notableProducts,
    recommendedActions,
    ...(screenshotNarrative ? { screenshotNarrative } : {}),
    sections: toSections(parsed?.sections, fallbackSections),
  } satisfies AIReportResult;
}

export function renderReportAsMarkdown(report: AIReportResult) {
  const lines = [
    `# ${report.title}`,
    "",
    `Page: ${report.pageTitle}`,
    `Route: ${report.route}`,
    `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
    "",
    "## Selected Filters",
    ...(report.selectedFilters.length
      ? report.selectedFilters.map((item) => `- ${item.label}: ${item.value}`)
      : ["- None"]),
    "",
    "## KPI Summary",
    ...(report.kpiSummary.length
      ? report.kpiSummary.map((item) => `- ${item.label}: ${item.value}`)
      : ["- None"]),
    "",
    "## Top Findings",
    ...(report.topFindings.length
      ? report.topFindings.map((item) => `- ${item}`)
      : ["- No notable findings available."]),
    "",
    "## Notable Products",
    ...(report.notableProducts.length
      ? report.notableProducts.map((item) => `- ${item}`)
      : ["- No product-specific notes available."]),
    "",
    "## Recommended Actions",
    ...(report.recommendedActions.length
      ? report.recommendedActions.map((item) => `- ${item}`)
      : ["- No actions available."]),
  ];

  if (report.screenshotNarrative) {
    lines.push("", "## Screenshot Narrative", `- ${report.screenshotNarrative}`);
  }

  return lines.join("\n");
}

export function renderReportAsHtml(report: AIReportResult, screenshotDataUrl?: string) {
  const formatList = (items: string[]) =>
    items.length
      ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : "<p>None</p>";
  const formatPairs = (items: Array<{ label: string; value: string }>) =>
    items.length
      ? `<ul>${items
          .map(
            (item) =>
              `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</li>`,
          )
          .join("")}</ul>`
      : "<p>None</p>";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(report.title)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
      h1, h2 { margin-bottom: 12px; }
      .meta { color: #475569; margin-bottom: 24px; }
      .card { border: 1px solid #cbd5e1; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
      .screenshot { width: 100%; border: 1px solid #cbd5e1; border-radius: 12px; margin-top: 12px; }
      ul { padding-left: 20px; }
      li { margin: 6px 0; }
      @media print {
        body { margin: 18px; }
        .card { break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(report.title)}</h1>
    <p class="meta">
      <strong>Page:</strong> ${escapeHtml(report.pageTitle)}<br />
      <strong>Route:</strong> ${escapeHtml(report.route)}<br />
      <strong>Generated:</strong> ${escapeHtml(
        new Date(report.generatedAt).toLocaleString(),
      )}
    </p>

    <section class="card">
      <h2>Selected Filters</h2>
      ${formatPairs(report.selectedFilters)}
    </section>

    <section class="card">
      <h2>KPI Snapshot</h2>
      ${formatPairs(report.kpiSummary)}
    </section>

    <section class="card">
      <h2>Top Findings</h2>
      ${formatList(report.topFindings)}
    </section>

    <section class="card">
      <h2>Notable Products</h2>
      ${formatList(report.notableProducts)}
    </section>

    <section class="card">
      <h2>Recommendations</h2>
      ${formatList(report.recommendedActions)}
    </section>

    ${
      screenshotDataUrl
        ? `<section class="card">
      <h2>Dashboard Screenshot</h2>
      <img class="screenshot" src="${screenshotDataUrl}" alt="Dashboard screenshot" />
      ${
        report.screenshotNarrative
          ? `<p>${escapeHtml(report.screenshotNarrative)}</p>`
          : ""
      }
    </section>`
        : ""
    }

    ${report.sections
      .map(
        (section) => `<section class="card">
      <h2>${escapeHtml(section.title)}</h2>
      <p>${escapeHtml(section.body).replace(/\n/g, "<br />")}</p>
    </section>`,
      )
      .join("")}
  </body>
</html>`;
}

function buildDefaultReportTitle(reportType: AIReportType, pageTitle: string) {
  if (reportType === "quick-summary") {
    return `${pageTitle} Quick Summary`;
  }

  if (reportType === "screenshot-summary") {
    return `${pageTitle} Screenshot Summary`;
  }

  return `${pageTitle} PDF Report`;
}

function toLabelValuePairs(
  candidate: unknown,
  fallback: Record<string, unknown>,
) {
  if (Array.isArray(candidate)) {
    const items = candidate
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const row = item as Record<string, unknown>;
        const label = asOptionalString(row.label);
        const value = asOptionalString(row.value);

        return label && value ? { label, value } : null;
      })
      .filter((item): item is { label: string; value: string } => item !== null);

    if (items.length) {
      return items;
    }
  }

  return Object.entries(fallback)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([label, value]) => ({ label, value: stringifyValue(value) }));
}

function toStringList(candidate: unknown, fallback: string[]) {
  if (Array.isArray(candidate)) {
    const items = candidate
      .map((item) => asOptionalString(item))
      .filter((item): item is string => Boolean(item));

    if (items.length) {
      return items;
    }
  }

  return fallback;
}

function toSections(candidate: unknown, fallback: AIReportSection[]) {
  if (Array.isArray(candidate)) {
    const items = candidate
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const section = item as Record<string, unknown>;
        const title = asOptionalString(section.title);
        const body = asOptionalString(section.body);

        return title && body ? { title, body } : null;
      })
      .filter((item): item is AIReportSection => item !== null);

    if (items.length) {
      return items;
    }
  }

  return fallback;
}

function buildFallbackSections({
  pageTitle,
  selectedFilters,
  kpiSummary,
  topFindings,
  notableProducts,
  recommendedActions,
  screenshotNarrative,
  reportType,
}: {
  pageTitle: string;
  selectedFilters: Array<{ label: string; value: string }>;
  kpiSummary: Array<{ label: string; value: string }>;
  topFindings: string[];
  notableProducts: string[];
  recommendedActions: string[];
  screenshotNarrative?: string;
  reportType: AIReportType;
}) {
  const sections: AIReportSection[] = [
    {
      title: "Summary",
      body: `Dashboard page ${pageTitle} was summarized using the currently visible filters and KPIs.`,
    },
    {
      title: "Filters",
      body: selectedFilters.length
        ? selectedFilters.map((item) => `${item.label}: ${item.value}`).join("\n")
        : "No filters were selected.",
    },
    {
      title: "KPI Snapshot",
      body: kpiSummary.length
        ? kpiSummary.map((item) => `${item.label}: ${item.value}`).join("\n")
        : "No KPI summary was available.",
    },
    {
      title: "Findings",
      body: topFindings.join("\n") || "No findings were generated.",
    },
    {
      title: "Notable Products",
      body: notableProducts.join("\n") || "No product-level items were detected.",
    },
    {
      title: "Recommendations",
      body: recommendedActions.join("\n") || "No recommendations were generated.",
    },
  ];

  if (reportType !== "quick-summary" && screenshotNarrative) {
    sections.push({
      title: "Screenshot Narrative",
      body: screenshotNarrative,
    });
  }

  return sections;
}

function deriveTopFindings(visibleContext: AIVisibleContext) {
  const findings: string[] = [];

  if (visibleContext.visibleAlerts?.length) {
    findings.push(
      ...visibleContext.visibleAlerts.map(
        (alert) => `${alert.title}${alert.message ? `: ${alert.message}` : ""}`,
      ),
    );
  }

  const kpis = Object.entries(visibleContext.visibleKpis ?? {});
  if (kpis.length) {
    findings.push(
      `The page exposes ${kpis.length} KPI signals, led by ${kpis
        .slice(0, 3)
        .map(([label, value]) => `${label} (${stringifyValue(value)})`)
        .join(", ")}.`,
    );
  }

  return findings.length
    ? findings
    : ["The visible dashboard context does not include explicit alert findings."];
}

function deriveNotableProducts(visibleContext: AIVisibleContext) {
  const firstTable = visibleContext.visibleTables?.find((table) =>
    /product/i.test(table.name),
  );

  if (!firstTable?.rows.length) {
    return ["No product-specific rows are visible in the current dashboard context."];
  }

  return firstTable.rows.slice(0, 3).map((row) => {
    const productName = stringifyValue(
      row.product ?? row.productName ?? row.name ?? "Unknown product",
    );
    const status = stringifyValue(row.status ?? "No status");
    const conversion = stringifyValue(row.conversion ?? row.conversionRate ?? "N/A");

    return `${productName} with status ${status} and conversion ${conversion}.`;
  });
}

function deriveRecommendedActions(visibleContext: AIVisibleContext) {
  const recommendations: string[] = [];

  if (visibleContext.visibleAlerts?.length) {
    recommendations.push(
      "Prioritize the highest-severity visible alert and verify the affected product or shelf in-store.",
    );
  }

  if (visibleContext.visibleTables?.some((table) => /product/i.test(table.name))) {
    recommendations.push(
      "Review low-conversion or flagged products in the product table and compare placement against top-touch items.",
    );
  }

  if (visibleContext.visibleCharts?.length) {
    recommendations.push(
      "Use the visible chart trend to confirm whether intervention should focus on traffic, engagement, or conversion.",
    );
  }

  return recommendations.length
    ? recommendations
    : ["Review the current dashboard filters and KPI mix before taking action."];
}

function stringifyValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value === null || value === undefined) {
    return "";
  }

  return JSON.stringify(value);
}

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

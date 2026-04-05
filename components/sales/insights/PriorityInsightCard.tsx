"use client";

import { useMemo } from "react";

import {
  buildBehaviorMetrics,
  buildEvidence,
  formatConfidence,
  getSeverityClasses,
  getTypeLabel,
} from "@/components/sales/insights/helpers";
import { InsightCardModel } from "@/components/sales/insights/types";
import { Link } from "@/i18n/navigation";

type PriorityInsightCardProps = {
  insight: InsightCardModel;
  expanded: boolean;
  onToggle: () => void;
};

export function PriorityInsightCard({
  insight,
  expanded,
  onToggle,
}: PriorityInsightCardProps) {
  const evidence = buildEvidence(insight);
  const metricsBefore = useMemo(() => buildBehaviorMetrics(insight), [insight]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Feed
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold uppercase ${getSeverityClasses(insight.severity)}`}
              >
                {insight.severity}
              </span>
              <span className="text-xs font-medium text-slate-500">{getTypeLabel(insight.type)}</span>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-slate-900">{insight.title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              Signal score {insight.priorityScore} -{" "}
              {insight.impact.revenue ?? insight.impact.conversion ?? "Impact pending"}
            </p>
          </div>
        </div>
        <span className="pt-0.5 text-xs font-medium text-slate-400">{expanded ? "Hide" : "Open"}</span>
      </button>

      {expanded && (
        <div className="border-t border-slate-200 px-4 py-4">
          <div className="space-y-3">
            <div className="grid gap-3 xl:grid-cols-[1.15fr_0.95fr_0.9fr]">
              <SummaryBlock title="What changed" body={insight.summary} />
              <SummaryBlock title="Why it matters" body={insight.why} />
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Signal details
                </p>
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  <p>
                    <span className="font-medium text-slate-900">Severity:</span> {insight.severity}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Estimated impact:</span>{" "}
                    {insight.impact.conversion ?? "-"} / {insight.impact.revenue ?? "-"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Current signal:</span>{" "}
                    {insight.context.trend ?? "Mixed sales and behavior signals"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <MetricRow label="Visitors" value={metricsBefore.visitors.toLocaleString("en-US")} />
              <MetricRow label="Interactions" value={metricsBefore.interactions.toLocaleString("en-US")} />
              <MetricRow label="Avg hold time" value={`${metricsBefore.avgHoldTime.toFixed(1)}s`} />
              <MetricRow label="Conversion" value={`${Math.round(metricsBefore.conversionRate * 100)}%`} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Why we think this
              </p>
              <div className="mt-2 space-y-1.5 text-sm text-slate-700">
                {insight.reasoning.map((reason) => (
                  <p key={reason}>- {reason}</p>
                ))}
              </div>
            </div>

            <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
              <MetricRow label="Impact" value={insight.impact.conversion ?? "-"} />
              <MetricRow label="Revenue" value={insight.impact.revenue ?? "-"} />
              <MetricRow label="Confidence" value={formatConfidence(insight.confidence)} />
              <MetricRow label="Evidence" value={`${evidence.length} sources`} />
            </div>

            <div className="flex flex-wrap gap-2">
              {evidence.map((item) => (
                <span key={item} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  {item}
                </span>
              ))}
            </div>

            {insight.sourceLinks.length > 0 ? (
              <div className="pt-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Supporting pages
                </p>
                <div className="flex flex-wrap gap-2">
                  {insight.sourceLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{body}</p>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

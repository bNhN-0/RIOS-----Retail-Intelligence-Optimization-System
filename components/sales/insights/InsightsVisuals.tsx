"use client";

import { formatCurrencyTHB } from "@/lib/formatters/currency";
import { InsightCardModel } from "@/components/sales/insights/types";
import { getSeverityClasses } from "@/components/sales/insights/helpers";

export function InsightsVisuals({ insights }: { insights: InsightCardModel[] }) {
  const topInsights = insights.slice(0, 5);
  const totalRevenueLift = insights.reduce((sum, insight) => sum + insight.estimatedRevenueLift, 0);
  const criticalCount = insights.filter((insight) => insight.severity === "high").length;
  const maxPriority = Math.max(...topInsights.map((insight) => insight.priorityScore), 1);
  const maxRevenue = Math.max(...topInsights.map((insight) => insight.estimatedRevenueLift), 1);

  const sourceCounts = {
    trend: insights.filter((insight) => insight.source.includes("trend")).length,
    behavior: insights.filter((insight) => insight.source.includes("behavior")).length,
    product: insights.filter((insight) => insight.source.includes("product")).length,
  };

  const sourceMax = Math.max(sourceCounts.trend, sourceCounts.behavior, sourceCounts.product, 1);

  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <SnapshotCard label="Potential revenue" value={formatCurrencyTHB(totalRevenueLift)} detail="Estimated value across the active feed" tone="text-emerald-700 dark:text-emerald-300" />
        <SnapshotCard label="Evidence coverage" value={`${topInsights.length > 0 ? Math.round(((sourceCounts.trend + sourceCounts.behavior + sourceCounts.product) / (topInsights.length * 3)) * 100) : 0}%`} detail="Signal coverage across trend, behavior, and product sources" tone="text-sky-700 dark:text-sky-300" />
        <SnapshotCard label="Critical alerts" value={criticalCount.toString()} detail="High-severity signals in the current feed" tone="text-rose-600 dark:text-rose-300" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Signal ladder</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Visual ranking of the current signal stack.</p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Score</span>
          </div>

          <div className="mt-4 space-y-3">
            {topInsights.map((insight) => (
              <div key={insight.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{insight.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{insight.impact.revenue ?? insight.impact.conversion ?? "Impact pending"}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold uppercase ${getSeverityClasses(insight.severity)}`}>
                    {insight.priorityScore}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-2 rounded-full bg-slate-900 dark:bg-slate-100" style={{ width: `${(insight.priorityScore / maxPriority) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Revenue upside and evidence coverage</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Estimated value and signal coverage for the active feed.</p>
          </div>

          <div className="mt-4 space-y-4">
            <div className="space-y-3">
              {topInsights.slice(0, 4).map((insight) => (
                <div key={`${insight.id}-impact`} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-slate-700 dark:text-slate-300">{insight.product ?? insight.category ?? insight.title}</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrencyTHB(insight.estimatedRevenueLift)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(insight.estimatedRevenueLift / maxRevenue) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Evidence coverage</p>
              <div className="mt-3 space-y-2.5">
                <SourceBar label="Trend" value={sourceCounts.trend} max={sourceMax} color="bg-sky-500" />
                <SourceBar label="Behavior" value={sourceCounts.behavior} max={sourceMax} color="bg-amber-500" />
                <SourceBar label="Product" value={sourceCounts.product} max={sourceMax} color="bg-violet-500" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function SnapshotCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function SourceBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-700 dark:text-slate-300">{label}</span>
        <span className="font-medium text-slate-900 dark:text-slate-100">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";

export type RecommendationFeedItem = {
  id: string;
  title: string;
  action: string;
  impact: string;
  href: string;
  severity: "high" | "medium" | "low";
};

export function RecommendationFeed({ items }: { items: RecommendationFeedItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const featured = items.slice(0, 3);
  const remainingItems = items.slice(3);
  const remaining = remainingItems.length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Signal highlights</h3>
          <p className="text-xs text-slate-500">Cross-insight highlights grouped separately from the main signal feed.</p>
        </div>
        <span className="text-xs text-slate-500">{items.length} highlights</span>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {featured.map((item) => (
          <Link key={item.id} href={item.href} className="rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{item.severity}</span>
              <span className="text-xs font-medium text-slate-600">{item.impact}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-900">{item.action}</p>
            <p className="mt-1 text-xs text-slate-500">{item.title}</p>
          </Link>
        ))}
      </div>

      {remaining > 0 && (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-500 transition hover:bg-slate-100"
          >
            {expanded
              ? `Hide ${remaining} additional highlights`
              : `Show ${remaining} more highlights`}
          </button>

          {expanded && (
            <div className="grid gap-3 lg:grid-cols-3">
              {remainingItems.map((item) => (
                <Link key={item.id} href={item.href} className="rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{item.severity}</span>
                    <span className="text-xs font-medium text-slate-600">{item.impact}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900">{item.action}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.title}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {items.length === 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          No highlights for the current filters.
        </div>
      )}
    </section>
  );
}

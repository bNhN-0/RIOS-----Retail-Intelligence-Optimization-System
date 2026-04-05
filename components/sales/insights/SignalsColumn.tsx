"use client";

import { useState } from "react";

import { getSeverityClasses, getTypeLabel } from "@/components/sales/insights/helpers";
import { InsightCardModel } from "@/components/sales/insights/types";
import { Link } from "@/i18n/navigation";

export function SignalsColumn({ title, items }: { title: string; items: InsightCardModel[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-500">{items.length} signals</span>
      </div>

      <div className="mt-3 space-y-3">
        {items.map((item) => {
          const expanded = expandedId === item.id;
          return (
            <div key={item.id} className="rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setExpandedId((current) => (current === item.id ? null : item.id))}
                className="flex w-full items-start justify-between gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
                </div>
                <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold uppercase ${getSeverityClasses(item.severity)}`}>
                  {item.severity}
                </span>
              </button>

              {expanded && (
                <div className="border-t border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Why it happened</p>
                      <p className="mt-1 text-sm text-slate-700">{item.why}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Observation details</p>
                      <div className="mt-1 space-y-1 text-sm text-slate-700">
                        {item.action.map((action) => (
                          <p key={action}>-&gt; {action}</p>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{getTypeLabel(item.type)}</span>
                      <span>{item.impact.revenue ?? item.impact.conversion}</span>
                      <span>{item.confidence}% confidence</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.sourceLinks.map((link) => (
                        <Link key={link.label} href={link.href} className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100">
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

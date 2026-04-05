"use client";

import { useMemo, useState } from "react";

import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import {
  buildPriorityFeed,
  buildRecommendationFeed,
} from "@/components/sales/insights/helpers";
import { InsightsControls } from "@/components/sales/insights/InsightsControls";
import { InsightsVisuals } from "@/components/sales/insights/InsightsVisuals";
import { PriorityInsightCard } from "@/components/sales/insights/PriorityInsightCard";
import { RecommendationFeed } from "@/components/sales/insights/RecommendationFeed";
import { SignalsColumn } from "@/components/sales/insights/SignalsColumn";
import type { InsightContextState } from "@/components/sales/insights/types";
import { SalesPageHeader } from "@/features/sales/components/SalesPageHeader";

const defaultContext: InsightContextState = {
  selectedCategory: "All Categories",
  selectedProduct: "All Products",
  selectedTimeSlot: null,
};

export default function SalesInsightsPage() {
  const [context, setContext] = useState<InsightContextState>(defaultContext);
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);

  const allInsights = useMemo(
    () => buildPriorityFeed(defaultContext),
    [],
  );
  const insights = useMemo(
    () => buildPriorityFeed(context),
    [context],
  );
  const categories = useMemo(
    () => [
      "All Categories",
      ...Array.from(
        new Set(
          allInsights
            .map((insight) => insight.category)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    ],
    [allInsights],
  );
  const products = useMemo(() => {
    const scopedInsights =
      context.selectedCategory === "All Categories"
        ? allInsights
        : allInsights.filter(
            (insight) => insight.category === context.selectedCategory,
          );

    return [
      "All Products",
      ...Array.from(
        new Set(
          scopedInsights
            .map((insight) => insight.product)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    ];
  }, [allInsights, context.selectedCategory]);
  const timeSlots = useMemo(
    () =>
      Array.from(
        new Set(
          allInsights
            .map((insight) => insight.timeSlot)
            .filter((value): value is string => Boolean(value)),
        )
      ).sort((left, right) => left.localeCompare(right)),
    [allInsights],
  );
  const recommendations = useMemo(
    () => buildRecommendationFeed(insights),
    [insights],
  );
  const highSeveritySignals = useMemo(
    () => insights.filter((insight) => insight.severity === "high"),
    [insights],
  );
  const opportunitySignals = useMemo(
    () => insights.filter((insight) => insight.type === "opportunity"),
    [insights],
  );

  useRegisterAIVisibleContext("sales-insights-main", {
    page: "sales-insights",
    title: "Sales Alerts & Insights",
    filters: {
      category: context.selectedCategory,
      product: context.selectedProduct,
      timeSlot: context.selectedTimeSlot,
    },
    visibleKpis: {
      "Priority Signals": insights.length,
      "High Severity": highSeveritySignals.length,
      Recommendations: recommendations.length,
    },
    visibleAlerts: highSeveritySignals.map((insight) => ({
      id: insight.id,
      title: insight.title,
      severity: insight.severity,
      message: insight.summary,
    })),
    visibleTables: [
      {
        name: "Priority Insight Feed",
        columns: [
          "Title",
          "Severity",
          "Type",
          "Priority Score",
          "Product",
          "Category",
          "Time Slot",
          "Estimated Revenue Lift",
        ],
        rows: insights.map((insight) => ({
          title: insight.title,
          severity: insight.severity,
          type: insight.type,
          priorityScore: insight.priorityScore,
          product: insight.product ?? "-",
          category: insight.category ?? "-",
          timeSlot: insight.timeSlot ?? "-",
          estimatedRevenueLift: insight.estimatedRevenueLift,
        })),
      },
    ],
    visibleCharts: [
      {
        title: "Insights Visual Summary",
        type: "insight-summary",
        data: insights,
      },
    ],
  });

  return (
    <div className="space-y-6">
      <SalesPageHeader />

      <InsightsControls
        context={context}
        categories={categories}
        products={products}
        timeSlots={timeSlots}
        onCategoryChange={(selectedCategory) =>
          setContext((current) => ({
            ...current,
            selectedCategory,
            selectedProduct: "All Products",
          }))
        }
        onProductChange={(selectedProduct) =>
          setContext((current) => ({
            ...current,
            selectedProduct,
          }))
        }
        onTimeSlotChange={(selectedTimeSlot) =>
          setContext((current) => ({
            ...current,
            selectedTimeSlot,
          }))
        }
      />

      <InsightsVisuals insights={insights} />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-3">
          {insights.map((insight) => (
            <PriorityInsightCard
              key={insight.id}
              insight={insight}
              expanded={expandedInsightId === insight.id}
              onToggle={() =>
                setExpandedInsightId((current) =>
                  current === insight.id ? null : insight.id,
                )
              }
            />
          ))}
        </section>

        <div className="space-y-4">
          <SignalsColumn title="Critical Signals" items={highSeveritySignals} />
          <SignalsColumn title="Opportunities" items={opportunitySignals} />
        </div>
      </div>

      <RecommendationFeed items={recommendations} />
    </div>
  );
}

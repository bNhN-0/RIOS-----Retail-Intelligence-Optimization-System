"use client";

import { SalesSectionHeader } from "@/features/sales/components/SalesSectionHeader";
import { Card, CardHeader } from "@/components/ui/card";
import { InsightContextState } from "@/components/sales/insights/types";

type InsightsControlsProps = {
  context: InsightContextState;
  categories: string[];
  products: string[];
  timeSlots: string[];
  onCategoryChange: (category: string) => void;
  onProductChange: (product: string) => void;
  onTimeSlotChange: (slot: string | null) => void;
};

export function InsightsControls({ context, categories, products, timeSlots, onCategoryChange, onProductChange, onTimeSlotChange }: InsightsControlsProps) {
  return (
    <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <CardHeader className="gap-3 p-4">
        <SalesSectionHeader
          badge="Alerts & Insights"
          title="Alerts & Insights"
          actionsClassName="gap-2.5 lg:justify-end"
          actions={
            <>
              <select
                value={context.selectedCategory}
                onChange={(event) => onCategoryChange(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                {categories.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <select
                value={context.selectedProduct}
                onChange={(event) => onProductChange(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                {products.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <select
                value={context.selectedTimeSlot ?? "All Slots"}
                onChange={(event) => onTimeSlotChange(event.target.value === "All Slots" ? null : event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                <option>All Slots</option>
                {timeSlots.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </>
          }
        />
      </CardHeader>
    </Card>
  );
}

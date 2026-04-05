"use client";

import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import { InventoryExplorerSection } from "@/features/inventory/components/overview/InventoryExplorerSection";
import { InventoryValuePieSection } from "@/features/inventory/components/overview/InventoryValuePieSection";
import { OverviewMetricsGrid } from "@/features/inventory/components/overview/OverviewMetricsGrid";

export default function InventoryOverviewContent() {
  useRegisterAIVisibleContext("inventory-overview-page", {
    page: "inventory-overview",
    title: "Inventory Overview",
  });

  return (
    <>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">
          Inventory Overview
        </h2>
       
      </div>

      <OverviewMetricsGrid />

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <InventoryExplorerSection />
        <InventoryValuePieSection />
      </div>

    </>
  );
}

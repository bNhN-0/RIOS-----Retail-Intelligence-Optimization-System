import { Suspense } from "react";
import { OverviewInventoryExplorerContent } from "@/features/inventory/components/overview/OverviewInventoryExplorerContent";

export function InventoryExplorerSection() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Inventory Explorer
        </h3>
      </div>

      <div className="mt-3">
        <Suspense fallback={<div className="p-4 text-sm">Loading inventory...</div>}>
          <OverviewInventoryExplorerContent />
        </Suspense>
      </div>
    </section>
  );
}

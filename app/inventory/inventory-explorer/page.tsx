"use client";

import { Suspense } from "react";
import { InventoryPageHeader } from "@/features/inventory/components/InventoryPageHeader";
import InventoryExplorerContent from "@/features/inventory/components/explorer/InventoryExplorerContent";

export default function Page() {
  return (
    <div className="space-y-5">
      <InventoryPageHeader />
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <InventoryExplorerContent />
      </Suspense>
    </div>
  );
}

import { InventoryPageHeader } from "@/features/inventory/components/InventoryPageHeader";
import InventoryOverviewContent from "@/features/inventory/components/overview/InventoryOverviewContent";

export default function Page() {
  return (
    <div className="space-y-5">
      <InventoryPageHeader />
      <InventoryOverviewContent />
    </div>
  );
}

import { InventoryPageHeader } from "@/features/inventory/components/InventoryPageHeader";
import InteractiveRetailShopMap from "@/features/inventory/components/interactive-map/InteractiveRetailShopMap";

export default function Page() {
  return (
    <div className="space-y-5">
      <InventoryPageHeader />
      <InteractiveRetailShopMap />
    </div>
  );
}

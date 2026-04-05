import { Suspense } from "react";
import { CreateOrderContent } from "@/features/inventory/components/replenishment/CreateOrderContent";

export default function CreateOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateOrderContent />
    </Suspense>
  );
}

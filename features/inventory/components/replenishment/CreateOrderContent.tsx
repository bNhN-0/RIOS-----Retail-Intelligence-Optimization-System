"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import { InventoryPageHeader } from "@/features/inventory/components/InventoryPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "@/lib/hooks/navigationHooks";
import { getBackendRequestUrl, pickString, type BackendRow } from "@/lib/api/riosBackend";

type SupplierProductInfo = {
  productId: string;
  productName: string;
  brand: string;
  supplierId: string;
  supplierName: string;
  contactName: string;
  phone: string;
  email: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getDefaultExpectedArrivalValue() {
  const next = new Date();
  next.setDate(next.getDate() + 7);
  next.setHours(10, 0, 0, 0);
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(
    next.getDate(),
  )}T${pad(next.getHours())}:${pad(next.getMinutes())}`;
}

function toIsoWithOffset(value: string) {
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return new Date().toISOString();
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  const offsetMinutes = -localDate.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(
    minute,
  )}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

async function readResponseRecord(response: Response) {
  const body = await response.text();
  if (!body) return null;
  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === "object"
      ? (parsed as BackendRow)
      : ({ detail: body } as BackendRow);
  } catch {
    return { detail: body } as BackendRow;
  }
}

function readError(payload: BackendRow | null, status: number) {
  return (
    pickString(payload || {}, ["detail", "message", "error"], `API error ${status}`) ||
    `API error ${status}`
  );
}

function normalizeSupplierProductInfo(payload: unknown) {
  const row = payload && typeof payload === "object" ? (payload as BackendRow) : {};
  const productId = pickString(row, ["product_id"]);
  const supplierId = pickString(row, ["supplier_id"]);

  if (!productId || !supplierId) {
    return null;
  }

  return {
    productId,
    productName: pickString(row, ["product_name"]),
    brand: pickString(row, ["brand"]),
    supplierId,
    supplierName: pickString(row, ["supplier_name"]),
    contactName: pickString(row, ["contact_name"]),
    phone: pickString(row, ["phone"]),
    email: pickString(row, ["email"]),
  } satisfies SupplierProductInfo;
}

export function CreateOrderContent() {
  const params = useSearchParams();
  const productId = params.get("product_id") || "";
  const fallbackProductName = params.get("product") || "";

  const supplierInfoQuery = useQuery({
    enabled: Boolean(productId),
    queryKey: ["replenishment", "product-supplier", productId],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      const response = await fetch(
        getBackendRequestUrl(`/products/${encodeURIComponent(productId)}/supplier`),
        {
          cache: "no-store",
          signal,
        },
      );
      const payload = await readResponseRecord(response);
      if (!response.ok) throw new Error(readError(payload, response.status));
      const normalized = normalizeSupplierProductInfo(payload);
      if (!normalized) throw new Error("Supplier information was not returned.");
      return normalized;
    },
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const supplierInfo = supplierInfoQuery.data;
  const [quantity, setQuantity] = useState(1);
  const [expectedArrivalDate, setExpectedArrivalDate] = useState(
    getDefaultExpectedArrivalValue(),
  );
  const [notes, setNotes] = useState(
    fallbackProductName
      ? `Restock ${fallbackProductName}`
      : "Restock low-inventory product",
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const payload = useMemo(
    () => ({
      supplier_id: supplierInfo?.supplierId || "",
      expected_arrival_date: toIsoWithOffset(expectedArrivalDate),
      notes: notes.trim(),
      items: [
        {
          product_id: supplierInfo?.productId || productId,
          quantity_ordered: quantity,
        },
      ],
    }),
    [expectedArrivalDate, notes, productId, quantity, supplierInfo],
  );
  useRegisterAIVisibleContext("inventory-create-order-main", {
    page: "inventory-create-order",
    title: "Create Inventory Order",
    filters: {
      productId,
      supplierLoaded: Boolean(supplierInfo),
    },
    visibleKpis: {
      Quantity: quantity,
      "Supplier Loaded": supplierInfo ? "Yes" : "No",
      "Expected Arrival Date": expectedArrivalDate,
    },
    visibleTables: supplierInfo
      ? [
          {
            name: "Supplier Details",
            columns: [
              "Supplier",
              "Contact",
              "Phone",
              "Email",
              "Product ID",
            ],
            rows: [
              {
                supplier: supplierInfo.supplierName,
                contact: supplierInfo.contactName,
                phone: supplierInfo.phone,
                email: supplierInfo.email,
                productId: supplierInfo.productId,
              },
            ],
          },
        ]
      : [],
    selectedEntity: supplierInfo
      ? {
          type: "product",
          id: supplierInfo.productId,
          label: supplierInfo.productName,
        }
      : productId
        ? {
            type: "product",
            id: productId,
            label: fallbackProductName || productId,
          }
        : undefined,
    visibleAlerts: [
      ...(successMessage
        ? [
            {
              id: "inventory-create-order-success",
              title: "Order created",
              severity: "low",
              message: successMessage,
            },
          ]
        : []),
      ...(submitError
        ? [
            {
              id: "inventory-create-order-error",
              title: "Order creation failed",
              severity: "high",
              message: submitError,
            },
          ]
        : []),
      ...(supplierInfoQuery.error instanceof Error
        ? [
            {
              id: "inventory-create-order-supplier-error",
              title: "Supplier information unavailable",
              severity: "medium",
              message: supplierInfoQuery.error.message,
            },
          ]
        : []),
    ],
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(getBackendRequestUrl("/replenishment/orders"), {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const responsePayload = await readResponseRecord(response);
      if (!response.ok) throw new Error(readError(responsePayload, response.status));
      return responsePayload;
    },
    onSuccess: () => {
      setSubmitError(null);
      setSuccessMessage("Order created successfully.");
    },
  });

  if (!productId) {
    return (
      <div className="space-y-5">
        <InventoryPageHeader />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Product ID is required to create an order.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <InventoryPageHeader />

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">Create Order</h2>
        <p className="text-sm text-slate-500">
          Supplier details are filled automatically from the selected product.
        </p>
      </div>

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}
      {submitError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {submitError}
        </div>
      ) : null}
      {supplierInfoQuery.error instanceof Error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {supplierInfoQuery.error.message}
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4 rounded-2xl border bg-white p-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">Order Details</h3>
            <p className="text-sm text-slate-500">
              Default expected arrival date is set within 7 days.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Product</span>
              <Input value={supplierInfo?.productName || fallbackProductName} readOnly />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Brand</span>
              <Input value={supplierInfo?.brand || ""} readOnly />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Quantity</span>
            <Input
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Expected Arrival Date</span>
            <Input
              type="datetime-local"
              value={expectedArrivalDate}
              onChange={(event) => setExpectedArrivalDate(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Note</span>
            <Textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>

          <div className="flex gap-2">
            <Button
              type="button"
              disabled={!supplierInfo || createOrderMutation.isPending}
              onClick={async () => {
                try {
                  setSubmitError(null);
                  setSuccessMessage(null);
                  await createOrderMutation.mutateAsync();
                } catch (error) {
                  setSuccessMessage(null);
                  setSubmitError(
                    error instanceof Error ? error.message : "Unable to create order.",
                  );
                }
              }}
            >
              {createOrderMutation.isPending ? "Creating..." : "Create Order"}
            </Button>
            <Button asChild variant="outline" type="button">
              <Link href="/inventory/replenishment">Back</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border bg-white p-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">Supplier Details</h3>
            <p className="text-sm text-slate-500">
              Loaded from <code>/products/{productId}/supplier</code>.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <span className="font-medium text-slate-900">Supplier</span>:{" "}
              {supplierInfo?.supplierName || "-"}
            </p>
            <p>
              <span className="font-medium text-slate-900">Contact</span>:{" "}
              {supplierInfo?.contactName || "-"}
            </p>
            <p>
              <span className="font-medium text-slate-900">Phone</span>:{" "}
              {supplierInfo?.phone || "-"}
            </p>
            <p>
              <span className="font-medium text-slate-900">Email</span>:{" "}
              {supplierInfo?.email || "-"}
            </p>
            <p>
              <span className="font-medium text-slate-900">Product ID</span>:{" "}
              {supplierInfo?.productId || productId}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

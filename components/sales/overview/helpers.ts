import { formatCurrencyTHB } from "@/lib/formatters/currency";
import { TooltipValue } from "./types";

export function formatCurrency(value: number) {
  return formatCurrencyTHB(value);
}

export function formatTooltipValue(value: TooltipValue) {
  if (typeof value === "number") {
    return formatCurrency(value);
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value ?? "";
}

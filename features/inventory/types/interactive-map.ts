export type ZoneStatus = "hot" | "warning" | "lowStock" | "normal";

export type ZoneType = "shelf" | "wallShelf" | "counter" | "entrance";

export type OverlayMode = "none" | "salesVolume" | "unitsOnShelf";
export type SalesPeriod = "today" | "weekly" | "monthly" | "yearly";

export type Zone = {
  id: string;
  name: string;
  type: ZoneType;
  product: string | null;
  level: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  status: ZoneStatus;
  traffic: number;
  interactions: number;
  stock: number | null;
  conversion: number | null;
  shelfValue: number | null;
  capacity: number | null;
  insight: string;
};

export type Camera = {
  id: string;
  x: number;
  y: number;
  rotate: number;
};

export type Totals = {
  shelfValue: number;
  occupancyRate: number;
  conversionRate: number;
  totalUnitsOnShelf: number;
};

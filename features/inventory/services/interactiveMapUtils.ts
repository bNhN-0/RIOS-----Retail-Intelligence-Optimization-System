import type {
  OverlayMode,
  Totals,
  Zone,
  ZoneType,
} from "@/features/inventory/types/interactive-map";

import { formatCurrencyTHB } from "@/lib/formatters/currency";

type ValueRange = {
  min: number;
  max: number;
};

type OverlayExtents = {
  salesVolume: ValueRange;
  unitsOnShelf: ValueRange;
};

const defaultZoneFill: Record<ZoneType, string> = {
  shelf: "#d9f99d",
  wallShelf: "#d9f99d",
  counter: "#a78bfa",
  entrance: "#fde68a",
};

const overlayFallbackFill: Record<ZoneType, string> = {
  shelf: "#e2e8f0",
  wallShelf: "#e2e8f0",
  counter: "#cbd5e1",
  entrance: "#e2e8f0",
};

const salesVolumePalette = [
  "#dbeafe",
  "#93c5fd",
  "#60a5fa",
  "#3b82f6",
  "#2563eb",
];

const unitsOnShelfPalette = [
  "#dcfce7",
  "#86efac",
  "#4ade80",
  "#22c55e",
  "#15803d",
];

function getValueRange(values: number[]): ValueRange {
  if (values.length === 0) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function getPaletteIndex(value: number, range: ValueRange, size: number) {
  if (range.max <= range.min) {
    return Math.floor((size - 1) / 2);
  }

  const normalized = (value - range.min) / (range.max - range.min);
  return Math.min(size - 1, Math.max(0, Math.round(normalized * (size - 1))));
}

export function getOverlayExtents(zones: Zone[]): OverlayExtents {
  return {
    salesVolume: getValueRange(
      zones
        .map((zone) => zone.shelfValue)
        .filter((value): value is number => value !== null),
    ),
    unitsOnShelf: getValueRange(
      zones
        .map((zone) => zone.stock)
        .filter((value): value is number => value !== null),
    ),
  };
}

export function getZoneFill(
  zone: Zone,
  overlayMode: OverlayMode,
  extents: OverlayExtents,
) {
  if (overlayMode === "none") {
    return defaultZoneFill[zone.type];
  }

  if (overlayMode === "salesVolume") {
    if (zone.shelfValue === null) {
      return overlayFallbackFill[zone.type];
    }

    return salesVolumePalette[
      getPaletteIndex(zone.shelfValue, extents.salesVolume, salesVolumePalette.length)
    ];
  }

  if (zone.stock === null) {
    return overlayFallbackFill[zone.type];
  }

  return unitsOnShelfPalette[
    getPaletteIndex(zone.stock, extents.unitsOnShelf, unitsOnShelfPalette.length)
  ];
}

export function getStroke(zone: Zone, selectedZone: Zone) {
  return selectedZone.id === zone.id ? "stroke-slate-950" : "stroke-slate-900";
}

export function formatPercent(value: number | null) {
  if (value === null) {
    return "-";
  }

  return `${value.toFixed(1)}%`;
}

export function formatCurrency(value: number) {
  return formatCurrencyTHB(value);
}

export function getZoneAreaLabel(type: ZoneType) {
  switch (type) {
    case "shelf":
    case "wallShelf":
      return "Retail shelf area";
    case "counter":
      return "Counter area";
    case "entrance":
      return "Store entrance";
  }
}

export function getTotals(zones: Zone[]): Totals {
  let weightedConversion = 0;
  let weightedTraffic = 0;
  let totalStock = 0;
  let totalCapacity = 0;

  const totals = zones.reduce(
    (acc, zone) => {
      acc.shelfValue += zone.shelfValue ?? 0;
      acc.totalUnitsOnShelf += zone.stock ?? 0;

      if (zone.conversion !== null) {
        weightedConversion += zone.conversion * zone.traffic;
        weightedTraffic += zone.traffic;
      }

      if (zone.stock !== null && zone.capacity !== null) {
        totalStock += zone.stock;
        totalCapacity += zone.capacity;
      }

      return acc;
    },
    {
      shelfValue: 0,
      occupancyRate: 0,
      conversionRate: 0,
      totalUnitsOnShelf: 0,
    },
  );

  totals.occupancyRate =
    totalCapacity === 0 ? 0 : (totalStock / totalCapacity) * 100;
  totals.conversionRate =
    weightedTraffic === 0 ? 0 : weightedConversion / weightedTraffic;

  return totals;
}

export function roundedShelfPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  return [
    `M ${x + radius} ${y}`,
    `H ${x + width - radius}`,
    `Q ${x + width} ${y} ${x + width} ${y + radius}`,
    `V ${y + height - radius}`,
    `Q ${x + width} ${y + height} ${x + width - radius} ${y + height}`,
    `H ${x + radius}`,
    `Q ${x} ${y + height} ${x} ${y + height - radius}`,
    `V ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    "Z",
  ].join(" ");
}

export function roundedVerticalShelfPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  return [
    `M ${x} ${y + radius}`,
    `V ${y + height - radius}`,
    `Q ${x} ${y + height} ${x + radius} ${y + height}`,
    `H ${x + width}`,
    `V ${y}`,
    `H ${x + radius}`,
    `Q ${x} ${y} ${x} ${y + radius}`,
    "Z",
  ].join(" ");
}

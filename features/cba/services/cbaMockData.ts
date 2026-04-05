export type CBAEvent = {
  timestamp: string;
  zone: string;
  product: string;
  interactionType: "touch" | "hold" | "none";
};

export type TimePoint = {
  label: string;
  interactions: number;
  holdings: number;
};

export type ShelfPerformanceRow = {
  shelf: string;
  traffic: number;
  interactions: number;
  holdings: number;
  touchRate: number;
  holdRate: number;
  conversionRate: number;
  productRemovals: number;
};

export type ProductPerformanceRow = {
  product: string;
  traffic: number;
  interactions: number;
  holdings: number;
  touchRate: number;
  holdRate: number;
  trend: TimePoint[];
};

export type InsightCard = {
  title: string;
  detail: string;
  tone: "good" | "warn" | "bad";
};

export type SignalItem = {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
};

export type RootCauseItem = {
  title: string;
  detail: string;
  confidence: string;
};

export type RecommendationItem = {
  title: string;
  action: string;
  owner: string;
};

export type CBADashboardModel = {
  events: CBAEvent[];
  totals: {
    footTraffic: number;
    interactions: number;
    holdings: number;
    touchRate: number;
    holdRate: number;
    conversionProxy: number;
  };
  heatmapCells: Array<{ zone: string; intensity: number }>;
  trend: TimePoint[];
  shelfPerformance: ShelfPerformanceRow[];
  insights: InsightCard[];
  products: ProductPerformanceRow[];
  rankings: {
    mostInteracted: ProductPerformanceRow[];
    mostHeld: ProductPerformanceRow[];
    leastInteracted: ProductPerformanceRow[];
  };
  signals: SignalItem[];
  rootCauses: RootCauseItem[];
  recommendations: RecommendationItem[];
};

const zones = [
  "Entry Left",
  "Entry Right",
  "Front Promo",
  "Beverage Wall",
  "Center Shelf",
  "Snacks Bay",
  "Checkout Left",
  "Checkout Right",
  "Back Aisle",
] as const;

const products = [
  "Spark Soda",
  "Crunch Chips",
  "Granola Bar",
  "Ready Sandwich",
  "Fruit Juice",
  "Protein Shake",
] as const;

const timeLabels = ["Mon 09", "Mon 13", "Mon 17", "Tue 09", "Tue 13", "Tue 17", "Wed 09", "Wed 13", "Wed 17"] as const;

function toRate(numerator: number, denominator: number) {
  if (denominator === 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function buildEvents(): CBAEvent[] {
  const events: CBAEvent[] = [];

  timeLabels.forEach((_, timeIndex) => {
    zones.forEach((zone, zoneIndex) => {
      products.forEach((product, productIndex) => {
        const baseTraffic = 6 + ((timeIndex + zoneIndex + productIndex) % 5);
        const touchCount = ((zoneIndex * 2 + productIndex + timeIndex) % 4) + (zone === "Front Promo" ? 2 : 0);
        const holdCount =
          Math.max(
            0,
            touchCount -
              (zone === "Entry Left" || zone === "Entry Right" ? 2 : 1) +
              (product === "Ready Sandwich" || product === "Protein Shake" ? 1 : 0),
          );

        for (let i = 0; i < baseTraffic; i += 1) {
          events.push({
            timestamp: `2026-03-${String(10 + timeIndex).padStart(2, "0")}T${String(9 + (timeIndex % 3) * 4).padStart(2, "0")}:00:00Z`,
            zone,
            product,
            interactionType: "none",
          });
        }

        for (let i = 0; i < touchCount; i += 1) {
          events.push({
            timestamp: `2026-03-${String(10 + timeIndex).padStart(2, "0")}T${String(10 + (i % 3)).padStart(2, "0")}:10:00Z`,
            zone,
            product,
            interactionType: "touch",
          });
        }

        for (let i = 0; i < holdCount; i += 1) {
          events.push({
            timestamp: `2026-03-${String(10 + timeIndex).padStart(2, "0")}T${String(11 + (i % 2)).padStart(2, "0")}:20:00Z`,
            zone,
            product,
            interactionType: "hold",
          });
        }
      });
    });
  });

  return events;
}

function buildTrend(events: CBAEvent[]) {
  return timeLabels.map((label, index) => {
    const dayEvents = events.filter((event) => event.timestamp.includes(`2026-03-${String(10 + index).padStart(2, "0")}`));

    return {
      label,
      interactions: dayEvents.filter((event) => event.interactionType !== "none").length,
      holdings: dayEvents.filter((event) => event.interactionType === "hold").length,
    };
  });
}

function buildZonePerformance(events: CBAEvent[]) {
  return zones.map((zone) => {
    const zoneEvents = events.filter((event) => event.zone === zone);
    const interactions = zoneEvents.filter((event) => event.interactionType !== "none").length;
    const holdings = zoneEvents.filter((event) => event.interactionType === "hold").length;

    return {
      zone,
      traffic: zoneEvents.length,
      interactions,
      holdings,
      touchRate: toRate(interactions, zoneEvents.length),
      holdRate: toRate(holdings, interactions),
    };
  });
}

function buildProducts(events: CBAEvent[]) {
  return products.map((product) => {
    const productEvents = events.filter((event) => event.product === product);
    const interactions = productEvents.filter((event) => event.interactionType !== "none").length;
    const holdings = productEvents.filter((event) => event.interactionType === "hold").length;

    const trend = timeLabels.map((label, index) => {
      const productTimeEvents = productEvents.filter((event) =>
        event.timestamp.includes(`2026-03-${String(10 + index).padStart(2, "0")}`),
      );

      return {
        label,
        interactions: productTimeEvents.filter((event) => event.interactionType !== "none").length,
        holdings: productTimeEvents.filter((event) => event.interactionType === "hold").length,
      };
    });

    return {
      product,
      traffic: productEvents.length,
      interactions,
      holdings,
      touchRate: toRate(interactions, productEvents.length),
      holdRate: toRate(holdings, interactions),
      trend,
    };
  });
}

export function buildCBADashboardModel(): CBADashboardModel {
  const events = buildEvents();
  const interactions = events.filter((event) => event.interactionType !== "none").length;
  const holdings = events.filter((event) => event.interactionType === "hold").length;
  const zonePerformance = buildZonePerformance(events);
  const productsData = buildProducts(events);
  const trend = buildTrend(events);

  const lowHoldingZone = [...zonePerformance].sort((a, b) => a.holdRate - b.holdRate)[0];
  const lowInteractionZone = [...zonePerformance].sort((a, b) => a.touchRate - b.touchRate)[0];
  const weakProduct = [...productsData].sort((a, b) => a.holdRate - b.holdRate)[0];
  const peakTrend = [...trend].sort((a, b) => b.interactions - a.interactions)[0];
  const lowTrend = [...trend].sort((a, b) => a.interactions - b.interactions)[0];

  return {
    events,
    totals: {
      footTraffic: events.length,
      interactions,
      holdings,
      touchRate: toRate(interactions, events.length),
      holdRate: toRate(holdings, interactions),
      conversionProxy: toRate(holdings, events.length),
    },
    heatmapCells: zonePerformance.map((row) => ({ zone: row.zone, intensity: row.interactions })),
    trend,
    shelfPerformance: zonePerformance.map((row) => ({
      shelf: row.zone,
      traffic: row.traffic,
      interactions: row.interactions,
      holdings: row.holdings,
      touchRate: row.touchRate,
      holdRate: row.holdRate,
      conversionRate: 0,
      productRemovals: 0,
    })),
    insights: [
      {
        title: "High traffic, low holding",
        detail: `${lowHoldingZone.zone} gets traffic but weak hold depth. This suggests placement or trust friction.`,
        tone: "warn",
      },
      {
        title: "High interaction, low conversion proxy",
        detail: `${weakProduct.product} is touched often but held less than peers. Review product framing or price communication.`,
        tone: "bad",
      },
      {
        title: "Low interaction zone",
        detail: `${lowInteractionZone.zone} underperforms on touches versus the rest of the shelf layout.`,
        tone: "good",
      },
    ],
    products: productsData,
    rankings: {
      mostInteracted: [...productsData].sort((a, b) => b.interactions - a.interactions).slice(0, 3),
      mostHeld: [...productsData].sort((a, b) => b.holdings - a.holdings).slice(0, 3),
      leastInteracted: [...productsData].sort((a, b) => a.interactions - b.interactions).slice(0, 3),
    },
    signals: [
      {
        title: "Hesitation detection",
        detail: `${weakProduct.product} shows high touch activity but weak hold follow-through.`,
        severity: "high",
      },
      {
        title: "Engagement drop",
        detail: `Interactions fall from ${peakTrend.label} to ${lowTrend.label}, showing a later engagement slowdown.`,
        severity: "medium",
      },
      {
        title: "Abnormal spikes",
        detail: `${peakTrend.label} has the strongest interaction spike across the observed range.`,
        severity: "low",
      },
    ],
    rootCauses: [
      {
        title: "Pricing issue",
        detail: "High touch but weak holding implies shoppers notice the product without committing to deeper interest.",
        confidence: "68%",
      },
      {
        title: "Placement issue",
        detail: "Lower touch density near weaker zones suggests the product is not positioned in a strong capture path.",
        confidence: "74%",
      },
      {
        title: "Visibility issue",
        detail: "Traffic exists, but touch response is weaker than expected for the zone mix.",
        confidence: "72%",
      },
    ],
    recommendations: [
      {
        title: "Move product",
        action: `Shift ${weakProduct.product} closer to the front promo zone to improve engagement quality.`,
        owner: "Merchandising",
      },
      {
        title: "Adjust pricing",
        action: `Test softer price framing or bundling for ${weakProduct.product}.`,
        owner: "Pricing",
      },
      {
        title: "Increase visibility",
        action: `Improve signage and facing depth in ${lowInteractionZone.zone}.`,
        owner: "Store Ops",
      },
    ],
  };
}

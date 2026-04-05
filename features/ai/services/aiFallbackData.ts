export type TrendPoint = {
  name: string;
  traffic: number;
  interaction: number;
  purchase: number;
  revenue: number;
};

export type Recommendation = {
  title: string;
  reason: string;
  impact: string;
  priority: "High" | "Medium" | "Low";
};

export type AlertItem = {
  title: string;
  detail: string;
  level: "High" | "Medium" | "Low";
};

export type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export const recommendations: Recommendation[] = [
  {
    title: "Reposition high-interest items",
    reason: "Visible engagement is strong but conversion appears softer than expected.",
    impact: "Improves the chance that shopper attention turns into purchase.",
    priority: "High",
  },
  {
    title: "Restock before peak traffic",
    reason: "Fast-moving products are more likely to lose sales when shelf inventory runs low.",
    impact: "Reduces missed sales during busy periods.",
    priority: "High",
  },
  {
    title: "Review low-conversion zones",
    reason: "Traffic alone is not enough if shoppers are not holding or buying products.",
    impact: "Helps isolate pricing, placement, or merchandising friction.",
    priority: "Medium",
  },
];

export const alerts: AlertItem[] = [
  {
    title: "Conversion friction detected",
    detail: "Customer attention is present, but purchase follow-through may need review.",
    level: "High",
  },
  {
    title: "Stock risk on key items",
    detail: "Some high-interest products may need earlier replenishment.",
    level: "Medium",
  },
  {
    title: "Monitor product placement",
    detail: "Shelf position could be affecting interaction-to-sale performance.",
    level: "Low",
  },
];


export function summaryFromPrompt(prompt: string) {
  const value = prompt.toLowerCase();

  if (value.includes("report") || value.includes("trend")) {
    return `Generated retail decision brief:\n\n1. Revenue trend improved toward the weekend, with Saturday as the strongest day.\n2. Traffic growth outpaced purchases on Friday and Saturday, meaning there is room to improve conversion.\n3. Aisle 3 remains a friction zone due to high traffic and softer interaction.\n4. Priority action: refill high-demand products earlier and improve shelf placement for low-conversion items.`;
  }

  if (
    value.includes("stock") ||
    value.includes("inventory") ||
    value.includes("refill")
  ) {
    return `Inventory insight:\n\nPork belly and organic milk have the highest stock-out risk. Current behavior signals suggest shelf inventory should be replenished before peak hours. Increasing shelf stock for high-velocity items can reduce missed purchases.`;
  }

  if (value.includes("sales") || value.includes("conversion")) {
    return `Sales insight:\n\nStore traffic is healthy, but conversion weakens in selected zones. The gap is most visible in Aisle 3, where shoppers pass through without sufficient interaction. This suggests a placement or pricing issue rather than a traffic issue.`;
  }

  return `AI insight:\n\nBased on current traffic, interaction, and purchase patterns, the store is performing strongest during late afternoon and weekend periods. The clearest opportunity is improving conversion where traffic is already strong. Recommended next step: prioritize low-conversion, high-traffic shelves for intervention.`;
}

import { Grid3X3, Radar, TrendingUp, type LucideIcon } from "lucide-react";

export const cbaTabs = [
  { key: "overview", icon: Grid3X3 },
] as const satisfies ReadonlyArray<{
  key: string;
  icon: LucideIcon;
}>;

export type CBATabKey = (typeof cbaTabs)[number]["key"];

export const cbaSidebarItems = [
  { key: "overview", href: "/cba?tab=overview", icon: Grid3X3 },
  { key: "vision", href: "/cba/vision", icon: Radar },
  { key: "conversion", href: "/cba/conversion", icon: TrendingUp },
] as const satisfies ReadonlyArray<{
  key: string;
  href: string;
  icon: LucideIcon;
}>;

export function isCBATabKey(value: string | null): value is CBATabKey {
  return cbaTabs.some((tab) => tab.key === value);
}

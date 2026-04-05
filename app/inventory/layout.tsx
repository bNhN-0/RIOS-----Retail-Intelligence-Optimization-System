"use client";

import { Suspense } from "react";
import {
  Boxes,
  Map,
  PackageSearch,
  RefreshCcw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { SectionLayoutShell } from "@/components/layout/SectionLayoutShell";
import { usePathname } from "@/lib/hooks/navigationHooks";

const tabs = [
  { name: "Overview", href: "/inventory/overview", icon: Boxes },
  { name: "Product Explorer", href: "/inventory/inventory-explorer", icon: PackageSearch },
  { name: "Shelf Explorer", href: "/inventory/interactive-map", icon: Map },
  { name: "Replenishment", href: "/inventory/replenishment", icon: RefreshCcw },
];

export default function InventoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <InventoryLayoutContent>{children}</InventoryLayoutContent>
    </Suspense>
  );
}

function InventoryLayoutContent({
  children,
}: {
  children: ReactNode;
}) {
  const t = useTranslations("Inventory");
  const pathname = usePathname();
  const items = tabs.map((tab) => ({
    key: tab.href,
    label:
      tab.name === "Overview"
        ? t("tabs.overview")
        : tab.name === "Product Explorer"
          ? t("tabs.productExplorer")
          : tab.name === "Shelf Explorer"
            ? t("tabs.shelfExplorer")
            : t("tabs.replenishment"),
    href: tab.href,
    icon: tab.icon,
    active:
      pathname === "/inventory"
        ? tab.href === "/inventory/overview"
        : pathname.startsWith(tab.href),
  }));

  return (
    <SectionLayoutShell
      title={t("title")}
      subtitle={t("subtitle")}
      items={items}
      showFloatingAIChat
    >
      {children}
    </SectionLayoutShell>
  );
}

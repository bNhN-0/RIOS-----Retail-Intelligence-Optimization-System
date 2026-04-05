"use client";

import { Suspense } from "react";
import {
  BarChart3,
  ShoppingBasket,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { SectionLayoutShell } from "@/components/layout/SectionLayoutShell";
import { usePathname } from "@/lib/hooks/navigationHooks";

const SALES_DEFAULT_HREF = "/sales/overview";

const tabs = [
  { label: "Overview", href: SALES_DEFAULT_HREF, icon: BarChart3 },
  { label: "Product Performance", href: "/sales/products", icon: ShoppingBasket },
  { label: "Sales Patterns", href: "/sales/sales-patterns", icon: TrendingUp },
] as const;

function isActiveTab(pathname: string, href: string) {
  return pathname === "/sales"
    ? href === SALES_DEFAULT_HREF
    : pathname.startsWith(href);
}

export default function SalesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <SalesLayoutContent>{children}</SalesLayoutContent>
    </Suspense>
  );
}

function SalesLayoutContent({
  children,
}: {
  children: ReactNode;
}) {
  const t = useTranslations("Sales");
  const pathname = usePathname();
  const items = tabs.map(({ href, label, icon }) => ({
    key: href,
    label:
      label === "Overview"
        ? t("tabs.overview")
        : label === "Product Performance"
          ? t("tabs.productPerformance")
          : t("tabs.salesPatterns"),
    href,
    icon,
    active: isActiveTab(pathname, href),
  }));

  return (
    <SectionLayoutShell title={t("analytics")} items={items} showFloatingAIChat>
      {children}
    </SectionLayoutShell>
  );
}

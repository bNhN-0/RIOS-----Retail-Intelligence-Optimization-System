"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { cbaSidebarItems } from "@/features/cba/services/cbaNavigation";
import { SectionLayoutShell } from "@/components/layout/SectionLayoutShell";
import { usePathname } from "@/lib/hooks/navigationHooks";

export default function CBALayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <CBALayoutContent>{children}</CBALayoutContent>
    </Suspense>
  );
}

function CBALayoutContent({
  children,
}: {
  children: ReactNode;
}) {
  const t = useTranslations("CBA");
  const pathname = usePathname();
  const items = cbaSidebarItems.map((tab) => ({
    key: tab.key,
    label:
      tab.key === "overview"
        ? t("tabs.overview")
        : tab.key === "vision"
          ? t("tabs.visionFeed")
          : t("tabs.conversion"),
    href: tab.href,
    icon: tab.icon,
    active:
      tab.key === "vision"
        ? pathname === "/cba/vision"
        : tab.key === "conversion"
          ? pathname === "/cba/conversion"
        : tab.key === "overview" && pathname === "/cba",
  }));

  return (
    <SectionLayoutShell
      title={t("title")}
      items={items}
      showFloatingAIChat
    >
      {children}
    </SectionLayoutShell>
  );
}

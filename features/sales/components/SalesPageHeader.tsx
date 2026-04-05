"use client";

import { Suspense } from "react";
import { BarChart3, CircleAlert, Menu, ShoppingBasket, TrendingUp, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { DashboardHeaderActions } from "@/components/navigation/DashboardHeaderActions";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/lib/hooks/navigationHooks";

const tabs = [
  {
    name: "Overview",
    href: "/sales/overview",
    icon: BarChart3,
  },
  {
    name: "Product Performance",
    href: "/sales/products",
    icon: ShoppingBasket,
  },
  {
    name: "Sales Patterns",
    href: "/sales/sales-patterns",
    icon: TrendingUp,
  },
  {
    name: "Alerts & Insights",
    href: "/sales/insights",
    icon: CircleAlert,
  },
];

export function SalesPageHeader() {
  return (
    <Suspense fallback={<section className="rounded-2xl px-4 py-3" />}>
      <SalesPageHeaderContent />
    </Suspense>
  );
}

function SalesPageHeaderContent() {
  const t = useTranslations("Sales");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentTab =
    pathname === "/sales"
      ? tabs.find((tab) => tab.href === "/sales/overview")
      : tabs.find((tab) => pathname.startsWith(tab.href)) ?? tabs[0];

  return (
    <section className="rounded-2xl px-4 py-3  ">
      <div className="hidden justify-end xl:flex">
        <DashboardHeaderActions />
      </div>

      <div className="flex items-center justify-between gap-3 xl:hidden">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">{t("analytics")}</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
            {currentTab?.name === "Overview"
              ? t("tabs.overview")
              : currentTab?.name === "Product Performance"
                ? t("tabs.productPerformance")
                : currentTab?.name === "Sales Patterns"
                  ? t("tabs.salesPatterns")
                  : t("tabs.alertsInsights")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardHeaderActions />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="sales-page-menu"
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="sales-page-menu"
          className="mt-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 xl:hidden"
        >
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active =
                pathname === "/sales"
                  ? tab.href === "/sales/overview"
                  : pathname.startsWith(tab.href);

              return (
                <Link
                  key={`sales-page-${tab.href}`}
                  href={tab.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-indigo-50 font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
                      : "text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.name === "Overview"
                    ? t("tabs.overview")
                    : tab.name === "Product Performance"
                      ? t("tabs.productPerformance")
                      : tab.name === "Sales Patterns"
                        ? t("tabs.salesPatterns")
                        : t("tabs.alertsInsights")}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </section>
  );
}

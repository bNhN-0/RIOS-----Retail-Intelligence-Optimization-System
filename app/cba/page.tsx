"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";

import { CBAOverview } from "@/features/cba/components/CBAOverview";
import {
  cbaSidebarItems,
  cbaTabs,
  isCBATabKey,
} from "@/features/cba/services/cbaNavigation";
import { getCBADashboardQueryOptions } from "@/features/cba/services/cbaDashboardApi";
import { DashboardHeaderActions } from "@/components/navigation/DashboardHeaderActions";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "@/lib/hooks/navigationHooks";

export default function CBAPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <section className="rounded-2xl px-4 py-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              Loading CBA overview...
            </div>
          </section>
        </div>
      }
    >
      <CBAPageContent />
    </Suspense>
  );
}

function CBAPageContent() {
  const t = useTranslations("CBA");
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const dashboardQuery = useQuery(getCBADashboardQueryOptions(selectedDate));
  const activeTab = isCBATabKey(searchParams.get("tab"))
    ? searchParams.get("tab")
    : "overview";
  const model = dashboardQuery.data;

  const mobileItems = cbaSidebarItems.filter(
    (item) => item.key === "vision" || item.key === "conversion",
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl px-4 py-3">
        <div className="hidden justify-end xl:flex">
          <DashboardHeaderActions />
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t("title")}
            </p>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t("headerTitle")}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t("headerDescription")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:hidden">
            {cbaTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              const label = t(`tabs.${tab.key}`);

              return (
                <Link
                  key={tab.key}
                  href={`/cba?tab=${tab.key}`}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                    active
                      ? "border-slate-400 bg-slate-500 text-white dark:border-slate-500 dark:bg-slate-200 dark:text-slate-900"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}

            {mobileItems.map((item) => {
              const Icon = item.icon;
              const label =
                item.key === "vision"
                  ? t("tabs.visionFeed")
                  : t("tabs.conversion");

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {dashboardQuery.isPending || !model ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Loading camera analytics...
        </div>
      ) : dashboardQuery.error instanceof Error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/35 dark:text-rose-200">
          {dashboardQuery.error.message}
        </div>
      ) : (
        <>
          {activeTab === "overview" ? (
            <CBAOverview
              model={model}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

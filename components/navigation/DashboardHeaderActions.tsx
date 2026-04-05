"use client";

import { Suspense } from "react";
import { House, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { useSectionLayout } from "@/components/layout/SectionLayoutContext";
import LanguageSelect from "@/components/shared/LanguageSelect";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { Link } from "@/i18n/navigation";

export function DashboardHeaderActions() {
  const t = useTranslations("Navigation");
  const sectionLayout = useSectionLayout();
  const inverseZoom = sectionLayout ? 100 / sectionLayout.zoomPercent : 1;

  return (
    <div
      className="flex items-center gap-2"
      style={
        sectionLayout
          ? {
              zoom: inverseZoom,
            }
          : undefined
      }
    >
      <Link
        href="/"
        className="inline-flex h-9 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <House className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("home")}</span>
      </Link>
      {sectionLayout ? (
        <div className="inline-flex h-9 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
          <button
            type="button"
            onClick={sectionLayout.zoomOut}
            disabled={sectionLayout.zoomPercent <= sectionLayout.zoomMin}
            aria-label={t("zoomOut")}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Minus className="h-3 w-3" />
          </button>

          <span className="w-10 text-center font-semibold tabular-nums">
            {sectionLayout.zoomPercent}%
          </span>

          <button
            type="button"
            onClick={sectionLayout.zoomIn}
            disabled={sectionLayout.zoomPercent >= sectionLayout.zoomMax}
            aria-label={t("zoomIn")}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      ) : null}
      <ThemeToggle compact />
      <Suspense fallback={<div className="h-9 w-9 rounded-full border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900" />}>
        <LanguageSelect compact />
      </Suspense>
    </div>
  );
}

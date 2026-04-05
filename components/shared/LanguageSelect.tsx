"use client";

import { Suspense } from "react";
import { Globe2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { routing, type AppLocale } from "@/i18n/routing";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "@/lib/hooks/navigationHooks";

type LanguageSelectProps = {
  compact?: boolean;
};

export default function LanguageSelect({ compact = false }: LanguageSelectProps) {
  return (
    <Suspense
      fallback={
        <div
          className={`rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${
            compact ? "h-9 w-9" : "h-11 w-11"
          }`}
        />
      }
    >
      <LanguageSelectContent compact={compact} />
    </Suspense>
  );
}

function LanguageSelectContent({ compact = false }: LanguageSelectProps) {
  const t = useTranslations("Language");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (nextLocale: AppLocale) => {
    const query = Object.fromEntries(searchParams.entries());

    router.replace(
      Object.keys(query).length > 0 ? { pathname, query } : pathname,
      { locale: nextLocale },
    );
  };

  return (
    <label className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-500 dark:text-slate-400">
        <Globe2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </span>
      <select
        value={locale}
        onChange={(event) => handleChange(event.target.value as AppLocale)}
        className={`appearance-none rounded-full border border-slate-200 bg-white pr-8 pl-9 font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${
          compact ? "h-9 text-xs" : "h-11 text-sm"
        }`}
        aria-label={t("label")}
      >
        {routing.locales.map((appLocale) => (
          <option key={appLocale} value={appLocale}>
            {appLocale === "en"
              ? t("en")
              : appLocale === "th"
                ? t("th")
                : appLocale === "ja"
                  ? t("ja")
                  : t("zhCN")}
          </option>
        ))}
      </select>
    </label>
  );
}

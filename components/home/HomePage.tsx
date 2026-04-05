"use client";

import { Suspense } from "react";
import { Brain, Package, ShoppingCart, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import LanguageSelect from "@/components/shared/LanguageSelect";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { Link } from "@/i18n/navigation";

const moduleConfig = [
  {
    key: "cba",
    href: "/cba",
    icon: Brain,
    accent: "bg-sky-100 text-sky-700",
    border: "border-sky-200",
  },
  {
    key: "sales",
    href: "/sales/overview",
    icon: ShoppingCart,
    accent: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
  },
  {
    key: "inventory",
    href: "/inventory/overview",
    icon: Package,
    accent: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
  },
] as const;

export function HomePage() {
  const t = useTranslations("Home");

  return (
    <main className="min-h-screen transition-colors">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-xs font-semibold tracking-[0.2em] text-white ">
              R
            </div>
            <div>
               <p className="text-sm font-semibold text-slate-950 dark:text-white">
                RIOs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full p-1">
            <ThemeToggle compact />
            <Suspense
              fallback={
                <div className="h-9 w-9 rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
              }
            >
              <LanguageSelect compact />
            </Suspense>
          </div>
        </div>

        <header className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="mx-auto flex max-w-3xl flex-col items-center space-y-5 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Sparkles className="h-3.5 w-3.5" />
              {t("badge")}
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
                {t("title")}
              </h1>
            </div>
          </div>
        </header>

        <section className="mt-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                {t("workspacesLabel")}
              </p>
              <h2 className="mt-1.5 text-xl font-semibold text-slate-950 dark:text-white">
                {t("workspacesTitle")}
              </h2>
            </div>

            <div className="mx-auto mt-5 grid max-w-4xl grid-cols-2 justify-center gap-x-2 gap-y-3 md:grid-cols-3">
              {moduleConfig.map((module) => {
                const Icon = module.icon;
                const label = t(`modules.${module.key}`);

                return (
                  <div
                    key={module.key}
                    className="flex flex-col items-center text-center"
                  >
                    <Link
                      href={module.href}
                      className={`group inline-flex h-18 w-18 items-center justify-center rounded-[18px] bg-white transition duration-200 hover:-translate-y-1 hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 ${module.border}`}
                      aria-label={label}
                    >
                      <div
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/5 shadow-sm ${module.accent}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    </Link>

                    <p className="mt-1.5 max-w-[6.5rem] text-sm font-medium leading-5 text-slate-950 dark:text-white">
                      {label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

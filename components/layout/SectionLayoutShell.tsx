"use client";

import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { FloatingAssistantPanel } from "@/features/ai/components/FloatingAssistantPanel";
import { SectionLayoutProvider } from "@/components/layout/SectionLayoutContext";
import { Link } from "@/i18n/navigation";

type SectionLayoutItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
};

type SectionLayoutShellProps = {
  title: string;
  subtitle?: string;
  items: readonly SectionLayoutItem[];
  children: ReactNode;
  showFloatingAIChat?: boolean;
};

export function SectionLayoutShell({
  title,
  subtitle,
  items,
  children,
  showFloatingAIChat = false,
}: SectionLayoutShellProps) {
  const zoomMin = 50;
  const zoomMax = 200;
  const zoomStep = 10;
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);
  const contentScale = zoomPercent / 100;

  return (
    <SectionLayoutProvider
      value={{
        zoomMin,
        zoomMax,
        zoomPercent,
        zoomOut: () =>
          setZoomPercent((current) => Math.max(zoomMin, current - zoomStep)),
        zoomIn: () =>
          setZoomPercent((current) => Math.min(zoomMax, current + zoomStep)),
      }}
    >
      <div className="dashboard-theme flex h-screen bg-gray-50 dark:bg-slate-950">
        <div className="relative hidden xl:flex">
          <aside
            aria-hidden={sidebarHidden}
            className={`sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r border-gray-200 bg-white transition-[width,padding,opacity,border-color] duration-200 dark:border-slate-800 dark:bg-slate-900 xl:flex xl:flex-col ${
              sidebarHidden
                ? "w-0 border-r-0 px-0 py-0 opacity-0"
                : "w-56 px-3 py-4 opacity-100"
            }`}
          >
            <div
              className={`transition-opacity duration-200 ${
                sidebarHidden ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            >
              <div className="mb-4 px-2">
                <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">
                  {title}
                </h2>
                {subtitle ? (
                  <p className="text-xs text-gray-400 dark:text-slate-400">
                    {subtitle}
                  </p>
                ) : null}
              </div>

              <nav className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`relative flex items-center gap-2 overflow-hidden rounded-md px-3 py-1.5 text-sm transition-colors duration-200 ${
                        item.active
                          ? "font-medium text-indigo-600 dark:text-indigo-300"
                          : "text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      {item.active ? (
                        <motion.span
                          layoutId="section-layout-active-tab"
                          className="absolute inset-0 rounded-md bg-indigo-50 dark:bg-indigo-500/15"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 32,
                          }}
                        />
                      ) : null}
                      <Icon className="relative z-10 h-4 w-4 shrink-0" />
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="absolute -right-5 top-1/2 z-20 -translate-y-1/2">
            <button
              type="button"
              aria-pressed={sidebarHidden}
              aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
              onClick={() => setSidebarHidden((current) => !current)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {sidebarHidden ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <main
          className="h-screen min-w-0 flex-1 overflow-auto px-4 py-4 transition-[padding] duration-200 lg:px-5"
        >
          <div
            className="mx-auto flex w-full flex-col gap-4 pb-4 transition-[max-width] duration-200"
            style={{
              maxWidth: zoomPercent > 100 ? "none" : "1400px",
            }}
            data-dashboard-capture-root="true"
          >
            <div
              className="w-full min-w-fit rounded-xl"
              style={{ zoom: contentScale }}
            >
              {children}
            </div>
          </div>
        </main>
        {showFloatingAIChat ? <FloatingAssistantPanel sectionTitle={title} /> : null}
      </div>
    </SectionLayoutProvider>
  );
}

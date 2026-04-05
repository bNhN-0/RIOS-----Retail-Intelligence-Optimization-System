"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type ThemeToggleProps = {
  compact?: boolean;
};

const THEME_CHANGE_EVENT = "rios-theme-change";

function resolveThemePreference() {
  const rootIsDark = document.documentElement.classList.contains("dark");

  if (rootIsDark) {
    return true;
  }

  const storedTheme = window.localStorage.getItem("rios-theme");

  if (storedTheme) {
    return storedTheme === "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function subscribeToTheme(callback: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => callback();

  mediaQuery.addEventListener("change", handleChange);
  window.addEventListener("storage", handleChange);
  window.addEventListener(THEME_CHANGE_EVENT, handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(THEME_CHANGE_EVENT, handleChange);
  };
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const isDarkMode = useSyncExternalStore(
    subscribeToTheme,
    resolveThemePreference,
    () => false,
  );

  function toggleTheme() {
    const nextDarkMode = !isDarkMode;

    document.documentElement.classList.toggle("dark", nextDarkMode);
    window.localStorage.setItem("rios-theme", nextDarkMode ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${
        compact ? "h-9 px-3 text-xs" : "h-11 px-4 text-sm"
      }`}
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? (
        <Sun className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      ) : (
        <Moon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      )}
      <span className="hidden sm:inline">{isDarkMode ? "Light" : "Dark"}</span>
    </button>
  );
}

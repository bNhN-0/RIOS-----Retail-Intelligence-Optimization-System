"use client";

import { useEffect } from "react";

const THEME_CHANGE_EVENT = "rios-theme-change";

export function ThemeInitializer() {
  useEffect(() => {
    const storedTheme = window.localStorage.getItem("rios-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = storedTheme ? storedTheme === "dark" : prefersDark;

    document.documentElement.classList.toggle("dark", shouldUseDark);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return null;
}

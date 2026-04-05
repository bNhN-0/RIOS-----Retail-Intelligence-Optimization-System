import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "th", "ja", "zh-CN"],
  defaultLocale: "en",
});

export type AppLocale = (typeof routing.locales)[number];

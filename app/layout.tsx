import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";

import { AppProviders } from "@/components/providers/AppProviders";
import { ThemeInitializer } from "@/components/providers/ThemeInitializer";
import { routing } from "@/i18n/routing";
import {
  Outfit,
  Ovo,
  Epilogue,
  Fira_Mono,
} from "next/font/google";import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-outfit" });
const ovo = Ovo({ subsets: ["latin"], weight: ["400"], variable: "--font-ovo" });
const epilogue = Epilogue({ subsets: ["latin"], weight: ["400"], variable: "--font-epilogue" });
const firaMono = Fira_Mono({ subsets: ["latin"], weight: ["400"], variable: "--font-fira" });

export const metadata: Metadata = {
  title: "RIOs",
  description: "Retail Intelligence Optimization System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = (
    await import(`../messages/${routing.defaultLocale}.json`)
  ).default;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${epilogue.className} bg-[#f6f7fb] text-slate-900 antialiased transition-colors dark:bg-slate-950 dark:text-slate-100`}
      >
        <ThemeInitializer />
        <NextIntlClientProvider
          locale={routing.defaultLocale}
          messages={messages}
        >
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

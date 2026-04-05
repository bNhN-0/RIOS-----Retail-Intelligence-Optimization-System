"use client";

import { Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { AIVisibleContextProvider } from "@/components/providers/AIVisibleContextProvider";
import { makeQueryClient } from "@/lib/api/reactQuery";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <AIVisibleContextProvider>{children}</AIVisibleContextProvider>
      </Suspense>
    </QueryClientProvider>
  );
}

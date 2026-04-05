"use client";

import { createContext, useContext } from "react";

type SectionLayoutContextValue = {
  zoomMin: number;
  zoomMax: number;
  zoomPercent: number;
  zoomOut: () => void;
  zoomIn: () => void;
};

const SectionLayoutContext = createContext<SectionLayoutContextValue | null>(null);

export function SectionLayoutProvider({
  value,
  children,
}: {
  value: SectionLayoutContextValue;
  children: React.ReactNode;
}) {
  return (
    <SectionLayoutContext.Provider value={value}>
      {children}
    </SectionLayoutContext.Provider>
  );
}

export function useSectionLayout() {
  return useContext(SectionLayoutContext);
}

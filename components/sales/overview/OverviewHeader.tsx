import { SalesSectionHeader } from "@/features/sales/components/SalesSectionHeader";
import { Card, CardHeader } from "@/components/ui/card";

import { Timeframe } from "./types";

type OverviewHeaderProps = {
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
};

export function OverviewHeader({
  timeframe,
  onTimeframeChange,
}: OverviewHeaderProps) {
  return (
    <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <CardHeader className="gap-3 p-4">
        <SalesSectionHeader
          badge="Sales Overview"
          title="Sales Overview"
          actions={
            <>
              <label
                className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"
                htmlFor="sales-overview-timeframe"
              >
                Time frame
              </label>
              <select
                id="sales-overview-timeframe"
                value={timeframe}
                onChange={(event) => onTimeframeChange(event.target.value as Timeframe)}
                className="rounded-md border px-3 py-1.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                {(["hour", "day", "week", "month", "year"] as Timeframe[]).map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </>
          }
        />
      </CardHeader>
    </Card>
  );
}

"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  formatMetricAxis,
  formatMetricValue,
  toneForHeatmap,
} from "./helpers";
import { HeatmapCell, HeatmapSelection, MetricKey } from "./types";

type HeatmapCardProps = {
  rows: string[];
  columns: string[];
  cells: HeatmapCell[];
  metric: MetricKey;
  peakSlot: string;
  selectedCell: HeatmapSelection | null;
  onCellSelect: (selection: HeatmapSelection) => void;
};

export function HeatmapCard({
  rows,
  columns,
  cells,
  metric,
  peakSlot,
  selectedCell,
  onCellSelect,
}: HeatmapCardProps) {
  const cellMap = useMemo(
    () =>
      new Map(
        cells.map((cell) => [`${cell.row}::${cell.column}`, cell] as const),
      ),
    [cells],
  );
  const selectedCellData =
    selectedCell ? cellMap.get(`${selectedCell.row}::${selectedCell.column}`) : null;
  const maxValue = Math.max(...cells.map((cell) => cell.value), 0);
  const gridTemplateColumns = `80px repeat(${columns.length}, minmax(0, 1fr))`;

  return (
    <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-950">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Sales heatmap</CardTitle>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Days of week by hour, colored by {metric}.
            </p>
          </div>
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
            Peak slot {peakSlot || "-"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div
              className="mb-3 grid gap-1.5 text-[11px] text-slate-500 dark:text-slate-400"
              style={{ gridTemplateColumns }}
            >
              <div />
              {columns.map((column) => (
                <div key={column} className="text-center">{column}</div>
              ))}
            </div>

            <div className="space-y-2">
              {rows.map((row) => (
                <div
                  key={row}
                  className="grid gap-1.5"
                  style={{ gridTemplateColumns }}
                >
                  <div className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">{row}</div>
                  {columns.map((column) => {
                    const cell = cellMap.get(`${row}::${column}`) || {
                      row,
                      column,
                      value: 0,
                      transaction_count: 0,
                      quantity: 0,
                    };

                    return (
                      <button
                        type="button"
                        key={`${row}-${column}`}
                        title={`${row} ${column}: ${formatMetricValue(metric, cell.value)} | ${cell.transaction_count} transactions | ${cell.quantity} units`}
                        onClick={() => onCellSelect({ row, column })}
                        className={cn(
                          "flex h-8 items-center justify-center rounded-lg border text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:focus-visible:ring-rose-400",
                          toneForHeatmap(cell.value, maxValue),
                          selectedCell?.row === row &&
                            selectedCell.column === column &&
                            "ring-2 ring-rose-700 ring-offset-1 ring-offset-white dark:ring-rose-300 dark:ring-offset-slate-950",
                        )}
                      >
                        {formatMetricAxis(metric, cell.value)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Selected slot
            </p>
            <p className="mt-1 font-semibold">
              {selectedCell ? `${selectedCell.row} ${selectedCell.column}` : "-"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              {metric}
            </p>
            <p className="mt-1 font-semibold">
              {formatMetricValue(metric, selectedCellData?.value ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              Activity
            </p>
            <p className="mt-1 font-semibold">
              {(selectedCellData?.transaction_count ?? 0).toLocaleString()} txns | {(selectedCellData?.quantity ?? 0).toLocaleString()} units
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

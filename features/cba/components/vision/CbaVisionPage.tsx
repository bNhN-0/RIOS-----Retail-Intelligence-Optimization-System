"use client";

import { useQuery } from "@tanstack/react-query";
import { ActivitySquare, AlertTriangle, Clock3, Radar } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRegisterAIVisibleContext } from "@/components/providers/AIVisibleContextProvider";
import {
  getVisionCamerasQueryOptions,
  getVisionLiveModelQueryOptions,
} from "@/features/cba/services/cbaVisionApi";
import type {
  VisionEventHighlight,
  VisionLiveStat,
  VisionShelfRowStat,
  VisionState,
  VisionTimelineMarker,
} from "@/features/cba/types/vision";
import { SalesPageHeader } from "@/features/sales/components/SalesPageHeader";
import { cn } from "@/lib/utils";

import { VisionHeader } from "./VisionHeader";
import { VisionLiveFeed } from "./VisionLiveFeed";

export function CbaVisionPage() {
  const camerasQuery = useQuery(getVisionCamerasQueryOptions());
  const [state, setState] = useState<VisionState>({
    selectedCameraId: "",
    viewMode: "normal",
  });

  const resolvedCameraId = state.selectedCameraId || camerasQuery.data?.[0]?.id || "";
  const liveModelQuery = useQuery(getVisionLiveModelQueryOptions(resolvedCameraId));
  const model = liveModelQuery.data;
  const cameras = useMemo(
    () => model?.cameras ?? camerasQuery.data ?? [],
    [camerasQuery.data, model?.cameras],
  );
  const headerState = useMemo(
    () => ({
      ...state,
      selectedCameraId: resolvedCameraId,
    }),
    [resolvedCameraId, state],
  );

  const selectedCamera = useMemo(
    () =>
      model?.selectedCamera ??
      cameras.find((camera) => camera.id === resolvedCameraId) ??
      null,
    [cameras, model?.selectedCamera, resolvedCameraId],
  );

  const errorMessage =
    (camerasQuery.error instanceof Error && camerasQuery.error.message) ||
    (liveModelQuery.error instanceof Error && liveModelQuery.error.message) ||
    null;
  useRegisterAIVisibleContext("cba-vision-main", {
    page: "cba-vision",
    title: "CBA Vision Live Feed",
    filters: {
      selectedCameraId: resolvedCameraId,
      viewMode: state.viewMode,
    },
    visibleKpis: Object.fromEntries(
      (model?.liveStats ?? []).map((stat) => [stat.label, stat.value]),
    ),
    visibleCharts: [
      {
        title: "Vision Heatmap",
        type: "heatmap",
        data: model?.heatmapCells ?? [],
      },
      {
        title: "Shelf Row Activity",
        type: "timeline",
        data: model?.timeline ?? [],
      },
    ],
    visibleTables: [
      {
        name: "Vision Events",
        columns: ["Title", "Detail", "Time", "Tone"],
        rows: (model?.events ?? []).map((event) => ({
          title: event.title,
          detail: event.detail,
          time: event.time,
          tone: event.tone,
        })),
      },
      {
        name: "Shelf Row KPIs",
        columns: [
          "Shelf ID",
          "Touches",
          "Holds",
          "Removals",
          "Interactions",
          "Items",
          "Top Product",
        ],
        rows: (model?.shelfRows ?? []).map((row) => ({
          shelfId: row.shelfId,
          touches: row.touchCount,
          holds: row.holdingCount,
          removals: row.productRemoveCount,
          interactions: row.totalInteractions,
          items: row.currentTotalItems,
          topProduct: row.topProductName,
        })),
      },
      {
        name: "Heatmap Cells",
        columns: [
          "Zone",
          "Interactions",
          "Shelf ID",
          "Row",
          "Column",
          "Products",
        ],
        rows: (model?.heatmapCells ?? []).map((cell) => ({
          zone: cell.zone,
          interactions: cell.interactions,
          shelfId: cell.shelfId,
          row: cell.row,
          column: cell.col,
          products: cell.productNames.join(", "),
        })),
      },
    ],
    selectedEntity: selectedCamera
      ? {
          type: "camera",
          id: selectedCamera.id,
          label: selectedCamera.name,
        }
      : undefined,
    visibleAlerts: errorMessage
      ? [
          {
            id: "cba-vision-error",
            title: "Vision feed unavailable",
            severity: "high",
            message: errorMessage,
          },
        ]
      : [],
  });

  const isInitialLoading =
    (camerasQuery.isPending && cameras.length === 0) ||
    (liveModelQuery.isPending && !model);
  const isRefreshing = liveModelQuery.isFetching && Boolean(model);

  return (
    <div className="space-y-6">
      <SalesPageHeader />
      <VisionHeader
        cameras={cameras}
        state={headerState}
        selectedCamera={selectedCamera}
        isRefreshing={isRefreshing}
        onStateChange={setState}
      />

      {errorMessage && !model ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/35 dark:text-rose-200">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <VisionLiveFeed
            key={`${selectedCamera?.id ?? "none"}-${state.viewMode}-${model?.streamUrl ?? ""}`}
            camera={selectedCamera}
            viewMode={state.viewMode}
            streamUrl={model?.streamUrl ?? ""}
            heatmapCells={model?.heatmapCells ?? []}
            heatmapRows={model?.heatmapRows ?? 4}
            heatmapCols={model?.heatmapCols ?? 50}
            heatmapTotalEvents={model?.heatmapTotalEvents ?? 0}
            isLoading={isInitialLoading}
            isRefreshing={isRefreshing}
            errorMessage={errorMessage}
          />

          <VisionActivityPanel
            events={model?.events ?? []}
            timeline={model?.timeline ?? []}
            isLoading={isInitialLoading}
          />
        </div>

        <VisionOperationsPanel
          stats={model?.liveStats ?? []}
          shelfRows={model?.shelfRows ?? []}
          isLoading={isInitialLoading}
        />
      </div>
    </div>
  );
}

function VisionActivityPanel({
  events,
  timeline,
  isLoading,
}: {
  events: VisionEventHighlight[];
  timeline: VisionTimelineMarker[];
  isLoading: boolean;
}) {
  return (
    <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <CardHeader className="gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
            Activity Snapshot
          </CardTitle>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Recent signals
          </Badge>
        </div>
        <CardDescription className="text-sm text-slate-600 dark:text-slate-300">
          Prioritized events and row-level intensity markers derived from the current live model.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 pt-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-slate-500 dark:text-slate-400" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Events
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
                />
              ))}
            </div>
          ) : events.length === 0 ? (
            <EmptyPanel message="No recent events were produced for the active camera." />
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {event.title}
                  </p>
                  <EventToneBadge tone={event.tone} />
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {event.detail}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Clock3 className="size-3.5" />
                  {event.time}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Radar className="size-4 text-slate-500 dark:text-slate-400" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Shelf Row Timeline
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
                />
              ))}
            </div>
          ) : timeline.length === 0 ? (
            <EmptyPanel message="No row activity markers are available for the active feed." />
          ) : (
            <div className="space-y-3">
              {timeline.map((marker) => (
                <div
                  key={marker.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {marker.time}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {marker.label}
                      </p>
                    </div>
                    <TimelineSeverityBadge severity={marker.severity} />
                  </div>
                  <div className="mt-3">
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className={cn(
                          "h-2 rounded-full",
                          marker.severity === "high"
                            ? "bg-rose-500"
                            : marker.severity === "medium"
                              ? "bg-amber-500"
                              : "bg-sky-500",
                        )}
                        style={{
                          width: `${Math.min(100, Math.max(12, marker.value * 10))}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      {marker.value} interactions
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function VisionOperationsPanel({
  shelfRows,
  stats,
  isLoading,
}: {
  shelfRows: VisionShelfRowStat[];
  stats: VisionLiveStat[];
  isLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <CardHeader className="gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ActivitySquare className="size-4 text-slate-500 dark:text-slate-400" />
            <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
              KPIs
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
                />
              ))}
            </div>
          ) : stats.length === 0 ? (
            <EmptyPanel message="No KPI metrics available." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <CardHeader className="gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Radar className="size-4 text-slate-500 dark:text-slate-400" />
            <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
              Shelf Rows
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
                />
              ))}
            </div>
          ) : shelfRows.length === 0 ? (
            <EmptyPanel message="No shelf-row analytics available." />
          ) : (
            <div className="max-h-[44rem] space-y-3 overflow-y-auto pr-1">
              {shelfRows.map((row) => (
                <div
                  key={row.shelfId}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {row.shelfId}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {row.topProductName !== "-" ? row.topProductName : "No top product detected"}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                      {row.currentTotalItems} items
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <MetricChip label="Touches" value={String(row.touchCount)} />
                    <MetricChip label="Holds" value={String(row.holdingCount)} />
                    <MetricChip label="Removals" value={String(row.productRemoveCount)} />
                    <MetricChip label="Interactions" value={String(row.totalInteractions)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

function EventToneBadge({ tone }: { tone: VisionEventHighlight["tone"] }) {
  return (
    <Badge
      variant="outline"
      className={
        tone === "good"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300"
          : tone === "warn"
            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300"
            : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300"
      }
    >
      {tone === "good" ? "Stable" : tone === "warn" ? "Watch" : "Alert"}
    </Badge>
  );
}

function TimelineSeverityBadge({
  severity,
}: {
  severity: VisionTimelineMarker["severity"];
}) {
  return (
    <Badge
      variant="outline"
      className={
        severity === "high"
          ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300"
          : severity === "medium"
            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300"
            : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300"
      }
    >
      {severity}
    </Badge>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
      {message}
    </div>
  );
}

import { Flame, Radar, RefreshCcw, ScanLine } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { VisionCamera, VisionState } from "@/features/cba/types/vision";
import { cn } from "@/lib/utils";

import { getVisionCameraSourceMeta } from "./cameraSourceMeta";

type VisionHeaderProps = {
  cameras: VisionCamera[];
  state: VisionState;
  selectedCamera: VisionCamera | null;
  isRefreshing: boolean;
  onStateChange: Dispatch<SetStateAction<VisionState>>;
};

const viewModes: Array<{
  value: VisionState["viewMode"];
  label: string;
  icon: typeof ScanLine;
}> = [
  { value: "normal", label: "Live Feed", icon: ScanLine },
  { value: "heatmap", label: "Heatmap", icon: Flame },
];

function toneClasses(tone: "emerald" | "amber" | "sky") {
  if (tone === "emerald") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300";
}

export function VisionHeader({
  cameras,
  state,
  selectedCamera,
  isRefreshing,
  onStateChange,
}: VisionHeaderProps) {
  const sourceMeta = getVisionCameraSourceMeta(selectedCamera);

  return (
    <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <CardContent className="space-y-5 px-5 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-slate-900 text-white hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-100">
                <Radar className="size-3.5" />
                CBA Vision
              </Badge>
              <Badge variant="outline" className={cn("gap-1.5", toneClasses(sourceMeta.statusTone))}>
                <span className="size-1.5 rounded-full bg-current" />
                {sourceMeta.statusLabel}
              </Badge>
              {isRefreshing ? (
                <Badge variant="outline" className="gap-1.5 border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  <RefreshCcw className="size-3 animate-spin" />
                  Refreshing
                </Badge>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Vision Feed
              </h1>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {selectedCamera?.name ?? "No camera selected"}
                    </p>
                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                      {sourceMeta.sourceLabel}
                    </Badge>
                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                      {selectedCamera?.zone ?? "Unknown zone"}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      Location
                    </p>
                    <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                      {selectedCamera?.location ?? "Unknown location"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      View Mode
                    </p>
                    <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                      {state.viewMode === "heatmap" ? "Heatmap Overlay" : sourceMeta.modeLabel}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl space-y-4 xl:w-[27rem]">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <label className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Camera Source
                </span>
                <select
                  value={state.selectedCameraId}
                  onChange={(event) =>
                    onStateChange((current) => ({
                      ...current,
                      selectedCameraId: event.target.value,
                    }))
                  }
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                >
                  {cameras.map((camera) => {
                    const cameraSourceMeta = getVisionCameraSourceMeta(camera);

                    return (
                      <option key={camera.id} value={camera.id}>
                        {camera.name} / {cameraSourceMeta.sourceLabel}
                      </option>
                    );
                  })}
                </select>
              </label>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Render Mode
                </span>
                <div className="inline-flex min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900">
                  {viewModes.map((mode) => {
                    const Icon = mode.icon;
                    const active = state.viewMode === mode.value;

                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() =>
                          onStateChange((current) => ({
                            ...current,
                            viewMode: mode.value,
                          }))
                        }
                        className={cn(
                          "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                          active
                            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                            : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100",
                        )}
                      >
                        <Icon className="size-4" />
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Source Types
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {cameras.map((camera) => {
                  const cameraSourceMeta = getVisionCameraSourceMeta(camera);

                  return (
                    <div
                      key={camera.id}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                        camera.id === state.selectedCameraId
                          ? "border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                          : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                      )}
                    >
                      <span className="font-semibold">{camera.name}</span>
                      <span>{cameraSourceMeta.sourceLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

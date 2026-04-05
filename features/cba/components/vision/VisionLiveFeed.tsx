import {
  ActivitySquare,
  AlertTriangle,
  Expand,
  LoaderCircle,
  Minus,
  RefreshCcw,
  RotateCcw,
  Search,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { VisionCamera, VisionHeatmapCell, VisionState } from "@/features/cba/types/vision";
import { cn } from "@/lib/utils";

import { getVisionCameraSourceMeta } from "./cameraSourceMeta";

type VisionLiveFeedProps = {
  camera: VisionCamera | null;
  viewMode: VisionState["viewMode"];
  streamUrl: string;
  heatmapCells: VisionHeatmapCell[];
  heatmapRows: number;
  heatmapCols: number;
  heatmapTotalEvents: number;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
};

type ZoomState = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.2;
const DEFAULT_ZOOM: ZoomState = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

function clampScale(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))));
}

function clampOffsets(
  offsetX: number,
  offsetY: number,
  scale: number,
  width: number,
  height: number,
) {
  const maxX = ((scale - 1) * width) / 2;
  const maxY = ((scale - 1) * height) / 2;

  return {
    offsetX: Math.min(maxX, Math.max(-maxX, offsetX)),
    offsetY: Math.min(maxY, Math.max(-maxY, offsetY)),
  };
}

function getToneClasses(tone: "emerald" | "amber" | "sky") {
  if (tone === "emerald") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300";
}

function FeedStateOverlay({
  icon: Icon,
  title,
  message,
}: {
  icon: typeof LoaderCircle;
  title: string;
  message: string;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px]">
      <div className="mx-4 max-w-sm rounded-2xl border border-white/10 bg-slate-950/85 px-5 py-4 text-center text-white shadow-xl">
        <Icon className="mx-auto size-6" />
        <p className="mt-3 text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm text-slate-300">{message}</p>
      </div>
    </div>
  );
}

export function VisionLiveFeed({
  camera,
  viewMode,
  streamUrl,
  heatmapCells,
  heatmapRows,
  heatmapCols,
  heatmapTotalEvents,
  isLoading,
  isRefreshing,
  errorMessage,
}: VisionLiveFeedProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [zoom, setZoom] = useState<ZoomState>(DEFAULT_ZOOM);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasFrameLoaded, setHasFrameLoaded] = useState(false);
  const [hasStreamError, setHasStreamError] = useState(false);
  const showHeatmap = viewMode === "heatmap";
  const sourceMeta = useMemo(() => getVisionCameraSourceMeta(camera), [camera]);
  const maxIntensity = Math.max(...heatmapCells.map((cell) => cell.interactions), 1);
  const heatmapLookup = useMemo(
    () => new Map(heatmapCells.map((cell) => [`${cell.row}-${cell.col}`, cell])),
    [heatmapCells],
  );
  const hasNormalFeed = Boolean(streamUrl);
  const hasHeatmapData = heatmapCells.length > 0;
  const hasRenderableFeed = showHeatmap ? true : hasNormalFeed;
  const reconnecting = isRefreshing && !isLoading;
  const zoomPercent = Math.round(zoom.scale * 100);
  const streamState =
    showHeatmap
      ? "ready"
      : !hasNormalFeed
        ? "idle"
        : hasStreamError
          ? "error"
          : hasFrameLoaded
            ? "ready"
            : "loading";

  function applyZoom(nextScale: number, clientX?: number, clientY?: number) {
    const element = stageRef.current;

    if (!element) {
      setZoom((current) => ({
        ...current,
        scale: clampScale(nextScale),
      }));
      return;
    }

    const { width, height } = element.getBoundingClientRect();
    const resolvedScale = clampScale(nextScale);

    if (resolvedScale === MIN_ZOOM) {
      setZoom(DEFAULT_ZOOM);
      return;
    }

    const focusX = typeof clientX === "number" ? clientX : width / 2;
    const focusY = typeof clientY === "number" ? clientY : height / 2;
    const centerX = focusX - width / 2;
    const centerY = focusY - height / 2;

    setZoom((current) => {
      const nextOffsetX =
        centerX - ((centerX - current.offsetX) / current.scale) * resolvedScale;
      const nextOffsetY =
        centerY - ((centerY - current.offsetY) / current.scale) * resolvedScale;
      const nextOffsets = clampOffsets(
        nextOffsetX,
        nextOffsetY,
        resolvedScale,
        width,
        height,
      );

      return {
        scale: resolvedScale,
        ...nextOffsets,
      };
    });
  }

  function resetView() {
    setZoom(DEFAULT_ZOOM);
  }

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === fullscreenRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (zoom.scale <= 1 || event.button !== 0) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: zoom.offsetX,
      originY: zoom.offsetY,
    };
    setIsDragging(true);

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    const element = stageRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId || !element) {
      return;
    }

    const { width, height } = element.getBoundingClientRect();
    const nextOffsets = clampOffsets(
      dragState.originX + (event.clientX - dragState.startX),
      dragState.originY + (event.clientY - dragState.startY),
      zoom.scale,
      width,
      height,
    );

    setZoom((current) => ({
      ...current,
      ...nextOffsets,
    }));
  }

  function clearDrag(event?: ReactPointerEvent<HTMLDivElement>) {
    if (event && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
    setIsDragging(false);
  }

  async function toggleFullscreen() {
    const element = fullscreenRef.current;

    if (!element) {
      return;
    }

    if (document.fullscreenElement === element) {
      await document.exitFullscreen();
      return;
    }

    await element.requestFullscreen();
  }

  return (
    <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <CardHeader className="gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                {camera?.name ?? "Vision Feed"}
              </CardTitle>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {sourceMeta.sourceLabel}
              </Badge>
              <Badge variant="outline" className={cn("gap-1.5", getToneClasses(sourceMeta.statusTone))}>
                <span className="size-1.5 rounded-full bg-current" />
                {showHeatmap ? "Heatmap Mode" : sourceMeta.statusLabel}
              </Badge>
              {reconnecting ? (
                <Badge variant="outline" className="gap-1.5 border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  <RefreshCcw className="size-3 animate-spin" />
                  Reconnecting
                </Badge>
              ) : null}
            </div>
            <CardDescription className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              {camera?.location ?? "Unknown location"} / {camera?.zone ?? "Unknown zone"}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyZoom(zoom.scale - ZOOM_STEP)}
              disabled={zoom.scale <= MIN_ZOOM}
              aria-label="Zoom out"
            >
              <Minus />
              Zoom Out
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyZoom(zoom.scale + ZOOM_STEP)}
              disabled={zoom.scale >= MAX_ZOOM}
              aria-label="Zoom in"
            >
              <Search />
              Zoom In
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetView}
              disabled={zoom.scale === MIN_ZOOM && zoom.offsetX === 0 && zoom.offsetY === 0}
              aria-label="Reset zoom and pan"
            >
              <RotateCcw />
              Reset View
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Expand />
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        <div
          ref={fullscreenRef}
          className="mx-auto w-full p-17 max-w-[720px] rounded-[24px] border border-slate-200 bg-slate-950 p-1.5 shadow-sm dark:border-slate-800"
        >
          <div
            ref={stageRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={clearDrag}
            onPointerCancel={clearDrag}
            onDoubleClick={resetView}
            className={cn(
              "relative aspect-[3/4] min-h-[28rem] w-full overflow-hidden rounded-[20px] border border-white/10 bg-[radial-gradient(circle_at_top,#1e293b_0%,#020617_72%)] sm:aspect-[10/13] lg:min-h-[34rem]",
              zoom.scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default",
            )}
            style={{
              touchAction: zoom.scale > 1 ? "none" : "pan-y",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${zoom.offsetX}px, ${zoom.offsetY}px) scale(${zoom.scale})`,
                transformOrigin: "center center",
                transition: isDragging ? undefined : "transform 180ms ease-out",
              }}
            >
              {showHeatmap ? (
                <div className="h-full w-full bg-slate-950 p-4">
                  <div
                    className="grid h-full gap-[2px] rounded-2xl bg-slate-900 p-2"
                    style={{
                      gridTemplateRows: `repeat(${heatmapRows}, minmax(0, 1fr))`,
                      gridTemplateColumns: `repeat(${heatmapCols}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: heatmapRows * heatmapCols }, (_, index) => {
                      const row = Math.floor(index / heatmapCols);
                      const col = index % heatmapCols;
                      const cell = heatmapLookup.get(`${row}-${col}`);
                      const intensity = cell ? cell.interactions / maxIntensity : 0;
                      const productLabel =
                        cell && cell.productNames.length > 0
                          ? cell.productNames.join(", ")
                          : "No mapped product";

                      return (
                        <div
                          key={`${row}-${col}`}
                          className="rounded-[3px] border border-slate-950/20"
                          title={
                            cell
                              ? `${cell.shelfId} / ${productLabel} / ${cell.interactions} interactions`
                              : `Row ${row + 1} / Col ${col + 1}: 0`
                          }
                          style={{
                            backgroundColor: cell
                              ? `rgba(249,115,22,${0.16 + intensity * 0.84})`
                              : "rgba(15,23,42,0.35)",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : hasNormalFeed ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={`${camera?.id ?? "camera"}-${streamUrl}`}
                    src={streamUrl}
                    alt={`${camera?.name ?? "Selected camera"} live stream`}
                    className="h-full w-full select-none object-cover"
                    draggable={false}
                    onLoad={() => {
                      setHasFrameLoaded(true);
                      setHasStreamError(false);
                    }}
                    onError={() => {
                      setHasFrameLoaded(false);
                      setHasStreamError(true);
                    }}
                  />
                </>
              ) : null}
            </div>

            <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
              <Badge className="bg-slate-950/80 text-white hover:bg-slate-950/80">
                {camera?.name ?? "No camera"}
              </Badge>
              <Badge variant="outline" className="border-white/15 bg-white/10 text-white backdrop-blur">
                {sourceMeta.sourceLabel}
              </Badge>
              <Badge variant="outline" className="border-white/15 bg-white/10 text-white backdrop-blur">
                {showHeatmap ? "Overlay: Heatmap" : sourceMeta.modeLabel}
              </Badge>
            </div>

            <div className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur">
              {showHeatmap ? (
                <>
                  <ActivitySquare className="size-4 text-orange-300" />
                  Heatmap events: {heatmapTotalEvents}
                </>
              ) : hasNormalFeed ? (
                <>
                  <Wifi className="size-4 text-emerald-300" />
                  {reconnecting ? "Stream refreshing" : "Live analyzed feed"}
                </>
              ) : (
                <>
                  <WifiOff className="size-4 text-amber-300" />
                  No signal
                </>
              )}
            </div>

            <div className="absolute bottom-4 right-4 z-10 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
              {zoomPercent}% zoom
            </div>

            {isLoading ? (
              <FeedStateOverlay
                icon={LoaderCircle}
                title="Connecting feed"
                message="Loading the latest camera frame and analytics overlay."
              />
            ) : null}

            {!isLoading && !showHeatmap && streamState === "loading" ? (
              <FeedStateOverlay
                icon={LoaderCircle}
                title="Buffering stream"
                message="Waiting for the selected camera source to deliver a frame."
              />
            ) : null}

            {!isLoading && !showHeatmap && streamState === "error" ? (
              <FeedStateOverlay
                icon={AlertTriangle}
                title="Feed error"
                message={errorMessage ?? "The selected camera stream could not be rendered."}
              />
            ) : null}

            {!isLoading && !showHeatmap && !hasNormalFeed ? (
              <FeedStateOverlay
                icon={WifiOff}
                title="No signal"
                message="This camera source is currently unavailable. Try another source or wait for reconnection."
              />
            ) : null}

            {!isLoading && showHeatmap && !hasHeatmapData ? (
              <FeedStateOverlay
                icon={ActivitySquare}
                title="No heatmap activity"
                message="The overlay is active, but no interactions were mapped for the current interval."
              />
            ) : null}
          </div>
        </div>

        {errorMessage && hasRenderableFeed ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-200">
            Live data refresh reported an issue. The last successful frame remains visible while reconnection continues.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

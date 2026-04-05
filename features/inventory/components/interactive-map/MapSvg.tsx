import { cameras } from "@/features/inventory/services/interactiveMapMockData";
import {
  getOverlayExtents,
  getStroke,
  getZoneFill,
  roundedShelfPath,
  roundedVerticalShelfPath,
} from "@/features/inventory/services/interactiveMapUtils";
import type {
  Camera,
  OverlayMode,
  Zone,
} from "@/features/inventory/types/interactive-map";

type MapSvgProps = {
  overlayMode: OverlayMode;
  selectedZone: Zone;
  zones: Zone[];
  onSelectZone: (zone: Zone) => void;
};

function CameraIcon({ camera }: { camera: Camera }) {
  return (
    <g transform={`translate(${camera.x} ${camera.y}) rotate(${camera.rotate})`}>
      <rect
        x="0"
        y="0"
        width="32"
        height="32"
        rx="4"
        className="fill-slate-100 stroke-slate-950"
        strokeWidth="3"
      />
      <path
        d="M 32 8 L 46 2 L 46 30 L 32 24 Z"
        className="fill-slate-100 stroke-slate-950"
        strokeWidth="3"
      />
    </g>
  );
}

export function MapSvg({
  overlayMode,
  selectedZone,
  zones,
  onSelectZone,
}: MapSvgProps) {
  const overlayExtents = getOverlayExtents(zones);

  return (
    <div className="aspect-[1676/942] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 p-3 dark:border-slate-700 dark:bg-black sm:p-4">
      <svg viewBox="0 0 1676 942" className="h-full w-full rounded-2xl">
        <rect x="208" y="92" width="1244" height="744" className="fill-white dark:fill-slate-200" />

        {zones.map((zone) => {
          if (zone.type === "wallShelf") {
            return (
              <g
                key={zone.id}
                className="cursor-pointer"
                onClick={() => onSelectZone(zone)}
              >
                <path
                  d={roundedVerticalShelfPath(
                    zone.x,
                    zone.y,
                    zone.width,
                    zone.height,
                    35,
                  )}
                  className={getStroke(zone, selectedZone)}
                  fill={getZoneFill(zone, overlayMode, overlayExtents)}
                  strokeWidth={selectedZone.id === zone.id ? 4 : 2}
                />
                <text
                  x={zone.x + zone.width / 2}
                  y={zone.y + zone.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-orange-500 text-[16px] font-medium"
                  transform={`rotate(90 ${zone.x + zone.width / 2} ${zone.y + zone.height / 2})`}
                >
                  {zone.name}
                </text>
              </g>
            );
          }

          if (zone.type === "counter") {
            return (
              <g
                key={zone.id}
                className="cursor-pointer"
                onClick={() => onSelectZone(zone)}
              >
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.width}
                  height={zone.height}
                  className={getStroke(zone, selectedZone)}
                  fill={getZoneFill(zone, overlayMode, overlayExtents)}
                  strokeWidth={selectedZone.id === zone.id ? 4 : 2}
                />
                <text
                  x={zone.x + zone.width / 2}
                  y={zone.y + zone.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white text-[20px] font-medium"
                  transform={`rotate(-90 ${zone.x + zone.width / 2} ${zone.y + zone.height / 2})`}
                >
                  Counter
                </text>
              </g>
            );
          }

          if (zone.type === "entrance") {
            return (
              <g
                key={zone.id}
                className="cursor-pointer"
                onClick={() => onSelectZone(zone)}
              >
                <path
                  d="M 392 804 L 332 860 L 374 860 L 374 942 L 418 942 L 418 860 L 460 860 Z"
                  className={getStroke(zone, selectedZone)}
                  fill={getZoneFill(zone, overlayMode, overlayExtents)}
                  strokeWidth={selectedZone.id === zone.id ? 4 : 2}
                />
                <text
                  x="390"
                  y="884"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-slate-950 text-[16px] font-medium"
                  transform="rotate(90 390 884)"
                >
                  Entrance
                </text>
              </g>
            );
          }

          return (
            <g
              key={zone.id}
              className="cursor-pointer"
              onClick={() => onSelectZone(zone)}
            >
              <path
                d={roundedShelfPath(
                  zone.x,
                  zone.y,
                  zone.width,
                  zone.height,
                  28,
                )}
                className={getStroke(zone, selectedZone)}
                fill={getZoneFill(zone, overlayMode, overlayExtents)}
                strokeWidth={selectedZone.id === zone.id ? 4 : 2}
              />
              <text
                x={zone.x + zone.width / 2}
                y={zone.y + zone.height / 2 + 4}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-orange-500 text-[18px] font-medium"
              >
                {zone.name}
              </text>
            </g>
          );
        })}

        {cameras.map((camera) => (
          <CameraIcon key={camera.id} camera={camera} />
        ))}
      </svg>
    </div>
  );
}

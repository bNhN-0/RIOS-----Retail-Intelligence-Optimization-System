import { MapSvg } from "./MapSvg";
import type { OverlayMode, Zone } from "@/features/inventory/types/interactive-map";

type StoreFloorMapCardProps = {
  overlayMode: OverlayMode;
  selectedZone: Zone;
  zones: Zone[];
  onOverlayModeChange: (mode: OverlayMode) => void;
  onSelectZone: (zone: Zone) => void;
};

export function StoreFloorMapCard({
  overlayMode,
  selectedZone,
  zones,
  onOverlayModeChange,
  onSelectZone,
}: StoreFloorMapCardProps) {
  const overlayOptions: Array<{
    label: string;
    value: OverlayMode;
    activeClassName: string;
    radioClassName: string;
  }> = [
    {
      label: "None",
      value: "none",
      activeClassName:
        "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900",
      radioClassName: "accent-slate-900 dark:accent-slate-100",
    },
    {
      label: "Sales Value",
      value: "salesVolume",
      activeClassName:
        "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/35 dark:text-sky-200",
      radioClassName: "accent-sky-600",
    },
    {
      label: "Units on Shelf",
      value: "unitsOnShelf",
      activeClassName:
        "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-200",
      radioClassName: "accent-emerald-600",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[780px] max-h-[700px] rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            Store map
          </h2>
        </div>
        <fieldset className="flex flex-wrap gap-2" aria-label="Map overlay">
          {overlayOptions.map((option) => {
            const isActive = overlayMode === option.value;

            return (
              <label
                key={option.value}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                  isActive
                    ? option.activeClassName
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="map-overlay"
                  value={option.value}
                  checked={isActive}
                  onChange={() => onOverlayModeChange(option.value)}
                  className={`h-4 w-4 ${option.radioClassName}`}
                />
                {option.label}
              </label>
            );
          })}
        </fieldset>
      </div>

      <MapSvg
        overlayMode={overlayMode}
        selectedZone={selectedZone}
        zones={zones}
        onSelectZone={onSelectZone}
      />
    </div>
  );
}

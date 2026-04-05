type FunnelStage = {
  label: string;
  value: number;
};

type FunnelShapeProps = {
  stages: FunnelStage[];
};

const stageStyles = [
  {
    fill: "#0f172a",
    darkFill: "#e2e8f0",
    valueClassName: "text-slate-950 dark:text-slate-100",
    labelClassName: "text-slate-600 dark:text-slate-300",
  },
  {
    fill: "#3b82f6",
    darkFill: "#60a5fa",
    valueClassName: "text-sky-700 dark:text-sky-300",
    labelClassName: "text-sky-700 dark:text-sky-300",
  },
  {
    fill: "#f59e0b",
    darkFill: "#fbbf24",
    valueClassName: "text-amber-700 dark:text-amber-300",
    labelClassName: "text-amber-700 dark:text-amber-300",
  },
  {
    fill: "#10b981",
    darkFill: "#34d399",
    valueClassName: "text-emerald-700 dark:text-emerald-300",
    labelClassName: "text-emerald-700 dark:text-emerald-300",
  },
] as const;

export function FunnelShape({ stages }: FunnelShapeProps) {
  const maxValue = Math.max(...stages.map((stage) => stage.value), 1);
  const minHeight = 34;
  const maxHeight = 118;
  const segmentWidth = 150;
  const overlap = 14;
  const totalWidth = segmentWidth * stages.length - overlap * (stages.length - 1);

  const stageHeights = stages.map((stage) =>
    Math.max(minHeight, Math.round((stage.value / maxValue) * maxHeight)),
  );

  const topOffsets = stageHeights.map((height) => (maxHeight - height) / 2);

  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        <span>Conversion flow</span>
        <span>
          {stages[0]?.value.toLocaleString("en-US")} to {stages[stages.length - 1]?.value.toLocaleString("en-US")}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <svg
            viewBox={`0 0 ${totalWidth} ${maxHeight}`}
            className="h-[132px] w-full"
            role="img"
            aria-label="Conversion funnel"
          >
            {stages.map((stage, index) => {
              const nextHeight = stageHeights[index + 1] ?? stageHeights[index];
              const x = index * (segmentWidth - overlap);
              const y = topOffsets[index];
              const nextY = (maxHeight - nextHeight) / 2;
              const rightX = x + segmentWidth;
              const notchX = rightX - overlap;
              const leftInset = index === 0 ? 0 : 10;
              const rightInset = index === stages.length - 1 ? 0 : 10;
              const style = stageStyles[index % stageStyles.length];
              const points = [
                `${x + leftInset},${y}`,
                `${notchX - rightInset},${y}`,
                `${rightX},${nextY}`,
                `${rightX},${nextY + nextHeight}`,
                `${notchX - rightInset},${y + stageHeights[index]}`,
                `${x + leftInset},${y + stageHeights[index]}`,
                `${x},${y + stageHeights[index] / 2}`,
              ].join(" ");

              return (
                <g key={stage.label}>
                  <polygon className="fill-current text-slate-900 dark:hidden" points={points} style={{ color: style.fill }} />
                  <polygon className="hidden fill-current dark:block" points={points} style={{ color: style.darkFill }} />
                </g>
              );
            })}
          </svg>

          <div
            className="mt-3 grid gap-3"
            style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
          >
            {stages.map((stage, index) => {
              const style = stageStyles[index % stageStyles.length];

              return (
                <div key={stage.label} className="text-center">
                  <div className={`text-base font-semibold ${style.valueClassName}`}>{stage.value.toLocaleString("en-US")}</div>
                  <div className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${style.labelClassName}`}>
                    {stage.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

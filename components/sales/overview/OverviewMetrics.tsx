type MetricColor = "emerald" | "sky" | "violet" | "amber" | "rose" | "indigo" | "white";

const metricColors: Record<MetricColor, string> = {
  emerald:
    "border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-100",
  sky: "border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-800 dark:bg-sky-950/35 dark:text-sky-100",
  violet:
    "border-violet-200 bg-violet-100 text-violet-900 dark:border-violet-800 dark:bg-violet-950/35 dark:text-violet-100",
  amber:
    "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100",
  rose: "border-rose-200 bg-rose-100 text-rose-900 dark:border-rose-800 dark:bg-rose-950/35 dark:text-rose-100",
  indigo:
    "border-indigo-200 bg-indigo-100 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/35 dark:text-indigo-100",
  white: "border-slate-200 bg-slate-100 text-slate-900 dark:border-slate-800 dark:bg-slate-950/35 dark:text-slate-100",
};

type MetricItem = {
  label: string;
  value: React.ReactNode;
};
type Metric = {
  title: string;
  value?: React.ReactNode;
  highlight?: string;
  sub: {
    label: string;
    value: React.ReactNode;
  }[];
  color: MetricColor;
};
type OverviewMetric = {
  title: string;
  value: React.ReactNode;
  highlight?: string;
  sub: MetricItem[];
  color: MetricColor;
};

type MetricsGridProps = {
  metrics: Metric[];
};

function MetricCard({ title, value, highlight, sub, color }: OverviewMetric) {
  return (
    <article className={`rounded-xl border p-3 shadow-sm ${metricColors[color]}`}>
      <div className="space-y-2">
        <p className="text-sm font-medium opacity-70">{title}</p>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-xl font-semibold tracking-tight">{value}</p>
          {highlight && <span className="text-sm opacity-70">{highlight}</span>}
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-sm">
        {sub.map((item) => (
          <div
            key={item.label}
            className="flex items-start justify-between gap-3 rounded-lg bg-white/45 px-3 py-1.5 dark:bg-slate-950/25"
          >
            <span className="max-w-[70%] opacity-70">{item.label}</span>
            <span className="text-right font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export function OverviewMetrics({ metrics }: MetricsGridProps) {
  return (
    <div className={`grid gap-3 md:grid-cols-2 ${metrics.length >= 5 ? "lg:grid-cols-5" : "xl:grid-cols-4"}`}>
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          highlight={metric.highlight}
          sub={metric.sub}
          color={metric.color}
        />
      ))}
    </div>
  );
}

export type AIVisibleKpis = Record<string, number | string>;

export type AIVisibleAlert = {
  id: string;
  title: string;
  severity: string;
  message?: string;
};

export type AIVisibleTable = {
  name: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
};

export type AIVisibleChart = {
  title: string;
  type: string;
  data: unknown;
};

export type AISelectedEntity = {
  type: string;
  id: string;
  label?: string;
};

export type AIVisibleContext = {
  page: string;
  route: string;
  title: string;
  filters: Record<string, unknown>;
  visibleKpis?: AIVisibleKpis;
  visibleAlerts?: AIVisibleAlert[];
  visibleTables?: AIVisibleTable[];
  visibleCharts?: AIVisibleChart[];
  selectedEntity?: AISelectedEntity;
};

export type AIVisibleContextInput = Partial<Omit<AIVisibleContext, "route">>;
export type AIVisibleContextSegmentMap = Record<string, AIVisibleContextInput>;

export function normalizeVisibleContextRoute(
  pathname: string,
  locales: readonly string[]
) {
  const segments = pathname.split("/").filter(Boolean);
  const [firstSegment] = segments;

  if (firstSegment && locales.includes(firstSegment)) {
    const localizedPath = `/${segments.slice(1).join("/")}`;
    return localizedPath === "/" ? "/" : localizedPath.replace(/\/+$/, "") || "/";
  }

  return pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
}

export function derivePageIdentifier(route: string) {
  if (route === "/") {
    return "home";
  }

  return route
    .replace(/^\//, "")
    .replace(/\//g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();
}

export function cleanVisibleContext(
  context: AIVisibleContext
): AIVisibleContext {
  return {
    page: context.page,
    route: context.route,
    title: context.title,
    filters: context.filters,
    ...(context.visibleKpis && Object.keys(context.visibleKpis).length
      ? { visibleKpis: context.visibleKpis }
      : {}),
    ...(context.visibleAlerts?.length
      ? { visibleAlerts: context.visibleAlerts }
      : {}),
    ...(context.visibleTables?.length
      ? { visibleTables: context.visibleTables }
      : {}),
    ...(context.visibleCharts?.length
      ? { visibleCharts: context.visibleCharts }
      : {}),
    ...(context.selectedEntity ? { selectedEntity: context.selectedEntity } : {}),
  };
}

export function mergeVisibleContextInputs(
  inputs: AIVisibleContextInput[],
  route: string
): AIVisibleContext {
  const mergedFilters = inputs.reduce<Record<string, unknown>>(
    (accumulator, input) => ({
      ...accumulator,
      ...(input.filters ?? {}),
    }),
    {}
  );
  const mergedKpis = inputs.reduce<Record<string, number | string>>(
    (accumulator, input) => ({
      ...accumulator,
      ...(input.visibleKpis ?? {}),
    }),
    {}
  );
  const page =
    [...inputs]
      .reverse()
      .find((input) => typeof input.page === "string" && input.page.trim())
      ?.page?.trim() || derivePageIdentifier(route);
  const title =
    [...inputs]
      .reverse()
      .find((input) => typeof input.title === "string" && input.title.trim())
      ?.title?.trim() || derivePageIdentifier(route);
  const selectedEntity =
    [...inputs]
      .reverse()
      .find((input) => input.selectedEntity)?.selectedEntity ?? undefined;

  return cleanVisibleContext({
    page,
    route,
    title,
    filters: mergedFilters,
    ...(Object.keys(mergedKpis).length ? { visibleKpis: mergedKpis } : {}),
    visibleAlerts: inputs.flatMap((input) => input.visibleAlerts ?? []),
    visibleTables: inputs.flatMap((input) => input.visibleTables ?? []),
    visibleCharts: inputs.flatMap((input) => input.visibleCharts ?? []),
    ...(selectedEntity ? { selectedEntity } : {}),
  });
}

export function formatVisibleContext(context: AIVisibleContext) {
  return JSON.stringify(cleanVisibleContext(context), null, 2);
}

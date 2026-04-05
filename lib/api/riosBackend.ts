export type BackendRow = Record<string, unknown>;

type FetchResult<T> = {
  data: T | null;
  error: string | null;
};

type RowsResult<T extends BackendRow = BackendRow> = {
  rows: T[];
  error: string | null;
  hasNext?: boolean;
  limit?: number;
  page?: number;
};

export const DEFAULT_BACKEND_BASE_URL = "http://localhost:8000";
export const BACKEND_MAX_PAGE_SIZE = 50;
const BACKEND_PROXY_BASE_PATH = "/api/backend";

const BACKEND_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_BACKEND_BASE_URL
).replace(/\/$/, "");

export function getBackendBaseUrl() {
  return BACKEND_BASE_URL;
}

function normalizeBackendPath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export function getBackendRequestUrl(path: string) {
  const normalizedPath = normalizeBackendPath(path);

  if (typeof window === "undefined") {
    return `${BACKEND_BASE_URL}${normalizedPath}`;
  }

  return `${BACKEND_PROXY_BASE_PATH}${normalizedPath}`;
}

function toQueryValue(value: string | number) {
  return typeof value === "number" ? String(value) : value;
}

export function normalizeRows<T extends BackendRow = BackendRow>(
  payload: unknown,
): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as BackendRow;

  for (const key of ["rows", "data", "items", "results", "orders"]) {
    const candidate = record[key];

    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }

  return [];
}

function pickBoolean(
  record: BackendRow,
  keys: string[],
): boolean | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value !== 0;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (normalized === "true") {
        return true;
      }

      if (normalized === "false") {
        return false;
      }
    }
  }

  return null;
}

function normalizePageMetadata(
  payload: unknown,
): Pick<RowsResult, "hasNext" | "limit" | "page"> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  const record = payload as BackendRow;
  const hasNext = pickBoolean(record, ["hasNext", "has_next"]);

  return {
    hasNext: hasNext ?? undefined,
    limit: pickNumber(record, ["limit"], 0) || undefined,
    page: pickNumber(record, ["page"], 0) || undefined,
  };
}

export async function fetchBackendJson<T = unknown>(
  path: string,
  signal?: AbortSignal,
): Promise<FetchResult<T>> {
  try {
    const response = await fetch(getBackendRequestUrl(path), {
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      return {
        data: null,
        error: `API error ${response.status}`,
      };
    }

    return {
      data: (await response.json()) as T,
      error: null,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        data: null,
        error: "Request aborted.",
      };
    }

    return {
      data: null,
      error: "Unable to reach backend data service.",
    };
  }
}

export async function fetchBackendRows<T extends BackendRow = BackendRow>(
  path: string,
  signal?: AbortSignal,
): Promise<RowsResult<T>> {
  const result = await fetchBackendJson(path, signal);
  const metadata = normalizePageMetadata(result.data);

  return {
    rows: normalizeRows<T>(result.data),
    error: result.error,
    ...metadata,
  };
}

export async function fetchBackendTable<T extends BackendRow = BackendRow>(
  tableName: string,
  {
    limit = 1000,
    page,
    offset,
    search,
    filters,
    sortBy,
    sortOrder,
    signal,
  }: {
    limit?: number;
    page?: number;
    offset?: number;
    search?: string;
    filters?: string | string[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    signal?: AbortSignal;
  } = {},
): Promise<RowsResult<T>> {
  const params = new URLSearchParams({
    table_name: tableName,
    limit: String(limit),
  });

  if (typeof page === "number") {
    params.set("page", String(page));
  }

  if (typeof offset === "number") {
    params.set("offset", String(offset));
  }

  if (search) {
    params.set("search", search);
  }

  if (filters) {
    const normalizedFilters = Array.isArray(filters)
      ? filters.filter(Boolean).join(",")
      : filters;

    if (normalizedFilters) {
      params.set("filters", normalizedFilters);
    }
  }

  if (sortBy) {
    params.set("sort_by", sortBy);
  }

  if (sortOrder) {
    params.set("sort_order", sortOrder);
  }

  return fetchBackendRows<T>(`/data/table?${params.toString()}`, signal);
}

export async function fetchBackendQuery<T extends BackendRow = BackendRow>({
  tableName,
  selectColumns,
  groupBy,
  aggregates,
  limit = 1000,
  page,
  offset,
  search,
  filters,
  sortBy,
  sortOrder,
  signal,
}: {
  tableName: string;
  selectColumns?: string[];
  groupBy?: string | string[];
  aggregates?: string[];
  limit?: number;
  page?: number;
  offset?: number;
  search?: string;
  filters?: string | string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  signal?: AbortSignal;
}): Promise<RowsResult<T>> {
  const params = new URLSearchParams({
    table_name: tableName,
    limit: String(limit),
  });

  if (typeof page === "number") {
    params.set("page", String(page));
  }

  if (typeof offset === "number") {
    params.set("offset", String(offset));
  }

  if (selectColumns && selectColumns.length > 0) {
    params.set("select_columns", selectColumns.join(","));
  }

  if (groupBy) {
    params.set("group_by", Array.isArray(groupBy) ? groupBy.join(",") : groupBy);
  }

  if (aggregates && aggregates.length > 0) {
    params.set("aggregates", aggregates.join(","));
  }

  if (search) {
    params.set("search", search);
  }

  if (filters) {
    const normalizedFilters = Array.isArray(filters)
      ? filters.filter(Boolean).join(",")
      : filters;

    if (normalizedFilters) {
      params.set("filters", normalizedFilters);
    }
  }

  if (sortBy) {
    params.set("sort_by", sortBy);
  }

  if (sortOrder) {
    params.set("sort_order", sortOrder);
  }

  return fetchBackendRows<T>(`/data/query?${params.toString()}`, signal);
}

export async function fetchAllBackendTableRows<
  T extends BackendRow = BackendRow,
>(
  tableName: string,
  {
    batchSize = BACKEND_MAX_PAGE_SIZE,
    signal,
  }: {
    batchSize?: number;
    signal?: AbortSignal;
  } = {},
): Promise<RowsResult<T>> {
  const rows: T[] = [];
  const limit = Math.min(batchSize, BACKEND_MAX_PAGE_SIZE);
  let offset = 0;

  while (true) {
    const result = await fetchBackendTable<T>(tableName, {
      limit,
      offset,
      signal,
    });

    if (result.error) {
      return {
        rows,
        error: result.error,
      };
    }

    rows.push(...result.rows);

    if (result.rows.length < limit) {
      break;
    }

    offset += limit;
  }

  return {
    rows,
    error: null,
  };
}

export async function fetchAllBackendQueryRows<
  T extends BackendRow = BackendRow,
>({
  tableName,
  selectColumns,
  groupBy,
  aggregates,
  batchSize = BACKEND_MAX_PAGE_SIZE,
  signal,
}: {
  tableName: string;
  selectColumns?: string[];
  groupBy?: string | string[];
  aggregates?: string[];
  batchSize?: number;
  signal?: AbortSignal;
}): Promise<RowsResult<T>> {
  const rows: T[] = [];
  const limit = Math.min(batchSize, BACKEND_MAX_PAGE_SIZE);
  let offset = 0;

  while (true) {
    const result = await fetchBackendQuery<T>({
      tableName,
      selectColumns,
      groupBy,
      aggregates,
      limit,
      offset,
      signal,
    });

    if (result.error) {
      return {
        rows,
        error: result.error,
      };
    }

    rows.push(...result.rows);

    if (result.rows.length < limit) {
      break;
    }

    offset += limit;
  }

  return {
    rows,
    error: null,
  };
}

export function pickString(
  row: BackendRow,
  keys: string[],
  fallback = "",
): string {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string") {
      const trimmed = value.trim();

      if (trimmed) {
        return trimmed;
      }
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return fallback;
}

export function pickNumber(
  row: BackendRow,
  keys: string[],
  fallback = 0,
): number {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.replace(/,/g, "").trim();
      const parsed = Number(normalized);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

export function pickDate(
  row: BackendRow,
  keys: string[],
): Date | null {
  for (const key of keys) {
    const value = row[key];

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (typeof value === "string" || typeof value === "number") {
      const candidate = new Date(value);

      if (!Number.isNaN(candidate.getTime())) {
        return candidate;
      }
    }
  }

  return null;
}

export function pickArray<T = unknown>(
  row: BackendRow,
  keys: string[],
): T[] {
  for (const key of keys) {
    const value = row[key];

    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  return [];
}

export function safeDivide(
  numerator: number,
  denominator: number,
  fallback = 0,
): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }

  return numerator / denominator;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildSearchParams(
  entries: Record<string, string | number | undefined>,
) {
  const params = new URLSearchParams();

  Object.entries(entries).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, toQueryValue(value));
    }
  });

  return params;
}

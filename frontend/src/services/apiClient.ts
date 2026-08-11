// ---------------------------------------------------------------------------
// Base API client — talks to the real EduNest backend.
// ---------------------------------------------------------------------------
// - Access token kept in memory (mirrored to sessionStorage so a page
//   refresh doesn't force a full re-login while the refresh cookie is valid).
// - Refresh token is an httpOnly cookie set by the backend; we call
//   /auth/refresh (credentials: 'include') to rotate it.
// - On a 401 from any authenticated request, we attempt exactly one silent
//   refresh + retry before giving up and forcing logout.
// ---------------------------------------------------------------------------

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api/v1";

const ACCESS_TOKEN_KEY = "edunest.accessToken";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{ field?: string; message: string }>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

export class ApiRequestError extends Error {
  status: number;
  errors?: Array<{ field?: string; message: string }>;
  constructor(status: number, message: string, errors?: Array<{ field?: string; message: string }>) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.errors = errors;
  }
}

let accessToken: string | null = (() => {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
})();

type Unauthorized = () => void;
let onUnauthorized: Unauthorized | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  try {
    if (token) sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    else sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // sessionStorage unavailable — token still works for this tab's lifetime.
  }
}

export function getAccessToken() {
  return accessToken;
}

export function registerUnauthorizedHandler(handler: Unauthorized) {
  onUnauthorized = handler;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) return false;
      const json = (await res.json()) as ApiEnvelope<{ accessToken: string }>;
      setAccessToken(json.data.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Skip attaching the Authorization header (public endpoints). */
  anonymous?: boolean;
  /** Raw FormData body (file uploads) — skips JSON.stringify / Content-Type. */
  formData?: FormData;
  /** Internal: set true on the retry pass so we don't refresh-loop forever. */
  _retried?: boolean;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const base = API_BASE_URL.startsWith("http")
    ? API_BASE_URL
    : new URL(API_BASE_URL, window.location.origin).toString();

  const url = new URL(`${base}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function rawFetch(path: string, options: RequestOptions) {
  const { method = "GET", body, query, anonymous, formData } = options;
  const headers: Record<string, string> = {};
  if (!formData) headers["Content-Type"] = "application/json";
  if (!anonymous && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  return fetch(buildUrl(path, query), {
    method,
    headers,
    credentials: "include",
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
}

async function requestWithMeta<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: ApiEnvelope<T>["meta"] }> {
  const res = await rawFetch(path, options);

  if (res.status === 401 && !options.anonymous && !options._retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return requestWithMeta<T>(path, { ...options, _retried: true });
    setAccessToken(null);
    onUnauthorized?.();
    throw new ApiRequestError(401, "Session expired. Please log in again.");
  }

  if (res.status === 204) {
    return { data: undefined as T };
  }

  let json: ApiEnvelope<T> | undefined;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    json = undefined;
  }

  if (!res.ok) {
    throw new ApiRequestError(res.status, json?.message ?? `Request failed with status ${res.status}`, json?.errors);
  }

  return { data: json?.data as T, meta: json?.meta };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await requestWithMeta<T>(path, options);
  return data;
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method">) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "method">) => request<T>(path, { ...options, method: "DELETE" }),
  withMeta: requestWithMeta,
  request,
  get isConfigured() {
    return true;
  },
};

/** Back-compat export — some older service files import this. Real backend is always configured now. */
export class ApiNotConfiguredError extends Error {}

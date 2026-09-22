// ---------------------------------------------------------------------------
// EduNest API client
// ---------------------------------------------------------------------------
// - Access token is kept in memory and sessionStorage.
// - Refresh token is handled by the backend httpOnly cookie.
// - Auth endpoints never trigger another refresh attempt.
// - A failed refresh clears the local session and does not loop.
// - Authenticated requests receive one refresh-and-retry attempt.
// ---------------------------------------------------------------------------

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api/v1";

const ACCESS_TOKEN_KEY = "edunest.accessToken";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
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
  errors?: Array<{
    field?: string;
    message: string;
  }>;

  constructor(
    status: number,
    message: string,
    errors?: Array<{
      field?: string;
      message: string;
    }>,
  ) {
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

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;

  try {
    if (token) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  } catch {
    // Continue using the in-memory token if sessionStorage is unavailable.
  }
}

export function getAccessToken() {
  return accessToken;
}

export function registerUnauthorizedHandler(
  handler: UnauthorizedHandler | null,
) {
  onUnauthorized = handler;
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        setAccessToken(null);
        return false;
      }

      const json = (await response.json()) as ApiEnvelope<{
        accessToken: string;
        refreshToken?: string;
        expiresIn?: number;
      }>;

      if (!json.data?.accessToken) {
        setAccessToken(null);
        return false;
      }

      setAccessToken(json.data.accessToken);
      return true;
    } catch {
      setAccessToken(null);
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
  query?: Record<
    string,
    string | number | boolean | undefined | null
  >;

  /**
   * Do not attach the Authorization header.
   */
  anonymous?: boolean;

  /**
   * Raw FormData body. Content-Type is set automatically by the browser.
   */
  formData?: FormData;

  /**
   * Internal retry flag.
   */
  _retried?: boolean;

  /**
   * Prevent this request from attempting token refresh.
   */
  skipRefresh?: boolean;
}

function buildUrl(
  path: string,
  query?: RequestOptions["query"],
): string {
  const baseUrl = API_BASE_URL.startsWith("http")
    ? API_BASE_URL
    : new URL(API_BASE_URL, window.location.origin).toString();

  const url = new URL(`${baseUrl}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function rawFetch(
  path: string,
  options: RequestOptions,
): Promise<Response> {
  const {
    method = "GET",
    body,
    query,
    anonymous,
    formData,
  } = options;

  const headers: Record<string, string> = {};

  if (!formData) {
    headers["Content-Type"] = "application/json";
  }

  if (!anonymous && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return fetch(buildUrl(path, query), {
    method,
    headers,
    credentials: "include",
    body:
      formData ??
      (body !== undefined ? JSON.stringify(body) : undefined),
  });
}

function isAuthEndpoint(path: string): boolean {
  return (
    path === "/auth/login" ||
    path === "/auth/register" ||
    path === "/auth/refresh" ||
    path === "/auth/logout"
  );
}

async function parseResponse<T>(
  response: Response,
): Promise<ApiEnvelope<T> | undefined> {
  try {
    return (await response.json()) as ApiEnvelope<T>;
  } catch {
    return undefined;
  }
}

async function requestWithMeta<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{
  data: T;
  meta?: ApiEnvelope<T>["meta"];
}> {
  const response = await rawFetch(path, options);

  const shouldAttemptRefresh =
    response.status === 401 &&
    !options.anonymous &&
    !options.skipRefresh &&
    !options._retried &&
    !isAuthEndpoint(path);

  if (shouldAttemptRefresh) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      return requestWithMeta<T>(path, {
        ...options,
        _retried: true,
      });
    }

    setAccessToken(null);
    onUnauthorized?.();

    throw new ApiRequestError(
      401,
      "Your session has expired. Please log in again.",
    );
  }

  if (response.status === 204) {
    return {
      data: undefined as T,
    };
  }

  const json = await parseResponse<T>(response);

  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      json?.message ??
        `Request failed with status ${response.status}`,
      json?.errors,
    );
  }

  return {
    data: json?.data as T,
    meta: json?.meta,
  };
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await requestWithMeta<T>(path, options);
  return response.data;
}

export const apiClient = {
  get: <T>(
    path: string,
    options?: Omit<RequestOptions, "method">,
  ) =>
    request<T>(path, {
      ...options,
      method: "GET",
    }),

  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body,
    }),

  put: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) =>
    request<T>(path, {
      ...options,
      method: "PUT",
      body,
    }),

  patch: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      body,
    }),

  delete: <T>(
    path: string,
    options?: Omit<RequestOptions, "method">,
  ) =>
    request<T>(path, {
      ...options,
      method: "DELETE",
    }),

  withMeta: requestWithMeta,
  request,

  get isConfigured() {
    return true;
  },
};

export class ApiNotConfiguredError extends Error {}
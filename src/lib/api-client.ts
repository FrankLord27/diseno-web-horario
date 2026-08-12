import type { AuthTokens } from "@horarios/shared-types";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./auth-storage";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export interface ApiViolation {
  type: string;
  message: string;
}

interface ApiErrorBody {
  message?: string | string[];
  violations?: ApiViolation[];
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly violations?: ApiViolation[];

  constructor(message: string, status: number, violations?: ApiViolation[]) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.violations = violations;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as AuthTokens;
    setTokens(data.accessToken, data.refreshToken, data.user);
    return true;
  } catch {
    return false;
  }
}

function redirectToLogin(): void {
  clearTokens();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  isRetry?: boolean;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth, isRetry, headers, ...rest } = options;
  const token = getAccessToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(!skipAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (res.status === 401 && !skipAuth && !isRetry) {
    if (!refreshPromise) {
      refreshPromise = refreshTokens().finally(() => {
        refreshPromise = null;
      });
    }
    const ok = await refreshPromise;
    if (ok) return request<T>(path, { ...options, isRetry: true });
    redirectToLogin();
    throw new ApiClientError("Sesión expirada, inicia sesión de nuevo", 401);
  }

  if (res.status === HTTP_NO_CONTENT) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson
    ? ((await res.json().catch(() => null)) as ApiErrorBody | T | null)
    : null;

  if (!res.ok) {
    const errorBody = (body ?? {}) as ApiErrorBody;
    const rawMessage = errorBody.message ?? `Error ${res.status}`;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : rawMessage;
    throw new ApiClientError(message, res.status, errorBody.violations);
  }

  return body as T;
}

const HTTP_NO_CONTENT = 204;

export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>(path),

  post: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, {
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, {
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(path: string): Promise<T> =>
    request<T>(path, { method: "DELETE" }),

  postNoAuthCheck: <T>(path: string, data: unknown): Promise<T> =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  async postBlob(
    path: string,
    data: unknown,
  ): Promise<{ blob: Blob; filename: string }> {
    const token = getAccessToken();
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorBody = (await res
        .json()
        .catch(() => null)) as ApiErrorBody | null;
      const rawMessage = errorBody?.message ?? `Error ${res.status}`;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage;
      throw new ApiClientError(message, res.status, errorBody?.violations);
    }

    const disposition = res.headers.get("content-disposition") ?? "";
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const filename = match?.[1] ?? "horario.xlsx";
    const blob = await res.blob();
    return { blob, filename };
  },

  async getBlob(path: string): Promise<{ blob: Blob; filename: string }> {
    const token = getAccessToken();
    const res = await fetch(`${API_URL}${path}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) {
      throw new ApiClientError(`Error ${res.status}`, res.status);
    }
    const disposition = res.headers.get("content-disposition") ?? "";
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const filename = match?.[1] ?? "descarga.xlsx";
    return { blob: await res.blob(), filename };
  },

  // Subida multipart: NO se fija Content-Type (el navegador pone el boundary).
  async postForm<T>(path: string, form: FormData): Promise<T> {
    const token = getAccessToken();
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form,
    });
    if (!res.ok) {
      const errorBody = (await res
        .json()
        .catch(() => null)) as ApiErrorBody | null;
      const rawMessage = errorBody?.message ?? `Error ${res.status}`;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage;
      throw new ApiClientError(message, res.status, errorBody?.violations);
    }
    const contentType = res.headers.get("content-type") ?? "";
    return (
      contentType.includes("application/json") ? await res.json() : undefined
    ) as T;
  },
};

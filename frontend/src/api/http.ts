import { apiErrorSchema, type ApiError } from "@/schemas";

const BASE = import.meta.env.VITE_API_BASE ?? "/api";

/** Thrown for any non-2xx response, carrying the server's error code. */
export class ApiException extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Low-level JSON fetch helper. All endpoint functions go through this. */
export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    let err: ApiError = { detail: res.statusText, code: `HTTP_${res.status}` };
    try {
      err = apiErrorSchema.parse(await res.json());
    } catch {
      // body wasn't the expected error shape; keep the default
    }
    throw new ApiException(res.status, err.code, err.detail);
  }

  return (await res.json()) as T;
}

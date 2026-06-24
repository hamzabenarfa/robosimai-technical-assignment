import type {
  ApiError,
  EventLog,
  SceneDetail,
  SceneExport,
  SceneObject,
  SceneSummary,
} from "@/types";

const BASE = import.meta.env.VITE_API_BASE ?? "/api";

export class ApiException extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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
      err = (await res.json()) as ApiError;
    } catch {
      // body wasn't JSON; keep default
    }
    throw new ApiException(res.status, err.code, err.detail);
  }

  return (await res.json()) as T;
}

export const api = {
  listScenes: () => request<SceneSummary[]>("/scenes"),
  createScene: (body: { name: string; description?: string | null }) =>
    request<SceneDetail>("/scenes", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getScene: (id: string) => request<SceneDetail>(`/scenes/${id}`),
  updateScene: (
    id: string,
    body: {
      name?: string;
      description?: string | null;
      thumbnail?: string | null;
    },
  ) =>
    request<SceneDetail>(`/scenes/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteScene: (id: string) =>
    request<void>(`/scenes/${id}`, { method: "DELETE" }),

  addObject: (
    sceneId: string,
    body: Omit<SceneObject, "id" | "scene_id" | "created_at">,
  ) =>
    request<SceneObject>(`/scenes/${sceneId}/objects`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateObject: (
    sceneId: string,
    objectId: string,
    body: Partial<Pick<SceneObject, "position" | "rotation" | "scale" | "metadata">>,
  ) =>
    request<SceneObject>(`/scenes/${sceneId}/objects/${objectId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteObject: (sceneId: string, objectId: string) =>
    request<void>(`/scenes/${sceneId}/objects/${objectId}`, {
      method: "DELETE",
    }),

  listEvents: (sceneId: string, limit = 50) =>
    request<EventLog[]>(`/scenes/${sceneId}/events?limit=${limit}`),

  exportScene: (sceneId: string) =>
    request<SceneExport>(`/scenes/${sceneId}/export`),
  importScene: (body: SceneExport) =>
    request<SceneDetail>(`/scenes/import`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

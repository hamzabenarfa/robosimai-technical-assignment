import type {
  EventLog,
  SceneDetail,
  SceneExport,
  SceneObject,
  SceneSummary,
} from "@/schemas";
import { request } from "@/api/http";

export { ApiException } from "@/api/http";

/** Thin, typed wrappers around the REST endpoints — no React, no caching. */
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
    body: Partial<
      Pick<SceneObject, "position" | "rotation" | "scale" | "metadata">
    >,
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

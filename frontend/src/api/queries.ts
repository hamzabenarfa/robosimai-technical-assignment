import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { sceneKeys } from "@/api/queryKeys";

/** Read hooks: server cache for the scene list, a single scene, and its events. */

export function useScenes() {
  return useQuery({
    queryKey: sceneKeys.list(),
    queryFn: api.listScenes,
  });
}

export function useScene(sceneId: string | undefined) {
  return useQuery({
    queryKey: sceneKeys.detail(sceneId ?? ""),
    queryFn: () => api.getScene(sceneId!),
    enabled: Boolean(sceneId),
    // The editor copies this into the Zustand store and edits there. Never
    // background-refetch, or a refetch could overwrite unsaved local edits.
    staleTime: Infinity,
  });
}

export function useEvents(sceneId: string | undefined) {
  return useQuery({
    queryKey: sceneKeys.events(sceneId ?? ""),
    queryFn: () => api.listEvents(sceneId!),
    enabled: Boolean(sceneId),
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { sceneKeys } from "@/api/queryKeys";
import { defaultObjectPayload } from "@/lib/objectDefaults";
import type { SceneDetail, SceneExport } from "@/schemas";

/** Write hooks. Each owns its own cache invalidation; callers handle toasts. */

export function useCreateScene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; description?: string | null }) => {
      const scene = await api.createScene(body);
      // Seed one robot so the editor never opens to an empty void.
      try {
        await api.addObject(scene.id, defaultObjectPayload("robot"));
      } catch {
        // non-fatal: still open the new scene
      }
      return scene;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: sceneKeys.list() }),
  });
}

export function useDeleteScene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteScene(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: sceneKeys.list() }),
  });
}

export function useImportScene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SceneExport) => api.importScene(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: sceneKeys.list() }),
  });
}

export interface SaveSceneArgs {
  scene: SceneDetail;
  dirtyIds: string[];
  thumbnail: string | null;
}

/** Flush all locally-edited objects, then persist a fresh thumbnail. */
export function useSaveScene() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ scene, dirtyIds, thumbnail }: SaveSceneArgs) => {
      for (const id of dirtyIds) {
        const obj = scene.objects.find((o) => o.id === id);
        if (!obj) continue;
        await api.updateObject(scene.id, obj.id, {
          position: obj.position,
          rotation: obj.rotation,
          scale: obj.scale,
          metadata: obj.metadata,
        });
      }
      if (thumbnail) {
        await api.updateScene(scene.id, { thumbnail });
      }
      return dirtyIds.length;
    },
    onSuccess: (_count, { scene }) =>
      qc.invalidateQueries({ queryKey: sceneKeys.events(scene.id) }),
  });
}

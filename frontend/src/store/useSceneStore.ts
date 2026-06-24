import { create } from "zustand";
import type { SceneDetail, SceneObject, Vec3 } from "@/types";

type DirtyMap = Record<string, true>;

export type GizmoMode = "translate" | "rotate" | "scale";

interface SceneState {
  scene: SceneDetail | null;
  selectedObjectId: string | null;
  gizmoMode: GizmoMode;
  // ids of objects that have local edits that need to be saved
  dirty: DirtyMap;

  setScene: (scene: SceneDetail) => void;
  select: (id: string | null) => void;
  setGizmoMode: (mode: GizmoMode) => void;
  upsertLocalObject: (obj: SceneObject) => void;
  removeLocalObject: (id: string) => void;
  patchObject: (
    id: string,
    patch: Partial<Pick<SceneObject, "position" | "rotation" | "scale" | "metadata">>,
  ) => void;
  setTransform: (
    id: string,
    field: "position" | "rotation" | "scale",
    value: Vec3,
  ) => void;
  clearDirty: () => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  scene: null,
  selectedObjectId: null,
  gizmoMode: "translate",
  dirty: {},

  setScene: (scene) => set({ scene, dirty: {}, selectedObjectId: null }),

  select: (id) => set({ selectedObjectId: id }),

  setGizmoMode: (mode) => set({ gizmoMode: mode }),

  upsertLocalObject: (obj) =>
    set((state) => {
      if (!state.scene) return state;
      const exists = state.scene.objects.some((o) => o.id === obj.id);
      const objects = exists
        ? state.scene.objects.map((o) => (o.id === obj.id ? obj : o))
        : [...state.scene.objects, obj];
      return { scene: { ...state.scene, objects } };
    }),

  removeLocalObject: (id) =>
    set((state) => {
      if (!state.scene) return state;
      const { [id]: _drop, ...dirty } = state.dirty;
      void _drop;
      return {
        scene: {
          ...state.scene,
          objects: state.scene.objects.filter((o) => o.id !== id),
        },
        dirty,
        selectedObjectId:
          state.selectedObjectId === id ? null : state.selectedObjectId,
      };
    }),

  patchObject: (id, patch) =>
    set((state) => {
      if (!state.scene) return state;
      const objects = state.scene.objects.map((o) =>
        o.id === id ? { ...o, ...patch } : o,
      );
      return {
        scene: { ...state.scene, objects },
        dirty: { ...state.dirty, [id]: true },
      };
    }),

  setTransform: (id, field, value) =>
    set((state) => {
      if (!state.scene) return state;
      const objects = state.scene.objects.map((o) =>
        o.id === id ? { ...o, [field]: value } : o,
      );
      return {
        scene: { ...state.scene, objects },
        dirty: { ...state.dirty, [id]: true },
      };
    }),

  clearDirty: () => set({ dirty: {} }),
}));

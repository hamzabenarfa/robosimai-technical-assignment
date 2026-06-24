import type { ObjectType, SceneObject } from "@/types";

export const OBJECT_COLOR: Record<ObjectType, string> = {
  robot: "#3b82f6",
  box: "#f59e0b",
  shelf: "#9ca3af",
  conveyor: "#4b5563",
  obstacle: "#ef4444",
};

export const OBJECT_LABEL: Record<ObjectType, string> = {
  robot: "Robot",
  box: "Box",
  shelf: "Shelf",
  conveyor: "Conveyor",
  obstacle: "Obstacle",
};

export function defaultObjectPayload(type: ObjectType): Omit<
  SceneObject,
  "id" | "scene_id" | "created_at"
> {
  return {
    type,
    position: { x: 0, y: 0.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    metadata: {},
  };
}

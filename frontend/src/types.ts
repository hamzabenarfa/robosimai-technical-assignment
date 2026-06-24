export type ObjectType =
  | "robot"
  | "box"
  | "shelf"
  | "conveyor"
  | "obstacle";

export const OBJECT_TYPES: ObjectType[] = [
  "robot",
  "box",
  "shelf",
  "conveyor",
  "obstacle",
];

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface SceneObject {
  id: string;
  scene_id: string;
  type: ObjectType;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SceneSummary {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  object_count: number;
  created_at: string;
  updated_at: string;
}

export interface SceneDetail {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
  objects: SceneObject[];
}

export interface EventLog {
  id: string;
  scene_id: string;
  action: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface SceneObjectExport {
  type: ObjectType;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  metadata: Record<string, unknown>;
}

export interface SceneExport {
  schema_version: number;
  name: string;
  description: string | null;
  objects: SceneObjectExport[];
}

export interface ApiError {
  detail: string;
  code: string;
}

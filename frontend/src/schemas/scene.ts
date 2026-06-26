import { z } from "zod";

/**
 * Zod schemas are the single source of truth for scene data shapes.
 * Every TypeScript type below is *inferred* from its schema, so the runtime
 * validation and the compile-time types can never drift apart.
 */

export const objectTypeSchema = z.enum([
  "robot",
  "box",
  "shelf",
  "conveyor",
  "obstacle",
]);
export type ObjectType = z.infer<typeof objectTypeSchema>;
export const OBJECT_TYPES = objectTypeSchema.options;

export const vec3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});
export type Vec3 = z.infer<typeof vec3Schema>;

const metadataSchema = z.record(z.string(), z.unknown());

export const sceneObjectSchema = z.object({
  id: z.string(),
  scene_id: z.string(),
  type: objectTypeSchema,
  position: vec3Schema,
  rotation: vec3Schema,
  scale: vec3Schema,
  metadata: metadataSchema,
  created_at: z.string(),
});
export type SceneObject = z.infer<typeof sceneObjectSchema>;

export const sceneSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  thumbnail: z.string().nullable(),
  object_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SceneSummary = z.infer<typeof sceneSummarySchema>;

export const sceneDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  thumbnail: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  objects: z.array(sceneObjectSchema),
});
export type SceneDetail = z.infer<typeof sceneDetailSchema>;

export const eventLogSchema = z.object({
  id: z.string(),
  scene_id: z.string(),
  action: z.string(),
  payload: z.record(z.string(), z.unknown()),
  timestamp: z.string(),
});
export type EventLog = z.infer<typeof eventLogSchema>;

/** Transport shape for export/import — no server-assigned ids or timestamps. */
export const sceneObjectExportSchema = z.object({
  type: objectTypeSchema,
  position: vec3Schema.default({ x: 0, y: 0, z: 0 }),
  rotation: vec3Schema.default({ x: 0, y: 0, z: 0 }),
  scale: vec3Schema.default({ x: 1, y: 1, z: 1 }),
  metadata: metadataSchema.default({}),
});
export type SceneObjectExport = z.infer<typeof sceneObjectExportSchema>;

export const sceneExportSchema = z.object({
  schema_version: z.number().default(1),
  name: z.string().min(1).max(120),
  description: z.string().nullable().default(null),
  objects: z.array(sceneObjectExportSchema).default([]),
});
export type SceneExport = z.infer<typeof sceneExportSchema>;

export const apiErrorSchema = z.object({
  detail: z.string(),
  code: z.string(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

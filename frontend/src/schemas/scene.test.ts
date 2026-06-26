import { describe, it, expect } from "vitest";
import { sceneExportSchema, sceneObjectExportSchema } from "@/schemas";

describe("sceneExportSchema", () => {
  it("parses a minimal export and fills in defaults", () => {
    const result = sceneExportSchema.parse({
      name: "Demo",
      objects: [{ type: "robot" }],
    });
    expect(result.schema_version).toBe(1);
    expect(result.description).toBeNull();
    expect(result.objects[0].position).toEqual({ x: 0, y: 0, z: 0 });
    expect(result.objects[0].scale).toEqual({ x: 1, y: 1, z: 1 });
    expect(result.objects[0].metadata).toEqual({});
  });

  it("rejects an empty name", () => {
    expect(sceneExportSchema.safeParse({ name: "", objects: [] }).success).toBe(
      false,
    );
  });

  it("rejects an unknown object type", () => {
    expect(
      sceneObjectExportSchema.safeParse({ type: "spaceship" }).success,
    ).toBe(false);
  });
});

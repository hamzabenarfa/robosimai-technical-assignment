import { describe, it, expect } from "vitest";
import { readSceneFile, toSafeFilename } from "@/lib/sceneFile";

describe("toSafeFilename", () => {
  it("collapses unsafe characters into underscores", () => {
    expect(toSafeFilename("My Scene #1!")).toBe("My_Scene_1_");
  });

  it("preserves allowed characters", () => {
    expect(toSafeFilename("robot-arm_v2")).toBe("robot-arm_v2");
  });
});

describe("readSceneFile", () => {
  it("parses a valid scene file", async () => {
    const file = new File(
      [JSON.stringify({ name: "X", objects: [{ type: "box" }] })],
      "x.json",
    );
    const scene = await readSceneFile(file);
    expect(scene.name).toBe("X");
    expect(scene.objects[0].type).toBe("box");
  });

  it("rejects malformed JSON", async () => {
    const file = new File(["{ not json"], "x.json");
    await expect(readSceneFile(file)).rejects.toThrow("Invalid JSON file");
  });

  it("rejects a structurally invalid scene", async () => {
    const file = new File([JSON.stringify({ objects: [] })], "x.json");
    await expect(readSceneFile(file)).rejects.toThrow(
      "not a valid scene export",
    );
  });
});

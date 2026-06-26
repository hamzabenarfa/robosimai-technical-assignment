import { sceneExportSchema, type SceneExport } from "@/schemas";

/** Strip characters that are unsafe in a download filename. */
export function toSafeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, "_");
}

/** Trigger a browser download of `data` serialized as pretty JSON. */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Read and validate a user-supplied scene file. The file is untrusted input,
 * so its shape is checked against the Zod schema before it ever reaches the API.
 * Throws an Error with a user-friendly message on malformed JSON or bad shape.
 */
export async function readSceneFile(file: File): Promise<SceneExport> {
  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    throw new Error("Invalid JSON file");
  }
  const result = sceneExportSchema.safeParse(json);
  if (!result.success) {
    throw new Error("File is not a valid scene export");
  }
  return result.data;
}

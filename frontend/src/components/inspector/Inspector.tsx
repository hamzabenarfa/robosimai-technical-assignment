import { useMemo } from "react";
import { api, ApiException } from "@/api/client";
import { useSceneStore } from "@/store/useSceneStore";
import { useToast } from "@/components/Toast";
import { OBJECT_LABEL } from "@/lib/objectDefaults";
import type { Vec3 } from "@/types";

const FIELDS: Array<{ key: "position" | "rotation" | "scale"; label: string }> = [
  { key: "position", label: "Position" },
  { key: "rotation", label: "Rotation (rad)" },
  { key: "scale", label: "Scale" },
];

export function Inspector() {
  const scene = useSceneStore((s) => s.scene);
  const selectedId = useSceneStore((s) => s.selectedObjectId);
  const setTransform = useSceneStore((s) => s.setTransform);
  const patchObject = useSceneStore((s) => s.patchObject);
  const removeLocal = useSceneStore((s) => s.removeLocalObject);
  const toast = useToast();

  const selected = useMemo(
    () => scene?.objects.find((o) => o.id === selectedId) ?? null,
    [scene, selectedId],
  );

  if (!selected) {
    return (
      <div className="rounded-md border border-dashed border-slate-800 p-4 text-sm text-slate-500">
        Select an object in the viewer to edit it.
      </div>
    );
  }

  function onAxis(
    field: "position" | "rotation" | "scale",
    axis: keyof Vec3,
    value: string,
  ) {
    if (!selected) return;
    const num = Number.parseFloat(value);
    if (Number.isNaN(num)) return;
    const current = selected[field];
    setTransform(selected.id, field, { ...current, [axis]: num });
  }

  function onMetadata(value: string) {
    if (!selected) return;
    try {
      const parsed = value.trim() ? JSON.parse(value) : {};
      patchObject(selected.id, { metadata: parsed });
    } catch {
      // ignore until user produces valid JSON
    }
  }

  async function handleDelete() {
    if (!scene || !selected) return;
    if (!confirm("Delete this object?")) return;
    try {
      await api.deleteObject(scene.id, selected.id);
      removeLocal(selected.id);
      toast.show("Object deleted", "success");
    } catch (e) {
      toast.show(e instanceof ApiException ? e.message : "Delete failed", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Selected
        </p>
        <p className="mt-1 text-base text-white">{OBJECT_LABEL[selected.type]}</p>
        <p className="font-mono text-xs text-slate-500">{selected.id}</p>
      </div>

      {FIELDS.map(({ key, label }) => (
        <div key={key}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {(["x", "y", "z"] as const).map((axis) => (
              <label key={axis} className="block">
                <span className="text-[10px] uppercase tracking-wide text-slate-500">
                  {axis}
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={selected[key][axis]}
                  onChange={(e) => onAxis(key, axis, e.target.value)}
                  className="mt-0.5 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white"
                />
              </label>
            ))}
          </div>
        </div>
      ))}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Metadata (JSON)
        </p>
        <textarea
          rows={4}
          defaultValue={JSON.stringify(selected.metadata, null, 2)}
          onBlur={(e) => onMetadata(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs text-white"
        />
      </div>

      <button
        onClick={handleDelete}
        className="rounded-md border border-red-700 px-3 py-2 text-sm text-red-400 hover:bg-red-900/30"
      >
        Delete object
      </button>
    </div>
  );
}

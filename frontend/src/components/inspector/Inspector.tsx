import { useEffect, useMemo, useState } from "react";
import { deleteSelectedObject } from "@/lib/sceneActions";
import { useSceneStore } from "@/store/useSceneStore";
import { useToast } from "@/components/ui/Toast";
import { OBJECT_LABEL } from "@/lib/objectDefaults";
import type { Vec3 } from "@/schemas";

const FIELDS: Array<{
  key: "position" | "rotation" | "scale";
  label: string;
  isAngle?: boolean;
}> = [
  { key: "position", label: "Position" },
  { key: "rotation", label: "Rotation (°)", isAngle: true },
  { key: "scale", label: "Scale" },
];

// Axis colors mirror drei's TransformControls gizmo (X red, Y green, Z blue).
const AXIS_COLOR: Record<"x" | "y" | "z", string> = {
  x: "text-red-600",
  y: "text-green-600",
  z: "text-blue-600",
};

const radToDeg = (r: number) => (r * 180) / Math.PI;
const degToRad = (d: number) => (d * Math.PI) / 180;
// Display angles rounded so radian storage doesn't show as jittery decimals.
const displayAngle = (r: number) => Math.round(radToDeg(r) * 100) / 100;

export function Inspector() {
  const scene = useSceneStore((s) => s.scene);
  const selectedId = useSceneStore((s) => s.selectedObjectId);
  const setTransform = useSceneStore((s) => s.setTransform);
  const patchObject = useSceneStore((s) => s.patchObject);
  const toast = useToast();
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const selected = useMemo(
    () => scene?.objects.find((o) => o.id === selectedId) ?? null,
    [scene, selectedId],
  );

  useEffect(() => {
    setMetadataError(null);
  }, [selected?.id]);

  if (!selected) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-panel border border-dashed border-line bg-surface-subtle px-4 py-8 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-sunken text-ink-faint">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 3l7 17 2.5-7L20 10.5z" />
          </svg>
        </span>
        <p className="text-sm text-ink-soft">
          Select an object in the viewer to edit it.
        </p>
      </div>
    );
  }

  function onAxis(
    field: "position" | "rotation" | "scale",
    axis: keyof Vec3,
    value: string,
    isAngle: boolean,
  ) {
    if (!selected) return;
    const num = Number.parseFloat(value);
    if (Number.isNaN(num)) return;
    const stored = isAngle ? degToRad(num) : num;
    const current = selected[field];
    setTransform(selected.id, field, { ...current, [axis]: stored });
  }

  function onMetadata(value: string) {
    if (!selected) return;
    try {
      const parsed = value.trim() ? JSON.parse(value) : {};
      setMetadataError(null);
      patchObject(selected.id, { metadata: parsed });
    } catch {
      setMetadataError("Invalid JSON — fix syntax before leaving this field.");
    }
  }

  async function handleDelete() {
    if (!scene || !selected) return;
    await deleteSelectedObject({
      sceneId: scene.id,
      objectId: selected.id,
      onSuccess: () => toast.show("Object deleted", "success"),
      onError: (message) => toast.show(message, "error"),
    });
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="rounded-panel border border-line bg-surface-subtle px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Selected
        </p>
        <p className="mt-0.5 text-base font-medium text-ink">
          {OBJECT_LABEL[selected.type]}
        </p>
        <p className="truncate font-mono text-[11px] text-ink-faint">
          {selected.id}
        </p>
      </div>

      {FIELDS.map(({ key, label, isAngle }) => (
        <div key={key}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            {label}
          </p>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(["x", "y", "z"] as const).map((axis) => (
              <label key={axis} className="block">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide ${AXIS_COLOR[axis]}`}
                >
                  {axis}
                </span>
                <input
                  type="number"
                  step={isAngle ? "1" : "0.1"}
                  value={
                    isAngle
                      ? displayAngle(selected[key][axis])
                      : selected[key][axis]
                  }
                  onChange={(e) => onAxis(key, axis, e.target.value, !!isAngle)}
                  className="mt-0.5 w-full rounded-btn border border-line bg-surface px-2 py-1.5 text-sm text-ink transition focus:border-accent"
                />
              </label>
            ))}
          </div>
        </div>
      ))}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Metadata (JSON)
        </p>
        <textarea
          key={selected.id}
          rows={4}
          defaultValue={JSON.stringify(selected.metadata, null, 2)}
          onBlur={(e) => onMetadata(e.target.value)}
          aria-invalid={metadataError ? true : undefined}
          className="mt-1.5 w-full rounded-btn border border-line bg-surface px-2.5 py-2 font-mono text-xs text-ink transition focus:border-accent aria-[invalid=true]:border-danger"
        />
        {metadataError && (
          <p className="mt-1 text-xs text-danger" role="alert">
            {metadataError}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleDelete}
        className="inline-flex items-center justify-center gap-1.5 rounded-btn border border-line px-3 py-2 text-sm font-medium text-danger transition hover:border-danger-line hover:bg-danger-soft"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
          <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
        Delete object
      </button>
    </div>
  );
}

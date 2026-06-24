import { api, ApiException } from "@/api/client";
import { useSceneStore } from "@/store/useSceneStore";
import { useToast } from "@/components/Toast";
import { OBJECT_LABEL, defaultObjectPayload } from "@/lib/objectDefaults";
import { captureViewport } from "@/lib/captureViewport";
import { OBJECT_TYPES, type ObjectType } from "@/types";

export function AddObjectMenu() {
  const scene = useSceneStore((s) => s.scene);
  const upsert = useSceneStore((s) => s.upsertLocalObject);
  const select = useSceneStore((s) => s.select);
  const toast = useToast();

  async function add(type: ObjectType) {
    if (!scene) return;
    try {
      const obj = await api.addObject(scene.id, defaultObjectPayload(type));
      upsert(obj);
      select(obj.id);
      toast.show(`Added ${OBJECT_LABEL[type]}`, "success");
      // Wait two frames so React commits the new mesh and R3F renders it,
      // then snapshot the viewport for the scene card thumbnail.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const thumbnail = captureViewport();
          if (!thumbnail) return;
          void api.updateScene(scene.id, { thumbnail }).catch(() => {
            // non-fatal: thumbnail is best-effort
          });
        });
      });
    } catch (e) {
      toast.show(e instanceof ApiException ? e.message : "Add failed", "error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Add object
      </p>
      {OBJECT_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => add(type)}
          className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-left text-sm text-slate-100 transition hover:border-emerald-500 hover:text-emerald-300"
        >
          + {OBJECT_LABEL[type]}
        </button>
      ))}
    </div>
  );
}

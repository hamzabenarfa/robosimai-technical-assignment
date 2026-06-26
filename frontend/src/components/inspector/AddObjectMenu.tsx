import { api, ApiException } from "@/api/client";
import { useSceneStore } from "@/store/useSceneStore";
import { useToast } from "@/components/ui/Toast";
import { OBJECT_COLOR, OBJECT_LABEL, defaultObjectPayload } from "@/lib/objectDefaults";
import { captureViewport } from "@/lib/captureViewport";
import { OBJECT_TYPES, type ObjectType } from "@/schemas";

export function AddObjectMenu() {
  const scene = useSceneStore((s) => s.scene);
  const upsert = useSceneStore((s) => s.upsertLocalObject);
  const select = useSceneStore((s) => s.select);
  const toast = useToast();

  async function add(type: ObjectType) {
    if (!scene) return;
    try {
      const payload = defaultObjectPayload(type);
      // Stagger new objects in a ring so repeated adds don't stack at the origin.
      const n = scene.objects.length;
      const angle = n * 2.39996; // golden angle, radians
      const radius = 1 + n * 0.15;
      const spawn = {
        ...payload,
        position: {
          x: Math.round(Math.cos(angle) * radius * 100) / 100,
          y: payload.position.y,
          z: Math.round(Math.sin(angle) * radius * 100) / 100,
        },
      };
      const obj = await api.addObject(scene.id, spawn);
      upsert(obj);
      select(obj.id);
      toast.show(`Added ${OBJECT_LABEL[type]}`, "success");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const thumbnail = captureViewport();
          if (!thumbnail) return;
          void api.updateScene(scene.id, { thumbnail }).catch(() => {});
        });
      });
    } catch (e) {
      toast.show(e instanceof ApiException ? e.message : "Add failed", "error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
        Add object
      </p>
      {OBJECT_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => add(type)}
          className="group flex items-center gap-2.5 rounded-btn border border-line bg-surface px-3 py-2 text-left text-sm font-medium text-ink shadow-card transition hover:-translate-y-px hover:border-accent hover:bg-accent-tint hover:text-accent motion-reduce:transform-none"
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white"
            style={{ backgroundColor: OBJECT_COLOR[type] }}
            aria-hidden="true"
          />
          <span className="text-ink-faint transition group-hover:text-accent">
            +
          </span>
          {OBJECT_LABEL[type]}
        </button>
      ))}
    </div>
  );
}

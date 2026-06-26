import { PlusIcon } from "@/components/icons";

/** Shown on the scene list when no scenes exist yet. */
export function ScenesEmptyState() {
  return (
    <div className="mt-12 rounded-panel border border-dashed border-line bg-surface px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-tint text-accent">
        <PlusIcon />
      </div>
      <p className="mt-4 text-lg font-semibold text-ink">
        Build your first robotics scene
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
        Name a scene above, add robots and props in the 3D editor, then save and
        export when you are ready.
      </p>
    </div>
  );
}

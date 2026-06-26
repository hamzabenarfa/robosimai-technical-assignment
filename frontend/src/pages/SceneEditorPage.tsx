import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ApiException, api } from "@/api/client";
import { sceneKeys } from "@/api/queryKeys";
import { useScene, useEvents } from "@/api/queries";
import { useSaveScene } from "@/api/mutations";
import { SceneEditorSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useSceneStore } from "@/store/useSceneStore";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { SceneCanvas } from "@/components/viewer/SceneCanvas";
import { AddObjectMenu } from "@/components/inspector/AddObjectMenu";
import { Inspector } from "@/components/inspector/Inspector";
import { EventLogPanel } from "@/components/EventLogPanel";
import { HelpOverlay } from "@/components/HelpOverlay";
import { ViewportToolbar } from "@/components/ViewportToolbar";
import { ExportIcon } from "@/components/icons";
import { captureViewport } from "@/lib/captureViewport";
import { downloadJson, toSafeFilename } from "@/lib/sceneFile";
import type { SceneDetail } from "@/schemas";

export default function SceneEditorPage() {
  const { sceneId } = useParams<{ sceneId: string }>();
  const scene = useSceneStore((s) => s.scene);
  const setScene = useSceneStore((s) => s.setScene);
  const patchScene = useSceneStore((s) => s.patchScene);
  const dirty = useSceneStore((s) => s.dirty);
  const clearDirty = useSceneStore((s) => s.clearDirty);
  const toast = useToast();
  const qc = useQueryClient();

  const { data: detail, isLoading } = useScene(sceneId);
  const { data: events = [] } = useEvents(sceneId);
  const saveScene = useSaveScene();

  const dirtyCount = Object.keys(dirty).length;
  useUnsavedChangesGuard(dirtyCount > 0);

  // The query owns server state; the store owns live editing. Copy once.
  useEffect(() => {
    if (detail) setScene(detail);
  }, [detail, setScene]);

  async function handleExport() {
    if (!scene) return;
    try {
      const data = await api.exportScene(scene.id);
      downloadJson(`${toSafeFilename(scene.name)}.json`, data);
      toast.show("Scene exported", "success");
    } catch (e) {
      toast.show(
        e instanceof ApiException ? e.message : "Export failed",
        "error",
      );
    }
  }

  async function handleMetaSave(patch: {
    name?: string;
    description?: string | null;
  }) {
    if (!scene) return;
    try {
      await api.updateScene(scene.id, patch);
      qc.invalidateQueries({ queryKey: sceneKeys.list() });
      toast.show("Scene details saved", "success");
    } catch (e) {
      toast.show(
        e instanceof ApiException ? e.message : "Update failed",
        "error",
      );
    }
  }

  function handleSave() {
    if (!scene) return;
    const dirtyIds = Object.keys(dirty);
    if (dirtyIds.length === 0) {
      toast.show("Nothing to save", "info");
      return;
    }
    saveScene.mutate(
      { scene, dirtyIds, thumbnail: captureViewport() },
      {
        onSuccess: (count) => {
          clearDirty();
          toast.show(`Saved ${count} object(s)`, "success");
        },
        onError: (e) =>
          toast.show(
            e instanceof ApiException ? e.message : "Save failed",
            "error",
          ),
      },
    );
  }

  if (isLoading) {
    return <SceneEditorSkeleton />;
  }

  if (!scene) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-ink-soft">
        <p>Scene not found.</p>
        <Link to="/" className="font-medium text-accent hover:text-accent-hover">
          ← Back to scenes
        </Link>
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-1 grid-rows-[minmax(50vh,1fr)_auto_auto_auto] md:grid-cols-[220px_1fr_320px] md:grid-rows-[1fr_180px]">
      <ScenePanel
        scene={scene}
        onExport={handleExport}
        onPatch={patchScene}
        onPersist={handleMetaSave}
      />

      <section className="relative min-h-[50vh] bg-viewport md:min-h-0 md:col-start-2 md:row-start-1">
        <SceneCanvas />
        <ViewportToolbar />
        <HelpOverlay />
      </section>

      <InspectorPanel
        saving={saveScene.isPending}
        dirtyCount={dirtyCount}
        onSave={handleSave}
      />

      <section className="border-t border-line bg-surface-subtle px-4 py-3 md:col-start-2 md:row-start-2">
        <EventLogPanel events={events} />
      </section>
    </div>
  );
}

interface ScenePanelProps {
  scene: SceneDetail;
  onExport: () => void;
  onPatch: (patch: { name?: string; description?: string | null }) => void;
  onPersist: (patch: { name?: string; description?: string | null }) => void;
}

function ScenePanel({ scene, onExport, onPatch, onPersist }: ScenePanelProps) {
  return (
    <aside className="flex flex-col gap-5 border-b border-line bg-surface p-4 md:col-start-1 md:row-start-1 md:row-span-2 md:border-b-0 md:border-r">
      <div className="min-w-0">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft transition hover:text-accent"
        >
          ← All scenes
        </Link>
        <input
          value={scene.name}
          maxLength={120}
          aria-label="Scene name"
          onChange={(e) => onPatch({ name: e.target.value })}
          onBlur={(e) => {
            const name = e.target.value.trim();
            if (!name) return; // keep the last valid name; don't persist empty
            onPatch({ name });
            onPersist({ name });
          }}
          className="mt-2 w-full truncate rounded-btn border border-transparent bg-transparent px-2 py-1 text-lg font-semibold tracking-tight text-ink transition hover:border-line focus:border-accent focus:bg-surface-subtle"
        />
        <input
          value={scene.description ?? ""}
          placeholder="Add a description…"
          aria-label="Scene description"
          onChange={(e) => onPatch({ description: e.target.value })}
          onBlur={(e) =>
            onPersist({ description: e.target.value.trim() || null })
          }
          className="mt-1 w-full rounded-btn border border-transparent bg-transparent px-2 py-1 text-xs text-ink-soft transition placeholder:text-ink-faint hover:border-line focus:border-accent focus:bg-surface-subtle"
        />
      </div>

      <button
        type="button"
        onClick={onExport}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-btn border border-line bg-surface px-3 py-2 text-xs font-medium text-ink-soft transition hover:border-accent hover:bg-accent-tint hover:text-accent"
      >
        <ExportIcon />
        Export scene as JSON
      </button>
      <AddObjectMenu />
    </aside>
  );
}

interface InspectorPanelProps {
  saving: boolean;
  dirtyCount: number;
  onSave: () => void;
}

function InspectorPanel({ saving, dirtyCount, onSave }: InspectorPanelProps) {
  return (
    <aside className="flex flex-col gap-4 border-t border-line bg-surface p-4 md:col-start-3 md:row-start-1 md:row-span-2 md:border-l md:border-t-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
        Inspector
      </p>

      <Inspector />
      <button
        type="button"
        onClick={onSave}
        disabled={saving || dirtyCount === 0}
        className="mt-auto rounded-btn bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:bg-surface-sunken disabled:text-ink-faint disabled:shadow-none"
      >
        {saving
          ? "Saving…"
          : dirtyCount > 0
            ? `Save (${dirtyCount})`
            : "Saved"}
      </button>
    </aside>
  );
}

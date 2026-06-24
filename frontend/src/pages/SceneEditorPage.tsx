import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiException } from "@/api/client";
import { useSceneStore } from "@/store/useSceneStore";
import { useToast } from "@/components/Toast";
import { SceneCanvas } from "@/components/viewer/SceneCanvas";
import { AddObjectMenu } from "@/components/inspector/AddObjectMenu";
import { Inspector } from "@/components/inspector/Inspector";
import { EventLogPanel } from "@/components/EventLogPanel";
import { HelpOverlay } from "@/components/HelpOverlay";
import { ViewportToolbar } from "@/components/ViewportToolbar";
import { captureViewport } from "@/lib/captureViewport";
import type { EventLog } from "@/types";

export default function SceneEditorPage() {
  const { sceneId } = useParams<{ sceneId: string }>();
  const scene = useSceneStore((s) => s.scene);
  const setScene = useSceneStore((s) => s.setScene);
  const dirty = useSceneStore((s) => s.dirty);
  const clearDirty = useSceneStore((s) => s.clearDirty);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const refreshEvents = useCallback(async () => {
    if (!sceneId) return;
    try {
      const data = await api.listEvents(sceneId);
      setEvents(data);
    } catch {
      // non-fatal — don't toast on every poll
    }
  }, [sceneId]);

  const loadScene = useCallback(async () => {
    if (!sceneId) return;
    setLoading(true);
    try {
      const data = await api.getScene(sceneId);
      setScene(data);
      await refreshEvents();
    } catch (e) {
      toast.show(
        e instanceof ApiException ? e.message : "Failed to load scene",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [sceneId, setScene, refreshEvents, toast]);

  useEffect(() => {
    void loadScene();
  }, [loadScene]);

  async function handleExport() {
    if (!scene) return;
    try {
      const data = await api.exportScene(scene.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${scene.name.replace(/[^a-z0-9-_]+/gi, "_")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.show("Scene exported", "success");
    } catch (e) {
      toast.show(
        e instanceof ApiException ? e.message : "Export failed",
        "error",
      );
    }
  }

  async function handleSave() {
    if (!scene) return;
    const dirtyIds = Object.keys(dirty);
    if (dirtyIds.length === 0) {
      toast.show("Nothing to save", "info");
      return;
    }
    setSaving(true);
    try {
      for (const id of dirtyIds) {
        const obj = scene.objects.find((o) => o.id === id);
        if (!obj) continue;
        await api.updateObject(scene.id, obj.id, {
          position: obj.position,
          rotation: obj.rotation,
          scale: obj.scale,
          metadata: obj.metadata,
        });
      }
      const thumbnail = captureViewport();
      if (thumbnail) {
        await api.updateScene(scene.id, { thumbnail });
      }
      clearDirty();
      await refreshEvents();
      toast.show(`Saved ${dirtyIds.length} object(s)`, "success");
    } catch (e) {
      toast.show(e instanceof ApiException ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Loading scene…
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
        <p>Scene not found.</p>
        <Link to="/" className="text-emerald-400 hover:text-emerald-300">
          ← Back to scenes
        </Link>
      </div>
    );
  }

  const dirtyCount = Object.keys(dirty).length;

  return (
    <div className="grid h-full grid-cols-[220px_1fr_320px] grid-rows-[1fr_180px] gap-0">
      <aside className="row-span-2 flex flex-col gap-4 border-r border-slate-800 bg-slate-900 p-4">
        <div>
          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            ← All scenes
          </Link>
          <h2 className="mt-2 text-lg font-semibold text-white">
            {scene.name}
          </h2>
          {scene.description && (
            <p className="mt-1 text-xs text-slate-400">{scene.description}</p>
          )}
          <button
            type="button"
            onClick={handleExport}
            className="mt-3 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:border-emerald-500 hover:text-emerald-300"
          >
            ↓ Export scene as JSON
          </button>
        </div>
        <AddObjectMenu />
      </aside>

      <section className="relative bg-slate-950">
        <SceneCanvas />
        <ViewportToolbar />
        <HelpOverlay />
      </section>

      <aside className="row-span-2 flex flex-col gap-4 border-l border-slate-800 bg-slate-900 p-4">
        <Inspector />
        <button
          onClick={handleSave}
          disabled={saving || dirtyCount === 0}
          className="mt-auto rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400"
        >
          {saving
            ? "Saving…"
            : dirtyCount > 0
              ? `Save (${dirtyCount})`
              : "Saved"}
        </button>
      </aside>

      <section className="border-t border-slate-800 bg-slate-950 px-4 py-3">
        <EventLogPanel events={events} />
      </section>
    </div>
  );
}

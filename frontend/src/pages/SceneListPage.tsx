import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiException } from "@/api/client";
import { useToast } from "@/components/Toast";
import type { SceneExport, SceneSummary } from "@/types";

export default function SceneListPage() {
  const [scenes, setScenes] = useState<SceneSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  async function refresh() {
    setLoading(true);
    try {
      const data = await api.listScenes();
      setScenes(data);
    } catch (e) {
      toast.show(
        e instanceof ApiException ? e.message : "Failed to load scenes",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const scene = await api.createScene({
        name: name.trim(),
        description: description.trim() || null,
      });
      toast.show("Scene created", "success");
      navigate(`/scenes/${scene.id}`);
    } catch (e) {
      toast.show(e instanceof ApiException ? e.message : "Create failed", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleImportFile(file: File) {
    let payload: SceneExport;
    try {
      const text = await file.text();
      payload = JSON.parse(text);
    } catch {
      toast.show("Invalid JSON file", "error");
      return;
    }
    try {
      const scene = await api.importScene(payload);
      toast.show("Scene imported", "success");
      navigate(`/scenes/${scene.id}`);
    } catch (e) {
      toast.show(
        e instanceof ApiException ? e.message : "Import failed",
        "error",
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this scene?")) return;
    try {
      await api.deleteScene(id);
      toast.show("Scene deleted", "success");
      await refresh();
    } catch (e) {
      toast.show(e instanceof ApiException ? e.message : "Delete failed", "error");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Scenes</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-emerald-500 hover:text-emerald-300"
          >
            ↑ Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-slate-500">
            {scenes.length} {scenes.length === 1 ? "scene" : "scenes"}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 md:grid-cols-[1fr_2fr_auto]"
      >
        <input
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Scene name"
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400"
        >
          {creating ? "Creating…" : "New scene"}
        </button>
      </form>

      {loading && (
        <p className="mt-8 text-slate-500">Loading…</p>
      )}

      {!loading && scenes.length === 0 && (
        <div className="mt-12 rounded-lg border border-dashed border-slate-800 py-16 text-center text-slate-500">
          <p>No scenes yet.</p>
          <p className="mt-1 text-xs">Create one above to start editing.</p>
        </div>
      )}

      {!loading && scenes.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenes.map((s) => (
            <SceneCard key={s.id} scene={s} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

interface SceneCardProps {
  scene: SceneSummary;
  onDelete: (id: string) => void;
}

function SceneCard({ scene, onDelete }: SceneCardProps) {
  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onDelete(scene.id);
  }

  return (
    <Link
      to={`/scenes/${scene.id}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900 transition hover:-translate-y-0.5 hover:border-emerald-500/50 hover:shadow-xl"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-950">
        {scene.thumbnail ? (
          <img
            src={scene.thumbnail}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <EmptyThumbnail />
        )}
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete scene"
          className="absolute right-2 top-2 rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-400 opacity-0 backdrop-blur transition hover:border-red-500 hover:text-red-300 group-hover:opacity-100"
        >
          Delete
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-4 py-3">
        <h3 className="truncate text-base font-semibold text-white">
          {scene.name}
        </h3>
        <p className="line-clamp-2 min-h-[2em] text-xs text-slate-400">
          {scene.description ?? <span className="text-slate-600">No description</span>}
        </p>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {scene.object_count} {scene.object_count === 1 ? "object" : "objects"}
          </span>
          <span title={new Date(scene.updated_at).toLocaleString()}>
            {formatRelative(scene.updated_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyThumbnail() {
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-700"
      style={{
        backgroundImage:
          "linear-gradient(to bottom right, rgb(15 23 42), rgb(2 6 23)), repeating-linear-gradient(45deg, transparent 0 12px, rgba(255,255,255,0.02) 12px 13px)",
        backgroundBlendMode: "normal, overlay",
      }}
    >
      <div className="flex flex-col items-center gap-1 text-xs">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 16l5-5 4 4 3-3 6 6" />
          <circle cx="9" cy="9" r="1.5" />
        </svg>
        <span>No preview yet</span>
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

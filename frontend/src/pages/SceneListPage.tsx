import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ApiException } from "@/api/client";
import { useScenes } from "@/api/queries";
import {
  useCreateScene,
  useDeleteScene,
  useImportScene,
} from "@/api/mutations";
import { useConfirm } from "@/components/ui/ConfirmModal";
import { SceneListSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ImportIcon } from "@/components/icons";
import { SceneCard } from "@/components/scenes/SceneCard";
import { SceneForm } from "@/components/scenes/SceneForm";
import { ScenesEmptyState } from "@/components/scenes/ScenesEmptyState";
import { readSceneFile } from "@/lib/sceneFile";

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof ApiException ? e.message : fallback;
}

export default function SceneListPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();
  const { confirm } = useConfirm();
  const navigate = useNavigate();

  const { data: scenes = [], isLoading, isError } = useScenes();
  const createScene = useCreateScene();
  const deleteScene = useDeleteScene();
  const importScene = useImportScene();

  function handleCreate(values: { name: string; description: string | null }) {
    createScene.mutate(values, {
      onSuccess: (scene) => {
        toast.show("Scene created", "success");
        navigate(`/scenes/${scene.id}`);
      },
      onError: (e) => toast.show(errorMessage(e, "Create failed"), "error"),
    });
  }

  async function handleImportFile(file: File) {
    let payload;
    try {
      payload = await readSceneFile(file);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Invalid file", "error");
      return;
    }
    importScene.mutate(payload, {
      onSuccess: (scene) => {
        toast.show("Scene imported", "success");
        navigate(`/scenes/${scene.id}`);
      },
      onError: (e) => toast.show(errorMessage(e, "Import failed"), "error"),
    });
  }

  async function handleDelete(id: string) {
    const ok = await confirm("Delete this scene?");
    if (!ok) return;
    deleteScene.mutate(id, {
      onSuccess: () => toast.show("Scene deleted", "success"),
      onError: (e) => toast.show(errorMessage(e, "Delete failed"), "error"),
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Scenes
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Create, edit, and export your robotics simulation scenes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-btn border border-line bg-surface px-3 py-2 text-xs font-medium text-ink-soft shadow-card transition hover:border-accent hover:bg-accent-tint hover:text-accent"
          >
            <ImportIcon />
            Import JSON
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
          <p className="rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-medium text-ink-soft">
            {scenes.length} {scenes.length === 1 ? "scene" : "scenes"}
          </p>
        </div>
      </div>

      <SceneForm submitting={createScene.isPending} onSubmit={handleCreate} />

      {isLoading && <SceneListSkeleton />}

      {isError && (
        <p className="mt-8 text-sm text-danger">Failed to load scenes.</p>
      )}

      {!isLoading && !isError && scenes.length === 0 && <ScenesEmptyState />}

      {!isLoading && scenes.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenes.map((s) => (
            <SceneCard key={s.id} scene={s} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

import { Link } from "react-router-dom";
import { EmptyThumbnail } from "@/components/icons";
import { formatRelative } from "@/lib/formatRelative";
import type { SceneSummary } from "@/schemas";

interface SceneCardProps {
  scene: SceneSummary;
  onDelete: (id: string) => void;
}

export function SceneCard({ scene, onDelete }: SceneCardProps) {
  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onDelete(scene.id);
  }

  return (
    <Link
      to={`/scenes/${scene.id}`}
      className="group relative flex flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-card transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-panel motion-reduce:transform-none"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-viewport">
        {scene.thumbnail ? (
          <img
            src={scene.thumbnail}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-[1.03] motion-reduce:transform-none"
          />
        ) : (
          <EmptyThumbnail />
        )}
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete scene"
          className="absolute right-2 top-2 rounded-btn border border-white/15 bg-black/40 px-2 py-1 text-xs font-medium text-white opacity-100 backdrop-blur transition hover:border-danger hover:bg-danger hover:text-white [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
        >
          Delete
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-4 py-3">
        <h3 className="truncate text-base font-semibold tracking-tight text-ink transition group-hover:text-accent">
          {scene.name}
        </h3>
        <p className="line-clamp-2 min-h-[2em] text-xs text-ink-soft">
          {scene.description ?? (
            <span className="text-ink-faint">No description</span>
          )}
        </p>
        <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-[11px] text-ink-faint">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {scene.object_count}{" "}
            {scene.object_count === 1 ? "object" : "objects"}
          </span>
          <span title={new Date(scene.updated_at).toLocaleString()}>
            {formatRelative(scene.updated_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}

import { useState } from "react";

interface SceneFormProps {
  submitting: boolean;
  onSubmit: (values: { name: string; description: string | null }) => void;
}

/** Inline "new scene" form. Owns its own field state; reports trimmed values. */
export function SceneForm({ submitting, onSubmit }: SceneFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() || null });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 grid grid-cols-1 gap-3 rounded-panel border border-line bg-surface p-4 shadow-card md:grid-cols-[1fr_2fr_auto]"
    >
      <label className="sr-only" htmlFor="scene-name">
        Scene name
      </label>
      <input
        id="scene-name"
        required
        maxLength={120}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Scene name"
        className="rounded-btn border border-line bg-surface-subtle px-3 py-2 text-sm text-ink transition placeholder:text-ink-faint focus:border-accent focus:bg-surface"
      />
      <label className="sr-only" htmlFor="scene-description">
        Description
      </label>
      <input
        id="scene-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="rounded-btn border border-line bg-surface-subtle px-3 py-2 text-sm text-ink transition placeholder:text-ink-faint focus:border-accent focus:bg-surface"
      />
      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="rounded-btn bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:bg-surface-sunken disabled:text-ink-faint disabled:shadow-none"
      >
        {submitting ? "Creating…" : "New scene"}
      </button>
    </form>
  );
}

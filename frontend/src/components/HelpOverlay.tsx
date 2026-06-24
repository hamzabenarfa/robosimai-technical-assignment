import { useEffect, useState } from "react";

interface Shortcut {
  keys: string[];
  label: string;
}

const NAV: Shortcut[] = [
  { keys: ["Middle drag"], label: "Orbit camera (Blender-style)" },
  { keys: ["Left drag"], label: "Orbit camera (trackpad fallback)" },
  { keys: ["Right drag"], label: "Pan camera" },
  { keys: ["Wheel"], label: "Zoom in / out" },
  { keys: ["F"], label: "Frame selected" },
  { keys: ["Numpad 1"], label: "Front view" },
  { keys: ["Numpad 3"], label: "Right view" },
  { keys: ["Numpad 7"], label: "Top view" },
];

const EDIT: Shortcut[] = [
  { keys: ["Click"], label: "Select object" },
  { keys: ["Click empty"], label: "Deselect" },
  { keys: ["G"], label: "Gizmo: translate" },
  { keys: ["R"], label: "Gizmo: rotate" },
  { keys: ["S"], label: "Gizmo: scale" },
  { keys: ["X", "Delete"], label: "Delete selected" },
  { keys: ["Esc"], label: "Deselect / close help" },
];

export function HelpOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        e.stopPropagation();
      }
    }
    // Capture phase so we close before ViewportKeys deselects.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  return (
    <>
      <button
        type="button"
        title="Keyboard shortcuts (?)"
        aria-label="Show keyboard shortcuts"
        onClick={() => setOpen((v) => !v)}
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-lg font-semibold text-slate-200 shadow-lg backdrop-blur transition hover:border-emerald-500 hover:text-emerald-300"
      >
        ?
      </button>

      {open && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Viewport shortcuts
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              <ShortcutColumn title="Navigate" items={NAV} />
              <ShortcutColumn title="Edit" items={EDIT} />
            </div>

            <p className="mt-6 text-xs text-slate-500">
              Keys are ignored while typing in the Inspector inputs.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function ShortcutColumn({ title, items }: { title: string; items: Shortcut[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="text-slate-200">{s.label}</span>
            <span className="flex gap-1">
              {s.keys.map((k) => (
                <kbd
                  key={k}
                  className="rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 font-mono text-[11px] text-slate-300"
                >
                  {k}
                </kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

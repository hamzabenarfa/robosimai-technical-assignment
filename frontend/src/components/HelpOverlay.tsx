import { useEffect, useRef, useState } from "react";
import {
  getHelpOpen,
  setHelpOpen,
  subscribeHelpOpen,
} from "@/lib/helpOverlayState";
import {
  isEditableTarget,
  MOUSE_SHORTCUTS,
  shortcutsByCategory,
} from "@/lib/shortcuts";

export function HelpOverlay() {
  const [open, setOpen] = useState(getHelpOpen);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeHelpOpen(setOpen), []);

  useEffect(() => {
    setHelpOpen(open);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setOpen((v) => !v);
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        e.stopPropagation();
        e.preventDefault();
      }
    }

    window.addEventListener("keydown", onKey, true);
    dialogRef.current?.focus();

    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  useEffect(() => {
    if (open) return;
    triggerRef.current?.focus();
  }, [open]);

  const navigateShortcuts = [
    ...MOUSE_SHORTCUTS,
    ...shortcutsByCategory("navigate").map((s) => ({
      label: s.label,
      displayKeys: s.displayKeys,
    })),
  ];
  const editShortcuts = shortcutsByCategory("edit").map((s) => ({
    label: s.label,
    displayKeys: s.displayKeys,
  }));

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        title="Keyboard shortcuts (?)"
        aria-label="Show keyboard shortcuts"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-viewport-panel/80 text-lg font-semibold text-slate-200 shadow-float backdrop-blur transition hover:bg-accent hover:text-white md:h-9 md:w-9"
      >
        ?
      </button>

      {open && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            tabIndex={-1}
            className="w-full max-w-2xl rounded-panel border border-line bg-surface p-6 shadow-panel outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2
                id="help-title"
                className="text-lg font-semibold tracking-tight text-ink"
              >
                Viewport shortcuts
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-btn px-2 py-1 text-ink-faint transition hover:bg-surface-sunken hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              <ShortcutColumn title="Navigate" items={navigateShortcuts} />
              <ShortcutColumn title="Edit" items={editShortcuts} />
            </div>

            <p className="mt-6 text-xs text-ink-faint">
              Press{" "}
              <kbd className="rounded border border-line bg-surface-subtle px-1 font-mono">
                ?
              </kbd>{" "}
              to toggle this panel. Keys are ignored while typing in the
              Inspector.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function ShortcutColumn({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; displayKeys: string[] }>;
}) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="text-ink-soft">{s.label}</span>
            <span className="flex gap-1">
              {s.displayKeys.map((k) => (
                <kbd
                  key={k}
                  className="rounded border border-line bg-surface-subtle px-1.5 py-0.5 font-mono text-[11px] text-ink-soft"
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

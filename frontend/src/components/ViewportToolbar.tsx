import type { ReactNode } from "react";
import { useSceneStore, type GizmoMode } from "@/store/useSceneStore";
import { api, ApiException } from "@/api/client";
import { useToast } from "@/components/Toast";
import { dispatchViewportCommand } from "@/components/viewer/ViewportKeys";

interface ToolButtonProps {
  title: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

function ToolButton({
  title,
  shortcut,
  active = false,
  disabled = false,
  onClick,
  children,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={shortcut ? `${title} (${shortcut})` : title}
      className={`group relative flex h-9 w-9 items-center justify-center rounded-md transition ${
        active
          ? "bg-emerald-500/20 text-emerald-300"
          : "text-slate-300 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      }`}
    >
      {children}
      <span className="pointer-events-none absolute left-12 top-1/2 z-30 hidden -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 shadow-lg group-hover:flex">
        {title}
        {shortcut && (
          <kbd className="rounded border border-slate-700 bg-slate-950 px-1 py-0.5 font-mono text-[10px]">
            {shortcut}
          </kbd>
        )}
      </span>
    </button>
  );
}

function Divider() {
  return <div className="my-1 h-px w-7 bg-slate-700" />;
}

export function ViewportToolbar() {
  const gizmoMode = useSceneStore((s) => s.gizmoMode);
  const setGizmoMode = useSceneStore((s) => s.setGizmoMode);
  const selectedId = useSceneStore((s) => s.selectedObjectId);
  const sceneData = useSceneStore((s) => s.scene);
  const removeLocal = useSceneStore((s) => s.removeLocalObject);
  const select = useSceneStore((s) => s.select);
  const toast = useToast();

  async function handleDelete() {
    if (!selectedId || !sceneData) return;
    const id = selectedId;
    try {
      await api.deleteObject(sceneData.id, id);
      removeLocal(id);
      toast.show("Object deleted", "success");
    } catch (e) {
      toast.show(
        e instanceof ApiException ? e.message : "Delete failed",
        "error",
      );
    }
  }

  const modes: Array<{ mode: GizmoMode; label: string; key: string; icon: ReactNode }> = [
    { mode: "translate", label: "Move", key: "G", icon: <MoveIcon /> },
    { mode: "rotate", label: "Rotate", key: "R", icon: <RotateIcon /> },
    { mode: "scale", label: "Scale", key: "S", icon: <ScaleIcon /> },
  ];

  return (
    <div className="pointer-events-auto absolute left-3 top-3 z-10 flex flex-col items-center gap-0.5 rounded-lg border border-slate-700 bg-slate-900/80 p-1 shadow-lg backdrop-blur">
      {modes.map(({ mode, label, key, icon }) => (
        <ToolButton
          key={mode}
          title={label}
          shortcut={key}
          active={gizmoMode === mode}
          onClick={() => setGizmoMode(mode)}
        >
          {icon}
        </ToolButton>
      ))}

      <Divider />

      <ToolButton
        title="Frame selected"
        shortcut="F"
        disabled={!selectedId}
        onClick={() => dispatchViewportCommand({ type: "frame-selected" })}
      >
        <FocusIcon />
      </ToolButton>
      <ToolButton
        title="Front view"
        shortcut="1"
        onClick={() => dispatchViewportCommand({ type: "axis-view", axis: "front" })}
      >
        <DigitIcon>1</DigitIcon>
      </ToolButton>
      <ToolButton
        title="Right view"
        shortcut="3"
        onClick={() => dispatchViewportCommand({ type: "axis-view", axis: "right" })}
      >
        <DigitIcon>3</DigitIcon>
      </ToolButton>
      <ToolButton
        title="Top view"
        shortcut="7"
        onClick={() => dispatchViewportCommand({ type: "axis-view", axis: "top" })}
      >
        <DigitIcon>7</DigitIcon>
      </ToolButton>
      <ToolButton
        title="Reset view"
        onClick={() => dispatchViewportCommand({ type: "reset-view" })}
      >
        <HomeIcon />
      </ToolButton>

      <Divider />

      <ToolButton
        title="Delete"
        shortcut="X"
        disabled={!selectedId}
        onClick={handleDelete}
      >
        <TrashIcon />
      </ToolButton>
      <ToolButton
        title="Deselect"
        shortcut="Esc"
        disabled={!selectedId}
        onClick={() => select(null)}
      >
        <DeselectIcon />
      </ToolButton>
    </div>
  );
}

// --- Icons (inline SVG, 18x18 stroke) ---

const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function MoveIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M5 9l-3 3 3 3" />
      <path d="M9 5l3-3 3 3" />
      <path d="M19 9l3 3-3 3" />
      <path d="M9 19l3 3 3-3" />
      <path d="M2 12h20" />
      <path d="M12 2v20" />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M21 12a9 9 0 11-9-9c2.5 0 4.9 1 6.7 2.7L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

function FocusIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 7V5a2 2 0 012-2h2" />
      <path d="M17 3h2a2 2 0 012 2v2" />
      <path d="M21 17v2a2 2 0 01-2 2h-2" />
      <path d="M7 21H5a2 2 0 01-2-2v-2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
      <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function DeselectIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 3" />
      <path d="M8 8l8 8" />
      <path d="M16 8l-8 8" />
    </svg>
  );
}

function DigitIcon({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[13px] font-semibold leading-none">
      {children}
    </span>
  );
}

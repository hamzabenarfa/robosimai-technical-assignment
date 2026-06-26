import { useState, type ReactNode } from "react";
import { useSceneStore, type GizmoMode } from "@/store/useSceneStore";
import { deleteSelectedObject } from "@/lib/sceneActions";
import { shortcutById } from "@/lib/shortcuts";
import { useToast } from "@/components/ui/Toast";
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
  const [showLabel, setShowLabel] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
      onFocus={() => setShowLabel(true)}
      onBlur={() => setShowLabel(false)}
      title={shortcut ? `${title} (${shortcut})` : title}
      className={`group relative flex h-11 w-11 items-center justify-center rounded-btn transition md:h-9 md:w-9 ${
        active
          ? "bg-accent text-white shadow-sm"
          : "text-slate-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      }`}
    >
      {children}
      <span
        className={`pointer-events-none absolute left-12 top-1/2 z-30 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-btn border border-white/10 bg-viewport-panel px-2 py-1 text-xs text-slate-100 shadow-float ${
          showLabel ? "flex" : "hidden"
        } max-md:group-active:flex md:group-hover:flex`}
      >
        {title}
        {shortcut && (
          <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-mono text-[10px]">
            {shortcut}
          </kbd>
        )}
      </span>
    </button>
  );
}

function Divider() {
  return <div className="my-1 h-px w-7 bg-white/10" />;
}

export function ViewportToolbar() {
  const gizmoMode = useSceneStore((s) => s.gizmoMode);
  const setGizmoMode = useSceneStore((s) => s.setGizmoMode);
  const selectedId = useSceneStore((s) => s.selectedObjectId);
  const sceneData = useSceneStore((s) => s.scene);
  const select = useSceneStore((s) => s.select);
  const toast = useToast();

  async function handleDelete() {
    if (!selectedId || !sceneData) return;
    await deleteSelectedObject({
      sceneId: sceneData.id,
      objectId: selectedId,
      onSuccess: () => toast.show("Object deleted", "success"),
      onError: (message) => toast.show(message, "error"),
    });
  }

  const modes: Array<{ mode: GizmoMode; shortcutId: string; icon: ReactNode }> = [
    { mode: "translate", shortcutId: "gizmo-translate", icon: <MoveIcon /> },
    { mode: "rotate", shortcutId: "gizmo-rotate", icon: <RotateIcon /> },
    { mode: "scale", shortcutId: "gizmo-scale", icon: <ScaleIcon /> },
  ];

  return (
    <div className="pointer-events-auto absolute left-3 top-3 z-10 flex flex-col items-center gap-0.5 rounded-panel border border-white/10 bg-viewport-panel/80 p-1 shadow-float backdrop-blur">
      {modes.map(({ mode, shortcutId, icon }) => {
        const shortcut = shortcutById(shortcutId);
        return (
          <ToolButton
            key={mode}
            title={shortcut?.label ?? mode}
            shortcut={shortcut?.toolbarKey}
            active={gizmoMode === mode}
            onClick={() => setGizmoMode(mode)}
          >
            {icon}
          </ToolButton>
        );
      })}

      <Divider />

      <ToolButton
        title={shortcutById("frame-selected")?.label ?? "Frame selected"}
        shortcut={shortcutById("frame-selected")?.toolbarKey}
        disabled={!selectedId}
        onClick={() => dispatchViewportCommand({ type: "frame-selected" })}
      >
        <FocusIcon />
      </ToolButton>
      <ToolButton
        title={shortcutById("axis-front")?.label ?? "Front view"}
        shortcut={shortcutById("axis-front")?.toolbarKey}
        onClick={() => dispatchViewportCommand({ type: "axis-view", axis: "front" })}
      >
        <ViewCubeIcon face="front" />
      </ToolButton>
      <ToolButton
        title={shortcutById("axis-right")?.label ?? "Right view"}
        shortcut={shortcutById("axis-right")?.toolbarKey}
        onClick={() => dispatchViewportCommand({ type: "axis-view", axis: "right" })}
      >
        <ViewCubeIcon face="right" />
      </ToolButton>
      <ToolButton
        title={shortcutById("axis-top")?.label ?? "Top view"}
        shortcut={shortcutById("axis-top")?.toolbarKey}
        onClick={() => dispatchViewportCommand({ type: "axis-view", axis: "top" })}
      >
        <ViewCubeIcon face="top" />
      </ToolButton>
      <ToolButton
        title="Reset view"
        onClick={() => dispatchViewportCommand({ type: "reset-view" })}
      >
        <HomeIcon />
      </ToolButton>

      <Divider />

      <ToolButton
        title={shortcutById("delete")?.label ?? "Delete"}
        shortcut={shortcutById("delete")?.toolbarKey}
        disabled={!selectedId}
        onClick={handleDelete}
      >
        <TrashIcon />
      </ToolButton>
      <ToolButton
        title={shortcutById("deselect")?.label ?? "Deselect"}
        shortcut={shortcutById("deselect")?.toolbarKey}
        disabled={!selectedId}
        onClick={() => select(null)}
      >
        <DeselectIcon />
      </ToolButton>
    </div>
  );
}

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

// A small orthographic cube; the highlighted face signals which axis view the
// button jumps to (front / right / top), reading clearer than a bare digit.
function ViewCubeIcon({ face }: { face: "front" | "right" | "top" }) {
  const TOP = "M12 2.5L20 7L12 11.5L4 7Z";
  const FRONT = "M4 7L12 11.5L12 21L4 16.5Z";
  const RIGHT = "M20 7L12 11.5L12 21L20 16.5Z";
  return (
    <svg {...ICON_PROPS}>
      <path
        d={TOP}
        fill={face === "top" ? "currentColor" : "none"}
        fillOpacity={face === "top" ? 0.85 : 0}
      />
      <path
        d={FRONT}
        fill={face === "front" ? "currentColor" : "none"}
        fillOpacity={face === "front" ? 0.85 : 0}
      />
      <path
        d={RIGHT}
        fill={face === "right" ? "currentColor" : "none"}
        fillOpacity={face === "right" ? 0.85 : 0}
      />
    </svg>
  );
}

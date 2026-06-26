/** Small, presentational SVG icons shared across the scene screens. */

import type { ReactNode } from "react";
import type { ObjectType } from "@/schemas";

// One recognisable glyph per object type, drawn on a shared 24×24 grid so they
// line up wherever an object is listed (add menu, inspector header).
const OBJECT_ICON_PATHS: Record<ObjectType, ReactNode> = {
  robot: (
    <>
      <rect x="5" y="8" width="14" height="11" rx="2" />
      <path d="M12 8V4" />
      <circle cx="12" cy="3" r="1" />
      <path d="M9 13h.01M15 13h.01" />
    </>
  ),
  box: (
    <>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </>
  ),
  shelf: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M4 9h16M4 15h16" />
    </>
  ),
  conveyor: (
    <>
      <circle cx="6" cy="14" r="2.5" />
      <circle cx="18" cy="14" r="2.5" />
      <path d="M6 11.5h12M6 16.5h12" />
    </>
  ),
  obstacle: (
    <>
      <path d="M10.3 4l-7 12a2 2 0 001.7 3h14a2 2 0 001.7-3l-7-12a2 2 0 00-3.4 0z" />
      <path d="M12 10v3M12 16h.01" />
    </>
  ),
};

export function ObjectIcon({ type, size = 16 }: { type: ObjectType; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {OBJECT_ICON_PATHS[type]}
    </svg>
  );
}

export function ImportIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 15V3" />
      <path d="M8 7l4-4 4 4" />
      <path d="M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
    </svg>
  );
}

export function ExportIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="M8 11l4 4 4-4" />
      <path d="M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function EmptyThumbnail() {
  return (
    <div
      className="flex h-full w-full items-center justify-center text-slate-500"
      style={{
        backgroundImage:
          "linear-gradient(to bottom right, #161a21, #0c0e12), repeating-linear-gradient(45deg, transparent 0 12px, rgba(255,255,255,0.025) 12px 13px)",
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
          aria-hidden="true"
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

/** Small, presentational SVG icons shared across the scene screens. */

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

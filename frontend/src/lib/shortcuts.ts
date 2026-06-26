export type ShortcutCategory = "mouse" | "navigate" | "edit";

export interface ShortcutDef {
  id: string;
  label: string;
  displayKeys: string[];
  category: ShortcutCategory;
  toolbarKey?: string;
  match: (e: KeyboardEvent) => boolean;
}

function keyMatch(key: string, e: KeyboardEvent): boolean {
  return e.key === key || e.key === key.toUpperCase() || e.key === key.toLowerCase();
}

export const SHORTCUTS: ShortcutDef[] = [
  {
    id: "frame-selected",
    label: "Frame selected",
    displayKeys: ["F"],
    category: "navigate",
    toolbarKey: "F",
    match: (e) => keyMatch("f", e) || e.code === "NumpadDecimal",
  },
  {
    id: "axis-front",
    label: "Front view",
    displayKeys: ["1", "Numpad 1"],
    category: "navigate",
    toolbarKey: "1",
    match: (e) => e.code === "Numpad1" || (e.key === "1" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey),
  },
  {
    id: "axis-right",
    label: "Right view",
    displayKeys: ["3", "Numpad 3"],
    category: "navigate",
    toolbarKey: "3",
    match: (e) => e.code === "Numpad3" || (e.key === "3" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey),
  },
  {
    id: "axis-top",
    label: "Top view",
    displayKeys: ["7", "Numpad 7"],
    category: "navigate",
    toolbarKey: "7",
    match: (e) => e.code === "Numpad7" || (e.key === "7" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey),
  },
  {
    id: "gizmo-translate",
    label: "Gizmo: translate",
    displayKeys: ["G"],
    category: "edit",
    toolbarKey: "G",
    match: (e) => keyMatch("g", e),
  },
  {
    id: "gizmo-rotate",
    label: "Gizmo: rotate",
    displayKeys: ["R"],
    category: "edit",
    toolbarKey: "R",
    match: (e) => keyMatch("r", e),
  },
  {
    id: "gizmo-scale",
    label: "Gizmo: scale",
    displayKeys: ["S"],
    category: "edit",
    toolbarKey: "S",
    match: (e) => keyMatch("s", e),
  },
  {
    id: "delete",
    label: "Delete selected",
    displayKeys: ["X", "Delete"],
    category: "edit",
    toolbarKey: "X",
    match: (e) => keyMatch("x", e) || e.key === "Delete",
  },
  {
    id: "deselect",
    label: "Deselect",
    displayKeys: ["Esc"],
    category: "edit",
    toolbarKey: "Esc",
    match: (e) => e.key === "Escape",
  },
];

export const MOUSE_SHORTCUTS: Array<{ label: string; displayKeys: string[] }> = [
  { label: "Orbit camera (Blender-style)", displayKeys: ["Middle drag"] },
  { label: "Orbit camera (trackpad fallback)", displayKeys: ["Left drag"] },
  { label: "Pan camera", displayKeys: ["Right drag"] },
  { label: "Zoom in / out", displayKeys: ["Wheel"] },
];

export function shortcutsByCategory(category: ShortcutCategory): ShortcutDef[] {
  return SHORTCUTS.filter((s) => s.category === category);
}

export function shortcutById(id: string): ShortcutDef | undefined {
  return SHORTCUTS.find((s) => s.id === id);
}

export function matchViewportShortcut(e: KeyboardEvent): ShortcutDef | null {
  for (const shortcut of SHORTCUTS) {
    if (shortcut.match(e)) return shortcut;
  }
  return null;
}

export function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return el.isContentEditable;
}

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { deleteSelectedObject } from "@/lib/sceneActions";
import { getHelpOpen } from "@/lib/helpOverlayState";
import {
  isEditableTarget,
  matchViewportShortcut,
  type ShortcutDef,
} from "@/lib/shortcuts";
import { useSceneStore } from "@/store/useSceneStore";
import { useToast } from "@/components/ui/Toast";

const FRAME_DISTANCE = 6;
const AXIS_DISTANCE = 10;
const DEFAULT_CAMERA: [number, number, number] = [6, 6, 6];

export type ViewportCommand =
  | { type: "frame-selected" }
  | { type: "axis-view"; axis: "front" | "right" | "top" }
  | { type: "reset-view" };

export const VIEWPORT_CMD_EVENT = "viewport:cmd";

export function dispatchViewportCommand(cmd: ViewportCommand): void {
  window.dispatchEvent(
    new CustomEvent<ViewportCommand>(VIEWPORT_CMD_EVENT, { detail: cmd }),
  );
}

export function ViewportKeys() {
  const { camera, scene, controls } = useThree() as any;
  const selectedId = useSceneStore((s) => s.selectedObjectId);
  const sceneData = useSceneStore((s) => s.scene);
  const select = useSceneStore((s) => s.select);
  const setGizmoMode = useSceneStore((s) => s.setGizmoMode);
  const toast = useToast();

  useEffect(() => {
    function runCameraCommand(cmd: ViewportCommand) {
      if (!controls) return;
      const t = controls.target;

      if (cmd.type === "frame-selected") {
        if (!selectedId) return;
        const node = scene.getObjectByName(selectedId);
        if (!node) return;
        const target = new Vector3();
        node.getWorldPosition(target);
        const dir = camera.position.clone().sub(controls.target).normalize();
        if (dir.lengthSq() === 0) dir.set(1, 1, 1).normalize();
        camera.position.copy(target).addScaledVector(dir, FRAME_DISTANCE);
        controls.target.copy(target);
        controls.update();
        return;
      }

      if (cmd.type === "axis-view") {
        if (cmd.axis === "front") camera.position.set(t.x, t.y, t.z + AXIS_DISTANCE);
        if (cmd.axis === "right") camera.position.set(t.x + AXIS_DISTANCE, t.y, t.z);
        if (cmd.axis === "top") camera.position.set(t.x, t.y + AXIS_DISTANCE, t.z);
        camera.lookAt(t);
        controls.update();
        return;
      }

      if (cmd.type === "reset-view") {
        camera.position.set(...DEFAULT_CAMERA);
        controls.target.set(0, 0, 0);
        controls.update();
      }
    }

    function onCommand(e: Event) {
      runCameraCommand((e as CustomEvent<ViewportCommand>).detail);
    }

    async function runShortcutAction(shortcut: ShortcutDef) {
      switch (shortcut.id) {
        case "frame-selected":
          runCameraCommand({ type: "frame-selected" });
          break;
        case "axis-front":
          runCameraCommand({ type: "axis-view", axis: "front" });
          break;
        case "axis-right":
          runCameraCommand({ type: "axis-view", axis: "right" });
          break;
        case "axis-top":
          runCameraCommand({ type: "axis-view", axis: "top" });
          break;
        case "gizmo-translate":
          setGizmoMode("translate");
          break;
        case "gizmo-rotate":
          setGizmoMode("rotate");
          break;
        case "gizmo-scale":
          setGizmoMode("scale");
          break;
        case "deselect":
          select(null);
          break;
        case "delete":
          if (!selectedId || !sceneData) break;
          await deleteSelectedObject({
            sceneId: sceneData.id,
            objectId: selectedId,
            onSuccess: () => toast.show("Object deleted", "success"),
            onError: (message) => toast.show(message, "error"),
          });
          break;
      }
    }

    function onKey(e: KeyboardEvent) {
      if (getHelpOpen() || isEditableTarget(e.target)) return;

      const shortcut = matchViewportShortcut(e);
      if (!shortcut) return;

      if (
        shortcut.id === "delete" ||
        shortcut.id.startsWith("axis-") ||
        shortcut.id === "frame-selected"
      ) {
        e.preventDefault();
      }

      void runShortcutAction(shortcut);
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener(VIEWPORT_CMD_EVENT, onCommand);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(VIEWPORT_CMD_EVENT, onCommand);
    };
  }, [
    camera,
    scene,
    controls,
    selectedId,
    sceneData,
    select,
    setGizmoMode,
    toast,
  ]);

  return null;
}

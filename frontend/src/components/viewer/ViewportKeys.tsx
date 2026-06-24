import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { api, ApiException } from "@/api/client";
import { useSceneStore } from "@/store/useSceneStore";
import { useToast } from "@/components/Toast";

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

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return el.isContentEditable;
}

export function ViewportKeys() {
  const { camera, scene, controls } = useThree() as any;
  const selectedId = useSceneStore((s) => s.selectedObjectId);
  const sceneData = useSceneStore((s) => s.scene);
  const select = useSceneStore((s) => s.select);
  const setGizmoMode = useSceneStore((s) => s.setGizmoMode);
  const removeLocal = useSceneStore((s) => s.removeLocalObject);
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
        return;
      }
    }

    function onCommand(e: Event) {
      runCameraCommand((e as CustomEvent<ViewportCommand>).detail);
    }

    function onKey(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;

      // Frame selected — F or Numpad decimal
      if (e.key === "f" || e.key === "F" || e.code === "NumpadDecimal") {
        runCameraCommand({ type: "frame-selected" });
        e.preventDefault();
        return;
      }

      // Axis views — Blender's numpad 1/3/7
      if (e.code === "Numpad1") {
        runCameraCommand({ type: "axis-view", axis: "front" });
        e.preventDefault();
        return;
      }
      if (e.code === "Numpad3") {
        runCameraCommand({ type: "axis-view", axis: "right" });
        e.preventDefault();
        return;
      }
      if (e.code === "Numpad7") {
        runCameraCommand({ type: "axis-view", axis: "top" });
        e.preventDefault();
        return;
      }

      // Gizmo modes
      if (e.key === "g" || e.key === "G") {
        setGizmoMode("translate");
        return;
      }
      if (e.key === "r" || e.key === "R") {
        setGizmoMode("rotate");
        return;
      }
      if (e.key === "s" || e.key === "S") {
        setGizmoMode("scale");
        return;
      }

      // Deselect
      if (e.key === "Escape") {
        select(null);
        return;
      }

      // Delete selected
      if (
        (e.key === "x" || e.key === "X" || e.key === "Delete") &&
        selectedId &&
        sceneData
      ) {
        const id = selectedId;
        const sceneId = sceneData.id;
        void (async () => {
          try {
            await api.deleteObject(sceneId, id);
            removeLocal(id);
            toast.show("Object deleted", "success");
          } catch (err) {
            toast.show(
              err instanceof ApiException ? err.message : "Delete failed",
              "error",
            );
          }
        })();
      }
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
    removeLocal,
    toast,
  ]);

  return null;
}

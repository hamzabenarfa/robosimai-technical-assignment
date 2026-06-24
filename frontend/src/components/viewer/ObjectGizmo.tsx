import { useEffect, useRef, useState } from "react";
import { TransformControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { Object3D } from "three";
import { useSceneStore } from "@/store/useSceneStore";

interface Props {
  selectedId: string | null;
}

export function ObjectGizmo({ selectedId }: Props) {
  const { scene } = useThree();
  const patchObject = useSceneStore((s) => s.patchObject);
  const mode = useSceneStore((s) => s.gizmoMode);
  const controlsRef = useRef<any>(null);
  const [target, setTarget] = useState<Object3D | null>(null);

  useEffect(() => {
    if (!selectedId) {
      setTarget(null);
      return;
    }
    const node = scene.getObjectByName(selectedId) ?? null;
    setTarget(node);
  }, [selectedId, scene]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onObjectChange = () => {
      if (!target || !selectedId) return;
      patchObject(selectedId, {
        position: {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
        },
        rotation: {
          x: target.rotation.x,
          y: target.rotation.y,
          z: target.rotation.z,
        },
        scale: {
          x: target.scale.x,
          y: target.scale.y,
          z: target.scale.z,
        },
      });
    };

    controls.addEventListener("objectChange", onObjectChange);
    return () => controls.removeEventListener("objectChange", onObjectChange);
  }, [target, selectedId, patchObject]);

  if (!target) return null;

  return <TransformControls ref={controlsRef} object={target} mode={mode} />;
}

import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { MOUSE } from "three";
import { useSceneStore } from "@/store/useSceneStore";
import { SceneObjectMesh } from "./SceneObject";
import { ObjectGizmo } from "./ObjectGizmo";
import { ViewportKeys } from "./ViewportKeys";

// Blender-style mouse: middle drag rotates, right drag pans, wheel zooms.
// LEFT stays on rotate too so trackpad users without a middle button can still navigate.
const BLENDER_MOUSE = {
  LEFT: MOUSE.ROTATE,
  MIDDLE: MOUSE.ROTATE,
  RIGHT: MOUSE.PAN,
};

export function SceneCanvas() {
  const scene = useSceneStore((s) => s.scene);
  const selectedId = useSceneStore((s) => s.selectedObjectId);
  const select = useSceneStore((s) => s.select);

  return (
    <Canvas
      shadows
      camera={{ position: [6, 6, 6], fov: 50 }}
      gl={{ preserveDrawingBuffer: true }}
      onPointerMissed={() => select(null)}
    >
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <Grid
        args={[40, 40]}
        cellColor="#1f2937"
        sectionColor="#334155"
        sectionThickness={1.2}
        infiniteGrid
        fadeDistance={40}
      />
      <OrbitControls
        makeDefault
        enableDamping
        mouseButtons={BLENDER_MOUSE}
      />
      <ObjectGizmo selectedId={selectedId} />
      <ViewportKeys />

      {scene?.objects.map((obj) => (
        <SceneObjectMesh
          key={obj.id}
          object={obj}
          selected={selectedId === obj.id}
          onSelect={select}
        />
      ))}
    </Canvas>
  );
}

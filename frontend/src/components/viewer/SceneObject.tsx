import type { ThreeEvent } from "@react-three/fiber";
import type { SceneObject as SceneObjectType } from "@/schemas";
import { OBJECT_COLOR } from "@/lib/objectDefaults";

interface Props {
  object: SceneObjectType;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function SceneObjectMesh({ object, selected, onSelect }: Props) {
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(object.id);
  };

  const color = OBJECT_COLOR[object.type];
  const matProps = {
    color,
    emissive: selected ? color : "#000000",
    emissiveIntensity: selected ? 0.4 : 0,
    roughness: 0.6,
    metalness: 0.15,
  };

  return (
    <group
      name={object.id}
      position={[object.position.x, object.position.y, object.position.z]}
      rotation={[object.rotation.x, object.rotation.y, object.rotation.z]}
      scale={[object.scale.x, object.scale.y, object.scale.z]}
      onClick={handleClick}
    >
      {object.type === "box" && (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      )}
      {object.type === "shelf" && (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 3, 0.5]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      )}
      {object.type === "conveyor" && (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4, 0.2, 1]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      )}
      {object.type === "obstacle" && (
        <mesh castShadow receiveShadow>
          <coneGeometry args={[0.6, 1, 16]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      )}
      {object.type === "robot" && (
        <>
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 1, 24]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0, 0.8, 0]} castShadow>
            <sphereGeometry args={[0.35, 24, 24]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </>
      )}
    </group>
  );
}

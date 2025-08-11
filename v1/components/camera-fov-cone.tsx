import * as THREE from "three";
import { useRef, useEffect, useMemo } from "react";

type Props = {
  quaternion: [number, number, number, number] | undefined;
  fov: number;
  length?: number;
  color?: string;
};

export default function CameraFovCone({
  quaternion,
  fov,
  length = 3,
  color = "cyan",
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Calculate cone radius from FOV and length
  const angle = (fov * Math.PI) / 180 / 2;
  const radius = Math.tan(angle) * length;

  // Memoize geometry so it's not recreated every render
  const geometry = useMemo(() => {
    const geom = new THREE.ConeGeometry(radius, length, 32, 1, true);
    // By default, cone points up +Y. Rotate to -Z.
    geom.rotateX(Math.PI / 2);
    // Move so tip is at origin
    geom.translate(0, 0, -length / 2);
    return geom;
  }, [radius, length]);

  // Update orientation
  useEffect(() => {
    if (quaternion && meshRef.current) {
      meshRef.current.quaternion.set(...quaternion);
    }
  }, [quaternion]);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial color={color} wireframe />
    </mesh>
  );
}
import * as THREE from "three";
import { useRef, useEffect, useMemo } from "react";
import { LineSegments } from "@react-three/drei";

type Props = {
  quaternion: [number, number, number, number] | undefined;
  fov: number;
  aspect?: number;
  length?: number;
  color?: string;
};

export default function CameraFovFrustum({
  quaternion,
  fov,
  aspect = 1, // default to square if not provided
  length = 3,
  color = "cyan",
}: Props) {
  const groupRef = useRef<THREE.Group>(null);

  // Calculate frustum base size
  const angle = (fov * Math.PI) / 180 / 2;
  const height = 2 * Math.tan(angle) * length;
  const width = height * aspect;

  // Frustum vertices (tip at origin, base at z = -length)
  const vertices = useMemo(() => {
    const tip = [0, 0, 0];
    const bl = [-width / 2, -height / 2, -length];
    const br = [width / 2, -height / 2, -length];
    const tr = [width / 2, height / 2, -length];
    const tl = [-width / 2, height / 2, -length];
    return [tip, bl, br, tr, tl];
  }, [width, height, length]);

  // Wireframe lines: tip to corners, and base rectangle
  const lines = useMemo(() => {
    const [tip, bl, br, tr, tl] = vertices;
    return [
      // Tip to corners
      ...tip, ...bl,
      ...tip, ...br,
      ...tip, ...tr,
      ...tip, ...tl,
      // Base rectangle
      ...bl, ...br,
      ...br, ...tr,
      ...tr, ...tl,
      ...tl, ...bl,
    ];
  }, [vertices]);

  // Update orientation
  useEffect(() => {
    if (quaternion && groupRef.current) {
      groupRef.current.quaternion.set(...quaternion);
    }
  }, [quaternion]);

  return (
    <group ref={groupRef}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={lines.length / 3}
            array={new Float32Array(lines)}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} />
      </lineSegments>
    </group>
  );
}

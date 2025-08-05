"use client"

import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { CameraHelper, type PerspectiveCamera, Quaternion } from "three"
import { useThree } from "@react-three/fiber"

interface OverviewSceneProps {
  orientation?: [number, number, number, number] // [w, x, y, z]
  fov: number
}

export function OverviewScene({ orientation, fov }: OverviewSceneProps) {
  const trackerCameraRef = useRef<PerspectiveCamera>(null)
  const helperRef = useRef<CameraHelper>(null)
  const targetQuaternion = useRef(new Quaternion())
  const currentQuaternion = useRef(new Quaternion())

  const { scene } = useThree()

  // Update target quaternion when orientation changes
  useEffect(() => {
    if (orientation) {
      const [w, x, y, z] = orientation
      targetQuaternion.current.set(x, y, z, w)
    }
  }, [orientation])

  // Update FOV when it changes
  useEffect(() => {
    if (trackerCameraRef.current) {
      trackerCameraRef.current.fov = fov
      trackerCameraRef.current.updateProjectionMatrix()

      // Update helper
      if (helperRef.current) {
        helperRef.current.dispose()
        scene.remove(helperRef.current)
      }

      const newHelper = new CameraHelper(trackerCameraRef.current)
      helperRef.current = newHelper
      scene.add(newHelper)
    }
  }, [fov, scene])

  useFrame((state, delta) => {
    if (trackerCameraRef.current && orientation) {
      // Smooth interpolation using slerp
      currentQuaternion.current.slerp(targetQuaternion.current, Math.min(delta * 10, 1))
      trackerCameraRef.current.quaternion.copy(currentQuaternion.current)

      // Update helper
      if (helperRef.current) {
        helperRef.current.update()
      }
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* Tracker Camera (invisible, just for the frustum) */}
      <perspectiveCamera ref={trackerCameraRef} position={[0, 0, 0]} fov={fov} aspect={1} near={0.1} far={1000} />

      {/* Reference objects */}
      <mesh position={[0, 0, -5]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>

      <mesh position={[3, 0, -5]}>
        <sphereGeometry args={[0.5]} />
        <meshStandardMaterial color="green" />
      </mesh>

      <mesh position={[-3, 0, -5]}>
        <coneGeometry args={[0.5, 1]} />
        <meshStandardMaterial color="blue" />
      </mesh>

      {/* Coordinate system helper */}
      <group>
        {/* X axis - Red */}
        <mesh position={[1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 2]} />
          <meshBasicMaterial color="red" />
        </mesh>

        {/* Y axis - Green */}
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 2]} />
          <meshBasicMaterial color="green" />
        </mesh>

        {/* Z axis - Blue */}
        <mesh position={[0, 0, 1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 2]} />
          <meshBasicMaterial color="blue" />
        </mesh>
      </group>
    </>
  )
}

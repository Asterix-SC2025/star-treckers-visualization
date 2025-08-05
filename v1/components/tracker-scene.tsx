"use client"

import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Quaternion } from "three"

interface TrackerSceneProps {
  orientation?: [number, number, number, number] // [w, x, y, z]
  fov: number
}

export function TrackerScene({ orientation, fov }: TrackerSceneProps) {
  const { camera } = useThree()
  const targetQuaternion = useRef(new Quaternion())
  const currentQuaternion = useRef(new Quaternion())

  // Update target quaternion when orientation changes
  useEffect(() => {
    if (orientation) {
      const [w, x, y, z] = orientation
      targetQuaternion.current.set(x, y, z, w)
    }
  }, [orientation])

  // Update camera FOV
  useEffect(() => {
    if ("fov" in camera) {
      ;(camera as any).fov = fov
      camera.updateProjectionMatrix()
    }
  }, [fov, camera])

  useFrame((state, delta) => {
    if (orientation) {
      // Smooth interpolation using slerp
      currentQuaternion.current.slerp(targetQuaternion.current, Math.min(delta * 10, 1))
      camera.quaternion.copy(currentQuaternion.current)
    }
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />

      {/* Same reference objects as overview */}
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

      {/* Additional distant objects for depth perception */}
      <mesh position={[0, 5, -10]}>
        <octahedronGeometry args={[0.3]} />
        <meshStandardMaterial color="yellow" />
      </mesh>

      <mesh position={[-5, -2, -8]}>
        <torusGeometry args={[0.5, 0.2]} />
        <meshStandardMaterial color="purple" />
      </mesh>

      <mesh position={[4, -3, -12]}>
        <dodecahedronGeometry args={[0.4]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </>
  )
}

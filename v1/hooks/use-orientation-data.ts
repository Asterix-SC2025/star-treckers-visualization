"use client"

import { useState, useEffect } from "react"

interface OrientationData {
  quaternion: [number, number, number, number] // [w, x, y, z]
  fov: number
  timestamp: number
  latency: number
  lat?: number
  lon?: number
  alt_m?: number
}

export function useOrientationData(latestMessage: string | null): OrientationData | null {
  const [orientationData, setOrientationData] = useState<OrientationData | null>(null)

  useEffect(() => {
    if (!latestMessage) return

    try {
      const data = JSON.parse(latestMessage)
      const now = Date.now()

      if (data.q && Array.isArray(data.q) && data.q.length === 4) {
        const [w, x, y, z] = data.q

        // Normalize quaternion
        const length = Math.sqrt(w * w + x * x + y * y + z * z)
        const normalizedQ: [number, number, number, number] =
               length > 0 ? [x / length, y / length, z / length, w / length] : [0, 0, 0, 1]

        setOrientationData({
          quaternion: normalizedQ,
          fov: data.fov_deg || 40,
          timestamp: data.ts_unix_ms || now,
          latency: data.ts_unix_ms ? now - data.ts_unix_ms : 0,
          lat: data.lat,
          lon: data.lon,
          alt_m: data.alt_m,
        })
      }
    } catch (error) {
      console.error("Failed to parse orientation data:", error)
    }
  }, [latestMessage])

  return orientationData
}

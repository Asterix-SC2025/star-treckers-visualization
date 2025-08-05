"use client"

import { useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Settings, Wifi, WifiOff, AlertCircle } from "lucide-react"
import { OverviewScene } from "@/components/overview-scene"
import { TrackerScene } from "@/components/tracker-scene"
import { useWebSocket } from "@/hooks/use-websocket"
import { useOrientationData } from "@/hooks/use-orientation-data"
import { ConnectionTest } from "@/components/connection-test"

export default function OrientationViewer() {
  const [wsUrl, setWsUrl] = useState("ws://localhost:8000/ws/orientation")
  const [fovOverride, setFovOverride] = useState<number | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [tempWsUrl, setTempWsUrl] = useState(wsUrl)
  const [tempFovOverride, setTempFovOverride] = useState("")

  const { connectionStatus, latestMessage, error, connect, disconnect, forceReconnect } = useWebSocket(wsUrl)
  const orientationData = useOrientationData(latestMessage)

  const handleSaveConfig = () => {
    setWsUrl(tempWsUrl)
    setFovOverride(tempFovOverride ? Number.parseFloat(tempFovOverride) : null)
    setShowConfig(false)
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500"
      case "connecting":
        return "bg-yellow-500"
      case "reconnecting":
        return "bg-orange-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="w-4 h-4" />
      case "connecting":
      case "reconnecting":
        return <AlertCircle className="w-4 h-4 animate-pulse" />
      case "error":
        return <WifiOff className="w-4 h-4" />
      default:
        return <WifiOff className="w-4 h-4" />
    }
  }

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [wsUrl, connect, disconnect])

  return (
    <div className="h-screen w-full bg-black text-white relative">
      {/* Status Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <Badge className={`${getStatusColor()} text-white flex items-center gap-2`}>
            {getStatusIcon()}
            {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
          </Badge>

          {orientationData && (
            <Badge variant="outline" className="bg-black/50 text-white border-white/20">
              Latency: {orientationData.latency}ms
            </Badge>
          )}

          {connectionStatus === "error" && (
            <Button
              variant="outline"
              size="sm"
              onClick={forceReconnect}
              className="bg-red-500/20 border-red-500 text-red-200 hover:bg-red-500/30"
            >
              Retry
            </Button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-3 py-2 rounded text-sm max-w-md">
            <div className="font-medium">Connection Error:</div>
            <div>{error.message}</div>
            {error.code && <div className="text-xs opacity-75">Code: {error.code}</div>}
          </div>
        )}

        {/* Connection Instructions */}
        {connectionStatus === "error" && (
          <div className="bg-blue-500/20 border border-blue-500 text-blue-200 px-3 py-2 rounded text-sm max-w-md">
            <div className="font-medium">Quick Fix:</div>
            <div>
              1. Start the relay server:{" "}
              <code className="bg-black/30 px-1 rounded">cd mac_relay && python main.py</code>
            </div>
            <div>2. Check the WebSocket URL in settings</div>
            <div>3. Ensure no firewall is blocking port 8000</div>
          </div>
        )}
      </div>

      {/* Config Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfig(!showConfig)}
          className="bg-black/50 border-white/20 text-white hover:bg-white/10"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Config Drawer */}
      {showConfig && (
        <div className="absolute top-16 right-4 z-10 space-y-4 w-80">
          <Card className="p-4 bg-black/90 border-white/20 text-white">
            <div className="space-y-4">
              <div>
                <Label htmlFor="ws-url">WebSocket URL</Label>
                <Input
                  id="ws-url"
                  value={tempWsUrl}
                  onChange={(e) => setTempWsUrl(e.target.value)}
                  className="bg-black/50 border-white/20 text-white"
                  placeholder="ws://localhost:8000/ws/orientation"
                />
              </div>

              <div>
                <Label htmlFor="fov-override">FOV Override (degrees)</Label>
                <Input
                  id="fov-override"
                  type="number"
                  value={tempFovOverride}
                  onChange={(e) => setTempFovOverride(e.target.value)}
                  className="bg-black/50 border-white/20 text-white"
                  placeholder="Leave empty to use stream value"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveConfig} size="sm">
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfig(false)}
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>

          <ConnectionTest wsUrl={tempWsUrl} />
        </div>
      )}

      {/* Split View */}
      <div className="flex h-full">
        {/* Overview Pane */}
        <div className="w-1/2 h-full border-r border-white/20">
          <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
            <color attach="background" args={["#000000"]} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <OverviewScene orientation={orientationData?.quaternion} fov={fovOverride || orientationData?.fov || 40} />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          </Canvas>
        </div>

        {/* Tracker View Pane */}
        <div className="w-1/2 h-full">
          <Canvas>
            <color attach="background" args={["#000000"]} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <TrackerScene orientation={orientationData?.quaternion} fov={fovOverride || orientationData?.fov || 40} />
          </Canvas>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface ConnectionTestProps {
  wsUrl: string
}

export function ConnectionTest({ wsUrl }: ConnectionTestProps) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<"success" | "error" | null>(null)
  const [message, setMessage] = useState("")

  const testConnection = async () => {
    setTesting(true)
    setResult(null)
    setMessage("")

    try {
      // Test HTTP endpoint first
      const httpUrl = wsUrl.replace("ws://", "http://").replace("/ws/orientation", "/status")

      const response = await fetch(httpUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        const data = await response.json()
        setResult("success")
        setMessage(`Server is running. ${data.clients_connected} clients connected.`)
      } else {
        setResult("error")
        setMessage(`Server responded with status ${response.status}`)
      }
    } catch (error) {
      setResult("error")
      if (error instanceof Error) {
        if (error.name === "TimeoutError") {
          setMessage("Connection timeout - server may be offline")
        } else if (error.message.includes("fetch")) {
          setMessage("Cannot reach server - check if relay server is running")
        } else {
          setMessage(error.message)
        }
      } else {
        setMessage("Unknown connection error")
      }
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="p-4 bg-black/50 border-white/20 text-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Connection Test</h3>
        <Button
          onClick={testConnection}
          disabled={testing}
          size="sm"
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10 bg-transparent"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Connection"
          )}
        </Button>
      </div>

      {result && (
        <div className={`flex items-center gap-2 text-sm ${result === "success" ? "text-green-400" : "text-red-400"}`}>
          {result === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message}
        </div>
      )}

      <div className="text-xs text-gray-400 mt-2">
        Testing: {wsUrl.replace("ws://", "http://").replace("/ws/orientation", "/status")}
      </div>
    </Card>
  )
}

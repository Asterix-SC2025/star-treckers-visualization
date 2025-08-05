"use client"

import { useState, useCallback, useRef, useEffect } from "react"

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "error"

interface WebSocketError {
  message: string
  code?: number
  reason?: string
}

export function useWebSocket(url: string) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected")
  const [latestMessage, setLatestMessage] = useState<string | null>(null)
  const [error, setError] = useState<WebSocketError | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 10
  const isManualDisconnect = useRef(false)

  const connect = useCallback(() => {
    // Don't connect if already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    // Clear any existing error
    setError(null)
    setConnectionStatus("connecting")
    isManualDisconnect.current = false

    try {
      // Validate URL format
      if (!url || (!url.startsWith("ws://") && !url.startsWith("wss://"))) {
        throw new Error("Invalid WebSocket URL format")
      }

      const ws = new WebSocket(url)
      wsRef.current = ws

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close()
          setError({ message: "Connection timeout - server may be offline" })
          setConnectionStatus("error")
        }
      }, 5000)

      ws.onopen = () => {
        clearTimeout(connectionTimeout)
        setConnectionStatus("connected")
        setError(null)
        reconnectAttempts.current = 0
        console.log("WebSocket connected to:", url)
      }

      ws.onmessage = (event) => {
        try {
          // Validate that we received valid data
          if (event.data) {
            setLatestMessage(event.data)
          }
        } catch (err) {
          console.warn("Invalid message received:", err)
        }
      }

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout)
        console.log("WebSocket closed:", event.code, event.reason)

        // Don't reconnect if it was a manual disconnect
        if (isManualDisconnect.current) {
          setConnectionStatus("disconnected")
          return
        }

        // Handle different close codes
        let errorMessage = "Connection lost"
        if (event.code === 1006) {
          errorMessage = "Server unreachable - check if relay server is running"
        } else if (event.code === 1002) {
          errorMessage = "Protocol error"
        } else if (event.code === 1003) {
          errorMessage = "Unsupported data"
        } else if (!event.wasClean) {
          errorMessage = "Connection interrupted"
        }

        setError({ message: errorMessage, code: event.code, reason: event.reason })
        setConnectionStatus("disconnected")

        // Auto-reconnect logic
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          setConnectionStatus("reconnecting")

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            console.log(`Reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`)
            connect()
          }, delay)
        } else {
          setConnectionStatus("error")
          setError({ message: "Max reconnection attempts reached" })
        }
      }

      ws.onerror = (event) => {
        clearTimeout(connectionTimeout)
        console.error("WebSocket error:", event)

        // Provide more helpful error messages
        let errorMessage = "Connection failed"
        if (url.includes("localhost") || url.includes("127.0.0.1")) {
          errorMessage = "Cannot connect to localhost - make sure the relay server is running"
        } else {
          errorMessage = "Cannot connect to server - check network and server status"
        }

        setError({ message: errorMessage })
        setConnectionStatus("error")
      }
    } catch (error) {
      console.error("Failed to create WebSocket:", error)
      setError({
        message: error instanceof Error ? error.message : "Failed to create WebSocket connection",
      })
      setConnectionStatus("error")
    }
  }, [url])

  const disconnect = useCallback(() => {
    isManualDisconnect.current = true

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect")
      wsRef.current = null
    }

    setConnectionStatus("disconnected")
    setError(null)
    reconnectAttempts.current = 0
  }, [])

  const forceReconnect = useCallback(() => {
    reconnectAttempts.current = 0
    disconnect()
    setTimeout(connect, 100)
  }, [connect, disconnect])

  useEffect(() => {
    return () => {
      isManualDisconnect.current = true
      disconnect()
    }
  }, [disconnect])

  return {
    connectionStatus,
    latestMessage,
    error,
    connect,
    disconnect,
    forceReconnect,
  }
}

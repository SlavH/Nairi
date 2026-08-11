"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getOpenCodeClient, type OpenCodeEvent } from "@/lib/opencode-client"

interface UseOpenCodeEventsOptions {
  sessionId?: string
  autoConnect?: boolean
  onEvent?: (event: OpenCodeEvent) => void
  onError?: (error: Error) => void
}

interface UseOpenCodeEventsReturn {
  events: OpenCodeEvent[]
  connected: boolean
  error: Error | null
  connect: () => void
  disconnect: () => void
  clearEvents: () => void
}

export function useOpenCodeEvents({
  sessionId,
  autoConnect = true,
  onEvent,
  onError,
}: UseOpenCodeEventsOptions = {}): UseOpenCodeEventsReturn {
  const [events, setEvents] = useState<OpenCodeEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const client = getOpenCodeClient()

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const url = sessionId
        ? client.getEventSourceUrl(sessionId)
        : client.getGlobalEventSourceUrl()

      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setConnected(true)
        setError(null)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as OpenCodeEvent
          setEvents((prev) => [...prev, data])
          onEvent?.(data)
        } catch (err) {
          console.error("Failed to parse SSE event:", err)
        }
      }

      eventSource.onerror = (event) => {
        const err = new Error("SSE connection error")
        setError(err)
        setConnected(false)
        onError?.(err)
        
        // Attempt reconnection after delay
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            connect()
          }
        }, 5000)
      }

      // Listen for specific event types
      const eventTypes = [
        "session.updated",
        "message.updated",
        "message.completed",
        "permission.requested",
        "question.asked",
        "file.changed",
        "vcs.changed",
      ]

      eventTypes.forEach((eventType) => {
        eventSource.addEventListener(eventType, ((event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data) as OpenCodeEvent
            setEvents((prev) => [...prev, { ...data, type: eventType }])
            onEvent?.({ ...data, type: eventType })
          } catch (err) {
            console.error(`Failed to parse ${eventType} event:`, err)
          }
        }) as EventListener)
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
    }
  }, [sessionId, client, onEvent, onError])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setConnected(false)
  }, [])

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  // Reconnect when sessionId changes
  useEffect(() => {
    if (autoConnect && sessionId) {
      connect()
    }
  }, [sessionId, autoConnect, connect])

  return {
    events,
    connected,
    error,
    connect,
    disconnect,
    clearEvents,
  }
}

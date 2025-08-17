import { useState, useEffect, useCallback } from 'react'

export interface LogMessage {
  timestamp: string
  message: string
  type?: 'info' | 'success' | 'error' | 'warning'
}

export function useRealtimeLogs(taskId?: string) {
  const [logs, setLogs] = useState<LogMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(() => {
    if (!taskId) return

    const eventSource = new EventSource(`/api/logs/${taskId}`)
    
    eventSource.onopen = () => {
      setIsConnected(true)
      setError(null)
    }

    eventSource.onmessage = (event) => {
      try {
        const logMessage: LogMessage = JSON.parse(event.data)
        setLogs(prev => [...prev, logMessage])
      } catch (err) {
        console.error('Error parsing log message:', err)
      }
    }

    eventSource.onerror = (event) => {
      console.error('SSE Error:', event)
      setError('Connection lost. Trying to reconnect...')
      setIsConnected(false)
    }

    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [taskId])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  useEffect(() => {
    if (taskId) {
      const cleanup = connect()
      return cleanup
    }
  }, [taskId, connect])

  return {
    logs,
    isConnected,
    error,
    clearLogs
  }
} 
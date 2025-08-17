'use client'

import { useRealtimeLogs, LogMessage } from '@/hooks/useRealtimeLogs'
import { useEffect, useRef } from 'react'

interface LogsDisplayProps {
  taskId?: string
  logs?: LogMessage[]
  className?: string
  title?: string
}

export function LogsDisplay({ taskId, logs: staticLogs, className = '', title = 'Logs' }: LogsDisplayProps) {
  const { logs: realtimeLogs, isConnected, error } = useRealtimeLogs(taskId)
  const logsEndRef = useRef<HTMLDivElement>(null)
  
  // Use realtime logs if taskId is provided, otherwise use static logs
  const displayLogs = taskId ? realtimeLogs : (staticLogs || [])
  
  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayLogs])

  const getLogColor = (type?: string) => {
    switch (type) {
      case 'success':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      case 'warning':
        return 'text-yellow-400'
      default:
        return 'text-green-400'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {taskId && (
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="bg-gray-900 text-green-400 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
        {displayLogs.length === 0 ? (
          <p className="text-gray-500">
            {taskId ? 'Connecting to real-time logs...' : 'No logs yet. Start the automation to see logs here.'}
          </p>
        ) : (
          <>
            {displayLogs.map((log, index) => (
              <div key={index} className={`mb-1 ${getLogColor(log.type)}`}>
                <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
            <div ref={logsEndRef} />
          </>
        )}
      </div>
    </div>
  )
} 
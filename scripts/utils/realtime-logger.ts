import { NextRequest } from 'next/server'

export interface LogMessage {
  timestamp: string
  message: string
  type?: 'info' | 'success' | 'error' | 'warning'
}

export class RealtimeLogger {
  private logs: LogMessage[] = []
  private listeners: ((log: LogMessage) => void)[] = []
  private isClosed = false

  addLog(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const logMessage: LogMessage = {
      timestamp: new Date().toISOString(),
      message,
      type
    }
    
    this.logs.push(logMessage)
    console.log(`[${logMessage.timestamp}] ${message}`)
    
    // Only notify listeners if not closed
    if (!this.isClosed) {
      this.listeners.forEach(listener => {
        try {
          listener(logMessage)
        } catch (error) {
          // Remove listener if it throws an error (e.g., closed stream)
          const index = this.listeners.indexOf(listener)
          if (index > -1) {
            this.listeners.splice(index, 1)
          }
        }
      })
    }
  }

  addSuccess(message: string) {
    this.addLog(message, 'success')
  }

  addError(message: string) {
    this.addLog(message, 'error')
  }

  addWarning(message: string) {
    this.addLog(message, 'warning')
  }

  getLogs(): LogMessage[] {
    return [...this.logs]
  }

  subscribe(listener: (log: LogMessage) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  clear() {
    this.logs = []
  }

  close() {
    this.isClosed = true
    this.listeners = []
  }
}

// Task-based logger manager
class LoggerManager {
  private loggers: Map<string, RealtimeLogger> = new Map()

  createLogger(taskId: string): RealtimeLogger {
    const logger = new RealtimeLogger()
    this.loggers.set(taskId, logger)
    return logger
  }

  getLogger(taskId: string): RealtimeLogger | undefined {
    return this.loggers.get(taskId)
  }

  removeLogger(taskId: string) {
    const logger = this.loggers.get(taskId)
    if (logger) {
      logger.close()
      this.loggers.delete(taskId)
    }
  }

  cleanup() {
    this.loggers.forEach(logger => logger.close())
    this.loggers.clear()
  }
}

// Global logger manager
export const loggerManager = new LoggerManager()

// Global logger instance (for backward compatibility)
export const globalLogger = new RealtimeLogger()

// SSE Response helper
export function createSSEResponse(taskId: string) {
  let logger = loggerManager.getLogger(taskId)
  
  if (!logger) {
    logger = loggerManager.createLogger(taskId)
  }

  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = logger!.subscribe((log) => {
        try {
          const data = `data: ${JSON.stringify(log)}\n\n`
          controller.enqueue(new TextEncoder().encode(data))
        } catch (error) {
          // Stream is closed, cleanup
          unsubscribe()
          loggerManager.removeLogger(taskId)
        }
      })

      // Send initial logs
      logger!.getLogs().forEach(log => {
        try {
          const data = `data: ${JSON.stringify(log)}\n\n`
          controller.enqueue(new TextEncoder().encode(data))
        } catch (error) {
          // Stream is closed, cleanup
          unsubscribe()
          loggerManager.removeLogger(taskId)
        }
      })

      // Cleanup on close
      return () => {
        unsubscribe()
        loggerManager.removeLogger(taskId)
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
} 
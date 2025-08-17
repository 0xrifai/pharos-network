'use client'

import { useState } from 'react'
import { LogsDisplay } from '@/components/LogsDisplay'
import Link from 'next/link'

export default function AutostakingWithdrawPage() {
  const [privateKey, setPrivateKey] = useState('')
  const [rpcUrl, setRpcUrl] = useState('https://rpc.pharosnetwork.com')
  const [proxyUrl, setProxyUrl] = useState('')
  const [autostakingToken, setAutostakingToken] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [taskId, setTaskId] = useState<string | undefined>(undefined)
  const [logs, setLogs] = useState<string[]>([])
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!privateKey) {
      alert('Please enter your private key')
      return
    }

    setIsRunning(true)
    setResult(null)
    // Generate a unique task ID for this run
    const newTaskId = `autostaking-withdraw-${Date.now()}`
    setTaskId(newTaskId)

    try {
      const response = await fetch('/api/autostaking-withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privateKey,
          rpcUrl,
          proxyUrl,
          autostakingToken,
          taskId: newTaskId
        }),
      })

      const data = await response.json()
      setResult(data)

      

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run automation')
      }

    } catch (error) {
      console.error('Error:', error)
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Autostaking Withdraw Automation
          </h1>
          <p className="text-gray-600">
            Withdraw all vaults from autostaking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Private Key *
                </label>
                <input
                  type="password"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your private key"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RPC URL
                </label>
                <input
                  type="text"
                  value={rpcUrl}
                  onChange={(e) => setRpcUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="RPC URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proxy URL
                </label>
                <input
                  type="text"
                  value={proxyUrl}
                  onChange={(e) => setProxyUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Proxy URL (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Autostaking Token
                </label>
                <input
                  type="text"
                  value={autostakingToken}
                  onChange={(e) => setAutostakingToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Autostaking token (optional)"
                />
              </div>

              <button
                type="submit"
                disabled={isRunning}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isRunning ? 'Running...' : 'Start Automation'}
              </button>
            </form>
          </div>

          {/* Logs */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Logs</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet. Start the automation to see logs here.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 
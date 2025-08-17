'use client'

import { useState } from 'react'
import { LogsDisplay } from '@/components/LogsDisplay'
import Link from 'next/link'

export default function AutostakingFaucetPage() {
  const [privateKey, setPrivateKey] = useState('')
  const [rpcUrl, setRpcUrl] = useState('http://rpc.pharosnetwork.com')
  const [autostakingToken, setAutostakingToken] = useState('')
  const [timeoutMinMs, setTimeoutMinMs] = useState(10000)
  const [timeoutMaxMs, setTimeoutMaxMs] = useState(20000)
  const [isRunning, setIsRunning] = useState(false)
  const [taskId, setTaskId] = useState<string | undefined>(undefined)
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
    const newTaskId = `autostaking-faucet-${Date.now()}`
    setTaskId(newTaskId)

    try {
      const response = await fetch('/api/autostaking-faucet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privateKey,
          rpcUrl,
          autostakingToken,
          timeoutMinMs,
          timeoutMaxMs,
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
            Autostaking Faucet Automation
          </h1>
          <p className="text-gray-600">
            Automate faucet operations for autostaking
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
                  Autostaking Token *
                </label>
                <input
                  type="password"
                  value={autostakingToken}
                  onChange={(e) => setAutostakingToken(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your autostaking token"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={timeoutMinMs}
                    onChange={(e) => setTimeoutMinMs(parseInt(e.target.value) || 1000)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="100"
                    max="10000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={timeoutMaxMs}
                    onChange={(e) => setTimeoutMaxMs(parseInt(e.target.value) || 3000)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="100"
                    max="10000"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRunning}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isRunning ? 'Running...' : 'Start Faucet Claim'}
              </button>
            </form>

            {/* Results */}
            {result && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h3 className="text-lg font-medium mb-2">Results</h3>
                {result.success ? (
                  <div className="text-green-600 font-medium">✓ {result.message}</div>
                ) : (
                  <div className="text-red-600 font-medium">✗ {result.error}</div>
                )}
              </div>
            )}
          </div>

          {/* Real-time Logs */}
          <LogsDisplay 
            taskId={taskId} 
            title="Autostaking Faucet Logs"
            className="lg:col-span-1"
          />
        </div>
      </div>
    </div>
  )
} 
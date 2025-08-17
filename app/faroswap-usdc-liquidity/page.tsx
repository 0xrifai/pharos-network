'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LogsDisplay } from '@/components/LogsDisplay'

export default function FaroswapUsdcLiquidityPage() {
  const [privateKey, setPrivateKey] = useState('')
  const [rpcUrl, setRpcUrl] = useState('https://rpc.pharosnetwork.com')
  const [loopCount, setLoopCount] = useState(1)
  const [timeoutMinMs, setTimeoutMinMs] = useState(1000)
  const [timeoutMaxMs, setTimeoutMaxMs] = useState(3000)
  const [amountInPercent, setAmountInPercent] = useState(100)
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
    setTaskId(`faroswap-usdc-liquidity-${Date.now()}`)
    setResult(null)

    try {
      const response = await fetch('/api/faroswap-usdc-liquidity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privateKey,
          rpcUrl,
          loopCount,
          timeoutMinMs,
          timeoutMaxMs,
          amountInPercent,
        }),
      })

      const data = await response.json()
      setResult(data)

      // Logs are now handled by real-time connection

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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Faroswap USDC Liquidity
          </h1>
          <p className="text-gray-600">
            Add USDC liquidity to Faroswap
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
                  Loop Count
                </label>
                <input
                  type="number"
                  value={loopCount}
                  onChange={(e) => setLoopCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount In Percent
                </label>
                <input
                  type="number"
                  value={amountInPercent}
                  onChange={(e) => setAmountInPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="100"
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
                    onChange={(e) => setTimeoutMinMs(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={timeoutMaxMs}
                    onChange={(e) => setTimeoutMaxMs(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="100"
                  />
                </div>
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
          <LogsDisplay taskId={taskId} />
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
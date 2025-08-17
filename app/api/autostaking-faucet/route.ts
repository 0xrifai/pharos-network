import { NextRequest, NextResponse } from 'next/server'
import { loggerManager } from '@/scripts/utils/realtime-logger'
import { faucet } from '@/scripts/pharosNetwork/autostaking/faucet'
import { setupProvider } from '@/scripts/utils/provider'
import { ownAddress } from '@/scripts/utils/wallet'
import { sleep } from '@/scripts/utils/time'
import { randomAmount } from '@/scripts/utils/amount'

export async function POST(request: NextRequest) {
  let taskId: string | undefined
  
  try {
    const {  
      privateKey,
      rpcUrl = 'http://rpc.pharosnetwork.com', 
      timeoutMinMs = 1000, 
      timeoutMaxMs = 3000,
      taskId: requestTaskId
    } = await request.json()

    taskId = requestTaskId

    if (!privateKey) {
      return NextResponse.json(
        { error: 'Private key is required' },
        { status: 400 }
      )
    }

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Get or create logger for this task
    let logger = loggerManager.getLogger(taskId)
    if (!logger) {
      logger = loggerManager.createLogger(taskId)
    }

    // Clear previous logs
    logger.clear()

    // Set environment variables from frontend input
    process.env.PRIVATE_KEY = privateKey

    // Setup provider and wallet
    const provider = setupProvider({
      rpcUrl: rpcUrl
    })

    const wallet = ownAddress({
      dirname: process.cwd(),
      provider,
      key: "PRIVATE_KEY"
    })

    logger.addLog('Starting Autostaking Faucet automation...')
    logger.addLog(`Wallet Address: ${wallet.address}`)
    logger.addLog(`Network: ${rpcUrl}`)
    
    try {
      logger.addLog('Requesting faucet tokens...')
      await faucet({
        signer: wallet.signer,
        logger
      })
      logger.addSuccess("Faucet operation completed successfully")
    } catch (error) {
      logger.addError(`Error in faucet operation: ${error}`)
    }
    
    const ms = randomAmount({
      min: timeoutMinMs,
      max: timeoutMaxMs
    })
    logger.addLog(`Sleeping for ${ms}ms...`)
    await sleep(ms)
    
    logger.addSuccess("Autostaking Faucet automation completed")

    return NextResponse.json({
      success: true,
      message: 'Autostaking Faucet automation completed successfully',
      logs: logger.getLogs()
    })

  } catch (error) {
    console.error('Error in autostaking-faucet API:', error)
    
    // Try to log error if we have a logger
    if (taskId) {
      const logger = loggerManager.getLogger(taskId)
      if (logger) {
        logger.addError(`Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { loggerManager } from '@/scripts/utils/realtime-logger'
import { setupProvider } from '@/scripts/utils/provider'
import { ownAddress } from '@/scripts/utils/wallet'
import { tip } from '@/scripts/pharosNetwork/primus/sent'
import { sleep } from '@/scripts/utils/time'
import { randomAmount } from '@/scripts/utils/amount'

export async function POST(request: NextRequest) {
  let taskId: string | undefined
  
  try {
    const {  
      privateKey,
      rpcUrl = 'http://rpc.pharosnetwork.com', 
      loopCount = 1, 
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

    logger.addLog('Starting Primus automation...')
    logger.addLog(`Wallet Address: ${wallet.address}`)
    logger.addLog(`Network: ${rpcUrl}`)
    logger.addLog(`Loop Count: ${loopCount}`)

    for (let index = 1; index <= loopCount; index++) {
      logger.addLog(`Task primus ${index}/${loopCount}`)
      try {
        logger.addLog('Sending Primus tip...')
        await tip({
          wallet: wallet.signer,
          logger
        })
        logger.addSuccess('Primus tip sent successfully')
      } catch (error) {
        logger.addError(`Error sending Primus tip: ${error}`)
      }
      
      const ms = randomAmount({
        min: timeoutMinMs,
        max: timeoutMaxMs
      })
      logger.addLog(`Sleeping for ${ms}ms...`)
      await sleep(ms)
    }

    logger.addSuccess("Primus automation completed")

    return NextResponse.json({
      success: true,
      message: 'Primus automation completed successfully',
      logs: logger.getLogs()
    })

  } catch (error) {
    console.error('Error in primus API:', error)
    
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
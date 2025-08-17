import { NextRequest, NextResponse } from 'next/server'
import { loggerManager } from '@/scripts/utils/realtime-logger'
import { setupProvider } from '@/scripts/utils/provider'
import { ownAddress } from '@/scripts/utils/wallet'
import { register } from '@/scripts/pharosNetwork/pns'
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
      days = 30,
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

    logger.addLog('Starting Pharos Name Service automation...')
    logger.addLog(`Wallet Address: ${wallet.address}`)
    logger.addLog(`Network: ${rpcUrl}`)
    logger.addLog(`Registration Days: ${days}`)
    logger.addLog(`Loop Count: ${loopCount}`)

    const baseDir = process.cwd()

    for (let index = 1; index <= loopCount; index++) {
      logger.addLog(`Task pharos name service ${index}/${loopCount}`)
      try {
        logger.addLog('Registering PNS domain...')
        await register({
          baseDir,
          signer: wallet.signer,
          days,
          provider,
          logger
        })
        logger.addSuccess("PNS registration completed successfully")
      } catch (error) {
        logger.addError(`Error registering PNS: ${error}`)
      }
    
      if (index < loopCount) {
        const ms = randomAmount({
          min: timeoutMinMs,
          max: timeoutMaxMs
        })
        logger.addLog(`Sleeping for ${ms}ms...`)
        await sleep(ms)
      }
    }

    logger.addSuccess("Pharos Name Service automation completed")

    return NextResponse.json({
      success: true,
      message: 'Pharos Name Service automation completed successfully',
      logs: logger.getLogs()
    })

  } catch (error) {
    console.error('Error in pns API:', error)
    
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
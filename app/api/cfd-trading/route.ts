import { NextRequest, NextResponse } from 'next/server'
import { OpenPosition } from '@/scripts/pharosNetwork/cfdtrading'
import { setupProvider } from '@/scripts/utils/provider'
import { ownAddress } from '@/scripts/utils/wallet'
import { sleep } from '@/scripts/utils/time'
import { randomAmount } from '@/scripts/utils/amount'
import { loggerManager } from '@/scripts/utils/realtime-logger'

export async function POST(request: NextRequest) {
  let taskId: string | undefined
  
  try {
    const { 
      privateKey,
      rpcUrl = 'http://rpc.pharosnetwork.com', 
      loopCount = 1, 
      timeoutMinMs = 10000, 
      timeoutMaxMs = 20000,
      proxyUrl = "",
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
    process.env.PROXY_URL = proxyUrl

    // Setup provider and wallet
    const provider = setupProvider({
      rpcUrl: rpcUrl
    })

    const wallet = ownAddress({
      dirname: process.cwd(),
      provider,
      key: "PRIVATE_KEY"
    })

    logger.addLog('Starting CFD Trading automation...')

    // const baseDir = process.cwd()

    for (let index = 1; index <= loopCount; index++) {
      logger.addLog(`Task cfd trading brokex ${index}/${loopCount}`)
      try {
        await OpenPosition({
          // baseDir,
          signer: wallet.signer,
          provider,
          logger
        })
        logger.addSuccess('CFD position opened successfully')
      } catch (error) {
        logger.addError(`Error opening CFD position: ${error}`)
      }
      
      const ms = randomAmount({
        min: timeoutMinMs,
        max: timeoutMaxMs
      })
      logger.addLog(`Sleeping for ${ms}ms...`)
      await sleep(ms)
    }

    logger.addSuccess('CFD Trading automation completed')

    return NextResponse.json({
      success: true,
      message: 'CFD Trading automation completed successfully',
      logs: logger.getLogs()
    })

  } catch (error) {
    console.error('Error in CFD Trading API:', error)
    
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
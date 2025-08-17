import { NextRequest, NextResponse } from 'next/server'
import { loggerManager } from '@/scripts/utils/realtime-logger'
import { setupProvider } from '@/scripts/utils/provider'
import { ownAddress } from '@/scripts/utils/wallet'
import { depositViaAdvisor } from '@/scripts/pharosNetwork/autostaking/depositViaAdvisor'
import { sleep } from '@/scripts/utils/time'
import { randomAmount } from '@/scripts/utils/amount'

export async function POST(request: NextRequest) {
  let taskId: string | undefined
  
  try {
    const {  
      privateKey,
      rpcUrl = 'http://rpc.pharosnetwork.com',
      autostakingToken = '',
      loopCount = 1, 
      timeoutMinMs = 10000, 
      timeoutMaxMs = 20000,
      taskId: requestTaskId
    } = await request.json()

    taskId = requestTaskId

    if (!privateKey) {
      return NextResponse.json(
        { error: 'Private key is required' },
        { status: 400 }
      )
    }

    if (!autostakingToken) {
      return NextResponse.json(
        { error: 'Autostaking token is required' },
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
    process.env.AUTOSTAKING_TOKEN = autostakingToken

    // Setup provider and wallet
    const provider = setupProvider({
      rpcUrl: rpcUrl
    })

    const wallet = ownAddress({
      dirname: process.cwd(),
      provider,
      key: "PRIVATE_KEY"
    })

    logger.addLog('Starting Autostaking Deposit automation...')
    logger.addLog(`Wallet Address: ${wallet.address}`)
    logger.addLog(`Network: ${rpcUrl}`)
    logger.addLog(`Autostaking Token: ${autostakingToken ? 'Set' : 'Not set'}`)
    logger.addLog(`Token Length: ${autostakingToken.length} characters`)
    logger.addLog(`Loop Count: ${loopCount}`)
    logger.addLog(`Note: Each request includes 10 second delay + random delay to avoid rate limiting`)

    const baseDir = process.cwd()

    for (let index = 1; index <= loopCount; index++) {
      logger.addLog(`Task autostaking deposit AI recommendation ${index}/${loopCount}`)
      try {
        const response = await depositViaAdvisor({
          baseDir,
          wallet: wallet.signer,
          provider,
          logger
        })
        
        if (response === false) {
          logger.addError('Deposit via advisor failed - check authentication, balance, or rate limits')
        } else {
          logger.addSuccess('Autostaking deposit completed successfully')
        }
      } catch (error) {
        logger.addError(`Error in autostaking deposit: ${error}`)
      }
      
      if (index < loopCount) {
        // Use longer delays to avoid rate limiting
        const ms = randomAmount({
          min: Math.max(timeoutMinMs, 15000), // Minimum 15 seconds
          max: Math.max(timeoutMaxMs, 30000)  // Minimum 30 seconds
        })
        logger.addLog(`Sleeping for ${ms}ms to avoid rate limiting...`)
        await sleep(ms)
      }
    }

    logger.addSuccess('Autostaking Deposit automation completed')

    return NextResponse.json({
      success: true,
      message: 'Autostaking Deposit automation completed successfully',
      logs: logger.getLogs()
    })

  } catch (error) {
    console.error('Error in autostaking-deposit API:', error)
    
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
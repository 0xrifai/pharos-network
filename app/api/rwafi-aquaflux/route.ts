import { NextRequest, NextResponse } from 'next/server'
import { loggerManager } from '@/scripts/utils/realtime-logger'
import { mint } from '@/scripts/pharosNetwork/rwafiAquaflux'
import { setupProvider } from '@/scripts/utils/provider'
import { ownAddress } from '@/scripts/utils/wallet'
import { selectors } from '@/scripts/pharosNetwork/rwafiAquaflux/data'
import { sleep } from '@/scripts/utils/time'
import { randomAmount } from '@/scripts/utils/amount'

export async function POST(request: NextRequest) {
  let taskId: string | undefined
  
  try {
    const {  rpcUrl, loopCount = 1, timeoutMinMs = 1000, timeoutMaxMs = 3000, amountInPercent = 100, taskId: requestTaskId } = await request.json()

    taskId = requestTaskId

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

    // Setup provider and wallet
    const provider = setupProvider({
      rpcUrl: rpcUrl || 'https://rpc.pharosnetwork.com'
    })

    const wallet = ownAddress({
      dirname: process.cwd(),
      provider,
      key: "PRIVATE_KEY"
    })

    logger.addLog('Starting Rwafi Aquaflux automation...')
    logger.addLog(`Wallet Address: ${wallet.address}`)
    logger.addLog(`Network: ${rpcUrl || 'https://rpc.pharosnetwork.com'}`)
    logger.addLog(`Total Selectors: ${selectors.length}`)
    logger.addLog(`Amount In Percent: ${amountInPercent}%`)

    for (let index = 1; index <= loopCount; index++) {
      logger.addLog(`Task rwafi aquaflux ${index}/${loopCount}`)
      
      for (let selectorIndex = 0; selectorIndex < selectors.length; selectorIndex++) {
        const selector = selectors[selectorIndex]
        logger.addLog(`Processing selector ${selectorIndex + 1}/${selectors.length}`)
        logger.addLog(`Selector Details: ${JSON.stringify(selector)}`)
        
        try {
          logger.addLog('Minting NFT...')
                  await mint({
          signer: wallet.signer,
          baseDir: process.cwd(),
          selector,
          logger
        })
          
          logger.addSuccess(`Successfully processed selector ${selectorIndex + 1}`)
          
          const sleepTime = randomAmount({
            min: timeoutMinMs,
            max: timeoutMaxMs
          })
          
          logger.addLog(`Sleeping for ${sleepTime}ms...`)
          await sleep(sleepTime)
          
        } catch (error) {
          logger.addError(`Error processing selector ${selectorIndex + 1}: ${error}`)
        }
      }
    }

    logger.addSuccess("Rwafi Aquaflux automation completed")

    return NextResponse.json({
      success: true,
      message: 'Rwafi Aquaflux automation completed successfully',
      logs: logger.getLogs()
    })

  } catch (error) {
    console.error('Error in rwafi-aquaflux API:', error)
    
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
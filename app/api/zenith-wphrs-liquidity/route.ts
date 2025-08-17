import { NextRequest, NextResponse } from 'next/server'
import { loggerManager } from '@/scripts/utils/realtime-logger'
import { setupProvider } from '@/scripts/utils/provider'
import { ownAddress } from '@/scripts/utils/wallet'
import { pharosPoolAddressZenith } from '@/scripts/lib/data'
import { pharosTokenAddress } from '@/scripts/lib/data'
import { liquidity } from '@/scripts/pharosNetwork/zenithFinance/liquidity'
import { sleep } from '@/scripts/utils/time'
import { randomAmount } from '@/scripts/utils/amount'

const router = "0xf8a1d4ff0f9b9af7ce58e1fc1833688f3bfd6115"

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

    logger.addLog('Starting Zenith WPHRS Liquidity automation...')
    logger.addLog(`Wallet Address: ${wallet.address}`)
    logger.addLog(`Network: ${rpcUrl || 'https://rpc.pharosnetwork.com'}`)
    logger.addLog(`Router Address: ${router}`)

    for (let index = 1; index <= loopCount; index++) {
      logger.addLog(`Task lp wphrs ${index}/${loopCount}`)
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10
      const poolAddressUsdtWphrs = pharosPoolAddressZenith.filter(pool => pool.pair == "USDT/PHRS")[0].address
      const wphrsAddress = pharosTokenAddress.filter(item => item.name == "WPHRS")[0].address
      const usdtAddress = pharosTokenAddress.filter(item => item.name == "USDT")[0].address

      logger.addLog(`Pool Address: ${poolAddressUsdtWphrs}`)
      logger.addLog(`WPHRS Token: ${wphrsAddress}`)
      logger.addLog(`USDT Token: ${usdtAddress}`)
      logger.addLog(`Amount In Percent: ${amountInPercent}%`)
      logger.addLog(`Deadline: ${deadline}`)

      logger.addLog('Adding WPHRS/USDT liquidity...')
      await liquidity({
        signer: wallet.signer,
        poolAddress: poolAddressUsdtWphrs,
        tokenA: wphrsAddress,
        tokenB: usdtAddress,
        provider,
        amountInPercent: amountInPercent,
        router,
        deadline,
        logger
      })
      logger.addSuccess('WPHRS/USDT liquidity added successfully')

      const ms = randomAmount({
        min: timeoutMinMs,
        max: timeoutMaxMs
      })
      logger.addLog(`Sleeping for ${ms}ms...`)
      await sleep(ms)
    }

    logger.addSuccess("Zenith WPHRS Liquidity automation completed")

    return NextResponse.json({
      success: true,
      message: 'Zenith WPHRS Liquidity automation completed successfully',
      logs: logger.getLogs()
    })

  } catch (error) {
    console.error('Error in zenith-wphrs-liquidity API:', error)
    
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
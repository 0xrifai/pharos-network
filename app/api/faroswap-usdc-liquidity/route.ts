import { NextRequest, NextResponse } from 'next/server'
import { loggerManager } from '@/scripts/utils/realtime-logger'
import { setupProvider } from '@/scripts/utils/provider'
import { ownAddress } from '@/scripts/utils/wallet'
import { pharosTokenAddress } from '@/scripts/lib/data'
import { createLiquidity } from '@/scripts/pharosNetwork/faroswap/liquidity'
import { pharosPoolAddressPMMFaroswap } from '@/scripts/lib/data'
import { sleep } from '@/scripts/utils/time'
import { randomAmount } from '@/scripts/utils/amount'

export async function POST(request: NextRequest) {
  let taskId: string | undefined
  
  try {
    const { rpcUrl, loopCount = 1, timeoutMinMs = 1000, timeoutMaxMs = 3000, amountInPercent = 100, taskId: requestTaskId } = await request.json()

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

    logger.addLog('Starting Faroswap USDC Liquidity automation...')
    logger.addLog(`Wallet Address: ${wallet.address}`)
    logger.addLog(`Network: ${rpcUrl || 'https://rpc.pharosnetwork.com'}`)

    for (let index = 1; index <= loopCount; index++) {
      logger.addLog(`Task lp usdc ${index}/${loopCount}`)
      const usdcAddress = pharosTokenAddress.filter(item => item.name == "USDC")[0].address
      const wphrsAddress = pharosTokenAddress.filter(item => item.name == "WPHRS_FAROSWAP")[0].address
      let poolAddresses = pharosPoolAddressPMMFaroswap.filter(item => item.pair == "USDC/WPHRS")[0]

      logger.addLog(`USDC Token: ${usdcAddress}`)
      logger.addLog(`WPHRS Token: ${wphrsAddress}`)
      logger.addLog(`Amount In Percent: ${amountInPercent}%`)

      for (let poolAddress of poolAddresses.address) {
        let deadline = Math.floor(Date.now() / 1000) + 60 * 10
        logger.addLog(`Creating liquidity for pool: ${poolAddress}`)
        logger.addLog(`Deadline: ${deadline}`)
        
        await createLiquidity({
          poolAddress: poolAddress,
          tokenIn: usdcAddress,
          tokenOut: wphrsAddress,
          deadline,
          signer: wallet.signer,
          amountIn_inPercent: amountInPercent,
          provider,
          logger
        })
        logger.addSuccess(`Liquidity created successfully for pool: ${poolAddress}`)
        
        let ms = randomAmount({
          min: timeoutMinMs,
          max: timeoutMaxMs
        })
        logger.addLog(`Sleeping for ${ms}ms...`)
        await sleep(ms)
      }

      const usdtAddress = pharosTokenAddress.filter(item => item.name == "USDT")[0].address
      poolAddresses = pharosPoolAddressPMMFaroswap.filter(item => item.pair == "USDT/USDC")[0]
      
      logger.addLog(`USDT Token: ${usdtAddress}`)
      
      for (let poolAddress of poolAddresses.address) {
        let deadline = Math.floor(Date.now() / 1000) + 60 * 10
        logger.addLog(`Creating liquidity for pool: ${poolAddress}`)
        logger.addLog(`Deadline: ${deadline}`)
        
        await createLiquidity({
          poolAddress: poolAddress,
          tokenIn: usdcAddress,
          tokenOut: usdtAddress,
          deadline,
          signer: wallet.signer,
          amountIn_inPercent: amountInPercent,
          provider,
          logger
        })
        logger.addSuccess(`Liquidity created successfully for pool: ${poolAddress}`)
        
        let ms = randomAmount({
          min: timeoutMinMs,
          max: timeoutMaxMs
        })
        logger.addLog(`Sleeping for ${ms}ms...`)
        await sleep(ms)
      }
    }

    logger.addSuccess('Faroswap USDC Liquidity automation completed')

    return NextResponse.json({
      success: true,
      message: 'Faroswap USDC Liquidity automation completed successfully',
      logs: logger.getLogs()
    })

  } catch (error) {
    console.error('Error in Faroswap USDC Liquidity API:', error)
    
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
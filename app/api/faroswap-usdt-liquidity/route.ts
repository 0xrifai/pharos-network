import { NextRequest, NextResponse } from 'next/server'
import { loggerManager } from '@/scripts/utils/realtime-logger'
import { setupProvider } from '@/scripts/utils/provider'
import { pharosTokenAddress } from '@/scripts/lib/data'
import { createLiquidity } from '@/scripts/pharosNetwork/faroswap/liquidity'
import { pharosPoolAddressPMMFaroswap } from '@/scripts/lib/data'
import { sleep } from '@/scripts/utils/time'
import { randomAmount } from '@/scripts/utils/amount'

export async function POST(request: NextRequest) {
  let taskId: string | undefined
  
  try {
    const { privateKey, rpcUrl, loopCount = 1, timeoutMinMs = 10000, timeoutMaxMs = 20000, amountInPercent = 100, slippage = 0.15, taskId: requestTaskId } = await request.json()

    taskId = requestTaskId

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    if (!privateKey) {
      return NextResponse.json(
        { error: 'Private key is required' },
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

    // Create wallet directly from private key instead of using ownAddress function
    const { Wallet } = await import('ethers')
    const wallet = new Wallet(privateKey, provider)

    logger.addLog('Starting Faroswap USDT Liquidity automation...')
    logger.addLog(`Wallet Address: ${wallet.address}`)
    logger.addLog(`Network: ${rpcUrl || 'https://rpc.pharosnetwork.com'}`)
    logger.addLog(`Slippage: ${slippage}%`)

    for (let index = 1; index <= loopCount; index++) {
      logger.addLog(`Task lp usdt ${index}/${loopCount}`)
      const usdtAddress = pharosTokenAddress.filter(item => item.name == "USDT")[0].address
      const wphrsAddress = pharosTokenAddress.filter(item => item.name == "WPHRS_FAROSWAP")[0].address
      const poolAddresses = pharosPoolAddressPMMFaroswap.filter(item => item.pair == "USDT/WPHRS")[0]

      logger.addLog(`USDT Token: ${usdtAddress}`)
      logger.addLog(`WPHRS Token: ${wphrsAddress}`)
      logger.addLog(`Amount In Percent: ${amountInPercent}%`)

      for (let poolAddress of poolAddresses.address) {
        let deadline = Math.floor(Date.now() / 1000) + 60 * 10
        logger.addLog(`Creating liquidity for pool: ${poolAddress}`)
        logger.addLog(`Deadline: ${deadline}`)
        
        try {
          await createLiquidity({
            poolAddress: poolAddress,
            tokenIn: usdtAddress,
            tokenOut: wphrsAddress,
            deadline,
            signer: wallet,
            amountIn_inPercent: amountInPercent,
            provider,
            logger,
            slippage: slippage / 100 // Convert percentage to decimal
          })
          logger.addSuccess(`Liquidity created successfully for pool: ${poolAddress}`)
        } catch (error) {
          logger.addLog(`Error creating liquidity for pool ${poolAddress}: ${error}`)
          // Continue with next pool instead of stopping entire process
          continue
        }
        
        let ms = randomAmount({
          min: timeoutMinMs,
          max: timeoutMaxMs
        })
        logger.addLog(`Sleeping for ${ms}ms...`)
        await sleep(ms)
      }
    }

    logger.addSuccess("Faroswap USDT Liquidity automation completed")

    return NextResponse.json({
      success: true,
      message: 'Faroswap USDT Liquidity automation completed successfully',
      taskId: taskId
    })

  } catch (error) {
    console.error('Error in faroswap-usdt-liquidity:', error)
    
    if (taskId) {
      const logger = loggerManager.getLogger(taskId)
      if (logger) {
        logger.addLog(`Error: ${error}`)
      }
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        taskId: taskId 
      },
      { status: 500 }
    )
  }
} 
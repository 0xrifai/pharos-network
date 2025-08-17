import { NextRequest, NextResponse } from 'next/server'
import { loggerManager } from '@/scripts/utils/realtime-logger'
import { setupProvider } from '@/scripts/utils/provider'
import { pharosTokenAddress } from '@/scripts/lib/data'
import { swap } from '@/scripts/pharosNetwork/faroswap/swap'
import { sleep } from '@/scripts/utils/time'
import { randomAmount } from '@/scripts/utils/amount'

export async function POST(request: NextRequest) {
  let taskId: string | undefined
  
  try {
    const { privateKey, rpcUrl, loopCount = 1, timeoutMinMs = 10000, timeoutMaxMs = 20000, amountInPercent = 1,
    slippage = 0.5, taskId: requestTaskId } = await request.json()

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

    logger.addLog('Starting Faroswap WPHRS Swap automation...')
    logger.addLog(`Wallet Address: ${wallet.address}`)
    logger.addLog(`Network: ${rpcUrl || 'https://rpc.pharosnetwork.com'}`)

    for (let index = 1; index <= loopCount; index++) {
      logger.addLog(`Task swap wphrs ${index}/${loopCount}`)
      const usdcAddress = pharosTokenAddress.filter(item => item.name == "USDC")[0].address
      const usdtAddress = pharosTokenAddress.filter(item => item.name == "USDT")[0].address
      const wphrsAddress = pharosTokenAddress.filter(item => item.name == "WPHRS_FAROSWAP")[0].address
      
      logger.addLog(`USDC Token: ${usdcAddress}`)
      logger.addLog(`USDT Token: ${usdtAddress}`)
      logger.addLog(`WPHRS Token: ${wphrsAddress}`)
      logger.addLog(`Amount In Percent: ${amountInPercent}%`)
      logger.addLog(`Slippage: ${slippage}%`)
      
      let deadline = Math.floor(Date.now() / 1000) + 60 * 10
      const slippageUrl = slippage.toString()
      
      logger.addLog('Swapping WPHRS to USDC...')
      logger.addLog(`Deadline: ${deadline}`)
      logger.addLog(`Slippage: ${slippageUrl}%`)
      
      await swap({
        tokenIn: wphrsAddress,
        tokenOut: usdcAddress,
        deadline,
        signer: wallet,
        amountIn_inPercent: amountInPercent,
        provider,
        slippageUrl,
        logger
      })
      logger.addSuccess("WPHRS to USDC swap completed")

      let ms = randomAmount({
        min: timeoutMinMs,
        max: timeoutMaxMs
      })
      logger.addLog(`Sleeping for ${ms}ms...`)
      await sleep(ms)

      deadline = Math.floor(Date.now() / 1000) + 60 * 20
      logger.addLog('Swapping WPHRS to USDT...')
      logger.addLog(`Deadline: ${deadline}`)
      logger.addLog(`Slippage: ${slippageUrl}%`)
      
      await swap({
        tokenIn: wphrsAddress,
        tokenOut: usdtAddress,
        deadline,
        signer: wallet,
        amountIn_inPercent: amountInPercent,
        provider,
        slippageUrl,
        logger
      })
      logger.addSuccess("WPHRS to USDT swap completed")
    }

    logger.addSuccess("Faroswap WPHRS Swap automation completed")

    return NextResponse.json({
      success: true,
      message: "Faroswap WPHRS Swap automation completed successfully",
      taskId: taskId
    })

  } catch (error) {
    console.error('Error in faroswap-wphrs-swap:', error)
    
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
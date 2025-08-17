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
    const { privateKey, rpcUrl, loopCount = 1, timeoutMinMs = 10000, timeoutMaxMs = 20000, amountInPercent = 1, slippage = 0.15, taskId: requestTaskId } = await request.json()

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

    logger.addLog('Starting Zenith USDC Liquidity automation...')
    logger.addLog(`Wallet Address: ${wallet.address}`)
    logger.addLog(`Network: ${rpcUrl || 'https://rpc.pharosnetwork.com'}`)
    logger.addLog(`Router Address: ${router}`)
    logger.addLog(`Slippage: ${slippage}%`)

    for (let index = 1; index <= loopCount; index++) {
      logger.addLog(`Task lp usdc ${index}/${loopCount}`)
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10
      const poolAddressUsdcUsdt = pharosPoolAddressZenith.filter(pool => pool.pair == "USDC/USDT")[0].address
      const usdcAddress = pharosTokenAddress.filter(item => item.name == "USDC")[0].address
      const usdtAddress = pharosTokenAddress.filter(item => item.name == "USDT")[0].address

      logger.addLog(`Pool Address (USDC/USDT): ${poolAddressUsdcUsdt}`)
      logger.addLog(`USDC Token: ${usdcAddress}`)
      logger.addLog(`USDT Token: ${usdtAddress}`)
      logger.addLog(`Amount In Percent: ${amountInPercent}%`)
      logger.addLog(`Deadline: ${deadline}`)

      logger.addLog('Adding USDC/USDT liquidity...')
      await liquidity({
        signer: wallet,
        poolAddress: poolAddressUsdcUsdt,
        tokenA: usdcAddress,
        tokenB: usdtAddress,
        provider,
        amountInPercent: amountInPercent,
        router,
        deadline,
        logger
      })
      logger.addSuccess('USDC/USDT liquidity added successfully')

      const ms = randomAmount({
        min: timeoutMinMs,
        max: timeoutMaxMs
      })
      logger.addLog(`Sleeping for ${ms}ms...`)
      await sleep(ms)
      
      const poolAddressUsdcWphrs = pharosPoolAddressZenith.filter(pool => pool.pair == "USDC/PHRS")[0].address
      const wphrsAddress = pharosTokenAddress.filter(item => item.name == "WPHRS")[0].address

      logger.addLog(`Pool Address (USDC/WPHRS): ${poolAddressUsdcWphrs}`)
      logger.addLog(`WPHRS Token: ${wphrsAddress}`)

      logger.addLog('Adding USDC/WPHRS liquidity...')
      await liquidity({
        signer: wallet,
        poolAddress: poolAddressUsdcWphrs,
        tokenA: usdcAddress,
        tokenB: wphrsAddress,
        provider,
        amountInPercent: amountInPercent,
        router,
        deadline,
        logger
      })
      logger.addSuccess('USDC/WPHRS liquidity added successfully')
    }

    logger.addSuccess("Zenith USDC Liquidity automation completed")

    return NextResponse.json({
      success: true,
      message: 'Zenith USDC Liquidity automation completed successfully',
      logs: logger.getLogs()
    })

  } catch (error) {
    console.error('Error in zenith-usdc-liquidity API:', error)
    
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
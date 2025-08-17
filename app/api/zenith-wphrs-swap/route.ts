import { NextRequest, NextResponse } from 'next/server'
import { loggerManager } from '@/scripts/utils/realtime-logger'
import { setupProvider } from '@/scripts/utils/provider'
import { multicall } from '@/scripts/pharosNetwork/zenithFinance/swap'
import { pharosTokenAddress, pharosPoolAddressZenith } from '@/scripts/lib/data'
import { getPrice } from '@/scripts/utils/price'
import { sleep } from '@/scripts/utils/time'
import { tokenBalance } from '@/scripts/utils/balance'
import { randomAmount } from '@/scripts/utils/amount'

const router = "0x1a4de519154ae51200b0ad7c90f7fac75547888a"

export async function POST(request: NextRequest) {
  let taskId: string | undefined
  
  try {
    const { privateKey, rpcUrl, loopCount = 1, timeoutMinMs = 10000, timeoutMaxMs = 20000, amountInPercent = 1, slippage = 0.3, taskId: requestTaskId } = await request.json()

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

    logger.addLog(`Starting Zenith WPHRS Swap automation...`)
    logger.addLog(`Wallet Address: ${wallet.address}`)
    logger.addLog(`Network: ${rpcUrl || 'https://rpc.pharosnetwork.com'}`)
    logger.addLog(`Slippage: ${slippage}%`)

    for (let index = 1; index <= loopCount; index++) {
      logger.addLog(`Task swap wphrs ${index}/${loopCount}`)
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10
      const poolAddressWphrsUsdc = pharosPoolAddressZenith.filter(pool => pool.pair == "USDC/PHRS")[0].address
      const usdcAddress = pharosTokenAddress.filter(item => item.name == "USDC")[0].address
      const wphrsAddress = pharosTokenAddress.filter(item => item.name == "WPHRS")[0].address

      logger.addLog(`Getting price for WPHRS/USDC pool: ${poolAddressWphrsUsdc}`)
      const priceWphrsUsdc = await getPrice({
        poolAddress: poolAddressWphrsUsdc,
        addresses: {
          tokenA: wphrsAddress,
          tokenB: usdcAddress
        },
        provider
      })
      logger.addLog(`WPHRS/USDC Price: ${priceWphrsUsdc.tokenAToTokenB}`)

      let { balance: wphrsBalance, symbol: wphrsSymbol, decimals: wphrsDecimals } = await tokenBalance({
        address: wallet.address,
        provider,
        tokenAddress: wphrsAddress
      })

      const { symbol: usdcSymbol, decimals: usdcDecimals } = await tokenBalance({
        address: wallet.address,
        provider,
        tokenAddress: usdcAddress
      })

      logger.addLog(`WPHRS Balance: ${wphrsBalance} ${wphrsSymbol}`)
      logger.addLog(`USDC Balance: ${usdcSymbol}`)

      const slippageTolerance = slippage / 100 // Convert percentage to decimal
      let priceScaled = BigInt(Math.floor(priceWphrsUsdc.tokenAToTokenB * Math.pow(10, Number(usdcDecimals))))
      let amountIn = wphrsBalance * BigInt(amountInPercent) / BigInt(100)
      let amountOut = (amountIn * priceScaled * BigInt(1000 - Math.floor(slippageTolerance * 1000))) / (BigInt(Math.pow(10, Number(wphrsDecimals))) * BigInt(1000))

      logger.addLog(`SWAP ${wphrsSymbol}/${usdcSymbol}`)
      logger.addLog(`Amount In: ${amountIn} ${wphrsSymbol}`)
      logger.addLog(`Expected Amount Out: ${amountOut} ${usdcSymbol}`)
      logger.addLog(`Slippage: ${slippageTolerance * 100}%`)
      logger.addLog(`Deadline: ${deadline}`)
      
      try {
        logger.addLog("Swapping WPHRS to USDC...")
        await multicall({
          router,
          signer: wallet,
          tokenIn: wphrsAddress,
          tokenOut: usdcAddress,
          amountIn,
          amountOut,
          fee: priceWphrsUsdc.fee,
          deadline,
          logger
        })
        logger.addSuccess("WPHRS to USDC swap completed")
      } catch (error) {
        logger.addLog(`Error in WPHRS to USDC swap: ${error}`)
      }

      let ms = randomAmount({
        min: timeoutMinMs,
        max: timeoutMaxMs
      })
      logger.addLog(`Sleeping for ${ms}ms...`)
      await sleep(ms)

      // Second swap: WPHRS to USDT (matching original logic)
      const poolAddressWphrsUsdt = pharosPoolAddressZenith.filter(pool => pool.pair == "USDT/PHRS")[0].address
      const usdtAddress = pharosTokenAddress.filter(item => item.name == "USDT")[0].address

      logger.addLog(`Getting price for WPHRS/USDT pool: ${poolAddressWphrsUsdt}`)
      const priceWphrsUsdt = await getPrice({
        poolAddress: poolAddressWphrsUsdt,
        addresses: {
          tokenA: wphrsAddress,
          tokenB: usdtAddress
        },
        provider
      })
      logger.addLog(`WPHRS/USDT Price: ${priceWphrsUsdt.tokenAToTokenB}`)

      // Get updated WPHRS balance after first swap
      const updatedBalance = await tokenBalance({
        address: wallet.address,
        provider,
        tokenAddress: wphrsAddress
      })
      wphrsBalance = updatedBalance.balance

      const { symbol: usdtSymbol, decimals: usdtDecimals } = await tokenBalance({
        address: wallet.address,
        provider,
        tokenAddress: usdtAddress
      })

      logger.addLog(`Updated WPHRS Balance: ${wphrsBalance} ${wphrsSymbol}`)
      logger.addLog(`USDT Balance: ${usdtSymbol}`)

      priceScaled = BigInt(Math.floor(priceWphrsUsdt.tokenAToTokenB * Math.pow(10, Number(usdtDecimals))))
      amountIn = wphrsBalance * BigInt(amountInPercent) / BigInt(100)
      amountOut = (amountIn * priceScaled * BigInt(1000 - Math.floor(slippageTolerance * 1000))) / (BigInt(Math.pow(10, Number(wphrsDecimals))) * BigInt(1000))

      logger.addLog(`SWAP ${wphrsSymbol}/${usdtSymbol}`)
      logger.addLog(`Amount In: ${amountIn} ${wphrsSymbol}`)
      logger.addLog(`Expected Amount Out: ${amountOut} ${usdtSymbol}`)
      logger.addLog(`Slippage: ${slippageTolerance * 100}%`)
      logger.addLog(`Deadline: ${deadline}`)

      try {
        logger.addLog("Swapping WPHRS to USDT...")
        await multicall({
          router,
          signer: wallet,
          tokenIn: wphrsAddress,
          tokenOut: usdtAddress,
          amountIn,
          amountOut,
          fee: priceWphrsUsdt.fee,
          deadline,
          logger
        })
        logger.addSuccess("WPHRS to USDT swap completed")
      } catch (error) {
        logger.addLog(`Error in WPHRS to USDT swap: ${error}`)
      }
    }

    logger.addSuccess("Zenith WPHRS Swap automation completed")

    return NextResponse.json({
      success: true,
      message: 'Zenith WPHRS Swap automation completed successfully',
      taskId: taskId
    })

  } catch (error) {
    console.error('Error in zenith-wphrs-swap:', error)
    
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
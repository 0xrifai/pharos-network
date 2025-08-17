import { NextRequest, NextResponse } from 'next/server'
import { loggerManager } from '@/scripts/utils/realtime-logger'
import { setupProvider } from '@/scripts/utils/provider'
import { ownAddress } from '@/scripts/utils/wallet'
import { multicall } from '@/scripts/pharosNetwork/zenithFinance/swap'
import { pharosTokenAddress, pharosPoolAddressZenith } from '@/scripts/lib/data'
import { getPrice } from '@/scripts/utils/price'
import { sleep } from '@/scripts/utils/time'
import { tokenBalance } from '@/scripts/utils/balance'
import { randomAmount } from '@/scripts/utils/amount'
import { formatUnits } from 'ethers'

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

    const provider = setupProvider({
      rpcUrl: rpcUrl || 'https://rpc.pharosnetwork.com'
    })

    // Create wallet directly from private key instead of using ownAddress function
    const { Wallet } = await import('ethers')
    const wallet = new Wallet(privateKey, provider)

    logger.addLog('Starting Zenith USDC Swap automation...')
    logger.addLog(`Wallet Address: ${wallet.address}`)
    logger.addLog(`Network: ${rpcUrl || 'https://rpc.pharosnetwork.com'}`)
    logger.addLog(`Slippage: ${slippage}%`)

    for (let index = 1; index <= loopCount; index++) {
      logger.addLog(`Task swap usdc ${index}/${loopCount}`)
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10
      const poolAddressUsdcUsdt = pharosPoolAddressZenith.filter(pool => pool.pair == "USDC/USDT")[0].address
      const usdcAddress = pharosTokenAddress.filter(item => item.name == "USDC")[0].address
      const usdtAddress = pharosTokenAddress.filter(item => item.name == "USDT")[0].address

      // logger.addLog(`Getting price for USDC/USDT pool: ${poolAddressUsdcUsdt}`)
      // const priceUsdcToUsdt = await getPrice({
      //   tokenAddress: usdcAddress,
      //   provider,
      //   logger
      // })
      // logger.addLog(`USDC/USDT Price: ${priceUsdcToUsdt || 'N/A'}`)
      
      // logger.addLog(`Getting price for USDC/WPHRS pool: ${poolAddressUsdcWphrs}`)
      // const priceUsdcToWphrs = await getPrice({
      //   tokenAddress: usdcAddress,
      //   provider,
      //   logger
      // })
      // logger.addLog(`USDC/WPHRS Price: ${priceUsdcToWphrs || 'N/A'}`)

      let { balance: usdcBalance, symbol: usdcSymbol, decimals: usdcDecimals } = await tokenBalance({
        address: wallet.address,
        provider,
        tokenAddress: usdcAddress
      })

      const { symbol: usdtSymbol, decimals: usdtDecimals } = await tokenBalance({
        address: wallet.address,
        provider,
        tokenAddress: usdtAddress
      })

      logger.addLog(`USDC Balance: ${formatUnits(usdcBalance, usdcDecimals)} ${usdcSymbol}`)
      logger.addLog(`USDT Balance: ${usdtSymbol}`)

      const slippageTolerance = slippage / 100
      // let priceScaled = BigInt(Math.floor(priceUsdcToUsdt.tokenAToTokenB * Math.pow(10, Number(usdtDecimals))))
      let amountIn = usdcBalance * BigInt(amountInPercent) / BigInt(100)
      // let amountOut = (amountIn * priceScaled * BigInt(1000 - Math.floor(slippageTolerance * 1000))) / (BigInt(Math.pow(10, Number(usdcDecimals))) * BigInt(1000))
      
      logger.addLog(`SWAP ${usdcSymbol}/${usdtSymbol}`)
      logger.addLog(`Amount In: ${formatUnits(amountIn, usdcDecimals)} ${usdcSymbol}`)
      // logger.addLog(`Expected Amount Out: ${amountOut} ${usdtSymbol}`)
      logger.addLog(`Slippage: ${slippageTolerance * 100}%`)
      logger.addLog(`Deadline: ${deadline}`)
      
      try {
        logger.addLog("Swapping USDC to USDT...")
        await multicall({
          router,
          tokenIn: usdcAddress,
          tokenOut: usdtAddress,
          amountIn,
          amountOut: BigInt(0), // No fixed amountOut for this swap
          fee: 0, // No fixed fee for this swap
          signer: wallet,
          deadline,
          logger
        })
        logger.addSuccess("USDC to USDT swap completed")
      } catch (error) {
        logger.addError(`Swap failed: ${error}`)
      }

      const ms = randomAmount({
        min: timeoutMinMs,
        max: timeoutMaxMs
      })
      logger.addLog(`Sleeping for ${ms}ms...`)
      await sleep(ms)

      const wphrsAddress = pharosTokenAddress.filter(item => item.name === "WPHRS")[0].address as string

      ({ balance: usdcBalance } = await tokenBalance({
        address: wallet.address,
        provider,
        tokenAddress: usdcAddress
      }))
      let { symbol: wphrsSymbol, decimals: wphrsDecimals } = await tokenBalance({
        address: wallet.address,
        provider,
        tokenAddress: wphrsAddress
      })
      // let priceScaled = BigInt(Math.floor(priceUsdcToWphrs.tokenAToTokenB * Math.pow(10, Number(wphrsDecimals))))
      amountIn = usdcBalance * BigInt(amountInPercent) / BigInt(100)
      // amountOut = (amountIn * priceScaled * BigInt(1000 - Math.floor(slippageTolerance * 1000))) / (BigInt(Math.pow(10, Number(usdcDecimals))) * BigInt(1000))
      
      logger.addLog(`SWAP ${usdcSymbol}/${wphrsSymbol}`)
      logger.addLog(`Amount In: ${formatUnits(amountIn, usdcDecimals)} ${usdcSymbol}`)
      // logger.addLog(`Expected Amount Out: ${amountOut} ${wphrsSymbol}`)
      logger.addLog(`Slippage: ${slippageTolerance * 100}%`)
      logger.addLog(`Deadline: ${deadline}`)
      
      try {
        logger.addLog("Swapping USDC to WPHRS...")
        await multicall({
          router,
          tokenIn: usdcAddress,
          tokenOut: wphrsAddress,
          amountIn,
          amountOut: BigInt(0), // No fixed amountOut for this swap
          fee: 0, // No fixed fee for this swap
          signer: wallet,
          deadline,
          logger
        })
        logger.addSuccess("USDC to WPHRS swap completed")
      } catch (error) {
        logger.addError(`Swap failed: ${error}`)
      }
    }

    logger.addSuccess("Zenith USDC Swap automation completed")

    return NextResponse.json({
      success: true,
      message: 'Zenith USDC Swap automation completed successfully',
      logs: logger.getLogs()
    })

  } catch (error) {
    console.error('Error in zenith-usdc-swap API:', error)
    
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
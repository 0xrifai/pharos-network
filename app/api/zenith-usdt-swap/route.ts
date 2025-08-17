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

const router = "0x1a4de519154ae51200b0ad7c90f7fac75547888a"

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

    logger.addLog('Starting Zenith USDT Swap automation...')
    logger.addLog(`Wallet Address: ${wallet.address}`)
    logger.addLog(`Network: ${rpcUrl || 'https://rpc.pharosnetwork.com'}`)

    for (let index = 1; index <= loopCount; index++) {
      logger.addLog(`Task swap usdt ${index}/${loopCount}`)
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10
      const poolAddressUsdtUsdc = pharosPoolAddressZenith.filter(pool => pool.pair == "USDC/USDT")[0].address
      const usdcAddress = pharosTokenAddress.filter(item => item.name == "USDC")[0].address
      const usdtAddress = pharosTokenAddress.filter(item => item.name == "USDT")[0].address

      logger.addLog(`Getting price for USDT/USDC pool: ${poolAddressUsdtUsdc}`)
      const priceUsdtUsdc = await getPrice({
        poolAddress: poolAddressUsdtUsdc,
        addresses: {
          tokenA: usdtAddress,
          tokenB: usdcAddress
        },
        provider
      })
      logger.addLog(`USDT/USDC Price: ${priceUsdtUsdc.tokenAToTokenB}`)

      let { balance: usdtBalance, symbol: usdtSymbol, decimals: usdtDecimals } = await tokenBalance({
        address: wallet.address,
        provider,
        tokenAddress: usdtAddress
      })

      const { symbol: usdcSymbol, decimals: usdcDecimals } = await tokenBalance({
        address: wallet.address,
        provider,
        tokenAddress: usdcAddress
      })

      logger.addLog(`USDT Balance: ${usdtBalance} ${usdtSymbol}`)
      logger.addLog(`USDC Balance: ${usdcSymbol}`)

      const slippageTolerance = 0.003
      let priceScaled = BigInt(Math.floor(priceUsdtUsdc.tokenAToTokenB * Math.pow(10, Number(usdcDecimals))))
      let amountIn = usdtBalance * BigInt(amountInPercent) / BigInt(100)
      let amountOut = (amountIn * priceScaled * BigInt(1000 - Math.floor(slippageTolerance * 1000))) / (BigInt(Math.pow(10, Number(usdtDecimals))) * BigInt(1000))
      
      logger.addLog(`SWAP ${usdtSymbol}/${usdcSymbol}`)
      logger.addLog(`Amount In: ${amountIn} ${usdtSymbol}`)
      logger.addLog(`Expected Amount Out: ${amountOut} ${usdcSymbol}`)
      logger.addLog(`Slippage: ${slippageTolerance * 100}%`)
      logger.addLog(`Deadline: ${deadline}`)
      
      try {
        logger.addLog("Swapping USDT to USDC...")
        await multicall({
          router,
          tokenIn: usdtAddress,
          tokenOut: usdcAddress,
          amountIn,
          amountOut,
          fee: priceUsdtUsdc.fee,
          signer: wallet.signer,
          deadline,
          logger
        })
        logger.addSuccess("USDT to USDC swap completed")
      } catch (error) {
        logger.addError(`Swap failed: ${error}`)
      }

      const ms = randomAmount({
        min: timeoutMinMs,
        max: timeoutMaxMs
      })
      logger.addLog(`Sleeping for ${ms}ms...`)
      await sleep(ms)

      const poolAddressUsdtWphrs = pharosPoolAddressZenith.filter(pool => pool.pair == "USDT/PHRS")[0].address
      const wphrsAddress = pharosTokenAddress.filter(item => item.name == "WPHRS")[0].address

      logger.addLog(`Getting price for USDT/WPHRS pool: ${poolAddressUsdtWphrs}`)
      const priceUsdtWphrs = await getPrice({
        poolAddress: poolAddressUsdtWphrs,
        addresses: {
          tokenA: usdtAddress,
          tokenB: wphrsAddress
        },
        provider
      });

      ({ balance: usdtBalance } = await tokenBalance({
        address: wallet.address,
        provider,
        tokenAddress: usdtAddress
      }))
      let { symbol: wphrsSymbol, decimals: wphrsDecimals } = await tokenBalance({
        address: wallet.address,
        provider,
        tokenAddress: wphrsAddress
      })

      priceScaled = BigInt(Math.floor(priceUsdtWphrs.tokenAToTokenB * Math.pow(10, Number(wphrsDecimals))))
      amountIn = usdtBalance * BigInt(amountInPercent) / BigInt(100)
      amountOut = (amountIn * priceScaled * BigInt(1000 - Math.floor(slippageTolerance * 1000))) / (BigInt(Math.pow(10, Number(usdtDecimals))) * BigInt(1000))
      
      logger.addLog(`SWAP ${usdtSymbol}/${wphrsSymbol}`)
      logger.addLog(`Amount In: ${amountIn} ${usdtSymbol}`)
      logger.addLog(`Expected Amount Out: ${amountOut} ${wphrsSymbol}`)
      logger.addLog(`Slippage: ${slippageTolerance * 100}%`)
      logger.addLog(`Deadline: ${deadline}`)
      
      try {
        logger.addLog("Swapping USDT to WPHRS...")
        await multicall({
          router,
          tokenIn: usdtAddress,
          tokenOut: wphrsAddress,
          amountIn,
          amountOut,
          fee: priceUsdtWphrs.fee,
          signer: wallet.signer,
          deadline,
          logger
        })
        logger.addSuccess("USDT to WPHRS swap completed")
      } catch (error) {
        logger.addError(`Swap failed: ${error}`)
      }
    }

    logger.addSuccess("Zenith USDT Swap automation completed")

    return NextResponse.json({
      success: true,
      message: 'Zenith USDT Swap automation completed successfully',
      logs: logger.getLogs()
    })

  } catch (error) {
    console.error('Error in zenith-usdt-swap API:', error)
    
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
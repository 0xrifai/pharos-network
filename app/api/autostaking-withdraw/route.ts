import { NextRequest, NextResponse } from 'next/server'
import { loggerManager } from '@/scripts/utils/realtime-logger'
import { setupProvider } from '@/scripts/utils/provider'
import { ownAddress } from '@/scripts/utils/wallet'
import { assetUser } from '@/scripts/pharosNetwork/autostaking/assetUser'
import { withdrawFromVault } from '@/scripts/pharosNetwork/autostaking/withdraw'
import { router } from '@/scripts/pharosNetwork/autostaking/contracts'
import { multicall } from '@/scripts/pharosNetwork/autostaking/multicall'
import { sleep } from '@/scripts/utils/time'
import { randomAmount } from '@/scripts/utils/amount'

interface Vaults {
  address: string,
  balance: bigint
}

export async function POST(request: NextRequest) {
  let taskId: string | undefined
  
  try {
    const {  
      privateKey,
      rpcUrl, 
      proxyUrl = "", 
      autostakingToken = "", 
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
      rpcUrl: rpcUrl || 'https://rpc.pharosnetwork.com'
    })

    const wallet = ownAddress({
      dirname: process.cwd(),
      provider,
      key: "PRIVATE_KEY"
    })

    logger.addLog('Starting Autostaking Withdraw automation...')
    logger.addLog(`Wallet Address: ${wallet.address}`)
    logger.addLog(`Network: ${rpcUrl || 'https://rpc.pharosnetwork.com'}`)
    logger.addLog(`Proxy URL: ${proxyUrl || 'Not set'}`)
    logger.addLog(`Autostaking Token: ${autostakingToken || 'Not set'}`)
    logger.addLog(`Router Address: ${router}`)

    for (let index = 1; index <= loopCount; index++) {
      logger.addLog(`Task withdraw all vaults ${index}/${loopCount}`)
      
      try {
        logger.addLog('Fetching user assets...')
        const asset = await assetUser({
          PROXY_URL: proxyUrl,
          AUTOSTAKING_TOKEN: autostakingToken,
          walletAddress: wallet.address,
          logger
        })
        
        if (!asset) {
          logger.addError("Error fetching assets")
          continue
        }
        
        const positions = asset?.data.positions || []
        logger.addLog(`Found ${positions.length} positions`)
        
        if (positions.length == 0) {
          logger.addLog("No positions on any vault")
          continue
        }
        
        const vaults: Vaults[] = []
        for (const position of positions) {
          vaults.push({
            address: position.assetAddress,
            balance: BigInt(position.assetBalance)
          })
          logger.addLog(`Vault: ${position.assetAddress}, Balance: ${position.assetBalance}`)
        }
        
        const encodedArguments: string[] = []
        for (const vault of vaults) {
          logger.addLog(`Preparing withdrawal for vault: ${vault.address}`)
          const data = await withdrawFromVault({
            wallet: wallet.signer,
            vaultAddress: vault.address,
            router,
            amount: vault.balance,
            logger
          })
          if (data) {
            encodedArguments.push(data)
            logger.addLog(`Withdrawal data prepared for vault: ${vault.address}`)
          }
        }
        
        if (encodedArguments.length > 0) {
          logger.addLog(`Withdrawing from ${encodedArguments.length} vaults...`)
          await multicall({
            wallet: wallet.signer,
            encodedArguments,
            router,
            logger
          })
          logger.addSuccess("Withdrawal completed successfully")
        } else {
          logger.addLog('No withdrawals to process')
        }
        
      } catch (error) {
        logger.addError(`Error in withdrawal process: ${error}`)
      }

      if (index < loopCount) {
        const ms = randomAmount({
          min: timeoutMinMs,
          max: timeoutMaxMs
        })
        logger.addLog(`Sleeping for ${ms}ms...`)
        await sleep(ms)
      }
    }

    logger.addSuccess("Autostaking Withdraw automation completed")

    return NextResponse.json({
      success: true,
      message: 'Autostaking Withdraw automation completed successfully',
      logs: logger.getLogs()
    })

  } catch (error) {
    console.error('Error in autostaking-withdraw API:', error)
    
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
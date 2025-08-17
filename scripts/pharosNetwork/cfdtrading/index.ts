import * as dotenv from "dotenv"
import path from "path"
import getProof from "./proof"
import { Contract, formatUnits, JsonRpcProvider, Wallet } from "ethers"
import { CFDTradeAbi, pairs, router, spender, mockUSD, faucet } from "./data"
import { randomAmount } from "@scripts/utils/amount"
import { tokenBalance } from "@scripts/utils/balance"
import { approve } from "@scripts/utils/approve"
import { RealtimeLogger } from "@/scripts/utils/realtime-logger"

interface OpenPositionParams {
  baseDir: string,
  signer: Wallet,
  provider: JsonRpcProvider,
  logger: RealtimeLogger
}

export async function OpenPosition({
  baseDir,
  signer,
  provider,
  logger
}: OpenPositionParams) {
     // Force SSL verification to be disabled
     process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
     
     dotenv.config({ path: path.join(baseDir, ".env") })
     const index = Math.floor(randomAmount({
          min: 0,
          max: pairs.length - 1
     }))
     const position = Math.random() < 0.5
     const selectedPair = pairs[index]
     const pair = BigInt(selectedPair.pair)
     const { PROXY_URL = "" } = process.env!

     try {
          const { balance: mockUsdcbalance, decimals: mockUsdcDecimals } = await tokenBalance({
               address: signer.address,
               provider,
               tokenAddress: mockUSD
          })
          const amount = BigInt(Math.floor(randomAmount({
               min: 10_000_000,
               max: 50_000_000
          })))
          if (mockUsdcbalance < amount) {
                   logger.addLog(`Insufficient USDC balance: ${formatUnits(mockUsdcbalance, mockUsdcDecimals)} < ${formatUnits(amount, mockUsdcDecimals)}`)
    logger.addLog("Claiming faucet...")

               const faucetContract = new Contract(faucet, CFDTradeAbi, signer)
               const tx = await faucetContract.claim()
               await tx.wait()
               logger.addSuccess(`txhash: ${tx.hash}`)
          }
          await approve({
               tokenAddress: mockUSD,
               signer,
               router: spender,
               amount,
               logger
          })
          logger.addLog(`Fetching proof for pair: ${selectedPair.pair} (${selectedPair.name})`)
          const proof = await getProof({
               pair: selectedPair.pair,
               PROXY_URL
          })
          logger.addLog(`Proof fetched successfully for ${selectedPair.name}`)
          
          const contractRouter = new Contract(router, CFDTradeAbi, signer)
          logger.addLog(`Opening Position ${formatUnits(amount, mockUsdcDecimals)} ${position == true ? "long" : "short"} ${selectedPair.name}...`)
          const tx = await contractRouter.openPosition(
               pair,
               proof,
               position,
               1n,
               amount,
               0n,
               0n
          )
          await tx.wait()
          logger.addSuccess(`txhash: ${tx.hash}`)
     } catch (error) {
          logger.addError(`Error in OpenPosition: ${error}`)
          throw error
     }
}
import { tokenBalance } from "@scripts/utils/balance"
import { getPrice, getTick } from "@scripts/utils/price"
import { Contract, Interface, InterfaceAbi, JsonRpcProvider, Wallet } from "ethers"
import { liquidityABI } from "@scripts/lib/data"
import ERC20ABI from "@scripts/lib/ERC20.json"
import { RealtimeLogger } from "@/scripts/utils/realtime-logger"

interface LiquidityParams {
     provider: JsonRpcProvider,
     signer: Wallet,
     poolAddress: string,
     tokenA: string,
     tokenB: string,
     amountInPercent: number,
     router: string,
     deadline: number,
     logger: RealtimeLogger
}

export async function liquidity({
     signer,
     poolAddress,
     tokenA,
     tokenB,
     provider,
     amountInPercent,
     router,
     deadline,
     logger
}:LiquidityParams) {
     const price = await getPrice({
          poolAddress,
          addresses: {
               tokenA,
               tokenB
          },
          provider
     })
     const tick = getTick({
          slot0: price.slot0,
          fee: price.fee
     })

     const token0 = price.token0.toLowerCase() == tokenA.toLowerCase() ? tokenA : tokenB
     const token1 = price.token1.toLowerCase() == tokenA.toLowerCase() ? tokenA : tokenB
     const token0ToToken1Price = price.token0.toLowerCase() == tokenA.toLowerCase() ? price.tokenAToTokenB : price.tokenBToTokenA

     const {balance: token0Balance, symbol: token0Symbol, decimals: token0Decimals} = await tokenBalance({
          address: signer.address,
          provider,
          tokenAddress: token0
     })
     const {symbol: token1Symbol, decimals: token1Decimals, balance: token1Balance} = await tokenBalance({
          address: signer.address,
          provider,
          tokenAddress: token1
     })

     
     const token0ToToken1Scaled = BigInt(Math.floor(token0ToToken1Price * 1e18))
     const amount0Desired = token0Balance / BigInt(`${amountInPercent}00`)
     
     const precision = 10n ** 18n
     const amount0_18dec = amount0Desired * precision / (10n ** BigInt(token0Decimals))
     const amount1_18dec = amount0_18dec * token0ToToken1Scaled / precision
     const amount1Desired = amount1_18dec * (10n ** BigInt(token1Decimals)) / precision
     
     logger.addLog(`Supply ${token0Symbol}/${token1Symbol}...`)
     
     if(amount1Desired > token1Balance){
          logger.addLog(`Insufficient ${token1Symbol}!`)
          return
     }

     const ifaceLiquidity = new Interface(liquidityABI)

     const paramsMint = [
          token0,
          token1,
          price.fee,
          tick.tickLower,
          tick.tickUpper,
          amount0Desired,
          amount1Desired,
          0,
          0,
          signer.address,
          deadline
     ]

     const encodedMint = ifaceLiquidity.encodeFunctionData("mint", [paramsMint])
     await approve({
          tokenAddress: token0,
          ERC20ABI,
          signer,
          router,
          amount: amount0Desired,
          logger
     })
     await approve({
          tokenAddress: token1,
          ERC20ABI,
          signer,
          router,
          amount: amount1Desired,
          logger
     })

     const contractLiquidity = new Contract(poolAddress, ifaceLiquidity, signer)
     try {
          const tx = await contractLiquidity.mint(paramsMint)
          await tx.wait()
          logger.addLog(`Success! txhash: ${tx.hash}`)
     } catch (error) {
          console.error(`failed! ${error}`)
     }
}

async function approve({
     tokenAddress,
     ERC20ABI,
     signer,
     router,
     amount,
     logger
}: {
     tokenAddress: string,
     ERC20ABI: any,
     signer: Wallet,
     router: string,
     amount: bigint,
     logger: RealtimeLogger
}) {
     const contractERC20 = new Contract(tokenAddress, ERC20ABI, signer)
     
     logger.addLog("Checking allowance...")
     const allowance = await contractERC20.allowance(signer.address, router)
     if(allowance < amount){
          logger.addLog("Approving to router...")
          const approveTx = await contractERC20.approve(router, amount)
          await approveTx.wait()
          logger.addLog(`txhash: ${approveTx.hash}`)
     }
}
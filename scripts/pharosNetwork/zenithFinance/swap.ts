import { ethers, Wallet } from "ethers"
import { exactInputSingleAbi, multicallAbi } from "@scripts/lib/data"
import ERC20 from "@scripts/lib/ERC20.json"
import { RealtimeLogger } from "@/scripts/utils/realtime-logger"

interface SwapParams {
     router: string,
     tokenIn: string,
     tokenOut: string,
     amountIn: bigint,
     amountOut: bigint
     fee: number,
     signer: Wallet,
     deadline: number,
     logger: RealtimeLogger
}

export async function multicall({
     router,
     tokenIn,
     tokenOut,
     amountIn,
     amountOut,
     fee,
     signer,
     deadline,
     logger
}:SwapParams) {
     const paramsExactInputSingle = {
          tokenIn,
          tokenOut,
          fee,
          recipient: signer.address,
          amountIn,
          amountOutMinimum: amountOut,
          sqrtPriceLimitX96: 0
     }

     const ifaceExactInputSingle = new ethers.Interface(exactInputSingleAbi)
     const exactInputSingleData = ifaceExactInputSingle.encodeFunctionData("exactInputSingle", [paramsExactInputSingle])

     const ifaceRouter = new ethers.Interface(multicallAbi)

     const contractERC20 = new ethers.Contract(tokenIn, ERC20, signer)
     
     logger.addLog("Checking allowance...")
     const allowance = await contractERC20.allowance(signer.address, router)
     if(allowance < amountIn){
          logger.addLog("Approving to router...")
          const approveTx = await contractERC20.approve(router, amountIn)
          await approveTx.wait()
          logger.addLog(`Approved! txhash: ${approveTx.hash}`)
     } else {
          logger.addLog("Allowance sufficient, no approval needed")
     }

     const contractRouter = new ethers.Contract(router, ifaceRouter, signer)
     try {
          logger.addLog("Swapping via multicall method...")
          const tx = await contractRouter.multicall(deadline, [exactInputSingleData])
          await tx.wait()
          logger.addSuccess(`Success! txhash: ${tx.hash}`)
     } catch (error) {
          logger.addLog(`Failed! ${error}`)
          throw error
     }
}
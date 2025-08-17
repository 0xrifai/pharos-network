import { Contract, InterfaceAbi, Wallet } from "ethers"
import ERC20ABI from "@scripts/lib/ERC20.json"
import { RealtimeLogger } from "./realtime-logger"

interface ApproveParams {
     tokenAddress: string,
     ERC20ABI?: InterfaceAbi,
     signer: Wallet,
     router: string,
     amount: BigInt,
     logger: RealtimeLogger
}

export async function approve({
     tokenAddress,
     signer,
     router,
     amount,
     logger
}:ApproveParams) {
     const contract = new Contract(tokenAddress, ERC20ABI, signer)
     logger.addLog("Checking allowance...")
     const allowance = await contract.allowance(signer.address, router)
     logger.addLog(allowance.toString())
     if (allowance < amount) {
          if (allowance > 0n) {
               logger.addLog("Resetting allowance to 0 first...")
               const resetTx = await contract.approve(router, 0n)
               await resetTx.wait()
               logger.addLog(`Reset tx: ${resetTx.hash}`)
          }

          logger.addLog("Approving new amount to spender...")
          const approveTx = await contract.approve(router, amount)
          await approveTx.wait()
          logger.addLog(`Approve tx: ${approveTx.hash}`)
     } else {
          logger.addLog("Sufficient allowance already approved.")
     }

}
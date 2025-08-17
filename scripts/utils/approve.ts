import { Contract, InterfaceAbi, Wallet } from "ethers"
const ERC20ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
]
import { RealtimeLogger } from "./realtime-logger"

interface ApproveParams {
     tokenAddress: string,
     ERC20ABI?: InterfaceAbi,
     signer: Wallet,
     router: string,
     amount: BigInt,
     logger?: RealtimeLogger
}

export async function approve({
     tokenAddress,
     signer,
     router,
     amount,
     logger
}:ApproveParams) {
     const contract = new Contract(tokenAddress, ERC20ABI, signer)
     const logMessage = logger ? logger.addLog.bind(logger) : console.log
     logMessage("Checking allowance...")
     const allowance = await contract.allowance(signer.address, router)
     logMessage(allowance.toString())
     if (allowance < amount) {
          if (allowance > 0n) {
               logMessage("Resetting allowance to 0 first...")
               const resetTx = await contract.approve(router, 0n, {
                    gasLimit: 100000,
                    maxFeePerGas: 20000000000n, // 20 gwei max fee
                    maxPriorityFeePerGas: 2000000000n // 2 gwei priority fee
               })
               
               // Wait for reset transaction with timeout
               await Promise.race([
                    resetTx.wait(),
                    new Promise((_, reject) => 
                         setTimeout(() => reject(new Error('Reset transaction timeout')), 60000) // 1 minute timeout
                    )
               ])
               logMessage(`Reset tx: ${resetTx.hash}`)
          }

          logMessage("Approving new amount to spender...")
          const approveTx = await contract.approve(router, amount, {
               gasLimit: 100000,
               maxFeePerGas: 20000000000n, // 20 gwei max fee
               maxPriorityFeePerGas: 2000000000n // 2 gwei priority fee
          })
          
          // Wait for approve transaction with timeout
          await Promise.race([
               approveTx.wait(),
               new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Approve transaction timeout')), 60000) // 1 minute timeout
               )
          ])
          logMessage(`Approve tx: ${approveTx.hash}`)
     } else {
          logMessage("Sufficient allowance already approved.")
     }
}
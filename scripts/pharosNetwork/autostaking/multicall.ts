import { Contract, parseEther, Wallet } from "ethers"
import { VaultMulticall_v2Abi } from "../../lib/data"
import { RealtimeLogger } from "../../utils/realtime-logger"

interface MulticallParams {
     wallet: Wallet,
     encodedArguments: string[],
     router: string,
     logger?: RealtimeLogger
}

export async function multicall({
     wallet,
     encodedArguments,
     router,
     logger
}: MulticallParams) {
     const routerContract = new Contract(router, VaultMulticall_v2Abi, wallet)
     
     const logMessage = logger ? logger.addLog.bind(logger) : console.log
     logMessage(`Executing multicall with ${encodedArguments.length} operations...`)
     const tx = await routerContract.multicall(encodedArguments, {
          value: parseEther("0")
     })
     await tx.wait()
     logMessage(`success! txhash: ${tx.hash}`)
}
import { Contract, parseEther, Wallet } from "ethers"
import { VaultMulticall_v2Abi } from "@scripts/lib/data"
import { RealtimeLogger } from "@/scripts/utils/realtime-logger"

interface MulticallParams {
     wallet: Wallet,
     encodedArguments: string[],
     router: string,
     logger: RealtimeLogger
}

export async function multicall({
     wallet,
     encodedArguments,
     router,
     logger
}: MulticallParams) {
     const routerContract = new Contract(router, VaultMulticall_v2Abi, wallet)
     
     const tx = await routerContract.multicall(encodedArguments, {
          value: parseEther("0")
     })
     await tx.wait()
     logger.addLog(`success! txhash: ${tx.hash}`)
}
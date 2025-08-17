import { Interface, Wallet } from "ethers"
import { approve } from "../../utils/approve"
import { VaultMulticall_v2Abi } from "../../lib/data"

interface MulticallParams {
     wallet: Wallet,
     vaultAddress: string,
     router: string,
     amount: bigint,
     logger?: any
}

export async function withdrawFromVault({
     wallet,
     vaultAddress,
     router,
     amount,
     logger
}: MulticallParams) {
     const iface = new Interface(VaultMulticall_v2Abi)
     await approve({
          tokenAddress: vaultAddress,
          signer: wallet,
          router,
          amount: amount,
          logger
     })
     if (logger) {
          logger.addLog("Approved ")
     }
     const encodedWithdraw = iface.encodeFunctionData("withdrawFromVault", [
          vaultAddress,
          amount,
          wallet.address,
          wallet.address
     ])
     return encodedWithdraw
}
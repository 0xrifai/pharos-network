// import { Interface, Wallet } from "ethers"
// import { VaultMulticall_v2Abi } from "@scripts/lib/data"

// interface MulticallParams {
//      wallet: Wallet,
//      vaultAddress: string,
//      router: string,
//      tokenAddress: string,
//      amount: BigInt,
//      logger: any
// }

// export async function depositToVault({
//      wallet,
//      vaultAddress,
//      tokenAddress,
//      amount,
//      router,
//      logger
// }: MulticallParams) {
//      const iface = new Interface(VaultMulticall_v2Abi)
//      await approve({
//           tokenAddress,
//           signer: wallet,
//           router,
//           amount,
//           logger
//      })
//      const encodedDeposit = iface.encodeFunctionData("depositToVault", [
//           vaultAddress,
//           amount,
//           wallet.address
//      ])
//      return encodedDeposit
// }
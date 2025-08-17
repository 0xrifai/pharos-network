import { Contract, Wallet } from "ethers"

interface ClaimParams {
     signer: Wallet,
     router: string,
     abi: string[],
     logger: any
}

export async function claimTokens({
     signer,
     router,
     abi,
		 logger
}:ClaimParams) {
     const contract = new Contract(router, abi, signer)
     try {
          const tx = await contract.claimTokens()
          await tx.wait()
          logger.addSuccess(`txhash: ${tx.hash}`)
     } catch (error) {
          logger.addError(`Failed to claim tokens: ${error}`)
          return
     }
}
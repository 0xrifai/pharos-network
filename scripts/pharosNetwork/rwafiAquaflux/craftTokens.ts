import { parseUnits, toBeHex, Wallet, zeroPadValue } from "ethers"

interface CraftParams {
     signer: Wallet,
     router: string,
     selector: string,
     logger: any
}

export async function craftTokens({
     signer,
     router,
     selector,
     logger
}:CraftParams) {
     const amount = parseUnits("100", 18)
     const padded = zeroPadValue(toBeHex(amount), 32)
     const callData = selector + padded.slice(2)
     try {
          const tx = await signer.sendTransaction({
               to: router,
               data: callData
          })
          await tx.wait()
          logger.addSuccess(`txhash: ${tx.hash}`)
     } catch (error) {
          logger.addError(`Error in craftTokens: ${error}`)
          return
     }
}
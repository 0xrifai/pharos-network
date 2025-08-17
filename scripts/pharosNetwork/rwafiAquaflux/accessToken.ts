import { Wallet } from "ethers"
import { fetchWithUndici } from "@scripts/utils/ip"
import { getFutureTimestamp } from "@scripts/utils/date"

interface AccessParams {
     signer: Wallet,
     headers: Record<string, string>
     logger: any
}
export async function getAccessToken({
     signer,
     headers,
     logger
}:AccessParams){
     const url = "https://api.aquaflux.pro/api/v1/users/wallet-login"
     try {
          const timestamp = getFutureTimestamp({hours: 0, days: 0})
          const message = `Sign in to AquaFlux with timestamp: ${timestamp}`
          const signMessage = await signer.signMessage(message)
          const res = await fetchWithUndici({
               url,
               method: "POST",
               headers: {
                    ...headers,
                    "Content-Type": "application/json"
               },
               body: JSON.stringify({
                    address: signer.address,
                    message,
                    signature: signMessage
               })
          })
          const data = JSON.parse(res.body)
          return data
     } catch (error) {
          logger.addError(`Error in getAccessToken: ${error}`)
     }
}
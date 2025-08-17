import fs from "fs"
import { fetchWithUndici } from "@scripts/utils/ip"
import * as dotenv from "dotenv"
import path from "path"
import { getAccessToken } from "./accessToken"
import { Wallet } from "ethers"
import { updateEnvContent } from "@scripts/utils/env"


interface SignatureParams {
     nftType: number,
     signer: Wallet,
     baseDir: string
     logger: any
}

const headers = {
     "Accept": "application/json, text/plain, */*",
     "Origin": "https://playground.aquaflux.pro",
     "Referer": "https://playground.aquaflux.pro/",
     "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
}

export async function getSignature({
     nftType,
     signer,
     baseDir,
     logger
}: SignatureParams) {
     dotenv.config({ path: path.join(baseDir, ".env") })
     let { AQUAFLUX_ACCESS_TOKEN } = process.env!
     const url = "https://api.aquaflux.pro/api/v1/users/get-signature"
     try {
          if (!AQUAFLUX_ACCESS_TOKEN) {
               logger.addLog("Creating access token...")
               const accesToken = await getAccessToken({
                    signer,
                    headers,
                    logger
               })
               AQUAFLUX_ACCESS_TOKEN = accesToken.data.accessToken
               const envPath = path.join(baseDir, ".env")
               const key = "AQUAFLUX_ACCESS_TOKEN"
               const existingEnv = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : ""

               const updatedEnv = updateEnvContent({
                    envContent: existingEnv,
                    key,
                    value: AQUAFLUX_ACCESS_TOKEN!
               })
               fs.writeFileSync(envPath, updatedEnv)
               logger.addLog(`✅ ${key} saved to ${envPath}`)

          }else{
               logger.addLog("Access token already exist!")
          }
          const isHolding = await fetchWithUndici({
               url: "https://api.aquaflux.pro/api/v1/users/check-token-holding",
               method: "POST",
               headers: {
                         ...headers,
                         "Authorization": `Bearer ${AQUAFLUX_ACCESS_TOKEN}`,
                         "Content-Type": "application/json"
                    },
          })
          const jsonIsHolding = JSON.parse(isHolding.body)
          if(jsonIsHolding.data.isHoldingToken){
               const res = await fetchWithUndici({
                    url,
                    method: "POST",
                    headers: {
                         ...headers,
                         "Authorization": `Bearer ${AQUAFLUX_ACCESS_TOKEN}`,
                         "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                         requestedNftType: nftType,
                         walletAddress: signer.address
                    })
               })
               const json = JSON.parse(res.body)
               return json.data
          }
     } catch (error) {
          logger.addError(`Error in getSignature: ${error}`)
          return
     }
}
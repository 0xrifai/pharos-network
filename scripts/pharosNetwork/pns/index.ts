import * as dotenv from "dotenv"
import path from "path"
import { Contract, JsonRpcProvider, Wallet } from "ethers"
import { abiPNS, resolverAddress, router } from "./data"
import { sleep } from "@scripts/utils/time"
import { RealtimeLogger } from "@/scripts/utils/realtime-logger"
import { commit } from "./commit"

interface RegisterPns {
     baseDir: string,
     signer: Wallet,
     days: number,
     provider: JsonRpcProvider,
     logger: RealtimeLogger
}

export async function register({
     baseDir,
     signer,
     days,
     provider,
     logger
}: RegisterPns) {
     dotenv.config({ path: path.join(baseDir, ".env") })
     const { PROXY_URL = "" } = process.env!
     const committing = await commit({
          PROXY_URL,
          signer,
          days,
          provider,
          logger
     })
     if (!committing.isCommitted) {
          logger.addLog(`${committing.messages || "Error committing domain!"}`)
          return
     }
     const { price, name, duration, secret, encodedData } = committing
     logger.addLog("Waiting for register!")
     await sleep(70000)
     const contract = new Contract(router, abiPNS, signer)
     logger.addLog("Registering...")
     const register = await contract.register(
          name,
          signer.address,
          duration,
          secret,
          resolverAddress,
          [encodedData],
          false,
          0n,
          {
               value: price
          }
     )
     await register.wait()
     logger.addSuccess(`txhash: ${register.hash}`)
     logger.addSuccess("PNS registered successfully")
}


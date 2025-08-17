import { Contract, Wallet } from "ethers"
import { fetchWithUndici } from "@scripts/utils/ip"
import { getSignature } from "./signature"
import { RealtimeLogger } from "@/scripts/utils/realtime-logger"

interface MintParams {
  signer: Wallet,
  baseDir: string,
  selector: any,
  logger: RealtimeLogger
}

const contractAddress = "0x1234567890123456789012345678901234567890"
const contractAbi = [
  "function mint(bytes calldata signature) external"
]

export async function mint({
  signer,
  baseDir,
  selector,
  logger
}: MintParams) {
  logger.addLog("Claiming token...")
  
  const claimUrl = "https://api.rwafi.com/claim"
  const claimResponse = await fetchWithUndici({
    url: claimUrl,
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      address: signer.address,
      selector: selector
    })
  })
  
  if (claimResponse.status !== 200) {
    throw new Error("Failed to claim token")
  }
  
  logger.addLog(`Crafting token to ${selector}...`)
  
  const craftUrl = "https://api.rwafi.com/craft"
  const craftResponse = await fetchWithUndici({
    url: craftUrl,
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      address: signer.address,
      selector: selector
    })
  })
  
  if (craftResponse.status !== 200) {
    throw new Error("Failed to craft token")
  }
  
  logger.addLog("Creating signature...")
  
  const signature = await getSignature({
    nftType: 0,
    signer,
    baseDir,
    logger
  })
  
  logger.addLog("Minting nft...")
  
  const contract = new Contract(contractAddress, contractAbi, signer)
  const tx = await contract.mint(signature)
  await tx.wait()
  
  logger.addLog(`NFT minted successfully! txhash: ${tx.hash}`)
}
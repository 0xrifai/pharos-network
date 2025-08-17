import { fetchExternalAPI } from "@scripts/utils/ip"
import { headers } from "./data"

interface ProofParams{
     pair: string,
     PROXY_URL: string
}

async function fetchWithRetry(url: string, options: any, maxRetries = 3): Promise<any> {
     for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
               console.log(`Attempting to fetch proof (attempt ${attempt}/${maxRetries}) from: ${url}`)
               if (options.proxyUrl) {
                    console.log(`Using proxy: ${options.proxyUrl}`)
               }
               
               const response = await fetchExternalAPI({
                    url,
                    method: "GET",
                    headers: options.headers,
                    proxyUrl: options.proxyUrl
               })
               
               console.log(`Proof fetched successfully on attempt ${attempt}`)
               return response
          } catch (error) {
               console.log(`Attempt ${attempt} failed: ${error}`)
               if (attempt === maxRetries) {
                    throw new Error(`Failed to fetch proof after ${maxRetries} attempts. Last error: ${error}`)
               }
               console.log(`Retrying in ${1000 * attempt}ms...`)
               // Wait before retrying (exponential backoff)
               await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          }
     }
}

export default async function getProof({
     pair,
     PROXY_URL
}:ProofParams){
     const url = `https://proof.brokex.trade/proof?pairs=${pair}`
     const proof = await fetchWithRetry(url, {
          headers,
          proxyUrl: PROXY_URL
     })
     const json = JSON.parse(proof.body)
     return json.proof
}
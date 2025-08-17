import { JsonRpcProvider } from "ethers"

interface Provider {
     rpcUrl: string,
}

export function setupProvider({
     rpcUrl
}:Provider) {
     // Force SSL verification to be disabled at the Node.js level
     // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
     
     // Define network configuration for Pharos Network
     const network = {
          name: "Pharos Network",
          chainId: 688688, // 0xa8230 in decimal
     }
     
     // Create provider with static network configuration
     const provider = new JsonRpcProvider(rpcUrl, network, { staticNetwork: true })
     return provider
}

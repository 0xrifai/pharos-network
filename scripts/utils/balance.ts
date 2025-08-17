import { ethers, JsonRpcProvider } from "ethers"
const ERC20ABI = [
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function balanceOf(address account) view returns (uint256)"
]

interface Balance {
     address: string,
     provider: JsonRpcProvider
}
export async function coinBalance({
     address,
     provider
}:Balance) {
     const coinBalance = await provider.getBalance(address)
     return ethers.formatEther(coinBalance)
}

interface Token extends Balance {
     tokenAddress: string
}

export async function tokenBalance({
     address,
     provider,
     tokenAddress
}:Token) {
     const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider)
     const [name, decimals, symbol, balance] = await Promise.all([
          contract.name(), contract.decimals(), contract.symbol(), contract.balanceOf(address)
     ])
     return {
          name, decimals, symbol, balance
     }
}
import { Contract, formatUnits, JsonRpcProvider, parseUnits, Wallet } from "ethers"
import { tokenBalance } from "../../utils/balance"
import { approve } from "../../utils/approve"
import { liquidityABI } from "../../lib/data"
const ERC29ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
]

interface LiquidityParams {
  poolAddress: string,
  tokenIn: string,
  tokenOut: string,
  deadline: number,
  signer: Wallet,
  amountIn_inPercent: number,
  provider: JsonRpcProvider,
  logger: any,
  slippage?: number
}
// Router contract address and ABI
const routerAddress = "0x4b177aded3b8bd1d5d747f91b9e853513838cd49"
const spender = "0x73CAfc894dBfC181398264934f7Be4e482fc9d40"

export async function createLiquidity({
  poolAddress,
  tokenIn,
  tokenOut,
  deadline,
  signer,
  amountIn_inPercent,
  provider,
  logger,
  slippage = 0.0015
}:LiquidityParams) {
  try {
    const pool = new Contract(poolAddress, liquidityABI, signer)
    const [baseToken, quoteToken, baseRes, quoteRes] = await pool.getPMMState()
    
    // Swap tokens if baseRes > quoteRes (same logic as original)
    if(baseRes > quoteRes){
        [tokenIn, tokenOut] = [tokenOut, tokenIn]
    }

    const {balance: balanceTokenIn, symbol: symbolTokenIn, decimals: decimalsTokenIn} = await tokenBalance({
      address: signer.address,
      provider,
      tokenAddress: tokenIn 
    })
    const {symbol: symbolTokenOut, decimals: decimalsTokenOut} = await tokenBalance({
      address: signer.address,
      provider,
      tokenAddress: tokenOut
    })
    let amountIn = balanceTokenIn * BigInt(amountIn_inPercent) / 100n  

    const price = Number(quoteRes) / Number(baseRes)
    const floatOut = price * (Number(amountIn) / Math.pow(10, Number(decimalsTokenOut)))
    const minOut = parseUnits(truncateDecimals(floatOut, Number(decimalsTokenOut)), Number(decimalsTokenOut))

    logger.addLog(`Approving ${symbolTokenIn}...`)
    await approve({
      tokenAddress: tokenIn,
      ERC20ABI: ERC29ABI,
      signer,
      router: spender,
      amount: amountIn,
      logger
    })
    
    logger.addLog(`Approving ${symbolTokenOut}...`)
    await approve({
      tokenAddress: tokenOut,
      ERC20ABI: ERC29ABI,
      signer,
      router: spender,
      amount: minOut,
      logger
    })
    
    const id = BigInt(deadline)
    logger.addLog(`Supplying ${symbolTokenIn}/${symbolTokenOut} to ${poolAddress}`)
    const router = new Contract(routerAddress, liquidityABI, signer)
    
    const nonce = await signer.getNonce()
    const baseMinAmount = BigInt(Math.floor(Number(amountIn) * (1 - slippage)));   // 999_001
    const quoteMinAmount = BigInt(Math.floor(Number(minOut) * (1 - slippage))); // 999_000

    logger.addLog(`amountIn: ${formatUnits(amountIn, decimalsTokenIn)}, minOut: ${formatUnits(minOut, decimalsTokenOut)}, baseMinAmount: ${formatUnits(baseMinAmount, decimalsTokenIn)}, quoteMinAmount: ${formatUnits(quoteMinAmount, decimalsTokenOut)}`)

    // Add retry mechanism for transaction
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        logger.addLog(`Attempting transaction (attempt ${retryCount + 1}/${maxRetries})...`)
        
        const tx = await router.addDVMLiquidity(
          poolAddress,
          amountIn,
          minOut,
          baseMinAmount,
          quoteMinAmount,
          0n,
          id, 
          {
            nonce,
            gasLimit: 500000, // Set explicit gas limit
            maxFeePerGas: 20000000000n, // 20 gwei max fee
            maxPriorityFeePerGas: 2000000000n // 2 gwei priority fee
          }
        )
        
        logger.addLog(`Transaction sent: ${tx.hash}`)
        logger.addLog(`Waiting for confirmation...`)
        
        // Wait for transaction with timeout
        const receipt = await Promise.race([
          tx.wait(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction timeout')), 120000) // 2 minutes timeout
          )
        ])
        
        logger.addSuccess(`Success! txhash: ${tx.hash}`)
        return; // Success, exit retry loop
        
      } catch (error: any) {
        retryCount++;
        logger.addLog(`Transaction attempt ${retryCount} failed: ${error.message}`)
        
        if (retryCount >= maxRetries) {
          throw new Error(`Transaction failed after ${maxRetries} attempts: ${error.message}`)
        }
        
        // Wait before retry
        logger.addLog(`Waiting 10 seconds before retry...`)
        await new Promise(resolve => setTimeout(resolve, 10000))
        
        // Get new nonce for retry
        const newNonce = await signer.getNonce()
        logger.addLog(`Using new nonce: ${newNonce}`)
      }
    }
  } catch (error) {
    console.error(error)
    logger.addLog(`Error: ${error}`)
    throw error
  }
}

function truncateDecimals(num: number, decimals: number) {
  return Number(num.toFixed(decimals)).toString()
}
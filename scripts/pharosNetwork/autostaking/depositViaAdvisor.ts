import { JsonRpcProvider, Wallet } from "ethers"
import { multicall } from "./multicall"
import { advisor } from "./advisor"
import { depositToVault } from "./deposit"
import { tokenBalance } from "../../utils/balance"
import { withdrawFromVault } from "./withdraw"

const router = "0x11cd3700b310339003641fdce57c1f9bd21ae015"

interface VaultEntry {
     decimals: number;
     vaults: {
          vaultAddress: string;
          assetAddress: string;
          amount: bigint;
          type: string;
     }[]
}

interface DepositViaAdvisorParams {
     baseDir: string,
     wallet: Wallet,
     provider: JsonRpcProvider,
     logger: any
}

export async function depositViaAdvisor({
     baseDir,
     wallet,
     provider,
     logger
}: DepositViaAdvisorParams) {
     try {
          logger.addLog("Getting AI advisor recommendations...")
          const response = await advisor({
               baseDir,
               wallet: wallet,
               provider,
               logger
          })
          
          if (!response) {
               logger.addError("Error fetch or access token not found!")
               return false
          }
          
          const encodedArguments: string[] = []
          const changes = response?.data.data.changes
          const groupedByToken: Record<string, VaultEntry> = {};

          for (const change of changes) {
               const tokenAddress = change.token.address.toLowerCase();

               if (!groupedByToken[tokenAddress]) {
                    groupedByToken[tokenAddress] = {
                         decimals: change.token.decimals,
                         vaults: []
                    };
               }

               groupedByToken[tokenAddress].vaults.push({
                    type: change.type,
                    vaultAddress: change.product.address,
                    assetAddress: change.product.asset.address,
                    amount: BigInt(change.token.amount)
               });
          }

          for (const [tokenAddress, { vaults, decimals }] of Object.entries(groupedByToken)) {
               const { balance: tokenBalanceAmount } = await tokenBalance({
                    address: wallet.address,
                    provider,
                    tokenAddress
               });

               const totalWeight = vaults.reduce((sum, v) => sum + v.amount, 0n);

               for (const v of vaults) {
                    const proportion = Number(v.amount) / Number(totalWeight);
                    const allocatedAmount = BigInt(Math.floor(Number(tokenBalanceAmount) * proportion));
                    let encoded: string | undefined;
                    if (v.type === "deposit") {
                         encoded = await depositToVault({
                              wallet: wallet,
                              vaultAddress: v.vaultAddress,
                              tokenAddress,
                              amount: allocatedAmount,
                              router
                         });
                    } else {
                         encoded = await withdrawFromVault({
                              wallet: wallet,
                              vaultAddress: v.vaultAddress,
                              router,
                              amount: allocatedAmount
                         })
                    }
                    encodedArguments.push(encoded!);
               }
          }
          
          logger.addLog(`Selected Tokens:`)
          logger.addLog(JSON.stringify(groupedByToken, (key, value) =>
               typeof value === 'bigint' ? value.toString() : value
          ))
          
          logger.addLog("Depositing...")
          await multicall({
               wallet: wallet,
               encodedArguments,
               router
          })
          
          logger.addSuccess("All transactions completed successfully!")
          return true
          
     } catch (error) {
          logger.addError(`Error in deposit via advisor: ${error}`)
          return false
     }
} 
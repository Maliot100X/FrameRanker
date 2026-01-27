import { createPublicClient, http, formatEther, parseEther, decodeFunctionData, erc20Abi, formatUnits } from 'viem';
import { base, zora } from 'viem/chains';
import { RPC_ENDPOINTS } from '@/lib/rpc';
import { PAYMENT_TOKENS, type PaymentToken } from '@/config/tokens';

export const PLATFORM_WALLET_ADDRESS = "0xCcD1E099590bfEdf279e239558772Bbb50902EF6";

// Base Client
const baseClient = createPublicClient({
  chain: base,
  transport: http(RPC_ENDPOINTS[0]), // Use first endpoint as default, or fallback logic could be better
});

// Zora Client
const zoraClient = createPublicClient({
  chain: zora,
  transport: http(), // Use default public RPCs for Zora
});

export interface VerificationResult {
  success: boolean;
  amount: number;
  sender: string;
  error?: string;
}

/**
 * Verifies a transaction on-chain
 * Checks:
 * 1. Transaction exists and is successful
 * 2. Recipient matches platform wallet
 * 3. Amount matches expected amount (if provided)
 * 4. Token matches expected currency
 */
export async function verifyTransaction(
  txHash: string, 
  expectedAmount?: number,
  currency: PaymentToken = 'ETH'
): Promise<VerificationResult> {
  try {
    if (!txHash || !txHash.startsWith('0x')) {
      return { success: false, amount: 0, sender: '', error: 'Invalid transaction hash' };
    }

    const tokenInfo = PAYMENT_TOKENS[currency];
    // Select client based on chain
    const client = currency === 'FRAME' ? zoraClient : baseClient;

    const tx = await client.getTransaction({ hash: txHash as `0x${string}` });
    const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });

    if (receipt.status !== 'success') {
      return { success: false, amount: 0, sender: tx.from, error: 'Transaction failed on-chain' };
    }

    let amount = 0;
    let recipient = '';

    if (tokenInfo.isNative) {
      // Native ETH Transfer
      amount = Number(formatEther(tx.value));
      recipient = tx.to?.toLowerCase() || '';

      if (recipient !== PLATFORM_WALLET_ADDRESS.toLowerCase()) {
         return { 
          success: false, 
          amount: 0, 
          sender: tx.from, 
          error: `Invalid recipient: ${recipient}. Expected: ${PLATFORM_WALLET_ADDRESS}` 
        };
      }
    } else {
      // ERC20 Transfer (USDC or FRAME)
      // tx.to should be the Token Contract Address
      if (tx.to?.toLowerCase() !== tokenInfo.address.toLowerCase()) {
         return { 
          success: false, 
          amount: 0, 
          sender: tx.from, 
          error: `Invalid contract address: ${tx.to}. Expected: ${tokenInfo.address}` 
        };
      }

      // Decode input data to check transfer(to, amount)
      try {
        const { args, functionName } = decodeFunctionData({
          abi: erc20Abi,
          data: tx.input,
        });

        if (functionName !== 'transfer') {
           return { 
            success: false, 
            amount: 0, 
            sender: tx.from, 
            error: `Invalid function call: ${functionName}. Expected: transfer` 
          };
        }

        const [to, value] = args as [string, bigint];
        recipient = to.toLowerCase();
        amount = Number(formatUnits(value, tokenInfo.decimals));

        if (recipient !== PLATFORM_WALLET_ADDRESS.toLowerCase()) {
           return { 
            success: false, 
            amount: 0, 
            sender: tx.from, 
            error: `Invalid recipient in transfer: ${recipient}. Expected: ${PLATFORM_WALLET_ADDRESS}` 
          };
        }

      } catch (decodeError) {
         return { 
          success: false, 
          amount: 0, 
          sender: tx.from, 
          error: `Failed to decode ERC20 transfer data` 
        };
      }
    }

    // Check amount if expected amount is provided
    if (expectedAmount !== undefined) {
      // Use a small tolerance for float comparison
      const tolerance = 0.000001;
      if (Math.abs(amount - expectedAmount) > tolerance) {
        return {
          success: false,
          amount: amount,
          sender: tx.from,
          error: `Invalid amount: ${amount} ${currency}. Expected: ${expectedAmount}`
        };
      }
    }

    return {
      success: true,
      amount: amount,
      sender: tx.from
    };

  } catch (error) {
    console.error('Transaction verification failed:', error);
    return { 
      success: false, 
      amount: 0, 
      sender: '', 
      error: error instanceof Error ? error.message : 'Unknown verification error' 
    };
  }
}

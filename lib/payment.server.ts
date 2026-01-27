import { createPublicClient, http, formatEther, parseEther } from 'viem';
import { base } from 'viem/chains';
import { RPC_ENDPOINTS } from '@/lib/rpc';

export const PLATFORM_WALLET_ADDRESS = "0xCcD1E099590bfEdf279e239558772Bbb50902EF6";

const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_ENDPOINTS[0]),
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
 */
export async function verifyTransaction(
  txHash: string, 
  expectedAmount?: number
): Promise<VerificationResult> {
  try {
    if (!txHash || !txHash.startsWith('0x')) {
      return { success: false, amount: 0, sender: '', error: 'Invalid transaction hash' };
    }

    const tx = await publicClient.getTransaction({ hash: txHash as `0x${string}` });
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });

    if (receipt.status !== 'success') {
      return { success: false, amount: 0, sender: tx.from, error: 'Transaction failed on-chain' };
    }

    // Check recipient
    if (tx.to?.toLowerCase() !== PLATFORM_WALLET_ADDRESS.toLowerCase()) {
      return { 
        success: false, 
        amount: 0, 
        sender: tx.from, 
        error: `Invalid recipient: ${tx.to}. Expected: ${PLATFORM_WALLET_ADDRESS}` 
      };
    }

    const amountEth = Number(formatEther(tx.value));

    // Check amount if expected amount is provided (allowing for small float diffs)
    if (expectedAmount !== undefined) {
      const tolerance = 0.000001;
      if (Math.abs(amountEth - expectedAmount) > tolerance) {
        return {
          success: false,
          amount: amountEth,
          sender: tx.from,
          error: `Invalid amount: ${amountEth} ETH. Expected: ${expectedAmount} ETH`
        };
      }
    }

    return {
      success: true,
      amount: amountEth,
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

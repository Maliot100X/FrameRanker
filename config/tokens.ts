// Payment token types
export type PaymentToken = 'ETH' | 'USDC' | 'FRAME';

export interface TokenInfo {
  label: string;
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  isNative: boolean;
  chainId?: number; // Optional chain ID if different from Base (8453)
}

// Token addresses
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const USDC_TOKEN_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const; // Base USDC
const FRAMERANKER_COIN_ADDRESS = '0xc85d3e6ef7feb9181a81c2cd9644899c7135ebfd' as const; // Zora Coin

export const PAYMENT_TOKENS: Record<PaymentToken, TokenInfo> = {
  ETH: {
    label: 'ETH',
    symbol: 'ETH',
    address: ZERO_ADDRESS,
    decimals: 18,
    isNative: true,
  },
  USDC: {
    label: 'USDC',
    symbol: 'USDC',
    address: USDC_TOKEN_ADDRESS,
    decimals: 6,
    isNative: false,
  },
  FRAME: {
    label: 'FrameRanker Coin',
    symbol: 'FRAME',
    address: FRAMERANKER_COIN_ADDRESS,
    decimals: 18,
    isNative: false,
    chainId: 7777777, // Zora Chain ID
  }
};


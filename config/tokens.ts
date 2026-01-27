// Payment token types
export type PaymentToken = 'ETH' | 'USDC';

export interface TokenInfo {
  label: string;
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  isNative: boolean;
}

// Token addresses on Base Mainnet
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const USDC_TOKEN_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

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
};


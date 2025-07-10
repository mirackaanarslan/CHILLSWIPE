import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { createConfig } from 'wagmi';

// Chiliz Spicy Testnet configuration
const chilizSpicyTestnet = {
  id: 88882,
  name: 'Chiliz Spicy Testnet',
  network: 'chiliz-spicy-testnet',
  nativeCurrency: {
    name: 'CHZ',
    symbol: 'CHZ',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://spicy-rpc.chiliz.com/'],
    },
    public: {
      http: ['https://spicy-rpc.chiliz.com/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Chiliz Testnet Explorer',
      url: 'https://testnet.chiliscan.com/',
    },
  },
} as const;

export const config = getDefaultConfig({
  appName: 'PSG Prediction Market',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '034e4dc0484b436bf61b1819192a3050',
  chains: [chilizSpicyTestnet],
  ssr: false,
});

export const supportedChains = [chilizSpicyTestnet]; 
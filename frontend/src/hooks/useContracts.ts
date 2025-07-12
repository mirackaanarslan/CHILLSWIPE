import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { PredictionFactory } from '../contracts/PredictionFactory';
import { PredictionMarket, MarketData } from '../contracts/PredictionMarket';
import { FanToken } from '../contracts/FanToken';

export interface MarketInfo {
  address: string;
  data: MarketData;
}

export const useContracts = (provider?: ethers.Provider, signer?: ethers.Signer) => {
  const [factories, setFactories] = useState<{ PSG: PredictionFactory | null; BAR: PredictionFactory | null }>({ PSG: null, BAR: null });
  const [fanTokens, setFanTokens] = useState<{ PSG: FanToken | null; BAR: FanToken | null }>({ PSG: null, BAR: null });
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userBalances, setUserBalances] = useState<{ PSG: bigint | null; BAR: bigint | null }>({ PSG: null, BAR: null });

  // Initialize contracts
  useEffect(() => {
    if (provider) {
      const psgFactoryInstance = PredictionFactory.createForCoin(provider, 'PSG', signer);
      const barFactoryInstance = PredictionFactory.createForCoin(provider, 'BAR', signer);
      const psgTokenInstance = FanToken.createForCoin(provider, 'PSG', signer);
      const barTokenInstance = FanToken.createForCoin(provider, 'BAR', signer);
      
      setFactories({ PSG: psgFactoryInstance, BAR: barFactoryInstance });
      setFanTokens({ PSG: psgTokenInstance, BAR: barTokenInstance });
    }
  }, [provider, signer]);

  // Fetch all markets from both factories
  const fetchMarkets = useCallback(async (userAddress?: string) => {
    if (!factories.PSG && !factories.BAR) return;

    setLoading(true);
    setError(null);

    try {
      const allMarketInfos: MarketInfo[] = [];

      // Fetch PSG markets
      if (factories.PSG) {
        try {
          const psgMarketAddresses = await factories.PSG.getAllMarkets();
          const psgMarketPromises = psgMarketAddresses.map(async (address) => {
            const market = new PredictionMarket(address, provider!, signer);
            const data = await market.getMarketData(userAddress);
            return { address, data };
          });
          const psgMarketInfos = await Promise.all(psgMarketPromises);
          allMarketInfos.push(...psgMarketInfos);
        } catch (err) {
          console.error('Error fetching PSG markets:', err);
        }
      }

      // Fetch BAR markets
      if (factories.BAR) {
        try {
          const barMarketAddresses = await factories.BAR.getAllMarkets();
          const barMarketPromises = barMarketAddresses.map(async (address) => {
            const market = new PredictionMarket(address, provider!, signer);
            const data = await market.getMarketData(userAddress);
            return { address, data };
          });
          const barMarketInfos = await Promise.all(barMarketPromises);
          allMarketInfos.push(...barMarketInfos);
        } catch (err) {
          console.error('Error fetching BAR markets:', err);
        }
      }

      setMarkets(allMarketInfos);
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError('Failed to fetch markets');
    } finally {
      setLoading(false);
    }
  }, [factories, provider, signer]);

  // Fetch user balance for specific coin
  const fetchUserBalance = useCallback(async (userAddress: string, coin: 'PSG' | 'BAR' = 'PSG') => {
    const token = fanTokens[coin];
    if (!token) return;

    try {
      const balance = await token.balanceOf(userAddress);
      setUserBalances(prev => ({ ...prev, [coin]: balance }));
    } catch (err) {
      console.error(`Error fetching ${coin} user balance:`, err);
      setError(`Failed to fetch ${coin} user balance`);
    }
  }, [fanTokens]);

  // Place a bet
  const placeBet = useCallback(async (
    marketAddress: string,
    voteYes: boolean,
    amount: string,
    userAddress: string,
    coin: 'PSG' | 'BAR' = 'PSG'
  ) => {
    const token = fanTokens[coin];
    if (!token || !provider || !signer) {
      throw new Error('Contracts not initialized');
    }

    try {
      const market = new PredictionMarket(marketAddress, provider, signer);
      const amountBN = token.parseAmount(amount);

      // Check if approval is needed
      const needsApproval = await token.needsApproval(userAddress, marketAddress, amountBN);
      
      if (needsApproval) {
        // Approve first
        await token.approve(marketAddress, amountBN);
      }

      // Place the bet
      const receipt = await market.placeBet(voteYes, amountBN);
      
      return receipt;
    } catch (err) {
      console.error('Error placing bet:', err);
      throw err;
    }
  }, [fanTokens, provider, signer]);

  // Check if user has approved a market
  const checkApproval = useCallback(async (
    userAddress: string,
    marketAddress: string,
    amount: string,
    coin: 'PSG' | 'BAR' = 'PSG'
  ): Promise<boolean> => {
    const token = fanTokens[coin];
    if (!token) return false;

    try {
      const amountBN = token.parseAmount(amount);
      const needsApproval = await token.needsApproval(userAddress, marketAddress, amountBN);
      return !needsApproval;
    } catch (err) {
      console.error('Error checking approval:', err);
      return false;
    }
  }, [fanTokens]);

  // Approve market to spend tokens
  const approveMarket = useCallback(async (
    marketAddress: string,
    amount: string,
    coin: 'PSG' | 'BAR' = 'PSG'
  ) => {
    const token = fanTokens[coin];
    if (!token || !signer) {
      throw new Error('Contracts not initialized');
    }

    try {
      const amountBN = token.parseAmount(amount);
      const receipt = await token.approve(marketAddress, amountBN);
      return receipt;
    } catch (err) {
      console.error('Error approving market:', err);
      throw err;
    }
  }, [fanTokens, signer]);

  // Resolve market (only creator)
  const resolveMarket = useCallback(async (
    marketAddress: string,
    outcomeIsYes: boolean
  ) => {
    if (!provider || !signer) {
      throw new Error('Contracts not initialized');
    }

    try {
      const market = new PredictionMarket(marketAddress, provider, signer);
      const receipt = await market.resolveMarket(outcomeIsYes);
      
      return receipt;
    } catch (err) {
      console.error('Error resolving market:', err);
      throw err;
    }
  }, [provider, signer]);

  return {
    factories,
    fanTokens,
    markets,
    loading,
    error,
    userBalances,
    fetchMarkets,
    fetchUserBalance,
    placeBet,
    checkApproval,
    approveMarket,
    resolveMarket
  };
}; 
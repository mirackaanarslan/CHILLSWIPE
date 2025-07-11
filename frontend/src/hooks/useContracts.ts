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
  const [factory, setFactory] = useState<PredictionFactory | null>(null);
  const [fanToken, setFanToken] = useState<FanToken | null>(null);
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<bigint | null>(null);

  // Initialize contracts
  useEffect(() => {
    if (provider) {
      const factoryInstance = new PredictionFactory(provider, signer);
      const tokenInstance = new FanToken(provider, signer);
      setFactory(factoryInstance);
      setFanToken(tokenInstance);
    }
  }, [provider, signer]);

  // Fetch all markets
  const fetchMarkets = useCallback(async (userAddress?: string) => {
    if (!factory) return;

    setLoading(true);
    setError(null);

    try {
      const marketAddresses = await factory.getAllMarkets();
      const marketPromises = marketAddresses.map(async (address) => {
        const market = new PredictionMarket(address, provider!, signer);
        const data = await market.getMarketData(userAddress);
        return { address, data };
      });

      const marketInfos = await Promise.all(marketPromises);
      setMarkets(marketInfos);
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError('Failed to fetch markets');
    } finally {
      setLoading(false);
    }
  }, [factory, provider, signer]);

  // Fetch user balance
  const fetchUserBalance = useCallback(async (userAddress: string) => {
    if (!fanToken) return;

    try {
      const balance = await fanToken.balanceOf(userAddress);
      setUserBalance(balance);
    } catch (err) {
      console.error('Error fetching user balance:', err);
      setError('Failed to fetch user balance');
    }
  }, [fanToken]);

  // Place a bet
  const placeBet = useCallback(async (
    marketAddress: string,
    voteYes: boolean,
    amount: string,
    userAddress: string
  ) => {
    if (!fanToken || !provider || !signer) {
      throw new Error('Contracts not initialized');
    }

    try {
      const market = new PredictionMarket(marketAddress, provider, signer);
      const amountBN = fanToken.parseAmount(amount);

      // Check if approval is needed
      const needsApproval = await fanToken.needsApproval(userAddress, marketAddress, amountBN);
      
      if (needsApproval) {
        // Approve first
        await fanToken.approve(marketAddress, amountBN);
      }

      // Place the bet
      const receipt = await market.placeBet(voteYes, amountBN);
      
      return receipt;
    } catch (err) {
      console.error('Error placing bet:', err);
      throw err;
    }
  }, [fanToken, provider, signer]);

  // Check if user has approved a market
  const checkApproval = useCallback(async (
    userAddress: string,
    marketAddress: string,
    amount: string
  ): Promise<boolean> => {
    if (!fanToken) return false;

    try {
      const amountBN = fanToken.parseAmount(amount);
      const needsApproval = await fanToken.needsApproval(userAddress, marketAddress, amountBN);
      return !needsApproval;
    } catch (err) {
      console.error('Error checking approval:', err);
      return false;
    }
  }, [fanToken]);

  // Approve market to spend tokens
  const approveMarket = useCallback(async (
    marketAddress: string,
    amount: string
  ) => {
    if (!fanToken || !signer) {
      throw new Error('Contracts not initialized');
    }

    try {
      const amountBN = fanToken.parseAmount(amount);
      const receipt = await fanToken.approve(marketAddress, amountBN);
      return receipt;
    } catch (err) {
      console.error('Error approving market:', err);
      throw err;
    }
  }, [fanToken, signer]);

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
    factory,
    fanToken,
    markets,
    loading,
    error,
    userBalance,
    fetchMarkets,
    fetchUserBalance,
    placeBet,
    checkApproval,
    approveMarket,
    resolveMarket
  };
}; 
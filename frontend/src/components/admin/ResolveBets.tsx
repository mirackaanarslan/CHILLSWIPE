'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { PredictionMarket } from '@/contracts/PredictionMarket';
import { getUnresolvedMarketsWithQuestions, updateMarketAddress } from '@/lib/admin';
import { Market, Question } from '@/types/supabase';
import { betsService } from '@/lib/supabase-service';
import toast from 'react-hot-toast';

interface MarketInfo extends Market {
  question: Question;
  totalYes: bigint;
  totalNo: bigint;
  endTime: bigint;
  resolved: boolean;
  outcome: number;
  creator: string;
}

type FilterType = 'all' | 'active' | 'resolved';

export const ResolveBets: React.FC = () => {
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
  const [allMarkets, setAllMarkets] = useState<MarketInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Filter markets based on current filter
  useEffect(() => {
    if (filter === 'all') {
      setMarkets(allMarkets);
    } else if (filter === 'active') {
      setMarkets(allMarkets.filter(market => !market.resolved));
    } else if (filter === 'resolved') {
      setMarkets(allMarkets.filter(market => market.resolved));
    }
  }, [filter, allMarkets]);

  const loadMarkets = async () => {
    console.log('=== LOAD MARKETS DEBUG ===');
    console.log('Public Client:', publicClient);
    
    if (!publicClient) {
      console.log('❌ No public client available');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Loading unresolved markets from database...');
      
      // Get unresolved markets from database with question details
      const dbMarkets = await getUnresolvedMarketsWithQuestions();
      console.log('📋 Database markets found:', dbMarkets.length);
      console.log('📋 Database markets data:', dbMarkets);
      
      // Debug: Check question data for each market
      dbMarkets.forEach((market, index) => {
        console.log(`🔍 Market ${index + 1} question data:`, {
          marketId: market.id,
          questionId: market.question_id,
          question: market.question,
          questionTitle: market.question?.title,
          hasQuestion: !!market.question
        });
      });
      
      if (dbMarkets.length === 0) {
        console.log('📋 No unresolved markets found');
        setMarkets([]);
        return;
      }
      
      // Load contract data for each market
      const marketPromises = dbMarkets.map(async (dbMarket) => {
        console.log(`🔄 Processing market ${dbMarket.id}:`);
        console.log(`   - Market address: ${dbMarket.market_address}`);
        console.log(`   - Question ID: ${dbMarket.question_id}`);
        console.log(`   - Token symbol: ${dbMarket.token_symbol}`);
        
        // If no market address, skip this market
        if (!dbMarket.market_address) {
          console.log(`⚠️ Market ${dbMarket.id} has no contract address, skipping`);
          return null;
        }
        
        try {
          // Convert wagmi client to ethers provider
          const provider = new ethers.BrowserProvider(publicClient as any);
          const market = new PredictionMarket(dbMarket.market_address, provider);
          const data = await market.loadData();
          
          console.log(`✅ Market ${dbMarket.id} contract data loaded:`, {
            question: data.question,
            totalYes: data.totalYes.toString(),
            totalNo: data.totalNo.toString(),
            resolved: data.resolved,
            outcome: data.outcome
          });
          
          // Get creator address
          let creator = 'Unknown';
          try {
            creator = await market.contract.creator();
            console.log(`📋 Market ${dbMarket.id} creator:`, creator);
          } catch (error) {
            console.error(`❌ Failed to get market ${dbMarket.id} creator:`, error);
          }
          
          return {
            ...dbMarket,
            totalYes: data.totalYes,
            totalNo: data.totalNo,
            endTime: data.endTime,
            resolved: data.resolved,
            outcome: data.outcome,
            creator
          };
        } catch (error) {
          console.error(`❌ Failed to load market ${dbMarket.id} at ${dbMarket.market_address}:`, error);
          return null;
        }
      });

      const marketData = await Promise.all(marketPromises);
      const validMarkets = marketData.filter(market => market !== null) as MarketInfo[];
      console.log('✅ Valid markets loaded:', validMarkets.length);
      console.log('✅ Valid markets data:', validMarkets);
      setAllMarkets(validMarkets); // Store all valid markets
    } catch (error) {
      console.error('❌ Failed to load markets:', error);
      toast.error('Failed to load prediction markets');
    } finally {
      setLoading(false);
      console.log('=== END LOAD MARKETS DEBUG ===');
    }
  };

  useEffect(() => {
    if (publicClient) {
      loadMarkets();
    }
  }, [publicClient]);

  const handleResolveMarket = async (marketAddress: string, outcomeIsYes: boolean) => {
    console.log('=== RESOLVE MARKET DEBUG ===');
    console.log('Market Address:', marketAddress);
    console.log('Outcome:', outcomeIsYes);
    console.log('User Address:', address);
    console.log('Wallet Client:', walletClient);

    if (!address || !walletClient) {
      console.log('❌ Wallet not connected');
      toast.error('Please connect your wallet first');
      return;
    }

    setResolving(marketAddress);

    try {
      console.log('🔄 Converting wagmi client to ethers provider...');
      const provider = new ethers.BrowserProvider(walletClient as any);
      console.log('✅ Provider created:', provider);

      console.log('🔄 Getting signer...');
      const signer = await provider.getSigner();
      console.log('✅ Signer created:', signer);
      console.log('Signer address:', await signer.getAddress());

      console.log('🔄 Creating PredictionMarket instance...');
      const market = new PredictionMarket(marketAddress, provider, signer);
      console.log('✅ Market instance created:', market);

      // Debug: Check contract state before resolving
      console.log('🔄 Checking contract state...');
      try {
        const creator = await market.contract.creator();
        console.log('📋 Contract Creator:', creator);
        console.log('📋 User Address:', address);
        console.log('📋 Is Creator?', creator.toLowerCase() === address.toLowerCase());
      } catch (error) {
        console.error('❌ Failed to get creator:', error);
      }

      try {
        const resolved = await market.contract.resolved();
        console.log('📋 Already Resolved?', resolved);
      } catch (error) {
        console.error('❌ Failed to check resolved status:', error);
      }

      try {
        const endTime = await market.contract.endTime();
        const currentTime = Math.floor(Date.now() / 1000);
        console.log('📋 End Time:', endTime.toString());
        console.log('📋 Current Time:', currentTime);
        console.log('📋 Time Remaining:', Number(endTime) - currentTime, 'seconds');
        console.log('📋 Can Resolve?', currentTime >= Number(endTime));
      } catch (error) {
        console.error('❌ Failed to get endTime:', error);
      }

      // Call resolveMarket directly with explicit gas limit
      console.log('🔄 Calling resolveMarket...');
      const tx = await market.contract.resolveMarket(outcomeIsYes, {
        gasLimit: 500000 // Bypass gas estimation
      });
      console.log('✅ Transaction sent:', tx);
      
      console.log('🔄 Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);
      
      // Update bet statuses for this question
      try {
        console.log('🔄 Updating bet statuses for question...');
        const outcome = outcomeIsYes ? 'YES' : 'NO';
        
        // Find the market to get question_id
        const marketInfo = allMarkets.find(m => m.market_address === marketAddress);
        if (marketInfo) {
          await betsService.updateBetStatusesForQuestion(marketInfo.question_id, outcome);
          console.log('✅ Bet statuses updated successfully');
          toast.success(`Market resolved and bet statuses updated! Outcome: ${outcome}`);
        } else {
          console.log('⚠️ Could not find market info for bet status update');
          toast.success(`Market resolved successfully! Outcome: ${outcome}`);
        }
      } catch (betUpdateError) {
        console.error('❌ Failed to update bet statuses:', betUpdateError);
        toast.success(`Market resolved successfully! Outcome: ${outcomeIsYes ? 'YES' : 'NO'}`);
        toast.error('Warning: Bet statuses could not be updated');
      }
      
      loadMarkets(); // Reload markets to show updated status
    } catch (error: any) {
      console.error('❌ RESOLVE MARKET ERROR:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error data:', error.data);
      console.error('Error transaction:', error.transaction);
      
      // Try to decode the error if it has data
      if (error.data) {
        console.log('🔍 Error data found, attempting to decode...');
        try {
          const iface = new ethers.Interface([
            'error OnlyCreator()',
            'error AlreadyResolved()',
            'error MarketNotEnded()',
            'error InvalidOutcome()',
            'error InsufficientBalance()',
            'error TransferFailed()'
          ]);
          const decodedError = iface.parseError(error.data);
          console.log('🔍 Decoded error:', decodedError);
          toast.error(`Contract Error: ${decodedError.name}`);
          return;
        } catch (decodeError) {
          console.log('🔍 Could not decode error data:', decodeError);
        }
      }
      
      // Handle specific contract errors
      if (error.message?.includes('Only creator can resolve') || error.message?.includes('missing revert data')) {
        console.log('🚫 Creator permission error detected');
        toast.error('Only the market creator can resolve this market');
      } else if (error.message?.includes('Already resolved')) {
        console.log('🚫 Already resolved error detected');
        toast.error('This market has already been resolved');
      } else if (error.message?.includes('Too early')) {
        console.log('🚫 Too early error detected');
        toast.error('Market has not ended yet. You can only resolve after the end time.');
      } else if (error.message?.includes('User rejected') || error.message?.includes('user rejected')) {
        console.log('🚫 User rejected error detected');
        toast.error('Transaction was cancelled by user');
      } else {
        console.log('🚫 Unknown error detected');
        toast.error('Failed to resolve market. Please check your wallet and try again.');
      }
    } finally {
      setResolving(null);
      console.log('=== END RESOLVE MARKET DEBUG ===');
    }
  };

  const formatEther = (value: bigint) => {
    return ethers.formatEther(value);
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const getOutcomeText = (outcome: number) => {
    switch (outcome) {
      case 1: return 'YES';
      case 2: return 'NO';
      default: return 'Not resolved';
    }
  };

  const getOutcomeColor = (outcome: number) => {
    switch (outcome) {
      case 1: return 'text-green-600';
      case 2: return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="resolve-bets">
        <div className="loading-container">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prediction markets...</p>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="resolve-bets">
        <div className="empty-state">
          <div className="empty-icon">
            <span className="empty-symbol">🔗</span>
          </div>
          <h3 className="empty-title">Wallet Connection Required</h3>
          <p className="empty-description">Please connect your wallet to resolve prediction markets. Only the market creator can resolve markets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resolve-bets">
      <div className="filter-section">
        <div className="filter-container">
          <label htmlFor="market-filter" className="filter-label">Filter Markets:</label>
          <select
            id="market-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="filter-select"
          >
            <option value="all">All Markets ({allMarkets.length})</option>
            <option value="active">Active Markets ({allMarkets.filter(m => !m.resolved).length})</option>
            <option value="resolved">Resolved Markets ({allMarkets.filter(m => m.resolved).length})</option>
          </select>
        </div>
      </div>
      
      <div className="markets-grid">
        {markets.map((market) => (
          <div key={market.id} className="market-card">
            <div className="market-header">
              <div className="market-coin">
                <span className="coin-name">{market.token_symbol}</span>
              </div>
              <div className={`market-status ${market.resolved ? 'resolved' : 'active'}`}>
                {market.resolved ? 'Resolved' : 'Active'}
              </div>
            </div>

            <div className="market-content">
              <h3 className="market-question">
                {market.question?.title || 'Question title not available'}
                {!market.question?.title && (
                  <span style={{ fontSize: '12px', color: '#ff6b6b', display: 'block' }}>
                    Debug: Question object: {JSON.stringify(market.question)}
                  </span>
                )}
              </h3>
              
              <div className="market-stats">
                <div className="stat-row">
                  <span className="stat-label">Market Address:</span>
                  <span className="stat-value market-address">
                    {market.market_address}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Question:</span>
                  <span className="stat-value question-title">
                    {market.question?.title || `Question ID: ${market.question_id}`}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Creator:</span>
                  <span className="stat-value creator-address">
                    {market.creator === address ? 'You (Creator)' : market.creator}
                    {address && (
                      <span style={{ fontSize: '10px', color: '#666', display: 'block' }}>
                        Your wallet: {address.slice(0, 6)}...{address.slice(-4)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Total YES:</span>
                  <span className="stat-value">{formatEther(market.totalYes)} CHZ</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Total NO:</span>
                  <span className="stat-value">{formatEther(market.totalNo)} CHZ</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">End Time:</span>
                  <span className="stat-value">{formatDate(market.endTime)}</span>
                </div>
                {market.resolved && (
                  <div className="stat-row">
                    <span className="stat-label">Outcome:</span>
                    <span className={`stat-value ${getOutcomeColor(market.outcome)}`}>
                      {getOutcomeText(market.outcome)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {!market.resolved && (
              <div className="market-actions">
                {market.creator === address ? (
                  <div className="resolve-buttons">
                    {(() => {
                      const currentTime = Math.floor(Date.now() / 1000);
                      const timeRemaining = Number(market.endTime) - currentTime;
                      const hours = Math.floor(timeRemaining / 3600);
                      const minutes = Math.floor((timeRemaining % 3600) / 60);
                      const isEnded = timeRemaining <= 0;
                      
                      return (
                        <>
                          {!isEnded && (
                            <div className="market-time-info">
                              <p>Market ends in {hours}h {minutes}m</p>
                              <p className="text-sm text-gray-500">You can resolve anytime as admin</p>
                            </div>
                          )}
                          {isEnded && (
                            <div className="market-ended-info">
                              <p>✅ Market has ended</p>
                              <p className="text-sm text-gray-500">Ready to resolve</p>
                            </div>
                          )}
                          <button
                            onClick={() => handleResolveMarket(market.market_address!, true)}
                            disabled={resolving === market.market_address}
                            className="resolve-btn resolve-yes"
                          >
                            {resolving === market.market_address ? 'Resolving...' : 'Resolve YES'}
                          </button>
                          <button
                            onClick={() => handleResolveMarket(market.market_address!, false)}
                            disabled={resolving === market.market_address}
                            className="resolve-btn resolve-no"
                          >
                            {resolving === market.market_address ? 'Resolving...' : 'Resolve NO'}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="not-creator-message">
                    <p>Only the market creator can resolve this market</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {markets.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <span className="empty-symbol">🏁</span>
          </div>
          <h3 className="empty-title">No unresolved prediction markets found</h3>
          <p className="empty-description">All markets have been resolved or no markets exist yet!</p>
        </div>
      )}
    </div>
  );
}; 
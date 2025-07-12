'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { PredictionMarket } from '@/contracts/PredictionMarket';
import toast from 'react-hot-toast';

interface MarketInfo {
  address: string;
  coin: 'PSG' | 'BAR';
  question: string;
  totalYes: bigint;
  totalNo: bigint;
  endTime: bigint;
  resolved: boolean;
  outcome: number;
  creator: string;
}

const MARKET_ADDRESSES = {
  PSG: '0xa57bef0f00F665112e2a102Fd3cDad260F097475',
  BAR: '0x88C3c2D6D7A045ED8009435db32eAB6bed75F283'
};

export const ResolveBets: React.FC = () => {
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const loadMarkets = async () => {
    console.log('=== LOAD MARKETS DEBUG ===');
    console.log('Public Client:', publicClient);
    
    if (!publicClient) {
      console.log('❌ No public client available');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Loading markets from addresses:', MARKET_ADDRESSES);
      
      const marketPromises = Object.entries(MARKET_ADDRESSES).map(async ([coin, address]) => {
        console.log(`🔄 Loading ${coin} market at ${address}...`);
        
        try {
          // Convert wagmi client to ethers provider
          const provider = new ethers.BrowserProvider(publicClient as any);
          const market = new PredictionMarket(address, provider);
          const data = await market.loadData();
          
          console.log(`✅ ${coin} market data loaded:`, {
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
            console.log(`📋 ${coin} market creator:`, creator);
          } catch (error) {
            console.error(`❌ Failed to get ${coin} creator:`, error);
          }
          
          return {
            address,
            coin: coin as 'PSG' | 'BAR',
            question: data.question,
            totalYes: data.totalYes,
            totalNo: data.totalNo,
            endTime: data.endTime,
            resolved: data.resolved,
            outcome: data.outcome,
            creator
          };
        } catch (error) {
          console.error(`❌ Failed to load ${coin} market ${address}:`, error);
          return {
            address,
            coin: coin as 'PSG' | 'BAR',
            question: 'Failed to load question',
            totalYes: BigInt(0),
            totalNo: BigInt(0),
            endTime: BigInt(0),
            resolved: false,
            outcome: 0,
            creator: 'Unknown'
          };
        }
      });

      const marketData = await Promise.all(marketPromises);
      console.log('✅ All markets loaded:', marketData);
      setMarkets(marketData);
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

      try {
        const question = await market.contract.question();
        console.log('📋 Question:', question);
      } catch (error) {
        console.error('❌ Failed to get question:', error);
      }

      // Test other contract functions
      try {
        const totalYes = await market.contract.totalYes();
        console.log('📋 Total YES:', totalYes.toString());
      } catch (error) {
        console.error('❌ Failed to get totalYes:', error);
      }

      try {
        const totalNo = await market.contract.totalNo();
        console.log('📋 Total NO:', totalNo.toString());
      } catch (error) {
        console.error('❌ Failed to get totalNo:', error);
      }

      // Test if contract is properly initialized
      try {
        const initialized = await market.contract.initialized();
        console.log('📋 Contract Initialized:', initialized);
      } catch (error) {
        console.log('📋 Contract has no initialized function (this is normal)');
      }

      // Check if contract exists and is deployed
      try {
        const code = await provider.getCode(marketAddress);
        console.log('📋 Contract Code Length:', code.length);
        console.log('📋 Contract Deployed?', code !== '0x');
      } catch (error) {
        console.error('❌ Failed to check contract code:', error);
      }

      // Check current block and network
      try {
        const blockNumber = await provider.getBlockNumber();
        console.log('📋 Current Block:', blockNumber);
        const network = await provider.getNetwork();
        console.log('📋 Network:', network);
      } catch (error) {
        console.error('❌ Failed to get network info:', error);
      }

      // Debug: Check contract ABI and interface
      console.log('🔄 Checking contract interface...');
      console.log('📋 Contract Interface:', market.contract.interface);
      console.log('📋 Contract ABI:', market.contract.interface.format());
      
      // Try to get function fragment
      try {
        const resolveFragment = market.contract.interface.getFunction('resolveMarket');
        console.log('📋 Resolve Function Fragment:', resolveFragment);
        console.log('📋 Function Signature:', resolveFragment.format());
      } catch (error) {
        console.error('❌ Failed to get function fragment:', error);
      }

      // Try to call the function directly with low-level approach
      console.log('🔄 Trying low-level call...');
      try {
        const data = market.contract.interface.encodeFunctionData('resolveMarket', [outcomeIsYes]);
        console.log('📋 Encoded Data:', data);
        
        // Try to call without gas estimation first
        const result = await provider.call({
          to: marketAddress,
          data: data,
          from: address
        });
        console.log('📋 Low-level call result:', result);
      } catch (lowLevelError) {
        console.error('❌ Low-level call failed:', lowLevelError);
        console.error('Low-level error details:', {
          code: lowLevelError.code,
          message: lowLevelError.message,
          data: lowLevelError.data
        });
      }
      
      console.log('🔄 Calling resolveMarket...');
      console.log('Parameters:', { outcomeIsYes });
      
      // Try to call the function with more explicit parameters
      console.log('🔄 Preparing transaction...');
      const encodedData = market.contract.interface.encodeFunctionData('resolveMarket', [outcomeIsYes]);
      console.log('📋 Transaction Data:', encodedData);
      
      // Get current gas price for reference
      try {
        const gasPrice = await provider.getFeeData();
        console.log('📋 Current Gas Price:', gasPrice);
      } catch (error) {
        console.log('📋 Using default gas price');
      }
      
      // Try to send transaction with explicit gas limit
      console.log('🔄 Sending transaction...');
      
      // Create transaction data manually
      const txData = market.contract.interface.encodeFunctionData('resolveMarket', [outcomeIsYes]);
      console.log('📋 Final Transaction Data:', txData);
      
      // Create contract instance directly with signer
      console.log('🔄 Creating contract instance with signer...');
      console.log('📋 Market Address:', marketAddress);
      console.log('📋 User Address:', address);
      
      const contract = new ethers.Contract(
        marketAddress,
        [
          'function question() public view returns (string)',
          'function totalYes() public view returns (uint256)',
          'function totalNo() public view returns (uint256)',
          'function endTime() public view returns (uint256)',
          'function resolved() public view returns (bool)',
          'function outcome() public view returns (uint8)',
          'function creator() public view returns (address)',
          'function getUserBets(address user) public view returns (tuple(uint8 choice, uint256 amount)[])',
          'function placeBet(bool voteYes, uint256 amount) public',
          'function resolveMarket(bool outcomeIsYes) public',
          'function claim() public',
          'event BetPlaced(address indexed user, bool voteYes, uint256 amount)',
          'event MarketResolved(bool outcomeIsYes)'
        ],
        signer
      );
      
      console.log('✅ Contract instance created:', contract);
      
      // Check contract state before calling resolveMarket
      console.log('🔄 Checking contract state...');
      try {
        const creator = await contract.creator();
        console.log('📋 Contract Creator:', creator);
        console.log('📋 User Address:', address);
        console.log('📋 Is Creator?', creator.toLowerCase() === address.toLowerCase());
      } catch (error) {
        console.error('❌ Failed to get creator:', error);
      }
      
      try {
        const resolved = await contract.resolved();
        console.log('📋 Already Resolved?', resolved);
      } catch (error) {
        console.error('❌ Failed to check resolved status:', error);
      }
      
      try {
        const endTime = await contract.endTime();
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
      const tx = await contract.resolveMarket(outcomeIsYes, {
        gasLimit: 500000 // Bypass gas estimation
      });
      console.log('✅ Transaction sent:', tx);
      
      console.log('🔄 Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);
      
      toast.success(`Market resolved successfully! Outcome: ${outcomeIsYes ? 'YES' : 'NO'}`);
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
      <div className="markets-grid">
        {markets.map((market) => (
          <div key={market.address} className="market-card">
            <div className="market-header">
              <div className="market-coin">
                <span className="coin-icon">{market.coin === 'PSG' ? '🔴' : '🔵'}</span>
                <span className="coin-name">{market.coin}</span>
              </div>
              <div className={`market-status ${market.resolved ? 'resolved' : 'active'}`}>
                {market.resolved ? '✅ Resolved' : '⏳ Active'}
              </div>
            </div>

            <div className="market-content">
              <h3 className="market-question">{market.question}</h3>
              
              <div className="market-stats">
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
                            onClick={() => handleResolveMarket(market.address, true)}
                            disabled={resolving === market.address}
                            className="resolve-btn resolve-yes"
                          >
                            {resolving === market.address ? 'Resolving...' : 'Resolve YES'}
                          </button>
                          <button
                            onClick={() => handleResolveMarket(market.address, false)}
                            disabled={resolving === market.address}
                            className="resolve-btn resolve-no"
                          >
                            {resolving === market.address ? 'Resolving...' : 'Resolve NO'}
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
          <h3 className="empty-title">No prediction markets found</h3>
          <p className="empty-description">Create some prediction questions first!</p>
        </div>
      )}
    </div>
  );
}; 
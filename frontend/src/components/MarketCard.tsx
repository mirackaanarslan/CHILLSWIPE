import React, { useState } from 'react';
import { ethers } from 'ethers';
import { MarketData } from '../contracts/PredictionMarket';

interface MarketCardProps {
  marketAddress: string;
  data: MarketData;
  userAddress?: string;
  userBalance?: bigint;
  onPlaceBet: (marketAddress: string, voteYes: boolean, amount: string) => Promise<void>;
  onApprove: (marketAddress: string, amount: string) => Promise<void>;
  checkApproval: (userAddress: string, marketAddress: string, amount: string) => Promise<boolean>;
}

export const MarketCard: React.FC<MarketCardProps> = ({
  marketAddress,
  data,
  userAddress,
  userBalance,
  onPlaceBet,
  onApprove,
  checkApproval
}) => {
  const [betAmount, setBetAmount] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const formatBalance = (balance: bigint): string => {
    return ethers.formatUnits(balance, 18);
  };

  const formatAmount = (amount: bigint): string => {
    return ethers.formatUnits(amount, 18);
  };

  const handleBet = async (voteYes: boolean) => {
    if (!userAddress) {
      setError('Please connect your wallet');
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (userBalance && parseFloat(betAmount) > parseFloat(formatBalance(userBalance))) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if approval is needed
      const approved = await checkApproval(userAddress, marketAddress, betAmount);
      
      if (!approved) {
        // Approve first
        await onApprove(marketAddress, betAmount);
      }

      // Place the bet
      await onPlaceBet(marketAddress, voteYes, betAmount);
      
      // Reset form
      setBetAmount('1');
    } catch (err: any) {
      console.error('Error placing bet:', err);
      setError(err.message || 'Failed to place bet');
    } finally {
      setLoading(false);
    }
  };

  const isMarketEnded = () => {
    const now = Math.floor(Date.now() / 1000);
    return data.endTime < BigInt(now);
  };

  const getUserBetText = () => {
    if (!data.userBets || data.userBets.length === 0) return null;
    
    const totalAmount = data.userBets.reduce((sum, bet) => sum + bet.amount, 0n);
    const yesBets = data.userBets.filter(bet => bet.choice === 1);
    const noBets = data.userBets.filter(bet => bet.choice === 2);
    
          let text = `Your predictions: `;
    if (yesBets.length > 0) {
      const yesAmount = yesBets.reduce((sum, bet) => sum + bet.amount, 0n);
      text += `YES (${formatAmount(yesAmount)}) `;
    }
    if (noBets.length > 0) {
      const noAmount = noBets.reduce((sum, bet) => sum + bet.amount, 0n);
      text += `NO (${formatAmount(noAmount)}) `;
    }
    text += `PSG`;
    
    return text;
  };

  return (
    <div className="market-card">
      <div className="market-header">
        <h3 className="market-question">{data.question}</h3>
        <div className="market-status">
          {isMarketEnded() ? (
            <span className="status-ended">Ended</span>
          ) : (
            <span className="status-active">Active</span>
          )}
        </div>
      </div>

      <div className="market-stats">
        <div className="stat">
          <span className="stat-label">Total YES</span>
          <span className="stat-value">{formatAmount(data.totalYes)} PSG</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total NO</span>
          <span className="stat-value">{formatAmount(data.totalNo)} PSG</span>
        </div>
        <div className="stat">
          <span className="stat-label">End Time</span>
          <span className="stat-value">
            {new Date(Number(data.endTime) * 1000).toLocaleDateString()}
          </span>
        </div>
      </div>

      {data.userBets && data.userBets.length > 0 && (
        <div className="user-bet">
          <span className="user-bet-text">{getUserBetText()}</span>
        </div>
      )}

      {!isMarketEnded() && userAddress && (
        <div className="bet-section">
          <div className="bet-input">
            <label htmlFor="betAmount">Prediction Amount (PSG):</label>
            <input
              id="betAmount"
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              min="0.1"
              step="0.1"
              disabled={loading}
            />
            {userBalance && (
              <span className="balance-info">
                Balance: {formatBalance(userBalance)} PSG
              </span>
            )}
          </div>

          <div className="bet-buttons">
            <button
              className="bet-btn bet-yes"
              onClick={() => handleBet(true)}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Predict YES'}
            </button>
            <button
              className="bet-btn bet-no"
              onClick={() => handleBet(false)}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Predict NO'}
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
      )}

      {!userAddress && (
        <div className="connect-wallet-message">
          Connect your wallet to make predictions
        </div>
      )}

      <div className="market-address">
        <small>Market: {marketAddress.slice(0, 6)}...{marketAddress.slice(-4)}</small>
      </div>
    </div>
  );
}; 
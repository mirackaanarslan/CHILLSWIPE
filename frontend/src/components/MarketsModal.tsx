import React from 'react';
import { MarketCard } from './MarketCard';
import { MarketInfo } from '@/hooks/useContracts';

interface MarketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  markets: MarketInfo[];
  userAddress?: string;
  userBalance?: bigint;
  onPlaceBet: (marketAddress: string, voteYes: boolean, amount: string, userAddress: string) => Promise<any>;
  onApprove: (marketAddress: string, amount: string) => Promise<any>;
  checkApproval: (userAddress: string, marketAddress: string, amount: string) => Promise<boolean>;
}

export const MarketsModal: React.FC<MarketsModalProps> = ({
  isOpen,
  onClose,
  markets,
  userAddress,
  userBalance,
  onPlaceBet,
  onApprove,
  checkApproval
}) => {
  if (!isOpen) return null;

  const handlePlaceBet = async (marketAddress: string, voteYes: boolean, amount: string) => {
    if (!userAddress) return;
    await onPlaceBet(marketAddress, voteYes, amount, userAddress);
  };

  const handleApprove = async (marketAddress: string, amount: string) => {
    await onApprove(marketAddress, amount);
  };

  return (
    <div className="markets-modal-overlay" onClick={onClose}>
      <div className="markets-modal" onClick={(e) => e.stopPropagation()}>
        <div className="markets-modal-header">
          <h2>Prediction Markets</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="markets-modal-content">
          {markets.length === 0 ? (
            <div className="no-markets">
              <p>No prediction markets available yet.</p>
            </div>
          ) : (
            <div className="markets-grid">
              {markets.map((market) => (
                <MarketCard
                  key={market.address}
                  marketAddress={market.address}
                  data={market.data}
                  userAddress={userAddress}
                  userBalance={userBalance}
                  onPlaceBet={handlePlaceBet}
                  onApprove={handleApprove}
                  checkApproval={checkApproval}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
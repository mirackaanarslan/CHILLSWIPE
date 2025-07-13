'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Edit3, Save, X, TrendingUp, Award, Clock, CheckCircle, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BetHistory {
  id: string;
  questionId: string;
  questionTitle: string;
  questionDescription: string;
  category: string;
  coin: string;
  outcome: 'YES' | 'NO';
  amount: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled' | 'claimed';
  winnings: number;
  marketAddress: string;
  createdAt: string;
  resolvedAt?: string;
  endTime?: string;
}

type BetFilter = 'all' | 'pending' | 'won' | 'lost' | 'claimed';

export default function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [betFilter, setBetFilter] = useState<BetFilter>('all');
  const [betHistory, setBetHistory] = useState<BetHistory[]>([]);
  const [claimableAmount, setClaimableAmount] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [formData, setFormData] = useState({
    favorite_team: user?.favorite_team || 'PSG',
  });

  // Fetch bet history when component mounts or user changes
  useEffect(() => {
    if (isOpen && user?.wallet_address) {
      fetchBetHistory();
      fetchClaimableAmount();
    }
  }, [isOpen, user?.wallet_address]);

  const fetchBetHistory = async () => {
    if (!user?.wallet_address) return;
    
    setIsLoadingHistory(true);
    try {
      // Use the same pattern as admin components
      const { betsService } = await import('@/lib/supabase-service');
      
      console.log('🔍 Fetching bet history for wallet:', user.wallet_address);
      const bets = await betsService.getByWalletAddress(user.wallet_address.toLowerCase());
      
      console.log('✅ Found bets:', bets.length);

      // Transform data for frontend
      const transformedBets = bets.map(bet => ({
        id: bet.id,
        questionId: bet.question_id,
        questionTitle: bet.questions?.title || 'Unknown Question',
        questionDescription: bet.questions?.description || 'No description available',
        category: bet.questions?.category || 'match_result',
        coin: bet.questions?.coin || 'PSG',
        outcome: bet.outcome,
        amount: parseFloat(bet.amount),
        status: bet.status,
        winnings: parseFloat(bet.winnings || '0'),
        marketAddress: bet.market_address || '0x...',
        createdAt: bet.created_at,
        resolvedAt: bet.resolved_at,
        endTime: bet.questions?.end_time || bet.created_at
      }));

      setBetHistory(transformedBets);
      
    } catch (error) {
      console.error('Error fetching bet history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchClaimableAmount = async () => {
    if (!user?.wallet_address) return;
    
    try {
      // Use the same pattern as admin components
      const { betsService } = await import('@/lib/supabase-service');
      
      console.log('🔍 Fetching claimable amount for wallet:', user.wallet_address);
      const allBets = await betsService.getByWalletAddress(user.wallet_address.toLowerCase());
      
      // Filter for won bets with winnings
      const claimableBets = allBets.filter(bet => bet.status === 'won' && parseFloat(bet.winnings || '0') > 0);
      const totalClaimable = claimableBets.reduce((sum, bet) => sum + parseFloat(bet.winnings || '0'), 0);
      
      console.log('✅ Found claimable bets:', claimableBets.length, 'Total:', totalClaimable);
      setClaimableAmount(totalClaimable);
      
    } catch (error) {
      console.error('Error fetching claimable amount:', error);
    }
  };

  const handleClaim = async () => {
    if (!user?.wallet_address || claimableAmount <= 0) return;
    
    setIsClaiming(true);
    try {
      console.log('🎯 CLAIM PROCESS STARTED');
      console.log('Wallet:', user.wallet_address);
      console.log('Claimable amount:', claimableAmount);
      
      // Get provider and signer
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get claimable bets with market addresses
      const { betsService } = await import('@/lib/supabase-service');
      const allBets = await betsService.getByWalletAddress(user.wallet_address.toLowerCase());
      const claimableBets = allBets.filter(bet => bet.status === 'won' && parseFloat(bet.winnings || '0') > 0);
      
      console.log('📋 Found claimable bets:', claimableBets.length);
      
      // Group bets by market address
      const betsByMarket = claimableBets.reduce((acc, bet) => {
        if (bet.market_address) {
          if (!acc[bet.market_address]) {
            acc[bet.market_address] = [];
          }
          acc[bet.market_address].push(bet);
        }
        return acc;
      }, {} as Record<string, any[]>);
      
      console.log('📋 Bets grouped by market:', Object.keys(betsByMarket));
      
      // Claim from each market
      for (const [marketAddress, bets] of Object.entries(betsByMarket)) {
        try {
          console.log(`🚀 Claiming from market: ${marketAddress}`);
          
          // Create market contract instance
          const marketContract = new ethers.Contract(marketAddress, [
            'function claim() external',
            'function resolved() public view returns (bool)',
            'function claimed(address) public view returns (bool)'
          ], signer);
          
          // Check if market is resolved
          const isResolved = await marketContract.resolved();
          if (!isResolved) {
            console.log(`⚠️ Market ${marketAddress} not resolved yet, skipping`);
            continue;
          }
          
          // Check if already claimed
          const isClaimed = await marketContract.claimed(user.wallet_address);
          if (isClaimed) {
            console.log(`⚠️ Already claimed from market ${marketAddress}, skipping`);
            continue;
          }
          
          // Call claim function
          console.log(`📝 Calling claim() on market ${marketAddress}...`);
          const tx = await marketContract.claim();
          console.log(`📝 Claim transaction sent: ${tx.hash}`);
          
          // Wait for confirmation
          const receipt = await tx.wait();
          console.log(`✅ Claim confirmed: ${receipt.hash}`);
          
          // Update bet statuses in database
          for (const bet of bets) {
            try {
              console.log(`🔄 Updating bet ${bet.id} to claimed status...`);
              await betsService.update(bet.id, { 
                status: 'claimed'
                // resolved_at zaten admin resolve ettiğinde doldurulmuş
              });
              console.log(`✅ Successfully updated bet ${bet.id}`);
            } catch (updateError) {
              console.error(`❌ Failed to update bet ${bet.id}:`, updateError);
              throw updateError; // Re-throw to stop the process
            }
          }
          
          console.log(`✅ Successfully claimed from market ${marketAddress}`);
          
        } catch (marketError) {
          console.error(`❌ Error claiming from market ${marketAddress}:`, marketError);
          // Continue with other markets
        }
      }
      
      console.log('✅ CLAIM PROCESS COMPLETED');
      
      toast.success('Successfully claimed all rewards!');
      
      // Refresh data
      await fetchBetHistory();
      await fetchClaimableAmount();
      
    } catch (error) {
      console.error('❌ CLAIM PROCESS ERROR:', error);
      toast.error('Failed to claim: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsClaiming(false);
    }
  };

  // Calculate statistics
  const totalBets = betHistory.length;
  const pendingBets = betHistory.filter(bet => bet.status === 'pending').length;
  const wonBets = betHistory.filter(bet => bet.status === 'won').length;
  const lostBets = betHistory.filter(bet => bet.status === 'lost').length;
  const claimedBets = betHistory.filter(bet => bet.status === 'claimed').length;
  const correctBets = betHistory.filter(bet => bet.status === 'won' || bet.status === 'claimed').length;
  const totalBetAmount = betHistory.reduce((sum, bet) => sum + bet.amount, 0);
  const totalWinnings = betHistory.reduce((sum, bet) => sum + bet.winnings, 0);
  const winRate = totalBets > 0 ? Math.round((correctBets / totalBets) * 100) : 0;

  // Filter bet history
  const filteredBets = betFilter === 'all' 
    ? betHistory 
    : betHistory.filter(bet => bet.status === betFilter);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!user) return;
    
    await updateProfile(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      favorite_team: user?.favorite_team || 'PSG',
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-blue-600';
      case 'won': return 'text-green-600';
      case 'lost': return 'text-red-600';
      case 'claimed': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'won': return <Award className="w-4 h-4" />;
      case 'lost': return <X className="w-4 h-4" />;
      case 'claimed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'match_result': 'Match Result',
      'total_goals': 'Total Goals',
      'goal_scorer': 'Goal Scorer',
      'first_goal': 'First Goal',
      'assists': 'Assists',
      'starting_xi': 'Starting XI',
      'red_cards': 'Red Cards',
      'yellow_cards': 'Yellow Cards',
      'penalty_call': 'Penalty Call',
      'var_decision': 'VAR Decision',
      'ligue_title': 'Ligue Title',
      'ucl_progress': 'UCL Progress',
      'top_scorer': 'Top Scorer',
      'top_assists': 'Top Assists',
      'clean_sheets': 'Clean Sheets',
      'player_transfer': 'Player Transfer',
      'coach_change': 'Coach Change',
      'loan_deal': 'Loan Deal',
      'fan_attendance': 'Fan Attendance',
      'stadium_full': 'Stadium Full',
      'social_buzz': 'Social Buzz',
      'tweet_count': 'Tweet Count'
    };
    return categoryMap[category] || category;
  };

  if (loading) {
    return (
      <div className="profile-modal">
        <div className="profile-modal-content">
          <div className="modal-content">
            <div className="loading-spinner"></div>
            <p className="text-center mt-4">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-modal">
      <div className="profile-modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Profile & Prediction History</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Wallet Address Section */}
          <div className="wallet-address-section">
            <div className="wallet-icon">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="wallet-info">
              <p className="wallet-label">Wallet Address</p>
              <p className="wallet-address">
                {user?.wallet_address?.slice(0, 8)}...{user?.wallet_address?.slice(-6)}
              </p>
            </div>
          </div>

          {/* Bet Statistics Grid */}
          <div className="profile-stats">
            <div className="stat-card">
              <p className="stat-value swipes">{totalBets}</p>
              <p className="stat-label">Total Predictions</p>
            </div>
            <div className="stat-card">
              <p className="stat-value correct">{correctBets}</p>
              <p className="stat-label">Correct</p>
            </div>
            <div className="stat-card">
              <p className="stat-value winrate">{winRate}%</p>
              <p className="stat-label">Win Rate</p>
            </div>
            <div className="stat-card">
              <p className="stat-value total-amount">{totalBetAmount}</p>
              <p className="stat-label">Total Prediction</p>
            </div>
          </div>

          {/* Claimable Amount Section */}
          {claimableAmount > 0 && (
            <div className="claimable-section">
              <div className="claimable-info">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div className="claimable-details">
                  <p className="claimable-label">Claimable Rewards</p>
                  <p className="claimable-amount">{claimableAmount}</p>
                </div>
              </div>
              <button 
                onClick={handleClaim} 
                disabled={isClaiming}
                className="claim-all-button"
              >
                {isClaiming ? 'Claiming...' : 'Claim All'}
              </button>
            </div>
          )}

          {/* Bet Status Breakdown */}
          <div className="bet-status-breakdown">
            <div className="status-item">
              <div className="status-icon active">
                <Clock className="w-4 h-4" />
              </div>
              <div className="status-info">
                <p className="status-count">{pendingBets}</p>
                <p className="status-label">Pending</p>
              </div>
            </div>
            <div className="status-item">
              <div className="status-icon resolved">
                <Award className="w-4 h-4" />
              </div>
              <div className="status-info">
                <p className="status-count">{wonBets}</p>
                <p className="status-label">Won</p>
              </div>
            </div>
            <div className="status-item">
              <div className="status-icon lost">
                <X className="w-4 h-4" />
              </div>
              <div className="status-info">
                <p className="status-count">{lostBets}</p>
                <p className="status-label">Lost</p>
              </div>
            </div>
            <div className="status-item">
              <div className="status-icon claimed">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="status-info">
                <p className="status-count">{claimedBets}</p>
                <p className="status-label">Claimed</p>
              </div>
            </div>
          </div>

          {/* Prediction History Section */}
          <div className="bet-history-section">
            <div className="history-header">
                              <h3 className="history-title">Prediction History</h3>
              <div className="history-filter">
                <select
                  value={betFilter}
                  onChange={(e) => setBetFilter(e.target.value as BetFilter)}
                  className="history-filter-select"
                >
                                      <option value="all">All Predictions ({totalBets})</option>
                  <option value="pending">Pending ({pendingBets})</option>
                  <option value="won">Won ({wonBets})</option>
                  <option value="lost">Lost ({lostBets})</option>
                  <option value="claimed">Claimed ({claimedBets})</option>
                </select>
              </div>
            </div>

            <div className="bet-history-list">
              {isLoadingHistory ? (
                <div className="empty-history">
                  <p>Loading prediction history...</p>
                </div>
              ) : filteredBets.length === 0 ? (
                <div className="empty-history">
                  <p>No bets found for this filter</p>
                </div>
              ) : (
                filteredBets.map((bet) => (
                  <div key={bet.id} className="bet-history-item">
                    <div className="bet-header">
                      <div className="bet-status">
                        {getStatusIcon(bet.status)}
                        <span className={`bet-status-text ${getStatusColor(bet.status)}`}>
                          {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                        </span>
                      </div>
                      <div className="bet-amount">
                        {bet.amount}
                      </div>
                    </div>
                    
                    <div className="bet-content">
                      <h4 className="bet-question">{bet.questionTitle}</h4>
                      <div className="bet-details">
                        <span className={`bet-type ${bet.outcome === 'YES' ? 'bet-yes' : 'bet-no'}`}>
                          {bet.outcome}
                        </span>
                        <span className="bet-address">
                          {bet.marketAddress}
                        </span>
                      </div>
                      
                      {bet.status === 'won' && bet.winnings > 0 && (
                        <div className="bet-outcome">
                          <span className="outcome-label">Winnings:</span>
                          <span className="outcome-value">
                            {bet.winnings}
                          </span>
                        </div>
                      )}
                      
                      {bet.status === 'won' && bet.winnings > 0 && (
                        <div className="claimable-indicator">
                          <span className="claimable-text">Claimable</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="bet-footer">
                      <span className="bet-date">{formatDate(bet.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="profile-form">
            {isEditing ? (
              <>
                                  <div className="form-group">
                    <label className="form-label">
                      Favorite Team
                    </label>
                    <select
                      value={formData.favorite_team}
                      onChange={(e) => setFormData({ ...formData, favorite_team: e.target.value })}
                      className="form-select"
                    >
                      <option value="PSG">Paris Saint-Germain</option>
                      <option value="BAR">Barcelona</option>
                    </select>
                  </div>

                <div className="form-actions">
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">
                    Favorite Team
                  </label>
                  <p className="text-gray-900">{user?.favorite_team || 'Not set'}</p>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary w-full"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              </>
            )}
          </div>

          {/* Member Since */}
          <div className="modal-footer">
            <p className="modal-footer-text">
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
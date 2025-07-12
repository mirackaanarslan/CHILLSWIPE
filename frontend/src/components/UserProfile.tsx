'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Edit3, Save, X, TrendingUp, Award, Clock, CheckCircle } from 'lucide-react';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BetHistory {
  id: string;
  marketAddress: string;
  questionTitle: string;
  betAmount: string;
  betType: 'YES' | 'NO';
  status: 'active' | 'resolved' | 'claimed';
  outcome?: 'YES' | 'NO';
  isCorrect?: boolean;
  timestamp: string;
}

type BetFilter = 'all' | 'active' | 'resolved' | 'claimed';

export default function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [betFilter, setBetFilter] = useState<BetFilter>('all');
  const [formData, setFormData] = useState({
    favorite_team: user?.favorite_team || 'PSG',
  });

  // Mock bet history data - replace with real data later
  const [betHistory] = useState<BetHistory[]>([
    {
      id: '1',
      marketAddress: '0x1234...5678',
      questionTitle: 'Will PSG win against Barcelona?',
      betAmount: '100',
      betType: 'YES',
      status: 'active',
      timestamp: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      marketAddress: '0x8765...4321',
      questionTitle: 'Will Messi score a goal?',
      betAmount: '50',
      betType: 'NO',
      status: 'resolved',
      outcome: 'NO',
      isCorrect: true,
      timestamp: '2024-01-10T15:45:00Z'
    },
    {
      id: '3',
      marketAddress: '0x9999...8888',
      questionTitle: 'Will PSG qualify for Champions League?',
      betAmount: '200',
      betType: 'YES',
      status: 'claimed',
      outcome: 'YES',
      isCorrect: true,
      timestamp: '2024-01-05T20:15:00Z'
    }
  ]);

  // Calculate statistics
  const totalBets = betHistory.length;
  const activeBets = betHistory.filter(bet => bet.status === 'active').length;
  const resolvedBets = betHistory.filter(bet => bet.status === 'resolved').length;
  const claimedBets = betHistory.filter(bet => bet.status === 'claimed').length;
  const correctBets = betHistory.filter(bet => bet.isCorrect === true).length;
  const totalBetAmount = betHistory.reduce((sum, bet) => sum + parseFloat(bet.betAmount), 0);
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
      case 'active': return 'text-blue-600';
      case 'resolved': return 'text-orange-600';
      case 'claimed': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4" />;
      case 'resolved': return <Award className="w-4 h-4" />;
      case 'claimed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTeamDisplayName = (teamCode: string) => {
    switch (teamCode) {
      case 'PSG': return 'PSG';
      case 'BAR': return 'BAR';
      default: return teamCode;
    }
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
          <h2 className="modal-title">Profile & Bet History</h2>
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
              <p className="stat-label">Total Bets</p>
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
              <p className="stat-value total-amount">{totalBetAmount} CHZ</p>
              <p className="stat-label">Total Bet</p>
            </div>
          </div>

          {/* Bet Status Breakdown */}
          <div className="bet-status-breakdown">
            <div className="status-item">
              <div className="status-icon active">
                <Clock className="w-4 h-4" />
              </div>
              <div className="status-info">
                <p className="status-count">{activeBets}</p>
                <p className="status-label">Active</p>
              </div>
            </div>
            <div className="status-item">
              <div className="status-icon resolved">
                <Award className="w-4 h-4" />
              </div>
              <div className="status-info">
                <p className="status-count">{resolvedBets}</p>
                <p className="status-label">Resolved</p>
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

          {/* Bet History Section */}
          <div className="bet-history-section">
            <div className="history-header">
              <h3 className="history-title">Bet History</h3>
              <div className="history-filter">
                <select
                  value={betFilter}
                  onChange={(e) => setBetFilter(e.target.value as BetFilter)}
                  className="history-filter-select"
                >
                  <option value="all">All Bets ({totalBets})</option>
                  <option value="active">Active ({activeBets})</option>
                  <option value="resolved">Resolved ({resolvedBets})</option>
                  <option value="claimed">Claimed ({claimedBets})</option>
                </select>
              </div>
            </div>

            <div className="bet-history-list">
              {filteredBets.length === 0 ? (
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
                        {bet.betAmount} CHZ
                      </div>
                    </div>
                    
                    <div className="bet-content">
                      <h4 className="bet-question">{bet.questionTitle}</h4>
                      <div className="bet-details">
                        <span className={`bet-type ${bet.betType === 'YES' ? 'bet-yes' : 'bet-no'}`}>
                          {bet.betType}
                        </span>
                        <span className="bet-address">
                          {bet.marketAddress}
                        </span>
                      </div>
                      
                      {bet.status === 'resolved' && bet.outcome && (
                        <div className="bet-outcome">
                          <span className="outcome-label">Outcome:</span>
                          <span className={`outcome-value ${bet.isCorrect ? 'correct' : 'incorrect'}`}>
                            {bet.outcome} {bet.isCorrect ? '✓' : '✗'}
                          </span>
                        </div>
                      )}
                      
                      {bet.status === 'resolved' && bet.isCorrect && (
                        <button className="claim-button" disabled>
                          Claim Rewards
                        </button>
                      )}
                    </div>
                    
                    <div className="bet-footer">
                      <span className="bet-date">{formatDate(bet.timestamp)}</span>
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
                  <p className="text-gray-900">{getTeamDisplayName(user?.favorite_team || 'Not set')}</p>
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
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, Award, X } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  username: string;
  wallet_address: string;
  total_swipes: number;
  correct_predictions: number;
  win_rate: number;
  total_winnings: number;
  favorite_team: string;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Leaderboard({ isOpen, onClose }: LeaderboardProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'win_rate' | 'total_swipes' | 'correct_predictions'>('win_rate');

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, sortBy]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order(sortBy, { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 rank-1" />;
    if (rank === 2) return <Medal className="w-6 h-6 rank-2" />;
    if (rank === 3) return <Award className="w-6 h-6 rank-3" />;
    return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
  };

  if (!isOpen) return null;

  return (
    <div className="leaderboard-modal">
      <div className="leaderboard-modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Leaderboard</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Sort Options */}
          <div className="leaderboard-sort">
            <button
              onClick={() => setSortBy('win_rate')}
              className={`sort-btn ${sortBy === 'win_rate' ? 'active' : ''}`}
            >
              Win Rate
            </button>
            <button
              onClick={() => setSortBy('total_swipes')}
              className={`sort-btn ${sortBy === 'total_swipes' ? 'active' : ''}`}
            >
              Total Swipes
            </button>
            <button
              onClick={() => setSortBy('correct_predictions')}
              className={`sort-btn ${sortBy === 'correct_predictions' ? 'active' : ''}`}
            >
              Correct Predictions
            </button>
          </div>

          {/* Leaderboard List */}
          <div className="leaderboard-list">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="loading-spinner"></div>
              </div>
            ) : (
              users.map((user, index) => (
                <div
                  key={user.id}
                  className={`leaderboard-item ${index < 3 ? 'top-3' : ''}`}
                >
                  {/* Rank */}
                  <div className="rank-icon">
                    {getRankIcon(index + 1)}
                  </div>

                  {/* User Info */}
                  <div className="user-info">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="user-name">
                        {user.username || `User_${user.wallet_address.slice(2, 8)}`}
                      </h3>
                      {user.favorite_team === 'PSG' && (
                        <span className="psg-badge">
                          PSG Fan
                        </span>
                      )}
                    </div>
                    <p className="user-wallet">
                      {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="user-stats">
                    <div className="user-stat">
                      <p className="user-stat-value winrate">{user.win_rate}%</p>
                      <p className="user-stat-label">Win Rate</p>
                    </div>
                    <div className="user-stat">
                      <p className="user-stat-value correct">{user.correct_predictions}</p>
                      <p className="user-stat-label">Correct</p>
                    </div>
                    <div className="user-stat">
                      <p className="user-stat-value swipes">{user.total_swipes}</p>
                      <p className="user-stat-label">Swipes</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <p className="modal-footer-text">
              Top 20 players • Updated in real-time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
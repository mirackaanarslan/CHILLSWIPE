'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Edit3, Save, X } from 'lucide-react';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    favorite_team: user?.favorite_team || 'PSG',
  });

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!user) return;
    
    await updateProfile(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      bio: user?.bio || '',
      favorite_team: user?.favorite_team || 'PSG',
    });
    setIsEditing(false);
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
          <h2 className="modal-title">Profile</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Avatar Section */}
          <div className="text-center mb-6">
            <div className="profile-avatar">
              <User className="w-10 h-10 text-white" />
            </div>
            <p className="text-sm text-gray-500 font-mono">
              {user?.wallet_address?.slice(0, 6)}...{user?.wallet_address?.slice(-4)}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="profile-stats">
            <div className="stat-card">
              <p className="stat-value swipes">{user?.total_swipes || 0}</p>
              <p className="stat-label">Swipes</p>
            </div>
            <div className="stat-card">
              <p className="stat-value correct">{user?.correct_predictions || 0}</p>
              <p className="stat-label">Correct</p>
            </div>
            <div className="stat-card">
              <p className="stat-value winrate">{user?.win_rate || 0}%</p>
              <p className="stat-label">Win Rate</p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="profile-form">
            {isEditing ? (
              <>
                <div className="form-group">
                  <label className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="form-input"
                    placeholder="Enter username"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="form-textarea"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>

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
                    <option value="Other">Other</option>
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
                    Username
                  </label>
                  <p className="text-gray-900">{user?.username || 'Not set'}</p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Bio
                  </label>
                  <p className="text-gray-900">{user?.bio || 'No bio yet'}</p>
                </div>

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
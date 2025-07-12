'use client';

import React, { useState } from 'react';
import { CreateQuestionData } from '@/types/supabase';
import { ImageUpload } from './ImageUpload';
import { addQuestion, uploadQuestionImage, createMarketContract, updateMarketWithContractAddress, getMarketByQuestionId } from '@/lib/admin';
import { useWalletClient } from 'wagmi';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';

interface AddQuestionFormProps {
  onQuestionAdded: () => void;
}

const CATEGORIES = [
  // 🎯 Match & Player Categories
  { id: 'match_result', name: 'Match Result', icon: '⚽' },
  { id: 'total_goals', name: 'Total Goals', icon: '🥅' },
  { id: 'goal_scorer', name: 'Goal Scorer', icon: '⚽' },
  { id: 'first_goal', name: 'First Goal', icon: '🔥' },
  { id: 'assists', name: 'Assists', icon: '🎯' },
  { id: 'starting_xi', name: 'Starting XI', icon: '👥' },
  { id: 'red_cards', name: 'Red Cards', icon: '🟥' },
  { id: 'yellow_cards', name: 'Yellow Cards', icon: '🟨' },
  { id: 'penalty_call', name: 'Penalty Call', icon: '⚖️' },
  { id: 'var_decision', name: 'VAR Decision', icon: '📺' },
  
  // 🏆 Season & Tournament
  { id: 'ligue_title', name: 'Ligue Title', icon: '🏆' },
  { id: 'ucl_progress', name: 'UCL Progress', icon: '⭐' },
  { id: 'top_scorer', name: 'Top Scorer', icon: '👑' },
  { id: 'top_assists', name: 'Top Assists', icon: '🎯' },
  { id: 'clean_sheets', name: 'Clean Sheets', icon: '🛡️' },
  
  // 🔁 Transfers & Management
  { id: 'player_transfer', name: 'Player Transfer', icon: '🔄' },
  { id: 'coach_change', name: 'Coach Change', icon: '👨‍💼' },
  { id: 'loan_deal', name: 'Loan Deal', icon: '📋' },
  
  // 👥 Fan & Social
  { id: 'fan_attendance', name: 'Fan Attendance', icon: '👥' },
  { id: 'stadium_full', name: 'Stadium Full', icon: '🏟️' },
  { id: 'social_buzz', name: 'Social Buzz', icon: '📱' },
  { id: 'tweet_count', name: 'Tweet Count', icon: '🐦' },
];

export const AddQuestionForm: React.FC<AddQuestionFormProps> = ({ onQuestionAdded }) => {
  const [formData, setFormData] = useState<CreateQuestionData>({
    title: '',
    description: '',
    category: 'match_result',
    image_url: '',
    coin: 'PSG',
    end_time: ''
  });
  
  const [endTime, setEndTime] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: Math.min(new Date().getDate() + 1, 28), // Use next day, max 28 to avoid month issues
    hour: 12, // Default to noon
    minute: 0
  });
  
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { data: walletClient } = useWalletClient();

  const handleInputChange = (field: keyof CreateQuestionData, value: any) => {
    console.log(`Updating ${field} to:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEndTimeChange = (field: keyof typeof endTime, value: number) => {
    setEndTime(prev => {
      const newEndTime = { ...prev, [field]: value };
      
      // Validate date values
      const year = newEndTime.year;
      const month = newEndTime.month;
      const day = newEndTime.day;
      const hour = newEndTime.hour;
      const minute = newEndTime.minute;
      
      // Check if the date is valid
      const date = new Date(year, month - 1, day, hour, minute);
      
      // Validate if the date is valid (not Invalid Date)
      if (isNaN(date.getTime())) {
        console.warn('Invalid date values:', { year, month, day, hour, minute });
        return newEndTime; // Return without updating formData
      }
      
      // Update formData with ISO string
      setFormData(prevForm => ({
        ...prevForm,
        end_time: date.toISOString()
      }));
      
      return newEndTime;
    });
  };

  const handleImageUploaded = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      image_url: imageUrl
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please fill in the question title');
      return;
    }

    if (!formData.image_url.trim()) {
      toast.error('Please upload an image');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    if (!formData.coin) {
      toast.error('Please select a coin');
      return;
    }

    if (!formData.end_time) {
      toast.error('Please set an end time');
      return;
    }

    if (!walletClient) {
      toast.error('Please connect your wallet to create market contracts');
      return;
    }

    setSubmitting(true);
    
    try {
      // Validate category
      if (!formData.category) {
        toast.error('Please select a category');
        return;
      }
      
      console.log('Submitting form data:', formData);
      
      // Step 1: Create question, bet, and market in database
      const questionId = await addQuestion(formData);
      toast.success('Question created! Creating market contract...');
      
      // Step 2: Create real market contract
      const marketAddress = await createMarketContract(
        formData.title,
        formData.coin,
        formData.end_time,
        walletClient
      );
      
      // Step 3: Update market with contract address
      const market = await getMarketByQuestionId(questionId);
      if (market) {
        // Get wallet address from wallet client
        const provider = new ethers.BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();
        const walletAddress = await signer.getAddress();
        
        await updateMarketWithContractAddress(
          market.id,
          marketAddress,
          walletAddress
        );
        toast.success('Market contract created and linked successfully!');
      } else {
        toast.error('Market not found in database');
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'match_result',
        image_url: '',
        coin: 'PSG',
        end_time: ''
      });
      
      setEndTime({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: Math.min(new Date().getDate() + 1, 28), // Use next day, max 28 to avoid month issues
        hour: 12, // Default to noon
        minute: 0
      });
      
      onQuestionAdded();
    } catch (error: any) {
      console.error('Error adding question:', error);
      toast.error(error.message || 'Failed to add question');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      {/* Question Title */}
      <div className="form-group">
        <label htmlFor="title" className="form-label">
          Question Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="form-input"
          placeholder="Enter your prediction question..."
          required
        />
      </div>

      {/* Question Coin */}
      <div className="form-group">
        <label className="form-label">
          Coin *
        </label>
        <div className="coin-selection">
          <button
            type="button"
            onClick={() => handleInputChange('coin', 'PSG')}
            className={`coin-option ${formData.coin === 'PSG' ? 'active' : ''}`}
          >
            <span className="coin-icon">🔴</span>
            <span className="coin-name">PSG</span>
          </button>
          <button
            type="button"
            onClick={() => handleInputChange('coin', 'BAR')}
            className={`coin-option ${formData.coin === 'BAR' ? 'active' : ''}`}
          >
            <span className="coin-icon">🔵</span>
            <span className="coin-name">Barcelona</span>
          </button>
        </div>
      </div>

      {/* End Time Selection */}
      <div className="form-group">
        <label className="form-label">
          End Time *
        </label>
        <div className="end-time-grid">
          <div className="time-input-group">
            <label htmlFor="year">Year</label>
            <input
              type="number"
              id="year"
              value={endTime.year}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 2024 && value <= 2034) {
                  handleEndTimeChange('year', value);
                }
              }}
              min={2024}
              max={2034}
              className="time-input"
            />
          </div>
          <div className="time-input-group">
            <label htmlFor="month">Month</label>
            <input
              type="number"
              id="month"
              value={endTime.month}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= 12) {
                  handleEndTimeChange('month', value);
                }
              }}
              min={1}
              max={12}
              className="time-input"
            />
          </div>
          <div className="time-input-group">
            <label htmlFor="day">Day</label>
            <input
              type="number"
              id="day"
              value={endTime.day}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= 31) {
                  handleEndTimeChange('day', value);
                }
              }}
              min={1}
              max={31}
              className="time-input"
            />
          </div>
          <div className="time-input-group">
            <label htmlFor="hour">Hour</label>
            <input
              type="number"
              id="hour"
              value={endTime.hour}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 0 && value <= 23) {
                  handleEndTimeChange('hour', value);
                }
              }}
              min={0}
              max={23}
              className="time-input"
            />
          </div>
          <div className="time-input-group">
            <label htmlFor="minute">Minute</label>
            <input
              type="number"
              id="minute"
              value={endTime.minute}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 0 && value <= 59) {
                  handleEndTimeChange('minute', value);
                }
              }}
              min={0}
              max={59}
              className="time-input"
            />
          </div>
        </div>
        {formData.end_time && (
          <div className="end-time-display">
            <small>End Time: {new Date(formData.end_time).toLocaleString()}</small>
          </div>
        )}
      </div>

      {/* Question Category */}
      <div className="form-group">
        <label className="form-label">
          Category *
        </label>
        <div className="category-grid">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleInputChange('category', category.id)}
              className={`category-option ${formData.category === category.id ? 'active' : ''}`}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Question Description */}
      <div className="form-group">
        <label htmlFor="description" className="form-label">
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="form-textarea"
          rows={4}
          placeholder="Provide detailed description of the prediction question..."
        />
      </div>

      {/* Image Upload */}
      <div className="form-group">
        <label className="form-label">
          Question Image *
        </label>
        <ImageUpload
          onImageUploaded={handleImageUploaded}
          onUploadStart={() => setUploading(true)}
          onUploadEnd={() => setUploading(false)}
          currentImageUrl={formData.image_url}
        />
      </div>

      {/* Submit Button */}
      <div className="form-actions">
        <div className="form-info">
          <span className="required-text">* Required fields</span>
        </div>
        
        <button
          type="submit"
          disabled={submitting || uploading}
          className="submit-button"
        >
          {submitting ? (
            <>
              <span className="loading-spinner"></span>
              Creating Question & Market...
            </>
          ) : (
            'Add Question & Create Market'
          )}
        </button>
      </div>
    </form>
  );
}; 
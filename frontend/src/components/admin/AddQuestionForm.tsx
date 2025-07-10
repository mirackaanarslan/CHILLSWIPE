'use client';

import React, { useState } from 'react';
import { CreateQuestionData } from '@/types/supabase';
import { ImageUpload } from './ImageUpload';
import { addQuestion, uploadQuestionImage } from '@/lib/admin';
import toast from 'react-hot-toast';

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
    image_url: ''
  });
  
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field: keyof CreateQuestionData, value: any) => {
    console.log(`Updating ${field} to:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

    setSubmitting(true);
    
    try {
      // Validate category
      if (!formData.category) {
        toast.error('Please select a category');
        return;
      }
      
      console.log('Submitting form data:', formData);
      await addQuestion(formData);
      toast.success('Question added successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'match_result',
        image_url: ''
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
          rows={4}
          className="form-textarea"
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
              Adding Question...
            </>
          ) : (
            'Add Question'
          )}
        </button>
      </div>
    </form>
  );
}; 
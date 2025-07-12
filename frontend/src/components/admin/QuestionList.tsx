'use client';

import React, { useState } from 'react';
import { Question } from '@/types/supabase';
import { deleteQuestion, updateQuestion } from '@/lib/admin';
import { storageService } from '@/lib/supabase-service';
import toast from 'react-hot-toast';

interface QuestionListProps {
  questions: Question[];
  loading: boolean;
  onQuestionUpdated: () => void;
}

const CATEGORY_ICONS: { [key: string]: string } = {
  // 🎯 Match & Player Categories
  match_result: '⚽',
  total_goals: '🥅',
  goal_scorer: '⚽',
  first_goal: '🔥',
  assists: '🎯',
  starting_xi: '👥',
  red_cards: '🟥',
  yellow_cards: '🟨',
  penalty_call: '⚖️',
  var_decision: '📺',
  
  // 🏆 Season & Tournament
  ligue_title: '🏆',
  ucl_progress: '⭐',
  top_scorer: '👑',
  top_assists: '🎯',
  clean_sheets: '🛡️',
  
  // 🔁 Transfers & Management
  player_transfer: '🔄',
  coach_change: '👨‍💼',
  loan_deal: '📋',
  
  // 👥 Fan & Social
  fan_attendance: '👥',
  stadium_full: '🏟️',
  social_buzz: '📱',
  tweet_count: '🐦'
};

const CATEGORY_NAMES: { [key: string]: string } = {
  // 🎯 Match & Player Categories
  match_result: 'Match Result',
  total_goals: 'Total Goals',
  goal_scorer: 'Goal Scorer',
  first_goal: 'First Goal',
  assists: 'Assists',
  starting_xi: 'Starting XI',
  red_cards: 'Red Cards',
  yellow_cards: 'Yellow Cards',
  penalty_call: 'Penalty Call',
  var_decision: 'VAR Decision',
  
  // 🏆 Season & Tournament
  ligue_title: 'Ligue Title',
  ucl_progress: 'UCL Progress',
  top_scorer: 'Top Scorer',
  top_assists: 'Top Assists',
  clean_sheets: 'Clean Sheets',
  
  // 🔁 Transfers & Management
  player_transfer: 'Player Transfer',
  coach_change: 'Coach Change',
  loan_deal: 'Loan Deal',
  
  // 👥 Fan & Social
  fan_attendance: 'Fan Attendance',
  stadium_full: 'Stadium Full',
  social_buzz: 'Social Buzz',
  tweet_count: 'Tweet Count'
};

export const QuestionList: React.FC<QuestionListProps> = ({ 
  questions, 
  loading, 
  onQuestionUpdated 
}) => {
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    coin: 'PSG' as 'PSG' | 'BAR'
  });
  const [saving, setSaving] = useState(false);

  const handleDeleteQuestion = async (question: Question) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete associated image if exists
      if (question.image_url) {
        try {
          // Extract filename from URL for deletion
          const urlParts = question.image_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          await storageService.deleteImage(fileName);
        } catch (error) {
          console.warn('Could not delete question image:', error);
        }
      }

      // Delete question
      await deleteQuestion(question.id);
      toast.success('Question deleted successfully');
      onQuestionUpdated();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete question');
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setEditForm({
      title: question.title,
      description: question.description || '',
      category: question.category,
      coin: question.coin
    });
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;

    // Validate form
    if (!editForm.title.trim()) {
      toast.error('Question title is required');
      return;
    }

    if (!editForm.category.trim()) {
      toast.error('Question category is required');
      return;
    }

    if (!editForm.coin) {
      toast.error('Question coin is required');
      return;
    }

    setSaving(true);

    try {
      // Prepare update data
      const updateData: any = {
        title: editForm.title.trim(),
        category: editForm.category,
        coin: editForm.coin
      };

      // Only include description if it's not empty
      if (editForm.description.trim()) {
        updateData.description = editForm.description.trim();
      } else {
        updateData.description = null;
      }

      // Update question in database
      await updateQuestion(editingQuestion.id, updateData);
      
      toast.success('Question updated successfully');
      setEditingQuestion(null);
      setEditForm({ title: '', description: '', category: '', coin: 'PSG' });
      onQuestionUpdated();
    } catch (error: any) {
      console.error('Error updating question:', error);
      toast.error(error.message || 'Failed to update question');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditForm({ title: '', description: '', category: '', coin: 'PSG' });
  };

  if (loading) {
    return (
      <div className="question-list">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="question-card skeleton">
            <div className="skeleton-header">
              <div className="skeleton-title"></div>
              <div className="skeleton-status"></div>
            </div>
            <div className="skeleton-content">
              <div className="skeleton-description"></div>
              <div className="skeleton-image"></div>
            </div>
            <div className="skeleton-footer">
              <div className="skeleton-category"></div>
              <div className="skeleton-date"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <span className="empty-symbol">📋</span>
        </div>
        <h3 className="empty-title">No questions found</h3>
        <p className="empty-description">Start by adding your first prediction question!</p>
      </div>
    );
  }

  return (
    <div className="question-list">
      {questions.map((question) => (
        <div key={question.id} className="question-card">
          {editingQuestion?.id === question.id ? (
            // Edit Mode
            <div className="edit-mode">
              <div className="edit-form">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="form-input"
                    placeholder="Enter question title..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="form-textarea"
                    rows={3}
                    placeholder="Enter question description..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Coin *</label>
                  <select
                    value={editForm.coin}
                    onChange={(e) => setEditForm(prev => ({ ...prev, coin: e.target.value as 'PSG' | 'BAR' }))}
                    className="form-input"
                  >
                    <option value="PSG">🔴 PSG</option>
                    <option value="BAR">🔵 Barcelona</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    className="form-input"
                  >
                    {Object.entries(CATEGORY_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>
                        {CATEGORY_ICONS[id]} {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="edit-actions">
                  <button 
                    onClick={handleSaveEdit} 
                    className="save-btn"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="loading-spinner"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        💾 Save
                      </>
                    )}
                  </button>
                  <button 
                    onClick={handleCancelEdit} 
                    className="cancel-btn"
                    disabled={saving}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // View Mode
            <>
              <div className="question-header">
                <div className="question-title-section">
                  <h3 className="question-title">
                    {question.title}
                  </h3>
                  <div className="question-meta">
                    <span className={`status-badge ${question.status}`}>
                      {question.status}
                    </span>
                    <span className="coin-badge">
                      <span className="coin-icon">
                        {question.coin === 'PSG' ? '🔴' : '🔵'}
                      </span>
                      <span className="coin-name">
                        {question.coin}
                      </span>
                    </span>
                    <span className="category-badge">
                      <span className="category-icon">
                        {CATEGORY_ICONS[question.category] || '🌍'}
                      </span>
                      <span className="category-name">
                        {CATEGORY_NAMES[question.category] || 'General'}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="question-actions">
                  <button
                    onClick={() => handleEditQuestion(question)}
                    className="edit-button"
                    title="Edit question"
                  >
                    <span className="edit-icon">✏️</span>
                    <span className="edit-text">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question)}
                    className="delete-button"
                    title="Delete question"
                  >
                    <span className="delete-icon">🗑️</span>
                    <span className="delete-text">Delete</span>
                  </button>
                </div>
              </div>

              <div className="question-content">
                {question.description && (
                  <p className="question-description">
                    {question.description}
                  </p>
                )}

                {question.image_url && (
                  <div className="question-image-container">
                    <img
                      src={question.image_url}
                      alt={question.title}
                      className="question-image"
                    />
                  </div>
                )}
              </div>

              <div className="question-footer">
                <div className="question-info">
                  <span className="question-id">ID: {question.id.slice(0, 8)}...</span>
                  <span className="question-date">
                    Created: {new Date(question.created_at).toLocaleDateString()}
                  </span>
                  <span className="question-date">
                    Updated: {new Date(question.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}; 
'use client';

import React, { useState, useEffect } from 'react';
import { Question } from '@/types/supabase';
import { AddQuestionForm } from '@/components/admin/AddQuestionForm';
import { QuestionList } from '@/components/admin/QuestionList';
import { getAllQuestions } from '@/lib/admin';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await getAllQuestions();
      setQuestions(data);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleQuestionAdded = () => {
    loadQuestions();
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          <div className="logo-section">
            <div className="logo-container">
              <div className="logo-icon">
                <div className="logo-pulse"></div>
                <span className="logo-symbol">AP</span>
              </div>
              <div className="logo-text">
                <h1 className="header-title">PSG Admin</h1>
                <p className="header-subtitle">Manage prediction questions</p>
              </div>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-label">Questions</span>
              <span className="stat-value">{questions.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-content">
        <div className="tab-navigation">
          <button
            onClick={() => setActiveTab('add')}
            className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
          >
            <span className="tab-icon">➕</span>
            <span className="tab-text">Add Question</span>
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`tab-button ${activeTab === 'manage' ? 'active' : ''}`}
          >
            <span className="tab-icon">📋</span>
            <span className="tab-text">Manage Questions</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'add' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">Add New Question</h2>
                <p className="card-subtitle">Create a new prediction question for users</p>
              </div>
              <AddQuestionForm onQuestionAdded={handleQuestionAdded} />
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">Manage Questions</h2>
                <p className="card-subtitle">View and manage existing questions</p>
              </div>
              <QuestionList 
                questions={questions} 
                loading={loading}
                onQuestionUpdated={loadQuestions}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 
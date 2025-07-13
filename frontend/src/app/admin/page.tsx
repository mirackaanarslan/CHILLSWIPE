'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Question } from '@/types/supabase';
import { AddQuestionForm } from '@/components/admin/AddQuestionForm';
import { QuestionList } from '@/components/admin/QuestionList';
import { ResolveBets } from '@/components/admin/ResolveBets';
import { getAllQuestions } from '@/lib/admin';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'manage' | 'resolve'>('add');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading, logout } = useAdminAuth();
  const { address } = useAccount();
  const router = useRouter();

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
    // Check authentication
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    if (isAuthenticated) {
      loadQuestions();
    }
  }, [isAuthenticated, authLoading, router]);

  const handleQuestionAdded = () => {
    loadQuestions();
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          <div className="logo-section">
            <div className="logo-container">
              <img src="/logo.png" alt="CHILLSWIPE Logo" className="logo-image" />
              <div className="logo-text">
                <h1 className="header-title">CHILLSWIPE ADMIN</h1>
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
            <div className="wallet-section">
              <ConnectButton />
            </div>
            <button
              onClick={logout}
              className="logout-button"
            >
              <span className="button-text">Logout</span>
            </button>
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
          <button
            onClick={() => setActiveTab('resolve')}
            className={`tab-button ${activeTab === 'resolve' ? 'active' : ''}`}
          >
            <span className="tab-icon">🏁</span>
            <span className="tab-text">Resolve Bets</span>
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

          {activeTab === 'resolve' && (
            <div className="content-card">
              <div className="card-header">
                <h2 className="card-title">Resolve Bets</h2>
                <p className="card-subtitle">Resolve prediction markets and determine outcomes</p>
              </div>
              <ResolveBets />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 
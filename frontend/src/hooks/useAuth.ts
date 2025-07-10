import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  wallet_address: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
  total_swipes: number;
  correct_predictions: number;
  win_rate: number;
  bio?: string;
  favorite_team?: string;
  total_winnings?: number;
  is_verified?: boolean;
  last_active?: string;
}

export function useAuth() {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user exists in database
  const checkUser = async (walletAddress: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error checking user:', error);
      return null;
    }
  };

  // Create new user
  const createUser = async (walletAddress: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            wallet_address: walletAddress.toLowerCase(),
            username: `User_${walletAddress.slice(2, 8)}`,
            total_swipes: 0,
            correct_predictions: 0,
            win_rate: 0,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  };

  // Sign in with wallet
  const signInWithWallet = async () => {
    if (!address) return null;

    setLoading(true);
    try {
      // Check if user exists
      let userData = await checkUser(address);
      
      // If user doesn't exist, create new user
      if (!userData) {
        userData = await createUser(address);
      }

      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error signing in:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = () => {
    setUser(null);
  };

  // Update user profile
  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }

      setUser(data);
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  };

  // Increment swipe count
  const incrementSwipes = async () => {
    if (!user) return null;

    try {
      const newSwipeCount = (user.total_swipes || 0) + 1;
      const newWinRate = user.total_swipes > 0 
        ? ((user.correct_predictions || 0) / newSwipeCount) * 100 
        : 0;

      const { data, error } = await supabase
        .from('users')
        .update({ 
          total_swipes: newSwipeCount,
          win_rate: newWinRate,
          last_active: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error incrementing swipes:', error);
        return null;
      }

      setUser(data);
      return data;
    } catch (error) {
      console.error('Error incrementing swipes:', error);
      return null;
    }
  };

  // Increment correct predictions
  const incrementCorrectPredictions = async () => {
    if (!user) return null;

    try {
      const newCorrectCount = (user.correct_predictions || 0) + 1;
      const newWinRate = ((newCorrectCount) / (user.total_swipes || 1)) * 100;

      const { data, error } = await supabase
        .from('users')
        .update({ 
          correct_predictions: newCorrectCount,
          win_rate: newWinRate,
          last_active: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error incrementing correct predictions:', error);
        return null;
      }

      setUser(data);
      return data;
    } catch (error) {
      console.error('Error incrementing correct predictions:', error);
      return null;
    }
  };

  // Effect to handle wallet connection changes
  useEffect(() => {
    if (isConnected && address) {
      signInWithWallet();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [isConnected, address]);

  return {
    user,
    loading,
    signInWithWallet,
    signOut,
    updateProfile,
    incrementSwipes,
    incrementCorrectPredictions,
    isAuthenticated: !!user,
  };
} 
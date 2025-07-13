'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { IoBarChart, IoPlaySkipForward } from 'react-icons/io5';
import { Question } from '@/types/supabase';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, usePublicClient } from 'wagmi';
import { getAllQuestions, getMarketAddressForQuestion } from '@/lib/admin';
import { useAuth } from '@/hooks/useAuth';
import UserProfile from '@/components/UserProfile';
import Leaderboard from '@/components/Leaderboard';
import { Menu, X } from 'lucide-react';
import { useContracts } from '@/hooks/useContracts';
import { MarketCard } from '@/components/MarketCard';
import AIChatbot from '@/components/AIChatbot';
import { betsService, usersService } from '@/lib/supabase-service';

import { ethers } from 'ethers';

// Contract ABIs
const PREDICTION_MARKET_ABI = [
  'function question() public view returns (string)',
  'function totalYes() public view returns (uint256)',
  'function totalNo() public view returns (uint256)',
  'function endTime() public view returns (uint256)',
  'function resolved() public view returns (bool)',
  'function outcome() public view returns (uint8)',
  'function creator() public view returns (address)',
  'function getUserBets(address user) public view returns (tuple(uint8 choice, uint256 amount)[])',
  'function placeBet(bool voteYes, uint256 amount) public',
  'function resolveMarket(bool outcomeIsYes) public',
  'function claim() public',
  'event BetPlaced(address indexed user, bool voteYes, uint256 amount)',
  'event MarketResolved(bool outcomeIsYes)'
];

const FAN_TOKEN_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)'
];

// Contract addresses
const PSG_FAN_TOKEN_ADDRESS = '0xd2E815c3870a1fC2ED71D3C3355EAE5FF728F630';
const BAR_FAN_TOKEN_ADDRESS = '0x21FD1F8067C9a418eD8447f633f5C9b2E01EbAe0';

const { innerWidth: screenWidth, innerHeight: screenHeight } = typeof window !== 'undefined' ? window : { innerWidth: 0, innerHeight: 0 };

// Category mapping for display
const CATEGORY_MAPPING: { [key: string]: { name: string; icon: string } } = {
  // 🎯 Match & Player Categories
  match_result: { name: 'Match Result', icon: '⚽' },
  total_goals: { name: 'Total Goals', icon: '🥅' },
  goal_scorer: { name: 'Goal Scorer', icon: '⚽' },
  first_goal: { name: 'First Goal', icon: '🔥' },
  assists: { name: 'Assists', icon: '🎯' },
  starting_xi: { name: 'Starting XI', icon: '👥' },
  red_cards: { name: 'Red Cards', icon: '🟥' },
  yellow_cards: { name: 'Yellow Cards', icon: '🟨' },
  penalty_call: { name: 'Penalty Call', icon: '⚖️' },
  var_decision: { name: 'VAR Decision', icon: '📺' },
  
  // 🏆 Season & Tournament
  ligue_title: { name: 'Ligue Title', icon: '🏆' },
  ucl_progress: { name: 'UCL Progress', icon: '⭐' },
  top_scorer: { name: 'Top Scorer', icon: '👑' },
  top_assists: { name: 'Top Assists', icon: '🎯' },
  clean_sheets: { name: 'Clean Sheets', icon: '🛡️' },
  
  // 🔁 Transfers & Management
  player_transfer: { name: 'Player Transfer', icon: '🔄' },
  coach_change: { name: 'Coach Change', icon: '👨‍💼' },
  loan_deal: { name: 'Loan Deal', icon: '📋' },
  
  // 👥 Fan & Social
  fan_attendance: { name: 'Fan Attendance', icon: '👥' },
  stadium_full: { name: 'Stadium Full', icon: '🏟️' },
  social_buzz: { name: 'Social Buzz', icon: '📱' },
  tweet_count: { name: 'Tweet Count', icon: '🐦' }
};

// Particle system for explosion effects
const ParticleExplosion = ({ x, y, color, onComplete }: { x: number; y: number; color: string; onComplete?: () => void }) => {
  const particles = Array.from({ length: 12 }, (_, i) => i);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete && onComplete();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="particle-explosion" style={{ left: x, top: y }}>
      {particles.map((i) => (
        <div
          key={i}
          className="particle"
          style={{
            '--delay': `${i * 0.05}s`,
            '--angle': `${i * 30}deg`,
            '--distance': `${120 + Math.random() * 80}px`,
            '--color': color,
            '--size': `${8 + Math.random() * 16}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

// Amount Selector Component
const AmountSelector = ({ betAmount, setBetAmount }: { betAmount: number; setBetAmount: (amount: number) => void }) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  
  const presetAmounts = [1, 5, 10, 25, 50];
  const minAmount = 0.01;
  const maxAmount = 100;

  const handlePresetClick = (amount: number) => {
    setBetAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCustomSubmit = () => {
    const amount = parseFloat(customAmount);
    if (amount && amount >= minAmount && amount <= maxAmount) {
      setBetAmount(amount);
      setCustomAmount('');
      setIsCustom(false);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setBetAmount(value);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleMobileDecrease = () => {
    const newAmount = Math.max(minAmount, betAmount - 1);
    setBetAmount(newAmount);
  };

  const handleMobileIncrease = () => {
    const newAmount = Math.min(maxAmount, betAmount + 1);
    setBetAmount(newAmount);
  };

  const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= minAmount && value <= maxAmount) {
      setBetAmount(value);
    } else if (e.target.value === '') {
      setBetAmount(minAmount);
    }
  };

  return (
    <div className="amount-selector-container">
      {/* Desktop Version */}
      <div className="amount-display-section">
        <div className="amount-display">
          <span className="amount-label">Prediction Amount</span>
          <span className="amount-value">{betAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="amount-controls-section">
        <div className="preset-amounts">
          {presetAmounts.map((amount) => (
            <button
              key={amount}
              className={`preset-btn ${betAmount === amount ? 'active' : ''}`}
              onClick={() => handlePresetClick(amount)}
            >
              {amount}
            </button>
          ))}
          <button
            className={`preset-btn custom-btn ${isCustom ? 'active' : ''}`}
            onClick={() => setIsCustom(!isCustom)}
          >
            CUSTOM
          </button>
        </div>

        {isCustom && (
          <div className="custom-amount-input">
            <input
              type="number"
              placeholder="Amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
              min={minAmount}
              max={maxAmount}
              step="0.01"
            />
            <button onClick={handleCustomSubmit} className="custom-submit-btn">
              SET
            </button>
          </div>
        )}

        <div className="amount-slider">
          <input
            type="range"
            min={minAmount}
            max={maxAmount}
            step="0.01"
            value={betAmount}
            onChange={handleSliderChange}
            className="slider"
          />
          <div className="slider-labels">
            <span>{minAmount}</span>
            <span>{maxAmount}</span>
          </div>
        </div>
      </div>

      {/* Mobile Version */}
      <div className="mobile-amount-selector">
                      <div className="mobile-amount-title">Prediction Amount</div>
        <div className="mobile-amount-controls">
          <button 
            className="mobile-amount-btn"
            onClick={handleMobileDecrease}
          >
            −
          </button>
          <input
            type="number"
            className="mobile-amount-input"
            value={betAmount}
            onChange={handleMobileInputChange}
            min={minAmount}
            max={maxAmount}
            step="1"
          />
          <button 
            className="mobile-amount-btn"
            onClick={handleMobileIncrease}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

const SwipeCard = ({ 
  item, 
  onSwipeLeft, 
  onSwipeRight, 
  onPass, 
  betAmount, 
  isTop, 
  onExplosion,
  isPlacingBet
}: {
  item: any;
  onSwipeLeft: (item: any) => void;
  onSwipeRight: (item: any) => void;
  onPass: (item: any) => void;
  betAmount: number;
  isTop: boolean;
  onExplosion?: (direction: 'left' | 'right') => void;
  isPlacingBet?: boolean;
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const [{ x, y, rotation, opacity }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotation: 0,
    opacity: 1,
    config: config.wobbly,
  }));

  const safeMath = (value: number, fallback = 0) => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return fallback;
    }
    return value;
  };

  // Debug state to track if swipe is already being processed
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);

  const bind = useDrag(
    ({ down, movement = [0, 0], velocity = [0, 0], cancel }) => {
      if (!isTop) return;

      const [mx = 0, my = 0] = movement;
      const [vx = 0, vy = 0] = velocity;
      
      const safeX = safeMath(mx);
      const safeMy = safeMath(my);
      const safeVelocity = safeMath(vx);

      const threshold = screenWidth * 0.25;
      const isGone = Math.abs(safeX) > threshold;
      
      const dir = safeX < 0 ? -1 : 1;

      if (!down && isGone && !isProcessingSwipe) {
        setIsProcessingSwipe(true);
        cancel();
        
        if (onExplosion) {
          onExplosion(dir === -1 ? 'left' : 'right');
        }
        
        api.start({
          x: safeMath((screenWidth + 200) * dir),
          y: safeMath(safeMy + (Math.random() - 0.5) * 100),
          rotation: safeMath(safeX / 40 + (isGone ? dir * 25 * safeVelocity : 0)),
          opacity: 0,
          config: { ...config.wobbly, velocity: safeMath(Math.abs(safeVelocity) * 0.3) },
        });
        
        setTimeout(() => {
          if (dir === -1) {
            onSwipeLeft(item);
          } else {
            onSwipeRight(item);
          }
          // Reset processing flag after a delay
          setTimeout(() => setIsProcessingSwipe(false), 500);
        }, 150);
      } else {
        api.start({
          x: down ? safeMath(safeX) : 0,
          y: down ? safeMath(safeMy) : 0,
          rotation: down ? safeMath(safeX / 40) : 0,
          opacity: down ? Math.max(0.7, 1 - Math.abs(safeX) / (screenWidth * 0.5)) : 1,
        });
      }
    },
    { 
      filterTaps: true,
      bounds: { left: -screenWidth, right: screenWidth, top: -screenHeight, bottom: screenHeight },
      rubberband: true
    }
  );

  return (
    <animated.div
      {...bind()}
      className={`swipe-card ${isTop ? 'top-card' : ''}`}
      style={{
        x,
        y,
        transform: rotation.to((r) => {
          const safeRotation = safeMath(r);
          return `rotate(${safeRotation}deg)`;
        }),
        opacity,
        background: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})`,
        zIndex: isTop ? 3 : 2,
      }}
    >

      <div 
        className="card-content"
        style={{
          backgroundImage: `url(${item.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <animated.div
          className="background-overlay"
          style={{
            background: x.to((xVal) => {
              const safeXVal = safeMath(xVal);
              const intensity = Math.min(Math.abs(safeXVal) / 100, 0.6);
              
              const baseOverlay = `linear-gradient(to bottom, 
                rgba(0,0,0,0.3) 0%, 
                rgba(0,0,0,0.5) 50%, 
                rgba(0,0,0,0.8) 100%)`;
              
              if (safeXVal < -30) {
                return `linear-gradient(to bottom, 
                  rgba(255,100,100,${intensity * 0.3}) 0%, 
                  rgba(255,50,50,${intensity * 0.4}) 50%, 
                  rgba(200,0,0,${intensity * 0.5}) 100%), ${baseOverlay}`;
              } else if (safeXVal > 30) {
                return `linear-gradient(to bottom, 
                  rgba(100,255,100,${intensity * 0.3}) 0%, 
                  rgba(50,255,50,${intensity * 0.4}) 50%, 
                  rgba(0,200,0,${intensity * 0.5}) 100%), ${baseOverlay}`;
              }
              return baseOverlay;
            }),
            opacity: x.to((xVal) => {
              const safeXVal = safeMath(xVal);
              return Math.max(0.8, 1 - Math.abs(safeXVal) / 200);
            })
          }}
        />
        
        <div className="card-info-overlay">
          <div className="card-top">
            <div className="card-header">
              <div className="category-badge">
                <span className="category-text">{item.category}</span>
              </div>
              <div className="odds-badge">
                <span className="odds-text">{item.odds}</span>
              </div>
            </div>
            <h2 className="title-text">{item.title}</h2>
            <div className="description-container">
              <p className={`description-text ${showFullDescription ? 'description-full' : ''}`}>
                {showFullDescription ? item.fullDescription : item.description}
              </p>
              {!showFullDescription && item.fullDescription && item.fullDescription.length > 150 && (
                <button
                  className="see-description-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullDescription(true);
                  }}
                >
                  See More
                </button>
              )}
              {showFullDescription && (
                <button
                  className="see-description-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullDescription(false);
                  }}
                >
                  Show Less
                </button>
              )}
            </div>
          </div>

          <div className="market-stats">
            <div className="category-badge">
            <span className="stat-text">{item.originalData?.coin || 'PSG'}</span>
              </div>
          </div>

          <div className="bottom-actions">
            <div className="bet-display">
                              <div className="bet-label">Your Prediction</div>
              <div className="bet-amount-large">{betAmount.toFixed(2)}</div>
            </div>
            <button 
              className="pass-button-inline"
              onClick={(e) => {
                e.stopPropagation();
                onPass(item);
              }}
            >
              <span className="pass-text">PASS</span>
            </button>
          </div>
        </div>
      </div>
    </animated.div>
  );
};

// Wallet Button Component
const WalletButton = ({ onWalletChange }: { onWalletChange: (address: string | null) => void }) => {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    onWalletChange(isConnected ? address || null : null);
  }, [isConnected, address, onWalletChange]);

  return (
    <div className="wallet-button-container">
      <ConnectButton />
    </div>
  );
};

export default function App() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [betAmount, setBetAmount] = useState(5);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [explosions, setExplosions] = useState<any[]>([]);
  const [calmMode, setCalmMode] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<{[marketAddress: string]: boolean}>({});
  
  const { user, isAuthenticated, incrementSwipes, incrementCorrectPredictions } = useAuth();
  const publicClient = usePublicClient();
  
  // Contract integration - using wagmi client directly
  const {
    markets,
    loading: marketsLoading,
    error: marketsError,
    userBalances,
    fetchMarkets,
    fetchUserBalance,
    placeBet: placeBetFromHook,
    checkApproval,
    approveMarket
  } = useContracts(publicClient as any, undefined);

  const safeMath = (value: number, fallback = 0) => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return fallback;
    }
    return value;
  };

  const handleExplosion = (direction: 'left' | 'right') => {
    const explosionX = direction === 'left' ? window.innerWidth * 0.2 : window.innerWidth * 0.8;
    const explosionY = window.innerHeight * 0.5;
    const color = direction === 'left' ? '#ff0080' : '#00ff80';
    
    const newExplosion = {
      id: Date.now() + Math.random(),
      x: explosionX,
      y: explosionY,
      color
    };
    setExplosions(prev => [...prev, newExplosion]);
  };

  const removeExplosion = (id: number) => {
    setExplosions(prev => prev.filter(exp => exp.id !== id));
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getAllQuestions();
      console.log('Questions data:', data);
      
      if (data && Array.isArray(data)) {
        const gradients = [
          ['#ff9a9e', '#fecfef'],
          ['#ffecd2', '#fcb69f'],
          ['#a8edea', '#fed6e3'],
          ['#ffd89b', '#19547b'],
          ['#89f7fe', '#66a6ff'],
          ['#fa709a', '#fee140'],
          ['#a1c4fd', '#c2e9fb'],
          ['#fbc2eb', '#a6c1ee'],
          ['#fdbb2d', '#22c1c3'],
          ['#ff758c', '#ff7eb3'],
          ['#667eea', '#764ba2'],
          ['#f093fb', '#f5576c'],
          ['#4facfe', '#00f2fe'],
          ['#43e97b', '#38f9d7'],
          ['#fa71cd', '#c471f5'],
          ['#ffeaa7', '#fab1a0'],
          ['#74b9ff', '#0984e3'],
          ['#fd79a8', '#fdcb6e'],
          ['#6c5ce7', '#a29bfe'],
          ['#00cec9', '#55efc4'],
        ];
        
        const processedQuestions = data.map((question, index) => {
          const truncateDescription = (text: string, maxLength = 150) => {
            if (!text) return 'Predict market outcomes and win prizes';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
          };
          
          const getRandomGradient = () => {
            return gradients[Math.floor(Math.random() * gradients.length)];
          };
          
          const getImageUrl = (question: Question) => {
            if (question.image_url) return question.image_url;
            
            // Default fallback image
            return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=600&fit=crop';
          };
          
          const odds = '50% YES'; // Placeholder odds
          const volume = '1.2K'; // Placeholder volume
          
          // Get category display info
          const categoryInfo = CATEGORY_MAPPING[question.category] || { name: 'General', icon: '🌍' };
          
          return {
            id: question.id,
            title: question.title,
            description: truncateDescription(question.description || ''),
            fullDescription: question.description,
            category: `${categoryInfo.icon} ${categoryInfo.name}`,
            odds: odds,
            volume: volume,
            gradient: getRandomGradient(),
            image: getImageUrl(question),
            originalData: question
          };
        });
        
        setQuestions(processedQuestions);
        setCurrentIndex(0);
      } else {
        setError('No questions found');
      }
    } catch (err: any) {
      console.error('Error fetching questions:', err);
      setError(err.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Fetch markets when wallet is connected
  useEffect(() => {
    if (connectedWallet) {
      fetchMarkets(connectedWallet);
      fetchUserBalance(connectedWallet);
    }
  }, [connectedWallet, fetchMarkets, fetchUserBalance]);

  const handleWalletChange = async (address: string | null) => {
    setConnectedWallet(address);
    
    if (address) {
      // Create or get user when wallet connects
      try {
        console.log('🔗 Wallet connected, getting/creating user...');
        const user = await usersService.getOrCreate(address);
        console.log('✅ User ready:', user.id);
        
        // Update last active
        await usersService.updateLastActive(address);
      } catch (error) {
        console.error('❌ Error handling wallet connection:', error);
      }
    } else {
      // Clear approval status when wallet disconnects
      setApprovalStatus({});
    }
  };

  // Shared bet placement function to prevent duplicate code
  const placeBetOnMarket = async (item: any, voteYes: boolean) => {
    console.log('🎯 BET PLACEMENT STARTED');
    console.log(`Betting ${voteYes ? 'YES' : 'NO'} on:`, item.title);
    console.log('Amount:', betAmount);
    console.log('Wallet:', connectedWallet);
    
    if (isPlacingBet) {
      console.log('❌ Bet already in progress');
      return;
    }
    
    if (!connectedWallet) {
      console.log('❌ No wallet connected');
      nextCard();
      return;
    }
    
    const marketAddress = await getMarketAddressForQuestion(item.id, item.title);
    if (!marketAddress) {
      console.log('❌ No market address found');
      alert('This question is not available for betting yet');
      nextCard();
      return;
    }
    
    setIsPlacingBet(true);
    
    try {
      // Increment swipe count
      if (isAuthenticated && user) {
        await incrementSwipes();
      }
      
      // Get provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create contracts
      const market = new ethers.Contract(marketAddress, PREDICTION_MARKET_ABI, signer);
      const fanTokenAddress = item.originalData?.coin === 'BAR' ? BAR_FAN_TOKEN_ADDRESS : PSG_FAN_TOKEN_ADDRESS;
      const fanToken = new ethers.Contract(fanTokenAddress, FAN_TOKEN_ABI, signer);
      
      // Convert amount to wei
      const amountInWei = ethers.parseUnits(betAmount.toString(), 18);
      
      // Check balance
      const userBalance = await fanToken.balanceOf(connectedWallet);
      if (userBalance < amountInWei) {
        const tokenName = item.originalData?.coin === 'BAR' ? 'BAR' : 'PSG';
        throw new Error(`Insufficient balance. You have ${ethers.formatUnits(userBalance, 18)} ${tokenName}`);
      }
      
      // Check and handle approval
      const allowance = await fanToken.allowance(connectedWallet, marketAddress);
      if (allowance < amountInWei) {
        console.log('🔐 Approval needed...');
        if (approvalStatus[marketAddress]) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const newAllowance = await fanToken.allowance(connectedWallet, marketAddress);
          if (newAllowance < amountInWei) {
            throw new Error('Approval is taking too long. Please try again.');
          }
        } else {
          setApprovalStatus(prev => ({ ...prev, [marketAddress]: true }));
          try {
            const approveTx = await fanToken.approve(marketAddress, amountInWei);
            await approveTx.wait();
          } finally {
            setApprovalStatus(prev => ({ ...prev, [marketAddress]: false }));
          }
        }
      }
      
      // Check market status before placing bet
      console.log('🔍 Checking market status...');
      try {
        const isResolved = await market.resolved();
        const endTime = await market.endTime();
        const currentTime = Math.floor(Date.now() / 1000);
        
        console.log('📋 Market status:', {
          isResolved,
          endTime: endTime.toString(),
          currentTime,
          timeRemaining: Number(endTime) - currentTime
        });
        
        if (isResolved) {
          throw new Error('Market is already resolved');
        }
        
        if (currentTime >= Number(endTime)) {
          throw new Error('Market has ended');
        }
      } catch (statusError) {
        console.error('❌ Market status check failed:', statusError);
        throw new Error('Cannot place bet: Market is not available');
      }
      
      // Place bet
      console.log('🚀 Placing bet on blockchain...');
      const encodedData = market.interface.encodeFunctionData('placeBet', [voteYes, amountInWei]);
      const tx = {
        to: marketAddress,
        data: encodedData,
        gasLimit: 500000
      };
      
      const betTx = await signer.sendTransaction(tx);
      console.log('📝 Transaction sent:', betTx.hash);
      
      const receipt = await betTx.wait();
      console.log('✅ Transaction confirmed:', receipt.hash);
      
      if (receipt.status === 0) {
        // Try to get more details about the revert
        console.error('❌ Transaction reverted. Receipt:', receipt);
        throw new Error('Transaction failed on chain - Market may be closed or resolved');
      }
      
      // Save to database
      console.log('💾 Saving bet to database...');
      const betData = await betsService.create({
        question_id: item.id,
        wallet_address: connectedWallet.toLowerCase(),
        outcome: voteYes ? 'YES' : 'NO',
        amount: betAmount.toString(),
        market_address: marketAddress,
        transaction_hash: betTx.hash,
        coin: item.originalData?.coin || 'PSG'
      });
      console.log('✅ Bet saved to database:', betData);
      
      // Refresh markets
      if (connectedWallet) {
        await fetchMarkets(connectedWallet);
      }
      
      alert('Bet placed successfully! Transaction: ' + betTx.hash);
      nextCard();
      
    } catch (error) {
      console.error('❌ Bet placement error:', error);
      alert('Failed to place bet: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsPlacingBet(false);
    }
  };

  const handleSwipeLeft = async (item: any) => {
    await placeBetOnMarket(item, false); // false = NO
  };

  const handleSwipeRight = async (item: any) => {
    await placeBetOnMarket(item, true); // true = YES
  };

  const handlePassCard = async (item: any) => {
    console.log('Pass card:', item);
    
    try {
      // Increment swipe count for pass too
      if (isAuthenticated && user) {
        console.log('Incrementing swipes for pass, user:', user.id);
        await incrementSwipes();
      }
    } catch (error) {
      console.error('Error incrementing swipes:', error);
    }
    
    nextCard();
  };

  const nextCard = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= questions.length) {
        fetchQuestions();
        return 0;
      }
      return nextIndex;
    });
  };

  const currentCard = questions[currentIndex];

  if (loading) {
    return (
      <div className="app-container">
        <div className="app-background">
          <div className="loading-container">
            <div className="loading-card">
              <div className="loading-spinner"></div>
              <h2 className="loading-title">Loading Questions...</h2>
              <p className="loading-subtitle">Fetching the latest prediction questions</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="app-background">
          <div className="loading-container">
            <div className="error-card">
              <div className="error-icon">⚠️</div>
              <h2 className="error-title">Connection Error</h2>
              <p className="error-subtitle">{error}</p>
              <button className="retry-button" onClick={fetchQuestions}>
                <span className="retry-icon">🔄</span>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className={`app-background ${calmMode ? 'calm-mode' : ''}`}>
        <div className="app-header">
          <div className="header-left">
            <div className="logo-section">
              <div className="logo-container">
                <img src="/logo.png" alt="PSG Predict Logo" className="logo-image" />
                <div className="logo-text">
                  <h1 className="header-title">CHILLSWIPE</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="header-right">
            {/* Desktop Buttons */}
            <div className="desktop-buttons">
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => setShowLeaderboard(true)}
                    className="header-btn leaderboard-btn"
                    title="Leaderboard"
                  >
                    <span className="btn-text">Leaderboard</span>
                  </button>
                  <button
                    onClick={() => setShowProfile(true)}
                    className="header-btn profile-btn"
                    title="Profile"
                  >
                    <span className="btn-text">Profile</span>
                  </button>
                </>
              )}
              <WalletButton onWalletChange={handleWalletChange} />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-btn"
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
              <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                <div className="mobile-menu-header">
                  <h3 className="mobile-menu-title">Menu</h3>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="mobile-menu-close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mobile-menu-content">
                  {isAuthenticated && (
                    <>
                      <button
                        onClick={() => {
                          setShowLeaderboard(true);
                          setMobileMenuOpen(false);
                        }}
                        className="mobile-menu-item"
                      >
                        <span className="mobile-menu-icon">🏆</span>
                        <span>Leaderboard</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowProfile(true);
                          setMobileMenuOpen(false);
                        }}
                        className="mobile-menu-item"
                      >
                        <span className="mobile-menu-icon">👤</span>
                        <span>Profile</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="cards-container">
          <AmountSelector 
            betAmount={betAmount} 
            setBetAmount={setBetAmount} 
          />
          

          
          {currentCard && (
            <SwipeCard
              key={currentCard.id}
              item={currentCard}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onPass={handlePassCard}
              onExplosion={handleExplosion}
              betAmount={betAmount}
              isTop={true}
              isPlacingBet={isPlacingBet}
            />
          )}
        </div>
        
        {/* Calm Mode Toggle Button */}
        <button 
          className={`calm-mode-toggle ${calmMode ? 'active' : ''}`}
          onClick={() => setCalmMode(!calmMode)}
          title={calmMode ? 'Disable Calm Mode' : 'Enable Calm Mode'}
        >
          <span className="calm-icon">⚽</span>
        </button>
        
        {/* Explosion effects */}
        {explosions.map((explosion) => (
          <ParticleExplosion
            key={explosion.id}
            x={explosion.x}
            y={explosion.y}
            color={explosion.color}
            onComplete={() => removeExplosion(explosion.id)}
          />
        ))}
        
        {/* User Profile Modal */}
        <UserProfile 
          isOpen={showProfile} 
          onClose={() => setShowProfile(false)} 
        />
        
        {/* Leaderboard Modal */}
        <Leaderboard 
          isOpen={showLeaderboard} 
          onClose={() => setShowLeaderboard(false)} 
        />
        
        {/* AI Chatbot */}
        <AIChatbot />

      </div>
    </div>
  );
} 
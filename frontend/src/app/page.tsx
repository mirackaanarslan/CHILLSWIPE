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
import { MarketsModal } from '@/components/MarketsModal';
import { ethers } from 'ethers';

// Contract ABIs
const PREDICTION_MARKET_ABI = [
  'function placeBet(bool voteYes, uint256 amount) external',
  'function totalYes() public view returns (uint256)',
  'function totalNo() public view returns (uint256)',
  'function question() public view returns (string memory)',
  'function endTime() public view returns (uint256)',
  'function getUserBets(address user) public view returns (tuple(uint8 choice, uint256 amount)[])',
  'function resolveMarket(bool outcomeIsYes) external',
  'function initialized() public view returns (bool)',
  'function creator() public view returns (address)',
  'function token() public view returns (address)',
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
const PSG_FAN_TOKEN_ADDRESS = '0xcc59fe0fE274F3e6153f3e60fa81cf51f7B67495';
const BAR_FAN_TOKEN_ADDRESS = '0xCF1d782aE0EF091dDc21Ef179740F5A12bEE9FA9';

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
          <span className="amount-label">Bet Amount</span>
          <span className="amount-value">${betAmount.toFixed(2)}</span>
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
              ${amount}
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
            <span>${minAmount}</span>
            <span>${maxAmount}</span>
          </div>
        </div>
      </div>

      {/* Mobile Version */}
      <div className="mobile-amount-selector">
        <div className="mobile-amount-title">Bet Amount</div>
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
              <div className="bet-label">Your Bet</div>
              <div className="bet-amount-large">${betAmount.toFixed(2)}</div>
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
  const [showMarkets, setShowMarkets] = useState(false);
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

  const handleWalletChange = (address: string | null) => {
    setConnectedWallet(address);
    // Clear approval status when wallet changes
    if (!address) {
      setApprovalStatus({});
    }
  };

  // Shared bet placement function to prevent duplicate code
  const placeBetOnMarket = async (item: any, voteYes: boolean) => {
    console.log('=== STARTING BET PLACEMENT ===');
    console.log(`Placing bet: ${voteYes ? 'YES' : 'NO'} on item:`, item);
    console.log('Current betAmount:', betAmount);
    console.log('Connected wallet:', connectedWallet);
    console.log('Item coin:', item.originalData?.coin);
    console.log('Item market address:', item.originalData?.market_address);
    console.log('=== END INITIAL LOGS ===');
    
    // Prevent duplicate transactions
    if (isPlacingBet) {
      console.log('Bet already in progress, skipping...');
      return;
    }
    
    // Check if wallet is connected
    if (!connectedWallet) {
      console.log('No wallet connected, showing warning but continuing');
      console.warn('Wallet not connected - bet will not be recorded');
      nextCard();
      return;
    }
    
    // Check if we have a market address for this question
    const marketAddress = getMarketAddressForQuestion(item.id, item.title);
    if (!marketAddress) {
      console.log('No market address found for question:', item.id, 'title:', item.title);
      alert('This question is not available for betting yet');
      nextCard();
      return;
    }
    
    console.log('Market address for question:', marketAddress);
    console.log('Using market address from getMarketAddressForQuestion:', marketAddress);
    console.log('Item original data market address:', item.originalData?.market_address);
    
    setIsPlacingBet(true);
    
    try {
      // Increment swipe count first
      if (isAuthenticated && user) {
        console.log('Incrementing swipes for user:', user.id);
        await incrementSwipes();
      }
      
      // Get signer from wallet
      if (!publicClient) {
        throw new Error('No public client available');
      }
      
      console.log('=== CONTRACT CREATION ===');
      console.log('Public client:', publicClient);
      
      // Use window.ethereum directly for provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      console.log('Provider created:', provider);
      console.log('Signer created:', signer);
      console.log('Signer address:', await signer.getAddress());
      
      // Create contract instances
      console.log('Creating market contract with address:', marketAddress);
      console.log('Using ABI:', PREDICTION_MARKET_ABI);
      const market = new ethers.Contract(marketAddress, PREDICTION_MARKET_ABI, signer);
      console.log('Market contract created:', market);
      console.log('Market contract target:', market.target);
      console.log('Market contract interface:', market.interface);
      
      // Determine which fan token to use based on the question
      const fanTokenAddress = item.originalData?.coin === 'BAR' ? BAR_FAN_TOKEN_ADDRESS : PSG_FAN_TOKEN_ADDRESS;
      console.log('Using fan token address:', fanTokenAddress);
      console.log('For coin:', item.originalData?.coin);
      console.log('BAR_FAN_TOKEN_ADDRESS:', BAR_FAN_TOKEN_ADDRESS);
      console.log('PSG_FAN_TOKEN_ADDRESS:', PSG_FAN_TOKEN_ADDRESS);
      
      const fanToken = new ethers.Contract(fanTokenAddress, FAN_TOKEN_ABI, signer);
      console.log('Fan token contract created:', fanToken);
      console.log('Fan token contract target:', fanToken.target);
      console.log('=== END CONTRACT CREATION ===');
      
      // Check if contract is initialized
      console.log('=== CONTRACT INITIALIZATION CHECK ===');
      console.log('Checking contract initialization for address:', marketAddress);
      console.log('Coin:', item.originalData?.coin);
      
      try {
        console.log('Calling market.initialized()...');
        const initialized = await market.initialized();
        console.log('Contract initialized result:', initialized);
        
        if (!initialized) {
          console.error('Contract is not initialized!');
          throw new Error('Contract is not initialized');
        }
        
        console.log('Calling market.creator()...');
        const creator = await market.creator();
        console.log('Contract creator:', creator);
        
        console.log('Calling market.token()...');
        const tokenAddress = await market.token();
        console.log('Contract token address:', tokenAddress);
        console.log('Expected fan token address:', fanTokenAddress);
        console.log('Token addresses match:', tokenAddress.toLowerCase() === fanTokenAddress.toLowerCase());
        
        console.log('Contract is properly initialized');
        console.log('=== END INITIALIZATION CHECK ===');
      } catch (initError) {
        console.error('=== CONTRACT INITIALIZATION ERROR ===');
        console.error('Contract initialization check failed:', initError);
        console.error('Error message:', initError.message);
        console.error('Error code:', initError.code);
        console.error('Error data:', initError.data);
        console.error('Market address:', marketAddress);
        console.error('Coin:', item.originalData?.coin);
        console.error('=== END INITIALIZATION ERROR ===');
        throw new Error('Contract initialization check failed: ' + initError.message);
      }
      
      // Convert amount to wei (18 decimals)
      const amountInWei = ethers.parseUnits(betAmount.toString(), 18);
      
      console.log('Placing bet with amount:', amountInWei.toString());
      
      // Check user balance
      const userBalance = await fanToken.balanceOf(connectedWallet);
      console.log('User balance:', userBalance.toString());
      
      if (userBalance < amountInWei) {
        const tokenName = item.originalData?.coin === 'BAR' ? 'BAR' : 'PSG';
        throw new Error(`Insufficient balance. You have ${ethers.formatUnits(userBalance, 18)} ${tokenName}, but trying to bet ${betAmount} ${tokenName}`);
      }
      
      // Check allowance
      const allowance = await fanToken.allowance(connectedWallet, marketAddress);
      console.log('Current allowance:', allowance.toString());
      
      if (allowance < amountInWei) {
        console.log('Approval needed, requesting approval...');
        
        // Check if we're already in the process of approving this market
        if (approvalStatus[marketAddress]) {
          console.log('Approval already in progress for this market, waiting...');
          // Wait a bit and check again
          await new Promise(resolve => setTimeout(resolve, 2000));
          const newAllowance = await fanToken.allowance(connectedWallet, marketAddress);
          if (newAllowance < amountInWei) {
            throw new Error('Approval is taking too long. Please try again.');
          }
        } else {
          // Set approval status to prevent duplicate approvals
          setApprovalStatus(prev => ({ ...prev, [marketAddress]: true }));
          
          try {
            const approveTx = await fanToken.approve(marketAddress, amountInWei);
            console.log('Approval transaction sent:', approveTx.hash);
            
            // Wait for approval confirmation
            const approveReceipt = await approveTx.wait();
            console.log('Approval confirmed on-chain:', approveReceipt.hash);
            
            // Double-check allowance after approval
            const finalAllowance = await fanToken.allowance(connectedWallet, marketAddress);
            console.log('Final allowance after approval:', finalAllowance.toString());
            
            if (finalAllowance < amountInWei) {
              throw new Error('Approval was confirmed but allowance is still insufficient');
            }
          } finally {
            // Clear approval status
            setApprovalStatus(prev => ({ ...prev, [marketAddress]: false }));
          }
        }
      }
      
      // Place the bet
      console.log('Placing bet on market...');
      console.log('Market address:', marketAddress);
      console.log('Vote yes:', voteYes);
      console.log('Amount in wei:', amountInWei.toString());
      
      // Log the transaction data that will be sent
      const placeBetData = market.interface.encodeFunctionData('placeBet', [voteYes, amountInWei]);
      console.log('Transaction data:', placeBetData);
      console.log('Market interface:', market.interface);
      console.log('Market interface functions:', Object.keys(market.interface.fragments));
      
      // Check if placeBet function exists in ABI
      const placeBetFunction = market.interface.getFunction('placeBet');
      console.log('placeBet function:', placeBetFunction);
      console.log('placeBet function signature:', placeBetFunction?.format());
      

      
      try {
        console.log('=== TRANSACTION EXECUTION ===');
        console.log('Coin:', item.originalData?.coin);
        console.log('Market address:', marketAddress);
        console.log('Vote yes:', voteYes);
        console.log('Amount in wei:', amountInWei.toString());
        
        // For Barcelona contracts, send transaction directly to avoid contract method issues
        if (item.originalData?.coin === 'BAR') {
          console.log('=== BARCELONA CONTRACT APPROACH ===');
          console.log('Using direct transaction approach for Barcelona');
          
          // Encode the function call manually
          const encodedData = market.interface.encodeFunctionData('placeBet', [voteYes, amountInWei]);
          console.log('Encoded data for direct transaction:', encodedData);
          console.log('Function signature: placeBet(bool,uint256)');
          console.log('Parameters:', [voteYes, amountInWei]);
          
          // Send transaction directly
          const tx = {
            to: marketAddress,
            data: encodedData,
            gasLimit: 500000
          };
          
          console.log('Direct transaction object:', tx);
          console.log('Signer address:', await signer.getAddress());
          console.log('Signer provider:', signer.provider);
          
          const betTx = await signer.sendTransaction(tx);
          console.log('Direct transaction sent:', betTx.hash);
          console.log('Transaction object:', betTx);
          
          const receipt = await betTx.wait();
          console.log('Direct transaction receipt:', receipt);
          console.log('Transaction status:', receipt.status);
          console.log('Transaction logs:', receipt.logs);
          console.log('Gas used:', receipt.gasUsed.toString());
          
          if (receipt.status === 0) {
            console.error('Direct transaction failed - status 0');
            console.error('Receipt details:', receipt);
            throw new Error('Direct transaction failed on chain - status 0');
          }
          
          console.log('Barcelona bet confirmed successfully!');
          alert('Barcelona bet placed successfully! Transaction: ' + betTx.hash);
          nextCard();
          return;
        }
        
        // For PSG contracts, use normal contract method
        console.log('=== PSG CONTRACT APPROACH ===');
        console.log('Using normal contract method for PSG');
        
        const gasOptions = { gasLimit: 500000 };
        console.log('Gas options:', gasOptions);
        
        const betTx = await market.placeBet(voteYes, amountInWei, gasOptions);
        console.log('Bet transaction sent:', betTx.hash);
        console.log('Transaction object:', betTx);
        
        const receipt = await betTx.wait();
        console.log('Transaction receipt:', receipt);
        console.log('Transaction status:', receipt.status);
        console.log('Transaction logs:', receipt.logs);
        console.log('Gas used:', receipt.gasUsed.toString());
        
        if (receipt.status === 0) {
          console.error('Transaction failed on chain. Receipt:', receipt);
          throw new Error('Transaction failed on chain - status 0');
        }
        
        console.log('PSG bet confirmed successfully!');
        console.log('Transaction logs:', receipt.logs);
        console.log('Transaction logs:', receipt.logs);
        
        // Refresh markets after successful bet
        if (connectedWallet) {
          await fetchMarkets(connectedWallet);
        }
        
        alert('Bet placed successfully! Transaction: ' + betTx.hash);
        
        // Only move to next card after successful bet
        nextCard();
      } catch (txError) {
        console.error('=== TRANSACTION ERROR DETAILS ===');
        console.error('Error object:', txError);
        console.error('Error message:', txError.message);
        console.error('Error code:', txError.code);
        console.error('Error data:', txError.data);
        console.error('Error transaction:', txError.transaction);
        console.error('Error receipt:', txError.receipt);
        console.error('Error reason:', txError.reason);
        console.error('Error invocation:', txError.invocation);
        console.error('Error revert:', txError.revert);
        
        // Check if it's a contract revert
        if (txError.data) {
          console.error('Contract revert data:', txError.data);
        }
        
        // Try to decode revert reason if available
        if (txError.reason) {
          console.error('Revert reason:', txError.reason);
        }
        
        // Log the exact function call that failed
        console.error('Failed function call details:');
        console.error('- Function: placeBet');
        console.error('- Parameters:', [voteYes, amountInWei]);
        console.error('- Market address:', marketAddress);
        console.error('- Coin:', item.originalData?.coin);
        console.error('- Approach:', item.originalData?.coin === 'BAR' ? 'Direct transaction' : 'Contract method');
        
        console.error('=== END TRANSACTION ERROR ===');
        throw txError;
      }
      
    } catch (error) {
      console.error('Error placing bet:', error);
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
                <div className="logo-icon">
                  <div className="logo-pulse"></div>
                  <span className="logo-symbol">PP</span>
                </div>
                <div className="logo-text">
                  <h1 className="header-title">PSG Predict</h1>
                  <p className="header-subtitle">Swipe for victory</p>
                </div>
              </div>
            </div>
          </div>
          <div className="header-right">
            {/* Desktop Buttons */}
            <div className="desktop-buttons">
              <button
                onClick={() => setShowMarkets(true)}
                className="header-btn markets-btn"
                title="Markets"
              >
                <span className="btn-text">Markets</span>
              </button>
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

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="mobile-menu">
              <div className="mobile-menu-content">
                <button
                  onClick={() => {
                    setShowMarkets(true);
                    setMobileMenuOpen(false);
                  }}
                  className="mobile-menu-item"
                >
                  <span>Markets</span>
                </button>
                {isAuthenticated && (
                  <>
                    <button
                      onClick={() => {
                        setShowLeaderboard(true);
                        setMobileMenuOpen(false);
                      }}
                      className="mobile-menu-item"
                    >
                      <span>Leaderboard</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowProfile(true);
                        setMobileMenuOpen(false);
                      }}
                      className="mobile-menu-item"
                    >
                      <span>Profile</span>
                    </button>
                  </>
                )}
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
        
        {/* Markets Modal */}
        <MarketsModal
          isOpen={showMarkets}
          onClose={() => setShowMarkets(false)}
          markets={markets}
          userAddress={connectedWallet || undefined}
          userBalance={userBalances?.PSG || undefined}
          onPlaceBet={placeBetFromHook}
          onApprove={approveMarket}
          checkApproval={checkApproval}
        />
      </div>
    </div>
  );
} 
import { ethers } from 'ethers';

export interface UserBet {
  choice: number; // 0 = None, 1 = Yes, 2 = No
  amount: bigint;
}

export interface MarketData {
  question: string;
  endTime: bigint;
  totalYes: bigint;
  totalNo: bigint;
  resolved: boolean;
  outcome: number;
  userBets: UserBet[];
}

const ABI = [
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
]

export class PredictionMarket {
  contract: ethers.Contract;
  data?: MarketData;

  constructor(
    public address: string,
    provider: ethers.Provider,
    signer?: ethers.Signer
  ) {
    const signerOrProvider = signer ?? provider;
    this.contract = new ethers.Contract(address, ABI, signerOrProvider);
  }

  async loadData(userAddress?: string): Promise<MarketData> {
    const [question, totalYes, totalNo, endTime, resolved, outcome] =
      await Promise.all([
        this.contract.question(),
        this.contract.totalYes(),
        this.contract.totalNo(),
        this.contract.endTime(),
        this.contract.resolved(),
        this.contract.outcome()
      ]);

    let userBets: UserBet[] = [];

    if (userAddress) {
      try {
        const bets = await this.contract.getUserBets(userAddress);
        userBets = bets.map((bet: any) => ({
          choice: bet.choice,
          amount: bet.amount
        }));
      } catch (e) {
        // Safe fallback: user has no bets
      }
    }

    this.data = {
      question,
      totalYes,
      totalNo,
      endTime,
      resolved,
      outcome,
      userBets
    };

    return this.data;
  }

  async placeBet(voteYes: boolean, amount: bigint): Promise<ethers.TransactionReceipt> {
    const tx = await this.contract.placeBet(voteYes, amount);
    return await tx.wait();
  }

  async resolveMarket(outcomeIsYes: boolean): Promise<ethers.TransactionReceipt> {
    const tx = await this.contract.resolveMarket(outcomeIsYes);
    return await tx.wait();
  }
  
  async getMarketData(userAddress?: string): Promise<MarketData> {
    const question = await this.contract.question();
    const endTime = await this.contract.endTime();
    const totalYes = await this.contract.totalYes();
    const totalNo = await this.contract.totalNo();
    const resolved = await this.contract.resolved();
    const outcome = await this.contract.outcome();
  
    let userBets: UserBet[] = [];
    if (userAddress) {
      try {
        const bets = await this.contract.getUserBets(userAddress);
        userBets = bets.map((bet: any) => ({
          choice: bet.choice,
          amount: bet.amount,
        }));
      } catch (e) {
        // User has no bets
      }
    }
  
    return {
      question,
      endTime,
      totalYes,
      totalNo,
      resolved,
      outcome,
      userBets,
    };
  }
}


import { ethers } from 'ethers';
import { PredictionMarket } from './PredictionMarket';

export const PredictionFactoryAbi = [
  "function getAllMarkets() external view returns (address[])",
  "function createMarket(string question, address token, uint256 endTime) external returns (address)",
  "event MarketCreated(address indexed marketAddress, address indexed creator)"
];


export class PredictionFactory {
  contract: ethers.Contract;

  constructor(provider: ethers.Provider, signer?: ethers.Signer, address: string = '0xfAB709a38114bEDE7c5939D4a9334376aBFF058d') {
    const signerOrProvider = signer ?? provider;
    this.contract = new ethers.Contract(address, PredictionFactoryAbi, signerOrProvider);
  }

  async getAllMarkets(): Promise<string[]> {
    return await this.contract.getAllMarkets();
  }

  async createMarket(question: string, token: string, endTime: number): Promise<ethers.TransactionReceipt> {
    const tx = await this.contract.createMarket(question, token, endTime);
    return await tx.wait();
  }

  async getMarketsWithDetails(provider: ethers.Provider, userAddress?: string): Promise<{ address: string, market: PredictionMarket }[]> {
    const addresses = await this.getAllMarkets();
    const markets = await Promise.all(
      addresses.map(async (addr) => {
        const market = new PredictionMarket(addr, provider);
        await market.loadData(userAddress);
        return { address: addr, market };
      })
    );
    return markets;
  }
}

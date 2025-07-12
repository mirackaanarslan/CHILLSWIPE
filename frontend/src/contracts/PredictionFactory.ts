import { ethers } from 'ethers';
import { PredictionMarket } from './PredictionMarket';

export const PredictionFactoryAbi = [
  "function getAllMarkets() external view returns (address[])",
  "function createMarket(string question, address token, uint256 endTime) external returns (address)",
  "event MarketCreated(address indexed marketAddress, address indexed creator)"
];


export class PredictionFactory {
  contract: ethers.Contract;

  constructor(provider: ethers.Provider, address: string, signer?: ethers.Signer) {
    const signerOrProvider = signer ?? provider;
    this.contract = new ethers.Contract(address, PredictionFactoryAbi, signerOrProvider);
  }

  // Static method to get factory address based on coin type
  static getFactoryAddress(coin: 'PSG' | 'BAR'): string {
    const factoryAddresses = {
      'PSG': '0xC35dF331c5ee456142CC25F000a1d29297CcfD47',
      'BAR': '0xC35dF331c5ee456142CC25F000a1d29297CcfD47' // Same factory for now, but could be different
    };
    return factoryAddresses[coin] || factoryAddresses['PSG'];
  }

  // Factory method to create PredictionFactory instance for specific coin
  static createForCoin(
    provider: ethers.Provider,
    coin: 'PSG' | 'BAR',
    signer?: ethers.Signer
  ): PredictionFactory {
    const address = this.getFactoryAddress(coin);
    return new PredictionFactory(provider, address, signer);
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

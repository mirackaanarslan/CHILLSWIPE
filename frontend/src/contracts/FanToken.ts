import { ethers } from 'ethers';

export const FanTokenAbi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

export class FanToken {
  contract: ethers.Contract;

  constructor(
    provider: ethers.Provider,
    public address: string,
    signer?: ethers.Signer
  ) {
    const signerOrProvider = signer ?? provider;
    this.contract = new ethers.Contract(this.address, FanTokenAbi, signerOrProvider);
  }

  // Static method to get token address based on coin type
  static getTokenAddress(coin: 'PSG' | 'BAR'): string {
    const tokenAddresses = {
        'PSG': '0xcc59fe0fE274F3e6153f3e60fa81cf51f7B67495',
  'BAR': '0xCF1d782aE0EF091dDc21Ef179740F5A12bEE9FA9'
    };
    return tokenAddresses[coin] || tokenAddresses['PSG'];
  }

  // Factory method to create FanToken instance for specific coin
  static createForCoin(
    provider: ethers.Provider,
    coin: 'PSG' | 'BAR',
    signer?: ethers.Signer
  ): FanToken {
    const address = this.getTokenAddress(coin);
    return new FanToken(provider, address, signer);
  }

  async balanceOf(user: string): Promise<bigint> {
    return await this.contract.balanceOf(user);
  }

  async allowance(owner: string, spender: string): Promise<bigint> {
    return await this.contract.allowance(owner, spender);
  }

  async needsApproval(owner: string, spender: string, amount: bigint): Promise<boolean> {
    const approved = await this.allowance(owner, spender);
    return approved < amount;
  }

  async approve(spender: string, amount: bigint): Promise<ethers.TransactionReceipt> {
    const tx = await this.contract.approve(spender, amount);
    return await tx.wait();
  }

  parseAmount(amountStr: string): bigint {
    return ethers.parseUnits(amountStr, 18);
  }

  formatAmount(amount: bigint): string {
    return ethers.formatUnits(amount, 18);
  }
}

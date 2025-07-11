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
    signer?: ethers.Signer,
    public address: string = '0xEAF931e3F317BF79E3E8FCEea492Efa013087998'
  ) {
    const signerOrProvider = signer ?? provider;
    this.contract = new ethers.Contract(this.address, FanTokenAbi, signerOrProvider);
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

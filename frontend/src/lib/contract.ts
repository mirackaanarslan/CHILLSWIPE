import { CONTRACT_ADDRESSES } from '@/config'
import { getContract, parseEther, formatEther } from 'viem'
import { useAccount } from 'wagmi'

// PredictionMarket Contract ABI
export const PREDICTION_MARKET_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "questionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "option",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "BetPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "questionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string[]",
        "name": "options",
        "type": "string[]"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      }
    ],
    "name": "QuestionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "questionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "winningOption",
        "type": "uint256"
      }
    ],
    "name": "QuestionResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "questionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "PayoutClaimed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "questionId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "option",
        "type": "uint256"
      }
    ],
    "name": "placeBet",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "questionCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "questions",
    "outputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "winningOption",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "resolved",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "questionId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "winningOption",
        "type": "uint256"
      }
    ],
    "name": "resolveQuestion",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "questionId",
        "type": "uint256"
      }
    ],
    "name": "claimPayout",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "questionId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserBets",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "option",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "claimed",
            "type": "bool"
          }
        ],
        "internalType": "struct PredictionMarket.Bet[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Contract service class
export class PredictionMarketService {
  private contract: any
  private address: string

  constructor(contract: any, address: string) {
    this.contract = contract
    this.address = address
  }

  // Get contract instance
  static async getContract(client: any, networkId: number) {
    const address = networkId === 88888 
      ? CONTRACT_ADDRESSES.chilizMainnet 
      : CONTRACT_ADDRESSES.chilizTestnet
    
    if (!address || address === '0x...') {
      throw new Error('Contract not deployed on this network')
    }

    return getContract({
      address: address as `0x${string}`,
      abi: PREDICTION_MARKET_ABI,
      client
    })
  }

  // Place a bet
  async placeBet(questionId: number, option: number, amount: string) {
    const parsedAmount = parseEther(amount)
    
    const { request } = await this.contract.simulate.placeBet([questionId, option], {
      value: parsedAmount
    })
    
    return this.contract.write.placeBet(request)
  }

  // Claim payout
  async claimPayout(questionId: number) {
    const { request } = await this.contract.simulate.claimPayout([questionId])
    return this.contract.write.claimPayout(request)
  }

  // Get question count
  async getQuestionCount() {
    return this.contract.read.questionCount()
  }

  // Get question details
  async getQuestion(questionId: number) {
    return this.contract.read.questions([questionId])
  }

  // Get user bets for a question
  async getUserBets(questionId: number, userAddress: string) {
    return this.contract.read.getUserBets([questionId, userAddress])
  }

  // Get admin address
  async getAdmin() {
    return this.contract.read.admin()
  }
}

// Hook for using the contract
export function usePredictionMarket() {
  const { address, chainId } = useAccount()

  const getContract = async (client: any) => {
    if (!chainId) throw new Error('No network connected')
    const contract = await PredictionMarketService.getContract(client, chainId)
    return new PredictionMarketService(contract, address || '')
  }

  return {
    getContract,
    isConnected: !!address,
    address,
    chainId
  }
} 
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
          // Chiliz Testnet (Scoville)
      chilizTestnet: {
        url: "https://spicy-rpc.chiliz.com/",
        chainId: 88882,
        accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        gasPrice: 50000000000, // 50 gwei - sabit gas price
      },
    // Chiliz Mainnet
    chilizMainnet: {
      url: "https://rpc.ankr.com/chiliz",
      chainId: 88888,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // Local development
    hardhat: {
      chainId: 1337
    }
  },
  etherscan: {
    apiKey: {
      chilizTestnet: "not-needed", // Chiliz testnet doesn't need API key
      chilizMainnet: "not-needed"  // Chiliz mainnet doesn't need API key
    },
    customChains: [
      {
        network: "chilizTestnet",
        chainId: 88882,
        urls: {
          apiURL: "https://testnet-explorer.chiliz.com/api",
          browserURL: "https://testnet-explorer.chiliz.com"
        }
      },
      {
        network: "chilizMainnet",
        chainId: 88888,
        urls: {
          apiURL: "https://explorer.chiliz.com/api",
          browserURL: "https://explorer.chiliz.com"
        }
      }
    ]
  }
};

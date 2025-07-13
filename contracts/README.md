# Smart Contracts

## Overview

This directory contains the smart contract files for the CHILLSWIPE prediction market application. These files are **view-only** and serve as documentation and reference purposes only.

## Important Note

⚠️ **These contract files are for viewing purposes only!**

The actual smart contract development, compilation, and deployment is done on **Remix IDE** (https://remix.ethereum.org/). These files are copies of the contracts that are actively deployed and used by the application.

## Contract Files

- `FanToken.sol` - Fan token contract for PSG and BAR tokens
- `PredictionFactory.sol` - Factory contract for creating prediction markets
- `PredictionMarket.sol` - Main prediction market contract

## Development Workflow

1. **Contract Development**: All smart contract development happens on Remix IDE
2. **Compilation**: Contracts are compiled using Remix's Solidity compiler
3. **Deployment**: Contracts are deployed to the Chiliz blockchain via Remix
4. **Integration**: Frontend connects to deployed contracts using their addresses

## Why View-Only?

- **Security**: Prevents accidental modifications to production contracts
- **Version Control**: Maintains a clear record of deployed contract versions
- **Documentation**: Serves as reference for frontend developers
- **Audit Trail**: Easy to track which contract versions are deployed

## Getting Started

If you need to modify the smart contracts:

1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Create a new workspace or open existing project
3. Copy the contract files from this directory
4. Make your modifications
5. Compile and deploy on Remix
6. Update the contract addresses in the frontend configuration
7. Update these view-only files to reflect the changes

## Contract Addresses

The deployed contract addresses are configured in the frontend application and can be found in the main configuration files.

---

**Note**: Always verify contract addresses and ensure you're interacting with the correct deployed contracts on the Chiliz blockchain. 
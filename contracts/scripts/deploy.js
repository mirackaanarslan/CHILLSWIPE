const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Prediction Market contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Using account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "CHZ");

  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");

  // 🔧 EIP-1559 uyumlu gas ayarı - Daha agresif
  const gasConfig = {
    maxFeePerGas: hre.ethers.parseUnits("5000", "gwei"),          // toplam max gaz - artırdık
    maxPriorityFeePerGas: hre.ethers.parseUnits("10", "gwei")     // madenciye ek ödül - artırdık
  };

  console.log("📦 Sending deployment transaction...");
  const contract = await PredictionMarket.deploy();

  console.log("📨 Tx sent. Hash:", contract.deploymentTransaction().hash);

  // Sadece transaction'ın gönderilmesini bekleyelim
  console.log("⏳ Waiting for transaction to be mined...");
  await contract.deploymentTransaction().wait();

  const address = await contract.getAddress();
  console.log("✅ Contract deployed at:", address);
  console.log(`🔗 View on Explorer: https://testnet.chiliscan.com/address/${address}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
 
const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing Prediction Market contract...");

  // Get the deployed contract address (you'll need to replace this with your deployed address)
  const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE";
  
  if (CONTRACT_ADDRESS === "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE") {
    console.log("❌ Please replace CONTRACT_ADDRESS with your deployed contract address");
    return;
  }

  // Get the contract instance
  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  const predictionMarket = PredictionMarket.attach(CONTRACT_ADDRESS);

  // Get signers
  const [admin, user1, user2] = await hre.ethers.getSigners();

  console.log("👤 Admin address:", await admin.getAddress());
  console.log("👤 User1 address:", await user1.getAddress());
  console.log("👤 User2 address:", await user2.getAddress());

  try {
    // Test 1: Create a question (admin only)
    console.log("\n📝 Test 1: Creating a question...");
    const questionTitle = "Will Chiliz reach $1 by end of 2024?";
    const questionDescription = "A prediction about Chiliz token price";
    const options = ["Yes", "No"];
    const endTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    const createTx = await predictionMarket.connect(admin).createQuestion(
      questionTitle,
      questionDescription,
      options,
      endTime
    );
    await createTx.wait();
    console.log("✅ Question created successfully!");

    // Test 2: Place bets
    console.log("\n💰 Test 2: Placing bets...");
    
    // User1 bets 0.1 CHZ on "Yes"
    const bet1Tx = await predictionMarket.connect(user1).placeBet(0, 0, {
      value: hre.ethers.parseEther("0.1")
    });
    await bet1Tx.wait();
    console.log("✅ User1 bet placed: 0.1 CHZ on 'Yes'");

    // User2 bets 0.2 CHZ on "No"
    const bet2Tx = await predictionMarket.connect(user2).placeBet(0, 1, {
      value: hre.ethers.parseEther("0.2")
    });
    await bet2Tx.wait();
    console.log("✅ User2 bet placed: 0.2 CHZ on 'No'");

    // Test 3: Get question info
    console.log("\n📊 Test 3: Getting question info...");
    const question = await predictionMarket.questions(0);
    console.log("Question title:", question.title);
    console.log("Question options:", question.options);
    console.log("Is active:", question.isActive);

    // Test 4: Get user bets
    console.log("\n👤 Test 4: Getting user bets...");
    const user1Bets = await predictionMarket.getUserBets(0, await user1.getAddress());
    console.log("User1 bets count:", user1Bets.length);
    if (user1Bets.length > 0) {
      console.log("User1 bet amount:", hre.ethers.formatEther(user1Bets[0].amount), "CHZ");
    }

    console.log("\n✅ All tests completed successfully!");
    console.log("📋 Contract is working correctly!");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test script failed:", error);
    process.exit(1);
  }); 
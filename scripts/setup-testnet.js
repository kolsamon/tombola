const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(__dirname, "lottery-state.json");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;

  console.log("=== Déploiement complet SaturneLottery ===");
  console.log("Réseau      :", network);
  console.log("Deployer    :", deployer.address);
  console.log("Solde BNB   :", ethers.utils.formatEther(await deployer.getBalance()), "BNB");
  console.log("");

  // 1. MockCakeToken — mintable, évite d'avoir besoin d'un faucet externe
  console.log("1) Déploiement MockCakeToken...");
  const MockCake = await ethers.getContractFactory("MockCakeToken");
  const cake = await MockCake.deploy();
  await cake.deployed();
  console.log("   MockCakeToken               :", cake.address);

  // 2. MockRandomNumberGenerator — contrôlable manuellement
  console.log("2) Déploiement MockRandomNumberGenerator...");
  const MockRNG = await ethers.getContractFactory("MockRandomNumberGenerator");
  const rng = await MockRNG.deploy();
  await rng.deployed();
  console.log("   MockRandomNumberGenerator   :", rng.address);

  // 3. SaturneLottery avec les deux mocks
  console.log("3) Déploiement SaturneLottery...");
  const SaturneLottery = await ethers.getContractFactory("SaturneLottery");
  const lottery = await SaturneLottery.deploy(cake.address, rng.address);
  await lottery.deployed();
  console.log("   SaturneLottery              :", lottery.address);

  // 4. Configurer operator / treasury / injector = deployer
  console.log("4) Configuration operator / treasury / injector → deployer...");
  await (await lottery.setOperatorAndTreasuryAndInjectorAddresses(
    deployer.address,
    deployer.address,
    deployer.address
  )).wait();
  console.log("   ✅ Adresses configurées");

  // 5. Minter 100 CAKE au deployer pour les tests
  const MINT_AMOUNT = ethers.utils.parseEther("100");
  console.log("5) Mint de 100 CAKE testnet au deployer...");
  await (await cake.mint(deployer.address, MINT_AMOUNT)).wait();
  const balance = await cake.balanceOf(deployer.address);
  console.log("   ✅ Solde CAKE deployer :", ethers.utils.formatEther(balance), "CAKE");

  // Sauvegarder les adresses dans le fichier d'état
  const existingState = fs.existsSync(STATE_FILE)
    ? JSON.parse(fs.readFileSync(STATE_FILE))
    : {};

  fs.writeFileSync(STATE_FILE, JSON.stringify({
    ...existingState,
    addresses: {
      lottery: lottery.address,
      rng: rng.address,
      cake: cake.address,
    }
  }, null, 2));

  console.log("");
  console.log("=== RÉSUMÉ ===");
  console.log("MockCakeToken               :", cake.address);
  console.log("MockRandomNumberGenerator   :", rng.address);
  console.log("SaturneLottery              :", lottery.address);
  console.log("Operator / Treasury / Injector :", deployer.address);
  console.log("");
  console.log("=== PROCHAINE ÉTAPE ===");
  console.log("LOTTERY_PHASE=start npx hardhat run scripts/lottery-simulate.js --network", network);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

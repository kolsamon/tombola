const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Déploiement avec le compte:", deployer.address);
  console.log("Solde du compte:", (await deployer.getBalance()).toString());

  // Adresses des tokens CAKE pour BSC
  const cakeAddresses = {
    bsc: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", // BSC Mainnet
    bsc_testnet: "0xFa60d973F7642B748046464e165A65B7323b0DEE3" // BSC Testnet
  };

  // Adresse du générateur de nombres aléatoires (à remplacer par l'adresse réelle)
  const randomGeneratorAddresses = {
    bsc: process.env.RANDOM_GENERATOR_MAINNET || "0x0000000000000000000000000000000000000000", // Remplacer
    bsc_testnet: process.env.RANDOM_GENERATOR_TESTNET || "0x0000000000000000000000000000000000000000" // Remplacer
  };

  const network = hre.network.name;
  const cakeAddress = cakeAddresses[network];
  const randomGeneratorAddress = randomGeneratorAddresses[network];

  if (!cakeAddress) {
    throw new Error(`Adresse CAKE non trouvée pour le réseau ${network}`);
  }

  console.log(`Déploiement sur le réseau: ${network}`);
  console.log(`Adresse CAKE: ${cakeAddress}`);
  console.log(`Adresse RandomGenerator: ${randomGeneratorAddress}`);

  // Déploiement du contrat SaturneLottery
  const SaturneLottery = await ethers.getContractFactory("SaturneLottery");
  const saturneLottery = await SaturneLottery.deploy(cakeAddress, randomGeneratorAddress);

  await saturneLottery.deployed();

  console.log("SaturneLottery déployé à l'adresse:", saturneLottery.address);

  // Vérification de la taille du contrat
  const bytecode = SaturneLottery.bytecode;
  const size = (bytecode.length - 2) / 2; // -2 pour "0x", /2 pour bytes
  console.log(`Taille du bytecode: ${size} bytes`);
  console.log(`Limite: 24576 bytes`);
  console.log(`Status: ${size > 24576 ? '❌ TROP GRAND' : '✅ OK'}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
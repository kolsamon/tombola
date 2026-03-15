const SaturneLottery = artifacts.require("SaturneLottery");

module.exports = async function (deployer, network, accounts) {
  console.log(`Déploiement sur le réseau: ${network}`);
  console.log(`Compte utilisé: ${accounts[0]}`);

  // Adresses des tokens CAKE
  const cakeAddresses = {
    development: "0x0000000000000000000000000000000000000000", // Adresse fictive pour local
    bsc: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", // BSC Mainnet
    bsc_testnet: "0xFa60d973F7642B748046464e165A65B7323b0DEE3" // BSC Testnet
  };

  // Adresses du générateur de nombres aléatoires (à remplacer par les vraies adresses)
  const randomGeneratorAddresses = {
    development: "0x0000000000000000000000000000000000000000", // Adresse fictive pour local
    bsc: process.env.RANDOM_GENERATOR_MAINNET || "0x0000000000000000000000000000000000000000", // Remplacer
    bsc_testnet: process.env.RANDOM_GENERATOR_TESTNET || "0x0000000000000000000000000000000000000000" // Remplacer
  };

  const cakeAddress = cakeAddresses[network] || cakeAddresses.development;
  const randomGeneratorAddress = randomGeneratorAddresses[network] || randomGeneratorAddresses.development;

  console.log(`Adresse CAKE: ${cakeAddress}`);
  console.log(`Adresse RandomGenerator: ${randomGeneratorAddress}`);

  // Déploiement du contrat SaturneLottery
  await deployer.deploy(SaturneLottery, cakeAddress, randomGeneratorAddress);
  const saturne = await SaturneLottery.deployed();

  console.log(`Contrat SaturneLottery déployé à: ${saturne.address}`);

  // Vérification de la taille
  const bytecode = SaturneLottery.deployedBytecode;
  const size = (bytecode.length - 2) / 2; // -2 pour "0x", /2 pour bytes
  console.log(`Taille du bytecode: ${size} bytes`);
  console.log(`Limite: 24576 bytes`);
  console.log(`Status: ${size > 24576 ? '❌ TROP GRAND' : '✅ OK'}`);
};
const SaturneLottery = artifacts.require("SaturneLottery");

module.exports = async function(deployer, network, accounts) {
  console.log(`Déploiement sur le réseau: ${network}`);
  console.log(`Compte utilisé: ${accounts[0]}`);

  // Déploiement du contrat
  await deployer.deploy(SaturneLottery);
  const saturne = await SaturneLottery.deployed();
  
  console.log(`Contrat Saturne déployé à: ${saturne.address}`);
  
  // Vérification de la taille
  const bytecode = SaturneLottery.deployedBytecode;
  const size = (bytecode.length - 2) / 2; // -2 pour "0x", /2 pour bytes
  console.log(`Taille du bytecode: ${size} bytes`);
  console.log(`Limite: 24576 bytes`);
  console.log(`Status: ${size > 24576 ? '❌ TROP GRAND' : '✅ OK'}`);
};
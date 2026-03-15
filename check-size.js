const SaturneArtifact = require('./build/contracts/SaturneLottery.json');

function checkContractSize() {
  const bytecode = SaturneArtifact.deployedBytecode;
  
  // Remove the 0x prefix if present
  const cleanBytecode = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode;
  
  const sizeInBytes = cleanBytecode.length / 2;
  const limit = 24576;
  const exceededBy = sizeInBytes - limit;
  
  console.log("=== Contract Size Analysis ===");
  console.log("Current size:", sizeInBytes, "bytes");
  console.log("Ethereum limit:", limit, "bytes");
  console.log("Exceeds by:", exceededBy > 0 ? exceededBy + " bytes" : "OK");
  console.log("Percentage:", ((sizeInBytes / limit) * 100).toFixed(2) + "% of limit");
  
  if (exceededBy > 0) {
    console.log("\n❌ Contract too large for mainnet deployment!");
    console.log("Need to reduce by at least", exceededBy, "bytes");
  } else {
    console.log("\n✅ Contract size is within limits!");
  }
}

checkContractSize();
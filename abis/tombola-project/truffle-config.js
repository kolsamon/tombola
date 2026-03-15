module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Match any network id
    },
    // Add other network configurations as needed
  },

  compilers: {
    solc: {
      version: "0.8.0", // Specify the Solidity compiler version
    },
  },

  // Configure the plugins if needed
  plugins: ["truffle-plugin-verify"],

  api_keys: {
    etherscan: "YOUR_ETHERSCAN_API_KEY", // Replace with your Etherscan API key
  },
};
# Tombola Lottery Project

## Overview
The Tombola project is a decentralized lottery system implemented as a smart contract on the Ethereum blockchain. It allows users to purchase tickets, claim winnings, and manage sponsorships while ensuring transparency and fairness in the lottery process.

## Features
- **Lottery Management**: Users can participate in lotteries by purchasing tickets.
- **Sponsorship Management**: The contract allows for managing sponsorships to enhance the lottery experience.
- **Commission Distribution**: After each draw, the contract distributes commissions to sponsors and other stakeholders.
- **Ticket Purchase Redistribution**: A defined proportion of ticket purchase amounts is redistributed to enhance user engagement.

## Project Structure
```
tombola-project
├── contracts
│   ├── Tombola.sol          # Main smart contract for the Tombola lottery system
├── migrations
│   └── 1_initial_migration.js # Migration script for deploying the Tombola contract
├── test
│   └── tombola.test.js      # Test cases for verifying contract functionality
├── truffle-config.js        # Configuration file for Truffle
└── README.md                # Documentation for the project
```

## Setup Instructions
1. **Clone the Repository**: 
   ```
   git clone <repository-url>
   cd tombola-project
   ```

2. **Install Dependencies**: 
   ```
   npm install
   ```

3. **Compile Contracts**: 
   ```
   truffle compile
   ```

4. **Deploy Contracts**: 
   ```
   truffle migrate --network <network-name>
   ```

5. **Run Tests**: 
   ```
   truffle test
   ```

## Usage Guidelines
- Users can interact with the Tombola contract through a web interface or directly via Ethereum wallets.
- Ensure you have sufficient Ether to cover transaction fees when participating in the lottery.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.
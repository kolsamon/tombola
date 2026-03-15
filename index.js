
require('dotenv').config();
const Web3 = require('web3');
const abis = require('./abis');
const addresses = require('./address');

const web3 = new Web3(process.env.INFURA_URL);
const admin = process.env.ADMIN_ADDRESS;

const pancakeSwapLottery = new web3.eth.Contract(abis.pancakeSwapLottery.abi, addresses.pancakeSwapLottery.address);
const CakeToken = new web3.eth.Contract(abis.cakeToken.abi, addresses.cakeToken.address);

let lotteryId = 0;
let lotteryStatus = 0;
let lotteryStartingTimestamp = 0;
let lotteryClosingTimestamp = 0;
let priceTicketInCake = 0;
let discountDivisor = 0;

async function main(pancakeSwapLottery) {
    //await viewUserInfoForLotteryId(pancakeSwapLottery);
     let lottery = await loadLottery();
    lotteryStatus = lottery.lotteryStatus;
    lotteryId = lottery.lotteryId;
    lotteryStartingTimestamp = lottery.lotteryStartingTimestamp;
    lotteryClosingTimestamp = lottery.lotteryClosingTimestamp;
    priceTicketInCake = lottery.priceTicketInCake;
    discountDivisor = lottery.discountDivisor;
    //buyLotteryTicket(1);
    viewLotteryInfo(1401);
}

async function viewUserInfoForLotteryId() {
    //1. Get the lottery id
    //const lotteryId = await pancakeSwapLottery.methods.viewCurrentLotteryId().call();
    const lotteryId = 1441;
    console.log(`Current lottery id: ${lotteryId}`);

    //_cursor
    const _cursor = 0;

    //_size
    const _size = 2;
   
    const userInfo = await pancakeSwapLottery.methods.viewUserInfoForLotteryId(admin,lotteryId, _cursor,_size).call();
    console.log(userInfo);

}

async function loadLottery() {
    // Get the lottery id
    const lotteryId = await pancakeSwapLottery.methods.viewCurrentLotteryId().call();
    //console.log(`Current lottery id: ${lotteryId}`);

    // Get the lottery by id
    const lottery = await pancakeSwapLottery.methods.viewLottery(lotteryId).call();
    //console.log(`Current lottery: ${JSON.stringify(lottery)}`);

    // Get the lottery status
    const lotteryStatus = lottery[0];

    // Get the lottery starting timestamp
    const lotteryStartingTimestamp = lottery[1];

    // Get the lottery closing timestamp
    const lotteryClosingTimestamp = lottery[2];

    // Get the priceTicketInCake
    const priceTicketInCake = lottery[3];

    // Get the discountDivisor
    const discountDivisor = lottery[4];

    return { lotteryStatus, lotteryId, lotteryStartingTimestamp, lotteryClosingTimestamp, priceTicketInCake, discountDivisor };
}

function _calculateTotalPriceForBulkTickets(_discountDivisor,_priceTicket, _numberOfTickets) {
    return (_priceTicket * _numberOfTickets * (_discountDivisor + 1 - _numberOfTickets)) / _discountDivisor;
}

function generateRandomNumbers(){
    // generate a random numbers between 1,000,000 and 1,999,999 starting 1
    return Math.floor(Math.random() * 1000000) + 1000000;
}

async function buyLotteryTicket(numberOfTickets) {

    if (lotteryStatus != 1) {
        console.log(`Lottery is not open yet: ${lotteryStatus}`);
        return;
    }
    
    //const amountCakeToTransfer = _calculateTotalPriceForBulkTickets(discountDivisor,priceTicketInCake,numberOfTickets);
    const amountCakeToTransfer = await pancakeSwapLottery.methods.calculateTotalPriceForBulkTickets(discountDivisor,priceTicketInCake,numberOfTickets).call();
    console.log(`Amount of cake to transfer: ${amountCakeToTransfer}`);
    //1. check the cake balance
    const cakeBalance = await CakeToken.methods.balanceOf(admin).call();

    if (cakeBalance < amountCakeToTransfer) {
        console.log(`Not enough cake balance: ${cakeBalance}`);
        return;
    }

    //2. check if cake token is approved
    const allowance = await CakeToken.methods.allowance(admin, addresses.pancakeSwapLottery.address).call();
    //convert to integer
    const allow = parseInt(allowance);
    // convert to integer
    const amountCakeToTransferInt = parseInt(amountCakeToTransfer);
    if (allow < amountCakeToTransferInt) {
        console.log(`Not enough allowance: ${allow}`);
        // Approve the lottery contract to spend your tokens
        const approval = await CakeToken.methods.approve(addresses.pancakeSwapLottery.address, amountCakeToTransfer);
        const ap_gas = await approval.estimateGas({from: admin});
        const ap_gasPrice = await web3.eth.getGasPrice();
        const ap_nonce = await web3.eth.getTransactionCount(admin);
        const ap_data = approval.encodeABI();
        const ap_tx = {
            from: admin,
            to: addresses.cakeToken.address,
            data: ap_data,
            gas: ap_gas,
            gasPrice: ap_gasPrice,
            nonce: ap_nonce
        }
        const ap_signedTx = await web3.eth.accounts.signTransaction(ap_tx, process.env.PRIVATE_KEY);
        const ap_receipt = await web3.eth.sendSignedTransaction(ap_signedTx.rawTransaction);
        if(ap_receipt.status == false){
            console.log(`Approval failed: ${ap_receipt.transactionHash}`);
            return;
        }
        console.log(`Approved: ${approval.transactionHash}`);
    }

    let _ticketNumbers = [];

    for (let i = 0; i < numberOfTickets; i++) {
        _ticketNumbers.push(generateRandomNumbers());
    }


    //3. Buy a ticket
    const txx = await pancakeSwapLottery.methods.buyTickets(lotteryId, _ticketNumbers);

    //gas estimation
    const gas = await txx.estimateGas({from: admin});
    console.log(`Gas estimation: ${gas}`);
    
    
     //gas price
     const gasPrice = await web3.eth.getGasPrice();
     console.log(`Gas price: ${gasPrice}`);
     

      //data
      const data = txx.encodeABI();
      //nonce
      const nonce = await web3.eth.getTransactionCount(admin);
      console.log(`Nonce: ${nonce}`);

      const tx = {
          from: admin,
          to: addresses.pancakeSwapLottery.address,
          data,
          gas,
          gasPrice,
          nonce
      }

        //sign the transaction
        const signedTx = await web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY);

        //send the transaction
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log(`Transaction hash: ${receipt.transactionHash}`);

        return receipt;
}

async function viewLotteryInfo(lotteryId) {
    const lottery = await pancakeSwapLottery.methods.viewLottery(lotteryId).call();
    console.log(`Current lottery: ${JSON.stringify(lottery)}`);
}

async function history(lotteryId,userAddress=null) {
    
}

main(pancakeSwapLottery);


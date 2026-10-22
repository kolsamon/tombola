const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const { parseEther } = ethers.utils;

describe("SaturneLottery", function () {
  let cake, randomGenerator, lottery;
  let owner, operator, treasury, injector, alice, bob, carl, dave, erin;

  const PRICE_TICKET = parseEther("1");
  const DISCOUNT_DIVISOR = 2000;
  // Only brackets 4 and 5 pay out, 50% each
  const REWARDS_BREAKDOWN = [0, 0, 0, 0, 5000, 5000];
  const TREASURY_FEE = 1000; // 10%
  // finalNumber's last 6 digits are "111111"
  const FINAL_NUMBER = 1111111;

  beforeEach(async function () {
    [owner, operator, treasury, injector, alice, bob, carl, dave, erin] = await ethers.getSigners();

    const MockCakeToken = await ethers.getContractFactory("MockCakeToken");
    cake = await MockCakeToken.deploy();
    await cake.deployed();

    const MockRandomNumberGenerator = await ethers.getContractFactory("MockRandomNumberGenerator");
    randomGenerator = await MockRandomNumberGenerator.deploy();
    await randomGenerator.deployed();

    const SaturneLottery = await ethers.getContractFactory("SaturneLottery");
    lottery = await SaturneLottery.deploy(cake.address, randomGenerator.address);
    await lottery.deployed();

    await lottery.setOperatorAndTreasuryAndInjectorAddresses(operator.address, treasury.address, injector.address);
    // Disable the at-purchase referral/treasury commission so the math in these tests
    // only exercises the winners/losers/treasury split done at draw time.
    await lottery.setCommissionRates(0, 0);

    for (const user of [alice, bob, carl, dave, erin]) {
      await cake.mint(user.address, parseEther("10"));
      await cake.connect(user).approve(lottery.address, parseEther("10"));
    }
  });

  async function startLottery() {
    const endTime = (await time.latest()) + 5 * 3600; // 5 hours from now
    await lottery
      .connect(operator)
      .startLottery(endTime, PRICE_TICKET, DISCOUNT_DIVISOR, REWARDS_BREAKDOWN, TREASURY_FEE);
    return endTime;
  }

  async function closeAndDraw(lotteryId, endTime, finalNumber = FINAL_NUMBER) {
    await time.increaseTo(endTime + 1);
    await lottery.connect(operator).closeLottery(lotteryId);
    await randomGenerator.setLatestLotteryId(lotteryId);
    await randomGenerator.setRandomResult(finalNumber);
    await lottery.connect(operator).drawFinalNumberAndMakeLotteryClaimable(lotteryId, false);
  }

  // Ticket ids, in purchase order: alice(jackpot) bob(bracket4) carl(loser) dave(loser) erin(loser)
  async function buyMixedTickets(lotteryId) {
    await lottery.connect(alice).buyTickets(lotteryId, [1111111]); // matches all 6 digits -> bracket 5
    await lottery.connect(bob).buyTickets(lotteryId, [1511111]); // matches last 5 digits only -> bracket 4
    await lottery.connect(carl).buyTickets(lotteryId, [1000002]); // last digit differs -> total loser
    await lottery.connect(dave).buyTickets(lotteryId, [1900003]); // last digit differs -> total loser
    await lottery.connect(erin).buyTickets(lotteryId, [1800004]); // last digit differs -> total loser
  }

  describe("ticket purchase", function () {
    it("sells multiple tickets at the bulk-discounted price with the default commissions", async function () {
      await lottery.setCommissionRates(500, 1000); // contract defaults: 5% referral, 10% treasury
      await startLottery();
      const lotteryId = await lottery.viewCurrentLotteryId();

      const numbers = [1000000, 1234567, 1234567, 1999999, 1500000, 1000001, 1111111, 1222222, 1333333, 1444444];
      const price = await lottery.calculateTotalPriceForBulkTickets(DISCOUNT_DIVISOR, PRICE_TICKET, numbers.length);
      // 10 * 1 * (2000 + 1 - 10) / 2000
      expect(price).to.equal(parseEther("9.955"));

      // First purchase of the round: the treasury commission must not underflow the empty pool
      await expect(lottery.connect(alice).buyTickets(lotteryId, numbers)).to.changeTokenBalances(
        cake,
        [alice, treasury],
        [price.mul(-1), price.div(10)]
      );

      const lotteryInfo = await lottery.viewLottery(lotteryId);
      expect(lotteryInfo.amountCollectedInCake).to.equal(price.sub(price.div(10)));

      const [ticketIds, ticketNumbers] = await lottery.viewUserInfoForLotteryId(alice.address, lotteryId, 0, 100);
      expect(ticketIds.map((id) => id.toNumber())).to.deep.equal([...Array(numbers.length).keys()]);
      expect([...ticketNumbers]).to.deep.equal(numbers);
    });

    it("rejects a purchase above the per-transaction limit or with an out-of-range number", async function () {
      await startLottery();
      const lotteryId = await lottery.viewCurrentLotteryId();

      await expect(lottery.connect(alice).buyTickets(lotteryId, Array(101).fill(1234567))).to.be.revertedWith(
        "Too many tickets"
      );
      await expect(lottery.connect(alice).buyTickets(lotteryId, [1234567, 2000000])).to.be.revertedWith("Outside range");
      await expect(lottery.connect(alice).buyTickets(lotteryId, [1234567, 999999])).to.be.revertedWith("Outside range");
    });
  });

  describe("consolation enabled (default)", function () {
    it("is enabled by default", async function () {
      expect(await lottery.consolationEnabled()).to.equal(true);
    });

    it("splits the prize pool 50% winners / 25% losers / 25% treasury", async function () {
      await startLottery();
      const lotteryId = await lottery.viewCurrentLotteryId();
      await buyMixedTickets(lotteryId);

      const lotteryBeforeDraw = await lottery.viewLottery(lotteryId);
      expect(lotteryBeforeDraw.amountCollectedInCake).to.equal(parseEther("5"));
      expect(lotteryBeforeDraw.consolationEnabled).to.equal(true);

      await closeAndDraw(lotteryId, Number(lotteryBeforeDraw.endTime));

      const lotteryInfo = await lottery.viewLottery(lotteryId);

      // amountCollected(5) * (1 - treasuryFee 10%) = 4.5 post-fee pool
      // winners get 50% = 2.25, split 50/50 across the two paying brackets => 1.125 each
      expect(lotteryInfo.cakePerBracket[5]).to.equal(parseEther("1.125"));
      expect(lotteryInfo.cakePerBracket[4]).to.equal(parseEther("1.125"));

      // losers pool = (4.5 - 2.25) / 2 = 1.125, split across 3 losing tickets => 0.375 each
      expect(lotteryInfo.cakePerLosingTicket).to.equal(parseEther("0.375"));
      expect(await lottery.viewRewardsForLosingTicketId(lotteryId, 2)).to.equal(parseEther("0.375"));
      expect(await lottery.viewRewardsForLosingTicketId(lotteryId, 0)).to.equal(0); // a winner

      // Winners claim through claimTickets
      await expect(lottery.connect(alice).claimTickets(lotteryId, [0], [5])).to.changeTokenBalance(
        cake,
        alice,
        parseEther("1.125")
      );
      await expect(lottery.connect(bob).claimTickets(lotteryId, [1], [4])).to.changeTokenBalance(
        cake,
        bob,
        parseEther("1.125")
      );

      // Losers claim through claimLosingTickets
      await expect(lottery.connect(carl).claimLosingTickets(lotteryId, [2])).to.changeTokenBalance(
        cake,
        carl,
        parseEther("0.375")
      );
      await expect(lottery.connect(dave).claimLosingTickets(lotteryId, [3])).to.changeTokenBalance(
        cake,
        dave,
        parseEther("0.375")
      );
      await expect(lottery.connect(erin).claimLosingTickets(lotteryId, [4])).to.changeTokenBalance(
        cake,
        erin,
        parseEther("0.375")
      );

      // A claimed losing ticket cannot be claimed twice
      await expect(lottery.connect(carl).claimLosingTickets(lotteryId, [2])).to.be.revertedWith("Not the owner");

      // Treasury cut = 5 - 2.25 (winners) - 1.125 (losers) = 1.625
      expect(await cake.balanceOf(treasury.address)).to.equal(parseEther("1.625"));

      // Conservation of funds: nothing stuck in the lottery contract
      expect(await cake.balanceOf(lottery.address)).to.equal(0);
    });

    it("rejects a winning ticket trying to claim the consolation pool", async function () {
      await startLottery();
      const lotteryId = await lottery.viewCurrentLotteryId();

      await lottery.connect(alice).buyTickets(lotteryId, [1111111]); // jackpot winner
      await lottery.connect(bob).buyTickets(lotteryId, [1000002]); // loser, keeps totalLosingTickets > 0

      const lotteryBeforeDraw = await lottery.viewLottery(lotteryId);
      await closeAndDraw(lotteryId, Number(lotteryBeforeDraw.endTime));

      await expect(lottery.connect(alice).claimLosingTickets(lotteryId, [0])).to.be.revertedWith(
        "Ticket has a winning bracket"
      );
    });

    it("redirects the losers' pool to the treasury when every ticket wins", async function () {
      await startLottery();
      const lotteryId = await lottery.viewCurrentLotteryId();

      // Both tickets match all 6 digits -> everyone wins, nobody loses
      await lottery.connect(alice).buyTickets(lotteryId, [1111111]);
      await lottery.connect(bob).buyTickets(lotteryId, [1111111]);

      const lotteryBeforeDraw = await lottery.viewLottery(lotteryId);
      await closeAndDraw(lotteryId, Number(lotteryBeforeDraw.endTime));

      const lotteryInfo = await lottery.viewLottery(lotteryId);
      expect(lotteryInfo.cakePerLosingTicket).to.equal(0);

      // amountCollected(2) * 0.9 = 1.8 post-fee pool; winners pool = 0.9, split 50/50 between
      // brackets 4 and 5 per rewardsBreakdown -> bracket 5 gets 0.45 total, shared by 2 winners
      expect(lotteryInfo.cakePerBracket[5]).to.equal(parseEther("0.225"));

      // Treasury absorbs: its normal cut (2 - 0.9 - 0.45 = 0.65) + bracket 4's empty allocation
      // (0.45, nobody matched exactly 5 digits) + the unclaimed losers' pool (0.45) = 1.55
      expect(await cake.balanceOf(treasury.address)).to.equal(parseEther("1.55"));
    });

    it("leaves nothing for the consolation pool when winnersShareBps = 10000", async function () {
      await lottery.setWinnersShareBps(10000);
      await startLottery();
      const lotteryId = await lottery.viewCurrentLotteryId();
      await buyMixedTickets(lotteryId);

      const lotteryBeforeDraw = await lottery.viewLottery(lotteryId);
      await closeAndDraw(lotteryId, Number(lotteryBeforeDraw.endTime));

      const lotteryInfo = await lottery.viewLottery(lotteryId);
      // 4.5 post-fee pool, all to winners, split 50/50 across brackets 4 and 5
      expect(lotteryInfo.cakePerBracket[5]).to.equal(parseEther("2.25"));
      expect(lotteryInfo.cakePerBracket[4]).to.equal(parseEther("2.25"));
      expect(lotteryInfo.cakePerLosingTicket).to.equal(0);

      // Treasury only keeps its 10% fee
      expect(await cake.balanceOf(treasury.address)).to.equal(parseEther("0.5"));
    });
  });

  describe("consolation disabled", function () {
    beforeEach(async function () {
      await lottery.setConsolationEnabled(false);
    });

    it("splits the prize pool 50% winners / 50% treasury, losing tickets get nothing", async function () {
      await startLottery();
      const lotteryId = await lottery.viewCurrentLotteryId();
      await buyMixedTickets(lotteryId);

      const lotteryBeforeDraw = await lottery.viewLottery(lotteryId);
      expect(lotteryBeforeDraw.consolationEnabled).to.equal(false);

      await closeAndDraw(lotteryId, Number(lotteryBeforeDraw.endTime));

      const lotteryInfo = await lottery.viewLottery(lotteryId);

      // 4.5 post-fee pool; winners get 50% = 2.25, split 50/50 across the two paying brackets
      expect(lotteryInfo.cakePerBracket[5]).to.equal(parseEther("1.125"));
      expect(lotteryInfo.cakePerBracket[4]).to.equal(parseEther("1.125"));
      expect(lotteryInfo.cakePerLosingTicket).to.equal(0);
      expect(await lottery.viewRewardsForLosingTicketId(lotteryId, 2)).to.equal(0);

      // Treasury gets everything that isn't paid to winners: 5 - 2.25 = 2.75
      expect(await cake.balanceOf(treasury.address)).to.equal(parseEther("2.75"));

      await expect(lottery.connect(alice).claimTickets(lotteryId, [0], [5])).to.changeTokenBalance(
        cake,
        alice,
        parseEther("1.125")
      );
      await expect(lottery.connect(bob).claimTickets(lotteryId, [1], [4])).to.changeTokenBalance(
        cake,
        bob,
        parseEther("1.125")
      );

      // A losing ticket has no prize in any bracket and no consolation to claim
      await expect(lottery.connect(carl).claimTickets(lotteryId, [2], [0])).to.be.revertedWith(
        "No prize for this bracket"
      );
      await expect(lottery.connect(carl).claimLosingTickets(lotteryId, [2])).to.be.revertedWith(
        "No consolation for this lottery"
      );

      // Conservation of funds: nothing stuck in the lottery contract
      expect(await cake.balanceOf(lottery.address)).to.equal(0);
    });
  });

  describe("consolation toggle", function () {
    it("can only be changed by the owner", async function () {
      await expect(lottery.connect(alice).setConsolationEnabled(false)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      await expect(lottery.connect(operator).setConsolationEnabled(false)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      await lottery.setConsolationEnabled(false);
      expect(await lottery.consolationEnabled()).to.equal(false);
      await lottery.setConsolationEnabled(true);
      expect(await lottery.consolationEnabled()).to.equal(true);
    });

    it("applies to the next round only: an open round keeps the rule it started with", async function () {
      // Round 1 starts with the consolation rule on
      await startLottery();
      const round1 = await lottery.viewCurrentLotteryId();
      await buyMixedTickets(round1);

      // Owner turns it off while the round is open
      await lottery.setConsolationEnabled(false);
      expect((await lottery.viewLottery(round1)).consolationEnabled).to.equal(true);

      await closeAndDraw(round1, Number((await lottery.viewLottery(round1)).endTime));

      // Round 1 still pays its losers
      expect((await lottery.viewLottery(round1)).cakePerLosingTicket).to.equal(parseEther("0.375"));
      await expect(lottery.connect(carl).claimLosingTickets(round1, [2])).to.changeTokenBalance(
        cake,
        carl,
        parseEther("0.375")
      );

      // Round 2 picks up the new rule
      await startLottery();
      const round2 = await lottery.viewCurrentLotteryId();
      expect(round2).to.equal(round1.add(1));
      expect((await lottery.viewLottery(round2)).consolationEnabled).to.equal(false);

      await lottery.connect(alice).buyTickets(round2, [1111111]); // winner, ticket id 5
      await lottery.connect(bob).buyTickets(round2, [1000002]); // loser, ticket id 6

      const treasuryBefore = await cake.balanceOf(treasury.address);
      await closeAndDraw(round2, Number((await lottery.viewLottery(round2)).endTime));

      expect((await lottery.viewLottery(round2)).cakePerLosingTicket).to.equal(0);
      await expect(lottery.connect(bob).claimLosingTickets(round2, [6])).to.be.revertedWith(
        "No consolation for this lottery"
      );
      // 2 collected, 1.8 post-fee, winners 0.9 (0.45 to bracket 5, bracket 4 empty -> treasury);
      // treasury gets 2 - 0.9 + 0.45 = 1.55 and nothing is reserved for losers
      expect((await cake.balanceOf(treasury.address)).sub(treasuryBefore)).to.equal(parseEther("1.55"));
    });
  });
});

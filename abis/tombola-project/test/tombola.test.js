const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tombola Contract", function () {
    let Tombola;
    let tombola;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        Tombola = await ethers.getContractFactory("Tombola");
        [owner, addr1, addr2] = await ethers.getSigners();
        tombola = await Tombola.deploy();
        await tombola.deployed();
    });

    describe("Sponsorship Management", function () {
        it("should allow adding a sponsor", async function () {
            await tombola.addSponsor(addr1.address);
            expect(await tombola.isSponsor(addr1.address)).to.be.true;
        });

        it("should not allow non-owner to add a sponsor", async function () {
            await expect(tombola.connect(addr1).addSponsor(addr2.address)).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Commission Distribution", function () {
        it("should distribute commissions correctly after a draw", async function () {
            // Simulate a draw and check commission distribution logic
            await tombola.simulateDraw();
            const commission = await tombola.getCommission(addr1.address);
            expect(commission).to.be.above(0);
        });
    });

    describe("Ticket Purchase Redistribution", function () {
        it("should redistribute ticket purchase amounts correctly", async function () {
            const initialBalance = await ethers.provider.getBalance(addr1.address);
            await tombola.connect(addr1).purchaseTicket({ value: ethers.utils.parseEther("1.0") });
            const finalBalance = await ethers.provider.getBalance(addr1.address);
            expect(finalBalance).to.be.below(initialBalance);
        });
    });
});
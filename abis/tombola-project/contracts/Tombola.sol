// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Tombola is Ownable, ReentrancyGuard {
    enum Status { Active, Claimable, Completed }

    struct Lottery {
        uint256 firstTicketId;
        uint256 firstTicketIdNextLottery;
        Status status;
        uint256 totalTickets;
        uint256 totalPrizePool;
    }

    mapping(uint256 => Lottery) public lotteries;
    uint256 public maxNumberTicketsPerBuyOrClaim;
    uint256 public commissionPercentage;
    address public sponsor;

    event TicketsClaimed(uint256 lotteryId, uint256[] ticketIds, uint32[] brackets);
    event CommissionDistributed(address indexed sponsor, uint256 amount);

    constructor(uint256 _maxNumberTicketsPerBuyOrClaim, uint256 _commissionPercentage) {
        maxNumberTicketsPerBuyOrClaim = _maxNumberTicketsPerBuyOrClaim;
        commissionPercentage = _commissionPercentage;
    }

    modifier notContract() {
        require(msg.sender == tx.origin, "Contracts not allowed");
        _;
    }

    function claimTickets(
        uint256 _lotteryId,
        uint256[] calldata _ticketIds,
        uint32[] calldata _brackets
    ) external notContract nonReentrant {
        require(_ticketIds.length == _brackets.length, "Not same length");
        require(_ticketIds.length != 0, "Length must be >0");
        require(_ticketIds.length <= maxNumberTicketsPerBuyOrClaim, "Too many tickets");
        require(lotteries[_lotteryId].status == Status.Claimable, "Lottery not claimable");

        uint256 rewardInCakeToTransfer;

        for (uint256 i = 0; i < _ticketIds.length; i++) {
            require(_brackets[i] < 6, "Bracket out of range");
            uint256 thisTicketId = _ticketIds[i];
            require(lotteries[_lotteryId].firstTicketIdNextLottery > thisTicketId, "TicketId too high");
            require(lotteries[_lotteryId].firstTicketId <= thisTicketId, "TicketId too low");
            // Logic to calculate rewards and update state
        }

        emit TicketsClaimed(_lotteryId, _ticketIds, _brackets);
    }

    function distributeCommission() external onlyOwner {
        uint256 commissionAmount = (lotteries[0].totalPrizePool * commissionPercentage) / 100;
        payable(sponsor).transfer(commissionAmount);
        emit CommissionDistributed(sponsor, commissionAmount);
    }

    function setSponsor(address _sponsor) external onlyOwner {
        sponsor = _sponsor;
    }

    // Additional functions for managing lotteries, ticket purchases, etc.
}
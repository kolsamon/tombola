// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../interfaces/IRandomNumberGenerator.sol";

/// @notice Lets tests pick the exact draw result instead of waiting on Chainlink VRF
contract MockRandomNumberGenerator is IRandomNumberGenerator {
    uint32 public randomResult;
    uint256 public latestLotteryId;

    function getRandomNumber(uint256 _seed) external override {
        latestLotteryId = _seed;
    }

    function setLatestLotteryId(uint256 _lotteryId) external {
        latestLotteryId = _lotteryId;
    }

    function setRandomResult(uint32 _result) external {
        randomResult = _result;
    }

    function viewLatestLotteryId() external view override returns (uint256) {
        return latestLotteryId;
    }

    function viewRandomResult() external view override returns (uint32) {
        return randomResult;
    }
}

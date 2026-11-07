// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IGauge {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getReward(address account) external;
    function earned(address account) external view returns (uint256);
    function stakingToken() external view returns (address);
    function rewardToken() external view returns (address);
}
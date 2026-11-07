// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVeMEZO {
    /// @notice Lock `amount` MEZO for `unlockTime` (epoch timestamp).
    function createLock(uint256 amount, uint256 unlockTime) external;
    function increaseAmount(uint256 amount) external;
    function increaseUnlockTime(uint256 unlockTime) external;
    function withdraw() external;

    /// @notice Vote for a gauge with a weight. Weight is scaled 0..10_000 (bps).
    function voteForGaugeWeights(address gauge, uint256 weightBps) external;

    function balanceOf(address user) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}
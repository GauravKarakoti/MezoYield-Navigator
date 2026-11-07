// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVoter {
    function gauges(address pool) external view returns (address);
    function vote(address[] calldata pools, uint256[] calldata weightsBps) external;
    function reset() external;
}
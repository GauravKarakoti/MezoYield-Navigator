// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @dev Ditto's dMUSD vault supports asynchronous redemption: user requests,
/// operator fulfills later. Interface modeled generically so the strategy
/// can adapt to the deployed ABI.
interface IDittoVault is IERC20 {
    function asset() external view returns (address);
    function totalAssets() external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
    function convertToShares(uint256 assets) external view returns (uint256);

    function deposit(uint256 assets, address receiver) external returns (uint256 shares);

    /// @notice Request redemption of `shares`. Returns a request id.
    function requestRedeem(uint256 shares) external returns (uint256 requestId);

    /// @notice Called by vault operator(s). Returns amount of MUSD claimed.
    function claimRedeem(uint256 requestId) external returns (uint256 assetsOut);

    /// @notice Whether the request has been fulfilled and is claimable.
    function isRedeemClaimable(uint256 requestId) external view returns (bool);

    /// @notice Remaining pending shares for `account`.
    function pendingShares(address account) external view returns (uint256);
}
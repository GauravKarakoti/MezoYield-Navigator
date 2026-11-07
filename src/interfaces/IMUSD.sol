// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @dev MUSD is a standard ERC20. This alias exists so consumers can be
/// explicit about the asset they accept.
interface IMUSD is IERC20 {}
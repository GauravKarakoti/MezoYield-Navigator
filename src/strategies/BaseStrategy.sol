// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title BaseStrategy
/// @notice Common plumbing for MUSD strategies. A strategy is a whitelisted
///         adapter the YieldRouter can call to allocate / deallocate MUSD.
abstract contract BaseStrategy is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;      // MUSD
    address public immutable router;
    address public immutable vault;     // underlying protocol vault

    /// @notice Amount of MUSD principal the router has deployed to this strategy.
    uint256 public deployedPrincipal;

    /// @notice MUSD currently held by this strategy and available for the router.
    uint256 public idleAsset;

    /// @notice Whether the router may currently route into this strategy.
    bool public active = true;

    error OnlyRouter();
    error StrategyPaused();
    error NotRouter();

    modifier onlyRouter() {
        if (msg.sender != router) revert OnlyRouter();
        _;
    }

    constructor(address _asset, address _router, address _vault) Ownable(msg.sender) {
        require(_asset != address(0) && _router != address(0) && _vault != address(0), "zero");
        asset = IERC20(_asset);
        router = _router;
        vault = _vault;
    }

    function setActive(bool a) external onlyOwner {
        active = a;
    }

    /// @notice Total assets managed by this strategy, denominated in MUSD.
    /// @dev Must include deployed value *and* any pending/idle value.
    function totalAssets() public view virtual returns (uint256);

    /// @notice Deploy `amount` MUSD (already transferred into strategy) into the underlying venue.
    function _deploy(uint256 amount) internal virtual;

    /// @notice Attempt to free up to `amount` MUSD, transfer to `to`.
    /// @return pulled Actual MUSD transferred back.
    function pull(uint256 amount, address to) external onlyRouter nonReentrant returns (uint256 pulled) {
        if (!active) revert StrategyPaused();
        pulled = _pull(amount, to);
        if (pulled > deployedPrincipal) deployedPrincipal = 0;
        else deployedPrincipal -= pulled;
        if (asset.balanceOf(to) < pulled) revert("transfer short");
    }

    function _pull(uint256 amount, address to) internal virtual returns (uint256 pulled);

    /// @notice Router calls this after transferring MUSD into the strategy.
    function deposit(uint256 amount) external onlyRouter nonReentrant {
        if (!active) revert StrategyPaused();
        deployedPrincipal += amount;
        idleAsset += amount;
        _deploy(amount);
        idleAsset = asset.balanceOf(address(this));
    }

    /// @notice Emergency: move all liquid assets back to router.
    function emergencyExit(address to) external onlyOwner {
        uint256 bal = asset.balanceOf(address(this));
        if (bal > 0) asset.safeTransfer(to, bal);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BaseStrategy.sol";
import "../interfaces/IERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title SMusdStrategy
/// @notice Deploys MUSD into Mezo's native sMUSD ERC4626 vault.
///         Synchronous withdraw — router always gets MUSD back in the same tx.
contract SMusdStrategy is BaseStrategy {
    using SafeERC20 for IERC20;

    IERC4626 public immutable sVault;

    constructor(address _musd, address _router, address _sMusdVault)
        BaseStrategy(_musd, _router, _sMusdVault)
    {
        sVault = IERC4626(_sMusdVault);
    }

    function totalAssets() public view override returns (uint256) {
        uint256 shares = sVault.balanceOf(address(this));
        uint256 fromVault = sVault.convertToAssets(shares);
        return fromVault + asset.balanceOf(address(this));
    }

    function _deploy(uint256 amount) internal override {
        asset.forceApprove(address(sVault), amount);
        sVault.deposit(amount, address(this));
    }

    function _pull(uint256 amount, address to) internal override returns (uint256 pulled) {
        uint256 idle = asset.balanceOf(address(this));
        if (idle >= amount) {
            asset.safeTransfer(to, amount);
            return amount;
        }
        uint256 need = amount - idle;
        uint256 shares = sVault.convertToShares(need);
        uint256 maxShares = sVault.balanceOf(address(this));
        if (shares > maxShares) shares = maxShares;
        sVault.redeem(shares, to, address(this));
        pulled = asset.balanceOf(to);
        if (idle > 0) asset.safeTransfer(to, idle);
        pulled = amount > totalAssets() ? totalAssets() : amount;
    }

    /// @notice APY hint for keeper bot (bps). Router passes this to off-chain watcher.
    function currentApyBps() external view returns (uint256) {
        // Placeholder — the keeper reads real APY from the Mezo subgraph / API.
        // On-chain we don't have a reliable APY oracle yet; return 0 to signal
        // the keeper should fall back to its external feed.
        return 0;
    }
}
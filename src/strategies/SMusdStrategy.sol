// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BaseStrategy.sol";
import "../interfaces/IERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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
        if (idle > 0) {
            uint256 send = idle < amount ? idle : amount;
            asset.safeTransfer(to, send);
            pulled += send;
            if (pulled == amount) return pulled;
        }

        uint256 need = amount - pulled;
        uint256 shares = sVault.convertToShares(need);
        uint256 maxShares = sVault.balanceOf(address(this));
        if (shares > maxShares) shares = maxShares;
        if (shares == 0) return pulled;

        uint256 before = asset.balanceOf(to);
        sVault.redeem(shares, to, address(this));
        uint256 actual = asset.balanceOf(to) - before;
        pulled += actual;
    }

    function currentApyBps() external pure returns (uint256) {
        return 0;
    }
}
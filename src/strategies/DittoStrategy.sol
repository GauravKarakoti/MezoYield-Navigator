// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BaseStrategy.sol";
import "../interfaces/IDittoVault.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract DittoStrategy is BaseStrategy {
    using SafeERC20 for IERC20;

    IDittoVault public immutable dVault;

    mapping(uint256 => uint256) public requestAmount;
    uint256[] public openRequests;
    uint256 public pendingRedeemValue;

    event RedeemRequested(uint256 indexed requestId, uint256 shares, uint256 amount);
    event RedeemClaimed(uint256 indexed requestId, uint256 assetsOut);

    constructor(address _musd, address _router, address _dMusdVault)
        BaseStrategy(_musd, _router, _dMusdVault)
    {
        dVault = IDittoVault(_dMusdVault);
    }

    function totalAssets() public view override returns (uint256) {
        uint256 shares = dVault.balanceOf(address(this));
        uint256 fromVault = dVault.convertToAssets(shares);
        return fromVault + asset.balanceOf(address(this)) + pendingRedeemValue;
    }

    function _deploy(uint256 amount) internal override {
        asset.forceApprove(address(dVault), amount);
        dVault.deposit(amount, address(this));
    }

    function _pull(uint256 amount, address to) internal override returns (uint256 pulled) {
        uint256 idle = asset.balanceOf(address(this));
        if (idle > 0) {
            uint256 send = idle < amount ? idle : amount;
            asset.safeTransfer(to, send);
            pulled = send;
            if (pulled == amount) return pulled;
        }

        uint256 remaining = amount - pulled;
        uint256 shares = dVault.convertToShares(remaining);
        uint256 maxShares = dVault.balanceOf(address(this));
        if (shares > maxShares) shares = maxShares;
        if (shares == 0) return pulled;

        uint256 requestId = dVault.requestRedeem(shares);
        uint256 valueAtRequest = dVault.convertToAssets(shares);
        requestAmount[requestId] = valueAtRequest;
        openRequests.push(requestId);
        pendingRedeemValue += valueAtRequest;

        emit RedeemRequested(requestId, shares, valueAtRequest);
    }

    function claim(uint256 requestId, address to) external onlyRouter returns (uint256 assetsOut) {
        require(requestAmount[requestId] > 0, "unknown request");
        require(dVault.isRedeemClaimable(requestId), "not claimable");

        uint256 before = asset.balanceOf(address(this));
        assetsOut = dVault.claimRedeem(requestId);
        uint256 actual = asset.balanceOf(address(this)) - before;
        if (actual == 0 && assetsOut > 0) {
            actual = assetsOut;
        }

        uint256 valueAtRequest = requestAmount[requestId];
        pendingRedeemValue -= valueAtRequest;
        delete requestAmount[requestId];

        uint256 len = openRequests.length;
        for (uint256 i = 0; i < len; i++) {
            if (openRequests[i] == requestId) {
                openRequests[i] = openRequests[len - 1];
                openRequests.pop();
                break;
            }
        }

        if (actual > 0) asset.safeTransfer(to, actual);
        emit RedeemClaimed(requestId, actual);
    }

    function openRequestCount() external view returns (uint256) {
        return openRequests.length;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/strategies/SMusdStrategy.sol";

contract MockERC4626Vault is ERC20 {
    ERC20 public immutable underlying;

    constructor(address asset_) ERC20("sMUSD", "sMUSD") {
        underlying = ERC20(asset_);
    }

    function convertToShares(uint256 assets) external pure returns (uint256) {
        return assets;
    }

    function convertToAssets(uint256 shares) external pure returns (uint256) {
        return shares;
    }

    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        underlying.transferFrom(msg.sender, address(this), assets);
        _mint(receiver, assets);
        return assets;
    }

    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets) {
        if (msg.sender != owner) {
            _spendAllowance(owner, msg.sender, shares);
        }
        _burn(owner, shares);
        underlying.transfer(receiver, shares);
        return shares;
    }
}

contract MockMUSD is ERC20 {
    constructor() ERC20("MUSD", "MUSD") {}
    function mint(address to, uint256 amt) external { _mint(to, amt); }
}

contract SMusdStrategyTest is Test {
    MockMUSD musd;
    MockERC4626Vault sVault;
    SMusdStrategy strat;
    address router = address(this);

    function setUp() public {
        musd = new MockMUSD();
        sVault = new MockERC4626Vault(address(musd));
        strat = new SMusdStrategy(address(musd), router, address(sVault));
        musd.mint(address(strat), 1_000e18);
        musd.mint(router, 1_000e18);
        musd.approve(address(strat), type(uint256).max);
    }

    function testDepositAndTotalAssets() public {
        strat.deposit(400e18);
        assertEq(sVault.balanceOf(address(strat)), 400e18);
        assertEq(strat.totalAssets(), 1_000e18); // 400 in vault + 600 idle MUSD in strategy from setup mint
    }

    function testSynchronousPull() public {
        strat.deposit(400e18);
        uint256 pulled = strat.pull(250e18, router);
        assertEq(pulled, 250e18);
    }

    function testCurrentApyBps() external view {
        assertEq(strat.currentApyBps(), 0);
    }
}
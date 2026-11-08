// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/tokens/nyMUSD.sol";
import "../src/core/YieldRouter.sol";
import "../src/strategies/SMusdStrategy.sol";

contract MockMUSD is ERC20 {
    constructor() ERC20("MUSD", "MUSD") {}
    function mint(address to, uint256 amt) external { _mint(to, amt); }
}

contract Mock4626 {
    ERC20 public asset;
    mapping(address => uint256) public balanceOf;
    uint256 public totalAssets_;
    uint256 public totalSupply_;

    constructor(address a) { asset = ERC20(a); }

    function convertToShares(uint256 amt) external view returns (uint256) {
        if (totalSupply_ == 0) return amt;
        return (amt * totalSupply_) / totalAssets_;
    }
    function convertToAssets(uint256 sh) external view returns (uint256) {
        if (totalSupply_ == 0) return sh;
        return (sh * totalAssets_) / totalSupply_;
    }
    function deposit(uint256 amt, address to) external returns (uint256) {
        asset.transferFrom(msg.sender, address(this), amt);
        uint256 sh = totalSupply_ == 0 ? amt : (amt * totalSupply_) / totalAssets_;
        totalAssets_ += amt; totalSupply_ += sh;
        balanceOf[to] += sh;
        return sh;
    }
    function redeem(uint256 sh, address to, address) external returns (uint256) {
        uint256 amt = (sh * totalAssets_) / totalSupply_;
        totalAssets_ -= amt; totalSupply_ -= sh;
        balanceOf[msg.sender] -= sh;
        asset.transfer(to, amt);
        return amt;
    }
}

contract YieldRouterTest is Test {
    MockMUSD musd;
    Mock4626 sVault;
    nyMUSD receipt;
    YieldRouter router;
    SMusdStrategy strat;

    address alice = address(0xA11CE);

    function setUp() public {
        musd = new MockMUSD();
        sVault = new Mock4626(address(musd));
        receipt = new nyMUSD();
        router = new YieldRouter(address(musd), address(receipt));
        
        // Connect the receipt token to the router
        receipt.setRouter(address(router));

        strat = new SMusdStrategy(address(musd), address(router), address(sVault));

        router.addStrategy(address(strat), type(uint256).max);

        musd.mint(alice, 1_000e18);
        vm.prank(alice);
        musd.approve(address(router), type(uint256).max);
    }

    function testDepositMintsShares() public {
        vm.prank(alice);
        uint256 shares = router.deposit(1_000e18);
        assertEq(shares, 1_000e18);
        assertEq(receipt.balanceOf(alice), shares);
        assertEq(strat.totalAssets(), 1_000e18);
    }

    function testWithdrawReturnsMUSD() public {
        vm.startPrank(alice);
        router.deposit(1_000e18);
        uint256 out = router.withdraw(500e18);
        vm.stopPrank();
        assertEq(out, 500e18);
        assertEq(musd.balanceOf(alice), 500e18);
    }

    function testCannotExceedCap() public {
        router.setTotalCap(100e18);
        vm.prank(alice);
        vm.expectRevert(YieldRouter.CapExceeded.selector);
        router.deposit(101e18);
    }
}
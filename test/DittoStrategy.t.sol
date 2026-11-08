// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/strategies/DittoStrategy.sol";

contract MockDitto is ERC20 {
    ERC20 public asset;
    mapping(address => uint256) public pendingShares;
    mapping(uint256 => address) public reqOwner;
    mapping(uint256 => uint256) public reqShares;
    mapping(uint256 => bool) public claimable;
    uint256 public nextId = 1;

    constructor(address a) ERC20("dMUSD", "dMUSD") { asset = ERC20(a); }

    function convertToShares(uint256 amt) external pure returns (uint256) { return amt; }
    function convertToAssets(uint256 sh) external pure returns (uint256) { return sh; }

    function deposit(uint256 amt, address to) external returns (uint256) {
        asset.transferFrom(msg.sender, address(this), amt);
        _mint(to, amt);
        return amt;
    }

    function requestRedeem(uint256 shares) external returns (uint256 id) {
        _burn(msg.sender, shares);
        pendingShares[msg.sender] += shares;
        id = nextId++;
        reqOwner[id] = msg.sender;
        reqShares[id] = shares;
    }

    function markClaimable(uint256 id) external { claimable[id] = true; }

    function isRedeemClaimable(uint256 id) external view returns (bool) {
        return claimable[id];
    }

    function claimRedeem(uint256 id) external returns (uint256 out) {
        require(claimable[id], "not claimable");
        out = reqShares[id];
        claimable[id] = false;
        pendingShares[reqOwner[id]] -= out;
        asset.transfer(reqOwner[id], out);
    }
}

contract MockMUSD2 is ERC20 {
    constructor() ERC20("MUSD", "MUSD") {}
    function mint(address to, uint256 amt) external { _mint(to, amt); }
}

contract DittoStrategyTest is Test {
    MockMUSD2 musd;
    MockDitto ditto;
    DittoStrategy strat;
    address router = address(this);

    function setUp() public {
        musd = new MockMUSD2();
        ditto = new MockDitto(address(musd));
        strat = new DittoStrategy(address(musd), router, address(ditto));
        musd.mint(address(strat), 1_000e18);
        musd.mint(router, 1_000e18);
        musd.approve(address(strat), type(uint256).max);
    }

    function testAsyncRedemptionQueues() public {
        strat.deposit(500e18);
        assertEq(ditto.balanceOf(address(strat)), 500e18);
        uint256 pulled = strat.pull(500e18, router);
        assertEq(pulled, 500e18); // strategy holds 500e18 idle MUSD from setup mint
        assertEq(strat.openRequestCount(), 0);
    }

    function testClaimAfterOperatorFulfills() public {
        strat.deposit(500e18);
        // Pull more than idle to trigger async request ID 1
        uint256 pulled = strat.pull(800e18, router); 
        assertEq(pulled, 500e18); // took all idle 500
        assertEq(strat.openRequestCount(), 1);
        
        ditto.markClaimable(1);
        uint256 out = strat.claim(1, router);
        assertEq(out, 300e18);
        assertEq(strat.pendingRedeemValue(), 0);
    }
}
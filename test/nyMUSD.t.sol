// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/tokens/nyMUSD.sol";

contract nyMUSDTest is Test {
    nyMUSD token;
    address owner = address(this);
    address router = address(0x123);
    address user = address(0x456);

    function setUp() public {
        token = new nyMUSD();
    }

    function testInitialization() public {
        assertEq(token.name(), "Navigator MUSD");
        assertEq(token.symbol(), "nyMUSD");
        assertEq(token.owner(), owner);
        assertEq(token.router(), address(0));
    }

    function testSetRouter() public {
        token.setRouter(router);
        assertEq(token.router(), router);
    }

    function testCannotSetRouterTwice() public {
        token.setRouter(router);
        vm.expectRevert("already set");
        token.setRouter(address(0x789));
    }

    function testMintOnlyByRouter() public {
        token.setRouter(router);

        // Non-router tries to mint (should fail)
        vm.prank(user);
        vm.expectRevert(nyMUSD.NotRouter.selector);
        token.mint(user, 100e18);

        // Router successfully mints
        vm.prank(router);
        token.mint(user, 100e18);
        assertEq(token.balanceOf(user), 100e18);
        assertEq(token.totalSupply(), 100e18);
    }

    function testBurnOnlyByRouter() public {
        token.setRouter(router);
        
        // Setup initial balance
        vm.prank(router);
        token.mint(user, 100e18);

        // Non-router tries to burn (should fail)
        vm.prank(user);
        vm.expectRevert(nyMUSD.NotRouter.selector);
        token.burn(user, 50e18);

        // Router successfully burns
        vm.prank(router);
        token.burn(user, 50e18);
        assertEq(token.balanceOf(user), 50e18);
        assertEq(token.totalSupply(), 50e18);
    }
}
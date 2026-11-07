// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title nyMUSD — MezoYield Navigator receipt token
/// @notice ERC20 shares of the YieldRouter portfolio. Minted/burned only by router.
contract nyMUSD is ERC20, Ownable {
    address public router;

    error NotRouter();

    modifier onlyRouter() {
        if (msg.sender != router) revert NotRouter();
        _;
    }

    constructor() ERC20("Navigator MUSD", "nyMUSD") Ownable(msg.sender) {}

    function setRouter(address _router) external onlyOwner {
        require(_router != address(0), "router=0");
        router = _router;
    }

    function mint(address to, uint256 amount) external onlyRouter {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRouter {
        _burn(from, amount);
    }
}
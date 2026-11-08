// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title nyMUSD — MezoYield Navigator receipt token
/// @notice ERC20 shares of the YieldRouter portfolio. Minted/burned only by router.
contract nyMUSD is ERC20, Ownable {
    address public router;

    error NotRouter();
    error RouterAlreadySet();
    error ZeroAddress();

    event RouterSet(address indexed router);

    modifier onlyRouter() {
        if (msg.sender != router) revert NotRouter();
        _;
    }

    constructor() ERC20("Navigator MUSD", "nyMUSD") Ownable(msg.sender) {}

    /// @notice One-shot: only the owner can set the router, and only once.
    function setRouter(address _router) external onlyOwner {
        if (router != address(0)) revert RouterAlreadySet();
        if (_router == address(0)) revert ZeroAddress();
        router = _router;
        emit RouterSet(_router);
    }

    function mint(address to, uint256 amount) external onlyRouter {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRouter {
        _burn(from, amount);
    }
}
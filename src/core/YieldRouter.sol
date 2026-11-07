// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../tokens/nyMUSD.sol";
import "../strategies/BaseStrategy.sol";

/// @title YieldRouter
/// @notice User-facing entry: deposit MUSD, receive nyMUSD shares.
///         The router routes MUSD into whitelisted strategies, honours caps,
///         and exposes rebalancing controlled by the keeper role.
contract YieldRouter is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");

    IERC20 public immutable musd;
    nyMUSD public immutable receipt;

    address[] public strategies;
    mapping(address => bool) public isStrategy;
    mapping(address => uint256) public strategyCap; // max MUSD in each strategy

    uint256 public totalAssets;          // MUSD managed (excludes pending Ditto)
    uint256 public totalPendingAssets;   // MUSD waiting on async redemptions
    uint256 public totalCap;             // total TVL cap

    /// @notice Target allocation in basis points, per strategy.
    mapping(address => uint256) public targetBps;

    event Deposited(address indexed user, uint256 musdIn, uint256 sharesOut);
    event Withdrawn(address indexed user, uint256 sharesIn, uint256 musdOut);
    event StrategyAdded(address indexed strategy, uint256 cap);
    event StrategyCapUpdated(address indexed strategy, uint256 cap);
    event Rebalanced(address indexed from, address indexed to, uint256 amount);
    event TargetUpdated(address indexed strategy, uint256 bps);
    event TotalCapUpdated(uint256 cap);

    error ZeroAmount();
    error ZeroShares();
    error CapExceeded();
    error UnknownStrategy();
    error InvalidBps();

    constructor(address _musd, address _receipt) {
        require(_musd != address(0) && _receipt != address(0), "zero");
        musd = IERC20(_musd);
        receipt = nyMUSD(_receipt);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
        _grantRole(STRATEGIST_ROLE, msg.sender);

        receipt.setRouter(address(this));
        totalCap = type(uint256).max;
    }

    // ─────────── Views ───────────

    function pricePerShare() public view returns (uint256) {
        uint256 supply = receipt.totalSupply();
        if (supply == 0) return 1e18;
        uint256 assets = totalAssets + totalPendingAssets;
        return (assets * 1e18) / supply;
    }

    function strategyCount() external view returns (uint256) {
        return strategies.length;
    }

    /// @notice Per-strategy current value (in MUSD) as reported by the strategy.
    function strategyValue(address strategy) public view returns (uint256) {
        return BaseStrategy(strategy).totalAssets();
    }

    // ─────────── Admin ───────────

    function addStrategy(address strategy, uint256 cap)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(strategy != address(0), "zero");
        require(!isStrategy[strategy], "exists");
        isStrategy[strategy] = true;
        strategyCap[strategy] = cap;
        strategies.push(strategy);
        emit StrategyAdded(strategy, cap);
    }

    function setStrategyCap(address strategy, uint256 cap)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(isStrategy[strategy], "unknown");
        strategyCap[strategy] = cap;
        emit StrategyCapUpdated(strategy, cap);
    }

    function setTotalCap(uint256 cap) external onlyRole(DEFAULT_ADMIN_ROLE) {
        totalCap = cap;
        emit TotalCapUpdated(cap);
    }

    function setTarget(address strategy, uint256 bps)
        external
        onlyRole(STRATEGIST_ROLE)
    {
        require(isStrategy[strategy], "unknown");
        require(bps <= 10_000, "bps");
        targetBps[strategy] = bps;
        emit TargetUpdated(strategy, bps);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    // ─────────── User ───────────

    function deposit(uint256 amount) external nonReentrant whenNotPaused returns (uint256 shares) {
        if (amount == 0) revert ZeroAmount();
        if (totalAssets + amount > totalCap) revert CapExceeded();

        musd.safeTransferFrom(msg.sender, address(this), amount);
        shares = _convertToShares(amount);
        if (shares == 0) revert ZeroShares();

        receipt.mint(msg.sender, shares);
        totalAssets += amount;
        _allocate(amount);

        emit Deposited(msg.sender, amount, shares);
    }

    function withdraw(uint256 shares) external nonReentrant returns (uint256 musdOut) {
        if (shares == 0) revert ZeroAmount();
        require(receipt.balanceOf(msg.sender) >= shares, "balance");

        uint256 gross = _convertToAssets(shares);

        // Try to free MUSD from strategies, cheapest-first.
        musdOut = _liquidate(shares, gross, msg.sender);

        receipt.burn(msg.sender, shares);
        if (musdOut > totalAssets) totalAssets = 0;
        else totalAssets -= musdOut;

        if (musdOut > 0) musd.safeTransfer(msg.sender, musdOut);
        emit Withdrawn(msg.sender, shares, musdOut);
    }

    // ─────────── Keeper ───────────

    /// @notice Move `amount` MUSD from one strategy to another.
    /// @dev Keeper should pre-compute amount off-chain based on APY diff.
    function rebalance(address from, address to, uint256 amount)
        external
        nonReentrant
        onlyRole(KEEPER_ROLE)
    {
        require(isStrategy[from] && isStrategy[to], "unknown");
        require(amount > 0, "amount=0");

        // Pull from source
        BaseStrategy(from).pull(amount, address(this));

        uint256 available = musd.balanceOf(address(this));
        uint256 moved = available < amount ? available : amount;

        // Respect destination cap
        uint256 destValue = strategyValue(to);
        uint256 cap = strategyCap[to];
        if (destValue + moved > cap) {
            moved = cap > destValue ? cap - destValue : 0;
        }

        if (moved > 0) {
            musd.safeTransfer(to, moved);
            BaseStrategy(to).deposit(moved);
        }

        emit Rebalanced(from, to, moved);
    }

    // ─────────── Internals ───────────

    function _allocate(uint256 amount) internal {
        uint256 remaining = amount;
        uint256 n = strategies.length;
        for (uint256 i = 0; i < n && remaining > 0; i++) {
            address s = strategies[i];
            uint256 current = strategyValue(s);
            uint256 cap = strategyCap[s];
            if (current >= cap) continue;
            uint256 room = cap - current;
            uint256 give = remaining < room ? remaining : room;
            musd.safeTransfer(s, give);
            BaseStrategy(s).deposit(give);
            remaining -= give;
        }
        // If remaining > 0, MUSD stays idle in the router (counts toward totalAssets).
    }

    function _liquidate(uint256 shares, uint256 grossNeeded, address to)
        internal
        returns (uint256 musdOut)
    {
        // 1) Idle MUSD in router.
        uint256 idle = musd.balanceOf(address(this));
        uint256 need = grossNeeded;
        if (idle > 0) {
            uint256 send = idle < need ? idle : need;
            musdOut += send;
            need -= send;
        }
        if (need == 0) return musdOut;

        // 2) Pull from strategies proportionally to their share of TVL.
        uint256 total = totalAssets;
        uint256 n = strategies.length;
        for (uint256 i = 0; i < n && need > 0; i++) {
            address s = strategies[i];
            uint256 sVal = strategyValue(s);
            if (sVal == 0 || total == 0) continue;

            // Proportional slice of remaining need.
            uint256 slice = (need * sVal) / total;
            if (slice == 0) slice = need < sVal ? need : sVal;

            uint256 before = musd.balanceOf(address(this));
            BaseStrategy(s).pull(slice, address(this));
            uint256 got = musd.balanceOf(address(this)) - before;

            if (got > 0) {
                uint256 send = got < need ? got : need;
                musdOut += send;
                need -= send;
                // Refund surplus back to the strategy so it keeps working.
                if (got > send) {
                    musd.safeTransfer(s, got - send);
                    BaseStrategy(s).deposit(got - send);
                }
            }
        }
        // Any unmet need stays pending: user can call again or keeper retries after claim.
        musdOut = musdOut > grossNeeded ? grossNeeded : musdOut;
    }

    function _convertToShares(uint256 amount) internal view returns (uint256) {
        uint256 pps = pricePerShare();
        return (amount * 1e18) / pps;
    }

    function _convertToAssets(uint256 shares) internal view returns (uint256) {
        uint256 pps = pricePerShare();
        return (shares * pps) / 1e18;
    }
}
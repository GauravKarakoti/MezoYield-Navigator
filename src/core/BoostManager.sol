// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IVeMEZO.sol";

/// @title BoostManager
/// @notice Holds accrued MEZO on behalf of opted-in users, locks it into veMEZO,
///         and tracks per-user boost accounting. Opt-in is per user; non-opted-in
///         users simply keep their MEZO claimable.
contract BoostManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable mezo;
    IVeMEZO public immutable veMezo;
    address public immutable router;

    /// @notice Whether a user has opted into auto-boost.
    mapping(address => bool) public autoBoost;

    /// @notice MEZO credited to each user (in MEZO, wei).
    mapping(address => uint256) public mezoCredit;

    /// @notice veMEZO attributed to each user (via their MEZO lock).
    mapping(address => uint256) public veMezoCredit;

    /// @notice Keeper/operator that reports and claims MEZO.
    mapping(address => bool) public operators;

    event AutoBoostSet(address indexed user, bool enabled);
    event MezoCredited(address indexed user, uint256 amount);
    event MezoClaimed(address indexed user, uint256 amount);
    event LockedToVeMezo(uint256 amount, uint256 unlockTime);
    event OperatorSet(address indexed op, bool enabled);

    error NotOperator();

    modifier onlyOperator() {
        if (!operators[msg.sender] && msg.sender != owner()) revert NotOperator();
        _;
    }

    constructor(address _mezo, address _veMezo, address _router) Ownable(msg.sender) {
        mezo = IERC20(_mezo);
        veMezo = IVeMEZO(_veMezo);
        router = _router;
        operators[msg.sender] = true;
    }

    function setOperator(address op, bool enabled) external onlyOwner {
        operators[op] = enabled;
        emit OperatorSet(op, enabled);
    }

    function setAutoBoost(bool enabled) external {
        autoBoost[msg.sender] = enabled;
        emit AutoBoostSet(msg.sender, enabled);
    }

    /// @notice Router reports MEZO accrued for `user` (called when claims happen upstream).
    function creditMezo(address user, uint256 amount) external {
        require(msg.sender == router, "router only");
        mezoCredit[user] += amount;
        emit MezoCredited(user, amount);
    }

    /// @notice User claims their MEZO. If opted-in, it is immediately locked.
    ///         Otherwise, MEZO is transferred to the user.
    function claim() external nonReentrant {
        uint256 amount = mezoCredit[msg.sender];
        require(amount > 0, "nothing to claim");
        mezoCredit[msg.sender] = 0;

        if (autoBoost[msg.sender]) {
            // Lock into veMEZO on the user's behalf.
            mezo.forceApprove(address(veMezo), amount);
            uint256 unlock = ((block.timestamp / 1 weeks) + 52) * 1 weeks; // ~1 year
            veMezo.createLock(amount, unlock);
            veMezoCredit[msg.sender] += amount;
            emit LockedToVeMezo(amount, unlock);
        } else {
            mezo.safeTransfer(msg.sender, amount);
        }
        emit MezoClaimed(msg.sender, amount);
    }

    /// @notice View: user's pending (unclaimed) MEZO.
    function pendingMezo(address user) external view returns (uint256) {
        return mezoCredit[user];
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IVeMEZO.sol";
import "../interfaces/IVoter.sol";

/// @title GaugeVoteModule
/// @notice Epoch-aware gauge voting. Users opt in and select a gauge + weight.
///         A permissioned executor (keeper) casts the vote for them each epoch.
contract GaugeVoteModule is Ownable, ReentrancyGuard {
    IVeMEZO public immutable veMezo;
    IVoter public immutable voter;

    struct VoteIntent {
        address gauge;
        uint256 weightBps;
        bool optIn;
    }

    mapping(address => VoteIntent) public intents;
    mapping(address => bool) public executor;

    event IntentSet(address indexed user, address gauge, uint256 weightBps);
    event VoteCast(address indexed user, address gauge, uint256 weightBps);
    event ExecutorSet(address indexed exec, bool enabled);

    error NotExecutor();
    error InvalidWeight();

    modifier onlyExecutor() {
        if (!executor[msg.sender] && msg.sender != owner()) revert NotExecutor();
        _;
    }

    constructor(address _veMezo, address _voter) Ownable(msg.sender) {
        veMezo = IVeMEZO(_veMezo);
        voter = IVoter(_voter);
    }

    function setExecutor(address exec, bool enabled) external onlyOwner {
        executor[exec] = enabled;
        emit ExecutorSet(exec, enabled);
    }

    /// @notice User selects their preferred gauge + weight. Once set, the keeper
    ///         will cast the vote on their behalf each epoch.
    function setIntent(address gauge, uint256 weightBps) external {
        require(gauge != address(0), "gauge=0");
        if (weightBps == 0 || weightBps > 10_000) revert InvalidWeight();
        intents[msg.sender] = VoteIntent(gauge, weightBps, true);
        emit IntentSet(msg.sender, gauge, weightBps);
    }

    function clearIntent() external {
        delete intents[msg.sender];
        emit IntentSet(msg.sender, address(0), 0);
    }

    /// @notice Cast a vote for one opted-in user. Called by keeper.
    function executeVote(address user) external nonReentrant onlyExecutor {
        VoteIntent memory v = intents[user];
        require(v.optIn, "not opted-in");

        // veMEZO v1 implementation exposes `voteForGaugeWeights`. If the deployed
        // Mezo voter differs, this is the single integration point to swap.
        veMezo.voteForGaugeWeights(v.gauge, v.weightBps);
        emit VoteCast(user, v.gauge, v.weightBps);
    }
}
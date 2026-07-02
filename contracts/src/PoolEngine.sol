// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IPoolEngine.sol";

/// @title PoolEngine
/// @notice Parl parimutuel pool engine — no market makers, no AMM curves, just pools
contract PoolEngine is IPoolEngine {
    /* ───── Storage ───── */

    address public immutable owner;

    // marketId => MarketState
    mapping(bytes32 => MarketState) private _markets;

    // marketId => outcomeIndex => totalPoolForOutcome
    mapping(bytes32 => mapping(uint256 => uint256)) private _outcomePools;

    // marketId => user => BetReceipt
    mapping(bytes32 => mapping(address => BetReceipt)) private _bets;

    struct BetReceipt {
        uint256 outcome;
        uint256 amount;
        bool claimed;
    }

    uint256 public constant MAX_FEE_BASIS_POINTS = 500; // 5%
    uint256 public constant MIN_FEE_BASIS_POINTS = 100; // 1%
    uint256 public constant MIN_DISPUTE_WINDOW = 100;   // ~25 min on Base

    /* ───── Modifiers ───── */

    modifier onlyOwner() {
        require(msg.sender == owner, "PoolEngine: not owner");
        _;
    }

    modifier onlyResolver(bytes32 marketId) {
        require(
            msg.sender == _markets[marketId].config.resolver,
            "PoolEngine: not resolver"
        );
        _;
    }

    modifier marketExists(bytes32 marketId) {
        require(
            _markets[marketId].status != MarketStatus(0) || 
            _markets[marketId].config.createdAt != 0,
            "PoolEngine: market does not exist"
        );
        _;
    }

    /* ───── Constructor ───── */

    constructor() {
        owner = msg.sender;
    }

    /* ───── Core Functions ───── */

    /// @inheritdoc IPoolEngine
    function createMarket(
        bytes32 marketId,
        string[] calldata outcomes,
        address resolver,
        uint256 feeBasisPoints
    ) external {
        require(_markets[marketId].config.createdAt == 0, "PoolEngine: already exists");
        require(outcomes.length >= 2, "PoolEngine: at least 2 outcomes");
        require(resolver != address(0), "PoolEngine: invalid resolver");
        require(
            feeBasisPoints >= MIN_FEE_BASIS_POINTS && feeBasisPoints <= MAX_FEE_BASIS_POINTS,
            "PoolEngine: invalid fee"
        );

        MarketConfig storage cfg = _markets[marketId].config;
        cfg.marketId = marketId;
        cfg.outcomes = outcomes;
        cfg.resolver = resolver;
        cfg.feeBasisPoints = feeBasisPoints;
        cfg.disputeWindow = MIN_DISPUTE_WINDOW;
        cfg.createdAt = block.timestamp;

        _markets[marketId].status = MarketStatus.Active;

        emit MarketCreated(marketId, outcomes, resolver, feeBasisPoints);
    }

    /// @inheritdoc IPoolEngine
    function placeBet(bytes32 marketId, uint256 outcome) external payable marketExists(marketId) {
        MarketState storage state = _markets[marketId];
        require(state.status == MarketStatus.Active, "PoolEngine: market not active");
        require(msg.value > 0, "PoolEngine: zero bet");
        require(outcome < state.config.outcomes.length, "PoolEngine: invalid outcome");

        // Update pools
        state.totalPool += msg.value;
        _outcomePools[marketId][outcome] += msg.value;

        // Update user bet receipt (accumulate)
        BetReceipt storage receipt = _bets[marketId][msg.sender];
        if (receipt.amount == 0) {
            receipt.outcome = outcome;
            receipt.amount = msg.value;
        } else {
            require(receipt.outcome == outcome, "PoolEngine: already bet on different outcome");
            receipt.amount += msg.value;
        }

        emit BetPlaced(marketId, msg.sender, outcome, msg.value);
    }

    /// @inheritdoc IPoolEngine
    function resolveMarket(
        bytes32 marketId,
        uint256 winningOutcome,
        bytes calldata /* proof */
    ) external marketExists(marketId) onlyResolver(marketId) {
        MarketState storage state = _markets[marketId];
        require(state.status == MarketStatus.Active, "PoolEngine: market not active");
        require(winningOutcome < state.config.outcomes.length, "PoolEngine: invalid outcome");
        require(_outcomePools[marketId][winningOutcome] > 0, "PoolEngine: no bets on winning outcome");

        state.status = MarketStatus.Resolved;
        state.winningOutcome = winningOutcome;
        state.resolvedAt = block.timestamp;

        emit MarketResolved(marketId, winningOutcome, state.totalPool);
    }

    /// @inheritdoc IPoolEngine
    function claim(bytes32 marketId) external marketExists(marketId) {
        MarketState storage state = _markets[marketId];
        require(state.status == MarketStatus.Resolved, "PoolEngine: market not resolved");

        BetReceipt storage receipt = _bets[marketId][msg.sender];
        require(receipt.amount > 0, "PoolEngine: no bet");
        require(!receipt.claimed, "PoolEngine: already claimed");

        uint256 payout;
        if (receipt.outcome == state.winningOutcome) {
            uint256 winningPool = _outcomePools[marketId][state.winningOutcome];
            uint256 netPool = (state.totalPool * (10000 - state.config.feeBasisPoints)) / 10000;
            payout = (receipt.amount * netPool) / winningPool;
        }

        if (payout > 0) {
            receipt.claimed = true;
            payable(msg.sender).transfer(payout);
            emit ClaimProcessed(marketId, msg.sender, payout);
        } else {
            revert("PoolEngine: no payout");
        }
    }

    /// @inheritdoc IPoolEngine
    function cancelMarket(bytes32 marketId) external marketExists(marketId) onlyOwner {
        MarketState storage state = _markets[marketId];
        require(state.status == MarketStatus.Active, "PoolEngine: market not active");

        state.status = MarketStatus.Canceled;

        // Refund logic would iterate over bettors — for MVP, requiring off-chain coordination.
        // In production, a Merkle-tree-based refund mechanism is preferred.
        emit MarketResolved(marketId, type(uint256).max, state.totalPool);
    }

    /* ───── Views ───── */

    /// @inheritdoc IPoolEngine
    function getMarketState(bytes32 marketId) external view returns (MarketState memory) {
        return _markets[marketId];
    }

    /// @inheritdoc IPoolEngine
    function getOutcomePool(bytes32 marketId, uint256 outcome) external view returns (uint256) {
        return _outcomePools[marketId][outcome];
    }

    /// @inheritdoc IPoolEngine
    function getUserBet(bytes32 marketId, address user) external view returns (uint256 outcome, uint256 amount, bool claimed) {
        BetReceipt storage receipt = _bets[marketId][user];
        return (receipt.outcome, receipt.amount, receipt.claimed);
    }

    /// @inheritdoc IPoolEngine
    function calculatePayout(bytes32 marketId, address user) external view returns (uint256) {
        MarketState storage state = _markets[marketId];
        BetReceipt storage receipt = _bets[marketId][user];

        if (state.status != MarketStatus.Resolved || receipt.amount == 0 || receipt.claimed) {
            return 0;
        }

        if (receipt.outcome != state.winningOutcome) {
            return 0;
        }

        uint256 winningPool = _outcomePools[marketId][state.winningOutcome];
        uint256 netPool = (state.totalPool * (10000 - state.config.feeBasisPoints)) / 10000;
        return (receipt.amount * netPool) / winningPool;
    }
}

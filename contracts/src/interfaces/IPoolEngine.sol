// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IPoolEngine
/// @notice Core interface for Parl parimutuel pool engine
interface IPoolEngine {
    /* ───── Types ───── */

    enum MarketStatus { Active, Resolving, Resolved, Canceled }

    struct MarketConfig {
        bytes32 marketId;
        string[] outcomes;
        address resolver;
        uint256 feeBasisPoints;   // e.g., 300 = 3%
        uint256 disputeWindow;    // blocks
        uint256 createdAt;
    }

    struct MarketState {
        MarketConfig config;
        MarketStatus status;
        uint256 totalPool;
        uint256 winningOutcome;   // valid only when Resolved
        uint256 resolvedAt;
    }

    /* ───── Events ───── */

    event MarketCreated(bytes32 indexed marketId, string[] outcomes, address resolver, uint256 feeBasisPoints);
    event BetPlaced(bytes32 indexed marketId, address indexed bettor, uint256 outcome, uint256 amount);
    event MarketResolved(bytes32 indexed marketId, uint256 winningOutcome, uint256 totalPool);
    event ClaimProcessed(bytes32 indexed marketId, address indexed bettor, uint256 amount);

    /* ───── Core ───── */

    /// @notice Create a new prediction market
    function createMarket(
        bytes32 marketId,
        string[] calldata outcomes,
        address resolver,
        uint256 feeBasisPoints
    ) external;

    /// @notice Place a bet on a specific outcome
    function placeBet(bytes32 marketId, uint256 outcome) external payable;

    /// @notice Resolve a market (only resolver)
    function resolveMarket(bytes32 marketId, uint256 winningOutcome, bytes calldata proof) external;

    /// @notice Claim winnings after resolution
    function claim(bytes32 marketId) external;

    /// @notice Cancel a market and refund all bets
    function cancelMarket(bytes32 marketId) external;

    /* ───── Views ───── */

    function getMarketState(bytes32 marketId) external view returns (MarketState memory);
    function getOutcomePool(bytes32 marketId, uint256 outcome) external view returns (uint256);
    function getUserBet(bytes32 marketId, address user) external view returns (uint256 outcome, uint256 amount, bool claimed);
    function calculatePayout(bytes32 marketId, address user) external view returns (uint256);
}

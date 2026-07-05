// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title IParlOracle
/// @notice Interface for Parl's optimistic oracle
interface IParlOracle {
    struct Proposal {
        bytes32 marketId;
        uint256 winningOutcome;
        address proposer;
        uint256 bond;
        uint256 proposedAt;
        bool resolved;
        bool disputed;
        address disputer;
        uint256 disputeWindow;
        bytes data;
    }

    event Proposed(bytes32 indexed marketId, uint256 winningOutcome, address indexed proposer, uint256 bond);
    event Disputed(bytes32 indexed marketId, address indexed proposer, address indexed disputer);
    event BondSlashed(bytes32 indexed marketId, address indexed proposer, address indexed disputer, uint256 amount);
    event Executed(bytes32 indexed marketId, uint256 winningOutcome);

    /// @notice Propose a resolution for a market
    /// @param totalPool The current totalPool of the market (used for bond calc, checked by caller)
    function propose(
        bytes32 marketId,
        uint256 winningOutcome,
        uint256 disputeWindow,
        uint256 totalPool,
        bytes calldata data
    ) external payable;

    /// @notice Dispute a proposal. Disputer must match or exceed proposer's bond.
    function dispute(bytes32 marketId) external payable;

    /// @notice Execute resolution after dispute window expires (undisputed only)
    function executeResolution(bytes32 marketId) external;

    /// @notice Get a proposal by marketId
    function getProposal(bytes32 marketId) external view returns (Proposal memory);

    /// @notice Calculate the required bond for a given pool size
    function calculateBond(uint256 totalPool) external view returns (uint256);
}

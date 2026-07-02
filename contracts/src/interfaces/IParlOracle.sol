// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title ParlOracle
/// @notice Optimistic oracle for Parl prediction markets.
///         Anyone can propose an outcome with a bond.
///         Anyone can dispute with an equal bond.
///         After dispute window (no dispute) -> anyone can execute resolve.
///         If disputed -> proposer loses bond to disputer.
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
        bytes data; // optional proof / context
    }

    event Proposed(bytes32 indexed marketId, uint256 winningOutcome, address indexed proposer, uint256 bond);
    event Disputed(bytes32 indexed marketId, address indexed proposer, address indexed disputer);
    event Executed(bytes32 indexed marketId, uint256 winningOutcome);
    event BondSlashed(bytes32 indexed marketId, address indexed proposer, address indexed disputer, uint256 amount);

    function propose(bytes32 marketId, uint256 winningOutcome, uint256 disputeWindow, bytes calldata data) external payable;
    function dispute(bytes32 marketId) external payable;
    function executeResolution(bytes32 marketId) external;
    function getProposal(bytes32 marketId) external view returns (Proposal memory);
}

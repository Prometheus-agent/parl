// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IParlOracle.sol";

/// @title ParlOracle
/// @notice Optimistic oracle for Parl prediction markets.
///
/// Flow:
///   1. Anyone calls propose(marketId, winningOutcome, disputeWindow, data)
///      with a bond (≥ 0.1 AVAX).
///   2. During disputeWindow, anyone can dispute() with equal bond.
///      If disputed → proposer loses bond to disputer, proposal voids.
///   3. After disputeWindow without dispute → anyone can executeResolution(),
///      which calls PoolEngine.resolveMarket() with the proposed outcome.
contract ParlOracle is IParlOracle {
    address public immutable poolEngine;
    uint256 public constant MIN_BOND = 0.1 ether;
    uint256 public constant MAX_DISPUTE_WINDOW = 100_000; // blocks (~14 days)

    mapping(bytes32 => Proposal) private _proposals;

    constructor(address _poolEngine) {
        require(_poolEngine != address(0), "ParlOracle: zero address");
        poolEngine = _poolEngine;
    }

    /// @inheritdoc IParlOracle
    function propose(
        bytes32 marketId,
        uint256 winningOutcome,
        uint256 disputeWindow,
        bytes calldata data
    ) external payable override {
        require(msg.value >= MIN_BOND, "ParlOracle: bond too low");
        require(disputeWindow > 0, "ParlOracle: zero window");
        require(disputeWindow <= MAX_DISPUTE_WINDOW, "ParlOracle: window too large");
        require(_proposals[marketId].proposer == address(0), "ParlOracle: already proposed");

        _proposals[marketId] = Proposal({
            marketId: marketId,
            winningOutcome: winningOutcome,
            proposer: msg.sender,
            bond: msg.value,
            proposedAt: block.number,
            resolved: false,
            disputed: false,
            disputer: address(0),
            disputeWindow: disputeWindow,
            data: data
        });

        emit Proposed(marketId, winningOutcome, msg.sender, msg.value);
    }

    /// @inheritdoc IParlOracle
    function dispute(bytes32 marketId) external payable override {
        Proposal storage p = _proposals[marketId];
        require(p.proposer != address(0), "ParlOracle: no proposal");
        require(!p.disputed, "ParlOracle: already disputed");
        require(!p.resolved, "ParlOracle: already resolved");
        require(block.number < p.proposedAt + p.disputeWindow, "ParlOracle: window expired");
        require(msg.value >= p.bond, "ParlOracle: bond must match or exceed");

        p.disputed = true;
        p.disputer = msg.sender;

        // Slash proposer's bond to disputer
        (bool ok, ) = payable(msg.sender).call{value: p.bond}("");
        require(ok, "ParlOracle: slash transfer failed");

        // Return disputer's bond (they won the dispute)
        (bool ok2, ) = payable(msg.sender).call{value: msg.value}("");
        require(ok2, "ParlOracle: refund failed");

        emit BondSlashed(marketId, p.proposer, msg.sender, p.bond);
        emit Disputed(marketId, p.proposer, msg.sender);
    }

    /// @inheritdoc IParlOracle
    function executeResolution(bytes32 marketId) external override {
        Proposal storage p = _proposals[marketId];
        require(p.proposer != address(0), "ParlOracle: no proposal");
        require(!p.disputed, "ParlOracle: was disputed");
        require(!p.resolved, "ParlOracle: already resolved");
        require(block.number >= p.proposedAt + p.disputeWindow, "ParlOracle: window not expired");

        p.resolved = true;

        // Call PoolEngine.resolveMarket via low-level call
        (bool success, ) = poolEngine.call(
            abi.encodeWithSignature(
                "resolveMarket(bytes32,uint256,bytes)",
                marketId,
                p.winningOutcome,
                p.data
            )
        );
        require(success, "ParlOracle: resolve failed");

        // Return bond to proposer (acted in good faith)
        (bool ok, ) = payable(p.proposer).call{value: p.bond}("");
        require(ok, "ParlOracle: refund failed");

        emit Executed(marketId, p.winningOutcome);
    }

    /// @inheritdoc IParlOracle
    function getProposal(bytes32 marketId) external view override returns (Proposal memory) {
        return _proposals[marketId];
    }
}

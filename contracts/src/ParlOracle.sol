// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IParlOracle.sol";
import "./interfaces/IPoolEngine.sol";

/// @title ParlOracle
/// @notice Optimistic oracle for Parl prediction markets.
///
/// Improvements over v1:
///   - Re-proposal after dispute (marketId resets so market isn't stuck forever)
///   - Dynamic bond = max(MIN_BOND, totalPool × BOND_PCT / 10000)
///   - Safe ETH transfers via call() instead of transfer()
contract ParlOracle is IParlOracle {
    IPoolEngine public immutable poolEngine;
    uint256 public constant MIN_BOND = 0.1 ether;
    uint256 public constant MAX_DISPUTE_WINDOW = 100_000; // blocks (~14 days)
    uint256 public constant BOND_PCT = 100; // 1% of totalPool (in basis points)

    mapping(bytes32 => Proposal) private _proposals;

    constructor(address _poolEngine) {
        require(_poolEngine != address(0), "ParlOracle: zero address");
        poolEngine = IPoolEngine(_poolEngine);
    }

    /// @inheritdoc IParlOracle
    function propose(
        bytes32 marketId,
        uint256 winningOutcome,
        uint256 disputeWindow,
        uint256 totalPool,
        bytes calldata data
    ) external payable override {
        require(disputeWindow > 0, "ParlOracle: zero window");
        require(disputeWindow <= MAX_DISPUTE_WINDOW, "ParlOracle: window too large");

        Proposal storage p = _proposals[marketId];
        // Allow re-proposal only if previous is resolved OR fully disputed + expired
        if (p.proposer != address(0)) {
            require(
                p.resolved || (p.disputed && block.number >= p.proposedAt + p.disputeWindow + 1),
                "ParlOracle: existing active proposal"
            );
        }

        // Calculate required bond based on pool size
        uint256 requiredBond = _calculateBond(totalPool);
        require(msg.value >= requiredBond, "ParlOracle: bond too low");

        // Reset for fresh proposal (clears old proposal state)
        delete _proposals[marketId];

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
        _safeTransfer(msg.sender, p.bond);

        // Return disputer's bond (they won the dispute, bond is returned)
        _safeTransfer(msg.sender, msg.value);

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

        // Call PoolEngine.resolveMarket
        poolEngine.resolveMarket(marketId, p.winningOutcome, p.data);

        // Return bond to proposer (acted in good faith)
        _safeTransfer(p.proposer, p.bond);

        emit Executed(marketId, p.winningOutcome);
    }

    /// @inheritdoc IParlOracle
    function getProposal(bytes32 marketId) external view override returns (Proposal memory) {
        return _proposals[marketId];
    }

    /// @inheritdoc IParlOracle
    function calculateBond(uint256 totalPool) external pure override returns (uint256) {
        return _calculateBond(totalPool);
    }

    /* ───── Internal ───── */

    function _calculateBond(uint256 totalPool) internal pure returns (uint256) {
        uint256 pctBond = (totalPool * BOND_PCT) / 10000;
        return pctBond > MIN_BOND ? pctBond : MIN_BOND;
    }

    function _safeTransfer(address to, uint256 amount) internal {
        (bool success, ) = to.call{value: amount}("");
        require(success, "ParlOracle: transfer failed");
    }
}

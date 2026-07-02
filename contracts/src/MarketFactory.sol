// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {PoolEngine} from "./PoolEngine.sol";

/// @title MarketFactory
/// @notice Permissionless market creation for Parl.
///         Anyone can create a prediction market by paying a small creation fee.
///         The factory auto-generates a deterministic marketId and forwards the
///         call to PoolEngine. Collected fees can be withdrawn by the deployer.
contract MarketFactory {
    /* ───── Storage ───── */

    PoolEngine public immutable poolEngine;
    address public immutable owner;
    uint256 public creationFee; // wei, default 0.01 AVAX

    mapping(bytes32 => address) public marketCreator; // marketId => creator

    /* ───── Events ───── */

    event MarketCreated(
        bytes32 indexed marketId,
        address indexed creator,
        string[] outcomes,
        address resolver,
        uint256 feeBasisPoints
    );
    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed to, uint256 amount);

    /* ───── Errors ───── */

    error InsufficientFee(uint256 required, uint256 provided);
    error OnlyOwner();

    /* ───── Constructor ───── */

    constructor(PoolEngine _poolEngine, uint256 _creationFee) {
        poolEngine = _poolEngine;
        owner = msg.sender;
        creationFee = _creationFee;
    }

    /* ───── Modifier ───── */

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    /* ───── Core ───── */

    /// @notice Create a new prediction market.
    ///         msg.sender pays `creationFee` (in AVAX) to prevent spam.
    /// @param marketId Pre-computed keccak256 market id
    /// @param outcomes Array of outcome strings (min 2)
    /// @param resolver Oracle address that will resolve this market
    /// @param feeBasisPoints Protocol fee (100–500 = 1%–5%)
    function createMarket(
        bytes32 marketId,
        string[] calldata outcomes,
        address resolver,
        uint256 feeBasisPoints
    ) external payable {
        if (msg.value < creationFee) {
            revert InsufficientFee(creationFee, msg.value);
        }

        // Forward to PoolEngine
        poolEngine.createMarket(marketId, outcomes, resolver, feeBasisPoints);

        marketCreator[marketId] = msg.sender;
        emit MarketCreated(marketId, msg.sender, outcomes, resolver, feeBasisPoints);

        // Refund excess
        if (msg.value > creationFee) {
            payable(msg.sender).transfer(msg.value - creationFee);
        }
    }

    /* ───── Owner ───── */

    function setCreationFee(uint256 _fee) external onlyOwner {
        emit CreationFeeUpdated(creationFee, _fee);
        creationFee = _fee;
    }

    /// Withdraw accumulated creation fees
    function withdrawFees(address payable to) external onlyOwner {
        uint256 balance = address(this).balance;
        to.transfer(balance);
        emit FeesWithdrawn(to, balance);
    }
}

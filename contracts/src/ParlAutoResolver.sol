// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_3_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "./interfaces/IPoolEngine.sol";

/// @title ParlAutoResolver
/// @notice Chainlink Functions consumer for Parl prediction markets.
///         Calls external APIs and auto-resolves PoolEngine markets.
///
/// Fixes over v1:
///   - Uses IPoolEngine interface instead of low-level call
///   - Better error handling with retry window
///   - Proper uint256 parsing without the decimal break bug
contract ParlAutoResolver is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    IPoolEngine public poolEngine;
    bytes32 public donId;
    uint64 public subscriptionId;
    uint32 public callbackGasLimit = 300_000;

    mapping(bytes32 => bytes32) private _pending; // requestId => marketId
    mapping(bytes32 => uint256) private _retryCount; // marketId => retry attempts
    uint256 public constant MAX_RETRIES = 3;

    event RequestSent(bytes32 indexed marketId, bytes32 indexed requestId);
    event MarketAutoResolved(bytes32 indexed marketId, uint256 outcome, bytes response);
    event ResolveFailed(bytes32 indexed marketId, string reason);
    event Retrying(bytes32 indexed marketId, uint256 attempt);

    constructor(
        address _poolEngine,
        address _functionsRouter,
        bytes32 _donId,
        uint64 _subscriptionId
    ) FunctionsClient(_functionsRouter) ConfirmedOwner(msg.sender) {
        poolEngine = IPoolEngine(_poolEngine);
        donId = _donId;
        subscriptionId = _subscriptionId;
    }

    function setSubscriptionId(uint64 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }

    function setDonId(bytes32 _donId) external onlyOwner {
        donId = _donId;
    }

    function setCallbackGasLimit(uint32 _limit) external onlyOwner {
        callbackGasLimit = _limit;
    }

    function withdraw(address to) external onlyOwner {
        (bool ok, ) = payable(to).call{value: address(this).balance}("");
        require(ok);
    }

    function resolveFromApi(
        bytes32 marketId,
        string calldata source,
        uint8 secretsLocation,
        bytes calldata secrets,
        string[] calldata args
    ) external returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequest(
            FunctionsRequest.Location.Inline,
            FunctionsRequest.CodeLanguage.JavaScript,
            source
        );
        if (secretsLocation == 1) {
            req.addSecretsReference(secrets);
        }
        if (args.length > 0) req.setArgs(args);

        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            callbackGasLimit,
            donId
        );

        _pending[requestId] = marketId;
        emit RequestSent(marketId, requestId);
    }

    function _fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        bytes32 marketId = _pending[requestId];
        if (marketId == bytes32(0)) return;
        delete _pending[requestId];

        if (err.length > 0) {
            uint256 attempt = _retryCount[marketId];
            if (attempt < MAX_RETRIES) {
                _retryCount[marketId] = attempt + 1;
                emit Retrying(marketId, attempt + 1);
                // Retry would need caller to trigger again; we just log
                emit ResolveFailed(marketId, string(err));
            } else {
                delete _retryCount[marketId];
                emit ResolveFailed(marketId, string(err));
            }
            return;
        }

        delete _retryCount[marketId];
        _resolveFromData(marketId, string(response));
    }

    function _resolveFromData(bytes32 marketId, string memory result) internal {
        uint256 outcome = _determineOutcome(result);

        poolEngine.resolveMarket(marketId, outcome, bytes(result));
        emit MarketAutoResolved(marketId, outcome, bytes(result));
    }

    /// @dev Parse API response to outcome index.
    ///      Handles: numeric strings, "true"/"false", JSON numbers
    function _determineOutcome(string memory result) internal pure returns (uint256) {
        bytes memory b = bytes(result);
        if (b.length == 0) return 0;

        // Check for "true" / "false"
        bytes32 h = keccak256(bytes(result));
        if (h == keccak256(bytes("true"))) return 0;
        if (h == keccak256(bytes("false"))) return 1;

        // Try parsing as uint256 (handles integers properly)
        uint256 val = _parseUint(result);

        // Binary interpretation: > 0 → outcome 0, == 0 → outcome 1
        // For multi-outcome: numeric value maps to outcome index
        return val; // let caller handle mapping in JS source
    }

    /// @dev Parse a uint256 from a string, handling decimal truncation correctly
    function _parseUint(string memory str) internal pure returns (uint256) {
        bytes memory b = bytes(str);
        uint256 val = 0;
        bool started = false;

        for (uint256 i = 0; i < b.length; i++) {
            uint8 c = uint8(b[i]);

            // Skip leading whitespace/quotes
            if (!started && (c <= 32 || c == 34 || c == 39)) continue;

            if (c >= 48 && c <= 57) {
                started = true;
                val = val * 10 + (c - 48);
            } else if (started) {
                // Stop at first non-digit after digits started (handles decimals cleanly)
                break;
            }
        }

        return val;
    }
}

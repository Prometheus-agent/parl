// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_3_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/// @title ParlAutoResolver
/// @notice Chainlink Functions consumer for Parl prediction markets.
///         Calls external APIs (CoinGecko, TheSportsDB, weather, etc.)
///         and auto-resolves PoolEngine markets based on the response.
///
/// Flow:
///   1. Market created with resolver = ParlAutoResolver
///   2. Anyone triggers resolve() → Chainlink Functions hits API
///   3. Callback receives data → resolves market in PoolEngine
contract ParlAutoResolver is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    address public poolEngine;
    bytes32 public donId;
    uint64 public subscriptionId;
    uint32 public callbackGasLimit = 300_000;

    /* ───── Pending requests ───── */
    mapping(bytes32 => bytes32) private _pending; // requestId => marketId

    /* ───── Events ───── */
    event RequestSent(bytes32 indexed marketId, bytes32 indexed requestId);
    event MarketAutoResolved(bytes32 indexed marketId, uint256 outcome, bytes response);
    event ResolveFailed(bytes32 indexed marketId, string reason);

    constructor(
        address _poolEngine,
        address _functionsRouter,
        bytes32 _donId,
        uint64 _subscriptionId
    ) FunctionsClient(_functionsRouter) ConfirmedOwner(msg.sender) {
        poolEngine = _poolEngine;
        donId = _donId;
        subscriptionId = _subscriptionId;
    }

    /* ───── Admin ───── */

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

    /* ───── Request API Data → Resolve Market ───── */

    /// @param marketId The market to resolve
    /// @param source JavaScript source code for Chainlink Functions
    /// @param secretsLocation Where secrets are stored (0 = none)
    /// @param secrets Encrypted secrets
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

    /* ───── Callback ───── */

    function _fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        bytes32 marketId = _pending[requestId];
        if (marketId == bytes32(0)) return;
        delete _pending[requestId];

        if (err.length > 0) {
            emit ResolveFailed(marketId, string(err));
            return;
        }

        string memory result = string(response);
        _resolveFromData(marketId, result);
    }

    /* ───── Internal ───── */

    /// @dev Parse API response and resolve the market
    function _resolveFromData(bytes32 marketId, string memory result) internal {
        uint256 numericResult = _parseUint(result);
        uint256 outcome = numericResult > 0 ? 0 : 1;

        if (numericResult == 0) {
            bytes32 resultHash = keccak256(bytes(result));
            if (resultHash == keccak256(bytes("true"))) outcome = 0;
            else if (resultHash == keccak256(bytes("false"))) outcome = 1;
        }

        (bool success, ) = poolEngine.call(
            abi.encodeWithSignature(
                "resolveMarket(bytes32,uint256,bytes)",
                marketId,
                outcome,
                bytes(result)
            )
        );

        if (success) {
            emit MarketAutoResolved(marketId, outcome, bytes(result));
        } else {
            emit ResolveFailed(marketId, "PoolEngine resolve failed");
        }
    }

    /// @dev Parse a uint256 from a string (e.g., "50000.25" → 50000)
    function _parseUint(string memory str) internal pure returns (uint256) {
        bytes memory b = bytes(str);
        uint256 val = 0;
        bool afterDecimal = false;
        for (uint256 i = 0; i < b.length; i++) {
            uint8 c = uint8(b[i]);
            if (c == 46) { afterDecimal = true; continue; }
            if (c >= 48 && c <= 57) {
                val = val * 10 + (c - 48);
                if (afterDecimal) break;
            }
        }
        return val;
    }
}

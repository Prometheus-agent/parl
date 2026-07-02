// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2 as console} from "forge-std/Script.sol";
import {PoolEngine} from "../src/PoolEngine.sol";

/// @title CreateCryptoMarket — Create a BTC prediction market with auto-categorize
contract CreateCryptoMarket is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Sender:", deployer);

        address poolEngine = vm.envAddress("CONTRACT_ADDRESS");
        address parlOracle = vm.envAddress("ORACLE_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        bytes32 marketId = keccak256(abi.encodePacked("btc-100k-", block.timestamp));
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes - BTC exceeds 100k";
        outcomes[1] = "No - BTC stays below 100k";

        PoolEngine(poolEngine).createMarket(
            marketId,
            outcomes,
            parlOracle,
            200  // 2% fee
        );

        vm.stopBroadcast();

        console.log("Market created:");
        console.logBytes32(marketId);
        console.log("Outcomes: Yes - BTC exceeds 100k / No - BTC stays below 100k");
        console.log("Resolver (Optimistic Oracle):", parlOracle);
    }
}

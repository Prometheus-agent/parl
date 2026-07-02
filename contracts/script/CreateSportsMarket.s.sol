// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2 as console} from "forge-std/Script.sol";
import {PoolEngine} from "../src/PoolEngine.sol";

/// @title CreateSportsMarket — Create a sports prediction market
contract CreateSportsMarket is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Sender:", deployer);

        address poolEngine = vm.envAddress("CONTRACT_ADDRESS");
        address parlOracle = vm.envAddress("ORACLE_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        bytes32 marketId = keccak256(abi.encodePacked("nba-finals-", block.timestamp));
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Lakers win NBA Finals 2026";
        outcomes[1] = "Celtics win NBA Finals 2026";

        PoolEngine(poolEngine).createMarket(
            marketId,
            outcomes,
            parlOracle,
            200
        );

        vm.stopBroadcast();

        console.log("Market created:");
        console.logBytes32(marketId);
    }
}

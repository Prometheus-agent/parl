// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2 as console} from "forge-std/Script.sol";
import {PoolEngine} from "../src/PoolEngine.sol";

/// @title CreateMarket — Create a test prediction market on Fuji
contract CreateMarket is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Sender:", deployer);

        address poolEngine = vm.envAddress("CONTRACT_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        bytes32 marketId = keccak256(abi.encodePacked("test-", block.timestamp));
        string[] memory outcomes = new string[](3);
        outcomes[0] = "Team A Wins";
        outcomes[1] = "Team B Wins";
        outcomes[2] = "Draw";

        PoolEngine(poolEngine).createMarket(
            marketId,
            outcomes,
            deployer,
            200  // 2% fee
        );

        vm.stopBroadcast();

        console.log("Market created:");
        console.logBytes32(marketId);
    }
}

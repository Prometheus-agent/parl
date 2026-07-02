// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2 as console} from "forge-std/Script.sol";
import {PoolEngine} from "../src/PoolEngine.sol";

/// @title Deploy — Parl PoolEngine to Avalanche Fuji
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        PoolEngine poolEngine = new PoolEngine();

        vm.stopBroadcast();

        console.log("PoolEngine deployed at:", address(poolEngine));
    }
}

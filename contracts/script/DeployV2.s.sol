// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2 as console} from "forge-std/Script.sol";
import {PoolEngine} from "../src/PoolEngine.sol";
import {MarketFactory} from "../src/MarketFactory.sol";

/// @title DeployV2 — Redeploy PoolEngine (permissionless) + MarketFactory
contract DeployV2 is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        console.log("Deployer:", deployer);

        vm.startBroadcast(pk);

        // 1. PoolEngine — no onlyOwner
        PoolEngine engine = new PoolEngine();
        console.log("PoolEngine:", address(engine));

        // 2. MarketFactory — 0.01 AVAX creation fee
        MarketFactory factory = new MarketFactory(engine, 0.01 ether);
        console.log("MarketFactory:", address(factory));

        vm.stopBroadcast();

        console.log("DeployV2 done");
        console.log("Save these addresses!");
        console.log("POOL_ENGINE=%s", address(engine));
        console.log("MARKET_FACTORY=%s", address(factory));
    }
}

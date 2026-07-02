// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {ParlOracle} from "../src/ParlOracle.sol";

contract DeployOracle is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address poolEngine = vm.envAddress("POOL_ENGINE");

        vm.startBroadcast(deployerPrivateKey);
        ParlOracle oracle = new ParlOracle(poolEngine);
        vm.stopBroadcast();
    }
}

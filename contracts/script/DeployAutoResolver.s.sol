// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {ParlAutoResolver} from "../src/ParlAutoResolver.sol";

contract DeployAutoResolver is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address poolEngine = vm.envAddress("POOL_ENGINE");
        address functionsRouter = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;
        bytes32 donId = bytes32(uint256(0x6675));
        uint64 subscriptionId = uint64(vm.envUint("CHAINLINK_SUBSCRIPTION_ID"));

        vm.startBroadcast(deployerPrivateKey);
        ParlAutoResolver resolver = new ParlAutoResolver(
            poolEngine,
            functionsRouter,
            donId,
            subscriptionId
        );
        vm.stopBroadcast();
    }
}

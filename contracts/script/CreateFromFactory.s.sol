// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2 as console} from "forge-std/Script.sol";
import {PoolEngine} from "../src/PoolEngine.sol";
import {MarketFactory} from "../src/MarketFactory.sol";

/// @title CreateFromFactory — Create markets via MarketFactory
contract CreateFromFactory is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address factory = vm.envAddress("FACTORY_ADDRESS");
        address oracle = vm.envAddress("ORACLE_ADDRESS");

        vm.startBroadcast(pk);

        // Market 1: Crypto
        {
            bytes32 mId1 = keccak256(abi.encodePacked("btc-100k-v2-", block.timestamp));
            string[] memory o1 = new string[](2);
            o1[0] = "Yes - BTC exceeds 100k";
            o1[1] = "No - BTC stays below 100k";
            MarketFactory(factory).createMarket{value: 0.01 ether}(mId1, o1, oracle, 200);
            console.log("Crypto market: 0x%x", uint256(mId1));
        }

        // Market 2: Sports
        {
            bytes32 mId2 = keccak256(abi.encodePacked("nba-v2-", block.timestamp));
            string[] memory o2 = new string[](2);
            o2[0] = "Lakers win NBA Finals";
            o2[1] = "Celtics win NBA Finals";
            MarketFactory(factory).createMarket{value: 0.01 ether}(mId2, o2, oracle, 200);
            console.log("Sports market: 0x%x", uint256(mId2));
        }

        // Market 3: Politics
        {
            bytes32 mId3 = keccak256(abi.encodePacked("election-", block.timestamp));
            string[] memory o3 = new string[](2);
            o3[0] = "Party A wins election";
            o3[1] = "Party B wins election";
            MarketFactory(factory).createMarket{value: 0.01 ether}(mId3, o3, oracle, 200);
            console.log("Politics market: 0x%x", uint256(mId3));
        }

        vm.stopBroadcast();

        console.log("3 markets created via Factory!");
        console.log("Factory:", factory);
    }
}

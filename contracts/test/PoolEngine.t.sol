// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {PoolEngine} from "../src/PoolEngine.sol";
import {IPoolEngine} from "../src/interfaces/IPoolEngine.sol";

contract PoolEngineTest is Test {
    PoolEngine public engine;
    address public resolver = address(0x1);
    address public bettor1 = address(0x100);
    address public bettor2 = address(0x200);

    bytes32 public marketId = keccak256("match-1");
    string[] public outcomes;

    function setUp() public {
        engine = new PoolEngine();
        outcomes.push("Team A");
        outcomes.push("Team B");
        outcomes.push("Draw");

        vm.deal(bettor1, 10 ether);
        vm.deal(bettor2, 10 ether);
    }

    function test_CreateMarket() public {
        engine.createMarket(marketId, outcomes, resolver, 300);
        IPoolEngine.MarketState memory state = engine.getMarketState(marketId);
        assertEq(uint256(state.status), uint256(IPoolEngine.MarketStatus.Active));
        assertEq(state.config.outcomes.length, 3);
        assertEq(state.config.feeBasisPoints, 300);
    }

    function test_RevertCreateDuplicateMarket() public {
        engine.createMarket(marketId, outcomes, resolver, 300);
        vm.expectRevert("PoolEngine: already exists");
        engine.createMarket(marketId, outcomes, resolver, 300);
    }

    function test_PlaceBet() public {
        engine.createMarket(marketId, outcomes, resolver, 300);

        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        (uint256 outcome, uint256 amount, bool claimed) = engine.getUserBet(marketId, bettor1);
        assertEq(outcome, 0);
        assertEq(amount, 1 ether);
        assertFalse(claimed);
    }

    function test_ResolveAndClaim() public {
        engine.createMarket(marketId, outcomes, resolver, 300);

        // Bettor1 bets on Team A (0), Bettor2 bets on Team B (1)
        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        vm.prank(bettor2);
        engine.placeBet{value: 3 ether}(marketId, 1);

        // Resolve: Team A wins
        vm.prank(resolver);
        engine.resolveMarket(marketId, 0, "");

        // Bettor1 claims
        vm.prank(bettor1);
        uint256 balanceBefore = bettor1.balance;
        engine.claim(marketId);
        uint256 balanceAfter = bettor1.balance;

        // Pool: 4 ETH. Fee 3% = 0.12 ETH. Net pool = 3.88 ETH.
        // Winning pool (Team A) = 1 ETH. Bettor1 gets (1 * 3.88) / 1 = 3.88 ETH.
        assertEq(balanceAfter - balanceBefore, 3.88 ether);
    }

    function test_RevertBetOnResolvedMarket() public {
        engine.createMarket(marketId, outcomes, resolver, 300);

        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        vm.prank(resolver);
        engine.resolveMarket(marketId, 0, "");

        vm.expectRevert("PoolEngine: market not active");
        vm.prank(bettor2);
        engine.placeBet{value: 1 ether}(marketId, 1);
    }

    function test_RevertDoubleClaim() public {
        engine.createMarket(marketId, outcomes, resolver, 300);

        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        vm.prank(resolver);
        engine.resolveMarket(marketId, 0, "");

        vm.prank(bettor1);
        engine.claim(marketId);

        vm.expectRevert("PoolEngine: already claimed");
        vm.prank(bettor1);
        engine.claim(marketId);
    }

    function test_FeeBounds() public {
        vm.expectRevert("PoolEngine: invalid fee");
        engine.createMarket(marketId, outcomes, resolver, 50);

        vm.expectRevert("PoolEngine: invalid fee");
        engine.createMarket(marketId, outcomes, resolver, 600);
    }
}

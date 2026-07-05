// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {PoolEngine} from "../src/PoolEngine.sol";
import {IPoolEngine} from "../src/interfaces/IPoolEngine.sol";

contract PoolEngineTest is Test {
    receive() external payable {}

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
        engine.createMarket(marketId, "test", outcomes, resolver, 300);
        IPoolEngine.MarketState memory state = engine.getMarketState(marketId);
        assertEq(uint256(state.status), uint256(IPoolEngine.MarketStatus.Active));
        assertEq(state.config.outcomes.length, 3);
        assertEq(state.config.feeBasisPoints, 300);
    }

    function test_RevertCreateDuplicateMarket() public {
        engine.createMarket(marketId, "test", outcomes, resolver, 300);
        vm.expectRevert("PoolEngine: already exists");
        engine.createMarket(marketId, "test", outcomes, resolver, 300);
    }

    function test_PlaceBet() public {
        engine.createMarket(marketId, "test", outcomes, resolver, 300);

        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        (uint256 outcome, uint256 amount, bool claimed) = engine.getUserBet(marketId, bettor1);
        assertEq(outcome, 0);
        assertEq(amount, 1 ether);
        assertFalse(claimed);
    }

    function test_ResolveAndClaim() public {
        engine.createMarket(marketId, "test", outcomes, resolver, 300);

        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        vm.prank(bettor2);
        engine.placeBet{value: 3 ether}(marketId, 1);

        vm.prank(resolver);
        engine.resolveMarket(marketId, 0, "");

        vm.prank(bettor1);
        uint256 balanceBefore = bettor1.balance;
        engine.claim(marketId);
        uint256 balanceAfter = bettor1.balance;

        // Pool: 4 ETH. Fee 3% = 0.12 ETH. Net pool = 3.88 ETH.
        // Winning pool (Team A) = 1 ETH. Bettor1 gets (1 * 3.88) / 1 = 3.88 ETH.
        assertEq(balanceAfter - balanceBefore, 3.88 ether);
    }

    /* ───── New: Cancel + Refund ───── */

    function test_CancelAndRefund() public {
        engine.createMarket(marketId, "test", outcomes, resolver, 300);

        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        vm.prank(bettor2);
        engine.placeBet{value: 3 ether}(marketId, 1);

        uint256 bettor1Before = bettor1.balance;
        uint256 bettor2Before = bettor2.balance;

        // Cancel
        engine.cancelMarket(marketId);

        IPoolEngine.MarketState memory state = engine.getMarketState(marketId);
        assertEq(uint256(state.status), uint256(IPoolEngine.MarketStatus.Canceled));

        // Refund individual bettors (anyone can trigger)
        engine.refundBettor(marketId, bettor1);
        assertEq(bettor1.balance - bettor1Before, 1 ether);

        engine.refundBettor(marketId, bettor2);
        assertEq(bettor2.balance - bettor2Before, 3 ether);

        // Pool should be empty after refunds
        state = engine.getMarketState(marketId);
        assertEq(state.totalPool, 0);
    }

    function test_CancelRefundAll() public {
        engine.createMarket(marketId, "test", outcomes, resolver, 300);

        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        vm.prank(bettor2);
        engine.placeBet{value: 3 ether}(marketId, 1);

        uint256 bettor1Before = bettor1.balance;
        uint256 bettor2Before = bettor2.balance;

        engine.cancelMarket(marketId);

        // Batch refund (owner only)
        engine.refundAllBettors(marketId);

        assertEq(bettor1.balance - bettor1Before, 1 ether);
        assertEq(bettor2.balance - bettor2Before, 3 ether);
    }

    function test_RevertDoubleRefund() public {
        engine.createMarket(marketId, "test", outcomes, resolver, 300);

        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        engine.cancelMarket(marketId);
        engine.refundBettor(marketId, bettor1);

        vm.expectRevert("PoolEngine: no bet to refund");
        engine.refundBettor(marketId, bettor1);
    }

    function test_RevertCancelAlreadyResolved() public {
        engine.createMarket(marketId, "test", outcomes, resolver, 300);
        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);
        vm.prank(resolver);
        engine.resolveMarket(marketId, 0, "");

        vm.expectRevert("PoolEngine: market not active");
        engine.cancelMarket(marketId);
    }

    /* ───── Existing tests ───── */

    function test_RevertBetOnResolvedMarket() public {
        engine.createMarket(marketId, "test", outcomes, resolver, 300);

        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        vm.prank(resolver);
        engine.resolveMarket(marketId, 0, "");

        vm.expectRevert("PoolEngine: market not active");
        vm.prank(bettor2);
        engine.placeBet{value: 1 ether}(marketId, 1);
    }

    function test_RevertDoubleClaim() public {
        engine.createMarket(marketId, "test", outcomes, resolver, 300);

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
        engine.createMarket(marketId, "test", outcomes, resolver, 50);

        vm.expectRevert("PoolEngine: invalid fee");
        engine.createMarket(marketId, "test", outcomes, resolver, 600);
    }

    function test_ProtocolFeeWithdrawal() public {
        engine.createMarket(marketId, "test", outcomes, resolver, 300);

        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        vm.prank(resolver);
        engine.resolveMarket(marketId, 0, "");

        vm.prank(bettor1);
        engine.claim(marketId);

        // 3% of 1 ETH = 0.03 ETH accumulated
        assertEq(engine.accumulatedFees(), 0.03 ether);

        uint256 ownerBefore = address(this).balance;
        engine.withdrawProtocolFees(address(this));
        assertEq(address(this).balance - ownerBefore, 0.03 ether);
        assertEq(engine.accumulatedFees(), 0);
    }

    function test_RevertNonOwnerWithdraw() public {
        vm.prank(bettor1);
        vm.expectRevert("PoolEngine: not owner");
        engine.withdrawProtocolFees(bettor1);
    }

    function test_GetBettorCount() public {
        engine.createMarket(marketId, "test", outcomes, resolver, 300);

        assertEq(engine.getBettorCount(marketId), 0);

        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        assertEq(engine.getBettorCount(marketId), 1);

        vm.prank(bettor2);
        engine.placeBet{value: 3 ether}(marketId, 1);

        assertEq(engine.getBettorCount(marketId), 2);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {PoolEngine} from "../src/PoolEngine.sol";
import {MarketFactory} from "../src/MarketFactory.sol";
import {ParlOracle} from "../src/ParlOracle.sol";
import {IPoolEngine} from "../src/interfaces/IPoolEngine.sol";
import {IParlOracle} from "../src/interfaces/IParlOracle.sol";

/// @title ParlE2E — Full lifecycle end-to-end test
/// @notice Tests the complete Parl protocol flow:
///         Factory → PoolEngine → ParlOracle → Propose → Dispute → Execute → Claim
contract ParlE2E is Test {
    PoolEngine public engine;
    MarketFactory public factory;
    ParlOracle public oracle;

    address public deployer = address(0xdead);
    address public bettor1  = address(0xbeef);
    address public bettor2  = address(0xcafe);
    address public proposer = address(0xf00d);
    address public disputer = address(0xbaad);

    bytes32 public marketId;

    function setUp() public {
        vm.label(deployer, "Deployer");
        vm.label(bettor1, "Bettor1");
        vm.label(bettor2, "Bettor2");
        vm.label(proposer, "Proposer");
        vm.label(disputer, "Disputer");

        vm.prank(deployer);
        engine = new PoolEngine();

        vm.prank(deployer);
        factory = new MarketFactory(engine, 0.01 ether);

        vm.prank(deployer);
        oracle = new ParlOracle(address(engine));

        vm.deal(bettor1, 10 ether);
        vm.deal(bettor2, 10 ether);
        vm.deal(proposer, 10 ether);
        vm.deal(disputer, 10 ether);
        vm.deal(deployer, 10 ether);

        marketId = keccak256("e2e-test-market");
    }

    /* ───── 1. Factory → Create Market ───── */

    function test_01_FactoryCreatesMarket() public {
        _createMarket();
    }

    /* ───── 2. Place Bets ───── */

    function test_02_PlaceBets() public {
        _createMarket();

        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        vm.prank(bettor2);
        engine.placeBet{value: 3 ether}(marketId, 1);

        assertEq(engine.getOutcomePool(marketId, 0), 1 ether);
        assertEq(engine.getOutcomePool(marketId, 1), 3 ether);

        (uint256 o1, uint256 a1, bool c1) = engine.getUserBet(marketId, bettor1);
        assertEq(o1, 0); assertEq(a1, 1 ether); assertFalse(c1);
    }

    /* ───── 3. Oracle Happy Path ───── */

    function test_03_OracleHappyPath() public {
        _createMarket();
        _placeBets();

        // Pool = 4 ETH → bond = max(0.1, 4*1%) = 0.1 ETH (since 0.04 < 0.1)
        vm.prank(proposer);
        oracle.propose{value: 0.1 ether}(marketId, 0, 1000, 4 ether, "");

        vm.warp(block.timestamp + 1001);
        vm.roll(block.number + 1001);

        vm.prank(proposer);
        oracle.executeResolution(marketId);

        // Bettor1 claims
        uint256 balBefore = bettor1.balance;
        vm.prank(bettor1);
        engine.claim(marketId);
        assertEq(bettor1.balance - balBefore, 3.92 ether);

        // Bettor2 gets nothing
        vm.prank(bettor2);
        vm.expectRevert("PoolEngine: no payout");
        engine.claim(marketId);
    }

    /* ───── 4. Oracle Dispute → Slash ───── */

    function test_04_OracleDisputeSlash() public {
        _createMarket();
        _placeBets();

        vm.prank(proposer);
        oracle.propose{value: 0.1 ether}(marketId, 0, 5000, 4 ether, "");

        uint256 disputerBalBefore = disputer.balance;
        vm.prank(disputer);
        oracle.dispute{value: 0.1 ether}(marketId);

        // Disputer gains 0.1 ETH (proposer's bond)
        assertEq(disputer.balance - disputerBalBefore, 0.1 ether);
        assertEq(proposer.balance, 9.9 ether);

        // Cannot execute disputed proposal
        vm.warp(block.timestamp + 5001);
        vm.roll(block.number + 5001);
        vm.prank(proposer);
        vm.expectRevert("ParlOracle: was disputed");
        oracle.executeResolution(marketId);
    }

    /* ───── 5. Oracle Re-proposal After Dispute ───── */

    function test_05_OracleReProposalAfterDispute() public {
        _createMarket();
        _placeBets();

        // First proposal — disputed
        vm.prank(proposer);
        oracle.propose{value: 0.1 ether}(marketId, 0, 100, 4 ether, "");

        vm.prank(disputer);
        oracle.dispute{value: 0.1 ether}(marketId);

        // Fast-forward past dispute window + 1 block
        vm.warp(block.timestamp + 101);
        vm.roll(block.number + 101);

        // Re-proposal is now allowed (previous is disputed + expired)
        vm.prank(proposer);
        oracle.propose{value: 0.1 ether}(marketId, 1, 1000, 4 ether, "");

        // Execute resolution
        vm.warp(block.timestamp + 1001);
        vm.roll(block.number + 1001);

        vm.prank(proposer);
        oracle.executeResolution(marketId);

        IPoolEngine.MarketState memory state = engine.getMarketState(marketId);
        assertEq(uint256(state.status), uint256(IPoolEngine.MarketStatus.Resolved));
        assertEq(state.winningOutcome, 1);
    }

    /* ───── 6. Dynamic Bond Calculation ───── */

    function test_06_DynamicBond() public {
        _createMarket();

        // Small pool (0.01 ETH via factory) → bond = min 0.1 ETH
        // But _placeBets adds 4 ETH, so totalPool = 4.01 ETH
        _placeBets();

        // 1% of 4 ETH = 0.04 ETH, which is < 0.1 → bond = 0.1 ETH
        assertEq(oracle.calculateBond(4 ether), 0.1 ether);

        // 1% of 50 ETH = 0.5 ETH → bond = 0.5 ETH
        assertEq(oracle.calculateBond(50 ether), 0.5 ether);
    }

    /* ───── 7. Cancel Market + Refund ───── */

    function test_07_CancelAndRefund() public {
        _createMarket();
        _placeBets();

        uint256 bal1Before = bettor1.balance;
        uint256 bal2Before = bettor2.balance;

        vm.prank(deployer);
        engine.cancelMarket(marketId);

        // Refund individual bettors
        engine.refundBettor(marketId, bettor1);
        assertEq(bettor1.balance - bal1Before, 1 ether);

        engine.refundBettor(marketId, bettor2);
        assertEq(bettor2.balance - bal2Before, 3 ether);
    }

    function test_08_RefundAllBettors() public {
        _createMarket();
        _placeBets();

        uint256 bal1Before = bettor1.balance;
        uint256 bal2Before = bettor2.balance;

        vm.prank(deployer);
        engine.cancelMarket(marketId);

        vm.prank(deployer);
        engine.refundAllBettors(marketId);

        assertEq(bettor1.balance - bal1Before, 1 ether);
        assertEq(bettor2.balance - bal2Before, 3 ether);
    }

    /* ───── 8. Fee Management ───── */

    function test_09_MultiMarketFees() public {
        _createMarket();
        _placeBets();

        // Market 2
        bytes32 id2 = keccak256("market-2");
        string[] memory o2 = new string[](2);
        o2[0] = "Up"; o2[1] = "Down";
        vm.prank(deployer);
        factory.createMarket{value: 0.01 ether}(id2, "test", o2, address(oracle), 300);

        vm.prank(bettor1);
        engine.placeBet{value: 2 ether}(id2, 0);

        // Resolve market 1
        _proposeAndExecute(marketId, 0, 4 ether);

        // Resolve market 2 (oracle is resolver)
        vm.prank(address(oracle));
        engine.resolveMarket(id2, 0, "");

        // Claim both
        vm.prank(bettor1);
        engine.claim(marketId);
        vm.prank(bettor1);
        engine.claim(id2);

        assertEq(engine.accumulatedFees(), 0.14 ether); // 0.08 + 0.06

        vm.prank(deployer);
        engine.withdrawProtocolFees(payable(deployer));
        assertEq(engine.accumulatedFees(), 0);
    }

    /* ───── 9. Edge Cases ───── */

    function test_10_RevertZeroBond() public {
        _createMarket();
        vm.prank(proposer);
        vm.expectRevert("ParlOracle: bond too low");
        oracle.propose{value: 0.01 ether}(marketId, 0, 1000, 0, "");
    }

    function test_11_RevertDisputeWithoutProposal() public {
        vm.expectRevert("ParlOracle: no proposal");
        oracle.dispute{value: 0.1 ether}(keccak256("nothing"));
    }

    function test_12_RevertDoubleClaim() public {
        _createMarket();
        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);
        _proposeAndExecute(marketId, 0, 1 ether);

        vm.prank(bettor1);
        engine.claim(marketId);
        vm.prank(bettor1);
        vm.expectRevert("PoolEngine: already claimed");
        engine.claim(marketId);
    }

    function test_13_RevertNonExistentMarket() public {
        bytes32 fakeId = keccak256("nope");
        vm.expectRevert("PoolEngine: market does not exist");
        engine.placeBet{value: 1 ether}(fakeId, 0);
    }

    /* ───── Helpers ───── */

    function _createMarket() internal {
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        vm.prank(deployer);
        factory.createMarket{value: 0.01 ether}(marketId, "test", outcomes, address(oracle), 200);

        IPoolEngine.MarketState memory state = engine.getMarketState(marketId);
        assertEq(uint256(state.status), uint256(IPoolEngine.MarketStatus.Active));
    }

    function _placeBets() internal {
        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        vm.prank(bettor2);
        engine.placeBet{value: 3 ether}(marketId, 1);
    }

    function _proposeAndExecute(bytes32 id, uint256 outcome, uint256 totalPool) internal {
        vm.prank(proposer);
        oracle.propose{value: 0.1 ether}(id, outcome, 1000, totalPool, "");

        vm.warp(block.timestamp + 1001);
        vm.roll(block.number + 1001);

        vm.prank(proposer);
        oracle.executeResolution(id);
    }
}

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
        // Label addresses for trace readability
        vm.label(deployer, "Deployer");
        vm.label(bettor1, "Bettor1");
        vm.label(bettor2, "Bettor2");
        vm.label(proposer, "Proposer");
        vm.label(disputer, "Disputer");

        // Deploy contracts
        vm.prank(deployer);
        engine = new PoolEngine();

        vm.prank(deployer);
        factory = new MarketFactory(engine, 0.01 ether);

        vm.prank(deployer);
        oracle = new ParlOracle(address(engine));

        // Fund users
        vm.deal(bettor1, 10 ether);
        vm.deal(bettor2, 10 ether);
        vm.deal(proposer, 10 ether);
        vm.deal(disputer, 10 ether);
        vm.deal(deployer, 10 ether);

        // Create a market via Factory
        marketId = keccak256("e2e-test-market");
    }

    /* ───── 1. Factory → Create Market ───── */

    function test_01_FactoryCreatesMarket() public {
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        vm.prank(deployer);
        factory.createMarket{value: 0.01 ether}(marketId, outcomes, address(oracle), 200);

        // Verify PoolEngine state
        IPoolEngine.MarketState memory state = engine.getMarketState(marketId);
        assertEq(uint256(state.status), uint256(IPoolEngine.MarketStatus.Active));
        assertEq(state.config.outcomes.length, 2);
        assertEq(state.config.resolver, address(oracle));
        assertEq(state.config.feeBasisPoints, 200);

        // Verify Factory tracking
        assertEq(factory.marketCreator(marketId), deployer);
    }

    /* ───── 2. Place Bets ───── */

    function test_02_PlaceBets() public {
        _createMarket();

        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0); // Yes

        vm.prank(bettor2);
        engine.placeBet{value: 3 ether}(marketId, 1); // No

        // Verify pool state
        assertEq(engine.getOutcomePool(marketId, 0), 1 ether);
        assertEq(engine.getOutcomePool(marketId, 1), 3 ether);

        // Verify user bets
        (uint256 o1, uint256 a1, bool c1) = engine.getUserBet(marketId, bettor1);
        assertEq(o1, 0);
        assertEq(a1, 1 ether);
        assertFalse(c1);

        (uint256 o2, uint256 a2, bool c2) = engine.getUserBet(marketId, bettor2);
        assertEq(o2, 1);
        assertEq(a2, 3 ether);
        assertFalse(c2);
    }

    /* ───── 3. Revert Scenarios ───── */

    function test_03_RevertBetOnResolvedMarket() public {
        _createMarket();
        _placeBets();

        vm.prank(proposer);
        oracle.propose{value: 0.1 ether}(marketId, 0, 1000, "");

        vm.warp(block.timestamp + 1001);
        vm.roll(block.number + 1001);

        vm.prank(proposer);
        oracle.executeResolution(marketId);

        vm.expectRevert("PoolEngine: market not active");
        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);
    }

    function test_04_RevertDuplicateMarket() public {
        _createMarket();

        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        vm.prank(deployer);
        vm.expectRevert("PoolEngine: already exists");
        factory.createMarket{value: 0.01 ether}(marketId, outcomes, address(oracle), 200);
    }

    function test_05_RevertInvalidFee() public {
        string[] memory outcomes = new string[](2);
        outcomes[0] = "A";
        outcomes[1] = "B";

        bytes32 id = keccak256("fee-test");

        // Fee too low (0.5%)
        vm.prank(deployer);
        vm.expectRevert("PoolEngine: invalid fee");
        factory.createMarket{value: 0.01 ether}(id, outcomes, address(oracle), 50);

        // Fee too high (6%)
        vm.prank(deployer);
        vm.expectRevert("PoolEngine: invalid fee");
        factory.createMarket{value: 0.01 ether}(id, outcomes, address(oracle), 600);
    }

    /* ───── 4. Oracle: Propose → Resolve → Claim (Happy Path) ───── */

    function test_06_OracleHappyPath() public {
        _createMarket();
        _placeBets();

        // Propose outcome 0 (Yes wins)
        vm.prank(proposer);
        oracle.propose{value: 0.1 ether}(marketId, 0, 1000, "");

        IParlOracle.Proposal memory p = oracle.getProposal(marketId);
        assertEq(p.proposer, proposer);
        assertEq(p.winningOutcome, 0);
        assertEq(p.bond, 0.1 ether);
        assertFalse(p.resolved);
        assertFalse(p.disputed);

        // Fast-forward past dispute window
        vm.warp(block.timestamp + 1001);
        vm.roll(block.number + 1001);

        // Execute resolution
        vm.prank(proposer);
        oracle.executeResolution(marketId);

        // Verify market resolved
        IPoolEngine.MarketState memory state = engine.getMarketState(marketId);
        assertEq(uint256(state.status), uint256(IPoolEngine.MarketStatus.Resolved));
        assertEq(state.winningOutcome, 0);

        // Verify proposal marked resolved, proposer got bond back
        IParlOracle.Proposal memory p2 = oracle.getProposal(marketId);
        assertTrue(p2.resolved);
        assertFalse(p2.disputed);
        // Proposer should have their bond back (0.1 ETH refunded)
        assertGt(proposer.balance, 9.9 ether); // had 10, spent ~gas, got 0.1 back

        // Bettor1 (Yes) claims winnings
        uint256 balBefore = bettor1.balance;
        vm.prank(bettor1);
        engine.claim(marketId);
        uint256 payout = bettor1.balance - balBefore;

        // Pool: 4 ETH. Fee 2% = 0.08 ETH. Net pool = 3.92 ETH.
        // Winning pool (Yes) = 1 ETH. Bettor1 gets (1 * 3.92) / 1 = 3.92 ETH.
        assertEq(payout, 3.92 ether);

        // Bettor2 (No) gets nothing
        uint256 bal2Before = bettor2.balance;
        vm.prank(bettor2);
        vm.expectRevert("PoolEngine: no payout");
        engine.claim(marketId);
        assertEq(bettor2.balance, bal2Before); // unchanged
    }

    /* ───── 5. Oracle: Propose → Dispute → Slash ───── */

    function test_07_OracleDisputeSlash() public {
        _createMarket();
        _placeBets();

        // Proposer proposes outcome 0 with 0.1 ETH bond
        vm.prank(proposer);
        oracle.propose{value: 0.1 ether}(marketId, 0, 5000, "");

        // Disputer disputes with equal bond (0.1 ETH)
        uint256 disputerBalBefore = disputer.balance;
        vm.prank(disputer);
        oracle.dispute{value: 0.1 ether}(marketId);

        // Disputer gets proposer's bond slashed to them + their own bond back
        // So they gain 0.1 ETH
        assertEq(disputer.balance - disputerBalBefore, 0.1 ether);

        // Proposer loses their bond (10 - 0.1 = 9.9)
        assertEq(proposer.balance, 9.9 ether);

        // Verify proposal state
        IParlOracle.Proposal memory p = oracle.getProposal(marketId);
        assertTrue(p.disputed);
        assertFalse(p.resolved);

        // Cannot execute a disputed proposal
        vm.warp(block.timestamp + 5001);
        vm.roll(block.number + 5001);
        vm.prank(proposer);
        vm.expectRevert("ParlOracle: was disputed");
        oracle.executeResolution(marketId);
    }

    /* ───── 6. Direct resolveMarket (non-oracle resolver test) ───── */

    function test_08_DirectResolve() public {
        // Use a different resolver (not the oracle)
        address altResolver = address(0x1111);
        vm.label(altResolver, "AltResolver");

        bytes32 id = keccak256("direct-resolve");
        string[] memory outcomes = new string[](2);
        outcomes[0] = "A";
        outcomes[1] = "B";

        vm.prank(deployer);
        factory.createMarket{value: 0.01 ether}(id, outcomes, altResolver, 200);

        vm.prank(bettor1);
        engine.placeBet{value: 2 ether}(id, 0);

        // Only resolver can resolve
        vm.prank(bettor1);
        vm.expectRevert("PoolEngine: not resolver");
        engine.resolveMarket(id, 0, "");

        // Resolver resolves
        vm.prank(altResolver);
        engine.resolveMarket(id, 0, "");

        IPoolEngine.MarketState memory state = engine.getMarketState(id);
        assertEq(uint256(state.status), uint256(IPoolEngine.MarketStatus.Resolved));
        assertEq(state.winningOutcome, 0);
    }

    /* ───── 7. Edge: zero dispute window revert ───── */

    function test_09_RevertZeroDisputeWindow() public {
        _createMarket();

        vm.prank(proposer);
        vm.expectRevert("ParlOracle: zero window");
        oracle.propose{value: 0.1 ether}(marketId, 0, 0, "");
    }

    /* ───── 8. Payout calculation view ───── */

    function test_10_CalculatePayout() public {
        _createMarket();

        vm.prank(bettor1);
        engine.placeBet{value: 2 ether}(marketId, 0);

        vm.prank(bettor2);
        engine.placeBet{value: 2 ether}(marketId, 1);

        // Before resolution, payout should be 0
        assertEq(engine.calculatePayout(marketId, bettor1), 0);

        vm.prank(proposer);
        oracle.propose{value: 0.1 ether}(marketId, 0, 1000, "");

        vm.warp(block.timestamp + 1001);
        vm.roll(block.number + 1001);

        vm.prank(proposer);
        oracle.executeResolution(marketId);

        // Pool: 4 ETH. Fee 2% = 0.08. Net = 3.92.
        // Winning pool (Yes, outcome 0) = 2 ETH
        // Bettor1 has 2 ETH on Yes → (2 * 3.92) / 2 = 3.92
        (uint256 o, uint256 a, bool c) = engine.getUserBet(marketId, bettor1);
        assertEq(engine.calculatePayout(marketId, bettor1), 3.92 ether);

        // Bettor2 has 2 ETH on No (loss) → 0
        assertEq(engine.calculatePayout(marketId, bettor2), 0);
    }

    /* ───── 9. Double claim revert ───── */

    function test_11_DoubleClaim() public {
        test_06_OracleHappyPath(); // resolves and claims once

        vm.prank(bettor1);
        vm.expectRevert("PoolEngine: already claimed");
        engine.claim(marketId);
    }

    /* ───── 10. Factory withdraw fees ───── */

    function test_12_FactoryWithdrawFees() public {
        _createMarket();
        // Create another market for more fees
        bytes32 id2 = keccak256("market-2");
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Up";
        outcomes[1] = "Down";
        vm.prank(deployer);
        factory.createMarket{value: 0.01 ether}(id2, outcomes, address(oracle), 200);

        // Factory should have 0.02 AVAX
        uint256 factoryBalance = address(factory).balance;
        assertEq(factoryBalance, 0.02 ether);

        // Only owner can withdraw
        vm.prank(bettor1);
        vm.expectRevert();
        factory.withdrawFees(payable(bettor1));

        // Owner withdraws
        uint256 deployerBalBefore = deployer.balance;
        vm.prank(deployer);
        factory.withdrawFees(payable(deployer));
        assertEq(deployer.balance - deployerBalBefore, 0.02 ether);
        assertEq(address(factory).balance, 0);
    }

    /* ───── Helpers ───── */

    function _createMarket() internal {
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        vm.prank(deployer);
        factory.createMarket{value: 0.01 ether}(marketId, outcomes, address(oracle), 200);
    }

    function _placeBets() internal {
        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        vm.prank(bettor2);
        engine.placeBet{value: 3 ether}(marketId, 1);
    }
}

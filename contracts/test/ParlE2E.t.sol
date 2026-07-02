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
        factory.createMarket{value: 0.01 ether}(marketId, "test", outcomes, address(oracle), 200);

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
        factory.createMarket{value: 0.01 ether}(marketId, "test", outcomes, address(oracle), 200);
    }

    function test_05_RevertInvalidFee() public {
        string[] memory outcomes = new string[](2);
        outcomes[0] = "A";
        outcomes[1] = "B";

        bytes32 id = keccak256("fee-test");

        // Fee too low (0.5%)
        vm.prank(deployer);
        vm.expectRevert("PoolEngine: invalid fee");
        factory.createMarket{value: 0.01 ether}(id, "test", outcomes, address(oracle), 50);

        // Fee too high (6%)
        vm.prank(deployer);
        vm.expectRevert("PoolEngine: invalid fee");
        factory.createMarket{value: 0.01 ether}(id, "test", outcomes, address(oracle), 600);
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
        factory.createMarket{value: 0.01 ether}(id, "test", outcomes, altResolver, 200);

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

    /* ───── 10. Bet on different outcome → revert ───── */

    function test_12_RevertDifferentOutcome() public {
        _createMarket();

        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0); // Yes

        // Same user tries to bet on No — should revert
        vm.prank(bettor1);
        vm.expectRevert("PoolEngine: already bet on different outcome");
        engine.placeBet{value: 1 ether}(marketId, 1);

        // Verify only the first bet counted
        (uint256 o, uint256 a, bool c) = engine.getUserBet(marketId, bettor1);
        assertEq(o, 0);
        assertEq(a, 1 ether);
    }

    /* ───── 11. Accumulate same outcome ───── */

    function test_13_AccumulateSameOutcome() public {
        _createMarket();

        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0); // Yes, first bet

        vm.prank(bettor1);
        engine.placeBet{value: 2 ether}(marketId, 0); // Yes, second bet

        // Verify accumulation
        (uint256 o, uint256 a, bool c) = engine.getUserBet(marketId, bettor1);
        assertEq(o, 0);
        assertEq(a, 3 ether);
        assertEq(engine.getOutcomePool(marketId, 0), 3 ether);
    }

    /* ───── 12. Zero bet revert ───── */

    function test_14_RevertZeroBet() public {
        _createMarket();

        vm.prank(bettor1);
        vm.expectRevert("PoolEngine: zero bet");
        engine.placeBet{value: 0}(marketId, 0);
    }

    /* ───── 13. Invalid outcome revert ───── */

    function test_15_RevertInvalidOutcome() public {
        _createMarket();

        vm.prank(bettor1);
        vm.expectRevert("PoolEngine: invalid outcome");
        engine.placeBet{value: 1 ether}(marketId, 999);
    }

    /* ───── 14. Cancel market (no refunds MVP) ───── */

    function test_16_CancelMarket() public {
        _createMarket();
        _placeBets();

        // Non-owner cannot cancel
        vm.prank(bettor1);
        vm.expectRevert("PoolEngine: not owner");
        engine.cancelMarket(marketId);

        // Owner cancels
        vm.prank(deployer);
        engine.cancelMarket(marketId);

        IPoolEngine.MarketState memory state = engine.getMarketState(marketId);
        assertEq(uint256(state.status), uint256(IPoolEngine.MarketStatus.Canceled));

        // Cannot bet on canceled market
        vm.prank(bettor1);
        vm.expectRevert("PoolEngine: market not active");
        engine.placeBet{value: 1 ether}(marketId, 0);

        // Cannot resolve canceled market (resolver check fires before status)
        vm.prank(address(oracle));
        vm.expectRevert("PoolEngine: market not active");
        engine.resolveMarket(marketId, 0, "");

        // Cannot cancel already-canceled market
        vm.prank(deployer);
        vm.expectRevert("PoolEngine: market not active");
        engine.cancelMarket(marketId);
    }

    /* ───── 15. Non-existent market revert ───── */

    function test_17_RevertNonExistentMarket() public {
        bytes32 fakeId = keccak256("does-not-exist");

        vm.expectRevert("PoolEngine: market does not exist");
        engine.placeBet{value: 1 ether}(fakeId, 0);

        vm.expectRevert("PoolEngine: market does not exist");
        engine.resolveMarket(fakeId, 0, "");

        vm.expectRevert("PoolEngine: market does not exist");
        engine.claim(fakeId);

        vm.expectRevert("PoolEngine: market does not exist");
        engine.cancelMarket(fakeId);
    }

    /* ───── 16. Factory withdraw fees ───── */

    function test_18_FactoryWithdrawFees() public {
        _createMarket();
        // Create another market for more fees
        bytes32 id2 = keccak256("market-2");
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Up";
        outcomes[1] = "Down";
        vm.prank(deployer);
        factory.createMarket{value: 0.01 ether}(id2, "test", outcomes, address(oracle), 200);

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

    /* ───── 17. Direct PoolEngine.createMarket (permissionless) ───── */

    function test_19_DirectCreateMarket() public {
        // Anyone can call PoolEngine.createMarket directly without going through Factory
        bytes32 id = keccak256("direct-poolengine");
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Head";
        outcomes[1] = "Tail";

        vm.prank(bettor1);
        engine.createMarket(id, "test", outcomes, address(oracle), 200);

        IPoolEngine.MarketState memory state = engine.getMarketState(id);
        assertEq(uint256(state.status), uint256(IPoolEngine.MarketStatus.Active));
        assertEq(state.config.resolver, address(oracle));
    }

    /* ───── 18. Resolver can't resolve wrong outcome ───── */

    function test_20_RevertResolveInvalidOutcome() public {
        _createMarket();

        vm.prank(proposer);
        oracle.propose{value: 0.1 ether}(marketId, 0, 1000, "");

        // OnlyPoolEngine checks outcome validity — resolveMarket will revert via onlyResolver
        // Actually the resolver guard will catch it since proposer is not the resolver.
        // Use direct resolve with the factory market that uses oracle as resolver:
        vm.prank(address(oracle));
        vm.expectRevert("PoolEngine: invalid outcome");
        engine.resolveMarket(marketId, 999, "");
    }

    /* ───── 19. Pool engine fee stuck — verify fee accumulates ───── */

    function test_21_FeeAccumulates() public {
        // The protocol fee (2%) stays in PoolEngine after claims
        uint256 engineBalBefore = address(engine).balance;

        _createMarket();
        _placeBets();

        vm.prank(proposer);
        oracle.propose{value: 0.1 ether}(marketId, 0, 1000, "");

        vm.warp(block.timestamp + 1001);
        vm.roll(block.number + 1001);

        vm.prank(proposer);
        oracle.executeResolution(marketId);

        // Bettor1 claims
        vm.prank(bettor1);
        engine.claim(marketId);

        // Total in: 0.01 (factory) + 4 (bets) = 4.01 ETH
        // Total out: 3.92 (payout to bettor1)
        // Fee left in engine: 4 - 3.92 = 0.08 ETH (2% of pool)
        uint256 engineBalAfter = address(engine).balance;
        assertEq(engineBalAfter - engineBalBefore, 0.08 ether);

        // accumulatedFees tracking
        assertEq(engine.accumulatedFees(), 0.08 ether);
    }

    /* ───── 20. withdrawProtocolFees ───── */

    function test_22_WithdrawProtocolFees() public {
        test_21_FeeAccumulates(); // resolve + claim, 0.08 ETH accumulated

        // Non-owner can't withdraw
        vm.prank(bettor1);
        vm.expectRevert("PoolEngine: not owner");
        engine.withdrawProtocolFees(payable(bettor1));

        // Owner withdraws
        uint256 balBefore = deployer.balance;
        uint256 engineBalBefore = address(engine).balance;

        vm.prank(deployer);
        engine.withdrawProtocolFees(payable(deployer));

        assertEq(deployer.balance - balBefore, 0.08 ether);
        assertEq(address(engine).balance, engineBalBefore - 0.08 ether);
        assertEq(engine.accumulatedFees(), 0);

        // Cannot withdraw again (no fees)
        vm.prank(deployer);
        vm.expectRevert("PoolEngine: no fees");
        engine.withdrawProtocolFees(payable(deployer));
    }

    /* ───── 21. Fee tracking across multiple markets ───── */

    function test_23_MultiMarketFees() public {
        // Market 1
        _createMarket();
        _placeBets();

        // Market 2
        bytes32 id2 = keccak256("market-2");
        string[] memory o2 = new string[](2);
        o2[0] = "Up";
        o2[1] = "Down";
        vm.prank(deployer);
        factory.createMarket{value: 0.01 ether}(id2, "test", o2, address(oracle), 300); // 3% fee

        vm.prank(bettor1);
        engine.placeBet{value: 2 ether}(id2, 0);

        // Resolve market 1 via oracle
        vm.prank(proposer);
        oracle.propose{value: 0.1 ether}(marketId, 0, 1000, "");
        vm.warp(block.timestamp + 1001);
        vm.roll(block.number + 1001);
        vm.prank(proposer);
        oracle.executeResolution(marketId);

        // Resolve market 2 via direct resolver (caller is oracle = resolver)
        vm.prank(address(oracle));
        engine.resolveMarket(id2, 0, "");

        // Claim both
        vm.prank(bettor1);
        engine.claim(marketId);

        vm.prank(bettor1);
        engine.claim(id2);

        // Market 1: 4 ETH pool, 2% fee = 0.08 ETH
        // Market 2: 2 ETH pool (single bettor), 3% fee = 0.06 ETH
        // Total accumulated: 0.14 ETH
        assertEq(engine.accumulatedFees(), 0.14 ether);

        // Withdraw all
        vm.prank(deployer);
        engine.withdrawProtocolFees(payable(deployer));
        assertEq(engine.accumulatedFees(), 0);
    }

    /* ───── 22. ParlOracle getProposal edge cases ───── */

    function test_24_ProposalEdgeCases() public {
        _createMarket();

        // Empty proposal returns default
        IParlOracle.Proposal memory p = oracle.getProposal(keccak256("no-proposal"));
        assertEq(p.proposer, address(0));
        assertFalse(p.resolved);
        assertFalse(p.disputed);

        // Propose with excess bond
        vm.prank(proposer);
        oracle.propose{value: 1 ether}(marketId, 0, 1000, ""); // 1 ETH bond

        IParlOracle.Proposal memory p2 = oracle.getProposal(marketId);
        assertEq(p2.bond, 1 ether);

        // Already proposed
        vm.prank(proposer);
        vm.expectRevert("ParlOracle: already proposed");
        oracle.propose{value: 0.1 ether}(marketId, 1, 1000, "");
    }

    /* ───── 23. Oracle: dispute before propose revert ───── */

    function test_25_DisputeWithoutProposal() public {
        vm.expectRevert("ParlOracle: no proposal");
        oracle.dispute{value: 0.1 ether}(keccak256("nothing"));
    }

    /* ───── 24. Oracle: window expired before dispute ───── */

    function test_26_DisputeAfterWindow() public {
        _createMarket();

        vm.prank(proposer);
        oracle.propose{value: 0.1 ether}(marketId, 0, 100, "");

        vm.warp(block.timestamp + 101);
        vm.roll(block.number + 101);

        vm.prank(disputer);
        vm.expectRevert("ParlOracle: window expired");
        oracle.dispute{value: 0.1 ether}(marketId);
    }

    /* ───── 25. Oracle: bond too low ───── */

    function test_27_RevertBondTooLow() public {
        _createMarket();

        vm.prank(proposer);
        vm.expectRevert("ParlOracle: bond too low");
        oracle.propose{value: 0.01 ether}(marketId, 0, 1000, "");
    }

    /* ───── 26. Factory: insufficient creation fee ───── */

    function test_28_RevertInsufficientCreationFee() public {
        string[] memory outcomes = new string[](2);
        outcomes[0] = "A";
        outcomes[1] = "B";

        vm.prank(deployer);
        vm.expectRevert(abi.encodeWithSignature("InsufficientFee(uint256,uint256)", 0.01 ether, 0.001 ether));
        factory.createMarket{value: 0.001 ether}(keccak256("no-fee"), "test", outcomes, address(oracle), 200);
    }

    /* ───── 27. Factory: setCreationFee ───── */

    function test_29_FactorySetCreationFee() public {
        // Non-owner
        vm.prank(bettor1);
        vm.expectRevert();
        factory.setCreationFee(0.02 ether);

        // Owner
        vm.prank(deployer);
        factory.setCreationFee(0.02 ether);
        assertEq(factory.creationFee(), 0.02 ether);
    }

    /* ───── Helpers ───── */

    function _createMarket() internal {
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        vm.prank(deployer);
        factory.createMarket{value: 0.01 ether}(marketId, "test", outcomes, address(oracle), 200);
    }

    function _placeBets() internal {
        vm.prank(bettor1);
        engine.placeBet{value: 1 ether}(marketId, 0);

        vm.prank(bettor2);
        engine.placeBet{value: 3 ether}(marketId, 1);
    }
}

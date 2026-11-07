// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/tokens/nyMUSD.sol";
import "../src/core/YieldRouter.sol";
import "../src/core/BoostManager.sol";
import "../src/core/GaugeVoteModule.sol";
import "../src/strategies/SMusdStrategy.sol";
import "../src/strategies/DittoStrategy.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address musd = vm.envAddress("MUSD_ADDRESS");
        address sMusd = vm.envAddress("SMUSD_VAULT_ADDRESS");
        address dMusd = vm.envAddress("DMUSD_VAULT_ADDRESS");
        address mezo = vm.envAddress("MEZO_ADDRESS");
        address veMezo = vm.envAddress("VEMEZO_ADDRESS");
        address voter = vm.envAddress("VOTER_ADDRESS");

        vm.startBroadcast(pk);

        nyMUSD receipt = new nyMUSD();
        YieldRouter router = new YieldRouter(musd, address(receipt));

        SMusdStrategy sStrat = new SMusdStrategy(musd, address(router), sMusd);
        DittoStrategy dStrat = new DittoStrategy(musd, address(router), dMusd);

        router.addStrategy(address(sStrat), type(uint256).max);
        router.addStrategy(address(dStrat), type(uint256).max);

        BoostManager boost = new BoostManager(mezo, veMezo, address(router));
        GaugeVoteModule votes = new GaugeVoteModule(veMezo, voter);

        // Grant keeper/operator roles to deployer for testnet.
        boost.setOperator(msg.sender, true);
        votes.setExecutor(msg.sender, true);

        console.log("nyMUSD:", address(receipt));
        console.log("YieldRouter:", address(router));
        console.log("SMusdStrategy:", address(sStrat));
        console.log("DittoStrategy:", address(dStrat));
        console.log("BoostManager:", address(boost));
        console.log("GaugeVoteModule:", address(votes));

        vm.stopBroadcast();
    }
}
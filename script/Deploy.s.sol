// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/StdJson.sol";
import "../src/tokens/nyMUSD.sol";
import "../src/core/YieldRouter.sol";
import "../src/core/BoostManager.sol";
import "../src/core/GaugeVoteModule.sol";
import "../src/strategies/SMusdStrategy.sol";
import "../src/strategies/DittoStrategy.sol";

contract Deploy is Script {
    using stdJson for string;

    function _loadPrivateKey() internal view returns (uint256) {
        string memory rawKey = vm.envString("PRIVATE_KEY");
        bytes memory keyBytes = bytes(rawKey);
        if (keyBytes.length >= 2 && keyBytes[0] == "0" && (keyBytes[1] == "x" || keyBytes[1] == "X")) {
            return vm.parseUint(rawKey);
        }
        return vm.parseUint(string.concat("0x", rawKey));
    }

    function run() external {
        uint256 pk = _loadPrivateKey();
        address deployer = vm.addr(pk);

        address musd = vm.envAddress("MUSD_ADDRESS");
        address sMusd = vm.envAddress("SMUSD_VAULT_ADDRESS");
        address dMusd = vm.envAddress("DMUSD_VAULT_ADDRESS");
        address mezo = vm.envAddress("MEZO_ADDRESS");
        address veMezo = vm.envAddress("VEMEZO_ADDRESS");
        address voter = vm.envAddress("VOTER_ADDRESS");

        vm.startBroadcast(pk);

        nyMUSD receipt = new nyMUSD();
        YieldRouter router = new YieldRouter(musd, address(receipt));
        receipt.setRouter(address(router));

        SMusdStrategy sStrat = new SMusdStrategy(musd, address(router), sMusd);
        DittoStrategy dStrat = new DittoStrategy(musd, address(router), dMusd);

        router.addStrategy(address(sStrat), type(uint256).max);
        router.addStrategy(address(dStrat), type(uint256).max);

        BoostManager boost = new BoostManager(mezo, veMezo, address(router));
        GaugeVoteModule votes = new GaugeVoteModule(veMezo, voter);

        // Grant keeper/operator roles to the actual deployer wallet
        boost.setOperator(deployer, true);
        votes.setExecutor(deployer, true);

        vm.stopBroadcast();

        // --- Save Deployed Addresses to JSON ---
        string memory dirPath = string.concat(vm.projectRoot(), "/deployments");
        vm.createDir(dirPath, true);

        string memory rootKey = "deployment";
        string memory json;

        json = rootKey.serialize("nyMUSD", address(receipt));
        json = rootKey.serialize("YieldRouter", address(router));
        json = rootKey.serialize("SMusdStrategy", address(sStrat));
        json = rootKey.serialize("DittoStrategy", address(dStrat));
        json = rootKey.serialize("BoostManager", address(boost));
        json = rootKey.serialize("GaugeVoteModule", address(votes));

        string memory path = string.concat(
            dirPath,
            "/deployment-",
            vm.toString(block.chainid),
            ".json"
        );

        json.write(path);

        console.log("Deployment addresses saved to:", path);
    }
}
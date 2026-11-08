// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/StdJson.sol";
import "../src/tokens/nyMUSD.sol";
import "../src/core/YieldRouter.sol";
import "../src/core/BoostManager.sol";
import "../src/core/GaugeVoteModule.sol";

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
        address mezo = vm.envAddress("MEZO_ADDRESS");
        address veMezo = vm.envAddress("VEMEZO_ADDRESS");
        address voter = vm.envAddress("VOTER_ADDRESS");

        vm.startBroadcast(pk);

        nyMUSD receipt = new nyMUSD();
        YieldRouter router = new YieldRouter(musd, address(receipt));
        receipt.setRouter(address(router));

        // NOTE: no strategies are registered for now. MUSD stays idle in the router
        // and withdrawals are paid from that balance. Add strategies later with
        // router.addStrategy(...) once each vault passes: asset() == MUSD,
        // maxDeposit() > 0, and a small test deposit.

        BoostManager boost = new BoostManager(mezo, veMezo, address(router));
        GaugeVoteModule votes = new GaugeVoteModule(veMezo, voter);

        // Grant keeper/operator roles to the deployer wallet
        boost.setOperator(deployer, true);
        votes.setExecutor(deployer, true);

        vm.stopBroadcast();

        // --- Save Combined Deployment JSON ---
        string memory dirPath = string.concat(vm.projectRoot(), "/deployments");
        vm.createDir(dirPath, true);

        string memory rootKey = "deployment";
        string memory json;

        json = rootKey.serialize("nyMUSD", address(receipt));
        json = rootKey.serialize("YieldRouter", address(router));
        json = rootKey.serialize("BoostManager", address(boost));
        json = rootKey.serialize("GaugeVoteModule", address(votes));

        string memory path = string.concat(
            dirPath,
            "/deployment-",
            vm.toString(block.chainid),
            ".json"
        );

        json.write(path);

        console.log("Combined deployment addresses saved to:", path);
    }
}
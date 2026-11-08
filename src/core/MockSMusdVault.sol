import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockSMusdVault is ERC4626 {
    constructor(IERC20 musd) ERC20("Mock sMUSD", "msMUSD") ERC4626(musd) {}
}
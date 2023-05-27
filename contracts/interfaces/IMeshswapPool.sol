pragma solidity ^0.8.0;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

interface IMeshswapPool is IUniswapV2Pair {
    event ChangeFee(uint _fee);

    function fee() external view returns (uint256);
}

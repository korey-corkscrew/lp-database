pragma solidity ^0.8.0;

interface IMeshswapFactory {
    event CreatePool(
        address token0,
        uint256 amount0,
        address token1,
        uint256 amount1,
        uint256 fee,
        address exchange,
        uint256 exid
    );
}

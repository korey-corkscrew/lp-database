pragma solidity ^0.8.0;

interface IDystopiaFactory {
    event PairCreated(
        address indexed token0,
        address indexed token1,
        bool stable,
        address pair,
        uint256 allPairsLength
    );
}

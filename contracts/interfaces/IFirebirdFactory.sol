pragma solidity ^0.8.0;

interface IFirebirdFactory {
    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        uint32 tokenWeight0,
        uint32 swapFee,
        uint256 allPairsLength
    );
}

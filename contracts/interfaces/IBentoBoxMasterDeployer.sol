pragma solidity >=0.8.0;

interface IBentoBoxMasterDeployer {
    event DeployPool(
        address indexed factory,
        address indexed pool,
        bytes deployData
    );
    event AddToWhitelist(address indexed factory);
    event RemoveFromWhitelist(address indexed factory);
    event BarFeeUpdated(uint256 indexed barFee);
}

import { ethers } from "hardhat";

export class FirebirdConstants {
    public static readonly firebirdFactoryAbi =
        require("../../../artifacts/contracts/interfaces/IFirebirdFactory.sol/IFirebirdFactory.json")
            .abi;
    public static readonly IFirebirdFactory = new ethers.utils.Interface(
        this.firebirdFactoryAbi
    );

    public static readonly poolAbi =
        require("@uniswap/v2-core/build/IUniswapV2Pair.json").abi;
    public static readonly IFireBirdPool = new ethers.utils.Interface(
        this.poolAbi
    );
    public static readonly MAX_BLOCKS_OUT_OF_SYNC = 50000;
    public static readonly factories = new Map([
        [
            137,
            {
                factory: "0x5De74546d3B86C8Df7FEEc30253865e1149818C8",
                startBlock: 15139510,
            },
        ],
    ]);

    private static readonly _CREATE_POOL_EVENT_ARCHIVE_BLOCKS_PER_CALL =
        new Map<number, number>([
            [1, 80000],
            [137, 1000000],
            [42161, 1000000],
        ]);

    public static readonly GET_RESERVES_POOLS_PER_CALL = 500;
    public static readonly FEE_POOLS_PER_CALL = 500;
    public static readonly SYNC_EVENT_ARCHIVE_BLOCKS_PER_CALL = 2000;

    public static createPoolEventArchiveBlocksPerCall(chainId: number) {
        const blocks =
            this._CREATE_POOL_EVENT_ARCHIVE_BLOCKS_PER_CALL.get(chainId);
        if (blocks) return blocks;
        return 0;
    }

    public static validFactory(address: string, chainId: number) {
        const factory = this.factories.get(chainId);
        if (factory && factory.factory == address) return true;
        return false;
    }
}

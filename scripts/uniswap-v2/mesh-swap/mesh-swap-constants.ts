import { ethers } from "hardhat";

export class MeshSwapConstants {
    public static readonly factoryAbi =
        require("../../../artifacts/contracts/interfaces/IMeshswapFactory.sol/IMeshswapFactory.json")
            .abi;
    public static readonly IMeshswapFactory = new ethers.utils.Interface(
        this.factoryAbi
    );

    public static readonly poolAbi =
        require("../../../artifacts/contracts/interfaces/IMeshswapPool.sol/IMeshswapPool.json")
            .abi;
    public static readonly IMeshswapPool = new ethers.utils.Interface(
        this.poolAbi
    );

    public static readonly factories = new Map([
        [
            137,
            {
                factory: "0x9F3044f7F9FC8bC9eD615d54845b4577B833282d",
                startBlock: 27827673,
            },
        ],
    ]);

    private static readonly _CREATE_POOL_EVENT_ARCHIVE_BLOCKS_PER_CALL =
        new Map<number, number>([
            [1, 80000],
            [137, 1000000],
            [42161, 1000000],
        ]);

    public static readonly MAX_BLOCKS_OUT_OF_SYNC = 50000;

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

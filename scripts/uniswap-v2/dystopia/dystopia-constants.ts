import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export class DystopiaConstants {
    public static readonly dystopiaFactoryAbi =
        require("../../../artifacts/contracts/interfaces/IDystopiaFactory.sol/IDystopiaFactory.json")
            .abi;
    public static readonly IDystopiaFactory = new ethers.utils.Interface(
        this.dystopiaFactoryAbi
    );

    public static readonly MAX_BLOCKS_OUT_OF_SYNC = 50000;
    public static readonly poolAbi =
        require("@uniswap/v2-core/build/IUniswapV2Pair.json").abi;
    public static readonly factories = new Map([
        [
            137,
            {
                factory: "0x1d21Db6cde1b18c7E47B0F7F42f4b3F68b9beeC9",
                router: "",
                fee: 2000,
                feeBase: BigNumber.from(10).pow(32),
                initCodeHash:
                    "0x009bce6d7eb00d3d075e5bd9851068137f44bba159f1cde806a268e20baaf2e8",
                protocol: "DYSTOPIA",
                startBlock: 27986220,
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

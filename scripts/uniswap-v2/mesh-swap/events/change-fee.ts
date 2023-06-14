import { Provider } from "../../../utils/provider";
import { ethers } from "hardhat";
import { MeshSwapConstants } from "../mesh-swap-constants";
import { PoolDatabase } from "../../../database/pool-database";
import { ProtocolIndexConstants } from "../../../protocol-index-constants";
import { EventBase, EventResult } from "../../../utils/event-base";

export class ChangeFee {
    private static readonly _eventBase = new EventBase(
        MeshSwapConstants.IMeshswapPool,
        "MeshSwapPool",
        "ChangeFee",
        ProtocolIndexConstants.MESHSWAP
    );

    public static async latestAndStore(provider: Provider) {
        await this._eventBase.latest(provider, this.handleLog);
    }

    public static async archiveAndStore(
        provider: Provider,
        startBlock: number,
        endBlock: number
    ) {
        await this._eventBase.archive(
            provider,
            startBlock,
            endBlock,
            this.handleLog,
            MeshSwapConstants.SYNC_EVENT_ARCHIVE_BLOCKS_PER_CALL
        );
    }

    public static async handleLog(result: EventResult) {
        const factory = MeshSwapConstants.factories.get(result.chainId);
        if (factory == undefined) return;
        const data = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [result.decoded._fee]
        );
        await PoolDatabase.updatePoolData(
            result.raw.address,
            result.chainId,
            data,
            factory.factory
        );
    }
}

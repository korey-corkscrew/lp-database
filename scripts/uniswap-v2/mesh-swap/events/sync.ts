import { Provider } from "../../../utils/provider";
import { MeshSwapConstants } from "../mesh-swap-constants";
import { PoolDatabase } from "../../../database/pool-database";
import { ProtocolIndexConstants } from "../../../protocol-index-constants";
import { EventBase, EventResult } from "../../../utils/event-base";

export class Sync {
    private static readonly _eventBase = new EventBase(
        MeshSwapConstants.IMeshswapPool,
        "MeshSwapPool",
        "Sync",
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
        await PoolDatabase.updatePoolReserves(
            result.raw.address,
            result.chainId,
            result.decoded.reserve0,
            result.decoded.reserve1,
            result.raw.blockNumber,
            factory.factory
        );
    }
}

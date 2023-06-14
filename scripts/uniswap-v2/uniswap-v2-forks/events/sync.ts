import { Provider } from "../../../utils/provider";
import { PoolDatabase } from "../../../database/pool-database";
import { ProtocolIndexConstants } from "../../../protocol-index-constants";
import { EventBase, EventResult } from "../../../utils/event-base";
import { UniswapV2ForksConstants } from "../uniswap-v2-forks-constants";

export class Sync {
    private static readonly _eventBase = new EventBase(
        UniswapV2ForksConstants.IUniswapV2Pair,
        "UniswapV2Pair",
        "Sync",
        ProtocolIndexConstants.UNISWAP_V2
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
            UniswapV2ForksConstants.SYNC_EVENT_ARCHIVE_BLOCKS_PER_CALL
        );
    }

    public static async handleLog(result: EventResult) {
        await PoolDatabase.updatePoolReserves(
            result.raw.address,
            result.chainId,
            result.decoded.reserve0,
            result.decoded.reserve1,
            result.raw.blockNumber
        );
    }
}

import { Provider } from "../../../utils/provider";
import { PoolDatabase } from "../../../database/pool-database";
import { ProtocolIndexConstants } from "../../../protocol-index-constants";
import { EventBase, EventResult } from "../../../utils/event-base";
import { UniswapV2ForksConstants } from "../uniswap-v2-forks-constants";

export class PairCreated {
    private static readonly _eventBase = new EventBase(
        UniswapV2ForksConstants.IUniswapV2Factory,
        "UniswapV2Factory",
        "PairCreated",
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
            UniswapV2ForksConstants.createPairEventArchiveBlocksPerCall(
                provider.chainId()
            )
        );
    }

    public static async handleLog(result: EventResult) {
        if (
            UniswapV2ForksConstants.validFactory(
                result.raw.address,
                result.chainId
            )
        ) {
            await PoolDatabase.setPool(
                result.decoded.pair,
                result.decoded.token0,
                result.decoded.token1,
                result.raw.address,
                result.chainId,
                "0x",
                result.raw.blockNumber,
                this._eventBase.protocolIndex
            );
        }
    }
}

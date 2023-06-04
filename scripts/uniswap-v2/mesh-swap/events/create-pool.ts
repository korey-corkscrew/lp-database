import { Provider } from "../../../utils/provider";
import { ethers } from "hardhat";
import { MeshSwapConstants } from "../mesh-swap-constants";
import { PoolDatabase } from "../../../database/pool-database";
import { ProtocolIndexConstants } from "../../../protocol-index-constants";
import { EventBase, EventResult } from "../../../utils/event-base";

export class CreatePool {
    private static readonly _eventBase = new EventBase(
        MeshSwapConstants.IMeshswapFactory,
        "MeshSwapFactory",
        "CreatePool",
        ProtocolIndexConstants.MESHSWAP
    );

    public static async latestAndStore(provider: Provider) {
        const factory = MeshSwapConstants.factories.get(provider.chainId());
        if (factory == undefined) return;
        await this._eventBase.latest(provider, this.handleLog, factory.factory);
    }

    public static async archiveAndStore(
        provider: Provider,
        startBlock: number,
        endBlock: number
    ) {
        const factory = MeshSwapConstants.factories.get(provider.chainId());
        if (factory == undefined) return;
        await this._eventBase.archive(
            provider,
            startBlock,
            endBlock,
            this.handleLog,
            MeshSwapConstants.createPoolEventArchiveBlocksPerCall(
                provider.chainId()
            ),
            factory.factory
        );
    }

    public static async handleLog(result: EventResult) {
        const data = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [result.decoded.fee]
        );
        await PoolDatabase.setPool(
            result.decoded.exchange,
            result.decoded.token0,
            result.decoded.token1,
            result.decoded.address,
            result.chainId,
            data,
            result.raw.blockNumber,
            this._eventBase.protocolIndex
        );
    }
}

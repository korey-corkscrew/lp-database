import { Provider } from "../../../utils/provider";
import { ethers } from "hardhat";
import { PoolDatabase } from "../../../database/pool-database";
import { ProtocolIndexConstants } from "../../../protocol-index-constants";
import { EventBase, EventResult } from "../../../utils/event-base";
import { FirebirdConstants } from "../firebird-constants";

export class PairCreated {
    private static readonly _eventBase = new EventBase(
        FirebirdConstants.IFirebirdFactory,
        "FirebirdFactory",
        "PairCreated",
        ProtocolIndexConstants.FIREBIRD
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
            FirebirdConstants.createPoolEventArchiveBlocksPerCall(
                provider.chainId()
            )
        );
    }

    public static async handleLog(result: EventResult) {
        if (
            FirebirdConstants.validFactory(result.raw.address, result.chainId)
        ) {
            const data = ethers.utils.defaultAbiCoder.encode(
                ["uint256", "uint256"],
                [result.decoded.tokenWeight0, result.decoded.swapFee]
            );
            await PoolDatabase.setPool(
                result.decoded.pair,
                result.decoded.token0,
                result.decoded.token1,
                result.raw.address,
                result.chainId,
                data,
                result.raw.blockNumber,
                this._eventBase.protocolIndex
            );
        }
    }
}

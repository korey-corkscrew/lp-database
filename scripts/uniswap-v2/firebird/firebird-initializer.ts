import invariant from "tiny-invariant";
import { PoolDatabase } from "../../database/pool-database";
import { ProtocolDatabase } from "../../database/protocol";
import { ProtocolIndexConstants } from "../../protocol-index-constants";
import { Provider } from "../../utils/provider";
import { GetReserves } from "./calls/get-reserves";
import { PairCreated } from "./events/pair-created";
import { FirebirdConstants } from "./firebird-constants";

export class FirebirdInitializer {
    public static readonly index = ProtocolIndexConstants.FIREBIRD;
    public static async initialize(provider: Provider) {
        const chainId = provider.chainId();
        const factory = FirebirdConstants.factories.get(chainId);
        if (factory == undefined) return 0;

        let protocol = await ProtocolDatabase.getProtocol(chainId, this.index);

        const endBlock = provider.block();
        if (
            protocol == null ||
            !protocol.initialized ||
            provider.block() - protocol.latestUpdateBlocks[0] >
                FirebirdConstants.MAX_BLOCKS_OUT_OF_SYNC
        ) {
            if (protocol == null) {
                await ProtocolDatabase.setProtocol(chainId, this.index, 1);
            }
            if (protocol == null || !protocol.initialized) {
                await PairCreated.archiveAndStore(
                    provider,
                    factory.startBlock,
                    endBlock
                );
            }
            const addresses = await PoolDatabase.getAllPoolAddresses(
                chainId,
                factory.factory
            );

            await GetReserves.callAndStore(provider, addresses);
            await ProtocolDatabase.updateProtocol(
                chainId,
                this.index,
                endBlock,
                0,
                true
            );

            protocol = await ProtocolDatabase.getProtocol(chainId, this.index);
        }
        invariant(protocol, `protocol db error`);
        await PairCreated.archiveAndStore(
            provider,
            protocol.latestUpdateBlocks[0],
            provider.block()
        );

        await PairCreated.latestAndStore(provider);

        return protocol.latestUpdateBlocks[0];
    }

    public static async handleBlock(block: number, chainId: number) {
        await ProtocolDatabase.updateProtocol(chainId, this.index, block, 0);
    }
}

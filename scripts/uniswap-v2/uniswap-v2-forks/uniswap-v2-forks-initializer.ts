import invariant from "tiny-invariant";
import { PoolDatabase } from "../../database/pool-database";
import { IProtocol, ProtocolDatabase } from "../../database/protocol";
import { ProtocolIndexConstants } from "../../protocol-index-constants";
import { Provider } from "../../utils/provider";
import { GetReserves } from "./calls/get-reserves";
import { PairCreated } from "./events/pair-created";
import {
    UniswapV2Factory,
    UniswapV2ForksConstants,
} from "./uniswap-v2-forks-constants";
import { ChainDatabase } from "../../database/chain";

export class UniswapV2ForksInitializer {
    private static readonly index = ProtocolIndexConstants.UNISWAP_V2;

    public static async initialize(provider: Provider): Promise<number[]> {
        const chainId = provider.chainId();
        const factories = UniswapV2ForksConstants.factoriesByChain(chainId);
        const blocks = new Array<number>();
        for (const factory of factories) {
            blocks.push(await this._initialize(provider, factory));
        }
        return blocks;
    }

    private static async _initialize(
        provider: Provider,
        factory: UniswapV2Factory
    ): Promise<number> {
        const chainId = provider.chainId();
        const protocol = await ProtocolDatabase.getProtocol(
            chainId,
            this.index,
            factory.factory
        );
        let latestBlock = await ChainDatabase.getChainBlock(chainId);
        const endBlock = provider.block();

        if (
            protocol == null ||
            !protocol.initialized ||
            provider.block() - latestBlock >
                UniswapV2ForksConstants.MAX_BLOCKS_OUT_OF_SYNC
        ) {
            if (protocol == null || !protocol.initialized) {
                await PairCreated.archiveAndStore(
                    provider,
                    factory.startBlock,
                    endBlock
                );
            }

            if (protocol == null) {
                await ProtocolDatabase.setProtocol(
                    chainId,
                    this.index,
                    factory.factory
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
                true,
                factory.factory
            );

            latestBlock = endBlock;
        }
        await PairCreated.archiveAndStore(provider, endBlock, provider.block());

        await PairCreated.latestAndStore(provider);

        return latestBlock;
    }
}

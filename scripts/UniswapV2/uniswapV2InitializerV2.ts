import { PoolDatabase } from "../Database/poolDatabase";
import { Provider } from "../provider";
import { FirebirdInitializer } from "./Firebird/firebird-initializer";
import { MeshSwapInitializer } from "./mesh-swap/mesh-swap-initializer";
import { UniswapV2Constants } from "./uniswapV2Constants";
import { UniswapV2EventListener } from "./uniswapV2Listener";

export class UniswapV2InitializerV2 {
    public static async initialize(provider: Provider) {
        const startBlock = provider.block();
        await MeshSwapInitializer.initialize(provider);
        await FirebirdInitializer.initialize(provider);
        await this._initialize(provider);
        await UniswapV2EventListener.syncArchiveAndStore(
            provider,
            startBlock,
            provider.block(),
            UniswapV2Constants.SYNC_EVENT_ARCHIVE_BLOCKS_PER_CALL
        );
        await UniswapV2EventListener.syncAndStore(provider);
    }

    private static async _initialize(provider: Provider) {
        const chainId = provider.chainId();
        const factories = UniswapV2Constants.factoriesByChain(chainId);
        for (const factory of factories) {
            const pools = await PoolDatabase.poolData
                .find({
                    chainId: chainId,
                    factory: factory.factory,
                })
                .sort({ blockUpdated: -1 });

            let latestBlock = 0;

            if (pools.length > 0) {
                latestBlock = pools[0].blockUpdated;
            }

            if (latestBlock == 0) {
                const endBlock = provider.block();
                await UniswapV2EventListener.createPairArchiveAndStore(
                    provider,
                    factory.startBlock,
                    endBlock,
                    UniswapV2Constants.createPairEventArchiveBlocksPerCall(
                        chainId
                    ),
                    factory.factory
                );

                const addresses = (
                    await PoolDatabase.poolData.find({
                        chainId: chainId,
                        factory: factory.factory,
                    })
                ).map((pool) => {
                    return pool.pool;
                });

                await UniswapV2EventListener.getReservesAndStore(
                    provider,
                    addresses,
                    UniswapV2Constants.GET_RESERVES_POOLS_PER_CALL
                );

                await UniswapV2EventListener.createPairArchiveAndStore(
                    provider,
                    endBlock + 1,
                    provider.block(),
                    UniswapV2Constants.createPairEventArchiveBlocksPerCall(
                        chainId
                    ),
                    factory.factory
                );

                await UniswapV2EventListener.createPairAndStore(
                    provider,
                    factory.factory
                );
            } else {
                await UniswapV2EventListener.createPairArchiveAndStore(
                    provider,
                    latestBlock,
                    provider.block(),
                    UniswapV2Constants.createPairEventArchiveBlocksPerCall(
                        chainId
                    ),
                    factory.factory
                );

                await UniswapV2EventListener.createPairAndStore(
                    provider,
                    factory.factory
                );
            }
        }
    }
}

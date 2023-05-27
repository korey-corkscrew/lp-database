import { PoolDatabase } from "../../Database/poolDatabase";
import { Provider } from "../../provider";
import { Fee } from "./calls/fee";
import { GetReserves } from "./calls/get-reserves";
import { MeshSwapPool } from "./db/pool";
import { ChangeFee } from "./events/change-fee";
import { CreatePool } from "./events/create-pool";
import { Sync } from "./events/sync";
import { MeshSwapConstants } from "./mesh-swap-constants";

export class MeshSwapInitializer {
    public static async initialize(provider: Provider) {
        const chainId = provider.chainId();
        const factory = MeshSwapConstants.factories.get(chainId);
        if (factory == undefined) return;

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
            await CreatePool.archiveAndStore(
                provider,
                factory.startBlock,
                endBlock
            );

            const addresses = (
                await PoolDatabase.poolData.find({
                    chainId: chainId,
                    factory: factory.factory,
                })
            ).map((pool) => {
                return pool.pool;
            });

            await GetReserves.callAndStore(
                provider,
                addresses,
                MeshSwapConstants.GET_RESERVES_POOLS_PER_CALL
            );

            await Fee.callAndStore(
                provider,
                addresses,
                MeshSwapConstants.FEE_POOLS_PER_CALL
            );

            await CreatePool.archiveAndStore(
                provider,
                endBlock + 1,
                provider.block()
            );

            await CreatePool.latestAndStore(provider);

            await Sync.archiveAndStore(provider, endBlock, provider.block());

            await Sync.latestAndStore(provider);

            await ChangeFee.archiveAndStore(
                provider,
                endBlock,
                provider.block(),
                MeshSwapConstants.SYNC_EVENT_ARCHIVE_BLOCKS_PER_CALL
            );

            await ChangeFee.latestAndStore(provider);
        } else {
            await CreatePool.archiveAndStore(
                provider,
                latestBlock,
                provider.block()
            );

            await CreatePool.latestAndStore(provider);

            await Sync.archiveAndStore(provider, latestBlock, provider.block());
            await Sync.latestAndStore(provider);

            await ChangeFee.archiveAndStore(
                provider,
                latestBlock,
                provider.block(),
                MeshSwapConstants.SYNC_EVENT_ARCHIVE_BLOCKS_PER_CALL
            );
            await ChangeFee.latestAndStore(provider);
        }
    }
}

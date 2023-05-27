import { PoolDatabase } from "../../Database/poolDatabase";
import { Provider } from "../../provider";
import { GetReserves } from "./calls/get-reserves";
import { FirebirdConstants } from "./firebirdConstants";
import { FirebirdEventListener } from "./firebirdListener";

export class FirebirdInitializer {
    public static async initialize(provider: Provider) {
        const chainId = provider.chainId();
        const factory = FirebirdConstants.factories.get(chainId);
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
            await FirebirdEventListener.createPairArchiveAndStore(
                provider,
                factory.startBlock,
                endBlock,
                FirebirdConstants.createPoolEventArchiveBlocksPerCall(chainId)
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
                FirebirdConstants.GET_RESERVES_POOLS_PER_CALL
            );

            await FirebirdEventListener.createPairArchiveAndStore(
                provider,
                endBlock + 1,
                provider.block(),
                FirebirdConstants.createPoolEventArchiveBlocksPerCall(chainId)
            );

            await FirebirdEventListener.createPairAndStore(provider);
        } else {
            await FirebirdEventListener.createPairArchiveAndStore(
                provider,
                latestBlock,
                provider.block(),
                FirebirdConstants.createPoolEventArchiveBlocksPerCall(chainId)
            );

            await FirebirdEventListener.createPairAndStore(provider);
        }
    }
}

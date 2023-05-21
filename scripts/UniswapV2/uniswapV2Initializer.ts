import { UniswapV2EventListener } from "../UniswapV2/uniswapV2Listener";
import { UniswapV2Constants } from "./uniswapV2Constants";
import { TokenDatabase } from "../tokenDatabase";
import { DystopiaEventListener } from "./Dystopia/dystopiaListener";
import { FirebirdEventListener } from "./Firebird/firebirdListener";
import { Provider } from "../provider";

export class UniswapV2Initializer {
    public static async initialize(provider: Provider, db: TokenDatabase) {
        const chainId = provider.chainId();
        let lastCreatedBlock = await db.getLastCreatedPoolBlock(chainId);
        let initial = false;

        // Database not yet initialized
        if (lastCreatedBlock == 0) {
            initial = true;
            const endBlock = provider.block();
            const startBlock =
                UniswapV2Constants.getFirstCreatedFactoryBlock(chainId);

            // Get archive CreatePair event logs and store in db
            await UniswapV2EventListener.createPairArchiveAndStore(
                provider,
                db,
                startBlock,
                endBlock,
                UniswapV2Constants.createPairEventArchiveBlocksPerCall(chainId)
            );

            // ---------------------------------------------------------- //
            // Add any protocols that share the same Sync events and      //
            // getReserves() function but do not have the same CreatePair //
            // event.                                                     //
            // ---------------------------------------------------------- //

            // Dystopia
            await DystopiaEventListener.createPairArchiveAndStore(
                provider,
                db,
                0,
                endBlock,
                UniswapV2Constants.createPairEventArchiveBlocksPerCall(chainId)
            );

            // Firebird
            await FirebirdEventListener.createPairArchiveAndStore(
                provider,
                db,
                0,
                endBlock,
                UniswapV2Constants.createPairEventArchiveBlocksPerCall(chainId)
            );

            // Get all pool addresses
            const pools = await db.getAllPoolAddresses(chainId);

            // Get reserves for all pools and update db
            await UniswapV2EventListener.getReservesAndStore(
                provider,
                db,
                pools,
                UniswapV2Constants.GET_RESERVES_POOLS_PER_CALL
            );

            lastCreatedBlock = await db.getLastCreatedPoolBlock(chainId);
        }

        const lastUpdatedBlock = await db.getLastUpdatedPoolBlock(chainId);

        // Get any pools that were created while the reserves were updating
        // Uniswap V2
        await UniswapV2EventListener.createPairArchiveAndStore(
            provider,
            db,
            lastCreatedBlock + 1,
            provider.block(),
            UniswapV2Constants.createPairEventArchiveBlocksPerCall(chainId)
        );

        // ---------------------------------------------------------- //
        // Add any protocols that share the same Sync events and      //
        // getReserves() function but do not have the same CreatePair //
        // event.                                                     //
        // ---------------------------------------------------------- //

        // Dystopia
        await DystopiaEventListener.createPairArchiveAndStore(
            provider,
            db,
            lastCreatedBlock + 1,
            provider.block(),
            UniswapV2Constants.createPairEventArchiveBlocksPerCall(chainId)
        );

        // Firebird
        await FirebirdEventListener.createPairArchiveAndStore(
            provider,
            db,
            lastCreatedBlock + 1,
            provider.block(),
            UniswapV2Constants.createPairEventArchiveBlocksPerCall(chainId)
        );

        // Listen for new pools
        await UniswapV2EventListener.createPairAndStore(provider, db);

        // ---------------------------------------------------------- //
        // Add any protocols that share the same Sync events and      //
        // getReserves() function but do not have the same CreatePair //
        // event.                                                     //
        // ---------------------------------------------------------- //
        await DystopiaEventListener.createPairAndStore(provider, db);
        await FirebirdEventListener.createPairAndStore(provider, db);

        // Get Sync logs that were emitted while the reserves were updating
        await UniswapV2EventListener.syncArchiveAndStore(
            provider,
            db,
            initial ? lastCreatedBlock : lastUpdatedBlock,
            provider.block(),
            UniswapV2Constants.SYNC_EVENT_ARCHIVE_BLOCKS_PER_CALL
        );

        // Listen for pool reserve updates
        await UniswapV2EventListener.syncAndStore(provider, db);
    }
}

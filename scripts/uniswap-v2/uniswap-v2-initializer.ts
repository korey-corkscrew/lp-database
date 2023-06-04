import { Provider } from "../utils/provider";
import { DystopiaInitializer } from "./dystopia/dystopia-initializer";
import { FirebirdInitializer } from "./firebird/firebird-initializer";
import { MeshSwapInitializer } from "./mesh-swap/mesh-swap-initializer";
import { Sync } from "./uniswap-v2-forks/events/sync";
import { UniswapV2ForksInitializer } from "./uniswap-v2-forks/uniswap-v2-forks-initializer";

export class UniswapV2Initializer {
    public static async initialize(provider: Provider) {
        const startBlock = Math.min(
            await DystopiaInitializer.initialize(provider),
            await MeshSwapInitializer.initialize(provider),
            await FirebirdInitializer.initialize(provider),
            ...(await UniswapV2ForksInitializer.initialize(provider))
        );

        await Sync.archiveAndStore(provider, startBlock, provider.block());
        await Sync.latestAndStore(provider);

        await provider.sync();
    }
}

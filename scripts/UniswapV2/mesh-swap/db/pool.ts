import { IPoolData, PoolDatabase } from "../../../Database/poolDatabase";
import { MeshSwapConstants } from "../mesh-swap-constants";

export class MeshSwapPool {
    public static async getAllPoolsByChain(
        chainId: number
    ): Promise<IPoolData[]> {
        const factory = MeshSwapConstants.factories.get(chainId);
        if (factory == undefined) return [];
        return await PoolDatabase.poolData.find({
            chainId: chainId,
            factory: factory.factory,
        });
    }

    public static async getLatestPoolUpdateBlock(
        chainId: number
    ): Promise<number> {
        const factory = MeshSwapConstants.factories.get(chainId);
        if (factory == undefined) return 0;
        const pools = await PoolDatabase.poolData
            .find({
                chainId: chainId,
                factory: factory.factory,
            })
            .sort({ blockUpdated: -1 });
        if (pools.length == 0) return 0;
        return pools[0].blockUpdated;
    }
}

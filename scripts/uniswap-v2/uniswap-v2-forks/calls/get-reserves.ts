import { PoolDatabase } from "../../../database/pool-database";
import { Provider } from "../../../utils/provider";
import { CallBase, Result } from "../../../utils/call-base";
import { UniswapV2ForksConstants } from "../uniswap-v2-forks-constants";

export class GetReserves {
    private static readonly _callBase = new CallBase(
        "UniswapV2Pair",
        "getReserves()",
        UniswapV2ForksConstants.uniswapV2PairAbi
    );

    public static async callAndStore(provider: Provider, pools: string[]) {
        const poolsPerCall =
            UniswapV2ForksConstants.GET_RESERVES_POOLS_PER_CALL;
        const calls = pools.map((pool) => {
            const contract = this._callBase.getContract(pool);
            return contract.getReserves();
        });
        await this._callBase.call(
            provider,
            calls,
            poolsPerCall,
            this.handleCall
        );
    }

    public static async handleCall(result: Result) {
        await PoolDatabase.updatePoolReserves(
            result.call.contract.address,
            result.chainId,
            result.result.reserve0,
            result.result.reserve1,
            result.block
        );
    }
}

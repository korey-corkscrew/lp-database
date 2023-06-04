import { PoolDatabase } from "../../../database/pool-database";
import { Provider } from "../../../utils/provider";
import { CallBase, Result } from "../../../utils/call-base";
import { DystopiaConstants } from "../dystopia-constants";

export class GetReserves {
    private static readonly _callBase = new CallBase(
        "DystopiaPool",
        "getReserves()",
        DystopiaConstants.poolAbi
    );

    public static async callAndStore(provider: Provider, pools: string[]) {
        const poolsPerCall = DystopiaConstants.GET_RESERVES_POOLS_PER_CALL;
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

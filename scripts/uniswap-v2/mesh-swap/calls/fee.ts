import { Provider } from "../../../utils/provider";
import { PoolDatabase } from "../../../database/pool-database";
import { MeshSwapConstants } from "../mesh-swap-constants";
import { ethers } from "hardhat";
import { CallBase, Result } from "../../../utils/call-base";

export class Fee {
    private static readonly _callBase = new CallBase(
        "MeshSwapPool",
        "fee()",
        MeshSwapConstants.poolAbi
    );

    public static async callAndStore(provider: Provider, pools: string[]) {
        const poolsPerCall = MeshSwapConstants.FEE_POOLS_PER_CALL;
        const calls = pools.map((pool) => {
            const contract = this._callBase.getContract(pool);
            return contract.fee();
        });
        await this._callBase.call(
            provider,
            calls,
            poolsPerCall,
            this.handleCall
        );
    }

    public static async handleCall(result: Result) {
        const data = ethers.utils.defaultAbiCoder.encode(
            ["uint256"],
            [result.result]
        );
        await PoolDatabase.updatePoolData(
            result.call.contract.address,
            result.chainId,
            data
        );
    }
}

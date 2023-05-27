import chalk from "chalk";
import { Contract, Provider as MulicallProvider } from "ethers-multicall";
import { Provider } from "../../../provider";
import { PoolDatabase } from "../../../Database/poolDatabase";
import { BigNumber } from "ethers";
import { MeshSwapConstants } from "../../mesh-swap/mesh-swap-constants";

interface Reserves {
    pool: string;
    reserve0: BigNumber;
    reserve1: BigNumber;
}

export class GetReserves {
    public static async callAndStore(
        provider: Provider,
        pools: string[],
        poolsPerCall: number
    ) {
        const chainId = provider.chainId();
        for (let i = 0; i < pools.length; i += poolsPerCall) {
            let block = provider.block();
            let end = i + poolsPerCall;
            if (end >= pools.length) end = pools.length;
            let reserves = await this._call(provider, pools.slice(i, end));

            console.log(
                `Chain ID: ${chalk.cyan(
                    `[ ${chainId} ]`
                )} | Retrieving reserves for Mesh Swap pools ${chalk.green(
                    `[ ${i} - ${end} ]`
                )} / ${chalk.gray(`[ ${pools.length} ]`)}`
            );
            for (const reserve of reserves) {
                await PoolDatabase.updatePoolReserves(
                    reserve.pool,
                    chainId,
                    reserve.reserve0,
                    reserve.reserve1,
                    block
                );
            }
        }
    }

    private static async _call(
        provider: Provider,
        pools: string[]
    ): Promise<Reserves[]> {
        const multicallProvider = new MulicallProvider(provider.provider());
        await multicallProvider.init();
        const calls = pools.map((pool) => {
            const contract = new Contract(pool, MeshSwapConstants.poolAbi);
            return contract.getReserves();
        });

        let success = false;
        let reserves: Reserves[] = [];

        do {
            try {
                const _reserves = await multicallProvider.all(calls);
                reserves = _reserves.map((reserve, i) => {
                    return {
                        pool: pools[i],
                        reserve0: reserve.reserve0,
                        reserve1: reserve.reserve1,
                    };
                });
                success = true;
            } catch {
                setTimeout(() => {
                    console.log(
                        `MeshSwapPool.getReserves() call ${chalk.red(
                            "failed"
                        )}. Retrying in 1s.`
                    );
                }, 1000);
            }
        } while (!success);
        return reserves;
    }
}

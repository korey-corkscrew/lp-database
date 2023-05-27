import chalk from "chalk";
import { Contract, Provider as MulicallProvider } from "ethers-multicall";
import { Provider } from "../../../provider";
import { PoolDatabase } from "../../../Database/poolDatabase";
import { BigNumber } from "ethers";
import { MeshSwapConstants } from "../mesh-swap-constants";
import { ethers } from "hardhat";

interface Fees {
    pool: string;
    fee: BigNumber;
}

export class Fee {
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
            let fees = await this._call(provider, pools.slice(i, end));

            console.log(
                `Chain ID: ${chalk.cyan(
                    `[ ${chainId} ]`
                )} | Retrieving fee for Mesh Swap pools ${chalk.green(
                    `[ ${i} - ${end} ]`
                )} / ${chalk.gray(`[ ${pools.length} ]`)}`
            );
            for (const fee of fees) {
                const data = ethers.utils.defaultAbiCoder.encode(
                    ["uint256"],
                    [fee.fee]
                );
                await PoolDatabase.updatePoolData(fee.pool, chainId, data);
            }
        }
    }

    private static async _call(
        provider: Provider,
        pools: string[]
    ): Promise<Fees[]> {
        const multicallProvider = new MulicallProvider(provider.provider());
        await multicallProvider.init();
        const calls = pools.map((pool) => {
            const contract = new Contract(pool, MeshSwapConstants.poolAbi);
            return contract.fee();
        });

        let success = false;
        let fees: Fees[] = [];

        do {
            try {
                const _fees = await multicallProvider.all(calls);
                fees = _fees.map((fee, i) => {
                    return {
                        pool: pools[i],
                        fee: fee,
                    };
                });
                success = true;
            } catch {
                setTimeout(() => {
                    console.log(
                        `MeshSwapPool.fee() call ${chalk.red(
                            "failed"
                        )}. Retrying in 1s.`
                    );
                }, 1000);
            }
        } while (!success);
        return fees;
    }
}

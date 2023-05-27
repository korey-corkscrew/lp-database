import { ethers } from "hardhat";
import { Provider } from "../../../provider";
import { MeshSwapConstants } from "../mesh-swap-constants";
import chalk from "chalk";
import { PoolDatabase } from "../../../Database/poolDatabase";

export class ChangeFee {
    private static readonly _interface = MeshSwapConstants.IMeshswapPool;
    private static readonly _event = "ChangeFee";
    private static readonly _contractName = "MeshSwapPool";

    public static async latestAndStore(provider: Provider) {
        const chainId = provider.chainId();
        const factory = MeshSwapConstants.factories.get(chainId);
        if (factory == undefined) return;

        console.log(
            `Chain ID: ${chalk.cyan(
                `[ ${chainId} ]`
            )} | Listening for ${chalk.yellow(
                `[ ${this._contractName}.${this._event} ]`
            )} logs`
        );

        provider.provider().on(
            {
                topics: [
                    ethers.utils.id(
                        this._interface.getEvent(this._event).format()
                    ),
                ],
            },
            async (log) => {
                try {
                    const decodedLog = this._interface.decodeEventLog(
                        this._event,
                        log.data,
                        log.topics
                    );

                    const pool = await PoolDatabase.getPoolByAddress(
                        log.address,
                        chainId
                    );

                    if (pool && pool.factory == factory.factory) {
                        const data = ethers.utils.defaultAbiCoder.encode(
                            ["uint256"],
                            [decodedLog._fee]
                        );
                        await PoolDatabase.updatePoolData(
                            log.address,
                            chainId,
                            data
                        );
                    }
                } catch {}
            }
        );
    }

    public static async archiveAndStore(
        provider: Provider,
        startBlock: number,
        endBlock: number,
        step: number
    ) {
        const chainId = provider.chainId();
        for (let i = startBlock; i <= endBlock; i += step) {
            let end = i + step - 1;
            const block = provider.block();
            end = end > block ? block : end;
            const logs = await this._archive(provider, chainId, i, end);

            console.log(
                `Chain ID: ${chalk.cyan(
                    `[ ${chainId} ]`
                )} | Retrieving ${chalk.yellow(
                    "[ MeshSwapPool.ChangeFee ]"
                )} logs | Block range ${chalk.green(
                    `[ ${i} - ${block} ]`
                )} | # of logs ${chalk.gray(`[ ${logs.length} ]`)}`
            );

            for (const log of logs) {
                const data = ethers.utils.defaultAbiCoder.encode(
                    ["uint256"],
                    [log.fee]
                );
                await PoolDatabase.updatePoolData(log.pool, chainId, data);
            }
        }
    }

    private static async _archive(
        provider: Provider,
        chainId: number,
        startBlock: number,
        endBlock?: number
    ) {
        const logs = await provider.provider().getLogs({
            fromBlock: startBlock,
            toBlock: endBlock,
            topics: [
                ethers.utils.id(
                    MeshSwapConstants.IMeshswapPool.getEvent(
                        "ChangeFee"
                    ).format()
                ),
            ],
        });
        const decodedLogs = logs.map((log) => {
            const decodedLog = MeshSwapConstants.IMeshswapPool.decodeEventLog(
                "ChangeFee",
                log.data,
                log.topics
            );
            return {
                pool: log.address,
                fee: decodedLog._fee,
                blockUpdated: log.blockNumber,
                chainId: chainId,
            };
        });
        return decodedLogs;
    }
}

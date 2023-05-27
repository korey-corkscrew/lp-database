import { ethers } from "hardhat";
import { Provider } from "../../../provider";
import { MeshSwapConstants } from "../mesh-swap-constants";
import chalk from "chalk";
import { PoolDatabase } from "../../../Database/poolDatabase";

export class Sync {
    public static async latestAndStore(provider: Provider) {
        const chainId = provider.chainId();
        const factory = MeshSwapConstants.factories.get(chainId);
        if (factory == undefined) return;

        console.log(
            `Chain ID: ${chalk.cyan(
                `[ ${chainId} ]`
            )} | Listening for ${chalk.yellow("[ MeshSwapPool.Sync ]")} logs`
        );

        provider.provider().on(
            {
                topics: [
                    ethers.utils.id(
                        MeshSwapConstants.IMeshswapPool.getEvent(
                            "Sync"
                        ).format()
                    ),
                ],
            },
            async (log) => {
                try {
                    const decodedLog =
                        MeshSwapConstants.IMeshswapPool.decodeEventLog(
                            "Sync",
                            log.data,
                            log.topics
                        );

                    const pool = await PoolDatabase.getPoolByAddress(
                        log.address,
                        chainId
                    );

                    if (pool && pool.factory == factory.factory) {
                        await PoolDatabase.updatePoolReserves(
                            log.address,
                            chainId,
                            decodedLog.reserve0,
                            decodedLog.reserve1,
                            log.blockNumber
                        );
                    }
                } catch {}
            }
        );
    }

    public static async archiveAndStore(
        provider: Provider,
        startBlock: number,
        endBlock: number
    ) {
        const step = MeshSwapConstants.SYNC_EVENT_ARCHIVE_BLOCKS_PER_CALL;
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
                    "[ MeshSwapPool.Sync ]"
                )} logs | Block range ${chalk.green(
                    `[ ${i} - ${end} ]`
                )} | # of logs ${chalk.gray(`[ ${logs.length} ]`)}`
            );

            for (const log of logs) {
                await PoolDatabase.updatePoolReserves(
                    log.pool,
                    chainId,
                    log.reserve0,
                    log.reserve1,
                    log.blockUpdated
                );
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
                    MeshSwapConstants.IMeshswapPool.getEvent("Sync").format()
                ),
            ],
        });
        const decodedLogs = logs.map((log) => {
            const decodedLog = MeshSwapConstants.IMeshswapPool.decodeEventLog(
                "Sync",
                log.data,
                log.topics
            );
            return {
                pool: log.address,
                reserve0: decodedLog.reserve0,
                reserve1: decodedLog.reserve1,
                blockUpdated: log.blockNumber,
                chainId: chainId,
            };
        });
        return decodedLogs;
    }
}

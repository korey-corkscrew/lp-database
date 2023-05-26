import { ethers } from "hardhat";
import chalk from "chalk";
import { Provider } from "../../../provider";
import { BentoBoxConstants } from "../bentoBoxConstants";
import { PoolDatabase } from "../../../Database/poolDatabase";

export class Sync {
    public static async syncAndStore(provider: Provider) {
        const chainId = provider.chainId();

        console.log(
            `Chain ID: ${chalk.cyan(
                `[ ${chainId} ]`
            )} | Listening for ${chalk.yellow("[ BentoBoxPool.Sync ]")} logs`
        );

        provider.provider().on(
            {
                topics: [
                    ethers.utils.id(
                        BentoBoxConstants.IBentoBoxPool.getEvent(
                            "Sync"
                        ).format()
                    ),
                ],
            },
            async (log) => {
                try {
                    const decodedLog =
                        BentoBoxConstants.IBentoBoxPool.decodeEventLog(
                            "Sync",
                            log.data,
                            log.topics
                        );

                    await PoolDatabase.updatePoolReserves(
                        log.address,
                        chainId,
                        decodedLog.reserve0,
                        decodedLog.reserve1,
                        log.blockNumber
                    );
                } catch {}
            }
        );
    }

    public static async syncArchiveAndStore(
        provider: Provider,
        startBlock: number,
        endBlock: number,
        step: number
    ) {
        const chainId = provider.chainId();
        for (let i = startBlock; i <= endBlock; i += step) {
            const logs = await this._syncArchive(
                provider,
                chainId,
                i,
                i + step - 1
            );

            console.log(
                `Chain ID: ${chalk.cyan(
                    `[ ${chainId} ]`
                )} | Retrieving ${chalk.yellow(
                    "[ BentoBoxPool.Sync ]"
                )} logs | Block range ${chalk.green(
                    `[ ${i} - ${i + step - 1} ]`
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

    private static async _syncArchive(
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
                    BentoBoxConstants.IBentoBoxPool.getEvent("Sync").format()
                ),
            ],
        });
        const decodedLogs = logs.map((log) => {
            const decodedLog = BentoBoxConstants.IBentoBoxPool.decodeEventLog(
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

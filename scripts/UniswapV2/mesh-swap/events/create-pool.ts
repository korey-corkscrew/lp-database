import chalk from "chalk";
import { Provider } from "../../../provider";
import { ethers } from "hardhat";
import { MeshSwapConstants } from "../mesh-swap-constants";
import { PoolDatabase } from "../../../Database/poolDatabase";
import { ProtocolIndexConstants } from "../../../protocolIndexConstants";

export class CreatePool {
    public static async latestAndStore(provider: Provider) {
        const chainId = provider.chainId();

        console.log(
            `Chain ID: ${chalk.cyan(
                `[ ${chainId} ]`
            )} | Listening for ${chalk.yellow("[ MeshSwap.CreatePool ]")} logs`
        );

        provider.provider().on(
            {
                topics: [
                    ethers.utils.id(
                        MeshSwapConstants.IMeshswapFactory.getEvent(
                            "CreatePool"
                        ).format()
                    ),
                ],
            },
            async (log) => {
                try {
                    const decodedLog =
                        MeshSwapConstants.IMeshswapFactory.decodeEventLog(
                            "CreatePool",
                            log.data,
                            log.topics
                        );

                    if (MeshSwapConstants.validFactory(log.address, chainId)) {
                        const data = ethers.utils.defaultAbiCoder.encode(
                            ["uint256"],
                            [decodedLog.fee]
                        );
                        await PoolDatabase.setPool(
                            decodedLog.exchange,
                            decodedLog.token0,
                            decodedLog.token1,
                            log.address,
                            chainId,
                            data,
                            log.blockNumber,
                            ProtocolIndexConstants.MESHSWAP
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
        const chainId = provider.chainId();
        const step =
            MeshSwapConstants.createPoolEventArchiveBlocksPerCall(chainId);
        for (let i = startBlock; i <= endBlock; i += step) {
            let end = i + step - 1;
            const block = provider.block();
            end = end > block ? block : end;
            const logs = await this._archive(provider, chainId, i, end);

            console.log(
                `Chain ID: ${chalk.cyan(
                    `[ ${chainId} ]`
                )} | Retrieving ${chalk.yellow(
                    "[ MeshSwapFactory.CreatePool ]"
                )} logs | Block range ${chalk.green(
                    `[ ${i} - ${end} ]`
                )} | # of logs ${chalk.gray(`[ ${logs.length} ]`)}`
            );

            for (const log of logs) {
                if (MeshSwapConstants.validFactory(log.factory, log.chainId)) {
                    const data = ethers.utils.defaultAbiCoder.encode(
                        ["uint256"],
                        [log.fee]
                    );
                    await PoolDatabase.setPool(
                        log.exchange,
                        log.token0,
                        log.token1,
                        log.factory,
                        log.chainId,
                        data,
                        log.block,
                        ProtocolIndexConstants.MESHSWAP
                    );
                }
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
                    MeshSwapConstants.IMeshswapFactory.getEvent(
                        "CreatePool"
                    ).format()
                ),
            ],
        });
        const decodedLogs = logs.map((log) => {
            const decodedLog =
                MeshSwapConstants.IMeshswapFactory.decodeEventLog(
                    "CreatePool",
                    log.data,
                    log.topics
                );
            return {
                token0: decodedLog.token0,
                token1: decodedLog.token1,
                exchange: decodedLog.exchange,
                factory: log.address,
                block: log.blockNumber,
                chainId: chainId,
                fee: decodedLog.fee,
            };
        });
        return decodedLogs;
    }
}

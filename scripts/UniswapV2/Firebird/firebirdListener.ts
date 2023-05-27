import { ethers } from "hardhat";
import chalk from "chalk";
import { FirebirdConstants } from "./firebirdConstants";
import { ProtocolIndexConstants } from "../../protocolIndexConstants";
import { Provider } from "../../provider";
import { PoolDatabase } from "../../Database/poolDatabase";

export class FirebirdEventListener {
    public static async createPairAndStore(provider: Provider) {
        const chainId = provider.chainId();

        console.log(
            `Chain ID: ${chalk.cyan(
                `[ ${chainId} ]`
            )} | Listening for ${chalk.yellow(
                "[ FirebirdFactory.CreatePair ]"
            )} logs`
        );

        const factory = FirebirdConstants.factories.get(chainId);
        if (factory == undefined) return [];

        provider.provider().on(
            {
                address: factory.factory,
                topics: [
                    ethers.utils.id(
                        FirebirdConstants.IFirebirdFactory.getEvent(
                            "PairCreated"
                        ).format()
                    ),
                ],
            },
            async (log) => {
                try {
                    const decodedLog =
                        FirebirdConstants.IFirebirdFactory.decodeEventLog(
                            "PairCreated",
                            log.data,
                            log.topics
                        );

                    const encodedData = ethers.utils.defaultAbiCoder.encode(
                        ["uint32", "uint32", "uint32"],
                        [
                            decodedLog.swapFee,
                            decodedLog.tokenWeight0,
                            100 - decodedLog.tokenWeight0,
                        ]
                    );

                    await PoolDatabase.setPool(
                        decodedLog.pair,
                        decodedLog.token0,
                        decodedLog.token1,
                        log.address,
                        chainId,
                        encodedData,
                        log.blockNumber,
                        ProtocolIndexConstants.FIREBIRD
                    );
                } catch {}
            }
        );
    }

    public static async createPairArchiveAndStore(
        provider: Provider,
        startBlock: number,
        endBlock: number,
        step: number
    ) {
        const chainId = provider.chainId();
        for (let i = startBlock; i <= endBlock; i += step) {
            let logs = await this._createPairArchive(
                provider,
                chainId,
                i,
                i + step - 1
            );

            console.log(
                `Chain ID: ${chalk.cyan(
                    `[ ${chainId} ]`
                )} | Retrieving ${chalk.yellow(
                    "[ FirebirdFactory.CreatePair ]"
                )} logs | Block range ${chalk.green(
                    `[ ${i} - ${i + step - 1} ]`
                )} | # of logs ${chalk.gray(`[ ${logs.length} ]`)}`
            );

            for (const log of logs) {
                const encodedData = ethers.utils.defaultAbiCoder.encode(
                    ["uint32", "uint32", "uint32"],
                    [log.swapFee, log.tokenWeight0, 100 - log.tokenWeight0]
                );

                await PoolDatabase.setPool(
                    log.pair,
                    log.token0,
                    log.token1,
                    log.factory,
                    log.chainId,
                    encodedData,
                    log.block,
                    ProtocolIndexConstants.FIREBIRD
                );
            }
        }
    }

    private static async _createPairArchive(
        provider: Provider,
        chainId: number,
        startBlock: number,
        endBlock?: number
    ) {
        const factory = FirebirdConstants.factories.get(chainId);
        if (factory == undefined) return [];

        const logs = await provider.provider().getLogs({
            fromBlock: startBlock,
            toBlock: endBlock,
            address: factory.factory,
            topics: [
                ethers.utils.id(
                    FirebirdConstants.IFirebirdFactory.getEvent(
                        "PairCreated"
                    ).format()
                ),
            ],
        });
        const decodedLogs = logs.map((log) => {
            const decodedLog =
                FirebirdConstants.IFirebirdFactory.decodeEventLog(
                    "PairCreated",
                    log.data,
                    log.topics
                );
            return {
                token0: decodedLog.token0,
                token1: decodedLog.token1,
                pair: decodedLog.pair,
                poolId: decodedLog.allPairsLength,
                factory: log.address,
                block: log.blockNumber,
                chainId: chainId,
                swapFee: decodedLog.swapFee,
                tokenWeight0: decodedLog.tokenWeight0,
            };
        });
        return decodedLogs;
    }
}

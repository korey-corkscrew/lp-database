import { ethers } from "hardhat";
import chalk from "chalk";
import { DystopiaConstants } from "./dystopiaConstants";
import { ProtocolIndexConstants } from "../../protocolIndexConstants";
import { Provider } from "../../provider";
import { PoolDatabase } from "../../Database/poolDatabase";

export class DystopiaEventListener {
    public static async createPairAndStore(provider: Provider) {
        const chainId = provider.chainId();

        console.log(
            `Chain ID: ${chalk.cyan(
                `[ ${chainId} ]`
            )} | Listening for ${chalk.yellow(
                "[ DystopiaFactory.CreatePair ]"
            )} logs`
        );

        let address: string = "";
        for (const factory of DystopiaConstants.factories) {
            if (factory.chainId == chainId) {
                address = factory.factory;
                return;
            }
        }
        if (address == "") return;

        provider.provider().on(
            {
                address: address,
                topics: [
                    ethers.utils.id(
                        DystopiaConstants.IDystopiaFactory.getEvent(
                            "PairCreated"
                        ).format()
                    ),
                ],
            },
            async (log) => {
                try {
                    const decodedLog =
                        DystopiaConstants.IDystopiaFactory.decodeEventLog(
                            "PairCreated",
                            log.data,
                            log.topics
                        );

                    const encodedData = ethers.utils.defaultAbiCoder.encode(
                        ["bool"],
                        [decodedLog.stable]
                    );

                    await PoolDatabase.setPool(
                        decodedLog.pair,
                        decodedLog.token0,
                        decodedLog.token1,
                        log.address,
                        chainId,
                        encodedData,
                        log.blockNumber,
                        ProtocolIndexConstants.DYSTOPIA
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

            if (logs == undefined) logs = [];

            console.log(
                `Chain ID: ${chalk.cyan(
                    `[ ${chainId} ]`
                )} | Retrieving ${chalk.yellow(
                    "[ DystopiaFactory.CreatePair ]"
                )} logs | Block range ${chalk.green(
                    `[ ${i} - ${i + step - 1} ]`
                )} | # of logs ${chalk.gray(`[ ${logs.length} ]`)}`
            );

            for (const log of logs) {
                const encodedData = ethers.utils.defaultAbiCoder.encode(
                    ["bool"],
                    [log.stable]
                );
                await PoolDatabase.setPool(
                    log.pair,
                    log.token0,
                    log.token1,
                    log.factory,
                    log.chainId,
                    encodedData,
                    log.block,
                    ProtocolIndexConstants.DYSTOPIA
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
        let address: string = "";
        for (const factory of DystopiaConstants.factories) {
            if (factory.chainId == chainId) {
                address = factory.factory;
                break;
            }
        }

        if (address == "") return [];

        const logs = await provider.provider().getLogs({
            fromBlock: startBlock,
            toBlock: endBlock,
            address: address,
            topics: [
                ethers.utils.id(
                    DystopiaConstants.IDystopiaFactory.getEvent(
                        "PairCreated"
                    ).format()
                ),
            ],
        });
        const decodedLogs = logs.map((log) => {
            const decodedLog =
                DystopiaConstants.IDystopiaFactory.decodeEventLog(
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
                stable: decodedLog.stable,
            };
        });
        return decodedLogs;
    }
}

import chalk from "chalk";
import { ethers } from "hardhat";
import { Provider } from "../../../provider";
import { PoolDatabase } from "../../../Database/poolDatabase";
import { ProtocolIndexConstants } from "../../../protocolIndexConstants";
import { BentoBoxConstants } from "../bentoBoxConstants";

export class DeployPool {
    public static async deployPoolAndStore(provider: Provider) {
        console.log(
            `Chain ID: ${chalk.cyan(
                `[ ${provider.chainId()} ]`
            )} | Listening for ${chalk.yellow("[ BentoBox.DeployPool ]")} logs`
        );

        await this._deployPoolAndStore(provider);
    }

    public static async deployPoolArchiveAndStore(
        provider: Provider,
        startBlock: number,
        endBlock: number,
        step: number
    ) {
        const chainId = provider.chainId();
        for (let i = startBlock; i <= endBlock; i += step) {
            const logs = await this._deployPoolArchive(
                provider,
                i,
                i + step - 1
            );

            console.log(
                `Chain ID: ${chalk.cyan(
                    `[ ${chainId} ]`
                )} | Retrieving ${chalk.yellow(
                    "[ BentoBox.DeployPool ]"
                )} logs | Block range ${chalk.green(
                    `[ ${i} - ${i + step - 1} ]`
                )} | # of logs ${chalk.gray(`[ ${logs.length} ]`)}`
            );

            for (const log of logs) {
                const data = ethers.utils.defaultAbiCoder.encode(
                    ["uint256"],
                    [log.swapFee]
                );
                await PoolDatabase.setPool(
                    log.pair,
                    log.token0,
                    log.token1,
                    log.factory,
                    log.chainId,
                    data,
                    log.block,
                    ProtocolIndexConstants.BENTO_BOX
                );
            }
        }
    }

    private static async _deployPoolAndStore(provider: Provider) {
        const chainId = provider.chainId();

        const address = BentoBoxConstants.masterDeployer(chainId);
        if (address == undefined) return;

        provider.provider().on(
            {
                address: address,
                topics: [
                    ethers.utils.id(
                        BentoBoxConstants.IBentoBoxMasterDeployer.getEvent(
                            "DeployPool"
                        ).format()
                    ),
                ],
            },
            async (log: any) => {
                try {
                    const decodedLog =
                        BentoBoxConstants.IBentoBoxMasterDeployer.decodeEventLog(
                            "DeployPool",
                            log.data,
                            log.topics
                        );

                    const decodedData = ethers.utils.defaultAbiCoder.decode(
                        ["address", "address", "uint256", "bool"],
                        decodedLog.deployData
                    );

                    const data = ethers.utils.defaultAbiCoder.encode(
                        ["uint256"],
                        [decodedData[2]]
                    );

                    await PoolDatabase.setPool(
                        decodedLog.pool,
                        decodedData[0],
                        decodedData[1],
                        decodedLog.factory,
                        chainId,
                        data,
                        log.blockNumber,
                        ProtocolIndexConstants.BENTO_BOX
                    );
                } catch {}
            }
        );
    }

    private static async _deployPoolArchive(
        provider: Provider,
        startBlock: number,
        endBlock?: number
    ) {
        const chainId = provider.chainId();

        const address = BentoBoxConstants.masterDeployer(chainId);
        if (address == undefined) return [];

        const logs = await provider.provider().getLogs({
            fromBlock: startBlock,
            toBlock: endBlock,
            address: address,
            topics: [
                ethers.utils.id(
                    BentoBoxConstants.IBentoBoxMasterDeployer.getEvent(
                        "DeployPool"
                    ).format()
                ),
            ],
        });

        let decodedLogs = [];

        for (const log of logs) {
            const decodedLog =
                BentoBoxConstants.IBentoBoxMasterDeployer.decodeEventLog(
                    "DeployPool",
                    log.data,
                    log.topics
                );
            if (
                BentoBoxConstants.isConstantProductFactory(
                    decodedLog.factory,
                    chainId
                )
            ) {
                const decodedData = ethers.utils.defaultAbiCoder.decode(
                    ["address", "address", "uint256", "bool"],
                    decodedLog.deployData
                );

                decodedLogs.push({
                    token0: decodedData[0],
                    token1: decodedData[1],
                    pair: decodedLog.pool,
                    swapFee: decodedData[2],
                    factory: decodedLog.factory,
                    block: log.blockNumber,
                    chainId: chainId,
                });
            }
        }
        return decodedLogs;
    }
}

import chalk from "chalk";
import { Provider } from "../../../provider";
import { BentoBoxTotalsDatabase } from "../../../Database/bentoBoxTotals";
import { BentoBoxConstants } from "../bentoBoxConstants";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export class LogDeposit {
    public static async logDepositAndStore(provider: Provider) {
        console.log(
            `Chain ID: ${chalk.cyan(
                `[ ${provider.chainId()} ]`
            )} | Listening for ${chalk.yellow("[ BentoBox.LogDeposit ]")} logs`
        );

        await this._logDepositAndStore(provider);
    }

    public static async logDepositArchiveAndStore(
        provider: Provider,
        startBlock: number,
        endBlock: number,
        step: number
    ) {
        const chainId = provider.chainId();
        for (let i = startBlock; i <= endBlock; i += step) {
            const logs = await this._logDepositArchive(
                provider,
                i,
                i + step - 1
            );

            console.log(
                `Chain ID: ${chalk.cyan(
                    `[ ${chainId} ]`
                )} | Retrieving ${chalk.yellow(
                    "[ BentoBox.LogDeposit ]"
                )} logs | Block range ${chalk.green(
                    `[ ${i} - ${i + step - 1} ]`
                )} | # of logs ${chalk.gray(`[ ${logs.length} ]`)}`
            );

            for (const log of logs) {
                const totals = await BentoBoxTotalsDatabase.getTotals(
                    log.token,
                    log.chainId
                );
                await BentoBoxTotalsDatabase.updateTotals(
                    log.token,
                    totals.base.add(log.base),
                    log.elastic.add(log.elastic),
                    log.block,
                    log.chainId
                );
            }
        }
    }

    private static async _logDepositAndStore(provider: Provider) {
        const chainId = provider.chainId();
        const address = BentoBoxConstants.bentoBox(chainId);
        if (address == undefined) return;
        provider.provider().on(
            {
                address: address,
                topics: [
                    ethers.utils.id(
                        BentoBoxConstants.IBentoBox.getEvent(
                            "LogDeposit"
                        ).format()
                    ),
                ],
            },
            async (log) => {
                const decodedLog = BentoBoxConstants.IBentoBox.decodeEventLog(
                    "LogDeposit",
                    log.data,
                    log.topics
                );
                const oldTotals = await BentoBoxTotalsDatabase.getTotals(
                    decodedLog.token,
                    chainId
                );
                const newBase = BigNumber.from(oldTotals.base).add(
                    decodedLog.share
                );
                const newElastic = BigNumber.from(oldTotals.elastic).add(
                    decodedLog.amount
                );

                await BentoBoxTotalsDatabase.updateTotals(
                    decodedLog.token,
                    newBase,
                    newElastic,
                    log.blockNumber,
                    chainId
                );
            }
        );
    }

    private static async _logDepositArchive(
        provider: Provider,
        startBlock: number,
        endBlock: number
    ) {
        const chainId = provider.chainId();
        const address = BentoBoxConstants.bentoBox(chainId);
        if (address == undefined) return [];
        const logs = await provider.provider().getLogs({
            fromBlock: startBlock,
            toBlock: endBlock,
            address: address,
            topics: [
                ethers.utils.id(
                    BentoBoxConstants.IBentoBox.getEvent("LogDeposit").format()
                ),
            ],
        });

        const decodedLogs = logs.map((log) => {
            const decodedLog = BentoBoxConstants.IBentoBox.decodeEventLog(
                "LogDeposit",
                log.data,
                log.topics
            );
            return {
                token: decodedLog.token,
                base: decodedLog.share,
                elastic: decodedLog.amount,
                block: log.blockNumber,
                chainId: chainId,
            };
        });
        return decodedLogs;
    }
}

import { ethers } from "hardhat";
import { Provider } from "../../../provider";
import { BentoBoxConstants } from "../bentoBoxConstants";
import { BigNumber } from "ethers";
import { BentoBoxTotalsDatabase } from "../../../Database/bentoBoxTotals";
import chalk from "chalk";

export class LogFlashLoan {
    public static async logFlashLoanAndStore(provider: Provider) {
        console.log(
            `Chain ID: ${chalk.cyan(
                `[ ${provider.chainId()} ]`
            )} | Listening for ${chalk.yellow(
                "[ BentoBox.LogFlashLoan ]"
            )} logs`
        );

        await this._logFlashLoanAndStore(provider);
    }

    public static async logFlashLoanArchiveAndStore(
        provider: Provider,
        startBlock: number,
        endBlock: number,
        step: number
    ) {
        const chainId = provider.chainId();
        for (let i = startBlock; i <= endBlock; i += step) {
            const logs = await this._logFlashLoanArchive(
                provider,
                i,
                i + step - 1
            );

            console.log(
                `Chain ID: ${chalk.cyan(
                    `[ ${chainId} ]`
                )} | Retrieving ${chalk.yellow(
                    "[ BentoBox.LogFlashLoan ]"
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
                    totals.base,
                    totals.elastic.add(log.feeAmount),
                    log.block,
                    log.chainId
                );
            }
        }
    }

    private static async _logFlashLoanArchive(
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
                    BentoBoxConstants.IBentoBox.getEvent(
                        "LogFlashLoan"
                    ).format()
                ),
            ],
        });

        const decodedLogs = logs.map((log) => {
            const decodedLog = BentoBoxConstants.IBentoBox.decodeEventLog(
                "LogFlashLoan",
                log.data,
                log.topics
            );
            return {
                token: decodedLog.token,
                feeAmount: decodedLog.feeAmount,
                block: log.blockNumber,
                chainId: chainId,
            };
        });
        return decodedLogs;
    }

    private static async _logFlashLoanAndStore(provider: Provider) {
        const chainId = provider.chainId();
        const address = BentoBoxConstants.bentoBox(chainId);
        if (address == undefined) return;
        provider.provider().on(
            {
                address: address,
                topics: [
                    ethers.utils.id(
                        BentoBoxConstants.IBentoBox.getEvent(
                            "LogFlashLoan"
                        ).format()
                    ),
                ],
            },
            async (log) => {
                const decodedLog = BentoBoxConstants.IBentoBox.decodeEventLog(
                    "LogFlashLoan",
                    log.data,
                    log.topics
                );
                const oldTotals = await BentoBoxTotalsDatabase.getTotals(
                    decodedLog.token,
                    chainId
                );
                const newElastic = BigNumber.from(oldTotals.elastic).add(
                    decodedLog.feeAmount
                );

                await BentoBoxTotalsDatabase.updateTotals(
                    decodedLog.token,
                    BigNumber.from(oldTotals.base),
                    newElastic,
                    log.blockNumber,
                    chainId
                );
            }
        );
    }
}

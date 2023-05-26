import { ethers } from "hardhat";
import { Provider } from "../../../provider";
import { BentoBoxConstants } from "../bentoBoxConstants";
import { BigNumber } from "ethers";
import { BentoBoxTotalsDatabase } from "../../../Database/bentoBoxTotals";

export class LogWithdraw {
    private static async _logWithdrawAndStore(provider: Provider) {
        const chainId = provider.chainId();
        const address = BentoBoxConstants.bentoBox(chainId);
        if (address == undefined) return;
        provider.provider().on(
            {
                address: address,
                topics: [
                    ethers.utils.id(
                        BentoBoxConstants.IBentoBox.getEvent(
                            "LogWithdraw"
                        ).format()
                    ),
                ],
            },
            async (log) => {
                const decodedLog = BentoBoxConstants.IBentoBox.decodeEventLog(
                    "LogWithdraw",
                    log.data,
                    log.topics
                );
                const oldTotals = await BentoBoxTotalsDatabase.getTotals(
                    decodedLog.token,
                    chainId
                );
                const newBase = BigNumber.from(oldTotals.base).sub(
                    decodedLog.share
                );
                const newElastic = BigNumber.from(oldTotals.elastic).sub(
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
}

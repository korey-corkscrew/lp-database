import { Provider } from "../../provider";
import { ethers } from "hardhat";
import { BentoBoxConstants } from "./bentoBoxConstants";
import { BentoBoxTotalsDatabase } from "../../Database/bentoBoxTotals";
import { BigNumber } from "ethers";
import { DeployPool } from "./listeners.ts/deployPool";
import { LogDeposit } from "./listeners.ts/logDeposit";
import { Mixin } from "ts-mixer";
import { LogWithdraw } from "./listeners.ts/logWithdraw";
import { LogFlashLoan } from "./listeners.ts/logFlashLoan";
import { LogStrategyProfit } from "./listeners.ts/logStrategyProfit";
import { LogStrategyLoss } from "./listeners.ts/logStrategyLoss";

export class BentoBoxListener extends Mixin(
    DeployPool,
    LogDeposit,
    LogWithdraw,
    LogFlashLoan,
    LogStrategyProfit,
    LogStrategyLoss
) {
    public static async example(provider: Provider) {
        this.deployPoolAndStore(provider);
    }
}

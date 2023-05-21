import { ethers } from "hardhat";
import chalk from "chalk";
import { BigNumber } from "ethers";
import { TokenDatabase } from "../tokenDatabase";
import { UniswapV2Constants } from "./uniswapV2Constants";
import { Contract, Provider as MulicallProvider } from "ethers-multicall";
import { ProtocolIndexConstants } from "../protocolIndexConstants";
import { Provider } from "../provider";

interface Reserves {
    pool: string;
    reserve0: BigNumber;
    reserve1: BigNumber;
}

export class UniswapV2EventListener {
    public static async getReservesAndStore(
        provider: Provider,
        db: TokenDatabase,
        pools: string[],
        poolsPerCall: number
    ) {
        const chainId = provider.chainId();
        for (let i = 0; i < pools.length; i += poolsPerCall) {
            let block = provider.block();
            let end = i + poolsPerCall;
            if (end >= pools.length) end = pools.length;
            let reserves = await this._getReserves(
                provider,
                pools.slice(i, end)
            );

            console.log(
                `Chain ID: ${chalk.cyan(
                    `[ ${chainId} ]`
                )} | Retrieving reserves for pools ${chalk.green(
                    `[ ${i} - ${end} ]`
                )} / ${chalk.gray(`[ ${pools.length} ]`)}`
            );
            for (const reserve of reserves) {
                await db.updatePoolReserves(
                    reserve.pool,
                    chainId,
                    reserve.reserve0,
                    reserve.reserve1,
                    block
                );
            }
        }
    }

    private static async _getReserves(
        provider: Provider,
        pools: string[]
    ): Promise<Reserves[]> {
        const multicallProvider = new MulicallProvider(provider.provider());
        await multicallProvider.init();
        const calls = pools.map((pool) => {
            const contract = new Contract(
                pool,
                UniswapV2Constants.uniswapV2PairAbi
            );
            return contract.getReserves();
        });

        let success = false;
        let reserves: Reserves[] = [];

        do {
            try {
                const _reserves = await multicallProvider.all(calls);
                reserves = _reserves.map((reserve, i) => {
                    return {
                        pool: pools[i],
                        reserve0: reserve.reserve0,
                        reserve1: reserve.reserve1,
                    };
                });
                success = true;
            } catch {
                setTimeout(() => {
                    console.log(
                        `getReserves() call ${chalk.red(
                            "failed"
                        )}. Retrying in 1s.`
                    );
                }, 1000);
            }
        } while (!success);
        return reserves;
    }

    public static async createPairAndStore(
        provider: Provider,
        db: TokenDatabase
    ) {
        const chainId = provider.chainId();

        console.log(
            `Chain ID: ${chalk.cyan(
                `[ ${chainId} ]`
            )} | Listening for ${chalk.yellow("[ UniswapV2.CreatePair ]")} logs`
        );

        provider.provider().on(
            {
                topics: [
                    ethers.utils.id(
                        UniswapV2Constants.IUniswapV2Factory.getEvent(
                            "PairCreated"
                        ).format()
                    ),
                ],
            },
            async (log) => {
                try {
                    const decodedLog =
                        UniswapV2Constants.IUniswapV2Factory.decodeEventLog(
                            "PairCreated",
                            log.data,
                            log.topics
                        );

                    if (UniswapV2Constants.validFactory(log.address, chainId)) {
                        await db.setPool(
                            decodedLog.pair,
                            decodedLog.token0,
                            decodedLog.token1,
                            log.address,
                            chainId,
                            "0x",
                            log.blockNumber,
                            ProtocolIndexConstants.UNISWAP_V2
                        );
                    }
                } catch {}
            }
        );
    }

    public static async createPairArchiveAndStore(
        provider: Provider,
        db: TokenDatabase,
        startBlock: number,
        endBlock: number,
        step: number
    ) {
        const chainId = provider.chainId();
        for (let i = startBlock; i <= endBlock; i += step) {
            const logs = await this._createPairArchive(
                provider,
                chainId,
                i,
                i + step - 1
            );

            console.log(
                `Chain ID: ${chalk.cyan(
                    `[ ${chainId} ]`
                )} | Retrieving ${chalk.yellow(
                    "[ UniswapV2.CreatePair ]"
                )} logs | Block range ${chalk.green(
                    `[ ${i} - ${i + step - 1} ]`
                )} | # of logs ${chalk.gray(`[ ${logs.length} ]`)}`
            );

            for (const log of logs) {
                if (UniswapV2Constants.validFactory(log.factory, log.chainId)) {
                    await db.setPool(
                        log.pair,
                        log.token0,
                        log.token1,
                        log.factory,
                        log.chainId,
                        "0x",
                        log.block,
                        ProtocolIndexConstants.UNISWAP_V2
                    );
                }
            }
        }
    }

    public static async syncAndStore(provider: Provider, db: TokenDatabase) {
        const chainId = provider.chainId();

        console.log(
            `Chain ID: ${chalk.cyan(
                `[ ${chainId} ]`
            )} | Listening for ${chalk.yellow("[ Sync ]")} logs`
        );

        provider.provider().on(
            {
                topics: [
                    ethers.utils.id(
                        UniswapV2Constants.IUniswapV2Pair.getEvent(
                            "Sync"
                        ).format()
                    ),
                ],
            },
            async (log) => {
                try {
                    const decodedLog =
                        UniswapV2Constants.IUniswapV2Pair.decodeEventLog(
                            "Sync",
                            log.data,
                            log.topics
                        );

                    await db.updatePoolReserves(
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
        db: TokenDatabase,
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
                    "[ Sync ]"
                )} logs | Block range ${chalk.green(
                    `[ ${i} - ${i + step - 1} ]`
                )} | # of logs ${chalk.gray(`[ ${logs.length} ]`)}`
            );

            for (const log of logs) {
                await db.updatePoolReserves(
                    log.pool,
                    chainId,
                    log.reserve0,
                    log.reserve1,
                    log.blockUpdated
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
        const logs = await provider.provider().getLogs({
            fromBlock: startBlock,
            toBlock: endBlock,
            topics: [
                ethers.utils.id(
                    UniswapV2Constants.IUniswapV2Factory.getEvent(
                        "PairCreated"
                    ).format()
                ),
            ],
        });
        const decodedLogs = logs.map((log) => {
            const decodedLog =
                UniswapV2Constants.IUniswapV2Factory.decodeEventLog(
                    "PairCreated",
                    log.data,
                    log.topics
                );
            return {
                token0: decodedLog.token0,
                token1: decodedLog.token1,
                pair: decodedLog.pair,
                poolId: decodedLog[3].toNumber(),
                factory: log.address,
                block: log.blockNumber,
                chainId: chainId,
            };
        });
        return decodedLogs;
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
                    UniswapV2Constants.IUniswapV2Pair.getEvent("Sync").format()
                ),
            ],
        });
        const decodedLogs = logs.map((log) => {
            const decodedLog = UniswapV2Constants.IUniswapV2Pair.decodeEventLog(
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

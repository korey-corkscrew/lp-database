import { Interface, Result } from "@ethersproject/abi";
import chalk from "chalk";
import { ethers } from "hardhat";
import { Provider } from "./provider";
import invariant from "tiny-invariant";
import { Log } from "@ethersproject/providers";

export interface EventResult {
    raw: Log;
    decoded: Result;
    chainId: number;
}

export class EventBase {
    public readonly interface: Interface;
    public readonly interfaceName: string;
    public readonly eventName: string;
    public readonly protocolIndex: number;

    constructor(
        _interface: Interface,
        _interfaceName: string,
        _eventName: string,
        _protocolIndex: number
    ) {
        this.interface = _interface;
        this.interfaceName = _interfaceName;
        this.eventName = _eventName;
        this.protocolIndex = _protocolIndex;
    }

    public printArchiveLogStatus(
        chainId: number,
        startBlock: number,
        endBlock: number,
        totalLogs: number
    ) {
        console.log(
            `Chain ID: ${chalk.cyan(
                `[ ${chainId} ]`
            )} | Retrieving ${chalk.yellow(
                `[ ${this.interfaceName}.${this.eventName} ]`
            )} logs | Block range ${chalk.green(
                `[ ${startBlock} - ${endBlock} ]`
            )} | # of logs ${chalk.gray(`[ ${totalLogs} ]`)}`
        );
    }

    public printLatestLogStatus(chainId: number) {
        console.log(
            `Chain ID: ${chalk.cyan(
                `[ ${chainId} ]`
            )} | Listening for ${chalk.yellow(
                `[ ${this.interfaceName}.${this.eventName} ]`
            )} logs`
        );
    }

    public getFormattedEvent() {
        return ethers.utils.id(
            this.interface.getEvent(this.eventName).format()
        );
    }

    public getDecodedLog(data: string, topics: string[]) {
        try {
            return this.interface.decodeEventLog(this.eventName, data, topics);
        } catch {
            return null;
        }
    }

    public async latest(
        provider: Provider,
        callback: CallableFunction,
        address?: string
    ) {
        const chainId = provider.chainId();

        this.printLatestLogStatus(chainId);

        provider.provider().on(
            {
                address: address,
                topics: [this.getFormattedEvent()],
            },
            async (log) => {
                const decodedLog = this.getDecodedLog(log.data, log.topics);
                invariant(decodedLog, `log decoding error`);
                const result: EventResult = {
                    raw: log,
                    decoded: decodedLog,
                    chainId: chainId,
                };
                await callback(result);
            }
        );
    }

    public async archive(
        provider: Provider,
        startBlock: number,
        endBlock: number,
        callback: CallableFunction,
        blocksPerCall: number,
        address?: string
    ) {
        const chainId = provider.chainId();
        for (let i = startBlock; i <= endBlock; i += blocksPerCall) {
            let end = i + blocksPerCall - 1;
            const block = provider.block();
            end = end > block ? block : end;
            const logs = await this._archive(
                chainId,
                provider,
                i,
                end,
                address
            );

            this.printArchiveLogStatus(chainId, i, end, logs.length);

            for (const log of logs) {
                await callback(log);
            }
        }
    }

    private async _archive(
        chainId: number,
        provider: Provider,
        startBlock: number,
        endBlock: number,
        address?: string
    ) {
        const logs = await provider.provider().getLogs({
            fromBlock: startBlock,
            toBlock: endBlock,
            address: address,
            topics: [this.getFormattedEvent()],
        });
        return logs.map((log) => {
            const decodedLog = this.getDecodedLog(log.data, log.topics);
            invariant(decodedLog, `log decoding error`);
            const result: EventResult = {
                raw: log,
                decoded: decodedLog,
                chainId: chainId,
            };
            return result;
        });
    }
}

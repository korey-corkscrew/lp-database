import chalk from "chalk";
import {
    Contract,
    ContractCall,
    Provider as MulicallProvider,
} from "ethers-multicall";
import { BigNumber } from "ethers";
import { Provider } from "./provider";

export interface Result {
    call: ContractCall;
    result: any;
    chainId: number;
    block: number;
}

export class CallBase {
    private readonly _contractName: string;
    private readonly _functionName: string;
    private readonly _abi: any[];

    constructor(contractName: string, functionName: string, abi: any[]) {
        this._contractName = contractName;
        this._functionName = functionName;
        this._abi = abi;
    }

    private printCall(
        chainId: number,
        start: number,
        end: number,
        total: number
    ) {
        console.log(
            `Chain ID: ${chalk.cyan(`[ ${chainId} ]`)} | Retrieving ${
                this._contractName
            }.${this._functionName} calls ${chalk.green(
                `[ ${start} - ${end} ]`
            )} / ${chalk.gray(`[ ${total} ]`)}`
        );
    }

    public getContract(address: string) {
        return new Contract(address, this._abi);
    }

    public async call(
        provider: Provider,
        calls: ContractCall[],
        callSize: number,
        callback: CallableFunction
    ) {
        const chainId = provider.chainId();
        for (let i = 0; i < calls.length; i += callSize) {
            let end = i + callSize;
            const _calls = calls.slice(i, end);
            if (end >= calls.length) end = calls.length;
            const [_results, block] = await this._call(provider, _calls);
            this.printCall(chainId, i, end, calls.length);
            for (let i = 0; i < _results.length; i++) {
                let _result: Result = {
                    call: _calls[i],
                    result: _results[i],
                    chainId: chainId,
                    block: block,
                };

                await callback(_result);
            }
        }
    }

    private async _call(
        provider: Provider,
        calls: ContractCall[]
    ): Promise<[any[], number]> {
        const multicallProvider = new MulicallProvider(provider.provider());
        await multicallProvider.init();

        let success = false;
        let results: any[] = [];
        let block: number = 0;

        do {
            try {
                block = provider.block();
                results = await multicallProvider.all(calls);
                success = true;
            } catch {
                setTimeout(() => {
                    console.log(
                        `${this._contractName}.${
                            this._functionName
                        } call ${chalk.red("failed")}. Retrying in 1s.`
                    );
                }, 1000);
            }
        } while (!success);
        return [results, block];
    }
}

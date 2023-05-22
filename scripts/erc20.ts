import { Contract, Provider as MulticallProvider } from "ethers-multicall";
import { Provider } from "./provider";

export class ERC20 {
    private static readonly _abi =
        require("@openzeppelin/contracts/build/contracts/IERC20.json").abi;

    public static async getERC20Name(provider: Provider, addresses: string[]) {
        const multicallProvider = new MulticallProvider(provider.provider());
        const calls = addresses.map((address) => {
            const contract = new Contract(address, this._abi);
            return contract.name();
        });
        return await multicallProvider.all(calls);
    }

    public static async getERC20Symbol(
        provider: Provider,
        addresses: string[]
    ) {
        const multicallProvider = new MulticallProvider(provider.provider());
        const calls = addresses.map((address) => {
            const contract = new Contract(address, this._abi);
            return contract.symbol();
        });
        return await multicallProvider.all(calls);
    }

    public static async getERC20Decimals(
        provider: Provider,
        addresses: string[]
    ) {
        const multicallProvider = new MulticallProvider(provider.provider());
        const calls = addresses.map((address) => {
            const contract = new Contract(address, this._abi);
            return contract.decimals();
        });
        return await multicallProvider.all(calls);
    }

    public static async getERC20Metadata(
        provider: Provider,
        addresses: string[]
    ) {
        const names = await this.getERC20Name(provider, addresses);
        const symbols = await this.getERC20Symbol(provider, addresses);
        const decimals = await this.getERC20Decimals(provider, addresses);
        return addresses.map((address, i) => {
            return {
                address: address,
                name: names[i],
                symbol: symbols[i],
                decimals: decimals[i],
            };
        });
    }
}

import { ethers } from "hardhat";

export interface Token {
    address: string;
    chainId: number;
}

export class TokenConstants {
    private static readonly _tokens = new Map<string, Map<number, string>>([
        [
            "USDC",
            new Map([
                [1, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"],
                [137, "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"],
                [42161, "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"],
            ]),
        ],
        [
            "DAI",
            new Map([
                [1, "0x6B175474E89094C44Da98b954EedeAC495271d0F"],
                [137, "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"],
                [42161, "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"],
            ]),
        ],
        [
            "WETH",
            new Map([
                [1, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
                [137, "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"],
                [42161, "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"],
            ]),
        ],
        [
            "WMATIC",
            new Map([
                [1, "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0"],
                [137, "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"],
                [42161, ""],
            ]),
        ],
        [
            "WBTC",
            new Map([
                [1, "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"],
                [137, "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6"],
                [42161, "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f"],
            ]),
        ],
    ]);

    public static getToken(name: string, chainId: number): string {
        const token = this._tokens.get(name)?.get(chainId);
        if (token) return token;
        return ethers.constants.AddressZero;
    }
}

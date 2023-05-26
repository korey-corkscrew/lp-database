import { BigNumberish } from "ethers";
import { ethers } from "hardhat";

export interface UniswapV2Factory {
    factory: string;
    router: string;
    fee: BigNumberish;
    feeBase: BigNumberish;
    initCodeHash: string;
    protocol: string;
    chainId: number;
    startBlock: number;
}

export class UniswapV2Constants {
    public static readonly uniswapV2PairAbi =
        require("@uniswap/v2-core/build/IUniswapV2Pair.json").abi;
    public static readonly uniswapV2FactoryAbi =
        require("@uniswap/v2-core/build/IUniswapV2Factory.json").abi;
    public static readonly IUniswapV2Factory = new ethers.utils.Interface(
        this.uniswapV2FactoryAbi
    );
    public static readonly IUniswapV2Pair = new ethers.utils.Interface(
        this.uniswapV2PairAbi
    );
    private static readonly _CREATE_PAIR_EVENT_ARCHIVE_BLOCKS_PER_CALL =
        new Map<number, number>([
            [1, 80000],
            [137, 1000000],
            [42161, 1000000],
        ]);

    public static createPairEventArchiveBlocksPerCall(chainId: number) {
        const blocks =
            this._CREATE_PAIR_EVENT_ARCHIVE_BLOCKS_PER_CALL.get(chainId);
        if (blocks) return blocks;
        return 0;
    }

    public static readonly GET_RESERVES_POOLS_PER_CALL = 500;
    public static readonly SYNC_EVENT_ARCHIVE_BLOCKS_PER_CALL = 2000;

    private static readonly _factories: UniswapV2Factory[] = [
        /* ------------------ Polygon ------------------ */
        {
            factory: "0xCf083Be4164828f00cAE704EC15a36D711491284", // Apeswap
            router: "0xC0788A3aD43d79aa53B09c2EaCc313A787d1d607",
            fee: 998,
            feeBase: 1000,
            initCodeHash:
                "0x511f0f358fe530cda0859ec20becf391718fdf5a329be02f4c95361f3d6a42d8",
            protocol: "APESWAP",
            chainId: 137,
            startBlock: 15298801,
        },
        {
            factory: "0x800b052609c355cA8103E06F022aA30647eAd60a", // Cometh Swap
            router: "0x93bcDc45f7e62f89a8e901DC4A0E2c6C427D9F25",
            fee: 995,
            feeBase: 1000,
            initCodeHash:
                "0x499154cad90a3563f914a25c3710ed01b9a43b8471a35ba8a66a056f37638542",
            protocol: "COMETH",
            chainId: 137,
            startBlock: 11633169,
        },
        {
            factory: "0xE7Fb3e833eFE5F9c441105EB65Ef8b261266423B", // Dfyn
            router: "0xA102072A4C07F06EC3B4900FDC4C7B80b6c57429",
            fee: 997,
            feeBase: 1000,
            initCodeHash:
                "0xf187ed688403aa4f7acfada758d8d53698753b998a3071b06f1b777f4330eaf3",
            protocol: "DFYN",
            chainId: 137,
            startBlock: 5436831,
        },
        {
            factory: "0xE3BD06c7ac7E1CeB17BdD2E5BA83E40D1515AF2a", // Elk Finance
            router: "0xf38a7A7Ac2D745E2204c13F824c00139DF831FFf",
            fee: 997,
            feeBase: 1000,
            initCodeHash:
                "0x84845e7ccb283dec564acfcd3d9287a491dec6d675705545a2ab8be22ad78f31",
            protocol: "ELK",
            chainId: 137,
            startBlock: 13103735,
        },
        {
            factory: "0x3ed75AfF4094d2Aaa38FaFCa64EF1C152ec1Cf20", // Gravity
            router: "0x57dE98135e8287F163c59cA4fF45f1341b680248",
            fee: 997,
            feeBase: 1000,
            initCodeHash:
                "0x59f0dd0ec2453a509915048cac1608e1a52938dbcdf6b4960b21592e7996743a",
            protocol: "GRAVITY",
            chainId: 137,
            startBlock: 18134755,
        },
        {
            factory: "0x668ad0ed2622C62E24f0d5ab6B6Ac1b9D2cD4AC7", // Jetswap
            router: "0x5C6EC38fb0e2609672BDf628B1fD605A523E5923",
            fee: 999,
            feeBase: 1000,
            initCodeHash:
                "0x505c843b83f01afef714149e8b174427d552e1aca4834b4f9b4b525f426ff3c6",
            protocol: "JETSWAP",
            chainId: 137,
            startBlock: 16569374,
        },
        {
            factory: "0x477Ce834Ae6b7aB003cCe4BC4d8697763FF456FA", // Polycat
            router: "0x94930a328162957FF1dd48900aF67B5439336cBD",
            fee: 9976,
            feeBase: 10000,
            initCodeHash:
                "0x3cad6f9e70e13835b4f07e5dd475f25a109450b22811d0437da51e66c161255a",
            protocol: "POLYCAT",
            chainId: 137,
            startBlock: 17703715,
        },
        {
            factory: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32", // Quickswap
            router: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
            fee: 997,
            feeBase: 1000,
            initCodeHash:
                "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f",
            protocol: "QUICKSWAP",
            chainId: 137,
            startBlock: 4931780,
        },
        {
            factory: "0xB581D0A3b7Ea5cDc029260e989f768Ae167Ef39B", // Radio Shack
            router: "0xAf877420786516FC6692372c209e0056169eebAf",
            fee: 999,
            feeBase: 1000,
            initCodeHash:
                "0x3eef69365a159891ca18b545ccaf0d6aca9b22c988b8deb7a3e4fa2fc2418596",
            protocol: "RADIO_SHACK",
            chainId: 137,
            startBlock: 24980768,
        },
        {
            factory: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4", // Sushiswap
            router: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
            fee: 997,
            feeBase: 1000,
            initCodeHash:
                "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
            protocol: "SUSHISWAP",
            chainId: 137,
            startBlock: 11333218,
        },
        {
            factory: "0xa98ea6356A316b44Bf710D5f9b6b4eA0081409Ef", // Wault Swap
            router: "0x3a1D87f206D12415f5b0A33E786967680AAb4f6d",
            fee: 998,
            feeBase: 1000,
            initCodeHash:
                "0x1cdc2246d318ab84d8bc7ae2a3d81c235f3db4e113f4c6fdc1e2211a9291be47",
            protocol: "WAULT_SWAP",
            chainId: 137,
            startBlock: 15474436,
        },
        {
            factory: "0x5BdD1CD910e3307582F213b33699e676E61deaD9", // Polydex
            router: "0xC60aE14F2568b102F8Ca6266e8799112846DD088", // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            fee: 997,
            feeBase: 1000,
            initCodeHash:
                "0x8cb41b27c88f8934c0773207afb757d84c4baa607990ad4a30505e42438d999a",
            protocol: "POLYDEX",
            chainId: 137,
            startBlock: 17035187,
        },
        {
            factory: "0x293f45b6F9751316672da58AE87447d712AF85D7", // Vulcan
            router: "0xfE0E493564DB7Ae23a7b6Ea07F2C633Ee8f25f22",
            fee: 997,
            feeBase: 1000,
            initCodeHash:
                "0x6ef78d7709026f20d23d9a4f267d7350f69949442295ac090da495c5696bcafe",
            protocol: "VULCAN",
            chainId: 137,
            startBlock: 19455293,
        },
        {
            factory: "0x624Ccf581371F8A4493e6AbDE46412002555A1b6", // Dino
            router: "0x6AC823102CB347e1f5925C634B80a98A3aee7E03",
            fee: 9982,
            feeBase: 10000,
            initCodeHash:
                "0x6a733b8ac43b9d683a3035801788767d1b63c7998154ab1d6379b011dc98a9b8",
            protocol: "DINO_SWAP",
            chainId: 137,
            startBlock: 22634106,
        },

        /* ------------------ Arbitrum ------------------ */
        {
            factory: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
            router: "",
            fee: 997,
            feeBase: 1000,
            initCodeHash:
                "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",
            protocol: "QUICKSWAP",
            chainId: 42161,
            startBlock: 70,
        },

        /* ------------------ Ethereum ------------------ */
        {
            factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
            router: "",
            fee: 997,
            feeBase: 1000,
            initCodeHash: "",
            protocol: "UNISWAP_V2",
            chainId: 1,
            startBlock: 10000835,
        },
        {
            factory: "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
            router: "",
            fee: 997,
            feeBase: 1000,
            initCodeHash: "",
            protocol: "SUSHISWAP",
            chainId: 1,
            startBlock: 10794229,
        },
    ];

    private static readonly _factoryById = new Map<string, UniswapV2Factory>(
        this._factories.map((factoryData) => {
            return [
                ethers.utils.solidityKeccak256(
                    ["address", "uint256"],
                    [factoryData.factory, factoryData.chainId]
                ),
                factoryData,
            ];
        })
    );

    public static validFactory(_factory: string, _chainId: number): boolean {
        const id = ethers.utils.solidityKeccak256(
            ["address", "uint256"],
            [_factory, _chainId]
        );
        const factory = this._factoryById.get(id);
        if (factory) return true;
        return false;
    }

    public static getFirstCreatedFactoryBlock(_chainId: number) {
        let smallestBlock = Number.MAX_VALUE;
        for (const factory of this._factories) {
            if (
                factory.chainId == _chainId &&
                factory.startBlock < smallestBlock
            ) {
                smallestBlock = factory.startBlock;
            }
        }
        if (smallestBlock == Number.MAX_VALUE) return 0;
        return smallestBlock;
    }
}

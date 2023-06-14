import invariant from "tiny-invariant";
import { TokenConstants } from "./tokenConstants";
import { env } from "process";
import { Provider } from "./utils/provider";
import { Database } from "./database/database";
import { MeshSwapInitializer } from "./uniswap-v2/mesh-swap/mesh-swap-initializer";
import { CreatePool } from "./uniswap-v2/mesh-swap/events/create-pool";
import { PoolDatabase } from "./database/pool-database";
import { Contract } from "ethers-multicall";
import { getPools, getTicks } from "./graph-test";
import { ethers } from "hardhat";

function position(tick: number) {
    let wordPos = tick >> 8;
    let bitPos = tick % 256;
    return {
        wordPos: wordPos,
        bitPos: bitPos,
    };
}

async function main() {
    const dotenv = require("dotenv");
    dotenv.config();

    /* ----------- Create database instance ----------- */
    const db = new Database(env.MONGODB_URL);
    await db.connect();

    const polygon = new Provider(env.POLYGON_RPC_WS);
    await polygon.initialize();

    // polygon.provider().on({}, (event) => {
    //     console.log(event);
    // });
    const factory = "0x5De74546d3B86C8Df7FEEc30253865e1149818C8";
    const MIN_TICK: number = -887272;
    const MAX_TICK: number = -MIN_TICK;
    const array = new Array();

    // for (let i = MIN_TICK; i <= MAX_TICK; i++) {
    //     const pos = position(198410);
    //     if(array.includes())
    //     console.log({ tick: i, ...pos });
    // }

    // const pools = new Array();
    // let lastPool = ethers.constants.AddressZero;
    // for (let i = 0; i < 10; i++) {
    //     pools.push(...(await getPools(lastPool)));
    //     lastPool = pools.at(-1);
    //     console.log(lastPool);
    // }
    // console.log(pools);

    const block = polygon.block() - 10;
    const pools = new Array();
    let lastPool = ethers.constants.AddressZero;
    while (true) {
        const ticks = await getTicks(lastPool, block);
        if (ticks.length == 0) break;
        pools.push(...ticks);
        lastPool = pools.at(-1).id;
        console.log(lastPool);
    }
    console.log(pools);

    // const pool = await PoolDatabase.poolData.findByIdAndUpdate(
    //     { _id: "8c0abd8a6d5da779772ba4b0", factory: factory },
    //     { protocolIndex: 1 }
    // );

    // console.log(pool);

    // const contract = new Contract(
    //     factory,
    //     UniswapV2Constants.uniswapV2FactoryAbi
    // );
    // console.log(contract.allPairsLength);

    // await CreatePool.archiveAndStore(polygon, 0, polygon.block());
    // await MeshSwapInitializer.initialize(polygon);
    // console.log(UniswapV2Constants.factoriesByChain(137));

    // const chainId = 137;

    // console.time("getToken");
    // const token0 = TokenConstants.getToken("USDC", chainId);
    // const token1 = TokenConstants.getToken("WETH", chainId);
    // console.timeEnd("getToken");

    // console.time("getPoolIdsByTokens");
    // const poolIds = await db.getPoolIdsByTokens(token0, token1, chainId);
    // console.timeEnd("getPoolIdsByTokens");

    // console.time("getPoolsById");
    // const pools = await db.getPoolsById(poolIds);
    // console.timeEnd("getPoolsById");

    // console.time("getToken");
    // const _token0 = TokenConstants.getToken("USDT", chainId);
    // const _token1 = TokenConstants.getToken("WETH", chainId);
    // console.timeEnd("getToken");

    // console.time("getPoolIdsByTokens");
    // const _poolIds = await db.getPoolIdsByTokens(_token0, _token1, chainId);
    // console.timeEnd("getPoolIdsByTokens");

    // console.time("getPoolsById");
    // await db.getPoolsById(_poolIds);
    // console.timeEnd("getPoolsById");

    // console.log(pools);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

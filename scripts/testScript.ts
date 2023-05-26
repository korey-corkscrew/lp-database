import invariant from "tiny-invariant";
import { TokenConstants } from "./tokenConstants";
import { env } from "process";
import { Provider } from "./provider";
import { Database } from "./Database/database";

async function main() {
    const dotenv = require("dotenv");
    dotenv.config();

    /* ----------- Create database instance ----------- */
    const db = new Database(env.MONGODB_URL);
    await db.connect();

    const polygon = new Provider(env.POLYGON_RPC_WS);
    await polygon.initialize();

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

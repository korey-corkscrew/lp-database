import { env } from "process";
import { UniswapV2Initializer } from "./UniswapV2/uniswapV2Initializer";
import { Provider } from "./provider";
import { Database } from "./Database/database";

async function main() {
    const dotenv = require("dotenv");
    dotenv.config();

    /* ----------- Create database instance ----------- */
    const db = new Database(env.MONGODB_URL);
    await db.connect();

    /* ----------- Create websocket providers ----------- */

    const polygon = new Provider(env.POLYGON_RPC_WS);
    await polygon.initialize();

    const arbitrum = new Provider(env.ARBITRUM_RPC_WS);
    await arbitrum.initialize();

    const ethereum = new Provider(env.ETHEREUM_RPC_WS);
    await ethereum.initialize();

    /* ----------- Initialize databases ----------- */
    await UniswapV2Initializer.initialize(polygon);
    // await UniswapV2Initializer.initialize(arbitrum);
    // await UniswapV2Initializer.initialize(ethereum);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

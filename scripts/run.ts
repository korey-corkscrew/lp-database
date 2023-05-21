import { WebSocketProvider } from "@ethersproject/providers";
import { env } from "process";
import { TokenDatabase } from "./tokenDatabase";
import invariant from "tiny-invariant";
import { UniswapV2Initializer } from "./UniswapV2/uniswapV2Initializer";

async function main() {
    const dotenv = require("dotenv");
    dotenv.config();

    /* ----------- Create database instance ----------- */
    invariant(env.MONGODB_URL, "Environment variable missing: MONGODB_URL");
    const db = new TokenDatabase(env.MONGODB_URL);
    await db.connect();

    /* ----------- Create websocket providers ----------- */
    // Polygon
    invariant(
        env.POLYGON_RPC_WS,
        "Environment variable missing: POLYGON_RPC_WS"
    );
    const polygon = new WebSocketProvider(env.POLYGON_RPC_WS);

    // Arbitrum
    invariant(
        env.ARBITRUM_RPC_WS,
        "Environment variable missing: ARBITRUM_RPC_WS"
    );
    const arbitrum = new WebSocketProvider(env.ARBITRUM_RPC_WS);

    // Ethereum
    invariant(
        env.ETHEREUM_RPC_WS,
        "Environment variable missing: ETHEREUM_RPC_WS"
    );
    const ethereum = new WebSocketProvider(env.ETHEREUM_RPC_WS);

    /* ----------- Initialize databases ----------- */
    await UniswapV2Initializer.initialize(polygon, db);
    await UniswapV2Initializer.initialize(arbitrum, db);
    await UniswapV2Initializer.initialize(ethereum, db);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

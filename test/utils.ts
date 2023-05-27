import { env } from "process";
import { Provider } from "../scripts/provider";
import { Database } from "../scripts/Database/database";

export function getRpcUrls() {
    const dotenv = require("dotenv");
    dotenv.config();

    return [
        env.ARBITRUM_RPC_WS,
        env.ETHEREUM_RPC_WS,
        env.POLYGON_RPC_WS,
        env.OPTIMISM_RPC_WS,
    ];
}

export async function getRpcs() {
    const rpcUrls = getRpcUrls();
    const rpcs = new Array();
    for (const rpcUrl of rpcUrls) {
        const rpc = new Provider(rpcUrl);
        await rpc.initialize();
        rpcs.push(rpc);
    }
    return rpcs;
}

export async function getDatabase() {
    const db = new Database(env.MONGODB_URL_DEV);
    await db.connect();
    return db;
}

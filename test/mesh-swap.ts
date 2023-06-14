import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MeshSwapInitializer } from "../scripts/uniswap-v2/mesh-swap/mesh-swap-initializer";
import { Provider } from "../scripts/utils/provider";
import { Database } from "../scripts/database/database";
import { env } from "process";
import { getDatabase, getRpcs } from "./utils";
import { PoolDatabase } from "../scripts/database/pool-database";
import { MeshSwapPool } from "../scripts/uniswap-v2/mesh-swap/db/pool";
import exp from "constants";

describe("mesh swap", function () {
    let providers: Provider[];
    let db: Database;

    before(async function () {
        providers = await getRpcs();
        providers.map((provider) => {
            expect(provider.initialized(), `provider not initialized`);
        });

        db = await getDatabase();
        expect(db.connected(), "db not connected");
    });

    it("check databases by chain", async function () {
        for (const provider of providers) {
            const pools = await MeshSwapPool.getAllPoolsByChain(
                provider.chainId()
            );
            console.log(pools);
        }
    });

    it("getLogs", async function () {
        const provider = providers[0];
        const block = provider.block();
        provider.provider().on("latest", (event) => {
            console.log(event);
        });
        // .getLogs({ fromBlock: block, toBlock: block });
        // console.log(logs);
    });
});

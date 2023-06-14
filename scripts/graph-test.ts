const { request, gql } = require("graphql-request");

const API_URL =
    "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-polygon";

export async function getPools(lastId: string) {
    let result = await request(
        API_URL,
        gql`
            {
                liquidityPools(first: 1000, where: { id_gt: "${lastId}" }) {
                    id
                }
            }
        `
    );
    return result.liquidityPools.map((pool: any) => pool.id);
}

export async function getTicks(lastId: string, block: number) {
    let result = await request(
        API_URL,
        gql`
            {
                ticks(block: {number: ${block}}, first: 1000, where: { id_gt: "${lastId}" }) {
                    id
                    index
                    liquidityNet
                }
            }
        `
    );
    return result.ticks;
}

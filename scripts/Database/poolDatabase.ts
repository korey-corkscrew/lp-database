import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { model, Schema } from "mongoose";
import invariant from "tiny-invariant";
import { PoolLookupDatabase } from "./poolLookupDatabase";

export interface IPoolData {
    pool: string;
    token0: string;
    token1: string;
    factory: string;
    reserve0: BigNumber;
    reserve1: BigNumber;
    chainId: number;
    data: string;
    blockUpdated: number;
    blockCreated: number;
    protocolIndex: number;
}

export class PoolDatabase {
    private static readonly _poolSchema = new Schema<IPoolData>({
        pool: { type: String, required: true },
        token0: { type: String, required: true },
        token1: { type: String, required: true },
        factory: { type: String, required: true },
        reserve0: { type: String, required: true },
        reserve1: { type: String, required: true },
        chainId: { type: Number, required: true },
        data: { type: String, required: true },
        blockUpdated: { type: Number, required: true },
        blockCreated: { type: Number, required: true },
        protocolIndex: { type: Number, required: true },
    });
    public static readonly poolData = model<IPoolData>(
        "PoolData",
        this._poolSchema
    );

    public static async getAllPoolAddresses(_chainId: number) {
        const pools = await this.poolData.find({ chainId: _chainId });
        return pools.map((pool) => {
            return pool.pool;
        });
    }

    public static async getLastCreatedPoolBlock(_chainId: number) {
        const pools = await this.poolData
            .find({ chainId: _chainId })
            .sort({ blockCreated: -1 });
        if (pools.length == 0) return 0;
        const pool = pools[0];
        return pool.blockCreated;
    }

    public static async getLastUpdatedPoolBlock(_chainId: number) {
        const pools = await this.poolData
            .find({ chainId: _chainId })
            .sort({ blockUpdated: -1 });
        if (pools.length == 0) return 0;
        const pool = pools[0];
        return pool.blockUpdated;
    }

    public static async getFirstUpdatedPoolBlock(_chainId: number) {
        const pools = await this.poolData
            .find({ chainId: _chainId })
            .sort({ blockUpdated: 1 });
        if (pools.length == 0) return 0;
        const pool = pools[0];
        return pool.blockUpdated;
    }

    public static async setPool(
        _pool: string,
        _token0: string,
        _token1: string,
        _factory: string,
        _chainId: number,
        _data: string,
        _blockCreated: number,
        _protocolIndex: number
    ): Promise<void> {
        await this._setPool(
            _pool,
            _token0,
            _token1,
            _factory,
            _chainId,
            _data,
            _blockCreated,
            _protocolIndex
        );
    }

    public static async getPoolByAddress(
        _pool: string,
        _chainId: number
    ): Promise<IPoolData | null> {
        const hash = ethers.utils.solidityKeccak256(
            ["address", "uint256"],
            [_pool, _chainId]
        );
        const id = hash.slice(2, 26);
        return await this._getPoolById(id);
    }

    public static async getPoolById(_id: string): Promise<IPoolData | null> {
        return await this._getPoolById(_id);
    }

    public static async getPoolsById(
        _ids: string[]
    ): Promise<(IPoolData | null)[]> {
        let pools = [];
        for (let id of _ids) {
            pools.push(await this._getPoolById(id));
        }
        return pools;
    }

    public static async updatePoolReserves(
        _pool: string,
        _chainId: number,
        _reserve0: BigNumber,
        _reserve1: BigNumber,
        _blockUpdated: number
    ) {
        const hash = ethers.utils.solidityKeccak256(
            ["address", "uint256"],
            [_pool, _chainId]
        );
        const id = hash.slice(2, 26);

        await this.poolData.findByIdAndUpdate(id, {
            reserve0: _reserve0.toString(),
            reserve1: _reserve1.toString(),
            blockUpdated: _blockUpdated,
        });
    }

    public static async updatePoolData(
        _pool: string,
        _chainId: number,
        _data: string
    ) {
        const hash = ethers.utils.solidityKeccak256(
            ["address", "uint256"],
            [_pool, _chainId]
        );
        const id = hash.slice(2, 26);

        await this.poolData.findByIdAndUpdate(id, {
            data: _data,
        });
    }

    private static async _setPool(
        _pool: string,
        _token0: string,
        _token1: string,
        _factory: string,
        _chainId: number,
        _data: string,
        _blockCreated: number,
        _protocolIndex: number
    ): Promise<void> {
        const idHash = ethers.utils.solidityKeccak256(
            ["address", "uint256"],
            [_pool, _chainId]
        );

        // MongoDB object ID needs to be 12 bytes
        const id = idHash.slice(2, 26);

        await this.poolData.findByIdAndUpdate(
            id,
            {
                $setOnInsert: {
                    pool: _pool,
                    token0: _token0,
                    token1: _token1,
                    factory: _factory,
                    chainId: _chainId,
                    data: _data,
                    blockCreated: _blockCreated,
                    protocolIndex: _protocolIndex,
                    reserve0: BigNumber.from(0),
                    reserve1: BigNumber.from(0),
                    blockUpdated: 0,
                },
            },
            { upsert: true }
        );

        await PoolLookupDatabase.setPoolLookup(
            _token0,
            _token1,
            _pool,
            _chainId
        );
    }

    private static async _getPoolById(_id: string): Promise<IPoolData | null> {
        const pool = await this.poolData.findById(_id);
        // invariant(pool, `Pool ID: [ ${_id} ] not found in the database`);
        if (pool == null) return null;
        return {
            pool: pool.pool,
            token0: pool.token0,
            token1: pool.token1,
            factory: pool.factory,
            reserve0: BigNumber.from(pool.reserve0),
            reserve1: BigNumber.from(pool.reserve1),
            chainId: pool.chainId,
            data: pool.data,
            blockUpdated: pool.blockUpdated,
            blockCreated: pool.blockCreated,
            protocolIndex: pool.protocolIndex,
        };
    }
}

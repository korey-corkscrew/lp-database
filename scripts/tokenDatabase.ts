import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { connect, model, Schema } from "mongoose";
import invariant from "tiny-invariant";

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

export interface IPoolLookup {
    token0: string;
    token1: string;
    chainId: number;
    poolIds: string[];
}

export interface IERC20 {
    address: string;
    name: string;
    symbol: string;
    decimals: string;
    chainId: number;
}

export class TokenDatabase {
    private readonly _poolSchema = new Schema<IPoolData>({
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
    private readonly _poolLookupSchema = new Schema<IPoolLookup>({
        token0: { type: String, required: true },
        token1: { type: String, required: true },
        chainId: { type: Number, required: true },
        poolIds: { type: [String], required: true },
    });
    private readonly _poolData = model<IPoolData>("PoolData", this._poolSchema);
    private readonly _poolLookup = model<IPoolLookup>(
        "PoolLookup",
        this._poolLookupSchema
    );
    private _connected: boolean = false;
    public readonly databaseUrl: string;

    constructor(_databaseUrl: string) {
        this.databaseUrl = _databaseUrl;
    }

    public connected(): boolean {
        return this._connected;
    }

    public async connect(): Promise<void> {
        await connect(this.databaseUrl);
        this._connected = true;
    }

    public async getAllPoolAddresses(_chainId: number) {
        const pools = await this._poolData.find({ chainId: _chainId });
        return pools.map((pool) => {
            return pool.pool;
        });
    }

    public async getLastCreatedPoolBlock(_chainId: number) {
        const pools = await this._poolData
            .find({ chainId: _chainId })
            .sort({ blockCreated: -1 });
        if (pools.length == 0) return 0;
        const pool = pools[0];
        return pool.blockCreated;
    }

    public async getLastUpdatedPoolBlock(_chainId: number) {
        const pools = await this._poolData
            .find({ chainId: _chainId })
            .sort({ blockUpdated: -1 });
        if (pools.length == 0) return 0;
        const pool = pools[0];
        return pool.blockUpdated;
    }

    public async getFirstUpdatedPoolBlock(_chainId: number) {
        const pools = await this._poolData
            .find({ chainId: _chainId })
            .sort({ blockUpdated: 1 });
        if (pools.length == 0) return 0;
        const pool = pools[0];
        return pool.blockUpdated;
    }

    public async setPool(
        _pool: string,
        _token0: string,
        _token1: string,
        _factory: string,
        _chainId: number,
        _data: string,
        _blockCreated: number,
        _protocolIndex: number
    ): Promise<void> {
        this._isConnected();
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

    public async getPoolIdsByTokens(
        _token0: string,
        _token1: string,
        _chainId: number
    ): Promise<string[]> {
        const hash = ethers.utils.solidityKeccak256(
            ["address", "address", "uint256"],
            [_token0, _token1, _chainId]
        );
        const id = hash.slice(2, 26);
        const pools = await this._poolLookup.findById(id);
        if (pools) {
            return pools.poolIds;
        }
        return [];
    }

    public async getPoolByAddress(
        _pool: string,
        _chainId: number
    ): Promise<IPoolData> {
        this._isConnected();
        const hash = ethers.utils.solidityKeccak256(
            ["address", "uint256"],
            [_pool, _chainId]
        );
        const id = hash.slice(2, 26);
        return await this._getPoolById(id);
    }

    public async getPoolById(_id: string): Promise<IPoolData> {
        this._isConnected();
        return await this._getPoolById(_id);
    }

    public async getPoolsById(_ids: string[]): Promise<IPoolData[]> {
        this._isConnected();
        let pools = [];
        for (let id of _ids) {
            pools.push(await this._getPoolById(id));
        }
        return pools;
    }

    public async updatePoolReserves(
        _pool: string,
        _chainId: number,
        _reserve0: BigNumber,
        _reserve1: BigNumber,
        _blockUpdated: number
    ) {
        this._isConnected();
        const hash = ethers.utils.solidityKeccak256(
            ["address", "uint256"],
            [_pool, _chainId]
        );
        const id = hash.slice(2, 26);

        await this._poolData.findByIdAndUpdate(id, {
            reserve0: _reserve0.toString(),
            reserve1: _reserve1.toString(),
            blockUpdated: _blockUpdated,
        });
    }

    private _isConnected() {
        invariant(this._connected, "Not connected to the database");
    }

    private async _setPoolLookup(
        _token0: string,
        _token1: string,
        _pool: string,
        _chainId: number
    ) {
        const hash0 = ethers.utils.solidityKeccak256(
            ["address", "address", "uint256"],
            [_token0, _token1, _chainId]
        );
        const hash1 = ethers.utils.solidityKeccak256(
            ["address", "address", "uint256"],
            [_token1, _token0, _chainId]
        );
        const id0 = hash0.slice(2, 26);
        const id1 = hash1.slice(2, 26);

        const poolIdHash = ethers.utils.solidityKeccak256(
            ["address", "uint256"],
            [_pool, _chainId]
        );
        const poolId = poolIdHash.slice(2, 26);

        let lookup0 = await this._poolLookup.findById(id0);
        if (lookup0) {
            await this._poolLookup.findByIdAndUpdate(id0, {
                poolIds: [...lookup0.poolIds, poolId],
            });
        } else {
            lookup0 = new this._poolLookup({
                _id: id0,
                token0: _token0,
                token1: _token1,
                chainId: _chainId,
                poolIds: [poolId],
            });
            await lookup0.save();
        }

        let lookup1 = await this._poolLookup.findById(id1);
        if (lookup1) {
            await this._poolLookup.findByIdAndUpdate(id1, {
                poolIds: [...lookup1.poolIds, poolId],
            });
        } else {
            lookup1 = new this._poolLookup({
                _id: id1,
                token0: _token1,
                token1: _token0,
                chainId: _chainId,
                poolIds: [poolId],
            });
            await lookup1.save();
        }
    }

    private async _setPool(
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

        // Create pool object
        const pool = new this._poolData({
            _id: id,
            pool: _pool,
            token0: _token0,
            token1: _token1,
            factory: _factory,
            reserve0: BigNumber.from(0),
            reserve1: BigNumber.from(0),
            chainId: _chainId,
            data: _data,
            blockUpdated: 0,
            blockCreated: _blockCreated,
            protocolIndex: _protocolIndex,
        });

        // Save the pool to the db
        await pool.save();

        await this._setPoolLookup(_token0, _token1, _pool, _chainId);
    }

    private async _getPoolById(_id: string): Promise<IPoolData> {
        const pool = await this._poolData.findById(_id);
        invariant(pool, `Pool ID: [ ${_id} ] not found in the database`);
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

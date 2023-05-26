import { ethers } from "hardhat";
import { model, Schema } from "mongoose";

export interface IPoolLookup {
    token0: string;
    token1: string;
    chainId: number;
    poolIds: string[];
}

export class PoolLookupDatabase {
    private static readonly _poolLookupSchema = new Schema<IPoolLookup>({
        token0: { type: String, required: true },
        token1: { type: String, required: true },
        chainId: { type: Number, required: true },
        poolIds: { type: [String], required: true },
    });
    private static readonly _poolLookup = model<IPoolLookup>(
        "PoolLookup",
        this._poolLookupSchema
    );

    public static async getPoolIdsByTokens(
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

    public static async setPoolLookup(
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
}

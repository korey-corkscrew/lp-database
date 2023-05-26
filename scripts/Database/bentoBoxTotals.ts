import { BigNumber, BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { model, Schema } from "mongoose";
import invariant from "tiny-invariant";

export interface IBentoBoxTotal {
    token: string;
    base: BigNumber;
    elastic: BigNumber;
    blockUpdated: number;
    chainId: number;
}

export class BentoBoxTotalsDatabase {
    private static readonly _totalSchema = new Schema<IBentoBoxTotal>({
        token: { type: String, required: true },
        base: { type: String, required: true },
        elastic: { type: Number, required: true },
        blockUpdated: { type: Number, required: true },
        chainId: { type: Number, required: true },
    });
    private static readonly _total = model<IBentoBoxTotal>(
        "BentoBoxTotal",
        this._totalSchema
    );

    public static async getTotals(
        _token: string,
        _chainId: number
    ): Promise<IBentoBoxTotal> {
        const hash = ethers.utils.solidityKeccak256(
            ["address", "uint256"],
            [_token, _chainId]
        );
        const id = hash.slice(2, 26);
        const totals = await this._total.findById(id);
        if (totals) {
            return {
                token: totals.token,
                base: BigNumber.from(totals.base),
                elastic: BigNumber.from(totals.elastic),
                blockUpdated: totals.blockUpdated,
                chainId: totals.chainId,
            };
        }
        return {
            token: _token,
            base: BigNumber.from(0),
            elastic: BigNumber.from(0),
            blockUpdated: 0,
            chainId: _chainId,
        };
    }

    private static async _setTotals(
        _token: string,
        _base: BigNumber,
        _elastic: BigNumber,
        _chainId: number,
        _block: number
    ) {
        const hash = ethers.utils.solidityKeccak256(
            ["address", "uint256"],
            [_token, _chainId]
        );

        const id = hash.slice(2, 26);

        const totals = new this._total({
            _id: id,
            token: _token,
            base: _base.toString(),
            elastic: _elastic.toString(),
            blockUpdated: _block,
            chainId: _chainId,
        });
        await totals.save();
    }

    public static async updateTotals(
        token: string,
        base: BigNumber,
        elastic: BigNumber,
        block: number,
        chainId: number
    ) {
        const hash = ethers.utils.solidityKeccak256(
            ["address", "uint256"],
            [token, chainId]
        );

        const id = hash.slice(2, 26);

        const totals = await this._total.findById(id);

        if (totals == null) {
            await this._setTotals(
                token,
                BigNumber.from(0),
                BigNumber.from(0),
                chainId,
                0
            );
        }

        await this._total.findByIdAndUpdate(id, {
            base: base.toString(),
            elastic: elastic.toString(),
            blockUpdated: block,
        });
    }
}

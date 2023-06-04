import { ethers } from "hardhat";
import { model, Schema } from "mongoose";

export interface IChain {
    block: number;
}

export class ChainDatabase {
    private static readonly _chainSchema = new Schema<IChain>({
        block: { type: Number, required: true },
    });
    private static readonly _chain = model<IChain>("Chain", this._chainSchema);

    public static async getChainBlock(_chainId: number): Promise<number> {
        const chain = await this._chain.findById(_chainId);
        if (chain) return chain.block;
        return 0;
    }

    public static async updateChain(_chainId: number, _block: number) {
        await this._chain.findByIdAndUpdate(
            _chainId,
            {
                block: _block,
            },
            { upsert: true }
        );
    }
}

import { ethers } from "hardhat";
import { model, Schema } from "mongoose";

export interface IProtocol {
    initialized: boolean;
    chainId: number;
    protocolIndex: number;
}

export class ProtocolDatabase {
    private static readonly _protocolSchema = new Schema<IProtocol>({
        initialized: { type: Boolean, required: true },
        chainId: { type: Number, required: true },
        protocolIndex: { type: Number, required: true },
    });
    private static readonly _protocol = model<IProtocol>(
        "Protocol",
        this._protocolSchema
    );

    public static async getProtocol(
        _chainId: number,
        _protocolIndex: number,
        _salt?: string
    ): Promise<IProtocol | null> {
        let hash: string;
        if (_salt) {
            hash = ethers.utils.solidityKeccak256(
                ["uint256", "uint256", "string"],
                [_protocolIndex, _chainId, _salt]
            );
        } else {
            hash = ethers.utils.solidityKeccak256(
                ["uint256", "uint256"],
                [_protocolIndex, _chainId]
            );
        }

        const id = hash.slice(2, 26);

        return await this._protocol.findById(id);
    }

    public static async updateProtocol(
        _chainId: number,
        _protocolIndex: number,
        _initialized: boolean,
        _salt?: string
    ) {
        let hash: string;
        if (_salt) {
            hash = ethers.utils.solidityKeccak256(
                ["uint256", "uint256", "string"],
                [_protocolIndex, _chainId, _salt]
            );
        } else {
            hash = ethers.utils.solidityKeccak256(
                ["uint256", "uint256"],
                [_protocolIndex, _chainId]
            );
        }

        const id = hash.slice(2, 26);
        await this._protocol.findByIdAndUpdate(id, {
            initialized: _initialized,
        });
    }

    public static async setProtocol(
        _chainId: number,
        _protocolIndex: number,
        _salt?: string
    ) {
        let hash: string;
        if (_salt) {
            hash = ethers.utils.solidityKeccak256(
                ["uint256", "uint256", "string"],
                [_protocolIndex, _chainId, _salt]
            );
        } else {
            hash = ethers.utils.solidityKeccak256(
                ["uint256", "uint256"],
                [_protocolIndex, _chainId]
            );
        }

        const id = hash.slice(2, 26);

        await this._protocol.findByIdAndUpdate(
            id,
            {
                $setOnInsert: {
                    initialized: false,
                    chainId: _chainId,
                    protocolIndex: _protocolIndex,
                },
            },
            { upsert: true }
        );
    }
}

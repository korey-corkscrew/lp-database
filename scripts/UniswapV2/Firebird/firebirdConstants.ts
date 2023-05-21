import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export class FirebirdConstants {
    public static readonly firebirdFactoryAbi =
        require("../../../artifacts/contracts/interfaces/IFirebirdFactory.sol/IFirebirdFactory.json")
            .abi;
    public static readonly IFirebirdFactory = new ethers.utils.Interface(
        this.firebirdFactoryAbi
    );
    public static readonly factories = [
        {
            factory: "0x5De74546d3B86C8Df7FEEc30253865e1149818C8",
            chainId: 137,
        },
    ];
}

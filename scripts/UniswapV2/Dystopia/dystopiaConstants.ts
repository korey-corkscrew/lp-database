import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export class DystopiaConstants {
    public static readonly dystopiaFactoryAbi =
        require("../../../artifacts/contracts/interfaces/IDystopiaFactory.sol/IDystopiaFactory.json")
            .abi;
    public static readonly IDystopiaFactory = new ethers.utils.Interface(
        this.dystopiaFactoryAbi
    );
    public static readonly factories = [
        {
            factory: "0x1d21Db6cde1b18c7E47B0F7F42f4b3F68b9beeC9",
            router: "",
            fee: 2000,
            feeBase: BigNumber.from(10).pow(32),
            initCodeHash:
                "0x009bce6d7eb00d3d075e5bd9851068137f44bba159f1cde806a268e20baaf2e8",
            protocol: "DYSTOPIA",
            chainId: 137,
            startBlock: 27986220,
        },
    ];
}

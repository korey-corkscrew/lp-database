import { ethers } from "hardhat";
import invariant from "tiny-invariant";

export class BentoBoxConstants {
    private static readonly _bentoBoxDeployerAbi =
        require("../../../artifacts/contracts/interfaces/IBentoBoxMasterDeployer.sol/IBentoBoxMasterDeployer.json")
            .abi;
    public static readonly IBentoBoxMasterDeployer = new ethers.utils.Interface(
        this._bentoBoxDeployerAbi
    );

    private static readonly _bentoBoxPoolAbi =
        require("../../../artifacts/contracts/interfaces/IBentoBoxPool.sol/IBentoBoxPool.json")
            .abi;
    public static readonly IBentoBoxPool = new ethers.utils.Interface(
        this._bentoBoxPoolAbi
    );

    private static readonly _bentoBoxAbi =
        require("../../../artifacts/contracts/interfaces/IBentoBox.sol/BentoBoxV1.json")
            .abi;
    public static readonly IBentoBox = new ethers.utils.Interface(
        this._bentoBoxAbi
    );
    private static readonly _masterDeployers = new Map<number, string>([
        [137, "0x351447fc9bd20A917783E159e61E86EDDA0b0187"],
    ]);
    private static readonly _constantFactories = new Map<number, string>([
        [137, "0x05689fCfeE31FCe4a67FbC7Cab13E74F80A4E288"],
    ]);
    private static readonly _bentoBoxes = new Map<number, string>([
        [137, "0x0319000133d3AdA02600f0875d2cf03D442C3367"],
    ]);

    public static masterDeployer(chainId: number) {
        const deployer = this._masterDeployers.get(chainId);
        invariant(deployer, "Bento Box Master Deployer is undefined");
        return deployer;
    }

    public static isConstantProductFactory(factory: string, chainId: number) {
        const _factory = this._constantFactories.get(chainId);
        if (_factory && _factory == factory) return true;
        return false;
    }

    public static bentoBox(chainId: number) {
        return this._bentoBoxes.get(chainId);
    }
}

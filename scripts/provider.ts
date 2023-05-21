import { WebSocketProvider } from "@ethersproject/providers";
import invariant from "tiny-invariant";

export class Provider {
    private readonly _provider: WebSocketProvider;
    private _chainId: number = 0;
    private _block: number = 0;
    private _initalized: boolean = false;

    constructor(_rpcWebSocket: string | undefined) {
        invariant(_rpcWebSocket, "RPC web socket environment variable missing");
        this._provider = new WebSocketProvider(_rpcWebSocket);
        this._provider.on("block", async (block) => {
            this._block = block;
        });
    }

    public async initialize() {
        if (this._initalized) return;
        this._chainId = (await this._provider.getNetwork()).chainId;
        this._initalized = true;
    }

    public block(): number {
        this._isInitialized();
        return this._block;
    }

    public chainId(): number {
        this._isInitialized();
        return this._chainId;
    }

    public provider(): WebSocketProvider {
        this._isInitialized();
        return this._provider;
    }

    private _isInitialized() {
        invariant(this._initalized, "Listener not initialized");
    }
}

import { connect } from "mongoose";
import invariant from "tiny-invariant";

export class Database {
    private readonly databaseUrl: string;
    private _connected: boolean = false;

    constructor(_databaseUrl: string | undefined) {
        invariant(_databaseUrl, "Database URL is undefined");
        this.databaseUrl = _databaseUrl;
    }

    public connected(): boolean {
        return this._connected;
    }

    public async connect(): Promise<void> {
        await connect(this.databaseUrl);
        this._connected = true;
    }
}

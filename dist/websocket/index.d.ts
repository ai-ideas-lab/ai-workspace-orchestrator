import { Server as HttpServer } from 'http';
import { Config } from '../utils/config.js';
import { Server as WebSocketServer } from 'ws';
interface WebSocketMessage {
    type: 'workflow_update' | 'execution_status' | 'system_status';
    payload: any;
    timestamp: Date;
}
export declare function setupWebSocket(server: HttpServer, config: Config): {
    wss: WebSocketServer<typeof import("ws"), typeof import("http").IncomingMessage>;
    broadcast: (message: WebSocketMessage) => void;
};
export type { WebSocketMessage };
//# sourceMappingURL=index.d.ts.map
import { logger } from '../utils/logger.js';
import { Server as WebSocketServer } from 'ws';
export function setupWebSocket(server, config) {
    try {
        const wss = new WebSocketServer({
            server,
            path: '/ws'
        });
        const connections = new Set();
        wss.on('connection', (ws) => {
            logger.info('WebSocket client connected');
            connections.add(ws);
            const welcomeMessage = {
                type: 'system_status',
                payload: {
                    status: 'connected',
                    timestamp: new Date(),
                    availableProviders: getAvailableAIProviders(config)
                },
                timestamp: new Date()
            };
            ws.send(JSON.stringify(welcomeMessage));
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    logger.debug('Received WebSocket message:', data);
                }
                catch (error) {
                    logger.error('Error parsing WebSocket message:', error);
                    ws.send(JSON.stringify({
                        type: 'system_status',
                        payload: { error: 'Invalid message format' },
                        timestamp: new Date()
                    }));
                }
            });
            ws.on('close', () => {
                logger.info('WebSocket client disconnected');
                connections.delete(ws);
            });
            ws.on('error', (error) => {
                logger.error('WebSocket error:', error);
                connections.delete(ws);
            });
        });
        function broadcast(message) {
            const messageStr = JSON.stringify(message);
            connections.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(messageStr);
                }
            });
        }
        export function notifyWorkflowUpdate(workflowId, status) {
            broadcast({
                type: 'workflow_update',
                payload: { workflowId, status },
                timestamp: new Date()
            });
        }
        export function notifyExecutionUpdate(executionId, status, data) {
            broadcast({
                type: 'execution_status',
                payload: { executionId, status, data },
                timestamp: new Date()
            });
        }
        export function notifySystemStatus(status) {
            broadcast({
                type: 'system_status',
                payload: { status, availableProviders: getAvailableAIProviders(config) },
                timestamp: new Date()
            });
        }
        logger.info(`WebSocket server started on port ${server.address()?.port}/ws`);
        return { wss, broadcast };
    }
    catch (error) {
        logger.error('WebSocket setup failed:', error);
        throw error;
    }
}
function getAvailableAIProviders(config) {
    const providers = [];
    if (config.ai.openai?.apiKey)
        providers.push('openai');
    if (config.ai.anthropic?.apiKey)
        providers.push('anthropic');
    if (config.ai.google?.apiKey)
        providers.push('google');
    return providers;
}
//# sourceMappingURL=index.js.map
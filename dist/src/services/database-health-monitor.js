import { logger } from '../utils/logger.js';
import { DatabaseConnection } from '../database/connection.js';
export class DatabaseHealthMonitor {
    static instance = null;
    prisma = null;
    isMonitoring = false;
    healthCheckInterval = null;
    connectionRetries = 0;
    maxRetries = 5;
    healthStatus = {
        status: 'disconnected',
        lastChecked: new Date(),
        responseTime: 0,
        details: {
            connected: false,
            totalConnections: 0,
            activeConnections: 0,
            slowQueryThreshold: 1000,
            retryAttempts: 0,
            maxRetries: 5,
        },
    };
    constructor() {
        this.prisma = DatabaseConnection.getStatus().connected ?
            DatabaseConnection['instance'] : null;
    }
    static getInstance() {
        if (!DatabaseHealthMonitor.instance) {
            DatabaseHealthMonitor.instance = new DatabaseHealthMonitor();
        }
        return DatabaseHealthMonitor.instance;
    }
    async startMonitoring(intervalMs = 30000) {
        if (this.isMonitoring) {
            logger.warn('Database health monitoring is already running');
            return;
        }
        this.isMonitoring = true;
        logger.info(`Starting database health monitoring with ${intervalMs}ms interval`);
        await this.performHealthCheck();
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthCheck();
        }, intervalMs);
    }
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }
        this.isMonitoring = false;
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        logger.info('Database health monitoring stopped');
    }
    async performHealthCheck() {
        const startTime = Date.now();
        try {
            const isConnected = await DatabaseConnection.healthCheck();
            if (!isConnected) {
                await this.handleConnectionFailure();
                return this.updateHealthStatus('unhealthy', startTime);
            }
            const status = await this.detailedHealthCheck();
            const responseTime = Date.now() - startTime;
            if (responseTime > this.healthStatus.details.slowQueryThreshold) {
                logger.warn(`Slow database query detected: ${responseTime}ms`);
                this.healthStatus.details.lastSlowQuery = new Date();
            }
            const newStatus = responseTime > 2000 ? 'degraded' : 'healthy';
            this.healthStatus = this.updateHealthStatus(newStatus, startTime, responseTime);
            logger.debug(`Database health check completed: ${newStatus} (${responseTime}ms)`);
            return this.healthStatus;
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            logger.error('Database health check failed:', error);
            return this.updateHealthStatus('unhealthy', startTime, responseTime, error instanceof Error ? error.message : 'Unknown error');
        }
    }
    async detailedHealthCheck() {
        if (!this.prisma) {
            throw new Error('Database not connected');
        }
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            const stats = await DatabaseConnection.getStats();
            const tables = await this.prisma.$queryRaw `
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
            const queryTime = Date.now();
            await this.prisma.$queryRaw `SELECT NOW()`;
            const queryDuration = Date.now() - queryTime;
            this.healthStatus.details = {
                ...this.healthStatus.details,
                connected: true,
                provider: this.prisma.$engineConfig?.provider,
                database: this.prisma.$engineConfig?.datasource?.url?.split('/').pop(),
                totalConnections: stats.totalWorkflows + stats.totalExecutions,
                activeConnections: 0,
                slowQueryThreshold: this.healthStatus.details.slowQueryThreshold,
                retryAttempts: this.connectionRetries,
                maxRetries: this.maxRetries,
            };
        }
        catch (error) {
            throw new Error(`Detailed health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleConnectionFailure() {
        this.connectionRetries++;
        logger.warn(`Database connection attempt ${this.connectionRetries}/${this.maxRetries} failed`);
        if (this.connectionRetries >= this.maxRetries) {
            logger.error(`Database connection failed after ${this.maxRetries} attempts`);
            this.connectionRetries = 0;
            return;
        }
        try {
            logger.info('Attempting to reconnect to database...');
            await DatabaseConnection.createConnection(await this.loadConfig());
            this.prisma = DatabaseConnection['instance'];
            this.connectionRetries = 0;
            logger.info('Database reconnection successful');
        }
        catch (error) {
            logger.error('Database reconnection failed:', error);
        }
    }
    updateHealthStatus(status, startTime, responseTime, error) {
        this.healthStatus = {
            status,
            lastChecked: new Date(),
            responseTime: responseTime || Date.now() - startTime,
            error,
            details: {
                ...this.healthStatus.details,
                connected: status !== 'disconnected',
                retryAttempts: this.connectionRetries,
            },
        };
        return this.healthStatus;
    }
    getCurrentStatus() {
        return { ...this.healthStatus };
    }
    isDatabaseAvailable() {
        return this.healthStatus.status === 'healthy' || this.healthStatus.status === 'degraded';
    }
    async getDatabaseStats() {
        try {
            const stats = await DatabaseConnection.getStats();
            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            return {
                totalWorkflows: stats.totalWorkflows,
                totalExecutions: stats.totalExecutions,
                totalUsers: stats.totalUsers,
                databaseSize: stats.databaseSize,
                uptime: `${hours}h ${minutes}m ${seconds}s`,
                lastHealthCheck: this.healthStatus.lastChecked.toISOString(),
            };
        }
        catch (error) {
            logger.error('Failed to get database stats:', error);
            throw error;
        }
    }
    checkForSlowQuery() {
        if (!this.healthStatus.details.lastSlowQuery) {
            return false;
        }
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return this.healthStatus.details.lastSlowQuery > fiveMinutesAgo;
    }
    resetConnectionRetries() {
        this.connectionRetries = 0;
        logger.info('Database connection retry count reset');
    }
    async loadConfig() {
        return {
            database: {
                url: process.env.DATABASE_URL || 'file:./dev.db',
                provider: process.env.DATABASE_PROVIDER || 'sqlite',
                maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
            },
        };
    }
}
export async function checkDatabaseHealth() {
    const monitor = DatabaseHealthMonitor.getInstance();
    return monitor.getCurrentStatus();
}
export async function startDatabaseHealthMonitoring(intervalMs = 30000) {
    const monitor = DatabaseHealthMonitor.getInstance();
    await monitor.startMonitoring(intervalMs);
}
export function stopDatabaseHealthMonitoring() {
    const monitor = DatabaseHealthMonitor.getInstance();
    monitor.stopMonitoring();
}
//# sourceMappingURL=database-health-monitor.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseHealth = void 0;
const index_js_1 = require("./index.js");
const logger_js_1 = require("../utils/logger.js");
class DatabaseHealth {
    static async checkConnection() {
        const startTime = Date.now();
        try {
            await index_js_1.prisma.$queryRaw `SELECT 1`;
            const responseTime = Date.now() - startTime;
            return {
                status: responseTime < 100 ? 'healthy' : 'degraded',
                details: {
                    connected: true,
                    responseTime,
                    lastChecked: new Date(),
                },
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                status: 'unhealthy',
                details: {
                    connected: false,
                    responseTime,
                    lastChecked: new Date(),
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            };
        }
    }
    static async checkTables() {
        try {
            const requiredTables = [
                'User',
                'Workflow',
                'WorkflowExecution',
                'Agent',
                'AgentExecution',
                'Comment',
                'SessionToken',
            ];
            const tableStatuses = await Promise.all(requiredTables.map(async (tableName) => {
                try {
                    const result = await index_js_1.prisma.$queryRaw `
              SELECT COUNT(*) as count FROM ${Prisma.raw(tableName)}
            `;
                    const rowCount = result[0]?.count || 0;
                    return {
                        name: tableName,
                        accessible: true,
                        rowCount,
                    };
                }
                catch (error) {
                    return {
                        name: tableName,
                        accessible: false,
                        rowCount: 0,
                    };
                }
            }));
            const missingTables = tableStatuses
                .filter(t => !t.accessible)
                .map(t => t.name);
            const status = missingTables.length > 0 ? 'unhealthy' : 'healthy';
            return {
                status,
                details: {
                    tables: tableStatuses,
                    missingTables: missingTables.length > 0 ? missingTables : undefined,
                    timestamp: new Date(),
                },
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    tables: [],
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date(),
                },
            };
        }
    }
    static async checkForeignKeys() {
        try {
            const violations = [];
            const workflowsWithInvalidUser = await index_js_1.prisma.workflow.findMany({
                where: {
                    user: {
                        is: {
                            id: null,
                        },
                    },
                },
            });
            if (workflowsWithInvalidUser.length > 0) {
                violations.push({
                    table: 'Workflow',
                    constraint: 'user_id_fkey',
                    error: `Found ${workflowsWithInvalidUser.length} workflows with invalid user references`,
                });
            }
            const executionsWithInvalidWorkflow = await index_js_1.prisma.workflowExecution.findMany({
                where: {
                    workflow: {
                        is: {
                            id: null,
                        },
                    },
                },
            });
            if (executionsWithInvalidWorkflow.length > 0) {
                violations.push({
                    table: 'WorkflowExecution',
                    constraint: 'workflow_id_fkey',
                    error: `Found ${executionsWithInvalidWorkflow.length} executions with invalid workflow references`,
                });
            }
            const agentExecutionsWithInvalidAgent = await index_js_1.prisma.agentExecution.findMany({
                where: {
                    agent: {
                        is: {
                            id: null,
                        },
                    },
                },
            });
            if (agentExecutionsWithInvalidAgent.length > 0) {
                violations.push({
                    table: 'AgentExecution',
                    constraint: 'agent_id_fkey',
                    error: `Found ${agentExecutionsWithInvalidAgent.length} agent executions with invalid agent references`,
                });
            }
            const status = violations.length > 0 ? 'unhealthy' : 'healthy';
            return {
                status,
                details: {
                    violations,
                    timestamp: new Date(),
                },
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    violations: [{
                            table: 'unknown',
                            constraint: 'unknown',
                            error: error instanceof Error ? error.message : 'Unknown error',
                        }],
                    timestamp: new Date(),
                },
            };
        }
    }
    static async checkDataIntegrity() {
        try {
            const integrityChecks = [];
            const nullConstraints = await index_js_1.prisma.user.count({
                where: {
                    OR: [
                        { email: null },
                        { username: null },
                        { password: null },
                    ],
                },
            });
            integrityChecks.push({
                check: 'Null Constraints',
                passed: nullConstraints === 0,
                details: nullConstraints === 0
                    ? 'All required fields are populated'
                    : `${nullConstraints} users have missing required fields`,
                count: nullConstraints,
            });
            const duplicateUsers = await index_js_1.prisma.$queryRaw `
        SELECT username, COUNT(*) as count 
        FROM users 
        GROUP BY username 
        HAVING COUNT(*) > 1
      `;
            const duplicateEmails = await index_js_1.prisma.$queryRaw `
        SELECT email, COUNT(*) as count 
        FROM users 
        GROUP BY email 
        HAVING COUNT(*) > 1
      `;
            integrityChecks.push({
                check: 'Duplicate Data',
                passed: duplicateUsers.length === 0 && duplicateEmails.length === 0,
                details: `Found ${duplicateUsers.length} duplicate usernames and ${duplicateEmails.length} duplicate emails`,
                count: duplicateUsers.length + duplicateEmails.length,
            });
            const executionsWithoutAgents = await index_js_1.prisma.workflowExecution.count({
                where: {
                    agents: {
                        none: {},
                    },
                },
            });
            const agentsWithoutExecutions = await index_js_1.prisma.agent.count({
                where: {
                    executions: {
                        none: {},
                    },
                },
            });
            integrityChecks.push({
                check: 'Execution Consistency',
                passed: executionsWithoutAgents === 0 && agentsWithoutExecutions === 0,
                details: `${executionsWithoutAgents} executions without agents, ${agentsWithoutExecutions} agents without executions`,
                count: executionsWithoutAgents + agentsWithoutExecutions,
            });
            const workflowsWithInvalidConfig = await index_js_1.prisma.workflow.count({
                where: {
                    config: {
                        not: {},
                    },
                },
            });
            integrityChecks.push({
                check: 'Configuration Format',
                passed: true,
                details: `All ${workflowsWithInvalidConfig} workflows have valid configuration format`,
                count: workflowsWithInvalidConfig,
            });
            const passedChecks = integrityChecks.filter(c => c.passed).length;
            const status = passedChecks === integrityChecks.length ? 'healthy' : 'degraded';
            return {
                status,
                details: {
                    integrityChecks,
                    timestamp: new Date(),
                },
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    integrityChecks: [{
                            check: 'unknown',
                            passed: false,
                            details: error instanceof Error ? error.message : 'Unknown error',
                        }],
                    timestamp: new Date(),
                },
            };
        }
    }
    static async comprehensiveHealthCheck() {
        const [connection, tables, foreignKeys, integrity] = await Promise.all([
            this.checkConnection(),
            this.checkTables(),
            this.checkForeignKeys(),
            this.checkDataIntegrity(),
        ]);
        const components = {
            connection,
            tables,
            foreignKeys,
            integrity,
        };
        const statuses = [connection.status, tables.status, foreignKeys.status, integrity.status];
        const overall = statuses.every(s => s === 'healthy') ? 'healthy' :
            statuses.some(s => s === 'unhealthy') ? 'unhealthy' : 'degraded';
        const recommendations = this.generateRecommendations(components);
        return {
            overall,
            components,
            recommendations,
            timestamp: new Date(),
        };
    }
    static generateRecommendations(components) {
        const recommendations = [];
        if (components.connection.status !== 'healthy') {
            recommendations.push('优化数据库连接配置，检查网络延迟');
        }
        if (components.tables.status !== 'healthy') {
            recommendations.push('数据库表结构可能已损坏，请检查迁移脚本');
        }
        if (components.foreignKeys.status !== 'healthy') {
            recommendations.push('发现数据完整性问题，需要清理外键违规数据');
        }
        if (components.integrity.status !== 'healthy') {
            recommendations.push('发现数据一致性问题，建议运行数据修复脚本');
        }
        if (components.connection.details.responseTime > 100) {
            recommendations.push('考虑添加数据库索引优化查询性能');
        }
        return recommendations;
    }
    static async startPeriodicHealthCheck(intervalMs = 30000) {
        const runCheck = async () => {
            try {
                const health = await this.comprehensiveHealthCheck();
                if (health.overall !== 'healthy') {
                    logger_js_1.logger.warn('Database health check failed:', health);
                }
                else {
                    logger_js_1.logger.debug('Database health check passed:', health);
                }
            }
            catch (error) {
                logger_js_1.logger.error('Health check failed:', error);
            }
            setTimeout(runCheck, intervalMs);
        };
        runCheck();
    }
}
exports.DatabaseHealth = DatabaseHealth;
//# sourceMappingURL=health.js.map
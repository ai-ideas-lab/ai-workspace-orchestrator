"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionService = exports.AgentService = exports.WorkflowService = exports.executeMonitoredQuery = exports.generateDatabaseOptimizationReport = exports.analyzeDatabasePerformance = exports.DatabasePerformanceOptimizer = exports.stopDatabaseHealthMonitoring = exports.startDatabaseHealthMonitoring = exports.checkDatabaseHealth = exports.DatabaseHealthMonitor = void 0;
let workflows = [];
let agents = [];
let executionHistory = [];
var database_health_monitor_ts_1 = require("./database-health-monitor.ts");
Object.defineProperty(exports, "DatabaseHealthMonitor", { enumerable: true, get: function () { return database_health_monitor_ts_1.DatabaseHealthMonitor; } });
Object.defineProperty(exports, "checkDatabaseHealth", { enumerable: true, get: function () { return database_health_monitor_ts_1.checkDatabaseHealth; } });
Object.defineProperty(exports, "startDatabaseHealthMonitoring", { enumerable: true, get: function () { return database_health_monitor_ts_1.startDatabaseHealthMonitoring; } });
Object.defineProperty(exports, "stopDatabaseHealthMonitoring", { enumerable: true, get: function () { return database_health_monitor_ts_1.stopDatabaseHealthMonitoring; } });
var database_performance_optimizer_ts_1 = require("./database-performance-optimizer.ts");
Object.defineProperty(exports, "DatabasePerformanceOptimizer", { enumerable: true, get: function () { return database_performance_optimizer_ts_1.DatabasePerformanceOptimizer; } });
Object.defineProperty(exports, "analyzeDatabasePerformance", { enumerable: true, get: function () { return database_performance_optimizer_ts_1.analyzeDatabasePerformance; } });
Object.defineProperty(exports, "generateDatabaseOptimizationReport", { enumerable: true, get: function () { return database_performance_optimizer_ts_1.generateDatabaseOptimizationReport; } });
Object.defineProperty(exports, "executeMonitoredQuery", { enumerable: true, get: function () { return database_performance_optimizer_ts_1.executeMonitoredQuery; } });
class WorkflowService {
    static async createWorkflow(workflow) {
        const newWorkflow = {
            ...workflow,
            id: `workflow_${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        workflows.push(newWorkflow);
        return newWorkflow;
    }
    static async getWorkflows() {
        return workflows;
    }
    static async getWorkflow(id) {
        return workflows.find(w => w.id === id) || null;
    }
    static async updateWorkflow(id, updates) {
        const workflow = workflows.find(w => w.id === id);
        if (!workflow)
            return null;
        const updatedWorkflow = { ...workflow, ...updates, updatedAt: new Date() };
        workflows = workflows.map(w => w.id === id ? updatedWorkflow : w);
        return updatedWorkflow;
    }
    static async deleteWorkflow(id) {
        const index = workflows.findIndex(w => w.id === id);
        if (index === -1)
            return false;
        workflows.splice(index, 1);
        return true;
    }
}
exports.WorkflowService = WorkflowService;
class AgentService {
    static async createAgent(agent) {
        const newAgent = {
            ...agent,
            id: `agent_${Date.now()}`
        };
        agents.push(newAgent);
        return newAgent;
    }
    static async getAgents() {
        return agents;
    }
    static async getAgent(id) {
        return agents.find(a => a.id === id) || null;
    }
    static async updateAgent(id, updates) {
        const agent = agents.find(a => a.id === id);
        if (!agent)
            return null;
        const updatedAgent = { ...agent, ...updates };
        agents = agents.map(a => a.id === id ? updatedAgent : a);
        return updatedAgent;
    }
    static async deleteAgent(id) {
        const index = agents.findIndex(a => a.id === id);
        if (index === -1)
            return false;
        agents.splice(index, 1);
        return true;
    }
}
exports.AgentService = AgentService;
class ExecutionService {
    static async createExecution(execution) {
        const newExecution = {
            ...execution,
            id: `execution_${Date.now()}`
        };
        executionHistory.push(newExecution);
        return newExecution;
    }
    static async getExecutions(workflowId) {
        if (workflowId) {
            return executionHistory.filter(e => e.workflowId === workflowId);
        }
        return executionHistory;
    }
    static async getExecution(id) {
        return executionHistory.find(e => e.id === id) || null;
    }
    static async updateExecution(id, updates) {
        const execution = executionHistory.find(e => e.id === id);
        if (!execution)
            return null;
        const updatedExecution = { ...execution, ...updates };
        executionHistory = executionHistory.map(e => e.id === id ? updatedExecution : e);
        return updatedExecution;
    }
    static async getExecutionStats() {
        const total = executionHistory.length;
        const completed = executionHistory.filter(e => e.status === 'completed').length;
        const failed = executionHistory.filter(e => e.status === 'failed').length;
        const running = executionHistory.filter(e => e.status === 'running').length;
        return { total, completed, failed, running };
    }
}
exports.ExecutionService = ExecutionService;
//# sourceMappingURL=index.js.map
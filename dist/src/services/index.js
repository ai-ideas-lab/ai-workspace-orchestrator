let workflows = [];
let agents = [];
let executionHistory = [];
export { DatabaseHealthMonitor, checkDatabaseHealth, startDatabaseHealthMonitoring, stopDatabaseHealthMonitoring } from './database-health-monitor.js';
export { DatabasePerformanceOptimizer, analyzeDatabasePerformance, generateDatabaseOptimizationReport, executeMonitoredQuery } from './database-performance-optimizer.js';
export class WorkflowService {
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
export class AgentService {
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
export class ExecutionService {
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
//# sourceMappingURL=index.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockDatabaseService = exports.MockDatabaseService = void 0;
class MockDatabaseService {
    constructor() {
        this.users = [];
        this.aiEngines = [];
        this.workflowExecutions = [];
    }
    async getAIEngines() {
        return this.aiEngines;
    }
    async getAIEngine(id) {
        return this.aiEngines.find(engine => engine.id === id);
    }
    async createAIEngine(data) {
        const newEngine = {
            id: Math.random().toString(36).substr(2, 9),
            name: data.name || '',
            type: data.type || 'text-generation',
            endpoint: data.endpoint || '',
            capabilities: data.capabilities || [],
            status: data.status || 'active',
            load: data.load || 0.0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        this.aiEngines.push(newEngine);
        return newEngine;
    }
    async updateAIEngine(id, data) {
        const index = this.aiEngines.findIndex(engine => engine.id === id);
        if (index !== -1) {
            this.aiEngines[index] = { ...this.aiEngines[index], ...data, updated_at: new Date().toISOString() };
            return this.aiEngines[index];
        }
        return null;
    }
    async deleteAIEngine(id) {
        const index = this.aiEngines.findIndex(engine => engine.id === id);
        if (index !== -1) {
            this.aiEngines.splice(index, 1);
            return true;
        }
        return false;
    }
    async getWorkflowExecutions(filters) {
        let executions = this.workflowExecutions;
        if (filters) {
            if (filters.status) {
                executions = executions.filter(exec => exec.status === filters.status);
            }
            if (filters.workflow_id) {
                executions = executions.filter(exec => exec.workflow_id === filters.workflow_id);
            }
            if (filters.limit) {
                executions = executions.slice(0, filters.limit);
            }
            if (filters.offset) {
                executions = executions.slice(filters.offset);
            }
        }
        return executions;
    }
    async createWorkflowExecution(data) {
        const newExecution = {
            id: Math.random().toString(36).substr(2, 9),
            workflow_id: data.workflow_id || '',
            user_id: data.user_id,
            status: data.status || 'running',
            trigger_data: data.trigger_data,
            result: data.result,
            error_message: data.error_message,
            started_at: data.started_at || new Date().toISOString(),
            completed_at: data.completed_at,
            execution_time_ms: data.execution_time_ms,
            created_at: new Date().toISOString(),
        };
        this.workflowExecutions.push(newExecution);
        return newExecution;
    }
    async updateWorkflowExecution(id, data) {
        const index = this.workflowExecutions.findIndex(exec => exec.id === id);
        if (index !== -1) {
            this.workflowExecutions[index] = { ...this.workflowExecutions[index], ...data };
            return this.workflowExecutions[index];
        }
        return null;
    }
    async getWorkflowExecutionStats() {
        const total = this.workflowExecutions.length;
        const completed = this.workflowExecutions.filter(exec => exec.status === 'completed').length;
        const successRate = total > 0 ? (completed / total) * 100 : 0;
        const averageExecutionTime = 1000;
        return {
            totalExecutions: total,
            successRate: successRate.toFixed(2) + '%',
            averageExecutionTime: averageExecutionTime,
        };
    }
    async getSystemStats() {
        return {
            totalEngines: this.aiEngines.length,
            activeEngines: this.aiEngines.filter(engine => engine.status === 'active').length,
            averageLoad: this.aiEngines.reduce((sum, engine) => sum + engine.load, 0) / this.aiEngines.length || 0,
            averageLatency: 150,
            totalRequests: 1000,
            database: {
                totalExecutions: this.workflowExecutions.length,
                successRate: '85%',
                averageExecutionTime: 1200,
            },
            status: 'healthy',
        };
    }
    async getUserByEmail(email) {
        return this.users.find(user => user.email === email);
    }
    async createUser(userData) {
        const newUser = {
            id: Math.random().toString(36).substr(2, 9),
            username: userData.username,
            email: userData.email,
            password_hash: userData.password_hash,
            role: userData.role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        this.users.push(newUser);
        return newUser;
    }
    async getUserById(id) {
        return this.users.find(user => user.id === id);
    }
    async updateUser(id, userData) {
        const index = this.users.findIndex(user => user.id === id);
        if (index !== -1) {
            this.users[index] = { ...this.users[index], ...userData, updated_at: new Date().toISOString() };
            return this.users[index];
        }
        return null;
    }
    async deleteUser(id) {
        const index = this.users.findIndex(user => user.id === id);
        if (index !== -1) {
            this.users.splice(index, 1);
            return true;
        }
        return false;
    }
}
exports.MockDatabaseService = MockDatabaseService;
exports.mockDatabaseService = new MockDatabaseService();
//# sourceMappingURL=mock-database-service.js.map
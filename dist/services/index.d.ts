import { Workflow, Agent, ExecutionHistory } from '../types';
export { DatabaseHealthMonitor, checkDatabaseHealth, startDatabaseHealthMonitoring, stopDatabaseHealthMonitoring } from './database-health-monitor.ts';
export { DatabasePerformanceOptimizer, analyzeDatabasePerformance, generateDatabaseOptimizationReport, executeMonitoredQuery } from './database-performance-optimizer.ts';
export declare class WorkflowService {
    static createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow>;
    static getWorkflows(): Promise<Workflow[]>;
    static getWorkflow(id: string): Promise<Workflow | null>;
    static updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null>;
    static deleteWorkflow(id: string): Promise<boolean>;
}
export declare class AgentService {
    static createAgent(agent: Omit<Agent, 'id'>): Promise<Agent>;
    static getAgents(): Promise<Agent[]>;
    static getAgent(id: string): Promise<Agent | null>;
    static updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | null>;
    static deleteAgent(id: string): Promise<boolean>;
}
export declare class ExecutionService {
    static createExecution(execution: Omit<ExecutionHistory, 'id'>): Promise<ExecutionHistory>;
    static getExecutions(workflowId?: string): Promise<ExecutionHistory[]>;
    static getExecution(id: string): Promise<ExecutionHistory | null>;
    static updateExecution(id: string, updates: Partial<ExecutionHistory>): Promise<ExecutionHistory | null>;
    static getExecutionStats(): Promise<{
        total: number;
        completed: number;
        failed: number;
        running: number;
    }>;
}
//# sourceMappingURL=index.d.ts.map
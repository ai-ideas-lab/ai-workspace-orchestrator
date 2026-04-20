import type { WorkflowStep } from './workflow-executor.js';
export interface DependencyReport {
    valid: boolean;
    executionLayers: string[][];
    cycles: string[][];
    orphanSteps: string[];
    unknownDependencies: string[];
    errors: string[];
    stats: {
        totalSteps: number;
        maxDepth: number;
        criticalPathLength: number;
    };
}
export declare class WorkflowDependencyAnalyzer {
    validate(steps: WorkflowStep[]): DependencyReport;
    detectCycles(steps: WorkflowStep[]): string[][];
    topologicalSort(steps: WorkflowStep[]): string[][];
    private findUnknownDependencies;
    private findOrphanSteps;
    private computeCriticalPathLength;
}
//# sourceMappingURL=workflow-dependency-analyzer.d.ts.map
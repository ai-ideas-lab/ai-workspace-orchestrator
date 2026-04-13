import type { WorkflowDefinition } from './workflow-executor.js';
export interface WorkflowSnapshot {
    id: string;
    workflowId: string;
    version: number;
    definition: WorkflowDefinition;
    message: string;
    createdAt: Date;
    createdBy?: string;
}
export interface StepDiff {
    stepId: string;
    stepName: string;
    change: 'added' | 'removed' | 'modified' | 'unchanged';
    fields?: string[];
}
export interface SnapshotDiff {
    fromVersion: number;
    toVersion: number;
    stepDiffs: StepDiff[];
    stepCountDelta: number;
    hasChanges: boolean;
}
export declare class WorkflowVersionService {
    private snapshots;
    private nextId;
    createSnapshot(workflow: WorkflowDefinition, message?: string, createdBy?: string): WorkflowSnapshot;
    diff(a: SnapshotVersionRef, b: SnapshotVersionRef): SnapshotDiff;
    getHistory(workflowId: string): WorkflowSnapshot[];
    getLatest(workflowId: string): WorkflowSnapshot | undefined;
    getVersion(workflowId: string, version: number): WorkflowSnapshot | undefined;
    rollback(workflowId: string, targetVersion: number): WorkflowDefinition;
    private resolveSnapshot;
    private diffStepFields;
}
export type SnapshotVersionRef = WorkflowSnapshot | [string, number];
//# sourceMappingURL=workflow-version.d.ts.map
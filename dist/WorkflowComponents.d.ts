import React from 'react';
interface WorkflowNode {
    id: string;
    type: 'ai-task' | 'condition' | 'parallel' | 'sequence';
    title: string;
    description: string;
    config: Record<string, any>;
}
interface Workflow {
    id: string;
    name: string;
    description: string;
    nodes: WorkflowNode[];
    edges: Array<{
        source: string;
        target: string;
    }>;
    status: 'draft' | 'active' | 'completed';
    createdAt: string;
    updatedAt: string;
}
export declare const WorkflowBuilder: React.FC;
export declare const AITaskNode: React.FC<{
    config: Record<string, any>;
    onConfigChange: (config: Record<string, any>) => void;
}>;
export declare const WorkflowStatus: React.FC<{
    status: Workflow['status'];
}>;
export {};
//# sourceMappingURL=WorkflowComponents.d.ts.map
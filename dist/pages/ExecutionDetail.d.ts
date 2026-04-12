import React from 'react';
interface ExecutionStep {
    id: string;
    name: string;
    status: 'completed' | 'running' | 'failed' | 'pending';
    startTime?: string;
    endTime?: string;
    duration?: string;
    message: string;
    details?: any;
}
interface ExecutionDetail {
    id: string;
    workflowName: string;
    status: 'running' | 'success' | 'failed' | 'pending';
    startTime: string;
    endTime?: string;
    duration?: string;
    progress: number;
    message: string;
    executor: string;
    totalSteps: number;
    completedSteps: number;
    steps: ExecutionStep[];
    inputs: any;
    outputs: any;
    logs: string[];
}
declare const ExecutionDetail: React.FC;
export default ExecutionDetail;
//# sourceMappingURL=ExecutionDetail.d.ts.map
declare const api: import("axios").AxiosInstance;
export declare const authApi: {
    login: (username: string, password: string) => Promise<any>;
    register: (username: string, email: string, password: string) => Promise<any>;
    getCurrentUser: () => Promise<any>;
};
export declare const workflowApi: {
    getWorkflows: (skip?: number, limit?: number) => Promise<any>;
    getWorkflow: (workflowId: number) => Promise<any>;
    createWorkflow: (workflowData: {
        name: string;
        description: string;
        nodes: any[];
        edges: any[];
    }) => Promise<any>;
    updateWorkflow: (workflowId: number, updateData: {
        name?: string;
        description?: string;
        nodes?: any[];
        edges?: any[];
    }) => Promise<any>;
    deleteWorkflow: (workflowId: number) => Promise<any>;
    executeWorkflow: (workflowId: number, inputData: any) => Promise<any>;
    getWorkflowExecutions: (workflowId: number, skip?: number, limit?: number) => Promise<any>;
};
export declare const aiEnginesApi: {
    getEngines: () => Promise<any>;
    testEngine: (engineId: string, testInput: any) => Promise<any>;
};
export default api;
//# sourceMappingURL=api.d.ts.map
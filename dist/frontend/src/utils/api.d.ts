declare const apiClient: import("axios").AxiosInstance;
export declare const authApi: {
    login: (username: string, password: string) => Promise<any>;
    register: (username: string, email: string, password: string) => Promise<any>;
    getCurrentUser: () => Promise<any>;
    logout: () => Promise<any>;
};
export declare const executionsApi: {
    getExecutions: (params?: {
        page?: number;
        limit?: number;
        status?: string;
        startDate?: string;
        endDate?: string;
    }) => Promise<any>;
    getStats: () => Promise<any>;
    getExecution: (id: string) => Promise<any>;
    createExecution: (data: {
        workflowName: string;
        input: any;
        aiEngine?: string;
    }) => Promise<any>;
};
export declare const aiEngineApi: {
    getEngines: () => Promise<any>;
    selectEngine: (taskType: string, requirements?: any) => Promise<any>;
    executeTask: (engine: string, task: any) => Promise<any>;
};
export declare const workflowsApi: {
    getWorkflows: () => Promise<any>;
    createWorkflow: (data: {
        name: string;
        description: string;
        aiEngine: string;
    }) => Promise<any>;
    updateWorkflowStatus: (id: string, status: string) => Promise<any>;
};
export default apiClient;
//# sourceMappingURL=api.d.ts.map
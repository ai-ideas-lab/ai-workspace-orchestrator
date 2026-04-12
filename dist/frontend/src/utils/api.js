import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
apiClient.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
export const authApi = {
    login: async (username, password) => {
        const response = await apiClient.post('/auth/login', {
            username,
            password,
        });
        return response.data;
    },
    register: async (username, email, password) => {
        const response = await apiClient.post('/auth/register', {
            username,
            email,
            password,
        });
        return response.data;
    },
    getCurrentUser: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },
    logout: async () => {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    },
};
export const executionsApi = {
    getExecutions: async (params) => {
        const response = await apiClient.get('/api/executions', { params });
        return response.data;
    },
    getStats: async () => {
        const response = await apiClient.get('/api/executions/stats');
        return response.data;
    },
    getExecution: async (id) => {
        const response = await apiClient.get(`/api/executions/${id}`);
        return response.data;
    },
    createExecution: async (data) => {
        const response = await apiClient.post('/api/executions', data);
        return response.data;
    },
};
export const aiEngineApi = {
    getEngines: async () => {
        const response = await apiClient.get('/api/ai-engine/engines');
        return response.data;
    },
    selectEngine: async (taskType, requirements) => {
        const response = await apiClient.post('/api/ai-engine/select-engine', {
            taskType,
            requirements,
        });
        return response.data;
    },
    executeTask: async (engine, task) => {
        const response = await apiClient.post('/api/ai-engine/execute', {
            engine,
            task,
        });
        return response.data;
    },
};
export const workflowsApi = {
    getWorkflows: async () => {
        const response = await apiClient.get('/api/workflows');
        return response.data;
    },
    createWorkflow: async (data) => {
        const response = await apiClient.post('/api/workflows', data);
        return response.data;
    },
    updateWorkflowStatus: async (id, status) => {
        const response = await apiClient.put(`/api/workflows/${id}/status`, { status });
        return response.data;
    },
};
export default apiClient;
//# sourceMappingURL=api.js.map
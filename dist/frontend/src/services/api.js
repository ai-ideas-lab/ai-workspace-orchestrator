import axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
api.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
export const authApi = {
    login: async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        return response.data;
    },
    register: async (username, email, password) => {
        const response = await api.post('/auth/register', { username, email, password });
        return response.data;
    },
    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};
export const workflowApi = {
    getWorkflows: async (skip = 0, limit = 100) => {
        const response = await api.get('/workflows', {
            params: { skip, limit }
        });
        return response.data;
    },
    getWorkflow: async (workflowId) => {
        const response = await api.get(`/workflows/${workflowId}`);
        return response.data;
    },
    createWorkflow: async (workflowData) => {
        const response = await api.post('/workflows', workflowData);
        return response.data;
    },
    updateWorkflow: async (workflowId, updateData) => {
        const response = await api.put(`/workflows/${workflowId}`, updateData);
        return response.data;
    },
    deleteWorkflow: async (workflowId) => {
        const response = await api.delete(`/workflows/${workflowId}`);
        return response.data;
    },
    executeWorkflow: async (workflowId, inputData) => {
        const response = await api.post(`/workflows/${workflowId}/execute`, {
            input_data: inputData
        });
        return response.data;
    },
    getWorkflowExecutions: async (workflowId, skip = 0, limit = 100) => {
        const response = await api.get(`/workflows/${workflowId}/executions`, {
            params: { skip, limit }
        });
        return response.data;
    },
};
export const aiEnginesApi = {
    getEngines: async () => {
        const response = await api.get('/ai-engines');
        return response.data;
    },
    testEngine: async (engineId, testInput) => {
        const response = await api.post('/ai-engines/test', {
            engine_id: engineId,
            test_input: testInput
        });
        return response.data;
    },
};
export default api;
//# sourceMappingURL=api.js.map
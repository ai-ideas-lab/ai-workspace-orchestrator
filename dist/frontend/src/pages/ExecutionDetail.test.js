import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ExecutionDetail from '../pages/ExecutionDetail';
import { api } from '../services/api';
jest.mock('../services/api');
const mockedApi = api;
const mockExecution = {
    id: '12345',
    workflowName: 'Test Workflow',
    status: 'completed',
    startTime: '2026-04-05T10:00:00Z',
    endTime: '2026-04-05T10:30:00Z',
    duration: 1800000,
    aiEngine: 'ChatGPT-4',
    input: '{"command": "test", "parameters": {}}',
    output: '{"result": "success", "data": "test completed"}',
    userId: 'user1',
    createdAt: '2026-04-05T10:00:00Z'
};
describe('ExecutionDetail Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('renders loading state initially', () => {
        mockedApi.get.mockImplementation(() => new Promise(() => { }));
        render(<MemoryRouter initialEntries={['/executions/12345']}>
        <Routes>
          <Route path="/executions/:id" element={<ExecutionDetail />}/>
        </Routes>
      </MemoryRouter>);
        expect(screen.getByText('加载执行详情中...')).toBeInTheDocument();
    });
    test('renders execution details after data is loaded', async () => {
        mockedApi.get.mockResolvedValue({
            success: true,
            data: mockExecution,
            timestamp: new Date().toISOString()
        });
        render(<MemoryRouter initialEntries={['/executions/12345']}>
        <Routes>
          <Route path="/executions/:id" element={<ExecutionDetail />}/>
        </Routes>
      </MemoryRouter>);
        await waitFor(() => {
            expect(screen.getByText('执行详情')).toBeInTheDocument();
        });
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
        expect(screen.getByText('已完成')).toBeInTheDocument();
        expect(screen.getByText('ChatGPT-4')).toBeInTheDocument();
        expect(screen.getByText('30m 0s')).toBeInTheDocument();
        expect(screen.getByText('重新执行')).toBeInTheDocument();
    });
    test('shows error message when API fails', async () => {
        mockedApi.get.mockRejectedValue(new Error('API Error'));
        render(<MemoryRouter initialEntries={['/executions/12345']}>
        <Routes>
          <Route path="/executions/:id" element={<ExecutionDetail />}/>
        </Routes>
      </MemoryRouter>);
        await waitFor(() => {
            expect(screen.getByText('加载失败')).toBeInTheDocument();
        });
    });
    test('handles rerun execution', async () => {
        mockedApi.get.mockResolvedValue({
            success: true,
            data: mockExecution,
            timestamp: new Date().toISOString()
        });
        mockedApi.post.mockResolvedValue({
            success: true,
            data: { ...mockExecution, id: '67890' },
            message: 'Execution started successfully',
            timestamp: new Date().toISOString()
        });
        render(<MemoryRouter initialEntries={['/executions/12345']}>
        <Routes>
          <Route path="/executions/:id" element={<ExecutionDetail />}/>
        </Routes>
      </MemoryRouter>);
        await waitFor(() => {
            expect(screen.getByText('执行详情')).toBeInTheDocument();
        });
        const rerunButton = screen.getByText('重新执行');
        fireEvent.click(rerunButton);
        expect(mockedApi.post).toHaveBeenCalledWith('/api/executions', {
            workflowName: 'Test Workflow',
            input: JSON.parse(mockExecution.input),
            aiEngine: 'ChatGPT-4'
        });
    });
    test('navigates back to list when back button is clicked', () => {
        const navigate = jest.fn();
        jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigate);
        render(<MemoryRouter initialEntries={['/executions/12345']}>
        <Routes>
          <Route path="/executions/:id" element={<ExecutionDetail />}/>
        </Routes>
      </MemoryRouter>);
        const backButton = screen.getByText('返回执行历史');
        fireEvent.click(backButton);
        expect(navigate).toHaveBeenCalledWith('/executions');
    });
});
//# sourceMappingURL=ExecutionDetail.test.js.map
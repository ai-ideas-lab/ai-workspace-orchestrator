import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Dashboard from './Dashboard';
import { executionsApi, aiEngineApi } from '../utils/api';
vi.mock('../utils/api');
const mockExecutionsApi = executionsApi;
const mockAiEngineApi = aiEngineApi;
describe('Dashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockExecutionsApi.getStats.mockResolvedValue({
            success: true,
            data: {
                total: 156,
                byStatus: {
                    completed: 142,
                    failed: 8,
                    running: 6
                },
                averageDuration: 45000
            }
        });
        mockAiEngineApi.getEngines.mockResolvedValue({
            success: true,
            data: {
                engines: [
                    {
                        name: 'ChatGPT-4',
                        model: 'gpt-4',
                        capabilities: ['文本生成', '代码编写', '分析总结'],
                        status: '在线',
                        costPerToken: 0.03,
                        latency: '1.2s'
                    },
                    {
                        name: 'Claude-3',
                        model: 'claude-3',
                        capabilities: ['推理分析', '创意写作', '代码审查'],
                        status: '在线',
                        costPerToken: 0.025,
                        latency: '0.8s'
                    }
                ]
            }
        });
        mockExecutionsApi.getExecutions.mockResolvedValue({
            success: true,
            data: {
                executions: [
                    {
                        id: '1',
                        workflowName: '文档分析工作流',
                        aiEngine: 'ChatGPT-4',
                        status: 'completed',
                        startTime: '2026-04-05T10:30:00Z',
                        duration: 32000
                    },
                    {
                        id: '2',
                        workflowName: '代码审查任务',
                        aiEngine: 'Claude-3',
                        status: 'running',
                        startTime: '2026-04-05T10:25:00Z',
                        duration: 45000
                    }
                ]
            }
        });
    });
    test('renders dashboard with loading state', () => {
        render(<Dashboard />);
        expect(screen.getByText('加载仪表板数据...')).toBeInTheDocument();
    });
    test('renders dashboard with data after loading', async () => {
        render(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText('📊 工作流仪表板')).toBeInTheDocument();
            expect(screen.getByText('156')).toBeInTheDocument();
            expect(screen.getByText('142')).toBeInTheDocument();
            expect(screen.getByText('6')).toBeInTheDocument();
            expect(screen.getByText('8')).toBeInTheDocument();
        });
    });
    test('renders AI engines cards', async () => {
        render(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText('ChatGPT-4')).toBeInTheDocument();
            expect(screen.getByText('Claude-3')).toBeInTheDocument();
            expect(screen.getByText('gpt-4')).toBeInTheDocument();
            expect(screen.getByText('claude-3')).toBeInTheDocument();
        });
    });
    test('renders recent executions table', async () => {
        render(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText('文档分析工作流')).toBeInTheDocument();
            expect(screen.getByText('代码审查任务')).toBeInTheDocument();
            expect(screen.getByText('ChatGPT-4')).toBeInTheDocument();
            expect(screen.getByText('Claude-3')).toBeInTheDocument();
        });
    });
    test('allows filtering by status', async () => {
        render(<Dashboard />);
        await waitFor(() => {
            const statusSelect = screen.getByLabelText('状态:');
            fireEvent.change(statusSelect, { target: { value: 'completed' } });
            expect(screen.getByText('文档分析工作流')).toBeInTheDocument();
            expect(screen.queryByText('代码审查任务')).not.toBeInTheDocument();
        });
    });
    test('allows filtering by date range', async () => {
        render(<Dashboard />);
        await waitFor(() => {
            const startDateInput = screen.getByLabelText('开始日期:');
            const endDateInput = screen.getByLabelText('结束日期:');
            fireEvent.change(startDateInput, { target: { value: '2026-04-05' } });
            fireEvent.change(endDateInput, { target: { value: '2026-04-05' } });
            expect(startDateInput).toHaveValue('2026-04-05');
            expect(endDateInput).toHaveValue('2026-04-05');
        });
    });
    test('handles API errors gracefully', async () => {
        mockExecutionsApi.getStats.mockRejectedValue(new Error('API Error'));
        mockAiEngineApi.getEngines.mockRejectedValue(new Error('API Error'));
        mockExecutionsApi.getExecutions.mockRejectedValue(new Error('API Error'));
        render(<Dashboard />);
        await waitFor(() => {
            expect(screen.getByText('156')).toBeInTheDocument();
            expect(screen.getByText('ChatGPT-4')).toBeInTheDocument();
        });
    });
    test('toggles auto refresh', async () => {
        render(<Dashboard />);
        await waitFor(() => {
            const autoRefreshButton = screen.getByText('暂停刷新');
            fireEvent.click(autoRefreshButton);
            expect(screen.getByText('开启刷新')).toBeInTheDocument();
        });
    });
    test('refreshes data manually', async () => {
        render(<Dashboard />);
        mockExecutionsApi.getExecutions.mockResolvedValue({
            success: true,
            data: {
                executions: [
                    {
                        id: '3',
                        workflowName: '新的执行任务',
                        aiEngine: 'ChatGPT-4',
                        status: 'completed',
                        startTime: '2026-04-05T11:00:00Z',
                        duration: 28000
                    }
                ]
            }
        });
        await waitFor(() => {
            const refreshButton = screen.getByText('立即刷新');
            fireEvent.click(refreshButton);
            expect(screen.getByText('新的执行任务')).toBeInTheDocument();
        });
    });
    test('clears filters', async () => {
        render(<Dashboard />);
        await waitFor(() => {
            const statusSelect = screen.getByLabelText('状态:');
            fireEvent.change(statusSelect, { target: { value: 'completed' } });
            expect(screen.getByText('暂停刷新')).toBeInTheDocument();
            const clearFiltersButton = screen.getByText('清除筛选');
            fireEvent.click(clearFiltersButton);
            expect(statusSelect).toHaveValue('all');
        });
    });
    test('shows no data message when no executions match filter', async () => {
        render(<Dashboard />);
        await waitFor(() => {
            const statusSelect = screen.getByLabelText('状态:');
            fireEvent.change(statusSelect, { target: { value: 'failed' } });
            expect(screen.getByText('暂无符合条件的执行记录')).toBeInTheDocument();
        });
    });
});
//# sourceMappingURL=Dashboard.test.js.map
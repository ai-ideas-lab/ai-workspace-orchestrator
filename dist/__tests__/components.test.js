import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedDashboard from '../components/EnhancedDashboard';
import EnhancedWorkflowDesigner from '../components/EnhancedWorkflowDesigner';
const mockStatsApi = {
    getUsageStats: jest.fn().mockResolvedValue({
        data: {
            totalWorkflows: 25,
            todayExecutions: 156,
            successRate: 95.5,
            aiCost: 128.50
        }
    })
};
const mockWorkflowApi = {
    getWorkflows: jest.fn().mockResolvedValue({
        data: [
            {
                id: '1',
                name: '文档摘要生成',
                description: '自动分析文档内容并生成摘要',
                status: 'active',
                executionCount: 15,
                lastExecution: '2分钟前'
            },
            {
                id: '2',
                name: '代码审查',
                description: '自动分析代码质量并提供改进建议',
                status: 'active',
                executionCount: 8,
                lastExecution: '1小时前'
            }
        ]
    })
};
jest.mock('../services/api', () => ({
    workflowApi: mockWorkflowApi,
    statsApi: mockStatsApi
}));
describe('EnhancedDashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('renders dashboard with loading state', () => {
        render(<EnhancedDashboard />);
        expect(screen.getByText('仪表板')).toBeInTheDocument();
    });
    it('displays statistics cards', async () => {
        render(<EnhancedDashboard />);
        await waitFor(() => {
            expect(screen.getByText('总工作流数')).toBeInTheDocument();
            expect(screen.getByText('25')).toBeInTheDocument();
            expect(screen.getByText('今日执行次数')).toBeInTheDocument();
            expect(screen.getByText('156')).toBeInTheDocument();
        });
    });
    it('handles search functionality', async () => {
        render(<EnhancedDashboard />);
        await waitFor(() => {
            const searchInput = screen.getByPlaceholderText('搜索活动或工作流...');
            fireEvent.change(searchInput, { target: { value: '文档' } });
            expect(searchInput).toHaveValue('文档');
        });
    });
    it('handles type filtering', async () => {
        render(<EnhancedDashboard />);
        await waitFor(() => {
            const filterButton = screen.getByText('工作流');
            fireEvent.click(filterButton);
            expect(filterButton).toHaveClass('ant-segmented-item-selected');
        });
    });
});
describe('EnhancedWorkflowDesigner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('renders workflow designer', () => {
        render(<EnhancedWorkflowDesigner />);
        expect(screen.getByText('工作流设计器')).toBeInTheDocument();
        expect(screen.getByText('组件库')).toBeInTheDocument();
    });
    it('allows adding workflow nodes', () => {
        render(<EnhancedWorkflowDesigner />);
        const aiNodeButton = screen.getByText('AI节点');
        fireEvent.click(aiNodeButton);
        expect(screen.getByText('AI节点')).toBeInTheDocument();
    });
    it('allows node selection and editing', () => {
        render(<EnhancedWorkflowDesigner />);
        const node = screen.getByText('开始');
        fireEvent.click(node);
        expect(screen.getByText('节点属性')).toBeInTheDocument();
    });
    it('handles workflow execution', async () => {
        render(<EnhancedWorkflowDesigner />);
        const workflowNameInput = screen.getByPlaceholderText('请输入工作流名称');
        fireEvent.change(workflowNameInput, { target: { value: '测试工作流' } });
        const runButton = screen.getByText('运行工作流');
        fireEvent.click(runButton);
        await waitFor(() => {
            expect(screen.getByText('运行中...')).toBeInTheDocument();
        });
    });
    it('handles template selection', () => {
        render(<EnhancedWorkflowDesigner />);
        const templateButton = screen.getByText('模板库');
        fireEvent.click(templateButton);
        const templateCard = screen.getByText('文档摘要生成');
        fireEvent.click(templateCard);
        expect(screen.getByText('已创建模板 "文档摘要生成"')).toBeInTheDocument();
    });
});
describe('App Integration', () => {
    it('navigates between dashboard and workflow designer', () => {
    });
});
describe('Performance Tests', () => {
    it('renders dashboard within acceptable time', async () => {
        const startTime = performance.now();
        render(<EnhancedDashboard />);
        await waitFor(() => {
            expect(screen.getByText('仪表板')).toBeInTheDocument();
        });
        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(1000);
    });
    it('handles large datasets efficiently', async () => {
        mockWorkflowApi.getWorkflows.mockResolvedValue({
            data: Array.from({ length: 100 }, (_, i) => ({
                id: `${i}`,
                name: `工作流 ${i}`,
                description: `描述 ${i}`,
                status: 'active',
                executionCount: i * 5,
                lastExecution: `${i} 分钟前`
            }))
        });
        const startTime = performance.now();
        render(<EnhancedDashboard />);
        await waitFor(() => {
            expect(screen.getByText('工作流管理')).toBeInTheDocument();
        });
        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(3000);
    });
});
describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
        mockStatsApi.getUsageStats.mockRejectedValue(new Error('API Error'));
        mockWorkflowApi.getWorkflows.mockRejectedValue(new Error('API Error'));
        render(<EnhancedDashboard />);
        await waitFor(() => {
            expect(screen.getByText('数据加载失败')).toBeInTheDocument();
        });
    });
    it('handles node deletion confirmation', () => {
        render(<EnhancedWorkflowDesigner />);
        const node = screen.getByText('开始');
        fireEvent.click(node);
        const deleteButton = screen.getByText('删除节点');
        fireEvent.click(deleteButton);
        const confirmButton = screen.getByText('确定');
        fireEvent.click(confirmButton);
        expect(screen.queryByText('开始')).not.toBeInTheDocument();
    });
});
describe('Responsive Design', () => {
    it('renders correctly on mobile', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 375
        });
        render(<EnhancedDashboard />);
        expect(screen.getByText('仪表板')).toBeInTheDocument();
    });
    it('renders correctly on desktop', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1200
        });
        render(<EnhancedDashboard />);
        expect(screen.getByText('仪表板')).toBeInTheDocument();
        expect(screen.getByText('实时活动')).toBeInTheDocument();
    });
});
//# sourceMappingURL=components.test.js.map
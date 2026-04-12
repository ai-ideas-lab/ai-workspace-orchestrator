import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkflowBuilder, AITaskNode, WorkflowStatus } from '../WorkflowComponents';
jest.useFakeTimers();
describe('WorkflowBuilder', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('应该能够创建新工作流', () => {
        render(<WorkflowBuilder />);
        const createButton = screen.getByText('创建新工作流');
        fireEvent.click(createButton);
        const nameInput = screen.getByPlaceholderText('工作流名称');
        const descriptionInput = screen.getByPlaceholderText('工作流描述');
        fireEvent.change(nameInput, { target: { value: '测试工作流' } });
        fireEvent.change(descriptionInput, { target: { value: '这是一个测试工作流' } });
        const submitButton = screen.getByText('创建');
        fireEvent.click(submitButton);
        expect(screen.getByText('测试工作流')).toBeInTheDocument();
        expect(screen.getByLabelText('工作流描述:')).toHaveValue('这是一个测试工作流');
    });
    test('应该能够编辑工作流信息', () => {
        render(<WorkflowBuilder />);
        const createButton = screen.getByText('创建新工作流');
        fireEvent.click(createButton);
        const nameInput = screen.getByPlaceholderText('工作流名称');
        const descriptionInput = screen.getByPlaceholderText('工作流描述');
        fireEvent.change(nameInput, { target: { value: '原始工作流' } });
        fireEvent.change(descriptionInput, { target: { value: '原始描述' } });
        const submitButton = screen.getByText('创建');
        fireEvent.click(submitButton);
        const editButton = screen.getAllByText('编辑')[0];
        fireEvent.click(editButton);
        const nameEditInput = screen.getByDisplayValue('原始工作流');
        fireEvent.change(nameEditInput, { target: { value: '修改后的工作流' } });
        const nameInput = screen.getByDisplayValue('修改后的工作流');
        expect(nameInput).toBeInTheDocument();
    });
    test('应该能够删除工作流', () => {
        render(<WorkflowBuilder />);
        const createButton = screen.getByText('创建新工作流');
        fireEvent.click(createButton);
        const nameInput = screen.getByPlaceholderText('工作流名称');
        fireEvent.change(nameInput, { target: { value: '待删除工作流' } });
        const descriptionInput = screen.getByPlaceholderText('工作流描述');
        fireEvent.change(descriptionInput, { target: { value: '待删除描述' } });
        const submitButton = screen.getByText('创建');
        fireEvent.click(submitButton);
        expect(screen.getByText('待删除工作流')).toBeInTheDocument();
        const deleteButton = screen.getAllByText('删除')[0];
        fireEvent.click(deleteButton);
        expect(screen.queryByText('待删除工作流')).not.toBeInTheDocument();
    });
    test('应该能够添加AI任务节点', () => {
        render(<WorkflowBuilder />);
        const createButton = screen.getByText('创建新工作流');
        fireEvent.click(createButton);
        const nameInput = screen.getByPlaceholderText('工作流名称');
        fireEvent.change(nameInput, { target: { value: '节点测试工作流' } });
        const descriptionInput = screen.getByPlaceholderText('工作流描述');
        fireEvent.change(descriptionInput, { target: { value: '用于测试节点的描述' } });
        const submitButton = screen.getByText('创建');
        fireEvent.click(submitButton);
        const editButton = screen.getAllByText('编辑')[0];
        fireEvent.click(editButton);
        const addNodeButton = screen.getByText('添加AI任务节点');
        fireEvent.click(addNodeButton);
        expect(screen.getByText('AI任务 (ai-task)')).toBeInTheDocument();
    });
    test('应该能够执行工作流', async () => {
        render(<WorkflowBuilder />);
        const createButton = screen.getByText('创建新工作流');
        fireEvent.click(createButton);
        const nameInput = screen.getByPlaceholderText('工作流名称');
        fireEvent.change(nameInput, { target: { value: '执行测试工作流' } });
        const descriptionInput = screen.getByPlaceholderText('工作流描述');
        fireEvent.change(descriptionInput, { target: { value: '用于测试执行的工作流' } });
        const submitButton = screen.getByText('创建');
        fireEvent.click(submitButton);
        const editButton = screen.getAllByText('编辑')[0];
        fireEvent.click(editButton);
        const addNodeButton = screen.getByText('添加AI任务节点');
        fireEvent.click(addNodeButton);
        const backButton = screen.getByText('AI工作流编排器');
        fireEvent.click(backButton);
        const executeButton = screen.getByText('执行');
        fireEvent.click(executeButton);
        await waitFor(() => {
            expect(screen.getByText('状态: 已完成')).toBeInTheDocument();
        });
        jest.runAllTimers();
    });
    test('应该正确显示工作流统计信息', () => {
        render(<WorkflowBuilder />);
        const createButton = screen.getByText('创建新工作流');
        fireEvent.click(createButton);
        const nameInput = screen.getByPlaceholderText('工作流名称');
        fireEvent.change(nameInput, { target: { value: '统计测试工作流' } });
        const descriptionInput = screen.getByPlaceholderText('工作流描述');
        fireEvent.change(descriptionInput, { target: { value: '用于测试统计的工作流' } });
        const submitButton = screen.getByText('创建');
        fireEvent.click(submitButton);
        const editButton = screen.getAllByText('编辑')[0];
        fireEvent.click(editButton);
        const addNodeButton = screen.getByText('添加AI任务节点');
        fireEvent.click(addNodeButton);
        expect(screen.getByText('节点数: 1')).toBeInTheDocument();
    });
    test('应该能够在添加多个节点', () => {
        render(<WorkflowBuilder />);
        const createButton = screen.getByText('创建新工作流');
        fireEvent.click(createButton);
        const nameInput = screen.getByPlaceholderText('工作流名称');
        fireEvent.change(nameInput, { target: { value: '多节点测试工作流' } });
        const descriptionInput = screen.getByPlaceholderText('工作流描述');
        fireEvent.change(descriptionInput, { target: { value: '用于测试多个节点的工作流' } });
        const submitButton = screen.getByText('创建');
        fireEvent.click(submitButton);
        const editButton = screen.getAllByText('编辑')[0];
        fireEvent.click(editButton);
        let addNodeButton = screen.getByText('添加AI任务节点');
        fireEvent.click(addNodeButton);
        addNodeButton = screen.getByText('添加AI任务节点');
        fireEvent.click(addNodeButton);
        expect(screen.getAllByText('AI任务 (ai-task)')).toHaveLength(2);
    });
});
describe('AITaskNode', () => {
    test('应该渲染AI模型选择器', () => {
        const onConfigChange = jest.fn();
        render(<AITaskNode config={{}} onConfigChange={onConfigChange}/>);
        expect(screen.getByText('GPT-4')).toBeInTheDocument();
        expect(screen.getByText('Claude-3')).toBeInTheDocument();
        expect(screen.getByText('Gemini')).toBeInTheDocument();
    });
    test('应该能够更新AI模型', () => {
        const onConfigChange = jest.fn();
        render(<AITaskNode config={{}} onConfigChange={onConfigChange}/>);
        const select = screen.getByDisplayValue('GPT-4');
        fireEvent.change(select, { target: { value: 'claude-3' } });
        expect(screen.getByDisplayValue('Claude-3')).toBeInTheDocument();
    });
    test('应该能够编辑提示词', () => {
        const onConfigChange = jest.fn();
        render(<AITaskNode config={{}} onConfigChange={onConfigChange}/>);
        const textarea = screen.getByLabelText('提示词:');
        fireEvent.change(textarea, { target: { value: '测试提示词' } });
        expect(textarea).toHaveValue('测试提示词');
    });
    test('应该能够保存配置', () => {
        const onConfigChange = jest.fn();
        render(<AITaskNode config={{}} onConfigChange={onConfigChange}/>);
        const textarea = screen.getByLabelText('提示词:');
        fireEvent.change(textarea, { target: { value: '测试提示词' } });
        const select = screen.getByDisplayValue('GPT-4');
        fireEvent.change(select, { target: { value: 'claude-3' } });
        const saveButton = screen.getByText('保存配置');
        fireEvent.click(saveButton);
        expect(onConfigChange).toHaveBeenCalledWith({
            model: 'claude-3',
            prompt: '测试提示词',
            temperature: 0.7,
            maxTokens: 1000,
        });
    });
    test('应该能够预填充配置', () => {
        const initialConfig = {
            model: 'gemini',
            prompt: '初始提示词',
            temperature: 0.5,
            maxTokens: 500,
        };
        const onConfigChange = jest.fn();
        render(<AITaskNode config={initialConfig} onConfigChange={onConfigChange}/>);
        expect(screen.getByDisplayValue('Gemini')).toBeInTheDocument();
        const textarea = screen.getByLabelText('提示词:');
        expect(textarea).toHaveValue('初始提示词');
    });
});
describe('WorkflowStatus', () => {
    test('应该正确显示草稿状态', () => {
        render(<WorkflowStatus status="draft"/>);
        expect(screen.getByText('草稿')).toBeInTheDocument();
    });
    test('应该正确显示执行中状态', () => {
        render(<WorkflowStatus status="active"/>);
        expect(screen.getByText('执行中')).toBeInTheDocument();
    });
    test('应该正确显示已完成状态', () => {
        render(<WorkflowStatus status="completed"/>);
        expect(screen.getByText('已完成')).toBeInTheDocument();
    });
    test('应该使用正确的颜色标识不同状态', () => {
        const { rerender } = render(<WorkflowStatus status="draft"/>);
        let statusElement = screen.getByText('草稿');
        expect(statusElement).toHaveStyle('backgroundColor: #ffc107');
        rerender(<WorkflowStatus status="active"/>);
        statusElement = screen.getByText('执行中');
        expect(statusElement).toHaveStyle('backgroundColor: #007bff');
        rerender(<WorkflowStatus status="completed"/>);
        statusElement = screen.getByText('已完成');
        expect(statusElement).toHaveStyle('backgroundColor: #28a745');
    });
    test('应该正确处理未知状态', () => {
        const { rerender } = render(<WorkflowStatus status="unknown" as any/>);
        const statusElement = screen.getByText('未知');
        expect(statusElement).toHaveStyle('backgroundColor: #6c757d');
    });
});
describe('Workflow Integration Tests', () => {
    test('完整的工作流创建、编辑、执行流程', async () => {
        render(<WorkflowBuilder />);
        const createButton = screen.getByText('创建新工作流');
        fireEvent.click(createButton);
        const nameInput = screen.getByPlaceholderText('工作流名称');
        const descriptionInput = screen.getByPlaceholderText('工作流描述');
        fireEvent.change(nameInput, { target: { value: '集成测试工作流' } });
        fireEvent.change(descriptionInput, { target: { value: '完整的集成测试' } });
        const submitButton = screen.getByText('创建');
        fireEvent.click(submitButton);
        const editButton = screen.getAllByText('编辑')[0];
        fireEvent.click(editButton);
        const addNodeButton = screen.getByText('添加AI任务节点');
        fireEvent.click(addNodeButton);
        const backButton = screen.getByText('AI工作流编排器');
        fireEvent.click(backButton);
        const executeButton = screen.getByText('执行');
        fireEvent.click(executeButton);
        await waitFor(() => {
            expect(screen.getByText('状态: 已完成')).toBeInTheDocument();
        });
        jest.runAllTimers();
    });
    test('工作流数据持久化', () => {
        render(<WorkflowBuilder />);
        const createButton = screen.getByText('创建新工作流');
        fireEvent.click(createButton);
        const nameInput = screen.getByPlaceholderText('工作流名称');
        fireEvent.change(nameInput, { target: { value: '持久化测试工作流' } });
        const descriptionInput = screen.getByPlaceholderText('工作流描述');
        fireEvent.change(descriptionInput, { target: { value: '测试数据持久化' } });
        const submitButton = screen.getByText('创建');
        fireEvent.click(submitButton);
        expect(screen.getByText('持久化测试工作流')).toBeInTheDocument();
        expect(screen.getByText('测试数据持久化')).toBeInTheDocument();
        expect(screen.getByText('状态: 草稿')).toBeInTheDocument();
    });
});
//# sourceMappingURL=WorkflowComponents.test.js.map
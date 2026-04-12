import React, { useState, useEffect } from 'react';
import { workflowsApi, executionsApi } from '../utils/api';
const Workflows = () => {
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [executions, setExecutions] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newWorkflow, setNewWorkflow] = useState({
        name: '',
        description: '',
        aiEngine: 'ChatGPT-4'
    });
    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            const response = await workflowsApi.getWorkflows();
            if (response.success) {
                const formattedWorkflows = response.data.workflows.map((wf) => ({
                    id: wf.id.toString(),
                    name: wf.name,
                    description: wf.description,
                    status: wf.status,
                    aiEngine: wf.ai_engine_name || 'ChatGPT-4',
                    createdAt: new Date(wf.created_at).toISOString().split('T')[0],
                    executionCount: wf.execution_count || 0,
                    lastExecutedAt: wf.last_executed_at ? new Date(wf.last_executed_at).toISOString() : undefined
                }));
                setWorkflows(formattedWorkflows);
            }
        }
        catch (error) {
            console.error('Error fetching workflows:', error);
            setMockWorkflows();
        }
        finally {
            setLoading(false);
        }
    };
    const executeWorkflowWithProgress = async (workflowId) => {
        try {
            const executionId = `exec_${Date.now()}`;
            const newExecution = {
                workflowId,
                executionId,
                status: 'pending',
                progress: 0,
                message: '准备执行工作流...',
                startTime: new Date().toISOString()
            };
            setExecutions(prev => [...prev, newExecution]);
            setExecutions(prev => prev.map(exec => exec.executionId === executionId
                ? { ...exec, status: 'running', progress: 10, message: '正在解析工作流...' }
                : exec));
            const response = await executionsApi.createExecution({
                workflowName: workflows.find(w => w.id === workflowId)?.name || 'Unknown Workflow',
                input: { workflowId },
                aiEngine: workflows.find(w => w.id === workflowId)?.aiEngine || 'ChatGPT-4'
            });
            if (response.success) {
                simulateProgress(executionId);
            }
            else {
                setExecutions(prev => prev.map(exec => exec.executionId === executionId
                    ? { ...exec, status: 'failed', progress: 0, message: '执行失败: ' + response.message }
                    : exec));
            }
        }
        catch (error) {
            console.error('Error executing workflow:', error);
            setExecutions(prev => prev.map(exec => exec.workflowId === workflowId
                ? { ...exec, status: 'failed', progress: 0, message: '执行失败: 网络错误' }
                : exec));
        }
    };
    const simulateProgress = (executionId) => {
        const stages = [
            { progress: 20, message: '正在连接AI引擎...', delay: 1000 },
            { progress: 40, message: '解析工作流定义...', delay: 1500 },
            { progress: 60, message: '执行AI任务...', delay: 2000 },
            { progress: 80, message: '处理结果数据...', delay: 1000 },
            { progress: 100, message: '执行完成！', delay: 500 }
        ];
        let currentStage = 0;
        const updateStage = () => {
            if (currentStage < stages.length) {
                const stage = stages[currentStage];
                setExecutions(prev => prev.map(exec => exec.executionId === executionId
                    ? { ...exec, progress: stage.progress, message: stage.message }
                    : exec));
                currentStage++;
                setTimeout(updateStage, stage.delay);
            }
            else {
                setExecutions(prev => prev.map(exec => exec.executionId === executionId
                    ? { ...exec, status: 'completed', progress: 100 }
                    : exec));
                fetchWorkflows();
            }
        };
        updateStage();
    };
    const setMockWorkflows = () => {
        setWorkflows([
            {
                id: '1',
                name: '内容创作工作流',
                description: '自动生成博客文章和社交媒体内容',
                status: 'active',
                aiEngine: 'ChatGPT-4',
                createdAt: '2024-03-01',
                executionCount: 15,
                lastExecutedAt: '2024-03-15T10:30:00Z'
            },
            {
                id: '2',
                name: '代码审查工作流',
                description: '自动分析和优化代码质量',
                status: 'active',
                aiEngine: 'Claude-3',
                createdAt: '2024-03-05',
                executionCount: 8,
                lastExecutedAt: '2024-03-14T14:20:00Z'
            },
            {
                id: '3',
                name: '数据分析工作流',
                description: '处理和分析业务数据报告',
                status: 'inactive',
                aiEngine: 'Gemini-Pro',
                createdAt: '2024-03-10',
                executionCount: 3,
                lastExecutedAt: '2024-03-10T09:15:00Z'
            }
        ]);
    };
    useEffect(() => {
        fetchWorkflows();
    }, []);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newWorkflow, setNewWorkflow] = useState({
        name: '',
        description: '',
        aiEngine: 'ChatGPT-4'
    });
    const handleCreateWorkflow = async () => {
        if (!newWorkflow.name || !newWorkflow.description)
            return;
        try {
            const newWorkflowData = {
                id: Date.now().toString(),
                name: newWorkflow.name,
                description: newWorkflow.description,
                status: 'active',
                aiEngine: newWorkflow.aiEngine,
                createdAt: new Date().toISOString().split('T')[0],
                executionCount: 0
            };
            setWorkflows(prev => [...prev, newWorkflowData]);
            setNewWorkflow({ name: '', description: '', aiEngine: 'ChatGPT-4' });
            setShowCreateForm(false);
            await fetchWorkflows();
        }
        catch (error) {
            console.error('Error creating workflow:', error);
        }
    };
    const toggleWorkflowStatus = async (id) => {
        try {
            setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' } : w));
        }
        catch (error) {
            console.error('Error updating workflow status:', error);
        }
    };
    const removeExecution = (executionId) => {
        setExecutions(prev => prev.filter(exec => exec.executionId !== executionId));
    };
    const getStatusBadgeClass = (status) => {
        return status === 'active' ? 'status-completed' : 'status-failed';
    };
    return (<div className="workflows-container">
      <div className="list-header">
        <h1>🔄 工作流管理</h1>
        <div className="header-actions">
          <button className="btn" onClick={() => setShowCreateForm(true)}>
            创建新工作流
          </button>
          <button className="btn btn-secondary" onClick={fetchWorkflows}>
            🔄 刷新
          </button>
        </div>
      </div>

      
      {executions.length > 0 && (<div className="executions-progress">
          <h3>🚀 执行进度</h3>
          {executions.map((execution) => {
                const workflow = workflows.find(w => w.id === execution.workflowId);
                return (<div key={execution.executionId} className="execution-card card">
                <div className="execution-header">
                  <h4>{workflow?.name || '未知工作流'}</h4>
                  <div className="execution-status">
                    <span className={`status-badge ${execution.status === 'completed' ? 'status-completed' :
                        execution.status === 'running' ? 'status-running' :
                            execution.status === 'failed' ? 'status-failed' : 'status-pending'}`}>
                      {execution.status === 'completed' ? '✅ 完成' :
                        execution.status === 'running' ? '⏳ 运行中' :
                            execution.status === 'failed' ? '❌ 失败' : '⏸️ 等待中'}
                    </span>
                  </div>
                </div>
                
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${execution.progress}%` }}></div>
                </div>
                
                <div className="progress-info">
                  <span>{execution.message}</span>
                  <span className="progress-percentage">{execution.progress}%</span>
                </div>
                
                <button className="btn btn-small" onClick={() => removeExecution(execution.executionId)}>
                  移除
                </button>
              </div>);
            })}
        </div>)}

      {loading ? (<div className="loading">
          <div className="loading-spinner"></div>
          <p>加载工作流...</p>
        </div>) : (<>
          
          {showCreateForm && (<div className="form-container card">
              <h3>创建新工作流</h3>
              <div className="form-group">
                <label>工作流名称</label>
                <input type="text" value={newWorkflow.name} onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })} placeholder="输入工作流名称"/>
              </div>
              <div className="form-group">
                <label>工作流描述</label>
                <textarea value={newWorkflow.description} onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })} placeholder="描述工作流的用途和功能" rows={3}/>
              </div>
              <div className="form-group">
                <label>AI引擎</label>
                <select value={newWorkflow.aiEngine} onChange={(e) => setNewWorkflow({ ...newWorkflow, aiEngine: e.target.value })}>
                  <option value="ChatGPT-4">ChatGPT-4</option>
                  <option value="Claude-3">Claude-3</option>
                  <option value="Gemini-Pro">Gemini-Pro</option>
                </select>
              </div>
              <div className="form-actions">
                <button className="btn" onClick={handleCreateWorkflow}>创建</button>
                <button className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                  取消
                </button>
              </div>
            </div>)}

          
          <div className="workflows-list">
            {workflows.map((workflow) => (<div key={workflow.id} className="workflow-card card">
                <div className="workflow-header">
                  <h3>{workflow.name}</h3>
                  <div className="workflow-status">
                    <span className={`status-badge ${workflow.status === 'active' ? 'status-completed' :
                    workflow.status === 'inactive' ? 'status-failed' : 'status-pending'}`}>
                      {workflow.status === 'active' ? '激活' :
                    workflow.status === 'inactive' ? '停用' : '草稿'}
                    </span>
                  </div>
                </div>
                
                <p className="workflow-description">{workflow.description}</p>
                
                <div className="workflow-details">
                  <div className="detail-item">
                    <span>🤖 AI引擎:</span>
                    <span>{workflow.aiEngine}</span>
                  </div>
                  <div className="detail-item">
                    <span>📅 创建时间:</span>
                    <span>{workflow.createdAt}</span>
                  </div>
                  <div className="detail-item">
                    <span>🔢 执行次数:</span>
                    <span>{workflow.executionCount}</span>
                  </div>
                  {workflow.lastExecutedAt && (<div className="detail-item">
                      <span>⏰ 最后执行:</span>
                      <span>{new Date(workflow.lastExecutedAt).toLocaleString()}</span>
                    </div>)}
                </div>
                
                <div className="workflow-actions">
                  <button className="btn" onClick={() => executeWorkflowWithProgress(workflow.id)}>
                    执行工作流
                  </button>
                  <button className="btn btn-secondary" onClick={() => toggleWorkflowStatus(workflow.id)}>
                    {workflow.status === 'active' ? '停用' : '激活'}
                  </button>
                </div>
              </div>))}
          </div>
        </>)}
    </div>);
    { }
    {
        showCreateForm && (<div className="form-container card">
          <h3>创建新工作流</h3>
          <div className="form-group">
            <label>工作流名称</label>
            <input type="text" value={newWorkflow.name} onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })} placeholder="输入工作流名称"/>
          </div>
          <div className="form-group">
            <label>工作流描述</label>
            <textarea value={newWorkflow.description} onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })} placeholder="描述工作流的用途和功能" rows={3}/>
          </div>
          <div className="form-group">
            <label>AI引擎</label>
            <select value={newWorkflow.aiEngine} onChange={(e) => setNewWorkflow({ ...newWorkflow, aiEngine: e.target.value })}>
              <option value="ChatGPT-4">ChatGPT-4</option>
              <option value="Claude-3">Claude-3</option>
              <option value="Gemini-Pro">Gemini-Pro</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="btn" onClick={handleCreateWorkflow}>创建</button>
            <button className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
              取消
            </button>
          </div>
        </div>);
    }
    { }
    <div className="workflows-list">
        {workflows.map((workflow) => (<div key={workflow.id} className="workflow-card card">
            <div className="workflow-header">
              <h3>{workflow.name}</h3>
              <div className="workflow-status">
                <span className={`status-badge ${getStatusBadgeClass(workflow.status)}`}>
                  {workflow.status === 'active' ? '激活' : '停用'}
                </span>
              </div>
            </div>
            
            <p className="workflow-description">{workflow.description}</p>
            
            <div className="workflow-details">
              <div className="detail-item">
                <span>🤖 AI引擎:</span>
                <span>{workflow.aiEngine}</span>
              </div>
              <div className="detail-item">
                <span>📅 创建时间:</span>
                <span>{workflow.createdAt}</span>
              </div>
            </div>
            
            <div className="workflow-actions">
              <button className="btn" onClick={() => executeWorkflow(workflow.id)}>
                执行工作流
              </button>
              <button className="btn btn-secondary" onClick={() => toggleWorkflowStatus(workflow.id)}>
                {workflow.status === 'active' ? '停用' : '激活'}
              </button>
            </div>
          </div>))}
      </div>;
};
div >
;
;
;
export default Workflows;
//# sourceMappingURL=Workflows.js.map
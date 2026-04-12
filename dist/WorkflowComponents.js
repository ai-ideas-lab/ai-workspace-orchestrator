import React, { useState } from 'react';
export const WorkflowBuilder = () => {
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const createWorkflow = (name, description) => {
        const newWorkflow = {
            id: `workflow-${Date.now()}`,
            name,
            description,
            nodes: [],
            edges: [],
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setWorkflows([...workflows, newWorkflow]);
        setSelectedWorkflow(newWorkflow);
        setIsCreating(false);
    };
    const updateWorkflow = (id, updates) => {
        setWorkflows(workflows.map(w => w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w));
        if (selectedWorkflow && selectedWorkflow.id === id) {
            setSelectedWorkflow({ ...selectedWorkflow, ...updates, updatedAt: new Date().toISOString() });
        }
    };
    const deleteWorkflow = (id) => {
        setWorkflows(workflows.filter(w => w.id !== id));
        if (selectedWorkflow && selectedWorkflow.id === id) {
            setSelectedWorkflow(null);
        }
    };
    const addNode = (workflowId, node) => {
        const newNode = {
            ...node,
            id: `node-${Date.now()}`,
        };
        setWorkflows(workflows.map(w => {
            if (w.id === workflowId) {
                return {
                    ...w,
                    nodes: [...w.nodes, newNode],
                    updatedAt: new Date().toISOString(),
                };
            }
            return w;
        }));
        if (selectedWorkflow && selectedWorkflow.id === workflowId) {
            setSelectedWorkflow({
                ...selectedWorkflow,
                nodes: [...selectedWorkflow.nodes, newNode],
                updatedAt: new Date().toISOString(),
            });
        }
    };
    const executeWorkflow = (workflowId) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                updateWorkflow(workflowId, { status: 'completed' });
                resolve();
            }, 1000);
        });
    };
    return (<div className="workflow-builder">
      <h1>AI工作流编排器</h1>
      
      
      <div className="workflow-list">
        <h2>工作流列表</h2>
        <button onClick={() => setIsCreating(true)}>创建新工作流</button>
        
        {workflows.map(workflow => (<div key={workflow.id} className="workflow-item">
            <h3>{workflow.name}</h3>
            <p>{workflow.description}</p>
            <p>状态: {workflow.status}</p>
            <p>节点数: {workflow.nodes.length}</p>
            <button onClick={() => setSelectedWorkflow(workflow)}>编辑</button>
            <button onClick={() => deleteWorkflow(workflow.id)}>删除</button>
            <button onClick={() => executeWorkflow(workflow.id)} disabled={workflow.status === 'completed'}>
              执行
            </button>
          </div>))}
      </div>

      
      {selectedWorkflow && (<div className="workflow-editor">
          <h2>编辑工作流: {selectedWorkflow.name}</h2>
          
          <div className="workflow-info">
            <input type="text" value={selectedWorkflow.name} onChange={(e) => updateWorkflow(selectedWorkflow.id, { name: e.target.value })}/>
            <textarea value={selectedWorkflow.description} onChange={(e) => updateWorkflow(selectedWorkflow.id, { description: e.target.value })}/>
          </div>

          <div className="workflow-nodes">
            <h3>节点 ({selectedWorkflow.nodes.length})</h3>
            <button onClick={() => addNode(selectedWorkflow.id, {
                type: 'ai-task',
                title: 'AI任务',
                description: '执行AI处理任务',
                config: {}
            })}>
              添加AI任务节点
            </button>
            
            {selectedWorkflow.nodes.map(node => (<div key={node.id} className="workflow-node">
                <h4>{node.title} ({node.type})</h4>
                <p>{node.description}</p>
              </div>))}
          </div>
        </div>)}

      
      {isCreating && (<div className="create-workflow-modal">
          <h2>创建新工作流</h2>
          <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                createWorkflow(formData.get('name'), formData.get('description'));
            }}>
            <input type="text" name="name" placeholder="工作流名称" required/>
            <textarea name="description" placeholder="工作流描述" required/>
            <button type="submit">创建</button>
            <button type="button" onClick={() => setIsCreating(false)}>取消</button>
          </form>
        </div>)}
    </div>);
};
export const AITaskNode = ({ config, onConfigChange }) => {
    const [model, setModel] = useState(config.model || 'gpt-4');
    const [prompt, setPrompt] = useState(config.prompt || '');
    const handleSave = () => {
        onConfigChange({
            model,
            prompt,
            temperature: 0.7,
            maxTokens: 1000,
        });
    };
    return (<div className="ai-task-node">
      <h3>AI任务节点</h3>
      
      <div className="config-section">
        <label>
          AI模型:
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="gpt-4">GPT-4</option>
            <option value="claude-3">Claude-3</option>
            <option value="gemini">Gemini</option>
          </select>
        </label>
      </div>

      <div className="config-section">
        <label>
          提示词:
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} cols={50}/>
        </label>
      </div>

      <button onClick={handleSave}>保存配置</button>
    </div>);
};
export const WorkflowStatus = ({ status }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'draft':
                return '#ffc107';
            case 'active':
                return '#007bff';
            case 'completed':
                return '#28a745';
            default:
                return '#6c757d';
        }
    };
    const getStatusText = (status) => {
        switch (status) {
            case 'draft':
                return '草稿';
            case 'active':
                return '执行中';
            case 'completed':
                return '已完成';
            default:
                return '未知';
        }
    };
    return (<div className="workflow-status" style={{
            backgroundColor: getStatusColor(status),
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
        }}>
      {getStatusText(status)}
    </div>);
};
//# sourceMappingURL=WorkflowComponents.js.map
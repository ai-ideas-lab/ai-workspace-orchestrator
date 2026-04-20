import React, { useState, useCallback } from 'react';
import { Card, Button, Input, Space, Alert, Spin, Tabs, message } from 'antd';
import { PlusOutlined, SaveOutlined, PlayCircleOutlined, BranchesOutlined } from '@ant-design/icons';
import { workflowApi, workflowGenerationApi } from '../services/api';
const { TextArea } = Input;
const { TabPane } = Tabs;
const WorkflowDesigner = () => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [workflow, setWorkflow] = useState(null);
    const [workflowName, setWorkflowName] = useState('');
    const generateWorkflow = useCallback(async () => {
        if (!prompt.trim()) {
            message.warning('请输入需求描述');
            return;
        }
        setLoading(true);
        try {
            const response = await workflowGenerationApi.generateFromPrompt(prompt);
            setWorkflow(response.workflow);
            setWorkflowName(response.workflow.name);
            message.success('工作流生成成功！');
        }
        catch (error) {
            message.error('生成工作流失败');
        }
        finally {
            setLoading(false);
        }
    }, [prompt]);
    const saveWorkflow = useCallback(async () => {
        if (!workflow) {
            message.warning('没有可保存的工作流');
            return;
        }
        try {
            const workflowData = {
                ...workflow,
                name: workflowName || workflow.name,
            };
            const response = await workflowApi.createWorkflow(workflowData);
            message.success('工作流保存成功！');
        }
        catch (error) {
            message.error('保存工作流失败');
        }
    }, [workflow, workflowName]);
    const executeWorkflow = useCallback(async () => {
        if (!workflow) {
            message.warning('没有可执行的工作流');
            return;
        }
        setLoading(true);
        try {
            const response = await workflowApi.executeWorkflow(workflow.id, {
                variables: workflow.variables,
            });
            message.success('工作流执行成功！请查看执行结果。');
        }
        catch (error) {
            message.error('执行工作流失败');
        }
        finally {
            setLoading(false);
        }
    }, [workflow]);
    return (<div className="workflow-designer">
      <Card title="AI工作流设计器" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          
          <Space direction="vertical" style={{ width: '100%' }}>
            <h3>1. 需求描述</h3>
            <TextArea rows={4} placeholder="请用自然语言描述你的需求，例如：帮我分析销售数据并生成市场报告，包含图表和趋势分析..." value={prompt} onChange={(e) => setPrompt(e.target.value)}/>
            <Button type="primary" icon={<PlusOutlined />} loading={loading} onClick={generateWorkflow} disabled={!prompt.trim()}>
              生成工作流
            </Button>
          </Space>

          
          {workflow && (<Alert message="工作流已生成" description={`工作流名称: ${workflow.name}`} type="success" showIcon style={{ marginBottom: 16 }}/>)}

          {workflow && (<Tabs defaultActiveKey="1" type="card">
              <TabPane tab="工作流预览" key="1">
                <Card title="工作流详情" size="small">
                  <div style={{ marginBottom: 16 }}>
                    <h4>工作流名称:</h4>
                    <Input value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} placeholder={workflow.name}/>
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <h4>描述:</h4>
                    <p>{workflow.description}</p>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <h4>步骤 ({workflow.steps.length}):</h4>
                    {workflow.steps.map((step, index) => (<Card key={step.id} size="small" style={{ marginBottom: 8 }}>
                        <div>
                          <strong>步骤 {index + 1}:</strong> {step.id}
                          <br />
                          <strong>类型:</strong> {step.type}
                          <br />
                          <strong>AI代理:</strong> {step.agent}
                          <br />
                          <strong>提示:</strong> {step.prompt}
                          <br />
                          <strong>预期输出:</strong> {step.expected_output}
                        </div>
                      </Card>))}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <h4>变量:</h4>
                    <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                      {JSON.stringify(workflow.variables, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <h4>错误处理配置:</h4>
                    <p>
                      最大重试次数: {workflow.error_handling.max_retries}, 
                      超时时间: {workflow.error_handling.timeout}秒
                    </p>
                  </div>
                </Card>
              </TabPane>

              <TabPane tab="执行日志" key="2">
                <Card title="执行状态" size="small">
                  <Spin spinning={loading}>
                    <p>执行功能将在工作流保存后可用</p>
                  </Spin>
                </Card>
              </TabPane>
            </Tabs>)}

          
          {workflow && (<Space style={{ marginTop: 16 }}>
              <Button type="primary" icon={<SaveOutlined />} onClick={saveWorkflow}>
                保存工作流
              </Button>
              <Button type="default" icon={<PlayCircleOutlined />} onClick={executeWorkflow} loading={loading}>
                执行工作流
              </Button>
              <Button type="default" icon={<BranchesOutlined />} onClick={() => {
                setWorkflow(null);
                setPrompt('');
                setWorkflowName('');
            }}>
                重新生成
              </Button>
            </Space>)}
        </Space>
      </Card>
    </div>);
};
export default WorkflowDesigner;
//# sourceMappingURL=WorkflowDesigner.js.map
import React, { useState, useEffect } from 'react';
import { Card, Button, Table, message, Space, Tag, Typography, Row, Col, Tabs } from 'antd';
import { PlusOutlined, PlayCircleOutlined, EditOutlined, DesignatedOutlined } from '@ant-design/icons';
import EnhancedWorkflowDesigner from '../components/EnhancedWorkflowDesigner';
import { workflowApi } from '../services/api';
const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
const WorkflowsPage = () => {
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('list');
    const [editingWorkflow, setEditingWorkflow] = useState(null);
    useEffect(() => {
        fetchWorkflows();
    }, []);
    const fetchWorkflows = async () => {
        setLoading(true);
        try {
            const response = await workflowApi.getWorkflows();
            setWorkflows(response.data);
        }
        catch (error) {
            message.error('获取工作流列表失败');
        }
        finally {
            setLoading(false);
        }
    };
    const executeWorkflow = async (workflowId) => {
        try {
            await workflowApi.executeWorkflow(workflowId, { variables: {} });
            message.success('工作流执行成功');
            fetchWorkflows();
        }
        catch (error) {
            message.error('工作流执行失败');
        }
    };
    const saveWorkflow = async (workflow) => {
        try {
            if (workflow.id) {
                await workflowApi.updateWorkflow(workflow.id, workflow);
            }
            else {
                await workflowApi.createWorkflow(workflow);
            }
            message.success('工作流保存成功');
            setActiveTab('list');
            fetchWorkflows();
        }
        catch (error) {
            message.error('保存工作流失败');
        }
    };
    const columns = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <strong>{text}</strong>
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            render: (text) => <Text ellipsis={{ tooltip: text }}>{text}</Text>
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colorMap = {
                    'draft': 'default',
                    'active': 'success',
                    'paused': 'warning',
                    'completed': 'processing'
                };
                return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
            }
        },
        {
            title: '执行次数',
            dataIndex: 'executionCount',
            key: 'executionCount',
            render: (count, record) => (<div>
          <div>{count}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            成功率: {record.successRate}%
          </div>
        </div>)
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString()
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (<Space>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => executeWorkflow(record.id)} size="small">
            执行
          </Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => {
                    setEditingWorkflow(record);
                    setActiveTab('designer');
                }}>
            编辑
          </Button>
        </Space>)
        }
    ];
    return (<div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2}>AI工作流管理</Title>
          <Paragraph>通过自然语言描述创建和执行智能自动化工作流</Paragraph>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
          <TabPane tab={<span>
                <DesignatedOutlined />
                工作流设计器
              </span>} key="designer">
            <EnhancedWorkflowDesigner workflow={editingWorkflow} onSave={saveWorkflow} onExecute={executeWorkflow}/>
          </TabPane>
          
          <TabPane tab={<span>
                <PlusOutlined />
                工作流列表
              </span>} key="list">
            <div style={{ marginBottom: '16px' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingWorkflow(null);
            setActiveTab('designer');
        }}>
                创建新工作流
              </Button>
            </div>

            <Table columns={columns} dataSource={workflows} rowKey="id" loading={loading} pagination={{ pageSize: 10 }}/>
          </TabPane>
        </Tabs>
      </Card>
    </div>);
};
export default WorkflowsPage;
//# sourceMappingURL=WorkflowsPage.js.map
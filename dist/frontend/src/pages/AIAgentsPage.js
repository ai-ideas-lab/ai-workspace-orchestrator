import React from 'react';
import { Card, Typography, Button, Table, Space, Tag, Row, Col, Statistic } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
const { Title } = Typography;
const AIAgentsPage = () => {
    const agents = [
        { id: 1, name: 'OpenAI GPT-4', type: 'openai', model: 'gpt-4', status: 'active', calls: 1250 },
        { id: 2, name: 'Anthropic Claude', type: 'anthropic', model: 'claude-3-opus', status: 'active', calls: 890 },
        { id: 3, name: 'Google Gemini', type: 'google', model: 'gemini-pro', status: 'active', calls: 670 },
        { id: 4, name: '本地模型', type: 'local', model: 'custom', status: 'inactive', calls: 0 },
    ];
    const columns = [
        {
            title: 'AI代理名称',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <strong>{text}</strong>
        },
        {
            title: '提供商',
            dataIndex: 'type',
            key: 'type',
            render: (type) => {
                const typeMap = {
                    'openai': { color: 'blue', text: 'OpenAI' },
                    'anthropic': { color: 'green', text: 'Anthropic' },
                    'google': { color: 'orange', text: 'Google' },
                    'local': { color: 'purple', text: '本地' }
                };
                const config = typeMap[type] || { color: 'default', text: type };
                return <Tag color={config.color}>{config.text}</Tag>;
            }
        },
        {
            title: '模型',
            dataIndex: 'model',
            key: 'model',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (<Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '运行中' : '已停用'}
        </Tag>)
        },
        {
            title: '调用次数',
            dataIndex: 'calls',
            key: 'calls',
            render: (calls) => calls.toLocaleString()
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (<Space>
          <Button type="primary" size="small">
            配置
          </Button>
          <Button size="small">
            测试
          </Button>
          {record.status === 'active' ? (<Button size="small" danger>
              停用
            </Button>) : (<Button type="primary" size="small">
              启用
            </Button>)}
        </Space>)
        }
    ];
    return (<div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2}>AI代理管理</Title>
          <p>配置和管理多个AI引擎，智能调度工作流执行</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />}>
          添加代理
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="OpenAI" value={1250} suffix="调用"/>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Anthropic" value={890} suffix="调用"/>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Google" value={670} suffix="调用"/>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="总计" value={2810} suffix="调用"/>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table columns={columns} dataSource={agents} rowKey="id"/>
      </Card>
    </div>);
};
export default AIAgentsPage;
//# sourceMappingURL=AIAgentsPage.js.map
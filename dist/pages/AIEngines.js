import React, { useState } from 'react';
import { Card, Table, Button, Tag, Space, Modal, Form, Input, Select, message, Typography, Row, Col, Statistic, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, StopOutlined, SettingOutlined, HeartOutlined, ThunderboltOutlined, ApiOutlined, RobotOutlined } from '@ant-design/icons';
const { Title, Text } = Typography;
const { Option } = Select;
const AIEngines = () => {
    const [engines, setEngines] = useState([
        {
            id: '1',
            name: 'OpenAI GPT-4',
            type: 'text-generation',
            provider: 'OpenAI',
            model: 'gpt-4',
            status: 'active',
            statusMessage: '运行正常',
            rateLimit: 100,
            currentUsage: 75,
            description: '强大的文本生成模型，适合内容创作和分析',
            config: {
                apiKey: '***',
                temperature: 0.7,
                maxTokens: 4000
            },
            lastUsed: '2026-04-05 10:30:00',
            createdAt: '2026-03-15'
        },
        {
            id: '2',
            name: 'Anthropic Claude-3',
            type: 'text-generation',
            provider: 'Anthropic',
            model: 'claude-3-sonnet',
            status: 'active',
            statusMessage: '运行正常',
            rateLimit: 80,
            currentUsage: 45,
            description: '高质量的对话模型，擅长理解和推理',
            config: {
                apiKey: '***',
                maxTokens: 4096,
                systemPrompt: '你是一个AI助手'
            },
            lastUsed: '2026-04-05 10:25:00',
            createdAt: '2026-03-20'
        },
        {
            id: '3',
            name: 'Google Gemini Pro',
            type: 'multimodal',
            provider: 'Google',
            model: 'gemini-pro',
            status: 'inactive',
            rateLimit: 60,
            currentUsage: 0,
            description: '支持多模态输入输出的AI模型',
            config: {
                apiKey: '***',
                temperature: 0.5
            },
            createdAt: '2026-03-25'
        },
        {
            id: '4',
            name: '本地LLM',
            type: 'text-generation',
            provider: 'Local',
            model: 'llama-2-7b',
            status: 'error',
            statusMessage: '服务连接失败',
            rateLimit: 200,
            currentUsage: 0,
            description: '本地部署的开源大语言模型',
            config: {
                modelPath: '/models/llama-2-7b',
                temperature: 0.8
            },
            lastUsed: '2026-04-04 15:20:00',
            createdAt: '2026-03-28'
        }
    ]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingEngine, setEditingEngine] = useState(null);
    const [form] = Form.useForm();
    const engineTypes = [
        { value: 'text-generation', label: '文本生成', icon: <RobotOutlined /> },
        { value: 'multimodal', label: '多模态', icon: <ApiOutlined /> },
        { value: 'embedding', label: '向量嵌入', icon: <HeartOutlined /> },
        { value: 'speech', label: '语音处理', icon: <ThunderboltOutlined /> }
    ];
    const providers = [
        { value: 'openai', label: 'OpenAI' },
        { value: 'anthropic', label: 'Anthropic' },
        { value: 'google', label: 'Google' },
        { value: 'local', label: '本地部署' },
        { value: 'azure', label: 'Azure' },
        { value: 'cohere', label: 'Cohere' }
    ];
    const columns = [
        {
            title: '引擎名称',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (<div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{text}</div>
          <div style={{ color: '#666', fontSize: 12 }}>{record.description}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Tag color="blue">{record.provider}</Tag>
            <Tag color="purple">{record.model}</Tag>
          </div>
        </div>)
        },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            render: (type) => {
                const typeInfo = engineTypes.find(t => t.value === type);
                return (<Tag icon={typeInfo?.icon} color="processing">
            {typeInfo?.label || type}
          </Tag>);
            }
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => {
                const statusConfig = {
                    active: { color: 'success', text: '运行中' },
                    inactive: { color: 'default', text: '已停止' },
                    error: { color: 'error', text: '错误' }
                };
                const config = statusConfig[status];
                return (<Tag color={config.color}>
            {config.text}
            {record.statusMessage && ` - ${record.statusMessage}`}
          </Tag>);
            }
        },
        {
            title: '使用率',
            dataIndex: 'currentUsage',
            key: 'currentUsage',
            render: (usage, record) => (<div>
          <Progress percent={(usage / record.rateLimit) * 100} size="small" status={(usage / record.rateLimit) > 0.8 ? 'exception' : 'normal'} style={{ marginBottom: 4 }}/>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {usage}/{record.rateLimit} 请求/分钟
          </Text>
        </div>)
        },
        {
            title: '最后使用',
            dataIndex: 'lastUsed',
            key: 'lastUsed',
            render: (lastUsed) => (<Text type="secondary" style={{ fontSize: 12 }}>
          {lastUsed || '从未使用'}
        </Text>)
        },
        {
            title: '操作',
            key: 'actions',
            render: (text, record) => (<Space>
          <Button type="link" icon={<PlayCircleOutlined />} size="small" disabled={record.status !== 'inactive'} onClick={() => handleStart(record)}>
            启动
          </Button>
          <Button type="link" icon={<StopOutlined />} size="small" disabled={record.status !== 'active'} onClick={() => handleStop(record)}>
            停止
          </Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" icon={<SettingOutlined />} size="small">
            配置
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} size="small">
            删除
          </Button>
        </Space>)
        }
    ];
    const handleAdd = () => {
        setEditingEngine(null);
        setModalVisible(true);
        form.resetFields();
    };
    const handleEdit = (engine) => {
        setEditingEngine(engine);
        setModalVisible(true);
        form.setFieldsValue(engine);
    };
    const handleStart = (engine) => {
        setEngines(engines.map(e => e.id === engine.id
            ? { ...e, status: 'active', statusMessage: '运行正常' }
            : e));
        message.success(`${engine.name} 已启动`);
    };
    const handleStop = (engine) => {
        setEngines(engines.map(e => e.id === engine.id
            ? { ...e, status: 'inactive', statusMessage: '已停止' }
            : e));
        message.success(`${engine.name} 已停止`);
    };
    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (editingEngine) {
                setEngines(engines.map(e => e.id === editingEngine.id ? { ...e, ...values } : e));
                message.success('AI引擎更新成功');
            }
            else {
                const newEngine = {
                    ...values,
                    id: Date.now().toString(),
                    currentUsage: 0,
                    lastUsed: new Date().toISOString().split('T')[0],
                    createdAt: new Date().toISOString().split('T')[0]
                };
                setEngines([...engines, newEngine]);
                message.success('AI引擎创建成功');
            }
            setModalVisible(false);
        }
        catch (error) {
            console.error('Validation failed:', error);
        }
    };
    const getStats = () => {
        const total = engines.length;
        const active = engines.filter(e => e.status === 'active').length;
        const inactive = engines.filter(e => e.status === 'inactive').length;
        const error = engines.filter(e => e.status === 'error').length;
        const totalUsage = engines.reduce((sum, e) => sum + e.currentUsage, 0);
        const totalCapacity = engines.reduce((sum, e) => sum + e.rateLimit, 0);
        return {
            total,
            active,
            inactive,
            error,
            totalUsage,
            totalCapacity,
            utilization: totalCapacity > 0 ? ((totalUsage / totalCapacity) * 100).toFixed(1) : '0'
        };
    };
    const stats = getStats();
    return (<div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>AI引擎管理</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加引擎
          </Button>
          <Button>批量导入</Button>
          <Button>健康检查</Button>
        </Space>
      </div>

      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="总引擎数" value={stats.total} prefix={<RobotOutlined />}/>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="运行中" value={stats.active} valueStyle={{ color: '#52c41a' }} prefix={<PlayCircleOutlined />}/>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="已停止" value={stats.inactive} valueStyle={{ color: '#fa8c16' }} prefix={<StopOutlined />}/>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="使用率" value={`${stats.utilization}%`} valueStyle={{
            color: parseFloat(stats.utilization) > 80 ? '#ff4d4f' : '#52c41a'
        }}/>
          </Card>
        </Col>
      </Row>

      <Card title="AI引擎列表">
        <Table columns={columns} dataSource={engines} rowKey="id" pagination={{
            total: engines.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个AI引擎`
        }}/>
      </Card>

      <Modal title={editingEngine ? '编辑AI引擎' : '添加AI引擎'} open={modalVisible} onOk={handleSave} onCancel={() => setModalVisible(false)} width={700}>
        <Form form={form} layout="vertical">
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item name="name" label="引擎名称" rules={[{ required: true, message: '请输入引擎名称' }]}>
                <Input placeholder="请输入引擎名称"/>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="provider" label="服务提供商" rules={[{ required: true, message: '请选择服务提供商' }]}>
                <Select placeholder="选择服务提供商">
                  {providers.map(provider => (<Option key={provider.value} value={provider.value}>
                      {provider.label}
                    </Option>))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item name="type" label="引擎类型" rules={[{ required: true, message: '请选择引擎类型' }]}>
                <Select placeholder="选择引擎类型">
                  {engineTypes.map(type => (<Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="model" label="模型名称" rules={[{ required: true, message: '请输入模型名称' }]}>
                <Input placeholder="请输入模型名称"/>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="描述" rules={[{ required: true, message: '请输入描述' }]}>
            <TextArea rows={3} placeholder="请输入引擎描述"/>
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item name="rateLimit" label="速率限制" rules={[{ required: true, message: '请输入速率限制' }]}>
                <Input type="number" placeholder="每分钟请求次数"/>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Select placeholder="选择状态">
                  <Option value="active">运行中</Option>
                  <Option value="inactive">已停止</Option>
                  <Option value="error">错误</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="config" label="配置参数">
            <TextArea rows={4} placeholder="JSON格式的配置参数"/>
          </Form.Item>
        </Form>
      </Modal>
    </div>);
};
export default AIEngines;
//# sourceMappingURL=AIEngines.js.map
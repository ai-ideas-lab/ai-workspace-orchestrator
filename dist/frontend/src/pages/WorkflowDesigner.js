import React, { useState } from 'react';
import { Card, Button, Tabs, Typography, Row, Col, Space, Input, Select, Form, message } from 'antd';
import { SaveOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const WorkflowDesigner = () => {
    const [activeTab, setActiveTab] = useState('design');
    const [nodes, setNodes] = useState([
        {
            id: '1',
            type: 'start',
            name: '开始',
            config: {}
        },
        {
            id: '2',
            type: 'ai-analysis',
            name: 'AI数据收集',
            config: {
                model: 'gpt-4',
                prompt: '收集销售数据',
                timeout: 30
            }
        },
        {
            id: '3',
            type: 'processing',
            name: '数据处理',
            config: {
                operation: 'clean',
                format: 'csv'
            }
        },
        {
            id: '4',
            type: 'end',
            name: '结束',
            config: {}
        }
    ]);
    const [connections, setConnections] = useState([
        { id: 'c1', source: '1', target: '2' },
        { id: 'c2', source: '2', target: '3' },
        { id: 'c3', source: '3', target: '4' }
    ]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [form] = Form.useForm();
    const aiModels = [
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'claude-3', label: 'Claude-3' },
        { value: 'gemini', label: 'Gemini' },
        { value: 'text-bison', label: 'Text-Bison' }
    ];
    const nodeTypes = [
        { value: 'start', label: '开始', color: '#52c41a' },
        { value: 'ai-analysis', label: 'AI分析', color: '#1890ff' },
        { value: 'processing', label: '处理', color: '#722ed1' },
        { value: 'decision', label: '判断', color: '#fa8c16' },
        { value: 'notification', label: '通知', color: '#eb2f96' },
        { value: 'end', label: '结束', color: '#ff4d4f' }
    ];
    const handleNodeSelect = (node) => {
        setSelectedNode(node);
        form.setFieldsValue(node.config);
    };
    const handleConfigChange = async (values) => {
        if (selectedNode) {
            const updatedNode = {
                ...selectedNode,
                config: values
            };
            setNodes(nodes.map(n => n.id === selectedNode.id ? updatedNode : n));
        }
    };
    const handleSave = () => {
        message.success('工作流保存成功');
    };
    const handleTest = () => {
        message.success('工作流测试开始');
    };
    const renderNode = (node) => {
        const nodeType = nodeTypes.find(t => t.value === node.type);
        return (<div key={node.id} style={{
                padding: 12,
                border: `2px solid ${nodeType?.color || '#d9d9d9'}`,
                borderRadius: 8,
                background: '#fff',
                cursor: 'pointer',
                position: 'absolute',
                left: node.id === '1' ? 50 : node.id === '2' ? 250 : node.id === '3' ? 450 : 650,
                top: 100,
                minWidth: 120,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.3s'
            }} onClick={() => handleNodeSelect(node)}>
        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
          {node.name}
        </div>
        <div style={{ fontSize: 12, color: '#666' }}>
          {nodeType?.label}
        </div>
      </div>);
    };
    const renderConnection = (connection) => {
        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);
        if (!sourceNode || !targetNode)
            return null;
        const sourceX = sourceNode.id === '1' ? 110 : sourceNode.id === '2' ? 310 : sourceNode.id === '3' ? 510 : 710;
        const sourceY = 140;
        const targetX = targetNode.id === '1' ? 110 : targetNode.id === '2' ? 310 : targetNode.id === '3' ? 510 : 710;
        const targetY = 140;
        return (<svg key={connection.id} style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1
            }}>
        <line x1={sourceX} y1={sourceY} x2={targetX} y2={targetY} stroke="#1890ff" strokeWidth={2} markerEnd="url(#arrowhead)"/>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#1890ff"/>
          </marker>
        </defs>
      </svg>);
    };
    return (<div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>工作流设计器</Title>
        <Space>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            保存
          </Button>
          <Button type="default" icon={<PlayCircleOutlined />} onClick={handleTest}>
            测试
          </Button>
          <Button>导出</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="设计视图">
            <div style={{ position: 'relative', height: 400, background: '#f5f5f5', borderRadius: 8 }}>
              
              {connections.map(renderConnection)}
              
              
              {nodes.map(renderNode)}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={selectedNode ? `编辑: ${selectedNode.name}` : '节点配置'}>
            {selectedNode ? (<Form form={form} layout="vertical" onValuesChange={handleConfigChange}>
                <Form.Item name="model" label="AI模型" style={{ display: selectedNode.type === 'ai-analysis' ? 'block' : 'none' }}>
                  <Select placeholder="选择AI模型">
                    {aiModels.map(model => (<Option key={model.value} value={model.value}>
                        {model.label}
                      </Option>))}
                  </Select>
                </Form.Item>

                <Form.Item name="prompt" label="提示词" style={{ display: selectedNode.type === 'ai-analysis' ? 'block' : 'none' }}>
                  <Input.TextArea rows={3} placeholder="输入AI分析的提示词"/>
                </Form.Item>

                <Form.Item name="operation" label="操作类型" style={{ display: selectedNode.type === 'processing' ? 'block' : 'none' }}>
                  <Select placeholder="选择操作类型">
                    <Option value="clean">数据清洗</Option>
                    <Option value="transform">数据转换</Option>
                    <Option value="aggregate">数据聚合</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="format" label="输出格式" style={{ display: selectedNode.type === 'processing' ? 'block' : 'none' }}>
                  <Select placeholder="选择输出格式">
                    <Option value="csv">CSV</Option>
                    <Option value="json">JSON</Option>
                    <Option value="xml">XML</Option>
                  </Select>
                </Form.Item>

                <Space style={{ marginTop: 16 }}>
                  <Button type="primary" onClick={() => message.success('配置已保存')}>
                    保存配置
                  </Button>
                  <Button danger icon={<DeleteOutlined />}>
                    删除节点
                  </Button>
                </Space>
              </Form>) : (<Text type="secondary">请选择一个节点进行配置</Text>)}
          </Card>
        </Col>
      </Row>
    </div>);
};
export default WorkflowDesigner;
//# sourceMappingURL=WorkflowDesigner.js.map
import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Button, Input, Select, Space, Typography, Modal, Tabs, Tag, Divider, Switch, Slider, message, Drawer, Popconfirm, Progress, List, Timeline, Statistic, Collapse } from 'antd';
import { WorkflowOutlined, DeleteOutlined, PlayCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SaveOutlined, ReloadOutlined, SettingOutlined, RobotOutlined, ApiOutlined, DatabaseOutlined, BranchesOutlined, UserOutlined, SyncOutlined } from '@ant-design/icons';
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;
const EnhancedWorkflowDesigner = () => {
    const [workflows, setWorkflows] = useState([]);
    const [connections, setConnections] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [workflowName, setWorkflowName] = useState('');
    const [workflowDescription, setWorkflowDescription] = useState('');
    const [activeTab, setActiveTab] = useState('design');
    const [templates, setTemplates] = useState([]);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [autoSave, setAutoSave] = useState(true);
    const [saveInterval, setSaveInterval] = useState(30);
    const [recentWorkflows, setRecentWorkflows] = useState([]);
    const canvasRef = useRef(null);
    useEffect(() => {
        const mockTemplates = [
            {
                id: '1',
                name: '文档摘要生成',
                description: '自动分析文档内容并生成摘要',
                category: '文档处理',
                difficulty: 'easy',
                tags: ['文档', 'AI', '摘要'],
                preview: 'https://via.placeholder.com/300x200/1890ff/ffffff?text=文档摘要'
            },
            {
                id: '2',
                name: '代码审查',
                description: '自动分析代码质量并提供改进建议',
                category: '开发工具',
                difficulty: 'medium',
                tags: ['代码', 'AI', '质量'],
                preview: 'https://via.placeholder.com/300x200/52c41a/ffffff?text=代码审查'
            },
            {
                id: '3',
                name: '会议纪要生成',
                description: '根据会议录音和笔记生成结构化纪要',
                category: '办公自动化',
                difficulty: 'hard',
                tags: ['会议', 'AI', '文档'],
                preview: 'https://via.placeholder.com/300x200/722ed1/ffffff?text=会议纪要'
            },
            {
                id: '4',
                name: '数据分析报告',
                description: '自动分析数据并生成可视化报告',
                category: '数据分析',
                difficulty: 'medium',
                tags: ['数据', 'AI', '报告'],
                preview: 'https://via.placeholder.com/300x200/fa8c16/ffffff?text=数据分析'
            }
        ];
        setTemplates(mockTemplates);
    }, []);
    const initializeWorkflow = () => {
        const sampleNodes = [
            {
                id: 'start',
                type: 'start',
                name: '开始',
                position: { x: 50, y: 50 },
                config: {},
                inputs: [],
                outputs: ['document']
            },
            {
                id: 'ai-analysis',
                type: 'ai',
                name: 'AI分析',
                description: '使用AI分析文档内容',
                position: { x: 200, y: 50 },
                config: {
                    model: 'gpt-4',
                    prompt: '分析文档内容并提取关键信息',
                    temperature: 0.7
                },
                inputs: ['document'],
                outputs: ['analysis', 'summary']
            },
            {
                id: 'condition',
                type: 'condition',
                name: '条件判断',
                description: '判断分析结果是否满意',
                position: { x: 350, y: 50 },
                config: {
                    condition: 'analysis.score > 80',
                    trueBranch: 'save',
                    falseBranch: 'retry'
                },
                inputs: ['analysis'],
                outputs: ['save', 'retry']
            },
            {
                id: 'save',
                type: 'data',
                name: '保存结果',
                description: '保存分析结果到数据库',
                position: { x: 500, y: 20 },
                config: {
                    format: 'json',
                    database: 'results',
                    collection: 'analyses'
                },
                inputs: ['analysis'],
                outputs: ['saved']
            },
            {
                id: 'retry',
                type: 'loop',
                name: '重试分析',
                description: '重新尝试分析',
                position: { x: 500, y: 80 },
                config: {
                    maxRetries: 3,
                    retryDelay: 5000
                },
                inputs: ['analysis'],
                outputs: ['retry-loop']
            },
            {
                id: 'end',
                type: 'end',
                name: '结束',
                description: '工作流完成',
                position: { x: 650, y: 50 },
                config: {},
                inputs: ['saved', 'retry-loop'],
                outputs: []
            }
        ];
        const sampleConnections = [
            {
                id: 'c1',
                source: 'start',
                target: 'ai-analysis',
                type: 'normal'
            },
            {
                id: 'c2',
                source: 'ai-analysis',
                target: 'condition',
                type: 'normal'
            },
            {
                id: 'c3',
                source: 'condition',
                target: 'save',
                type: 'conditional',
                condition: 'analysis.score > 80'
            },
            {
                id: 'c4',
                source: 'condition',
                target: 'retry',
                type: 'conditional',
                condition: 'analysis.score <= 80'
            },
            {
                id: 'c5',
                source: 'save',
                target: 'end',
                type: 'normal'
            },
            {
                id: 'c6',
                source: 'retry',
                target: 'ai-analysis',
                type: 'normal'
            }
        ];
        setWorkflows(sampleNodes);
        setConnections(sampleConnections);
    };
    useEffect(() => {
        initializeWorkflow();
        loadRecentWorkflows();
    }, []);
    const loadRecentWorkflows = () => {
        const mockRecent = [
            { id: '1', name: '文档摘要生成', lastModified: '2分钟前', executions: 15 },
            { id: '2', name: '代码审查', lastModified: '1小时前', executions: 8 },
            { id: '3', name: '会议纪要生成', lastModified: '昨天', executions: 3 }
        ];
        setRecentWorkflows(mockRecent);
    };
    useEffect(() => {
        if (!autoSave)
            return;
        const interval = setInterval(() => {
            saveWorkflow();
        }, saveInterval * 1000);
        return () => clearInterval(interval);
    }, [autoSave, saveInterval, workflows, connections]);
    const saveWorkflow = () => {
        if (!workflowName.trim()) {
            message.warning('请输入工作流名称');
            return;
        }
        message.success('工作流已保存');
        const newWorkflow = {
            id: Date.now().toString(),
            name: workflowName,
            lastModified: '刚刚',
            executions: 0
        };
        setRecentWorkflows(prev => [newWorkflow, ...prev.slice(0, 4)]);
    };
    const addNode = (type) => {
        const newNode = {
            id: `node-${Date.now()}`,
            type,
            name: `${type} 节点`,
            description: `新增的${type}节点`,
            position: { x: 100, y: 200 },
            config: getDefaultConfig(type),
            inputs: [],
            outputs: []
        };
        setWorkflows(prev => [...prev, newNode]);
        setSelectedNode(newNode);
        setIsEditing(true);
    };
    const getDefaultConfig = (type) => {
        switch (type) {
            case 'ai':
                return {
                    model: 'gpt-4',
                    prompt: '',
                    temperature: 0.7,
                    maxTokens: 1000
                };
            case 'condition':
                return {
                    condition: '',
                    trueBranch: '',
                    falseBranch: ''
                };
            case 'api':
                return {
                    url: '',
                    method: 'GET',
                    headers: {},
                    body: {}
                };
            case 'data':
                return {
                    format: 'json',
                    storage: 'database',
                    path: ''
                };
            default:
                return {};
        }
    };
    const deleteNode = (nodeId) => {
        setWorkflows(prev => prev.filter(node => node.id !== nodeId));
        setConnections(prev => prev.filter(conn => conn.source !== nodeId && conn.target !== nodeId));
        if (selectedNode?.id === nodeId) {
            setSelectedNode(null);
        }
    };
    const createWorkflowFromTemplate = (template) => {
        setWorkflowName(template.name);
        setWorkflowDescription(template.description);
        message.success(`已创建模板 "${template.name}"`);
        setIsTemplateModalOpen(false);
    };
    const runWorkflow = async () => {
        if (!workflowName.trim()) {
            message.warning('请输入工作流名称');
            return;
        }
        setIsPlaying(true);
        try {
            const nodes = [...workflows];
            let currentIndex = 0;
            const runInterval = setInterval(() => {
                if (currentIndex >= nodes.length) {
                    clearInterval(runInterval);
                    setIsPlaying(false);
                    message.success('工作流执行完成');
                    return;
                }
                const node = nodes[currentIndex];
                node.status = 'running';
                node.progress = 0;
                setWorkflows([...nodes]);
                setTimeout(() => {
                    node.status = 'completed';
                    node.progress = 100;
                    setWorkflows([...nodes]);
                    currentIndex++;
                }, 2000);
            }, 3000);
        }
        catch (error) {
            setIsPlaying(false);
            message.error('工作流执行失败');
        }
    };
    const getNodeIcon = (type) => {
        switch (type) {
            case 'start': return <PlayCircleOutlined />;
            case 'end': return <CheckCircleOutlined />;
            case 'ai': return <RobotOutlined />;
            case 'condition': return <BranchesOutlined />;
            case 'data': return <DatabaseOutlined />;
            case 'api': return <ApiOutlined />;
            case 'human': return <UserOutlined />;
            case 'loop': return <SyncOutlined />;
            default: return <WorkflowOutlined />;
        }
    };
    const getNodeColor = (type) => {
        switch (type) {
            case 'start': return '#52c41a';
            case 'end': return '#1890ff';
            case 'ai': return '#722ed1';
            case 'condition': return '#fa8c16';
            case 'data': return '#13c2c2';
            case 'api': return '#f5222d';
            case 'human': return '#13c2c2';
            case 'loop': return '#faad14';
            default: return '#d9d9d9';
        }
    };
    return (<div style={{ padding: '20px', minHeight: '100vh' }}>
      
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            工作流设计器
          </Title>
          <Text type="secondary">
            {workflowName || '未命名工作流'} - {workflowDescription || '暂无描述'}
          </Text>
        </div>

        <Space>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={runWorkflow} loading={isPlaying} disabled={!workflowName.trim()}>
            {isPlaying ? '运行中...' : '运行工作流'}
          </Button>

          <Button icon={<SaveOutlined />} onClick={saveWorkflow} disabled={!workflowName.trim()}>
            保存
          </Button>

          <Button icon={<ReloadOutlined />} onClick={initializeWorkflow}>
            重置
          </Button>

          <Button icon={<SettingOutlined />} onClick={() => setIsSettingsOpen(true)}>
            设置
          </Button>

          <Button icon={<TemplateOutlined />} onClick={() => setIsTemplateModalOpen(true)}>
            模板库
          </Button>
        </Space>
      </div>

      
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="设计视图" key="design">
            <Row gutter={16}>
              
              <Col span={4}>
                <Card title="组件库" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button icon={<PlayCircleOutlined />} type="dashed" block onClick={() => addNode('start')}>
                      开始节点
                    </Button>
                    <Button icon={<RobotOutlined />} type="dashed" block onClick={() => addNode('ai')}>
                      AI节点
                    </Button>
                    <Button icon={<BranchesOutlined />} type="dashed" block onClick={() => addNode('condition')}>
                      条件判断
                    </Button>
                    <Button icon={<DatabaseOutlined />} type="dashed" block onClick={() => addNode('data')}>
                      数据处理
                    </Button>
                    <Button icon={<ApiOutlined />} type="dashed" block onClick={() => addNode('api')}>
                      API调用
                    </Button>
                    <Button icon={<SyncOutlined />} type="dashed" block onClick={() => addNode('loop')}>
                      循环处理
                    </Button>
                    <Button icon={<UserOutlined />} type="dashed" block onClick={() => addNode('human')}>
                      人工审核
                    </Button>
                    <Button icon={<CheckCircleOutlined />} type="dashed" block onClick={() => addNode('end')}>
                      结束节点
                    </Button>
                  </Space>
                </Card>

                
                {selectedNode && (<Card title="节点属性" size="small" style={{ marginTop: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Input value={selectedNode.name} onChange={(e) => {
                setSelectedNode({
                    ...selectedNode,
                    name: e.target.value
                });
            }} placeholder="节点名称"/>
                      <TextArea value={selectedNode.description} onChange={(e) => {
                setSelectedNode({
                    ...selectedNode,
                    description: e.target.value
                });
            }} placeholder="节点描述" rows={3}/>
                      
                      
                      <Collapse size="small">
                        <Panel header="高级配置" key="config">
                          {selectedNode.type === 'ai' && (<Space direction="vertical" style={{ width: '100%' }}>
                              <Select value={selectedNode.config.model} onChange={(value) => {
                    setSelectedNode({
                        ...selectedNode,
                        config: { ...selectedNode.config, model: value }
                    });
                }} style={{ width: '100%' }}>
                                <Option value="gpt-4">GPT-4</Option>
                                <Option value="claude-3">Claude-3</Option>
                                <Option value="gemini-pro">Gemini Pro</Option>
                              </Select>
                              <Input placeholder="提示词" value={selectedNode.config.prompt} onChange={(e) => {
                    setSelectedNode({
                        ...selectedNode,
                        config: { ...selectedNode.config, prompt: e.target.value }
                    });
                }}/>
                              <Slider min={0} max={2} step={0.1} value={selectedNode.config.temperature || 0.7} onChange={(value) => {
                    setSelectedNode({
                        ...selectedNode,
                        config: { ...selectedNode.config, temperature: value }
                    });
                }} tooltip={{ formatter: (value) => `温度: ${value}` }}/>
                            </Space>)}
                        </Panel>
                      </Collapse>

                      <Popconfirm title="确定要删除这个节点吗？" onConfirm={() => deleteNode(selectedNode.id)} okText="确定" cancelText="取消">
                        <Button danger icon={<DeleteOutlined />} block>
                          删除节点
                        </Button>
                      </Popconfirm>
                    </Space>
                  </Card>)}
              </Col>

              
              <Col span={16}>
                <Card title="画布" style={{ height: '600px', position: 'relative' }}>
                  <div ref={canvasRef} style={{
            width: '100%',
            height: '100%',
            background: '#f5f5f5',
            position: 'relative',
            overflow: 'auto'
        }}>
                    
                    {workflows.map((node) => (<div key={node.id} style={{
                position: 'absolute',
                left: node.position.x,
                top: node.position.y,
                padding: '12px 16px',
                background: getNodeColor(node.type),
                color: 'white',
                borderRadius: '8px',
                cursor: 'move',
                minWidth: '120px',
                textAlign: 'center',
                border: selectedNode?.id === node.id ? '2px solid #1890ff' : 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease'
            }} onClick={() => setSelectedNode(node)} onMouseDown={(e) => {
                e.preventDefault();
            }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          {getNodeIcon(node.type)}
                          <span style={{ fontSize: '14px', fontWeight: '500' }}>{node.name}</span>
                        </div>
                        
                        
                        {node.status === 'running' && (<div style={{ marginTop: '8px' }}>
                            <Progress percent={node.progress || 0} size="small" strokeColor="white" showInfo={false}/>
                          </div>)}
                        
                        
                        <div style={{ marginTop: '4px' }}>
                          {node.status === 'completed' && (<CheckCircleOutlined style={{ color: 'white', fontSize: '16px' }}/>)}
                          {node.status === 'error' && (<ExclamationCircleOutlined style={{ color: 'white', fontSize: '16px' }}/>)}
                        </div>
                      </div>))}

                    
                    {connections.map((conn) => {
            const sourceNode = workflows.find(n => n.id === conn.source);
            const targetNode = workflows.find(n => n.id === conn.target);
            if (!sourceNode || !targetNode)
                return null;
            return (<svg key={conn.id} style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 1
                }}>
                          <line x1={sourceNode.position.x + 60} y1={sourceNode.position.y + 20} x2={targetNode.position.x} y2={targetNode.position.y + 20} stroke={conn.type === 'normal' ? '#1890ff' : conn.type === 'conditional' ? '#fa8c16' : '#f5222d'} strokeWidth="2" markerEnd="url(#arrowhead)"/>
                        </svg>);
        })}
                  </div>
                </Card>
              </Col>

              
              <Col span={4}>
                <Card title="最近工作流" size="small">
                  <List size="small" dataSource={recentWorkflows} renderItem={(item) => (<List.Item actions={[
                <Button key="open" type="link" size="small">
                            打开
                          </Button>,
                <Button key="delete" type="link" danger size="small">
                            删除
                          </Button>
            ]}>
                        <List.Item.Meta title={item.name} description={<div>
                              <div>最后修改: {item.lastModified}</div>
                              <div>执行次数: {item.executions}</div>
                            </div>}/>
                      </List.Item>)}/>
                </Card>

                <Card title="统计信息" size="small" style={{ marginTop: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Statistic title="节点数量" value={workflows.length}/>
                    <Statistic title="连接数量" value={connections.length}/>
                    <Statistic title="完成率" value={workflows.filter(n => n.status === 'completed').length} suffix={`/ ${workflows.length}`}/>
                  </Space>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="执行历史" key="history">
            <Timeline mode="left">
              <Timeline.Item color="green">
                <Text strong>工作流执行成功</Text>
                <Text type="secondary">2024-03-30 14:30</Text>
                <div>文档摘要生成 - 执行完成，用时 2分15秒</div>
              </Timeline.Item>
              <Timeline.Item color="blue">
                <Text strong>工作流开始执行</Text>
                <Text type="secondary">2024-03-30 14:28</Text>
                <div>文档摘要生成 - 开始处理</div>
              </Timeline.Item>
              <Timeline.Item color="red">
                <Text strong>工作流执行失败</Text>
                <Text type="secondary">2024-03-30 12:45</Text>
                <div>代码审查 - AI服务超时</div>
              </Timeline.Item>
            </Timeline>
          </TabPane>
        </Tabs>
      </Card>

      
      <Modal title="工作流模板库" open={isTemplateModalOpen} onCancel={() => setIsTemplateModalOpen(false)} width={800} footer={null}>
        <Row gutter={16}>
          {templates.map((template) => (<Col span={12} key={template.id}>
              <Card hoverable cover={<div style={{ height: 120, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text type="secondary">模板预览</Text>
                  </div>} actions={[
                <Button key="use" type="primary" onClick={() => createWorkflowFromTemplate(template)}>
                    使用模板
                  </Button>
            ]}>
                <Card.Meta title={template.name} description={<div>
                      <Text type="secondary">{template.description}</Text>
                      <div style={{ marginTop: 8 }}>
                        <Tag color={template.difficulty === 'easy' ? 'green' : template.difficulty === 'medium' ? 'orange' : 'red'}>
                          {template.difficulty === 'easy' ? '简单' : template.difficulty === 'medium' ? '中等' : '困难'}
                        </Tag>
                        <Tag color="blue">{template.category}</Tag>
                      </div>
                    </div>}/>
              </Card>
            </Col>))}
        </Row>
      </Modal>

      
      <Drawer title="工作流设置" open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} width={400}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={4}>自动保存</Title>
          <Switch checked={autoSave} onChange={setAutoSave} checkedChildren="开启" unCheckedChildren="关闭"/>
          {autoSave && (<div>
              <Text type="secondary">保存间隔: {saveInterval} 秒</Text>
              <Slider min={10} max={120} step={10} value={saveInterval} onChange={setSaveInterval} style={{ marginTop: 8 }}/>
            </div>)}

          <Divider />

          <Title level={4}>AI模型配置</Title>
          <Select defaultValue="gpt-4" style={{ width: '100%' }}>
            <Option value="gpt-4">GPT-4</Option>
            <Option value="claude-3">Claude-3</Option>
            <Option value="gemini-pro">Gemini Pro</Option>
          </Select>

          <Divider />

          <Title level={4}>通知设置</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Switch checked={true}/>
              <span style={{ marginLeft: 8 }}>工作流完成通知</span>
            </div>
            <div>
              <Switch checked={true}/>
              <span style={{ marginLeft: 8 }}>错误警报通知</span>
            </div>
            <div>
              <Switch checked={false}/>
              <span style={{ marginLeft: 8 }}>每日报告通知</span>
            </div>
          </Space>
        </Space>
      </Drawer>
    </div>);
};
export default EnhancedWorkflowDesigner;
const TemplateOutlined = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
  </svg>);
//# sourceMappingURL=EnhancedWorkflowDesigner.js.map
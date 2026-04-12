import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Tag, Button, List, Avatar, Badge, Spin, Select, DatePicker, Tabs, Input, Segmented, Empty, notification, message } from 'antd';
import { WorkflowOutlined, UserOutlined, TeamOutlined, RobotOutlined, PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, AlertCircleOutlined, EditOutlined, BellOutlined, SettingOutlined, ReloadOutlined, DownloadOutlined, FullscreenOutlined, ThunderboltOutlined, BulbOutlined, DatabaseOutlined, ThunderboltOutlined as ThunderboltOutlinedAlias, } from '@ant-design/icons';
import { workflowApi, statsApi } from '../services/api';
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;
const { Segment } = Segmented;
const EnhancedDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('week');
    const [recentWorkflows, setRecentWorkflows] = useState([]);
    const [activities, setActivities] = useState([]);
    const [systemHealth, setSystemHealth] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showNotifications, setShowNotifications] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [fullscreen, setFullscreen] = useState(false);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [filteredWorkflows, setFilteredWorkflows] = useState([]);
    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 30000);
        return () => clearInterval(interval);
    }, [timeRange]);
    useEffect(() => {
        let filtered = activities;
        if (filterType !== 'all') {
            filtered = activities.filter(activity => activity.type === filterType);
        }
        if (searchTerm) {
            filtered = filtered.filter(activity => activity.message.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        setFilteredActivities(filtered);
        let workflowFiltered = recentWorkflows;
        if (searchTerm) {
            workflowFiltered = recentWorkflows.filter(workflow => workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                workflow.description.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        setFilteredWorkflows(workflowFiltered);
    }, [activities, recentWorkflows, searchTerm, filterType]);
    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [statsRes, workflowsRes, healthRes] = await Promise.all([
                statsApi.getUsageStats(timeRange),
                workflowApi.getWorkflows(),
                loadSystemHealth()
            ]);
            setStats(statsRes.data);
            setRecentWorkflows(workflowsRes.data.slice(0, 10));
            setSystemHealth(healthRes.data);
            const newActivities = [
                { id: 1, type: 'workflow', message: '工作流 "文档摘要生成" 执行成功', time: '2分钟前', icon: <CheckCircleOutlined style={{ color: '#52c41a' }}/>, priority: 'medium' },
                { id: 2, type: 'user', message: '用户创建了新工作流 "会议纪要生成"', time: '15分钟前', icon: <UserOutlined style={{ color: '#1890ff' }}/>, priority: 'low' },
                { id: 3, type: 'ai', message: 'AI代理 "Claude 3 Opus" 已配置', time: '1小时前', icon: <RobotOutlined style={{ color: '#722ed1' }}/>, priority: 'low' },
                { id: 4, type: 'team', message: '团队 "开发组" 添加了新成员', time: '2小时前', icon: <TeamOutlined style={{ color: '#fa8c16' }}/>, priority: 'medium' },
                { id: 5, type: 'system', message: '系统备份完成', time: '3小时前', icon: <ClockCircleOutlined style={{ color: '#13c2c2' }}/>, priority: 'low' },
                { id: 6, type: 'workflow', message: '工作流 "代码审查" 执行失败', time: '5分钟前', icon: <AlertCircleOutlined style={{ color: '#f5222d' }}/>, priority: 'high' },
                { id: 7, type: 'ai', message: 'AI代理 "GPT-4" 响应时间优化完成', time: '30分钟前', icon: <ThunderboltOutlined style={{ color: '#52c41a' }}/>, priority: 'medium' },
                { id: 8, type: 'system', message: '数据库连接池优化', time: '1小时前', icon: <DatabaseOutlined style={{ color: '#1890ff' }}/>, priority: 'low' },
            ];
            setActivities(newActivities);
            checkSystemHealth(healthRes.data);
        }
        catch (error) {
            console.error('加载数据失败:', error);
            notification.error({
                message: '数据加载失败',
                description: '无法加载仪表板数据，请检查网络连接',
            });
        }
        finally {
            setLoading(false);
        }
    };
    const checkSystemHealth = (health) => {
        Object.entries(health).forEach(([service, data]) => {
            if (data.status === 'critical') {
                notification.error({
                    message: `${service} 服务严重错误`,
                    description: `错误率: ${data.errorRate}%, 响应时间: ${data.responseTime}ms`,
                    duration: 0,
                });
            }
            else if (data.errorRate > 5) {
                notification.warning({
                    message: `${service} 服务性能下降`,
                    description: `错误率: ${data.errorRate}%`,
                });
            }
        });
    };
    const loadSystemHealth = async () => {
        return {
            openai: { status: 'healthy', responseTime: 120, errorRate: 0.5 },
            anthropic: { status: 'healthy', responseTime: 95, errorRate: 0.3 },
            google: { status: 'degraded', responseTime: 180, errorRate: 2.1 },
            database: { status: 'healthy', responseTime: 45, errorRate: 0.1 },
            redis: { status: 'healthy', responseTime: 12, errorRate: 0.0 }
        };
    };
    const getHealthColor = (status) => {
        switch (status) {
            case 'healthy': return '#52c41a';
            case 'degraded': return '#fa8c16';
            case 'critical': return '#f5222d';
            default: return '#d9d9d9';
        }
    };
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#f5222d';
            case 'medium': return '#fa8c16';
            case 'low': return '#52c41a';
            default: return '#d9d9d9';
        }
    };
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY'
        }).format(amount);
    };
    const formatNumber = (num) => {
        if (num >= 1000000)
            return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000)
            return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };
    const handleRefresh = () => {
        loadDashboardData();
        message.success('数据已刷新');
    };
    const handleExport = () => {
        message.info('导出功能开发中...');
    };
    const toggleFullscreen = () => {
        setFullscreen(!fullscreen);
        if (!fullscreen) {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            }
        }
        else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };
    if (loading && !stats) {
        return (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large"/>
      </div>);
    }
    return (<div style={{
            padding: fullscreen ? '20px' : '0px',
            background: fullscreen ? '#f5f5f5' : 'none',
            minHeight: fullscreen ? '100vh' : 'auto'
        }}>
      
      <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Title level={2} style={{ margin: 0 }}>
            仪表板
          </Title>
          <Badge count={activities.filter(a => a.priority === 'high').length} showZero>
            <BellOutlined style={{ fontSize: '20px', color: '#1890ff' }}/>
          </Badge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Search placeholder="搜索活动或工作流..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: 250 }} allowClear/>
          
          <Segmented value={filterType} onChange={setFilterType} options={[
            { label: '全部', value: 'all' },
            { label: '工作流', value: 'workflow' },
            { label: '用户', value: 'user' },
            { label: 'AI', value: 'ai' },
            { label: '团队', value: 'team' },
            { label: '系统', value: 'system' },
        ]}/>

          <Segmented value={viewMode} onChange={setViewMode} options={[
            { label: '网格', value: 'grid' },
            { label: '列表', value: 'list' },
        ]}/>

          <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }}>
            <Option value="day">今日</Option>
            <Option value="week">本周</Option>
            <Option value="month">本月</Option>
          </Select>

          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}/>
          
          <Button icon={<FullscreenOutlined />} onClick={toggleFullscreen}/>
          
          <Button icon={<DownloadOutlined />} onClick={handleExport}/>
        </div>
      </div>

      
      {stats && (<Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="总工作流数" value={stats.totalWorkflows} prefix={<WorkflowOutlined />} suffix={<span style={{ color: '#3f8600', fontSize: '12px' }}>
                    +12%
                  </span>}/>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="今日执行次数" value={stats.todayExecutions} prefix={<PlayCircleOutlined />} suffix={<span style={{ color: '#cf1322', fontSize: '12px' }}>
                    -5%
                  </span>}/>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="成功率" value={stats.successRate} precision={1} suffix="%" prefix={<CheckCircleOutlined />} valueStyle={{ color: '#3f8600' }}/>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="AI成本" value={stats.aiCost} precision={2} prefix={<ThunderboltOutlinedAlias />} suffix="元" valueStyle={{ color: '#1890ff' }}/>
            </Card>
          </Col>
        </Row>)}

      
      <Row gutter={[16, 16]}>
        
        <Col xs={24} lg={16}>
          <Tabs defaultActiveKey="workflows" type="card">
            <TabPane tab="工作流管理" key="workflows">
              <Card title={viewMode === 'grid' ? '最近工作流' : '工作流列表'} extra={<Button type="primary" icon={<EditOutlined />}>
                    创建工作流
                  </Button>}>
                {filteredWorkflows.length > 0 ? (viewMode === 'grid' ? (<Row gutter={[16, 16]}>
                      {filteredWorkflows.map((workflow) => (<Col xs={24} sm={12} lg={8} key={workflow.id}>
                          <Card hoverable style={{ marginBottom: 16 }} actions={[
                    <Button key="execute" type="primary" icon={<PlayCircleOutlined />}>
                                执行
                              </Button>,
                    <Button key="edit" icon={<EditOutlined />}>
                                编辑
                              </Button>,
                    <Button key="settings" icon={<SettingOutlined />}>
                                设置
                              </Button>
                ]}>
                            <Card.Meta avatar={<Avatar icon={<WorkflowOutlined />} style={{ backgroundColor: '#1890ff' }}/>} title={workflow.name} description={workflow.description}/>
                            <div style={{ marginTop: 16 }}>
                              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                <Tag color="blue">{workflow.status}</Tag>
                                <Text type="secondary">
                                  执行次数: {workflow.executionCount}
                                </Text>
                                <Text type="secondary">
                                  最后执行: {workflow.lastExecution}
                                </Text>
                              </Space>
                            </div>
                          </Card>
                        </Col>))}
                    </Row>) : (<List dataSource={filteredWorkflows} renderItem={(workflow) => (<List.Item actions={[
                    <Button key="execute" type="primary" icon={<PlayCircleOutlined />}>
                              执行
                            </Button>,
                    <Button key="edit" icon={<EditOutlined />}>
                              编辑
                            </Button>,
                    <Button key="settings" icon={<SettingOutlined />}>
                              设置
                            </Button>
                ]}>
                          <List.Item.Meta avatar={<Avatar icon={<WorkflowOutlined />} style={{ backgroundColor: '#1890ff' }}/>} title={workflow.name} description={workflow.description}/>
                          <div>
                            <Tag color="blue">{workflow.status}</Tag>
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              执行次数: {workflow.executionCount}
                            </Text>
                          </div>
                        </List.Item>)}/>)) : (<Empty description="暂无工作流"/>)}
              </Card>
            </TabPane>

            <TabPane tab="系统健康状态" key="health">
              {systemHealth && (<Card title="AI服务状态">
                  <Row gutter={[16, 16]}>
                    {Object.entries(systemHealth).map(([service, data]) => (<Col xs={24} sm={12} lg={8} key={service}>
                        <Card size="small">
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: getHealthColor(data.status),
                    marginRight: 8
                }}/>
                            <Text strong style={{ textTransform: 'capitalize' }}>
                              {service}
                            </Text>
                          </div>
                          <Space direction="vertical" size="small">
                            <Text type="secondary">状态: {data.status}</Text>
                            <Text type="secondary">响应时间: {data.responseTime}ms</Text>
                            <Text type="secondary">错误率: {data.errorRate}%</Text>
                          </Space>
                        </Card>
                      </Col>))}
                  </Row>
                </Card>)}
            </TabPane>
          </Tabs>
        </Col>

        
        <Col xs={24} lg={8}>
          <Card title="实时活动" extra={<Button type="text" icon={<BellOutlined />} onClick={() => setShowNotifications(!showNotifications)}/>}>
            {filteredActivities.length > 0 ? (<List dataSource={filteredActivities} renderItem={(activity) => (<List.Item style={{ padding: '8px 0' }}>
                    <List.Item.Meta avatar={<Avatar style={{
                        backgroundColor: activity.type === 'workflow' ? '#1890ff' :
                            activity.type === 'user' ? '#52c41a' :
                                activity.type === 'ai' ? '#722ed1' :
                                    activity.type === 'team' ? '#fa8c16' : '#13c2c2'
                    }}>
                          {activity.icon}
                        </Avatar>} title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Text strong>{activity.message}</Text>
                          <Badge color={getPriorityColor(activity.priority)} text={activity.priority === 'high' ? '高优先级' :
                        activity.priority === 'medium' ? '中优先级' : '低优先级'}/>
                        </div>} description={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text type="secondary">{activity.time}</Text>
                          <Button type="text" size="small">
                            详情
                          </Button>
                        </div>}/>
                  </List.Item>)}/>) : (<Empty description="暂无活动"/>)}
          </Card>

          
          <Card title="快速操作" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block icon={<BulbOutlined />}>
                新建工作流
              </Button>
              <Button block icon={<RobotOutlined />}>
                配置AI代理
              </Button>
              <Button block icon={<TeamOutlined />}>
                管理团队
              </Button>
              <Button block icon={<SettingOutlined />}>
                系统设置
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>);
};
export default EnhancedDashboard;
//# sourceMappingURL=EnhancedDashboard.js.map
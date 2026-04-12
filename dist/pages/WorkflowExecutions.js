import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Typography, Progress, Row, Col, Statistic } from 'antd';
import { ReloadOutlined, EyeOutlined, StopOutlined, PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import WorkflowExecutionHistory from '../components/WorkflowExecutionHistory';
const { Title, Text } = Typography;
const WorkflowExecutions = () => {
    const [executions, setExecutions] = useState([
        {
            id: '1',
            workflowName: '数据处理工作流',
            status: 'success',
            startTime: '2026-04-05 10:30:00',
            endTime: '2026-04-05 10:32:15',
            duration: '2分15秒',
            progress: 100,
            message: '数据处理完成',
            executor: 'admin'
        },
        {
            id: '2',
            workflowName: 'AI内容生成',
            status: 'running',
            startTime: '2026-04-05 10:35:00',
            progress: 65,
            message: '正在生成内容...',
            executor: 'system'
        },
        {
            id: '3',
            workflowName: '用户反馈分析',
            status: 'failed',
            startTime: '2026-04-05 10:40:00',
            endTime: '2026-04-05 10:42:30',
            duration: '2分30秒',
            progress: 45,
            message: 'AI服务连接失败',
            executor: 'admin'
        },
        {
            id: '4',
            workflowName: '报告分析',
            status: 'pending',
            startTime: '2026-04-05 11:00:00',
            progress: 0,
            message: '等待执行',
            executor: 'scheduled'
        },
        {
            id: '5',
            workflowName: '数据备份',
            status: 'success',
            startTime: '2026-04-05 09:00:00',
            endTime: '2026-04-05 09:05:00',
            duration: '5分钟',
            progress: 100,
            message: '备份完成',
            executor: 'system'
        }
    ]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
    const stats = {
        total: executions.length,
        running: executions.filter(e => e.status === 'running').length,
        success: executions.filter(e => e.status === 'success').length,
        failed: executions.filter(e => e.status === 'failed').length,
        successRate: ((executions.filter(e => e.status === 'success').length / executions.length) * 100).toFixed(1)
    };
    const columns = [
        {
            title: '工作流名称',
            dataIndex: 'workflowName',
            key: 'workflowName',
            render: (text, record) => (<div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ color: '#666', fontSize: 12 }}>{record.message}</div>
        </div>)
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const statusConfig = {
                    running: { color: 'processing', text: '运行中', icon: <PlayCircleOutlined /> },
                    success: { color: 'success', text: '成功', icon: <CheckCircleOutlined /> },
                    failed: { color: 'error', text: '失败', icon: <ExclamationCircleOutlined /> },
                    pending: { color: 'default', text: '等待', icon: <ClockCircleOutlined /> }
                };
                const config = statusConfig[status];
                return (<Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>);
            }
        },
        {
            title: '进度',
            dataIndex: 'progress',
            key: 'progress',
            render: (progress) => (<Progress percent={progress} size="small" status={progress === 100 ? 'success' : 'active'}/>)
        },
        {
            title: '开始时间',
            dataIndex: 'startTime',
            key: 'startTime'
        },
        {
            title: '执行时长',
            dataIndex: 'duration',
            key: 'duration',
            render: (duration, record) => {
                if (record.status === 'running') {
                    return <Text type="processing">进行中</Text>;
                }
                return duration || '-';
            }
        },
        {
            title: '执行者',
            dataIndex: 'executor',
            key: 'executor',
            render: (executor) => {
                const executorMap = {
                    admin: { text: '管理员', color: 'blue' },
                    system: { text: '系统', color: 'green' },
                    scheduled: { text: '定时任务', color: 'orange' }
                };
                const config = executorMap[executor];
                return <Tag color={config.color}>{config.text}</Tag>;
            }
        },
        {
            title: '操作',
            key: 'actions',
            render: (text, record) => (<Space>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleViewDetail(record)}>
            查看详情
          </Button>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleViewWorkflowHistory(record.workflowName)}>
            执行历史
          </Button>
          {record.status === 'running' && (<Button type="link" danger icon={<StopOutlined />} size="small" onClick={() => handleStop(record)}>
              停止
            </Button>)}
          {record.status === 'pending' && (<Button type="link" icon={<PlayCircleOutlined />} size="small" onClick={() => handleStart(record)}>
              启动
            </Button>)}
        </Space>)
        }
    ];
    const handleViewDetail = (execution) => {
        message.info(`查看执行详情: ${execution.id}`);
    };
    const handleViewWorkflowHistory = (workflowName) => {
        setSelectedWorkflowId(1);
    };
    const handleBackToOverview = () => {
        setSelectedWorkflowId(null);
    };
    const handleStop = (execution) => {
        setExecutions(executions.map(e => e.id === execution.id
            ? { ...e, status: 'failed', message: '手动停止', endTime: new Date().toLocaleString(), duration: '已停止' }
            : e));
        message.success('执行已停止');
    };
    const handleStart = (execution) => {
        setExecutions(executions.map(e => e.id === execution.id
            ? { ...e, status: 'running', progress: 0, startTime: new Date().toLocaleString() }
            : e));
        message.success('执行已启动');
    };
    const handleRefresh = () => {
        message.info('刷新执行列表');
    };
    return (<div>
      
      {selectedWorkflowId ? (<div>
          <div style={{ marginBottom: 24 }}>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBackToOverview}>
                返回概览
              </Button>
              <Title level={2}>工作流执行历史</Title>
            </Space>
          </div>
          <WorkflowExecutionHistory workflowId={selectedWorkflowId}/>
        </div>) : (<>
          <div style={{ marginBottom: 24 }}>
            <Title level={2}>执行监控</Title>
            <Space>
              <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
              <Button>导出记录</Button>
              <Button>查看历史</Button>
            </Space>
          </div>

          
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="总执行次数" value={stats.total} prefix={<PlayCircleOutlined />}/>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="运行中" value={stats.running} valueStyle={{ color: '#1890ff' }} prefix={<ClockCircleOutlined />}/>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="成功" value={stats.success} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />}/>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="成功率" value={`${stats.successRate}%`} valueStyle={{ color: stats.successRate === '100' ? '#52c41a' : '#fa8c16' }}/>
              </Card>
            </Col>
          </Row>

          <Card title="执行列表">
            <Table columns={columns} dataSource={executions} rowKey="id" pagination={{
                total: executions.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条执行记录`
            }}/>
          </Card>
        </>)}
    </div>);
};
export default WorkflowExecutions;
//# sourceMappingURL=WorkflowExecutions.js.map
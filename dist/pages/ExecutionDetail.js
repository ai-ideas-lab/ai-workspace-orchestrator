import React, { useState } from 'react';
import { Card, Timeline, Typography, Button, Space, Tag, Progress, Descriptions, Alert, Row, Col, List, Badge } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, DownloadOutlined, PlayCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
const { Title, Text, Paragraph } = Typography;
const ExecutionDetail = () => {
    const [execution] = useState({
        id: '2',
        workflowName: 'AI内容生成工作流',
        status: 'running',
        startTime: '2026-04-05 10:35:00',
        progress: 65,
        message: '正在生成营销内容...',
        executor: 'system',
        totalSteps: 6,
        completedSteps: 4,
        steps: [
            {
                id: '1',
                name: '数据收集',
                status: 'completed',
                startTime: '2026-04-05 10:35:00',
                endTime: '2026-04-05 10:35:30',
                duration: '30秒',
                message: '用户数据收集完成'
            },
            {
                id: '2',
                name: 'AI主题生成',
                status: 'completed',
                startTime: '2026-04-05 10:35:30',
                endTime: '2026-04-05 10:36:15',
                duration: '45秒',
                message: '生成5个营销主题'
            },
            {
                id: '3',
                name: '内容生成',
                status: 'running',
                startTime: '2026-04-05 10:36:15',
                message: '正在生成内容...',
                details: {
                    model: 'gpt-4',
                    progress: 65,
                    estimatedTime: '1分钟'
                }
            },
            {
                id: '4',
                name: '质量检查',
                status: 'pending',
                message: '等待内容生成完成'
            },
            {
                id: '5',
                name: '格式化输出',
                status: 'pending',
                message: '等待质量检查完成'
            },
            {
                id: '6',
                name: '发送通知',
                status: 'pending',
                message: '等待格式化完成'
            }
        ],
        inputs: {
            userId: 'user123',
            campaignType: 'marketing',
            targetAudience: '年轻白领',
            contentLength: '中等'
        },
        outputs: {
            generatedTopics: 5,
            currentContent: '正在生成...',
            qualityScore: null
        },
        logs: [
            '[10:35:00] INFO: 工作流启动',
            '[10:35:05] INFO: 开始收集用户数据',
            '[10:35:30] INFO: 数据收集完成',
            '[10:35:30] INFO: 调用AI生成主题',
            '[10:36:15] INFO: 主题生成完成，开始生成内容',
            '[10:36:45] INFO: 当前进度65%，预计1分钟完成'
        ]
    });
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'running': return 'processing';
            case 'failed': return 'error';
            case 'pending': return 'default';
            default: return 'default';
        }
    };
    const getStatusText = (status) => {
        switch (status) {
            case 'completed': return '已完成';
            case 'running': return '运行中';
            case 'failed': return '失败';
            case 'pending': return '等待中';
            default: return status;
        }
    };
    const handleStop = () => {
        message.success('执行已停止');
    };
    const handleRefresh = () => {
        message.info('刷新数据');
    };
    const handleDownloadLogs = () => {
        message.info('下载日志');
    };
    const handleDownloadResults = () => {
        message.info('下载结果');
    };
    return (<div>
      
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
          返回执行列表
        </Button>
      </div>

      
      <Card title="执行概览" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="工作流名称">
                {execution.workflowName}
              </Descriptions.Item>
              <Descriptions.Item label="执行状态">
                <Badge status={getStatusColor(execution.status)} text={getStatusText(execution.status)}/>
              </Descriptions.Item>
              <Descriptions.Item label="执行者">
                <Tag color="blue">{execution.executor}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={8}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="开始时间">
                {execution.startTime}
              </Descriptions.Item>
              {execution.endTime && (<Descriptions.Item label="结束时间">
                  {execution.endTime}
                </Descriptions.Item>)}
              {execution.duration && (<Descriptions.Item label="执行时长">
                  {execution.duration}
                </Descriptions.Item>)}
            </Descriptions>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 8 }}>
                <Progress type="circle" percent={execution.progress} size={80} status={execution.status === 'success' ? 'success' :
            execution.status === 'failed' ? 'exception' : 'active'}/>
              </div>
              <Text type="secondary">
                {execution.completedSteps}/{execution.totalSteps} 步骤完成
              </Text>
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <Alert message={execution.message} type={execution.status === 'failed' ? 'error' :
            execution.status === 'running' ? 'info' : 'success'} showIcon style={{ marginBottom: 16 }}/>
          <Space>
            {execution.status === 'running' && (<Button danger icon={<PlayCircleOutlined />} onClick={handleStop}>
                停止执行
              </Button>)}
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新状态
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadLogs}>
              下载日志
            </Button>
            {execution.status === 'success' && (<Button icon={<DownloadOutlined />} onClick={handleDownloadResults}>
                下载结果
              </Button>)}
          </Space>
        </div>
      </Card>

      
      <Card title="执行步骤" style={{ marginBottom: 16 }}>
        <Timeline mode="left" items={execution.steps.map((step, index) => ({
            key: step.id,
            color: step.status === 'completed' ? 'green' :
                step.status === 'running' ? 'blue' :
                    step.status === 'failed' ? 'red' : 'gray',
            dot: step.status === 'running' ? <PlayCircleOutlined spin/> :
                step.status === 'completed' ? <CheckCircleOutlined /> :
                    step.status === 'failed' ? <ExclamationCircleOutlined /> :
                        <ClockCircleOutlined />,
            children: (<div>
                <div style={{ marginBottom: 8 }}>
                  <strong>{step.name}</strong>
                  <Tag color={getStatusColor(step.status)}>
                    {getStatusText(step.status)}
                  </Tag>
                  {step.duration && (<Text type="secondary" style={{ marginLeft: 8 }}>
                      {step.duration}
                    </Text>)}
                </div>
                <Text type="secondary">{step.message}</Text>
                {step.details && (<div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                    <Text code style={{ fontSize: 12 }}>
                      {JSON.stringify(step.details, null, 2)}
                    </Text>
                  </div>)}
              </div>)
        }))}/>
      </Card>

      
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="输入参数">
            <List size="small" dataSource={Object.entries(execution.inputs)} renderItem={([key, value]) => (<List.Item>
                  <List.Item.Meta title={<Text strong>{key}</Text>} description={<Text code>{String(value)}</Text>}/>
                </List.Item>)}/>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="输出结果">
            <List size="small" dataSource={Object.entries(execution.outputs)} renderItem={([key, value]) => (<List.Item>
                  <List.Item.Meta title={<Text strong>{key}</Text>} description={<Text code>{String(value)}</Text>}/>
                </List.Item>)}/>
          </Card>
        </Col>
      </Row>

      
      <Card title="执行日志">
        <div style={{
            background: '#000',
            color: '#0f0',
            padding: 16,
            borderRadius: 4,
            fontFamily: 'monospace',
            fontSize: 12,
            maxHeight: 300,
            overflowY: 'auto'
        }}>
          {execution.logs.map((log, index) => (<div key={index} style={{ marginBottom: 4 }}>
              {log}
            </div>))}
        </div>
      </Card>
    </div>);
};
export default ExecutionDetail;
//# sourceMappingURL=ExecutionDetail.js.map
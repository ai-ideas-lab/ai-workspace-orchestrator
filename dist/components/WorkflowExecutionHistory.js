import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Typography, Progress, message, Tooltip } from 'antd';
import { ReloadOutlined, EyeOutlined, PlayCircleOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { workflowApi } from '../services/api';
import { formatDate, formatDuration } from '../utils/formatUtils';
const { Title, Text } = Typography;
const { confirm } = Modal;
const WorkflowExecutionHistory = ({ workflowId, className = '' }) => {
    const [loading, setLoading] = useState(false);
    const [executions, setExecutions] = useState([]);
    const [selectedExecution, setSelectedExecution] = useState(null);
    const [executionDetailVisible, setExecutionDetailVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const fetchExecutionHistory = async () => {
        try {
            setRefreshing(true);
            const response = await workflowApi.getWorkflowExecutions(workflowId);
            setExecutions(response.data);
            message.success('执行历史已更新');
        }
        catch (error) {
            console.error('获取执行历史失败:', error);
            message.error('获取执行历史失败');
        }
        finally {
            setRefreshing(false);
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchExecutionHistory();
    }, [workflowId]);
    const reexecuteWorkflow = async (executionId) => {
        try {
            setLoading(true);
            message.info('重新执行工作流...');
            await fetchExecutionHistory();
        }
        catch (error) {
            console.error('重新执行失败:', error);
            message.error('重新执行失败');
        }
        finally {
            setLoading(false);
        }
    };
    const viewExecutionDetail = (execution) => {
        setSelectedExecution(execution);
        setExecutionDetailVisible(true);
    };
    const renderStatusTag = (status) => {
        const statusConfig = {
            pending: { color: 'default', icon: <ClockCircleOutlined />, text: '等待中' },
            running: { color: 'processing', icon: <PlayCircleOutlined />, text: '执行中' },
            completed: { color: 'success', icon: <CheckCircleOutlined />, text: '已完成' },
            failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' }
        };
        const config = statusConfig[status];
        return (<Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>);
    };
    const renderExecutionProgress = (status, executionTime) => {
        if (status === 'pending') {
            return <Progress percent={0} status="exception" size="small"/>;
        }
        if (status === 'running') {
            return <Progress percent={50} status="active" size="small"/>;
        }
        if (status === 'completed' && executionTime) {
            return <Progress percent={100} status="success" size="small"/>;
        }
        if (status === 'failed') {
            return <Progress percent={0} status="exception" size="small"/>;
        }
        return <Progress percent={0} status="active" size="small"/>;
    };
    const columns = [
        {
            title: '执行ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: (id) => <Text code>{id}</Text>
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => renderStatusTag(status)
        },
        {
            title: '开始时间',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 160,
            render: (date) => formatDate(date)
        },
        {
            title: '持续时间',
            dataIndex: 'execution_time',
            key: 'execution_time',
            width: 100,
            render: (time) => time ? `${time}s` : '-'
        },
        {
            title: '成本',
            dataIndex: 'total_cost',
            key: 'total_cost',
            width: 80,
            render: (cost) => cost ? (<Tooltip title={`成本: $${cost.toFixed(4)}`}>
          <Text type="secondary">
            ${cost.toFixed(3)}
          </Text>
        </Tooltip>) : '-'
        },
        {
            title: '执行进度',
            key: 'progress',
            width: 120,
            render: (_, record) => renderExecutionProgress(record.status, record.execution_time)
        },
        {
            title: '操作',
            key: 'actions',
            width: 150,
            render: (_, record) => (<Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} onClick={() => viewExecutionDetail(record)} size="small"/>
          </Tooltip>
          {record.status === 'failed' && (<Tooltip title="重新执行">
              <Button type="text" icon={<ReloadOutlined />} onClick={() => reexecuteWorkflow(record.id)} size="small"/>
            </Tooltip>)}
        </Space>)
        }
    ];
    return (<Card className={className} title={<Space>
          <Title level={4} style={{ margin: 0 }}>执行历史</Title>
          <Tooltip title="刷新">
            <Button type="text" icon={<ReloadOutlined />} loading={refreshing} onClick={fetchExecutionHistory} size="small"/>
          </Tooltip>
        </Space>} extra={<Space>
          <Text type="secondary">
            共 {executions.length} 条记录
          </Text>
        </Space>}>
      <Table columns={columns} dataSource={executions} rowKey="id" loading={loading} pagination={{
            current: 1,
            pageSize: 10,
            total: executions.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
        }} scroll={{ x: 800 }} size="middle"/>

      
      <Modal title="执行详情" open={executionDetailVisible} onCancel={() => setExecutionDetailVisible(false)} footer={[
            <Button key="close" onClick={() => setExecutionDetailVisible(false)}>
            关闭
          </Button>
        ]} width={800} styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}>
        {selectedExecution && (<div>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Card size="small">
                <Space>
                  <Text strong>执行ID:</Text>
                  <Text code>{selectedExecution.id}</Text>
                  {renderStatusTag(selectedExecution.status)}
                </Space>
              </Card>

              <Card size="small" title="执行信息">
                <Space direction="vertical" size="small">
                  <Space>
                    <Text strong>开始时间:</Text>
                    <Text>{formatDate(selectedExecution.created_at)}</Text>
                  </Space>
                  {selectedExecution.execution_time && (<Space>
                      <Text strong>持续时间:</Text>
                      <Text>{formatDuration(selectedExecution.execution_time)}</Text>
                    </Space>)}
                  {selectedExecution.total_cost && (<Space>
                      <Text strong>成本:</Text>
                      <Text type="danger">${selectedExecution.total_cost.toFixed(4)}</Text>
                    </Space>)}
                </Space>
              </Card>

              <Card size="small" title="输入数据">
                <pre style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
                fontSize: 12,
                maxHeight: 200,
                overflowY: 'auto'
            }}>
                  {JSON.stringify(selectedExecution.input_data, null, 2)}
                </pre>
              </Card>

              {selectedExecution.status === 'completed' && selectedExecution.results && (<Card size="small" title="执行结果">
                  <pre style={{
                    background: '#f0f9ff',
                    padding: 12,
                    borderRadius: 4,
                    fontSize: 12,
                    maxHeight: 300,
                    overflowY: 'auto'
                }}>
                    {JSON.stringify(selectedExecution.results, null, 2)}
                  </pre>
                </Card>)}

              {selectedExecution.status === 'failed' && selectedExecution.error_message && (<Card size="small" title="错误信息" style={{ borderLeft: '4px solid #ff4d4f' }}>
                  <Text type="danger">
                    <ExclamationCircleOutlined /> {selectedExecution.error_message}
                  </Text>
                </Card>)}
            </Space>
          </div>)}
      </Modal>
    </Card>);
};
export default WorkflowExecutionHistory;
//# sourceMappingURL=WorkflowExecutionHistory.js.map
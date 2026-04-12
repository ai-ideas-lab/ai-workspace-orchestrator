import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Alert, Divider } from 'antd';
import { LoadingOutlined, ApiOutlined, ThunderboltOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { preloadManager } from '../utils/lazy-loading';
const LazyWorkflowDesigner = lazy(() => import('./WorkflowDesigner'));
const LazyEnhancedWorkflowDesigner = lazy(() => import('./EnhancedWorkflowDesigner'));
const LazyEnhancedDashboard = lazy(() => import('./EnhancedDashboard'));
const preloadCriticalResources = async () => {
    try {
        await preloadManager.preloadScript('/antd.min.js');
        await preloadManager.preloadStyle('/antd.min.css');
        console.log('Critical resources preloaded');
    }
    catch (error) {
        console.error('Failed to preload critical resources:', error);
    }
};
const OptimizedDashboard = () => {
    const [performanceMetrics, setPerformanceMetrics] = useState(null);
    const [systemStatus, setSystemStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        preloadCriticalResources();
    }, []);
    const fetchPerformanceMetrics = async () => {
        try {
            const response = await fetch('/api/monitoring/stats');
            const data = await response.json();
            setPerformanceMetrics(data.data);
        }
        catch (err) {
            console.error('Failed to fetch performance metrics:', err);
        }
    };
    const fetchSystemStatus = async () => {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            setSystemStatus(data.data);
        }
        catch (err) {
            console.error('Failed to fetch system status:', err);
        }
    };
    useEffect(() => {
        const initializeData = async () => {
            setLoading(true);
            setError(null);
            try {
                await Promise.all([
                    fetchPerformanceMetrics(),
                    fetchSystemStatus()
                ]);
            }
            catch (err) {
                setError('Failed to load dashboard data');
                console.error('Initialization error:', err);
            }
            finally {
                setLoading(false);
            }
        };
        initializeData();
        const interval = setInterval(() => {
            fetchPerformanceMetrics();
            fetchSystemStatus();
        }, 30000);
        return () => clearInterval(interval);
    }, []);
    const renderPerformanceCards = () => (<Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic title="总执行次数" value={performanceMetrics?.totalExecutions || 0} prefix={<ApiOutlined />} valueStyle={{ color: '#1890ff' }}/>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic title="平均响应时间" value={performanceMetrics?.averageDuration || 0} suffix="ms" prefix={<ThunderboltOutlined />} valueStyle={{ color: '#52c41a' }}/>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic title="成功率" value={performanceMetrics?.successRate || 0} suffix="%" prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} precision={2}/>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic title="缓存命中率" value={performanceMetrics?.cacheHitRate || 0} suffix="%" prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#722ed1' }} precision={2}/>
        </Card>
      </Col>
    </Row>);
    const renderSystemStatusCards = () => (<Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={8}>
        <Card title="引擎状态">
          <div style={{ marginBottom: 16 }}>
            <p>总引擎数: <strong>{systemStatus?.engines.total || 0}</strong></p>
            <p>活跃引擎: <strong style={{ color: '#52c41a' }}>{systemStatus?.engines.active || 0}</strong></p>
            <p>平均负载: <strong>{(systemStatus?.engines.averageLoad * 100 || 0).toFixed(1)}%</strong></p>
          </div>
          <div>
            <p>队列大小: <strong style={{ color: '#fa8c16' }}>{systemStatus?.engines.queueSize || 0}</strong></p>
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card title="工作流状态">
          <div style={{ marginBottom: 16 }}>
            <p>总工作流: <strong>{systemStatus?.workflows.total || 0}</strong></p>
            <p>运行中: <strong style={{ color: '#1890ff' }}>{systemStatus?.workflows.running || 0}</strong></p>
            <p>已完成: <strong style={{ color: '#52c41a' }}>{systemStatus?.workflows.completed || 0}</strong></p>
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <Card title="性能指标">
          <div style={{ marginBottom: 16 }}>
            <p>吞吐量: <strong>{performanceMetrics?.throughput || 0}</strong> req/s</p>
            <p>错误率: <strong style={{ color: '#f5222d' }}>{(performanceMetrics?.errorRate || 0).toFixed(2)}%</strong></p>
          </div>
        </Card>
      </Col>
    </Row>);
    if (loading) {
        return (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large"/>
      </div>);
    }
    if (error) {
        return (<Alert message="错误" description={error} type="error" showIcon/>);
    }
    return (<div style={{ padding: '24px' }}>
      <h1>AI工作空间编排器 - 优化仪表板</h1>
      
      
      <Card title="性能指标" style={{ marginBottom: '24px' }}>
        {renderPerformanceCards()}
      </Card>
      
      
      <Card title="系统状态" style={{ marginBottom: '24px' }}>
        {renderSystemStatusCards()}
      </Card>
      
      <Divider />
      
      
      <Card title="工作流设计器">
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin indicator={<LoadingOutlined spin style={{ fontSize: 24 }}/>}/>
              <p>加载工作流设计器...</p>
            </div>}>
          <LazyWorkflowDesigner />
        </Suspense>
      </Card>
      
      
      <Card title="增强工作流设计器" style={{ marginTop: '24px' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin indicator={<LoadingOutlined spin style={{ fontSize: 24 }}/>}/>
              <p>加载增强工作流设计器...</p>
            </div>}>
          <LazyEnhancedWorkflowDesigner />
        </Suspense>
      </Card>
      
      
      <Card title="详细监控面板" style={{ marginTop: '24px' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin indicator={<LoadingOutlined spin style={{ fontSize: 24 }}/>}/>
              <p>加载详细监控面板...</p>
            </div>}>
          <LazyEnhancedDashboard />
        </Suspense>
      </Card>
    </div>);
};
export default OptimizedDashboard;
//# sourceMappingURL=OptimizedDashboard.js.map
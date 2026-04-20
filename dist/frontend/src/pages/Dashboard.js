import React, { useState, useEffect } from 'react';
import { executionsApi, aiEngineApi } from '../utils/api';
const Dashboard = () => {
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        failed: 0,
        running: 0,
        averageDuration: 0
    });
    const [aiEngines, setAiEngines] = useState([]);
    const [recentExecutions, setRecentExecutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [filter, setFilter] = useState({
        status: 'all',
        startDate: '',
        endDate: ''
    });
    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(() => {
                fetchDashboardData();
            }, 30000);
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [autoRefresh]);
    useEffect(() => {
        fetchDashboardData();
    }, []);
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setLastUpdated(new Date());
            const [statsResponse, enginesResponse, executionsResponse] = await Promise.all([
                executionsApi.getStats(),
                aiEngineApi.getEngines(),
                executionsApi.getExecutions({
                    limit: 10,
                    status: filter.status === 'all' ? undefined : filter.status,
                    startDate: filter.startDate || undefined,
                    endDate: filter.endDate || undefined
                })
            ]);
            if (statsResponse.success) {
                const statsData = statsResponse.data;
                setStats({
                    total: statsData.total || 0,
                    completed: statsData.byStatus?.completed || 0,
                    failed: statsData.byStatus?.failed || 0,
                    running: statsData.byStatus?.running || 0,
                    averageDuration: statsData.averageDuration || 0
                });
            }
            if (enginesResponse.success) {
                setAiEngines(enginesResponse.data.engines || []);
            }
            if (executionsResponse.success) {
                setRecentExecutions(executionsResponse.data.executions || []);
            }
        }
        catch (error) {
            console.error('Error fetching dashboard data:', error);
            setMockData();
        }
        finally {
            setLoading(false);
        }
    };
    const handleFilterChange = (key, value) => {
        const newFilter = { ...filter, [key]: value };
        setFilter(newFilter);
        fetchDashboardData();
    };
    const toggleAutoRefresh = () => {
        setAutoRefresh(!autoRefresh);
    };
    const clearFilters = () => {
        setFilter({
            status: 'all',
            startDate: '',
            endDate: ''
        });
        fetchDashboardData();
    };
    const setMockData = () => {
        setStats({
            total: 156,
            completed: 142,
            failed: 8,
            running: 6,
            averageDuration: 45000
        });
        setAiEngines([
            {
                name: 'ChatGPT-4',
                model: 'gpt-4',
                capabilities: ['文本生成', '代码编写', '分析总结'],
                status: '在线',
                costPerToken: 0.03,
                latency: '1.2s'
            },
            {
                name: 'Claude-3',
                model: 'claude-3',
                capabilities: ['推理分析', '创意写作', '代码审查'],
                status: '在线',
                costPerToken: 0.025,
                latency: '0.8s'
            },
            {
                name: 'Gemini-Pro',
                model: 'gemini-pro',
                capabilities: ['多语言处理', '图像识别', '数据分析'],
                status: '维护中',
                costPerToken: 0.02,
                latency: '1.5s'
            }
        ]);
        setRecentExecutions([
            {
                id: '1',
                workflowName: '文档分析工作流',
                aiEngine: 'ChatGPT-4',
                status: 'completed',
                startTime: '2026-04-05T10:30:00Z',
                duration: 32000
            },
            {
                id: '2',
                workflowName: '代码审查任务',
                aiEngine: 'Claude-3',
                status: 'completed',
                startTime: '2026-04-05T10:25:00Z',
                duration: 45000
            },
            {
                id: '3',
                workflowName: '客户邮件处理',
                aiEngine: 'ChatGPT-4',
                status: 'running',
                startTime: '2026-04-05T10:20:00Z',
                duration: 120000
            }
        ]);
    };
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'completed':
                return 'status-completed';
            case 'running':
                return 'status-running';
            case 'failed':
                return 'status-failed';
            default:
                return 'status-completed';
        }
    };
    if (loading) {
        return (<div className="loading">
        <div className="loading-spinner"></div>
        <p>加载仪表板数据...</p>
      </div>);
    }
    const filteredExecutions = recentExecutions.filter(execution => {
        if (filter.status !== 'all' && execution.status !== filter.status) {
            return false;
        }
        if (filter.startDate && new Date(execution.startTime) < new Date(filter.startDate)) {
            return false;
        }
        if (filter.endDate && new Date(execution.startTime) > new Date(filter.endDate)) {
            return false;
        }
        return true;
    });
    return (<div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>📊 工作流仪表板</h1>
          <div className="last-updated">
            最后更新: {lastUpdated.toLocaleTimeString()}
            {autoRefresh && <span className="auto-refresh-indicator">🔄 自动刷新</span>}
          </div>
        </div>
        <div className="header-actions">
          <button className={`btn ${autoRefresh ? 'btn-primary' : 'btn-secondary'}`} onClick={toggleAutoRefresh}>
            {autoRefresh ? '暂停刷新' : '开启刷新'}
          </button>
          <button className="btn" onClick={fetchDashboardData}>
            🔄 立即刷新
          </button>
        </div>
      </div>
      
      
      <div className="dashboard-grid">
        <div className="card">
          <h3>总执行次数</h3>
          <p className="stat-number">{stats.total}</p>
          <div className="stat-trend">📈 较上周 +12%</div>
        </div>

        <div className="card">
          <h3>成功执行</h3>
          <p className="stat-number">{stats.completed}</p>
          <div className="stat-trend">✅ 成功率 {(stats.completed / stats.total * 100).toFixed(1)}%</div>
        </div>

        <div className="card">
          <h3>运行中</h3>
          <p className="stat-number">{stats.running}</p>
          <div className="stat-trend">⏳ 平均时长 {(stats.averageDuration / 1000).toFixed(1)}秒</div>
        </div>

        <div className="card">
          <h3>失败次数</h3>
          <p className="stat-number">{stats.failed}</p>
          <div className="stat-trend">❌ 失败率 {(stats.failed / stats.total * 100).toFixed(1)}%</div>
        </div>
      </div>

      
      <div className="list-container">
        <div className="list-header">
          <h2>🤖 AI 引擎状态</h2>
          <button className="btn" onClick={fetchDashboardData}>刷新状态</button>
        </div>
        
        <div className="engines-grid">
          {aiEngines.map((engine, index) => (<div key={index} className="engine-card">
              <h4>{engine.name}</h4>
              <p className="engine-model">{engine.model}</p>
              <div className="engine-capabilities">
                {engine.capabilities.slice(0, 3).map((cap, i) => (<span key={i} className="capability-tag">{cap}</span>))}
              </div>
              <div className="engine-status">
                <span className="status-badge status-completed">{engine.status}</span>
                <span className="latency">⚡ {engine.latency}</span>
              </div>
            </div>))}
        </div>
      </div>

      
      <div className="list-container">
        <div className="list-header">
          <div className="list-title">
            <h2>📝 最近执行记录</h2>
            <span className="execution-count">共 {filteredExecutions.length} 条</span>
          </div>
          <div className="list-actions">
            <button className="btn" onClick={fetchDashboardData}>刷新</button>
            <button className="btn btn-secondary" onClick={clearFilters}>清除筛选</button>
          </div>
        </div>
        
        
        <div className="filters-container">
          <div className="filter-group">
            <label>状态:</label>
            <select value={filter.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="filter-select">
              <option value="all">全部</option>
              <option value="completed">已完成</option>
              <option value="running">运行中</option>
              <option value="failed">失败</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>开始日期:</label>
            <input type="date" value={filter.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="filter-input"/>
          </div>
          
          <div className="filter-group">
            <label>结束日期:</label>
            <input type="date" value={filter.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="filter-input"/>
          </div>
        </div>
        
        <table className="table">
          <thead>
            <tr>
              <th>工作流名称</th>
              <th>AI引擎</th>
              <th>状态</th>
              <th>执行时间</th>
              <th>耗时</th>
            </tr>
          </thead>
          <tbody>
            {filteredExecutions.map((execution, index) => (<tr key={index}>
                <td>{execution.workflowName}</td>
                <td>{execution.aiEngine}</td>
                <td>
                  <span className={`status-badge ${getStatusBadgeClass(execution.status)}`}>
                    {execution.status === 'completed' ? '✅ 已完成' :
                execution.status === 'running' ? '⏳ 运行中' : '❌ 失败'}
                  </span>
                </td>
                <td>{new Date(execution.startTime).toLocaleString()}</td>
                <td>{Math.floor(execution.duration / 1000)}秒</td>
              </tr>))}
          </tbody>
        </table>
        
        {filteredExecutions.length === 0 && (<div className="no-data">
            <p>暂无符合条件的执行记录</p>
          </div>)}
      </div>
    </div>);
};
export default Dashboard;
//# sourceMappingURL=Dashboard.js.map
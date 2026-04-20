import React, { useState, useEffect } from 'react';
const Executions = () => {
    const [executions, setExecutions] = useState([]);
    const [filters, setFilters] = useState({
        status: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 10
    });
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    useEffect(() => {
        fetchExecutions();
    }, [filters]);
    const fetchExecutions = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.status)
                params.append('status', filters.status);
            if (filters.startDate)
                params.append('startDate', filters.startDate);
            if (filters.endDate)
                params.append('endDate', filters.endDate);
            params.append('page', filters.page.toString());
            params.append('limit', filters.limit.toString());
            const response = await fetch(`http://localhost:3000/api/executions?${params}`);
            const data = await response.json();
            if (data.success) {
                setExecutions(data.data.executions);
                setTotal(data.data.pagination.total);
            }
        }
        catch (error) {
            console.error('Error fetching executions:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const createNewExecution = async () => {
        const newExecution = {
            workflowName: '新工作流',
            status: 'running',
            startTime: new Date().toISOString(),
            duration: 0,
            aiEngine: 'ChatGPT-4',
            input: JSON.stringify({ command: 'sample', parameters: {} }),
            userId: 'user1',
            createdAt: new Date().toISOString()
        };
        try {
            const response = await fetch('http://localhost:3000/api/executions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newExecution)
            });
            const data = await response.json();
            if (data.success) {
                fetchExecutions();
            }
        }
        catch (error) {
            console.error('Error creating execution:', error);
        }
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
    const getStatusText = (status) => {
        switch (status) {
            case 'completed':
                return '已完成';
            case 'running':
                return '运行中';
            case 'failed':
                return '失败';
            default:
                return status;
        }
    };
    const formatDuration = (duration) => {
        return duration > 0 ? `${(duration / 1000).toFixed(1)}秒` : '-';
    };
    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString();
    };
    if (loading) {
        return <div className="loading">加载中...</div>;
    }
    return (<div className="executions-container">
      <div className="list-header">
        <h1>📈 执行记录</h1>
        <div className="actions">
          <button className="btn" onClick={createNewExecution}>
            创建新执行
          </button>
        </div>
      </div>

      
      <div className="filters-container card">
        <h3>筛选条件</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>状态</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
              <option value="">全部状态</option>
              <option value="completed">已完成</option>
              <option value="running">运行中</option>
              <option value="failed">失败</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>开始日期</label>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}/>
          </div>
          
          <div className="filter-group">
            <label>结束日期</label>
            <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}/>
          </div>
        </div>
      </div>

      
      <div className="list-container">
        <div className="list-header">
          <h2>执行记录</h2>
          <span>共 {total} 条记录</span>
        </div>
        
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>工作流名称</th>
              <th>AI引擎</th>
              <th>状态</th>
              <th>开始时间</th>
              <th>结束时间</th>
              <th>耗时</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {executions.map((execution) => (<tr key={execution.id}>
                <td>{execution.id}</td>
                <td>{execution.workflowName}</td>
                <td>{execution.aiEngine}</td>
                <td>
                  <span className={`status-badge ${getStatusBadgeClass(execution.status)}`}>
                    {getStatusText(execution.status)}
                  </span>
                </td>
                <td>{formatDateTime(execution.startTime)}</td>
                <td>{execution.endTime ? formatDateTime(execution.endTime) : '-'}</td>
                <td>{formatDuration(execution.duration)}</td>
                <td>
                  <button className="btn btn-secondary" onClick={() => alert(`查看详情: ${execution.id}`)}>
                    查看详情
                  </button>
                </td>
              </tr>))}
          </tbody>
        </table>

        
        {total > filters.limit && (<div className="pagination">
            <button className="btn" onClick={() => setFilters({ ...filters, page: filters.page - 1 })} disabled={filters.page === 1}>
              上一页
            </button>
            <span>第 {filters.page} 页</span>
            <button className="btn" onClick={() => setFilters({ ...filters, page: filters.page + 1 })} disabled={filters.page * filters.limit >= total}>
              下一页
            </button>
          </div>)}
      </div>
    </div>);
};
export default Executions;
//# sourceMappingURL=Executions.js.map
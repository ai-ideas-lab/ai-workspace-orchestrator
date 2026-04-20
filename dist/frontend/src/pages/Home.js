import React from 'react';
import { Row, Col, Card, Statistic, Typography, Button, List, Tag } from 'antd';
import { PlayCircleOutlined, RobotOutlined, BarChartOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
const { Title, Paragraph } = Typography;
const Home = () => {
    const stats = [
        { title: '工作流总数', value: 12, icon: <BarChartOutlined />, color: '#1890ff' },
        { title: 'AI引擎', value: 8, icon: <RobotOutlined />, color: '#52c41a' },
        { title: '今日执行', value: 156, icon: <PlayCircleOutlined />, color: '#722ed1' },
        { title: '成功率', value: '98.5%', icon: <CheckCircleOutlined />, color: '#eb2f96' },
    ];
    const recentExecutions = [
        { id: 1, name: '数据处理工作流', status: 'success', time: '2分钟前' },
        { id: 2, name: 'AI内容生成', status: 'running', time: '5分钟前' },
        { id: 3, name: '报告分析', status: 'failed', time: '10分钟前' },
        { id: 4, name: '用户反馈处理', status: 'success', time: '15分钟前' },
    ];
    const quickActions = [
        { title: '创建工作流', description: '从零开始创建新的AI工作流', icon: <PlayCircleOutlined /> },
        { title: '模板中心', description: '使用预设的工作流模板', icon: <BarChartOutlined /> },
        { title: 'AI引擎管理', description: '管理和配置AI服务', icon: <RobotOutlined /> },
        { title: '执行监控', description: '实时查看工作流执行状态', icon: <ClockCircleOutlined /> },
    ];
    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'success';
            case 'running': return 'processing';
            case 'failed': return 'error';
            default: return 'default';
        }
    };
    return (<div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>AI工作流自动化平台</Title>
        <Paragraph type="secondary">
          通过自然语言界面智能调度多个AI引擎，实现企业级工作流自动化
        </Paragraph>
      </div>

      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (<Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic title={stat.title} value={stat.value} prefix={stat.icon} valueStyle={{ color: stat.color }}/>
            </Card>
          </Col>))}
      </Row>

      <Row gutter={[16, 16]}>
        
        <Col xs={24} lg={12}>
          <Card title="快捷操作" style={{ height: '100%' }}>
            <List dataSource={quickActions} renderItem={(item, index) => (<List.Item>
                  <List.Item.Meta avatar={item.icon} title={item.title} description={item.description}/>
                  <Button type="link">开始</Button>
                </List.Item>)}/>
          </Card>
        </Col>

        
        <Col xs={24} lg={12}>
          <Card title="最近执行" style={{ height: '100%' }}>
            <List dataSource={recentExecutions} renderItem={(item) => (<List.Item actions={[
                <Button type="link" size="small">查看</Button>
            ]}>
                  <List.Item.Meta title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.name}
                        <Tag color={getStatusColor(item.status)}>
                          {item.status === 'success' ? '成功' :
                    item.status === 'running' ? '运行中' : '失败'}
                        </Tag>
                      </div>} description={item.time}/>
                </List.Item>)}/>
          </Card>
        </Col>
      </Row>
    </div>);
};
export default Home;
//# sourceMappingURL=Home.js.map
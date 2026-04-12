import React from 'react';
import { Layout as AntLayout, Menu } from 'antd';
import { HomeOutlined, WorkflowOutlined, RobotOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
const { Header, Sider, Content } = AntLayout;
const Layout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const menuItems = [
        {
            key: '/',
            icon: <HomeOutlined />,
            label: '首页',
        },
        {
            key: '/workflows',
            icon: <WorkflowOutlined />,
            label: '工作流',
        },
        {
            key: '/ai-engines',
            icon: <RobotOutlined />,
            label: 'AI引擎',
        },
        {
            key: '/profile',
            icon: <UserOutlined />,
            label: '个人中心',
        },
    ];
    return (<AntLayout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={200}>
        <div style={{
            height: 32,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold'
        }}>
          AI工作流
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={({ key }) => navigate(key)}/>
      </Sider>
      <AntLayout>
        <Header style={{
            padding: 0,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: 24,
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: 0, color: '#001529' }}>AI工作流自动化平台</h2>
          <div>
            <span style={{ marginRight: 16 }}>欢迎用户</span>
            <LogoutOutlined />
          </div>
        </Header>
        <Content style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 280
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>);
};
export default Layout;
//# sourceMappingURL=Layout.js.map
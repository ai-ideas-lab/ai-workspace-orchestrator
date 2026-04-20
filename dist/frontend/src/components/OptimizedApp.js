import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Layout, Menu, Typography, Avatar, Dropdown, Button, Space, Badge, Spin, Segmented, message, ConfigProvider, theme } from 'antd';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { DashboardOutlined, WorkflowOutlined, UserOutlined, RobotOutlined, BellOutlined, SettingOutlined, HomeOutlined, AppstoreOutlined, TeamOutlined as TeamOutlinedAlias, RobotOutlined as RobotOutlinedAlias, UserOutlined as UserOutlinedAlias, SettingOutlined as SettingOutlinedAlias, LogoutOutlined as LogoutOutlinedAlias, MoonOutlined, SunOutlined, ReloadOutlined, FullscreenOutlined, QuestionCircleOutlined, GithubOutlined } from '@ant-design/icons';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles } from '../styles/global';
import { lightTheme, darkTheme } from '../styles/themes';
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const WorkflowsPage = lazy(() => import('./pages/WorkflowsPage'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const AIAgentsPage = lazy(() => import('./pages/AIAgentsPage'));
const TemplateLibraryPage = lazy(() => import('./pages/TemplateLibraryPage'));
const EnhancedWorkflowDesigner = lazy(() => import('./components/EnhancedWorkflowDesigner'));
const EnhancedDashboard = lazy(() => import('./components/EnhancedDashboard'));
const { Header, Sider, Content } = Layout;
const { Title } = Typography;
const useAppStore = () => {
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });
    const [themeMode, setThemeMode] = useState(() => {
        return localStorage.getItem('theme-mode') || 'light';
    });
    const [user, setUser] = useState(() => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    });
    return {
        collapsed,
        setCollapsed: (collapsed) => {
            setCollapsed(collapsed);
            localStorage.setItem('sidebar-collapsed', collapsed.toString());
        },
        themeMode,
        setThemeMode: (mode) => {
            setThemeMode(mode);
            localStorage.setItem('theme-mode', mode);
        },
        user,
        setUser
    };
};
const OptimizedApp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { collapsed, setCollapsed, themeMode, setThemeMode } = useAppStore();
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => setLoading(false), 300);
        return () => clearTimeout(timer);
    }, [location.pathname]);
    const toggleTheme = () => {
        const newMode = themeMode === 'light' ? 'dark' : 'light';
        setThemeMode(newMode);
        message.success(`已切换到${newMode === 'light' ? '明亮' : '深色'}主题`);
    };
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        }
        else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };
    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlinedAlias />,
            label: '个人资料',
        },
        {
            key: 'settings',
            icon: <SettingOutlinedAlias />,
            label: '设置',
        },
        {
            key: 'theme',
            icon: themeMode === 'light' ? <MoonOutlined /> : <SunOutlined />,
            label: '切换主题',
            onClick: toggleTheme,
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlinedAlias />,
            label: '退出登录',
            onClick: () => {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                navigate('/login');
            },
        },
    ];
    const getSelectedKey = () => {
        const path = location.pathname;
        if (path.startsWith('/dashboard'))
            return 'dashboard';
        if (path.startsWith('/workflows'))
            return 'workflows';
        if (path.startsWith('/teams'))
            return 'teams';
        if (path.startsWith('/ai-agents'))
            return 'ai-agents';
        if (path.startsWith('/templates'))
            return 'templates';
        return 'dashboard';
    };
    const getMenuTitle = () => {
        if (collapsed)
            return 'AIWO';
        return 'AI Workspace\nOrchestrator';
    };
    return (<ThemeProvider theme={themeMode === 'dark' ? darkTheme : lightTheme}>
      <ConfigProvider theme={{
            algorithm: themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
                colorPrimary: '#1890ff',
            },
        }}>
        <GlobalStyles />
        <Router>
          <Layout style={{ minHeight: '100vh' }}>
            
            <Sider theme={themeMode === 'dark' ? 'dark' : 'light'} width={collapsed ? 80 : 260} collapsed={collapsed} onCollapse={setCollapsed} style={{
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
        }}>
              
              <div style={{
            padding: collapsed ? '12px' : '20px',
            borderBottom: '1px solid #f0f0f0',
            transition: 'all 0.3s ease'
        }}>
                <Title level={collapsed ? 5 : 4} style={{
            margin: 0,
            color: '#1890ff',
            whiteSpace: 'pre-wrap',
            lineHeight: collapsed ? 1 : 1.2
        }}>
                  {getMenuTitle()}
                </Title>
              </div>
              
              
              <Menu mode="inline" selectedKeys={[getSelectedKey()]} style={{ height: '100%', borderRight: 0 }} theme={themeMode === 'dark' ? 'dark' : 'light'} className="custom-menu">
                <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
                  <Link to="/dashboard">
                    {collapsed ? null : '仪表板'}
                  </Link>
                </Menu.Item>
                
                <Menu.SubMenu key="workflows" icon={<WorkflowOutlined />} title={collapsed ? null : '工作流管理'} className="custom-submenu">
                  <Menu.Item key="workflows-list" icon={<AppstoreOutlined />}>
                    <Link to="/workflows">工作流列表</Link>
                  </Menu.Item>
                  <Menu.Item key="workflow-designer" icon={<SettingOutlinedAlias />}>
                    <Link to="/workflows/designer">工作流设计器</Link>
                  </Menu.Item>
                  <Menu.Item key="templates" icon={<HomeOutlined />}>
                    <Link to="/workflows/templates">模板库</Link>
                  </Menu.Item>
                </Menu.SubMenu>
                
                <Menu.Item key="teams" icon={<TeamOutlinedAlias />}>
                  <Link to="/teams">
                    {collapsed ? null : '团队管理'}
                  </Link>
                </Menu.Item>
                
                <Menu.Item key="ai-agents" icon={<RobotOutlinedAlias />}>
                  <Link to="/ai-agents">
                    {collapsed ? null : 'AI代理'}
                  </Link>
                </Menu.Item>
                
                <Menu.SubMenu key="settings" icon={<SettingOutlined />} title={collapsed ? null : '设置'}>
                  <Menu.Item key="profile">
                    <Link to="/profile">
                      {collapsed ? null : '个人资料'}
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="global-settings">
                    <Link to="/settings">
                      {collapsed ? null : '全局设置'}
                    </Link>
                  </Menu.Item>
                </Menu.SubMenu>
              </Menu>
            </Sider>
            
            
            <Layout>
              
              <Header style={{
            background: themeMode === 'dark' ? '#141414' : '#fff',
            padding: '0 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.3s ease'
        }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                    AI工作流自动化平台
                  </Title>
                  
                  
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {location.pathname.split('/').filter(Boolean).map((segment, index, array) => (<span key={segment}>
                        <Link to={`/${array.slice(0, index + 1).join('/')}`}>
                          {segment.charAt(0).toUpperCase() + segment.slice(1)}
                        </Link>
                        {index < array.length - 1 && ' / '}
                      </span>))}
                  </div>
                </div>
                
                
                <Space>
                  
                  <Segmented options={[
            { label: '仪表板', value: 'dashboard', icon: <DashboardOutlined /> },
            { label: '工作流', value: 'workflows', icon: <WorkflowOutlined /> },
            { label: 'AI代理', value: 'ai-agents', icon: <RobotOutlined /> },
        ]} size="small"/>
                  
                  
                  <Badge count={3} dot>
                    <BellOutlined style={{ fontSize: '18px', color: '#1890ff', cursor: 'pointer' }}/>
                  </Badge>
                  
                  
                  <Button type="text" icon={themeMode === 'light' ? <MoonOutlined /> : <SunOutlined />} onClick={toggleTheme} title={themeMode === 'light' ? '切换到深色主题' : '切换到明亮主题'}/>
                  
                  
                  <Button type="text" icon={<FullscreenOutlined />} onClick={toggleFullscreen} title="全屏模式"/>
                  
                  
                  <Button type="text" icon={<ReloadOutlined />} onClick={() => window.location.reload()} title="刷新页面"/>
                  
                  
                  <Button type="text" icon={<QuestionCircleOutlined />} title="帮助文档"/>
                  
                  
                  <Button type="text" icon={<GithubOutlined />} title="查看源码"/>
                  
                  
                  <Dropdown menu={userMenuItems} placement="bottomRight">
                    <Space style={{ cursor: 'pointer' }}>
                      <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} src={localStorage.getItem('userAvatar')}/>
                      <span>{localStorage.getItem('username') || '管理员'}</span>
                    </Space>
                  </Dropdown>
                </Space>
              </Header>
              
              
              <Content style={{
            margin: '24px',
            background: themeMode === 'dark' ? '#1f1f1f' : '#f5f5f5',
            minHeight: 'calc(100vh - 120px)',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
        }}>
                
                {loading && (<div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999
            }}>
                    <Spin size="large"/>
                  </div>)}
                
                
                <Suspense fallback={<div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px'
            }}>
                      <Spin size="large"/>
                      <div style={{ marginLeft: '16px' }}>
                        <Title level={4}>加载中...</Title>
                        <p>正在加载应用组件，请稍候</p>
                      </div>
                    </div>}>
                  <Routes>
                    <Route path="/" element={<LoginPage />}/>
                    <Route path="/login" element={<LoginPage />}/>
                    
                    
                    <Route path="/dashboard" element={<DashboardPage />}/>
                    <Route path="/dashboard/*" element={<EnhancedDashboard />}/>
                    
                    <Route path="/workflows" element={<WorkflowsPage />}/>
                    <Route path="/workflows/list" element={<WorkflowsPage />}/>
                    <Route path="/workflows/designer" element={<EnhancedWorkflowDesigner />}/>
                    <Route path="/workflows/templates" element={<TemplateLibraryPage />}/>
                    
                    <Route path="/teams" element={<TeamsPage />}/>
                    <Route path="/ai-agents" element={<AIAgentsPage />}/>
                    
                    <Route path="/profile" element={<div>个人资料页面</div>}/>
                    <Route path="/settings" element={<div>全局设置页面</div>}/>
                  </Routes>
                </Suspense>
              </Content>
            </Layout>
          </Layout>
        </Router>
      </ConfigProvider>
    </ThemeProvider>);
};
export default OptimizedApp;
//# sourceMappingURL=OptimizedApp.js.map
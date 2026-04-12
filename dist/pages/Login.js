import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider, Spin } from 'antd';
import { UserOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../utils/api';
const { Title, Text, Link } = Typography;
const Login = ({ onLogin }) => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await authApi.login(values.username, values.password);
            if (response.success) {
                onLogin(response.data.user, response.data.token);
                message.success('登录成功！');
                navigate('/');
            }
            else {
                message.error(response.message || '登录失败');
            }
        }
        catch (error) {
            console.error('登录错误:', error);
            const errorMessage = error.response?.data?.message || '登录失败，请检查用户名和密码';
            message.error(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    return (<div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
      <Card style={{
            width: 400,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            borderRadius: 12,
            overflow: 'hidden'
        }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #1890ff, #722ed1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: 24,
            color: 'white'
        }}>
              <TeamOutlined />
            </div>
          </div>
          <Title level={2} style={{ color: '#1890ff', marginBottom: 8 }}>
            AI工作流平台
          </Title>
          <Text type="secondary">企业级AI工作流自动化平台</Text>
        </div>
        
        <Form name="login" onFinish={onFinish} size="large" layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名!' }]}>
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" size="large"/>
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入密码!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large"/>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading} size="large">
              {loading ? <Spin size="small"/> : null}
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '20px 0' }}>
          <Text type="secondary">测试账户</Text>
        </Divider>

        <div style={{ padding: '0 16px 16px' }}>
          <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>管理员账户:</strong> admin / admin123
            </div>
            <div>
              <strong>普通用户:</strong> demo / demo123
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
              提示: 如果测试账户不存在，请先使用后端API创建账户
            </div>
          </Text>
        </div>
      </Card>
    </div>);
};
export default Login;
//# sourceMappingURL=Login.js.map
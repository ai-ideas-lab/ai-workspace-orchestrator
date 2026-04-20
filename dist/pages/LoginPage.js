import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
const { Title } = Typography;
const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: values.email,
                    password: values.password,
                }),
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.access_token);
                message.success('登录成功');
                navigate('/dashboard');
            }
            else {
                message.error('登录失败，请检查邮箱和密码');
            }
        }
        catch (error) {
            message.error('登录失败，请稍后重试');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
      <Card style={{ width: 400, borderRadius: '8px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ color: '#1890ff', margin: 0 }}>
            AI Workspace Orchestrator
          </Title>
          <p style={{ color: '#666', marginTop: '8px' }}>
            企业级AI工作流自动化平台
          </p>
        </div>
        
        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱地址' }]}>
            <Input prefix={<UserOutlined />} placeholder="邮箱地址"/>
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码"/>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>);
};
export default LoginPage;
//# sourceMappingURL=LoginPage.js.map
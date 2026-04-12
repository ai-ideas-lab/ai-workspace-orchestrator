import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider, Spin } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../utils/api';
const { Title, Text } = Typography;
const Register = ({ onRegister }) => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await authApi.register(values.username, values.email, values.password);
            if (response.success) {
                onRegister(response.data.user, response.data.token);
                message.success('注册成功！欢迎加入AI工作流平台');
                navigate('/');
            }
            else {
                message.error(response.message || '注册失败');
            }
        }
        catch (error) {
            console.error('注册错误:', error);
            const errorMessage = error.response?.data?.message || '注册失败，请检查输入信息';
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
            width: 450,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            borderRadius: 12,
            overflow: 'hidden'
        }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #52c41a, #13c2c2)',
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
          <Title level={2} style={{ color: '#52c41a', marginBottom: 8 }}>
            用户注册
          </Title>
          <Text type="secondary">创建您的AI工作流平台账户</Text>
        </div>
        
        <Form name="register" onFinish={onFinish} size="large" layout="vertical">
          <Form.Item name="username" rules={[
            { required: true, message: '请输入用户名!' },
            { min: 3, message: '用户名至少3个字符' },
            { max: 20, message: '用户名最多20个字符' }
        ]}>
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" size="large"/>
          </Form.Item>

          <Form.Item name="email" rules={[
            { required: true, message: '请输入邮箱!' },
            { type: 'email', message: '请输入有效的邮箱地址' }
        ]}>
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址" size="large"/>
          </Form.Item>

          <Form.Item name="password" rules={[
            { required: true, message: '请输入密码!' },
            { min: 6, message: '密码至少6个字符' }
        ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large"/>
          </Form.Item>

          <Form.Item name="confirmPassword" dependencies={['password']} rules={[
            { required: true, message: '请确认密码!' },
            ({ getFieldValue }) => ({
                validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致!'));
                },
            }),
        ]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" size="large"/>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading} size="large">
              {loading ? <Spin size="small"/> : null}
              注册账户
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '20px 0' }}>
          <Text type="secondary">已有账户？</Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Button type="link" onClick={() => navigate('/login')} size="large">
            立即登录
          </Button>
        </div>
      </Card>
    </div>);
};
export default Register;
//# sourceMappingURL=Register.js.map
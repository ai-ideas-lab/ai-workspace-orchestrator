import React, { useState } from 'react';
import { Card, Form, Input, Button, Upload, Typography, Row, Col, Space, Switch, Select, message, Divider, Statistic, List, Tag, Avatar, Descriptions } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, BellOutlined, SafetyOutlined, GlobalOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const Profile = () => {
    const [form] = Form.useForm();
    const [preferencesForm] = Form.useForm();
    const [securityForm] = Form.useForm();
    const [activeTab, setActiveTab] = useState('basic');
    const navigate = useNavigate();
    const [userProfile] = useState({
        id: '1',
        username: 'admin',
        email: 'admin@company.com',
        role: '管理员',
        preferences: {
            theme: 'light',
            language: 'zh-CN',
            notifications: {
                email: true,
                browser: true,
                mobile: false
            },
            timezone: 'Asia/Shanghai'
        },
        stats: {
            workflowsCreated: 12,
            executionsRun: 156,
            collaborations: 8
        },
        security: {
            twoFactor: true,
            lastLogin: '2026-04-05 10:30:00',
            passwordChanged: '2026-03-15'
        }
    });
    const languages = [
        { value: 'zh-CN', label: '简体中文' },
        { value: 'en-US', label: 'English' },
        { value: 'ja-JP', label: '日本語' },
        { value: 'ko-KR', label: '한국어' }
    ];
    const timezones = [
        { value: 'Asia/Shanghai', label: '北京时间 (UTC+8)' },
        { value: 'UTC', label: '协调世界时 (UTC+0)' },
        { value: 'America/New_York', label: '纽约时间 (UTC-5)' },
        { value: 'Europe/London', label: '伦敦时间 (UTC+0)' },
        { value: 'Asia/Tokyo', label: '东京时间 (UTC+9)' }
    ];
    const handleBasicInfoSubmit = async (values) => {
        try {
            await form.validateFields();
            message.success('基本信息更新成功');
        }
        catch (error) {
            console.error('Validation failed:', error);
        }
    };
    const handlePreferencesSubmit = async (values) => {
        try {
            await preferencesForm.validateFields();
            message.success('偏好设置更新成功');
        }
        catch (error) {
            console.error('Validation failed:', error);
        }
    };
    const handleSecuritySubmit = async (values) => {
        try {
            await securityForm.validateFields();
            message.success('安全设置更新成功');
        }
        catch (error) {
            console.error('Validation failed:', error);
        }
    };
    const handlePasswordChange = async (values) => {
        try {
            await securityForm.validateFields(['currentPassword', 'newPassword', 'confirmPassword']);
            message.success('密码修改成功');
            securityForm.resetFields(['currentPassword', 'newPassword', 'confirmPassword']);
        }
        catch (error) {
            console.error('Validation failed:', error);
        }
    };
    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('只能上传图片文件！');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('图片大小不能超过 2MB！');
        }
        return false;
    };
    const uploadProps = {
        name: 'avatar',
        accept: 'image/*',
        beforeUpload: beforeUpload,
        maxCount: 1,
        onChange: (info) => {
            if (info.file.status === 'done') {
                message.success('头像上传成功');
            }
            else if (info.file.status === 'error') {
                message.error('头像上传失败');
            }
        }
    };
    const tabItems = [
        {
            key: 'basic',
            label: '基本信息',
            children: (<Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Upload {...uploadProps}>
                  <Avatar size={80} src={userProfile.avatar} icon={<UserOutlined />} style={{ cursor: 'pointer' }}/>
                </Upload>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">点击上传头像</Text>
                </div>
              </div>
            </Col>
            <Col xs={24} md={16}>
              <Form form={form} layout="vertical" initialValues={{
                    username: userProfile.username,
                    email: userProfile.email,
                    role: userProfile.role
                }} onFinish={handleBasicInfoSubmit}>
                <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                  <Input prefix={<UserOutlined />} placeholder="请输入用户名"/>
                </Form.Item>

                <Form.Item name="email" label="邮箱地址" rules={[
                    { required: true, message: '请输入邮箱地址' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                ]}>
                  <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址"/>
                </Form.Item>

                <Form.Item name="role" label="角色">
                  <Select disabled>
                    <Option value="管理员">管理员</Option>
                    <Option value="开发者">开发者</Option>
                    <Option value="用户">用户</Option>
                  </Select>
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      保存修改
                    </Button>
                    <Button onClick={() => navigate('/')}>
                      返回首页
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Col>
          </Row>
        </Card>)
        },
        {
            key: 'stats',
            label: '使用统计',
            children: (<Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8} lg={6}>
              <Card>
                <Statistic title="创建的工作流" value={userProfile.stats.workflowsCreated} prefix={<TeamOutlined />}/>
              </Card>
            </Col>
            <Col xs={24} sm={8} lg={6}>
              <Card>
                <Statistic title="执行次数" value={userProfile.stats.executionsRun} prefix={<GlobalOutlined />}/>
              </Card>
            </Col>
            <Col xs={24} sm={8} lg={6}>
              <Card>
                <Statistic title="协作项目" value={userProfile.stats.collaborations} prefix={<SafetyOutlined />}/>
              </Card>
            </Col>
            <Col xs={24} sm={8} lg={6}>
              <Card>
                <Statistic title="账户活跃天数" value={45} prefix={<BellOutlined />}/>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Title level={4}>最近活动</Title>
          <List dataSource={[
                    {
                        id: '1',
                        action: '创建工作流',
                        target: '数据处理工作流',
                        time: '2026-04-05 10:30:00'
                    },
                    {
                        id: '2',
                        action: '执行工作流',
                        target: 'AI内容生成',
                        time: '2026-04-05 10:25:00'
                    },
                    {
                        id: '3',
                        action: '配置AI引擎',
                        target: 'OpenAI GPT-4',
                        time: '2026-04-05 10:20:00'
                    }
                ]} renderItem={(item) => (<List.Item>
                <List.Item.Meta title={`${item.action}: ${item.target}`} description={<Text type="secondary">{item.time}</Text>}/>
              </List.Item>)}/>
        </Card>)
        },
        {
            key: 'preferences',
            label: '偏好设置',
            children: (<Card title="偏好设置">
          <Form form={preferencesForm} layout="vertical" initialValues={userProfile.preferences} onFinish={handlePreferencesSubmit}>
            <Row gutter={[16, 0]}>
              <Col span={12}>
                <Form.Item name="theme" label="主题" rules={[{ required: true, message: '请选择主题' }]}>
                  <Select placeholder="选择主题">
                    <Option value="light">浅色主题</Option>
                    <Option value="dark">深色主题</Option>
                    <Option value="auto">跟随系统</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="language" label="语言" rules={[{ required: true, message: '请选择语言' }]}>
                  <Select placeholder="选择语言">
                    {languages.map(lang => (<Option key={lang.value} value={lang.value}>
                        {lang.label}
                      </Option>))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="timezone" label="时区" rules={[{ required: true, message: '请选择时区' }]}>
              <Select placeholder="选择时区">
                {timezones.map(tz => (<Option key={tz.value} value={tz.value}>
                    {tz.label}
                  </Option>))}
              </Select>
            </Form.Item>

            <Divider />

            <Title level={4}>通知设置</Title>
            <Row gutter={[16, 0]}>
              <Col span={8}>
                <Form.Item name={['notifications', 'email']} label="邮件通知" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['notifications', 'browser']} label="浏览器通知" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['notifications', 'mobile']} label="移动推送" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>)
        },
        {
            key: 'security',
            label: '安全设置',
            children: (<Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="账户安全">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="双重认证">
                    <Switch checked={userProfile.security.twoFactor} onChange={(checked) => {
                    message.info(`双重认证${checked ? '已启用' : '已禁用'}`);
                }}/>
                  </Descriptions.Item>
                  <Descriptions.Item label="最后登录时间">
                    {userProfile.security.lastLogin}
                  </Descriptions.Item>
                  <Descriptions.Item label="密码修改时间">
                    {userProfile.security.passwordChanged}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="修改密码">
                <Form form={securityForm} layout="vertical" onFinish={handlePasswordChange}>
                  <Form.Item name="currentPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
                    <Input.Password prefix={<LockOutlined />}/>
                  </Form.Item>

                  <Form.Item name="newPassword" label="新密码" rules={[
                    { required: true, message: '请输入新密码' },
                    { min: 8, message: '密码长度至少8位' }
                ]}>
                    <Input.Password prefix={<LockOutlined />}/>
                  </Form.Item>

                  <Form.Item name="confirmPassword" label="确认密码" dependencies={['newPassword']} rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('两次输入的密码不匹配'));
                        },
                    }),
                ]}>
                    <Input.Password prefix={<LockOutlined />}/>
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      修改密码
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>
        </Card>)
        }
    ];
    return (<div>
      <Title level={2} style={{ marginBottom: 24 }}>个人中心</Title>
      
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Card>
            <Descriptions column={3}>
              <Descriptions.Item label="用户名">
                {userProfile.username}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {userProfile.email}
              </Descriptions.Item>
              <Descriptions.Item label="角色">
                <Tag color="blue">{userProfile.role}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card>
            <Space>
              {tabItems.map(item => (<Button key={item.key} type={activeTab === item.key ? 'primary' : 'default'} onClick={() => setActiveTab(item.key)}>
                  {item.label}
                </Button>))}
            </Space>

            {tabItems.find(item => item.key === activeTab)?.children}
          </Card>
        </Space>
      </Card>
    </div>);
};
export default Profile;
//# sourceMappingURL=Profile.js.map
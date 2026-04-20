import React from 'react';
import { Card, Typography, Button, Table, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
const { Title } = Typography;
const TeamsPage = () => {
    const teams = [
        { id: 1, name: '开发团队', description: '负责AI应用开发', members: 8, owner: '张三' },
        { id: 2, name: '产品设计', description: '负责UI/UX设计', members: 5, owner: '李四' },
        { id: 3, name: '运营团队', description: '负责产品运营', members: 6, owner: '王五' },
    ];
    const columns = [
        {
            title: '团队名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: '成员数',
            dataIndex: 'members',
            key: 'members',
            render: (members) => <span>{members} 人</span>
        },
        {
            title: '负责人',
            dataIndex: 'owner',
            key: 'owner',
        },
        {
            title: '操作',
            key: 'action',
            render: () => (<Space>
          <Button type="primary" size="small">管理</Button>
          <Button size="small">编辑</Button>
        </Space>)
        }
    ];
    return (<div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2}>团队管理</Title>
          <p>创建和管理团队，协作文档和工作流</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />}>
          创建团队
        </Button>
      </div>

      <Card>
        <Table columns={columns} dataSource={teams} rowKey="id"/>
      </Card>
    </div>);
};
export default TeamsPage;
//# sourceMappingURL=TeamsPage.js.map
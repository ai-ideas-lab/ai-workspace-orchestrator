import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Select, Button, Space, Typography, Tag, Tooltip, Spin, Pagination, Statistic, Rate, Modal, message, Divider, Badge, Empty, Tabs, Segmented, Drawer } from 'antd';
import { SearchOutlined, StarOutlined, EyeOutlined, CopyOutlined, PlusOutlined, TrophyOutlined, FireOutlined, BookOutlined, UserOutlined, SettingOutlined, GlobalOutlined, TeamOutlined, BarChartOutlined, RocketOutlined, ApiOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { templatesApi } from '../services/api';
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Segment } = Segmented;
const TemplateLibrary = () => {
    const [templates, setTemplates] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [sortBy, setSortBy] = useState('featured');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [featuredTemplates, setFeaturedTemplates] = useState([]);
    const [popularTemplates, setPopularTemplates] = useState([]);
    const [showTemplateDetail, setShowTemplateDetail] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [ratingModalVisible, setRatingModalVisible] = useState(false);
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [myTemplates, setMyTemplates] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const categories = [
        { value: 'business', label: '商务办公', icon: <TeamOutlined /> },
        { value: 'productivity', label: '生产力工具', icon: <ThunderboltOutlined /> },
        { value: 'development', label: '开发相关', icon: <ApiOutlined /> },
        { value: 'personal', label: '个人生活', icon: <UserOutlined /> },
        { value: 'automation', label: '自动化流程', icon: <RocketOutlined /> },
        { value: 'analytics', label: '数据分析', icon: <BarChartOutlined /> },
        { value: 'communication', label: '沟通协作', icon: <GlobalOutlined /> }
    ];
    const popularTags = [
        '会议', '代码', '数据', '报告', '审查', '分析', '自动化', '商务',
        '效率', '工具', '开发', '测试', '部署', '监控', '安全', '优化'
    ];
    const fetchTemplates = async (page = 1, filters = {}) => {
        setLoading(true);
        try {
            const response = await templatesApi.getTemplates({
                page,
                page_size: pageSize,
                search: searchQuery,
                category: selectedCategory,
                tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
                ...filters
            });
            if (sortBy === 'featured') {
                setTemplates(response.data.featured || []);
            }
            else if (sortBy === 'popular') {
                setTemplates(response.data.popular || []);
            }
            else {
                setTemplates(response.data.templates || []);
            }
        }
        catch (error) {
            message.error('获取模板列表失败');
        }
        finally {
            setLoading(false);
        }
    };
    const fetchStats = async () => {
        try {
            const response = await templatesApi.getStats();
            setStats(response.data);
        }
        catch (error) {
            console.error('获取统计信息失败:', error);
        }
    };
    const fetchFeaturedTemplates = async () => {
        try {
            const response = await templatesApi.getFeaturedTemplates(6);
            setFeaturedTemplates(response.data);
        }
        catch (error) {
            console.error('获取推荐模板失败:', error);
        }
    };
    const fetchPopularTemplates = async () => {
        try {
            const response = await templatesApi.getPopularTemplates(6);
            setPopularTemplates(response.data);
        }
        catch (error) {
            console.error('获取热门模板失败:', error);
        }
    };
    const fetchMyTemplates = async () => {
        try {
            const response = await templatesApi.getMyTemplates();
            setMyTemplates(response.data);
        }
        catch (error) {
            message.error('获取我的模板失败');
        }
    };
    const handleUseTemplate = async (templateId) => {
        try {
            await templatesApi.useTemplate(templateId);
            message.success('模板使用次数已增加');
            fetchTemplates(currentPage);
            fetchStats();
        }
        catch (error) {
            message.error('使用模板失败');
        }
    };
    const handleRateTemplate = async (templateId) => {
        if (ratingValue === 0) {
            message.warning('请选择评分');
            return;
        }
        try {
            await templatesApi.rateTemplate(templateId, {
                rating: ratingValue,
                comment: ratingComment || undefined
            });
            message.success('评分成功');
            setRatingModalVisible(false);
            setRatingValue(0);
            setRatingComment('');
            fetchTemplates(currentPage);
            fetchStats();
        }
        catch (error) {
            message.error('评分失败');
        }
    };
    const handleCopyTemplate = (template) => {
        message.success('模板已复制，可在工作流设计中使用');
        console.log('复制模板:', template.template_definition);
    };
    const handleViewTemplate = (template) => {
        setSelectedTemplate(template);
        setShowTemplateDetail(true);
    };
    const handleInitSystemTemplates = async () => {
        try {
            await templatesApi.initSystemTemplates();
            message.success('系统模板初始化成功');
            fetchTemplates(currentPage);
            fetchStats();
        }
        catch (error) {
            message.error('初始化系统模板失败');
        }
    };
    const renderTemplateCard = (template) => (<Card hoverable cover={<div style={{
                height: 120,
                background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 24,
                fontWeight: 'bold'
            }}>
          {template.is_featured ? <TrophyOutlined /> : <BookOutlined />}
        </div>} actions={[
            <Tooltip title="使用模板">
          <Button type="text" icon={<EyeOutlined />} onClick={() => handleUseTemplate(template.id)}/>
        </Tooltip>,
            <Tooltip title="查看详情">
          <Button type="text" icon={<SettingOutlined />} onClick={() => handleViewTemplate(template)}/>
        </Tooltip>,
            <Tooltip title="复制模板">
          <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopyTemplate(template)}/>
        </Tooltip>,
            <Tooltip title="评分">
          <Button type="text" icon={<StarOutlined />} onClick={() => {
                    setSelectedTemplate(template);
                    setRatingModalVisible(true);
                }}/>
        </Tooltip>
        ]}>
      <Card.Meta title={<Space>
            <Text strong>{template.name}</Text>
            {template.is_featured && <Badge color="gold" text="推荐"/>}
          </Space>} description={<Space direction="vertical" size="small">
            <Text ellipsis={{ rows: 2 }}>
              {template.description}
            </Text>
            <Space>
              {template.tags.slice(0, 3).map(tag => (<Tag key={tag} size="small">{tag}</Tag>))}
              {template.tags.length > 3 && (<Tag size="small">+{template.tags.length - 3}</Tag>)}
            </Space>
            <Space split={<Divider type="vertical"/>}>
              <Space>
                <EyeOutlined />
                <Text>{template.usage_count}</Text>
              </Space>
              <Space>
                <StarOutlined />
                <Text>{template.rating.toFixed(1)}</Text>
                ({template.rating_count})
              </Space>
            </Space>
          </Space>}/>
    </Card>);
    const renderStatCard = (title, value, icon) => (<Card>
      <Statistic title={title} value={value} prefix={icon} valueStyle={{ color: '#1890ff' }}/>
    </Card>);
    useEffect(() => {
        fetchStats();
        fetchFeaturedTemplates();
        fetchPopularTemplates();
        fetchTemplates();
    }, []);
    useEffect(() => {
        fetchTemplates(currentPage);
    }, [searchQuery, selectedCategory, selectedTags, sortBy, currentPage, pageSize]);
    return (<div style={{ padding: '24px' }}>
      
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>工作流模板库</Title>
        <Paragraph>使用预设模板快速创建和管理您的工作流</Paragraph>
      </div>

      
      {stats && (<Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            {renderStatCard('总模板数', stats.total_templates, <BookOutlined />)}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderStatCard('公开模板', stats.public_templates, <GlobalOutlined />)}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderStatCard('推荐模板', stats.featured_templates, <TrophyOutlined />)}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderStatCard('总使用次数', stats.total_usage, <FireOutlined />)}
          </Col>
        </Row>)}

      
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={16} md={10}>
            <Input placeholder="搜索模板..." prefix={<SearchOutlined />} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} allowClear/>
          </Col>
          <Col xs={12} sm={8}>
            <Select placeholder="选择分类" value={selectedCategory} onChange={(value) => setSelectedCategory(value)} allowClear style={{ width: '100%' }}>
              {categories.map(cat => (<Select.Option key={cat.value} value={cat.value}>
                  <Space>
                    {cat.icon}
                    {cat.label}
                  </Space>
                </Select.Option>))}
            </Select>
          </Col>
          <Col xs={12} sm={8}>
            <Segmented options={[
            { label: '推荐', value: 'featured' },
            { label: '热门', value: 'popular' },
            { label: '最新', value: 'newest' }
        ]} value={sortBy} onChange={setSortBy}/>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleInitSystemTemplates}>
              初始化系统模板
            </Button>
          </Col>
        </Row>
      </Card>

      
      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>热门标签</Title>
        <Space wrap>
          {popularTags.map(tag => (<Tag key={tag} style={{
                cursor: 'pointer',
                borderColor: selectedTags.includes(tag) ? '#1890ff' : undefined,
                borderWidth: selectedTags.includes(tag) ? '2px' : '1px'
            }} onClick={() => {
                if (selectedTags.includes(tag)) {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                }
                else {
                    setSelectedTags([...selectedTags, tag]);
                }
            }}>
              {tag}
            </Tag>))}
        </Space>
      </Card>

      
      {featuredTemplates.length > 0 && (<div style={{ marginBottom: '24px' }}>
          <Title level={3}>
            <TrophyOutlined style={{ marginRight: '8px' }}/>
            推荐模板
          </Title>
          <Row gutter={[16, 16]}>
            {featuredTemplates.map(template => (<Col xs={24} sm={12} md={8} lg={6} key={template.id}>
                {renderTemplateCard(template)}
              </Col>))}
          </Row>
        </div>)}

      
      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          {templates.map(template => (<Col xs={24} sm={12} md={8} lg={6} key={template.id}>
              {renderTemplateCard(template)}
            </Col>))}
        </Row>
      </div>

      
      {loading && <Spin style={{ display: 'block', margin: '50px auto' }}/>}
      {!loading && templates.length === 0 && (<Empty description="暂无模板" style={{ margin: '50px 0' }}>
          <Button type="primary" onClick={handleInitSystemTemplates}>
            初始化系统模板
          </Button>
        </Empty>)}

      
      {templates.length > 0 && (<div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Pagination current={currentPage} pageSize={pageSize} total={stats?.total_templates || 0} onChange={(page) => setCurrentPage(page)} showSizeChanger showQuickJumper showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}/>
        </div>)}

      
      <Drawer title={selectedTemplate?.name} width={600} open={showTemplateDetail} onClose={() => setShowTemplateDetail(false)}>
        {selectedTemplate && (<div>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Card>
                <Title level={4}>模板描述</Title>
                <Text>{selectedTemplate.description}</Text>
              </Card>

              <Card>
                <Title level={4}>自然语言示例</Title>
                <Text type="secondary" style={{ fontStyle: 'italic' }}>
                  "{selectedTemplate.natural_language_example}"
                </Text>
              </Card>

              <Card>
                <Title level={4}>预期输出</Title>
                <Text>{selectedTemplate.expected_output}</Text>
              </Card>

              <Card>
                <Title level={4}>使用信息</Title>
                <Row gutter={16}>
                  <Col><Statistic title="使用次数" value={selectedTemplate.usage_count}/></Col>
                  <Col><Statistic title="评分" value={selectedTemplate.rating} suffix="/5"/></Col>
                  <Col><Statistic title="评分次数" value={selectedTemplate.rating_count}/></Col>
                </Row>
              </Card>

              <Card>
                <Title level={4}>模板标签</Title>
                <Space wrap>
                  {selectedTemplate.tags.map(tag => (<Tag key={tag}>{tag}</Tag>))}
                </Space>
              </Card>

              <Space>
                <Button type="primary" icon={<CopyOutlined />} onClick={() => {
                handleCopyTemplate(selectedTemplate);
                setShowTemplateDetail(false);
            }}>
                  使用此模板
                </Button>
                <Button icon={<EyeOutlined />} onClick={() => handleUseTemplate(selectedTemplate.id)}>
                  使用模板
                </Button>
              </Space>
            </Space>
          </div>)}
      </Drawer>

      
      <Modal title="为模板评分" open={ratingModalVisible} onOk={handleRateTemplate} onCancel={() => setRatingModalVisible(false)} okText="提交评分">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>评分: </Text>
            <Rate value={ratingValue} onChange={setRatingValue} style={{ fontSize: '24px' }}/>
          </div>
          <div>
            <Text strong>评语 (可选): </Text>
            <Input.TextArea rows={3} value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="分享您使用此模板的体验..."/>
          </div>
        </Space>
      </Modal>
    </div>);
};
export default TemplateLibrary;
//# sourceMappingURL=TemplateLibraryPage.js.map
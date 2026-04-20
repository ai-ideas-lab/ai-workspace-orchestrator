# AI情绪健康陪伴助手 - 架构设计

## 技术选型
React Native + Python FastAPI + PostgreSQL + MongoDB + OpenAI API + Whisper + EmoBERT + FastAPI异步框架 + Redis缓存

## 目录结构
```
ai-emotional-health-companion/
├── frontend/              # React Native移动端
│   ├── components/       # UI组件
│   ├── screens/          # 页面
│   └── services/         # API调用
├── backend/              # Python后端
│   ├── api/              # RESTful API
│   ├── services/         # 业务逻辑
│   ├── models/           # 数据模型
│   └── ai/               # AI模型集成
├── database/             # 数据库配置和迁移
├── ai_models/           # 模型文件和配置
└── tests/               # 单元测试
```

## API列表
- POST /api/emotion/detect - 多模态情绪检测
- POST /api/cbt/therapy - CBT心理疏导对话
- GET /api/progress/{user_id} - 情绪进度查询
- POST /api/family/bridge - 家庭关系分析
- GET /api/analytics/{user_id} - 用户数据分析
- POST /api/crisis/detect - 危机信号检测
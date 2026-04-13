# AI 职场软技能导师 - 架构设计推演

> **项目名称**: AI Career Soft Skills Coach  
> **设计日期**: 2026-04-13  
> **设计者**: 孔明  
> **版本**: v1.0

## 1. 技术选型深度分析

### 1.1 候选方案对比

#### 方案一：传统微服务架构
```
技术栈：Node.js + PostgreSQL + Redis + Kafka + Docker + Kubernetes
特点：完全解耦，高可用，扩展性强
```

**优势分析**：
- 性能 ⭐⭐⭐⭐⭐：服务独立部署，故障隔离，响应速度快
- 开发效率 ⭐⭐⭐：技术栈统一，开发工具成熟，团队协作容易
- 社区支持 ⭐⭐⭐⭐⭐：Node.js 生态系统最成熟，组件库丰富
- 学习曲线 ⭐⭐⭐：对前端开发者友好，但分布式系统概念复杂
- 成本 ⭐⭐⭐：需要更多服务器资源，管理成本高

#### 方案二：Serverless架构
```
技术栈：AWS Lambda + DynamoDB + API Gateway + SQS
特点：按需付费，自动扩缩容，运维简单
```

**优势分析**：
- 性能 ⭐⭐⭐⭐：自动扩容，冷启动有延迟，适合突发流量
- 开发效率 ⭐⭐⭐⭐：无需管理服务器，专注业务逻辑
- 社区支持 ⭐⭐⭐：Serverless模式正在兴起，但成熟度不如传统架构
- 学习曲线 ⭐⭐：需要云平台知识，厂商绑定风险
- 成本 ⭐⭐⭐⭐⭐：按量计费，适合初创公司，随业务增长成本可控

#### 方案三：单体架构+容器化
```
技术栈：Node.js + PostgreSQL + Redis + Docker + Nginx
特点：部署简单，开发高效，逐步演化
```

**优势分析**：
- 性能 ⭐⭐⭐：单进程处理，资源复用，适合中等规模
- 开发效率 ⭐⭐⭐⭐⭐：代码简单，调试方便，部署快速
- 社区支持 ⭐⭐⭐⭐：技术栈广泛，文档丰富
- 学习曲线 ⭐⭐⭐⭐：概念简单，易于上手
- 成本 ⭐⭐⭐：资源使用效率高，运维成本低

### 1.2 综合评分

| 维度 | 方案一 | 方案二 | 方案三 | 推荐度 |
|------|--------|--------|--------|--------|
| 性能 | 9/10 | 8/10 | 7/10 | 方案一 > 方案二 > 方案三 |
| 开发效率 | 7/10 | 8/10 | 9/10 | 方案三 > 方案二 > 方案一 |
| 社区支持 | 10/10 | 7/10 | 9/10 | 方案一 > 方案三 > 方案二 |
| 学习曲线 | 6/10 | 7/10 | 8/10 | 方案三 > 方案二 > 方案一 |
| 成本 | 6/10 | 8/10 | 9/10 | 方案三 > 方案二 > 方案一 |
| **总分** | **38/50** | **38/50** | **40/50** | **方案三最优** |

### 1.3 推荐方案及理由

**推荐方案：单体架构+容器化**

**核心理由**：
1. **业务阶段匹配**：项目处于MVP阶段，需要快速验证市场，单体架构开发效率最高
2. **团队规模**：初创团队(1-2人)，分布式系统维护成本过高
3. **业务特点**：核心是对话和AI分析，不是高并发业务，单体架构完全够用
4. **演化路径**：后期可以根据业务增长，逐步拆分为微服务
5. **成本控制**：资源使用效率最高，运维最简单

**技术栈明细**：
- **后端**: Node.js + Fastify (性能优于Express) + TypeScript
- **数据库**: PostgreSQL + Redis (缓存和会话)
- **AI集成**: OpenAI GPT-4 + Claude API (多模型策略)
- **语音**: Whisper ASR + Edge TTS (成本低，效果稳定)
- **部署**: Docker + Nginx + PM2
- **监控**: Prometheus + Grafana + Sentry
- **CI/CD**: GitHub Actions + 阿里云/腾讯云

## 2. 系统架构设计

### 2.1 完整系统架构图

```mermaid
graph TB
    subgraph "客户端层"
        A[Web端 React]
        B[移动端 React Native]
        C[微信小程序]
        D[管理后台 Web]
    end

    subgraph "API网关层"
        E[Nginx反向代理]
        F[API Gateway<br/>Fastify + JWT]
        G[限流服务]
        H[鉴权服务]
    end

    subgraph "应用服务层"
        I[用户服务<br/>User Service]
        J[场景服务<br/>Scenario Service]
        K[对话服务<br/>Conversation Service]
        L[分析服务<br/>Analysis Service]
        M[邮件优化服务<br/>Email Service]
        N[会议准备服务<br/>Meeting Service]
        O[推荐服务<br/>Recommendation Service]
        P[文件服务<br/>File Service]
        Q[通知服务<br/>Notification Service]
    end

    subgraph "AI引擎层"
        R[对话引擎<br/>Dialogue Engine]
        S[分析引擎<br/>Analysis Engine]
        T[邮件引擎<br/>Email Engine]
        U[推荐引擎<br/>Recommendation Engine]
        V[语音引擎<br/>Voice Engine]
    end

    subgraph "数据存储层"
        W[PostgreSQL主库]
        X[Redis缓存]
        Y[文件存储<br/>OSS/S3]
        Z[搜索引擎<br/>Elasticsearch]
    end

    subgraph "外部服务"
        AA[OpenAI API]
        BB[Claude API]
        CC[Whisper ASR]
        DD[Edge TTS]
        EE[邮件服务]
        FF[推送服务]
        GG[监控服务]
    end

    A --> E
    B --> E
    C --> E
    D --> E

    E --> F
    F --> G
    F --> H

    H --> I
    H --> J
    H --> K
    H --> L
    H --> M
    H --> N
    H --> O
    H --> P
    H --> Q

    I --> W
    J --> W
    K --> W
    L --> W
    M --> W
    N --> W
    O --> W
    P --> Y
    Q --> X

    K --> R
    L --> S
    M --> T
    O --> U
    P --> V

    R --> AA
    R --> BB
    S --> AA
    S --> BB
    T --> AA
    U --> BB
    V --> CC
    V --> DD

    K --> X
    O --> X
    Q --> X

    I --> Z
    J --> Z
    K --> Z

    Q --> EE
    Q --> FF

    P --> GG
    I --> GG
```

### 2.2 核心数据流

```mermaid
sequenceDiagram
    participant U as 用户
    participant G as API Gateway
    participant S as 场景服务
    participant C as 对话服务
    participant AI as AI引擎
    participant DB as 数据库

    U->>G: 请求开始对话
    G->>S: 创建对话会话
    S->>DB: 存储对话上下文
    S->>C: 返回场景信息
    C->>AI: 发送用户消息
    AI->>AI: 调用LLM API
    AI->>C: 返回AI回复
    C->>U: 展示对话界面
    U->>G: 发送用户回复
    G->>C: 转发消息
    C->>AI: 分析用户表现
    AI->>C: 返回反馈建议
    C->>U: 显示反馈
    C->>DB: 保存对话记录
```

### 2.3 控制流设计

```mermaid
graph LR
    A[用户请求] --> B{请求验证}
    B -->|失败| C[返回错误]
    B -->|成功| D[身份认证]
    D -->|失败| C
    D -->|成功| E[权限检查]
    E -->|失败| C
    E -->|成功| F[业务逻辑处理]
    F --> G[AI引擎调用]
    G --> H[结果缓存]
    H --> I[响应生成]
    I --> J[返回结果]
```

## 3. 目录结构设计

### 3.1 详细目录树

```
ai-career-soft-skills-coach/
├── docs/                          # 项目文档
│   ├── architecture.md           # 架构设计
│   ├── api.md                   # API文档
│   ├── deployment.md             # 部署文档
│   └── contributing.md           # 贡献指南
├── src/                          # 源代码
│   ├── config/                  # 配置文件
│   │   ├── database.ts          # 数据库配置
│   │   ├── redis.ts             # Redis配置
│   │   ├── ai.ts                # AI服务配置
│   │   └── app.ts               # 应用配置
│   ├── core/                    # 核心模块
│   │   ├── database/            # 数据库连接和模型
│   │   │   ├── connection.ts   # 连接配置
│   │   │   ├── models/          # 数据模型
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── scenario.model.ts
│   │   │   │   ├── conversation.model.ts
│   │   │   │   ├── feedback.model.ts
│   │   │   │   └── session.model.ts
│   │   │   └── migrations/      # 数据库迁移
│   │   ├── ai/                  # AI服务
│   │   │   ├── dialogue/        # 对话引擎
│   │   │   │   ├── dialogue-engine.ts
│   │   │   │   ├── prompt-templates.ts
│   │   │   │   └── response-generator.ts
│   │   │   ├── analysis/        # 分析引擎
│   │   │   │   ├── skill-analyzer.ts
│   │   │   │   ├── feedback-generator.ts
│   │   │   │   └── progress-tracker.ts
│   │   │   ├── email/           # 邮件优化引擎
│   │   │   │   ├── email-analyzer.ts
│   │   │   │   ├── email-optimizer.ts
│   │   │   │   └── template-generator.ts
│   │   │   └── recommendation/  # 推荐引擎
│   │   │       ├── scenario-recommender.ts
│   │   │       ├── path-recommender.ts
│   │   │       └── content-recommender.ts
│   │   ├── services/            # 业务服务
│   │   │   ├── user.service.ts
│   │   │   ├── scenario.service.ts
│   │   │   ├── conversation.service.ts
│   │   │   ├── analysis.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── meeting.service.ts
│   │   │   ├── recommendation.service.ts
│   │   │   └── notification.service.ts
│   │   ├── middleware/          # 中间件
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── rate-limit.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── cors.middleware.ts
│   │   ├── utils/               # 工具函数
│   │   │   ├── logger.ts
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   ├── constants.ts
│   │   │   └── helpers.ts
│   │   └── types/               # 类型定义
│   │       ├── user.types.ts
│   │       ├── scenario.types.ts
│   │       ├── conversation.types.ts
│   │       ├── ai.types.ts
│   │       └── api.types.ts
│   ├── api/                     # API路由
│   │   ├── routes/              # 路由定义
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── scenario.routes.ts
│   │   │   ├── conversation.routes.ts
│   │   │   ├── analysis.routes.ts
│   │   │   ├── email.routes.ts
│   │   │   ├── meeting.routes.ts
│   │   │   └── recommendation.routes.ts
│   │   ├── controllers/         # 控制器
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── scenario.controller.ts
│   │   │   ├── conversation.controller.ts
│   │   │   ├── analysis.controller.ts
│   │   │   ├── email.controller.ts
│   │   │   ├── meeting.controller.ts
│   │   │   └── recommendation.controller.ts
│   │   ├── schemas/             # 数据验证
│   │   │   ├── auth.schema.ts
│   │   │   ├── user.schema.ts
│   │   │   ├── scenario.schema.ts
│   │   │   ├── conversation.schema.ts
│   │   │   ├── analysis.schema.ts
│   │   │   └── email.schema.ts
│   │   └── middleware/          # API中间件
│   │       ├── validation.ts
│   │       ├── auth.ts
│   │       └── rate-limit.ts
│   ├── jobs/                   # 定时任务
│   │   ├── analytics.job.ts
│   │   ├── cleanup.job.ts
│   │   └── notification.job.ts
│   └── app.ts                  # 应用入口
├── tests/                      # 测试文件
│   ├── unit/                   # 单元测试
│   │   ├── core/
│   │   │   ├── ai/
│   │   │   └── services/
│   │   └── api/
│   ├── integration/            # 集成测试
│   │   ├── api/
│   │   └── database/
│   └── e2e/                   # 端到端测试
│       ├── conversation.spec.ts
│       └── scenario.spec.ts
├── scripts/                    # 脚本文件
│   ├── build.ts               # 构建脚本
│   ├── migrate.ts             # 数据库迁移
│   ├── seed.ts                # 数据种子
│   └── deploy.ts             # 部署脚本
├── docker/                     # Docker配置
│   ├── Dockerfile             # 主容器
│   ├── docker-compose.yml     # 编排文件
│   └── nginx.conf             # Nginx配置
├── public/                     # 静态资源
│   ├── uploads/              # 用户上传文件
│   ├── static/               # 静态资源
│   └── templates/            # 模板文件
├── package.json               # 依赖配置
├── tsconfig.json              # TypeScript配置
├── jest.config.js            # 测试配置
├── eslint.config.js         # 代码规范
├── .env.example              # 环境变量示例
├── .env.local               # 本地环境变量
└── README.md                 # 项目说明
```

### 3.2 文件命名规范

- **文件名**: 小写字母，用连字符分隔
- **类名**: PascalCase (例: `UserService`)
- **函数名**: camelCase (例: `getUserProfile`)
- **常量**: SCREAMING_SNAKE_CASE (例: `MAX_RETRIES`)
- **接口**: PascalCase，以 `I` 开头 (例: `IUser`)
- **枚举**: PascalCase (例: `UserRole`)

## 4. 核心API设计

### 4.1 RESTful端点列表

#### 4.1.1 认证相关
```typescript
// 用户注册
POST /api/auth/register
Request: {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'admin';
  industry?: string;
  experience?: number;
}

// 用户登录
POST /api/auth/login
Request: {
  email: string;
  password: string;
}

// 刷新令牌
POST /api/auth/refresh
Request: {
  refreshToken: string;
}

// 退出登录
POST /api/auth/logout
```

#### 4.1.2 用户管理
```typescript
// 获取用户信息
GET /api/user/profile
Response: {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  industry?: string;
  experience?: number;
  createdAt: string;
  updatedAt: string;
}

// 更新用户信息
PUT /api/user/profile
Request: {
  name?: string;
  avatar?: string;
  industry?: string;
  experience?: number;
}

// 获取用户统计
GET /api/user/stats
Response: {
  totalSessions: number;
  completedScenarios: number;
  averageScore: number;
  learningStreak: number;
  lastActivity: string;
}
```

#### 4.1.3 场景管理
```typescript
// 获取场景列表
GET /api/scenarios
Query: {
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  limit?: number;
  offset?: number;
}
Response: {
  scenarios: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    estimatedTime: number;
    tags: string[];
  }>;
  total: number;
}

// 获取场景详情
GET /api/scenarios/:id
Response: {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedTime: number;
  tags: string[];
  dialogueContext: string;
  character: {
    name: string;
    role: string;
    personality: string;
  };
  objectives: string[];
}

// 开始场景对话
POST /api/scenarios/:id/start
Response: {
  sessionId: string;
  scenario: Scenario;
  initialMessage: string;
  context: string;
}
```

#### 4.1.4 对话交互
```typescript
// 发送消息
POST /api/conversations/:sessionId/messages
Request: {
  message: string;
  messageType: 'text' | 'voice';
  audioData?: string; // Base64编码
}

// 获取对话历史
GET /api/conversations/:sessionId/messages
Query: {
  limit?: number;
  offset?: number;
}
Response: {
  messages: Array<{
    id: string;
    type: string;
    content: string;
    timestamp: string;
    userMessage?: string;
    aiResponse?: string;
    feedback?: Feedback;
  }>;
}

// 获取对话反馈
GET /api/conversations/:sessionId/feedback
Response: {
  sessionId: string;
  scenario: Scenario;
  userPerformance: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    score: number;
  };
  timeline: Array<{
    timestamp: string;
    event: string;
    feedback: string;
  }>;
}

// 结束对话
POST /api/conversations/:sessionId/end
Request: {
  userRating?: number;
  feedback?: string;
}
```

#### 4.1.5 AI分析服务
```typescript
// 邮件优化分析
POST /api/analysis/email
Request: {
  email: string;
  purpose: 'professional' | 'casual' | 'formal';
  tone?: 'friendly' | 'serious' | 'persuasive';
}
Response: {
  originalEmail: string;
  optimizedEmail: string;
  improvements: Array<{
    type: 'clarity' | 'tone' | 'structure';
    description: string;
    before: string;
    after: string;
  }>;
  suggestions: string[];
}

// 会议准备分析
POST /api/analysis/meeting
Request: {
  meetingType: 'presentation' | 'negotiation' | 'feedback' | 'brainstorm';
  topic: string;
  role: string;
  duration: number;
  audience?: string;
}
Response: {
  keyPoints: string[];
  talkingPoints: string[];
  potentialQuestions: Array<{
    question: string;
    answer: string;
    followUps?: string[];
  }>;
  timeManagement: {
    introduction: number;
    mainPoints: Array<{
      point: string;
      time: number;
    }>;
    conclusion: number;
  };
  tips: string[];
}

// 场景复盘分析
POST /api/analysis/review
Request: {
  scenarioId: string;
  userActions: Array<{
    action: string;
    result: string;
    timestamp: string;
  }>;
  challenges: string[];
}
Response: {
  performance: {
    score: number;
    strengths: string[];
    areas: string[];
    overall: string;
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    area: string;
    action: string;
    expectedOutcome: string;
  }>;
  nextSteps: string[];
}
```

#### 4.1.6 推荐服务
```typescript
// 获取推荐场景
GET /api/recommendations/scenarios
Query: {
  limit?: number;
}
Response: {
  recommendations: Array<{
    scenarioId: string;
    title: string;
    reason: string;
    priority: number;
    estimatedTime: number;
  }>;
}

// 获取学习路径
GET /api/recommendations/learning-path
Response: {
  currentLevel: string;
  nextMilestone: string;
  recommendedPath: Array<{
    step: string;
    description: string;
    estimatedTime: string;
    scenarios: string[];
  }>;
  estimatedCompletion: string;
}

// 获取个性化内容
GET /api/recommendations/content
Query: {
  type: 'tips' | 'articles' | 'videos';
  limit?: number;
}
Response: {
  content: Array<{
    id: string;
    title: string;
    type: string;
    description: string;
    url?: string;
    estimatedReadTime: number;
    relevance: number;
  }>;
}
```

#### 4.1.7 文件管理
```typescript
// 上传语音文件
POST /api/files/upload
Request: {
  file: File;
  type: 'voice' | 'avatar' | 'document';
}
Response: {
  fileId: string;
  url: string;
  size: number;
  type: string;
}

// 下载文件
GET /api/files/:fileId

// 删除文件
DELETE /api/files/:fileId
```

### 4.2 请求/响应Schema定义

```typescript
// 用户注册请求Schema
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['user', 'admin']).default('user'),
  industry: z.string().optional(),
  experience: z.number().min(0).max(30).optional(),
});

// 对话消息Schema
export const MessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  messageType: z.enum(['text', 'voice']),
  audioData: z.string().optional(),
});

// 场景创建请求Schema
export const ScenarioCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedTime: z.number().min(1).max(120),
  dialogueContext: z.string().min(10),
  character: z.object({
    name: z.string().min(1),
    role: z.string().min(1),
    personality: z.string().min(1),
  }),
  objectives: z.array(z.string()).min(1),
});
```

### 4.3 认证和授权方案

#### 4.3.1 JWT令牌结构
```typescript
interface JWTPayload {
  sub: string;         // 用户ID
  email: string;       // 用户邮箱
  role: string;        // 用户角色
  iat: number;         // 签发时间
  exp: number;         // 过期时间
  type: 'access' | 'refresh';
}
```

#### 4.3.2 认证流程
```mermaid
sequenceDiagram
    participant U as 用户
    participant C as 客户端
    participant S as 服务器
    participant DB as 数据库

    U->>C: 输入邮箱密码
    C->>S: 发送登录请求
    S->>DB: 验证用户凭据
    DB->>S: 返回用户信息
    S->>S: 生成JWT令牌
    S->>C: 返回访问令牌和刷新令牌
    C->>C: 存储令牌
```

#### 4.3.3 权限控制
```typescript
// 角色权限定义
enum RolePermissions {
  ADMIN = ['read:all', 'write:all', 'delete:all'],
  USER = ['read:own', 'write:own', 'read:scenarios'],
  GUEST = ['read:scenarios'],
}

// 权限检查中间件
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!RolePermissions[user.role].includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};
```

## 5. 数据模型设计

### 5.1 Prisma Schema

```prisma
// database.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 用户模型
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  avatar    String?
  role      UserRole @default(USER)
  industry  String?
  experience Int?    @default(0)
  
  // 关联关系
  scenarios           Scenario[]
  conversations       Conversation[]
  feedbacks          Feedback[]
  sessions           Session[]
  recommendations    Recommendation[]
  analytics          Analytics[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

enum UserRole {
  USER
  ADMIN
}

// 场景模型
model Scenario {
  id              String   @id @default(cuid())
  title           String
  description     String
  category        String
  difficulty      Difficulty
  estimatedTime   Int      // 分钟
  tags            String[]
  dialogueContext String
  character       Json     // 角色信息
  objectives      String[]
  isActive        Boolean  @default(true)
  
  // 关联关系
  createdBy      User       @relation(fields: [createdById], references: [id])
  createdById    String
  conversations  Conversation[]
  recommendations Recommendation[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("scenarios")
}

enum Difficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

// 对话会话模型
model Conversation {
  id        String   @id @default(cuid())
  sessionId String
  scenario  Scenario @relation(fields: [scenarioId], references: [id])
  scenarioId String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  startTime DateTime @default(now())
  endTime   DateTime?
  status    ConversationStatus @default(ACTIVE)
  
  // 关联关系
  messages      Message[]
  feedbacks     Feedback[]
  
  @@map("conversations")
}

enum ConversationStatus {
  ACTIVE
  COMPLETED
  PAUSED
  CANCELLED
}

// 对话消息模型
model Message {
  id          String    @id @default(cuid())
  conversation Conversation @relation(fields: [conversationId], references: [id])
  conversationId String
  type        MessageType
  userMessage String?
  aiResponse  String?
  audioData   String?    // Base64编码
  timestamp   DateTime  @default(now())
  
  @@map("messages")
}

enum MessageType {
  TEXT
  VOICE
  SYSTEM
}

// 反馈模型
model Feedback {
  id            String   @id @default(cuid())
  conversation  Conversation @relation(fields: [conversationId], references: [id])
  conversationId String
  scenario      Scenario @relation(fields: [scenarioId], references: [id])
  scenarioId    String
  user          User     @relation(fields: [userId], references: [id])
  userId        String
  
  score         Float    // 0-100
  strengths     String[]
  weaknesses    String[]
  suggestions   String[]
  userRating    Int?     // 1-5
  userComment   String?
  
  createdAt DateTime @default(now())

  @@map("feedbacks")
}

// 用户会话模型
model Session {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  startTime DateTime @default(now())
  endTime   DateTime?
  status    SessionStatus @default(ACTIVE)
  data      Json?    // 会话数据
  
  @@map("sessions")
}

enum SessionStatus {
  ACTIVE
  COMPLETED
  EXPIRED
}

// 推荐模型
model Recommendation {
  id          String           @id @default(cuid())
  user        User             @relation(fields: [userId], references: [id])
  userId      String
  type        RecommendationType
  targetId    String           // 推荐目标ID
  reason      String
  priority    Int              @default(0)
  isRead      Boolean          @default(false)
  isAccepted  Boolean?         // 是否接受推荐
  createdAt   DateTime         @default(now())
  readAt      DateTime?
  
  @@map("recommendations")
}

enum RecommendationType {
  SCENARIO
  LEARNING_PATH
  CONTENT
}

// 分析数据模型
model Analytics {
  id          String     @id @default(cuid())
  user        User       @relation(fields: [userId], references: [id])
  userId      String
  type        AnalyticsType
  data        Json       // 分析数据
  timestamp   DateTime   @default(now())
  
  @@map("analytics")
}

enum AnalyticsType {
  PERFORMANCE
  BEHAVIOR
  ENGAGEMENT
}
```

### 5.2 ER关系图

```mermaid
erDiagram
    User {
        String id PK
        String email
        String password
        String name
        String avatar
        UserRole role
        String industry
        Int experience
        DateTime createdAt
        DateTime updatedAt
    }
    
    Scenario {
        String id PK
        String title
        String description
        String category
        Difficulty difficulty
        Int estimatedTime
        String[] tags
        String dialogueContext
        Json character
        String[] objectives
        Boolean isActive
        String createdById FK
        DateTime createdAt
        DateTime updatedAt
    }
    
    Conversation {
        String id PK
        String sessionId
        String scenarioId FK
        String userId FK
        DateTime startTime
        DateTime endTime
        ConversationStatus status
    }
    
    Message {
        String id PK
        String conversationId FK
        MessageType type
        String userMessage
        String aiResponse
        String audioData
        DateTime timestamp
    }
    
    Feedback {
        String id PK
        String conversationId FK
        String scenarioId FK
        String userId FK
        Float score
        String[] strengths
        String[] weaknesses
        String[] suggestions
        Int userRating
        String userComment
        DateTime createdAt
    }
    
    Session {
        String id PK
        String userId FK
        DateTime startTime
        DateTime endTime
        SessionStatus status
        Json data
    }
    
    Recommendation {
        String id PK
        String userId FK
        RecommendationType type
        String targetId
        String reason
        Int priority
        Boolean isRead
        Boolean isAccepted
        DateTime createdAt
        DateTime readAt
    }
    
    Analytics {
        String id PK
        String userId FK
        AnalyticsType type
        Json data
        DateTime timestamp
    }
    
    User ||--o{ Scenario : "creates"
    User ||--o{ Conversation : "participates"
    User ||--o{ Session : "has"
    User ||--o{ Recommendation : "receives"
    User ||--o{ Analytics : "generates"
    Scenario ||--o{ Conversation : "used_in"
    Scenario ||--o{ Feedback : "generates"
    Conversation ||--o{ Message : "contains"
    Conversation ||--o{ Feedback : "has"
    
```

### 5.3 索引策略

```sql
-- 用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 场景表索引
CREATE INDEX idx_scenarios_category ON scenarios(category);
CREATE INDEX idx_scenarios_difficulty ON scenarios(difficulty);
CREATE INDEX idx_scenarios_active ON scenarios(is_active);
CREATE INDEX idx_scenarios_created_at ON scenarios(created_at);

-- 对话表索引
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_scenario_id ON conversations(scenario_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_start_time ON conversations(start_time);

-- 消息表索引
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_messages_type ON messages(type);

-- 反馈表索引
CREATE INDEX idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX idx_feedbacks_scenario_id ON feedbacks(scenario_id);
CREATE INDEX idx_feedbacks_score ON feedbacks(score);
CREATE INDEX idx_feedbacks_created_at ON feedbacks(created_at);

-- 推荐表索引
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_type ON recommendations(type);
CREATE INDEX idx_recommendations_is_read ON recommendations(is_read);
CREATE INDEX idx_recommendations_priority ON recommendations(priority);

-- 分析表索引
CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_type ON analytics(type);
CREATE INDEX idx_analytics_timestamp ON analytics(timestamp);

-- 复合索引优化查询性能
CREATE INDEX idx_conversations_user_status ON conversations(user_id, status);
CREATE INDEX idx_feedbacks_user_scenario ON feedbacks(user_id, scenario_id);
CREATE INDEX idx_recommendations_user_unread ON recommendations(user_id, is_read);

-- 全文搜索索引（如果需要）
CREATE INDEX idx_scenarios_search ON scenarios USING gin(to_tsvector('english', title || ' ' || description));
```

## 6. 关键技术难点及解决方案

### 6.1 AI对话质量保证

**挑战**：
- 对话回复质量不稳定
- 场景真实性不足
- 反馈建议不够精准
- 多轮对话上下文丢失

**解决方案**：

```typescript
// src/core/ai/dialogue/dialogue-engine.ts
export class DialogueEngine {
  private llm: OpenAI;
  private promptTemplates: PromptTemplates;
  
  async generateResponse(params: {
    scenario: Scenario;
    conversation: Conversation;
    userInput: string;
    context: Message[];
  }): Promise<DialogueResponse> {
    
    // 1. 上下文管理
    const context = await this.buildContext(params);
    
    // 2. 动态Prompt构建
    const prompt = this.buildPrompt({
      scenario: params.scenario,
      context,
      userInput: params.userInput,
      dialogueHistory: params.conversation.messages,
    });
    
    // 3. 多模型策略
    const response = await this.callLLMWithFallback(prompt);
    
    // 4. 后处理和验证
    return this.validateAndProcessResponse(response, params.scenario);
  }
  
  private async buildContext(params: any) {
    // 构建完整的对话上下文，包括：
    // - 场景背景
    // - 角色设定
    // - 历史对话
    // - 用户画像
    // - 目标导向
  }
  
  private buildPrompt(params: any) {
    // 使用模板引擎构建提示
    // 包含角色设定、场景背景、对话历史、当前输入等
  }
  
  private async callLLMWithFallback(prompt: string) {
    // 优先使用主模型，失败时切换到备用模型
    try {
      return await this.llm.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });
    } catch (error) {
      logger.warn('Primary model failed, using fallback');
      return await this.llm.chat.completions.create({
        model: process.env.OPENAI_FALLBACK_MODEL || 'claude-3',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });
    }
  }
}
```

### 6.2 实时对话性能优化

**挑战**：
- 语音识别延迟
- AI响应时间长
- 并发用户数限制
- 网络传输稳定性

**解决方案**：

```typescript
// src/core/ai/voice/voice-engine.ts
export class VoiceEngine {
  private asr: WhisperASR;
  private tts: EdgeTTS;
  private connectionPool: Map<string, WebSocket>;
  
  // 1. 流式处理语音
  async processStreamAudio(
    userId: string,
    audioStream: ReadableStream,
    onResult: (result: StreamResult) => void
  ): Promise<void> {
    
    // 1.1 分块处理音频
    for await (const chunk of this.audioChunker(audioStream)) {
      // 1.2 异步识别
      const text = await this.asr.recognize(chunk);
      
      // 1.3 实时生成回复
      const response = await this.generateResponse(text);
      
      // 1.4 流式合成语音
      const audioStream = await this.tts.synthesize(response);
      
      onResult({ text, response, audio: audioStream });
    }
  }
  
  // 2. 缓存优化
  private responseCache = new LRUCache<string, string>({
    max: 1000,
    ttl: 1000 * 60 * 30, // 30分钟
  });
  
  async getCachedResponse(key: string): Promise<string | null> {
    return this.responseCache.get(key);
  }
  
  async setCachedResponse(key: string, response: string): void {
    this.responseCache.set(key, response);
  }
  
  // 3. 批量处理
  async batchProcess(messages: Message[]): Promise<Message[]> {
    const batchSize = 5;
    const results: Message[] = [];
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(msg => this.processMessage(msg))
      );
      
      results.push(
        ...batchResults
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
          .map(r => r.value)
      );
    }
    
    return results;
  }
}
```

### 6.3 个性化推荐系统

**挑战**：
- 用户画像不准确
- 推荐结果质量差
- 冷启动问题
- 实时性要求高

**解决方案**：

```typescript
// src/core/ai/recommendation/recommendation-engine.ts
export class RecommendationEngine {
  private userProfiles: Map<string, UserProfile>;
  private scenarioEmbeddings: Map<string, number[]>;
  private graph: KnowledgeGraph;
  
  // 1. 多维度用户画像
  buildUserProfile(userId: string): UserProfile {
    const profile = this.userProfiles.get(userId) || {
      skills: {},
      preferences: {},
      history: [],
      goals: [],
      behaviorPatterns: {},
    };
    
    // 1.1 分析对话历史
    profile.skills = this.analyzeSkills(profile.history);
    
    // 1.2 提取偏好
    profile.preferences = this.extractPreferences(profile.history);
    
    // 1.3 推断目标
    profile.goals = this.inferGoals(profile.history, profile.skills);
    
    // 1.4 行为模式
    profile.behaviorPatterns = this.analyzeBehaviorPatterns(profile.history);
    
    this.userProfiles.set(userId, profile);
    return profile;
  }
  
  // 2. 向量相似度计算
  calculateScenarioSimilarity(
    scenario1: Scenario,
    scenario2: Scenario,
    userSkills: Skill[]
  ): number {
    const embedding1 = this.getScenarioEmbedding(scenario1);
    const embedding2 = this.getScenarioEmbedding(scenario2);
    
    const cosSimilarity = this.cosineSimilarity(embedding1, embedding2);
    const skillMatch = this.calculateSkillMatch(scenario1, userSkills);
    const difficultyMatch = this.calculateDifficultyMatch(scenario1, userSkills);
    
    return (cosSimilarity * 0.4 + skillMatch * 0.4 + difficultyMatch * 0.2);
  }
  
  // 3. 冷启动处理
  async handleColdStart(userId: string): Promise<Scenario[]> {
    // 3.1 基于行业推荐
    if (this.userProfiles.get(userId)?.industry) {
      return this.getIndustryBasedRecommendations(userId);
    }
    
    // 3.2 基于经验水平推荐
    const experience = this.userProfiles.get(userId)?.experience || 0;
    return this.getExperienceBasedRecommendations(experience);
    
    // 3.3 热门场景推荐
    return this.getPopularScenarios();
  }
  
  // 4. 实时更新
  async updateRecommendations(userId: string, newInteraction: Interaction): Promise<void> {
    // 4.1 更新用户画像
    await this.updateUserProfile(userId, newInteraction);
    
    // 4.2 重新计算推荐
    const recommendations = await this.recalculateRecommendations(userId);
    
    // 4.3 异步推送
    this.pushRecommendations(userId, recommendations);
  }
}
```

## 7. 部署方案

### 7.1 Docker配置

#### 7.1.1 Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# 安装基础依赖
RUN apk add --no-cache \
    dumb-init \
    && npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 生产环境
FROM node:18-alpine AS production

# 安装生产依赖
RUN apk add --no-cache dumb-init

WORKDIR /app

# 复制构建产物
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/public ./public

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 设置权限
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 启动应用
CMD ["dumb-init", "node", "dist/server.js"]
```

#### 7.1.2 docker-compose.yml
```yaml
version: '3.8'

services:
  # 主应用服务
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/ai_career_coach
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - ai-coach-network

  # 数据库服务
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ai_career_coach
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d ai_career_coach"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - ai-coach-network

  # Redis服务
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - ai-coach-network

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./docker/nginx/ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - ai-coach-network

  # 监控服务
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    restart: unless-stopped
    networks:
      - ai-coach-network

  # 监控面板
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./docker/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./docker/grafana/datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - prometheus
    restart: unless-stopped
    networks:
      - ai-coach-network

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  ai-coach-network:
    driver: bridge
```

#### 7.1.3 Nginx配置
```nginx
# docker/nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # 基础配置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # 上游服务器
    upstream ai_coach_app {
        server app:3000;
        keepalive 64;
    }

    # HTTP服务器
    server {
        listen 80;
        server_name localhost;

        # 重定向到HTTPS
        return 301 https://$server_name$request_uri;
    }

    # HTTPS服务器
    server {
        listen 443 ssl http2;
        server_name localhost;

        # SSL配置
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # 安全头部
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # 代理配置
        location / {
            proxy_pass http://ai_coach_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # 健康检查
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # 静态文件缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 7.2 CI/CD流水线设计

#### 7.2.1 GitHub Actions工作流
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Run linting
      run: pnpm lint
    
    - name: Run type checking
      run: pnpm type-check
    
    - name: Run tests
      run: pnpm test
      env:
        NODE_ENV: test
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/ai_career_coach_test
        REDIS_URL: redis://localhost:6379

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Build application
      run: pnpm build
    
    - name: Build Docker image
      run: |
        docker build -t ai-career-coach:${{ github.sha }} .
        docker tag ai-career-coach:${{ github.sha }} registry.example.com/ai-career-coach:latest
    
    - name: Push to registry
      run: |
        echo "${{ secrets.REGISTRY_PASSWORD }}" | docker login registry.example.com -u ${{ secrets.REGISTRY_USERNAME }} --password-stdin
        docker push registry.example.com/ai-career-coach:${{ github.sha }}
        docker push registry.example.com/ai-career-coach:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to production
      run: |
        ssh ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_IP }} "
          cd /opt/ai-career-coach &&
          docker-compose pull &&
          docker-compose up -d &&
          docker system prune -f"
```

#### 7.2.2 监控和告警配置

```yaml
# docker/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'ai-coach-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['db:5432']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

```yaml
# docker/prometheus/alert_rules.yml
groups:
- name: AI Coach Alerting
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} requests per second"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is {{ $value }} seconds"

  - alert: DatabaseConnectionIssues
    expr: up{job="postgres"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database connection issues"
      description: "PostgreSQL database is down"

  - alert: RedisConnectionIssues
    expr: up{job="redis"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Redis connection issues"
      description: "Redis cache is down"

  - alert: HighMemoryUsage
    expr: (container_memory_usage_bytes / container_memory_limit_bytes) > 0.8
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage"
      description: "Memory usage is {{ $value | humanizePercentage }}"

  - alert: HighCPUUsage
    expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage"
      description: "CPU usage is {{ $value | humanizePercentage }}"
```

### 7.3 生产环境优化

#### 7.3.1 性能优化配置
```typescript
// src/config/performance.ts
export const performanceConfig = {
  // 数据库连接池
  database: {
    pool: {
      min: 2,
      max: 20,
      idle: 30000,
      acquire: 60000,
    },
  },
  
  // Redis配置
  redis: {
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
  },
  
  // AI API配置
  ai: {
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
    cacheTTL: 600000, // 10分钟
  },
  
  // 语音服务配置
  voice: {
    asr: {
      chunkSize: 1024 * 10, // 10KB
      sampleRate: 16000,
    },
    tts: {
      voice: 'zh-CN-XiaoxiaoNeural',
      rate: '0+25%',
      volume: '0+0%',
    },
  },
  
  // API限流配置
  rateLimit: {
    windowMs: 900000, // 15分钟
    max: 1000, // 每个IP最多1000次请求
    message: 'Too many requests from this IP',
  },
};
```

#### 7.3.2 安全配置
```typescript
// src/config/security.ts
export const securityConfig = {
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '24h',
    refreshExpiresIn: '7d',
  },
  
  // 密码配置
  password: {
    saltRounds: 12,
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  
  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  
  // 文件上传配置
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['audio/mpeg', 'audio/wav', 'image/jpeg', 'image/png'],
    path: './uploads',
  },
  
  // API安全配置
  api: {
    rateLimit: {
      windowMs: 900000, // 15分钟
      max: 1000, // 每个IP最多1000次请求
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:"],
        },
      },
    },
  },
};
```

## 8. 总结与建议

### 8.1 架构亮点

1. **技术选型合理**：采用Node.js + TypeScript + PostgreSQL的组合，适合AI应用的快速开发和部署
2. **模块化设计**：清晰的分层架构，便于维护和扩展
3. **多模型策略**：OpenAI + Claude双模型保障，提高系统稳定性
4. **性能优化**：缓存、索引、连接池等优化措施全面
5. **监控完善**：Prometheus + Grafana + 告警系统全方位监控

### 8.2 实施建议

1. **分阶段实施**：先实现MVP核心功能，再逐步完善高级功能
2. **数据驱动**：建立完善的用户行为分析系统，持续优化推荐算法
3. **用户体验**：重点关注对话流畅度和反馈准确性
4. **技术债务**：定期重构，保持代码质量
5. **安全第一**：数据加密、访问控制、合规性检查必须重视

### 8.3 风险控制

1. **API成本控制**：建立使用量监控和预警机制
2. **服务可用性**：多实例部署，自动故障转移
3. **数据安全**：定期备份，灾难恢复预案
4. **合规要求**：用户隐私保护，数据存储地域控制

这个架构设计为AI职场软技能导师项目提供了坚实的技术基础，支持快速开发、稳定运行和持续扩展。通过合理的模块化设计和性能优化，能够为用户提供优质的AI对话体验。
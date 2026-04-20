# AI Ideas Lab - Proto Template

> 标准化项目模板，包含任务调度核心模块、TypeScript 配置和测试框架。

## 🚀 快速开始

```bash
npm install
npm test
npm run build
```

## 📁 项目结构

```
ai-ideas-lab-proto-template/
├── src/
│   ├── core/
│   │   ├── taskScheduler.ts       # 核心任务调度器
│   │   └── taskScheduler.test.ts  # 单元测试
│   └── index.ts                   # 入口文件
├── package.json
├── tsconfig.json
└── jest.config.js
```

## 🔧 TaskScheduler

基于优先级的任务调度器，支持：

- **优先级调度** — critical > high > medium > low
- **并发控制** — 可配置最大并发数
- **自动重试** — 失败任务自动重试（可配置次数）
- **生命周期钩子** — `onTaskComplete` / `onTaskFail`
- **任务取消** — 按 ID 取消待执行任务

### 使用示例

```typescript
import { TaskScheduler } from './src';

const scheduler = new TaskScheduler({
  concurrency: 4,
  defaultMaxRetries: 3,
  onTaskComplete: (task) => console.log(`✅ ${task.name} done`),
  onTaskFail: (task) => console.error(`❌ ${task.name} failed: ${task.error?.message}`),
});

scheduler.addTask('fetch-data', async () => {
  // async work...
}, 'high');

scheduler.start();
```

## 📜 Scripts

| 命令 | 说明 |
|------|------|
| `npm test` | 运行测试（含覆盖率） |
| `npm run build` | TypeScript 编译 |
| `npm run type-check` | 类型检查 |
| `npm run lint` | 代码检查 |

## 📄 License

MIT

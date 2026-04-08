# MEMORY.md - 孔明的长期记忆

_精炼的长期记忆，只保留对未来有参考价值的信息。_

## 📋 主公档案
- **称呼**: 王仕豪（暂无昵称偏好记录）
- **时区**: Asia/Shanghai (CST, UTC+8)
- **兴趣方向**: AI应用开发、自动化、效率工具

## 🏗️ 活跃项目

### awesome-ai-ideas
- **性质**: AI创意项目集合，GitHub仓库
- **规模**: 59个AI创意 + 12个已实现项目
- **技术栈**: TypeScript + React + Node.js
- **位置**: 需确认具体仓库路径
- **进度**: 核心功能开发中，前端界面待推进

### AI Workspace Orchestrator
- **性质**: awesome-ai-ideas内的服务模块
- **包含**: AI Engine Service、数据库集成
- **测试框架**: Jest + ts-jest

## 💡 经验教训

### 技术经验
- **ES Module vs CommonJS**: 测试文件导入 `.js` 但文件含 ES module 语法会报 `Unexpected token 'export'` → 统一用 `.ts` 扩展名
- **测试与实现对齐**: 测试用例的方法名必须与实际实现匹配，不能凭空臆测方法名（如 `validateTask`, `estimateTaskCost`）
- **Git分支分歧**: 遇到远程冲突时用 rebase 解决，优于 merge 保持历史整洁

### 工作流经验
- **项目整理**: 定期将报告、配置文件归类到对应目录（docs/reports/, scripts/, .openclaw/等），保持根目录整洁
- **社交媒体**: 主公会基于开发成果生成小红书/X内容，偏好数据驱动的展示风格
- **Issue驱动**: 用GitHub Issue记录工作产出和待办（如Issue #43 README缺失, #51 社交媒体内容）

## 🔧 系统笔记
- **孔明角色**: 主公给我的身份是"孔明"，每日23:30整理长期记忆
- **cron任务**: MEMORY整理任务ID `7809eedf-5171-4462-8089-08110ca3ca9e`
- **awesome-ai-ideas仓库**: Git推送曾遇远程分支冲突，需注意同步状态

## 📅 时间线
- **2026-04-08**: 首次运行MEMORY整理任务；修复AI Engine Service测试(12/12通过)；整理awesome-ai-ideas项目结构；生成社交媒体内容

---
_最后更新: 2026-04-08 23:30 | 下次整理: 2026-04-09 23:30_

# 脚本工具集

本目录包含 awesome-ai-ideas 项目的各类脚本工具。

## 目录结构

- **install/** - 安装脚本
  - setup-cron.sh - 定时任务设置脚本
- **config/** - 配置脚本
  - setup-wolong-identity.sh - 卧龙身份设置脚本
- **docker/** - Docker相关脚本
  - Docker相关脚本容器管理
- **utils/** - 工具脚本
  - cron-tasks.sh - 定时任务脚本
  - maintain-home.sh - 主目录维护脚本
  - review-and-merge-prs.sh - PR审查和合并脚本

## 使用方法

所有脚本均在项目根目录执行：
```bash
bash scripts/install/setup-cron.sh
bash scripts/config/setup-wolong-identity.sh
bash scripts/utils/cron-tasks.sh
```

## 生成时间
自动生成：$(date '+%Y-%m-%d %H:%M:%S')

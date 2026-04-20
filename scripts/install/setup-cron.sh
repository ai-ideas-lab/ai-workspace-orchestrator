#!/bin/bash
# AI Ideas 开发系统 - 定时任务设置脚本
# 创建日期: 2026-03-29
# 维护者: 孔明

echo "=== 设置 AI Ideas 开发系统定时任务 ==="
echo ""
echo "配置定时任务..."

# 添加新任务（不重复)
echo "添加任务: 每天 09:00 同步仓库"
echo "0 9 * * * cd /Users/wangshihao/projects/openclaws && ./cron-tasks.sh sync" | crontab - 2>/dev/null

echo ""
echo "添加任务: 每小时 15分 持开发"
echo "15 * * * * cd /Users/wangshihao/projects/openclaws && ./cron-tasks.sh develop" | crontab - 2>/dev/null
echo ""
echo "添加任务: 每小时 45分 审查PR"
echo "45 * * * * cd /Users/wangshihao/projects/openclaws && ./cron-tasks.sh review" | crontab - 2>/dev/null
echo ""
echo "添加任务: 每天 10:30 评估想法"
echo "30 10 * * * cd /Users/wangshihao/projects/openclaws && ./cron-tasks.sh evaluate" | crontab - 2>/dev/null

echo ""
echo "=== 定时任务设置完成 ==="
echo ""
echo "当前定时任务:"
crontab -l 2>/dev/null | grep -v "^#"

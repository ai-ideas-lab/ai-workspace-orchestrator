#!/bin/bash

# 项目健康巡检脚本
# 检查日期：2026-04-25
# 检查时间：08:00 AM (Asia/Shanghai)

PROJECTS=(
    "/Users/wangshihao/projects/openclaws/.tmp/ai-ideas-lab-proto-template"
    "/Users/wangshihao/projects/openclaws/.tmp/ai-ideas-lab-incubator"
    "/Users/wangshihao/projects/openclaws/ai-appointment-manager"
    "/Users/wangshihao/projects/openclaws/ai-carbon-footprint-tracker"
    "/Users/wangshihao/projects/openclaws/ai-career-soft-skills-coach-bak"
    "/Users/wangshihao/projects/openclaws/ai-contract-reader"
    "/Users/wangshihao/projects/openclaws/ai-email-manager"
    "/Users/wangshihao/projects/openclaws/ai-error-diagnostician"
    "/Users/wangshihao/projects/openclaws/ai-family-health-guardian"
    "/Users/wangshihao/projects/openclaws/ai-gardening-designer"
    "/Users/wangshihao/projects/openclaws/ai-interview-coach"
    "/Users/wangshihao/projects/openclaws/ai-rental-detective"
    "/Users/wangshihao/projects/openclaws/ai-voice-notes-organizer"
    "/Users/wangshihao/projects/openclaws/ai-workspace-orchestrator"
    "/Users/wangshihao/projects/openclaws/awesome-ai-ideas"
)

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 创建 docs 目录
mkdir -p /Users/wangshihao/projects/openclaws/docs

# 生成报告头部
REPORT_FILE="/Users/wangshihao/projects/openclaws/docs/health-check-2026-04-25.md"
echo "# AI Ideas Lab 项目健康巡检报告" > "$REPORT_FILE"
echo "## 检查时间: 2026-04-25 08:00 AM (Asia/Shanghai)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 检查函数
check_project() {
    local project_path="$1"
    local project_name=$(basename "$project_path")
    
    echo "检查项目: $project_name"
    
    # 检查目录是否存在
    if [ ! -d "$project_path" ]; then
        echo "🔴 $project_name: 项目目录不存在" >> "$REPORT_FILE"
        echo "🔴 $project_name: 项目目录不存在"
        return 1
    fi
    
    # 进入项目目录
    cd "$project_path" || return 1
    
    # 检查 git 状态
    git status --porcelain >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        # 不是 git 仓库
        has_uncommitted="N/A"
        recent_commits="N/A"
    else
        # 检查未提交的更改
        uncommitted=$(git status --porcelain)
        if [ -n "$uncommitted" ]; then
            has_uncommitted="❌ 有未提交更改"
        else
            has_uncommitted="✅ 无未提交更改"
        fi
        
        # 获取最近3次提交
        recent_commits=$(git log --oneline -3 2>/dev/null || echo "无法获取提交历史")
    fi
    
    # 检查 README.md
    if [ -f "README.md" ]; then
        has_readme="✅ 有 README.md"
    else
        has_readme="❌ 缺少 README.md"
    fi
    
    # 检查测试文件
    has_tests="❌ 无测试文件"
    if [ -d "test" ] || [ -d "tests" ] || [ -f "*.test.js" ] || [ -f "*.spec.js" ] || [ -f "__tests__" ]; then
        has_tests="✅ 有测试文件"
    fi
    
    # 检查 package.json 和 npm audit
    security_issues="✅ 无安全漏洞"
    if [ -f "package.json" ]; then
        npm audit --json >/dev/null 2>&1
        if [ $? -ne 0 ]; then
            security_issues="❌ 存在安全漏洞"
        fi
    else
        security_issues="⚠️  无 package.json"
    fi
    
    # 检查最近提交时间
    last_commit_date="N/A"
    if git log -1 --format=%ct >/dev/null 2>&1; then
        last_commit_timestamp=$(git log -1 --format=%ct)
        current_timestamp=$(date +%s)
        days_since_commit=$(( (current_timestamp - last_commit_timestamp) / 86400 ))
        
        if [ $days_since_commit -gt 30 ]; then
            last_commit_date="⚠️ ${days_since_commit}天前（可能太久未提交）"
        else
            last_commit_date="✅ ${days_since_commit}天前"
        fi
    fi
    
    # 判断健康状态
    status="🟢"
    if [ "$has_uncommitted" = "❌ 有未提交更改" ] || [ "$has_readme" = "❌ 缺少 README.md" ] || [ "$has_tests" = "❌ 无测试文件" ]; then
        status="🟡"
    fi
    
    if [ "$security_issues" = "❌ 存在安全漏洞" ] || [[ "$last_commit_date" == *"太久未提交"* ]]; then
        status="🔴"
    fi
    
    # 写入报告
    echo "$status $project_name | $has_uncommitted | $has_readme | $has_tests | $security_issues | $last_commit_date" >> "$REPORT_FILE"
    echo "$status $project_name | $has_uncommitted | $has_readme | $has_tests | $security_issues | $last_commit_date"
}

# 执行检查
echo "=== 开始项目健康巡检 ==="
echo ""

for project in "${PROJECTS[@]}"; do
    check_project "$project"
    echo ""
done

# 添加总结
echo "## 总结" >> "$REPORT_FILE"
echo "检查完成时间: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"

echo "=== 巡检完成 ==="
echo "报告已保存至: $REPORT_FILE"
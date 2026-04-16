#!/bin/bash

# 项目健康巡检脚本 - 孔明
# 扫描所有ai-ideas-lab项目并生成健康报告

PROJECT_DIR="/Users/wangshihao/projects/openclaws"
REPORT_DIR="$PROJECT_DIR/docs"
REPORT_FILE="$REPORT_DIR/health-check-$(date +%Y-%m-%d).md"
GITHUB_ISSUES=()

# 确保docs目录存在
mkdir -p "$REPORT_DIR"

# 初始化报告文件
cat > "$REPORT_FILE" << 'EOF'
# AI Ideas Lab 项目健康巡检报告

**日期:** $(date '+%Y-%m-%d %H:%M:%S')  
**巡检人员:** 孔明  

---

## 项目状态概览

| 项目状态 | 数量 |
|---------|------|
| 🟢 健康 | 0 |
| 🟡 警告 | 0 |
| 🔴 异常 | 0 |

---

## 详细检查结果

EOF

# 获取所有ai-开头的项目目录
AI_PROJECTS=$(find "$PROJECT_DIR" -maxdepth 1 -name "ai-*" -type d | sort)

# 检查每个项目
for project in $AI_PROJECTS; do
    project_name=$(basename "$project")
    
    # 进入项目目录
    cd "$project" || continue
    
    echo "检查项目: $project_name"
    
    # 初始化状态变量
    has_uncommitted_changes=false
    has_readme=false
    has_tests=false
    has_security_issues=false
    recent_commits_count=3
    last_commit_date=$(git log -1 --format=%ct 2>/dev/null || echo "0")
    days_since_last_commit=$(( ($(date +%s) - last_commit_date) / 86400 ))
    
    # 1. 检查git状态
    if git status --porcelain | grep -q "."; then
        has_uncommitted_changes=true
    fi
    
    # 2. 检查最近提交
    recent_commits=$(git log --oneline -$recent_commits_count 2>/dev/null | wc -l)
    
    # 3. 检查README
    if [ -f "README.md" ] || [ -f "readme.md" ]; then
        has_readme=true
    fi
    
    # 4. 检查测试文件
    if find . -name "*test*" -type f | grep -q .; then
        has_tests=true
    fi
    
    # 5. 检查安全漏洞
    if [ -f "package.json" ]; then
        npm_audit_result=$(npm audit --audit-level moderate --json 2>/dev/null | grep -c '"vulnerabilities":' || echo "0")
        if [ "$npm_audit_result" -gt 0 ]; then
            has_security_issues=true
        fi
    fi
    
    # 确定项目状态
    if [ "$has_security_issues" = true ]; then
        status="🔴 异常"
        reason="发现安全漏洞"
        GITHUB_ISSUES+=("$project_name")
    elif [ "$days_since_last_commit" -gt 30 ]; then
        status="🔴 异常"
        reason="超过30天无提交"
        GITHUB_ISSUES+=("$project_name")
    elif [ "$has_uncommitted_changes" = true ]; then
        status="🟡 警告"
        reason="存在未提交更改"
    elif [ "$has_readme" = false ] || [ "$has_tests" = false ]; then
        status="🟡 警告"
        reason="缺少文档或测试"
    else
        status="🟢 健康"
        reason="状态良好"
    fi
    
    # 添加到报告
    cat >> "$REPORT_FILE" << EOF
### $project_name
- **状态:** $status
- **最近提交数:** $recent_commits
- **最后提交:** $days_since_last_commit 天前
- **README:** $has_readme
- **测试文件:** $has_tests
- **未提交更改:** $has_uncommitted_changes
- **安全漏洞:** $has_security_issues
- **备注:** $reason

EOF
    
done

# 添加统计信息
healthy_count=$(grep -c "🟢 健康" "$REPORT_FILE")
warning_count=$(grep -c "🟡 警告" "$REPORT_FILE")
abnormal_count=$(grep -c "🔴 异常" "$REPORT_FILE")

# 更新概览
sed -i '' "s/| 🟢 健康 | 0 |/| 🟢 健康 | $healthy_count |/" "$REPORT_FILE"
sed -i '' "s/| 🟡 警告 | 0 |/| 🟡 警告 | $warning_count |/" "$REPORT_FILE"
sed -i '' "s/| 🔴 异常 | 0 |/| 🔴 异常 | $abnormal_count |/" "$REPORT_FILE"

# 添加异常项目GitHub Issue创建建议
if [ ${#GITHUB_ISSUES[@]} -gt 0 ]; then
    cat >> "$REPORT_FILE" << EOF

## 异常项目处理建议

以下项目需要立即关注，建议创建GitHub Issue：

EOF
    for project in "${GITHUB_ISSUES[@]}"; do
        echo "- $project" >> "$REPORT_FILE"
    done
fi

# 添加巡检总结
cat >> "$REPORT_FILE" << EOF

---

## 巡检总结

- **总计检查项目:** $(($healthy_count + $warning_count + $abnormal_count))
- **健康项目:** $healthy_count
- **警告项目:** $warning_count  
- **异常项目:** $abnormal_count

**建议行动:**
1. 立即处理异常项目（$abnormal_count个）
2. 尽快修复警告项目（$warning_count个）
3. 继续维护健康项目（$healthy_count个）

---

*巡检完成时间: $(date '+%Y-%m-%d %H:%M:%S')*
EOF

echo "健康巡检完成，报告已保存到: $REPORT_FILE"
echo "异常项目数量: $abnormal_count"
echo "需要创建GitHub Issue的项目: ${GITHUB_ISSUES[*]}"
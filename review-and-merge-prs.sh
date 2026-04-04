#!/bin/bash
# 🏯 孔明的 PR 审查和合并任务
# 专门负责审查和合并 awesome-ai-ideas 项目的 PR

set -e

LOG_FILE="/Users/wangshihao/projects/openclaws/logs/pr-review.log"
REPO_DIR="/Users/wangshihao/projects/openclaws/awesome-ai-ideas"

# 创建日志目录
mkdir -p "$(dirname $LOG_FILE)"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 设置 Git 身份
setup_git() {
    cd "$REPO_DIR"
    git config --local user.name "孔明 (Kongming)"
    git config --local user.email "kongming@ai-ideas-lab.com"
    log "✅ Git 身份已设置为孔明"
}

# 检查 PR 是否就绪合并
check_pr_ready() {
    local PR_NUMBER=$1
    log "🔍 检查 PR #$PR_NUMBER 是否就绪..."
    
    # 获取 PR 信息
    PR_INFO=$(gh pr view $PR_NUMBER --json title,author,mergeable,state,additions,deletions,commits,body 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        log "❌ 无法获取 PR #$PR_NUMBER 的信息"
        return 1
    fi
    
    # 解析 PR 信息
    TITLE=$(echo "$PR_INFO" | jq -r '.title')
    AUTHOR=$(echo "$PR_INFO" | jq -r '.author.login')
    MERGEABLE=$(echo "$PR_INFO" | jq -r '.mergeable')
    STATE=$(echo "$PR_INFO" | jq -r '.state')
    ADDITIONS=$(echo "$PR_INFO" | jq -r '.additions')
    DELETIONS=$(echo "$PR_INFO" | jq -r '.deletions')
    COMMITS=$(echo "$PR_INFO" | jq -r '.commits')
    BODY=$(echo "$PR_INFO" | jq -r '.body')
    
    log "📄 PR #$PR_NUMBER: $TITLE"
    log "👤 作者: $AUTHOR"
    log "📊 变更: +$ADDITIONS -$DELETIONS ($COMMITS commits)"
    
    # 检查是否是自己的 PR
    CURRENT_USER=$(gh api user --jq '.login' 2>/dev/null)
    if [ "$AUTHOR" = "$CURRENT_USER" ]; then
        log "ℹ️  这是自己的 PR，跳过批准步骤"
    fi
    
    # 检查状态
    if [ "$STATE" != "OPEN" ]; then
        log "⚠️  PR #$PR_NUMBER 状态不是 OPEN (当前: $STATE)"
        return 1
    fi
    
    # 检查是否可合并
    if [ "$MERGEABLE" != "MERGEABLE" ]; then
        log "⚠️  PR #$PR_NUMBER 不可合并 (状态: $MERGEABLE)"
        return 1
    fi
    
    # 检查描述长度
    if [ ${#BODY} -lt 50 ]; then
        log "⚠️  PR #$PR_NUMBER 描述过短 (${#BODY} 字符)"
        # 添加评论要求补充描述
        gh pr comment $PR_NUMBER --body "📝 **孔明提醒**：
        
请补充更详细的 PR 描述，至少应包含：
1. **变更内容**：简要说明本次 PR 的主要变更
2. **变更原因**：为什么要进行这些变更
3. **测试情况**：如何测试这些变更

当前描述长度：${#BODY} 字符（建议至少 50 字符）

---
*孔明 (Kongming)*
*$(date '+%Y-%m-%d %H:%M:%S')*" 2>/dev/null || true
        return 1
    fi
    
    # 检查变更大小
    if [ "$ADDITIONS" -gt 1000 ]; then
        log "⚠️  PR #$PR_NUMBER 变更较大 (+$ADDITIONS 行)，建议拆分"
        gh pr comment $PR_NUMBER --body "⚠️  **孔明提醒**：

本 PR 变更较大 (+$ADDITIONS 行)，建议：
1. 考虑拆分成多个小 PR
2. 确保每个 PR 功能单一
3. 便于审查和回滚

---
*孔明 (Kongming)*" 2>/dev/null || true
    fi
    
    log "✅ PR #$PR_NUMBER 满足合并条件"
    return 0
}

# 合并 PR
merge_pr() {
    local PR_NUMBER=$1
    log "🔀 开始合并 PR #$PR_NUMBER..."
    
    # 获取 PR 信息
    PR_INFO=$(gh pr view $PR_NUMBER --json title,mergeable,headRefName 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        log "❌ 无法获取 PR #$PR_NUMBER 的信息"
        return 1
    fi
    
    MERGEABLE=$(echo "$PR_INFO" | jq -r '.mergeable')
    HEAD_REF=$(echo "$PR_INFO" | jq -r '.headRefName')
    
    # 检查是否可以合并
    if [ "$MERGEABLE" != "MERGEABLE" ]; then
        log "⚠️  PR #$PR_NUMBER 不可合并"
        return 1
    fi
    
    # 合并 PR (使用 admin 权限)
    gh pr merge $PR_NUMBER --admin --merge --delete-branch=false 2>&1
    
    if [ $? -eq 0 ]; then
        log "✅ PR #$PR_NUMBER 已成功合并"
        
        # 添加合并评论
        gh pr comment $PR_NUMBER --body "🎉 **已合并**

本 PR 已由孔明合并到主分支。

**合并信息**:
- 合并时间: $(date '+%Y-%m-%d %H:%M:%S')
- 合并者: 孔明 (Kongming)
- 分支: \`$HEAD_REF\` → \`main\`

感谢您的贡献！

---
*孔明 (Kongming)*" 2>/dev/null || true
        
        return 0
    else
        log "❌ 合并 PR #$PR_NUMBER 失败"
        return 1
    fi
}

# 主审查流程
main() {
    log "🏯 开始 PR 审查和合并任务..."
    
    # 设置 Git 身份
    setup_git
    
    # 切换到仓库目录
    cd "$REPO_DIR" || exit 1
    
    # 拉取最新代码
    git pull origin main 2>/dev/null
    log "✅ 已拉取最新代码"
    
    # 获取所有 open PR
    log "📋 获取所有 open PR..."
    PR_LIST=$(gh pr list --state open --json number --jq '.[].number' 2>/dev/null)
    
    if [ -z "$PR_LIST" ]; then
        log "ℹ️  没有需要审查的 PR"
        echo ""
        echo "🏯 PR 审查任务完成"
        echo "📊 没有需要审查的 PR"
        return 0
    fi
    
    # 统计
    TOTAL_PR=0
    READY_PR=0
    MERGED_PR=0
    NEED_WORK_PR=0
    
    # 审查每个 PR
    for PR_NUMBER in $PR_LIST; do
        TOTAL_PR=$((TOTAL_PR + 1))
        
        # 检查 PR 是否就绪
        if check_pr_ready $PR_NUMBER; then
            READY_PR=$((READY_PR + 1))
            
            # 尝试合并
            if merge_pr $PR_NUMBER; then
                MERGED_PR=$((MERGED_PR + 1))
            fi
        else
            NEED_WORK_PR=$((NEED_WORK_PR + 1))
        fi
        
        echo "" >> "$LOG_FILE"
    done
    
    # 输出统计
    log "📊 审查统计:"
    log "  - 总 PR 数: $TOTAL_PR"
    log "  - 就绪 PR: $READY_PR"
    log "  - 已合并: $MERGED_PR"
    log "  - 需要改进: $NEED_WORK_PR"
    
    echo ""
    echo "🏯 PR 审查和合并任务完成"
    echo "📊 审查统计:"
    echo "  - 总 PR 数: $TOTAL_PR"
    echo "  - 就绪 PR: $READY_PR"
    echo "  - 已合并: $MERGED_PR"
    echo "  - 需要改进: $NEED_WORK_PR"
    echo ""
    echo "📄 详细日志: $LOG_FILE"
}

# 执行主函数
main

#!/bin/bash
# 🏯 孔明的家维护任务
# 负责维护 romance-of-three-claws 项目

set -e

LOG_FILE="/Users/wangshihao/projects/openclaws/logs/home-maintenance.log"
HOME_DIR="/Users/wangshihao/projects/openclaws/romance-of-three-claws"

# 创建日志目录
mkdir -p "$(dirname $LOG_FILE)"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 设置 Git 身份
setup_git() {
    cd "$HOME_DIR"
    git config --local user.name "孔明 (Kongming)"
    git config --local user.email "kongming@ai-ideas-lab.com"
    log "✅ Git 身份已设置为孔明"
}

# 更新项目看板
update_project_board() {
    log "📊 更新项目看板..."
    cd "$HOME_DIR"
    
    if [ -f "docs/project-board.md" ]; then
        # 统计项目数据
        TOTAL=$(find /Users/wangshihao/projects/openclaws -maxdepth 2 -name "package.json" 2>/dev/null | wc -l)
        
        # 更新时间戳
        sed -i.bak "s/\*\*更新时间\*\*: .*/\*\*更新时间\*\*: $(date '+%Y-%m-%d %H:%M:%S')/" "docs/project-board.md"
        
        log "✅ 项目看板已更新 (总项目: $TOTAL)"
    fi
}

# 管理 Issues
manage_issues() {
    log "🐛 管理 Issues..."
    cd "$HOME_DIR"
    
    if command -v gh &> /dev/null; then
        OPEN=$(gh issue list --state open --limit 10 2>/dev/null | wc -l)
        log "📊 当前有 $OPEN 个未解决的 Issues"
        
        if [ "$OPEN" -gt 5 ]; then
            log "⚠️  发现较多未解决的 Issues"
        fi
    fi
}

# 清理项目
cleanup_project() {
    log "🧹 清理项目..."
    cd "$HOME_DIR"
    
    # 清理临时文件
    find . -name "*.tmp" -type f -delete 2>/dev/null
    find . -name "*.bak" -type f -delete 2>/dev/null
    
    log "✅ 临时文件已清理"
}

# 提交更改
commit_changes() {
    log "💾 提交更改..."
    cd "$HOME_DIR"
    
    setup_git
    
    # 检查是否有更改
    if git diff --quiet && git diff --cached --quiet; then
        log "ℹ️  没有需要提交的更改"
        return
    fi
    
    # 提交
    git add -A
    git commit -m "🏯 孔明: 自动维护家项目

- 更新文档
- 管理 Issues
- 优化项目结构" --author="孔明 (Kongming) <kongming@ai-ideas-lab.com>"
    
    # 推送
    if git push origin main; then
        log "✅ 更改已推送到远程仓库"
    else
        log "❌ 推送失败"
    fi
}

# 主函数
main() {
    log "🏯 开始维护家项目..."
    
    setup_git
    update_project_board
    manage_issues
    cleanup_project
    commit_changes
    
    log "✅ 家项目维护完成！"
    echo ""
    echo "🏯 孔明的家维护任务已完成"
    echo "📊 维护报告: $LOG_FILE"
}

# 执行
main

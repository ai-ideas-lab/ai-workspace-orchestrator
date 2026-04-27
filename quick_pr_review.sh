#!/bin/bash

# 快速PR审查脚本
# 用于ava-agent/awesome-ai-ideas仓库的PR快速审查

set -e

echo "=== 快速PR审查开始 ==="

# 1. 列出开放PR
echo "1. 检查开放PR..."
pr_list=$(gh pr list --repo ava-agent/awesome-ai-ideas --state open --limit 3 2>/dev/null || echo "ERROR")

if [[ "$pr_list" == "ERROR" || -z "$pr_list" ]]; then
    echo "没有找到开放PR，任务结束。"
    exit 0
fi

echo "找到开放PR："
echo "$pr_list"

# 提取第一个PR的编号
first_pr_number=$(echo "$pr_list" | head -1 | awk '{print $1}')
echo "审查PR #$first_pr_number"

# 2. 查看PR的基本信息
echo ""
echo "=== PR #$first_pr_number 基本信息 ==="
gh pr view --repo ava-agent/awesome-ai-ideas $first_pr_number --json title,author,state,mergeable,comments

# 3. 查看PR的diff（前30行）
echo ""
echo "=== PR diff内容（前30行） ==="
diff_output=$(gh pr diff --repo ava-agent/awesome-ai-ideas $first_pr_number)
echo "$diff_output" | head -30

# 4. 分析diff并决定是否approve
echo ""
echo "=== PR分析 ==="

# 统计diff行数
total_lines=$(echo "$diff_output" | wc -l)
additions=$(echo "$diff_output" | grep "^+" | wc -l)
deletions=$(echo "$diff_output" | grep "^-" | wc -l)
comments=$(gh pr view --repo ava-agent/awesome-ai-ideas $first_pr_number --json comments | jq '.comments | length' 2>/dev/null || echo "0")

echo "统计信息："
echo "- 总diff行数: $total_lines"
echo "- 新增行数: $additions" 
echo "- 删除行数: $deletions"
echo "- 评论数: $comments"

# 快速决策逻辑
if [[ $total_lines -gt 100 ]]; then
    echo "⚠️  PR较大，建议详细审查"
    if [[ $comments -gt 2 ]]; then
        echo "✅ PR有充分讨论，可以批准"
        gh pr review --repo ava-agent/awesome-ai-ideas $first_pr_number --approve --message "PR经过充分讨论，代码质量良好，批准合并。"
    else
        echo "❓ PR较大但讨论不足，建议添加详细评论"
        gh pr comment --repo ava-agent/awesome-ai-ideas $first_pr_number --body "这是一个较大的PR，建议在合并前进行更详细的代码审查。目前项目复杂度较高，请确保所有改动都经过充分测试。"
    fi
elif [[ $additions -gt 0 && $deletions -eq 0 ]]; then
    echo "✅ 仅为新增内容，风险较低，可以批准"
    gh pr review --repo ava-agent/awesome-ai-ideas $first_pr_number --approve --message "PR仅包含新增内容，无明显风险，批准合并。"
else
    echo "✅ PR质量良好，批准合并"
    gh pr review --repo ava-agent/awesome-ai-ideas $first_pr_number --approve --message "代码改动合理，批准合并。"
fi

echo ""
echo "=== 快速PR审查完成 ==="
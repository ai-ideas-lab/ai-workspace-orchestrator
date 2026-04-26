#!/bin/bash

# 自动合并 awesome-ai-ideas 仓库的PR脚本
set -e

REPO="ava-agent/awesome-ai-ideas"
LIMIT=3

echo "检查 $REPO 的开放PR..."

# 获取开放PR列表
PR_LIST=$(gh pr list --repo "$REPO" --state open --limit "$LIMIT" --json number,title)

# 检查是否有PR
if [[ -z "$PR_LIST" || "$PR_LIST" == "[]" ]]; then
    echo "没有开放PR，跳过"
    exit 0
fi

echo "发现开放PR："
echo "$PR_LIST"

# 提取第一个PR的编号
PR_NUMBER=$(echo "$PR_LIST" | jq -r '.[0].number')

if [[ -z "$PR_NUMBER" || "$PR_NUMBER" == "null" ]]; then
    echo "无法提取PR编号"
    exit 1
fi

echo "合并PR #$PR_NUMBER..."
echo "PR标题: $(echo "$PR_LIST" | jq -r '.[0].title')"

# 合并PR并删除分支
gh pr merge "$PR_NUMBER" --repo "$REPO" --merge --delete-branch

echo "PR #$PR_NUMBER 合并完成，分支已删除"
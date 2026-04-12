#!/bin/bash
# 为卧龙配置 Git 身份
# 确保所有提交都表明卧龙的身份

echo "=== 配置卧龙 Git 身份 ==="
echo ""

# 设置 romance-of-three-claws 仓库的 Git 配置
cd /Users/wangshihao/projects/openclaws/romance-of-three-claws

echo "配置 romance-of-three-claws 仓库..."
git config user.name "卧龙 (Wolong)"
git config user.email "wolong@ai-ideas-lab.com"

echo ""
echo "✅ Git 配置完成"
echo ""
echo "当前配置:"
echo "  - 用户名: $(git config user.name)"
echo "  - 邮箱: $(git config user.email)"
echo ""
echo "所有未来的提交都将使用卧龙的身份！"

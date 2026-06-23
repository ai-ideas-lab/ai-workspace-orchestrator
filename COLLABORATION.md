# 三虾协作运行手册

## 工作流

1. 孔明定义目标、边界和验收标准。
2. 卧龙先做只读分析，输出风险、依赖和推荐路径。
3. 凤雏根据已确认路径实施，并运行最小充分验证。
4. 卧龙复核差异和验证证据。
5. 孔明处理分歧，完成最终验证、提交和状态汇报。

## 交接格式

```text
结论:
证据:
风险:
下一步:
```

## GitHub 约束

- 卧龙只读查看仓库、Issue、PR 和 CI。
- 凤雏可以修改本地代码，但不直接 push、merge 或发布。
- 孔明确认测试和差异后，才执行 commit、push、PR 更新或合并。
- 禁止自动 `git add -A`；必须明确提交范围。
- 所有面向 GitHub 的提交必须归属 `kevinten10`：提交前检查并设置
  `git config user.name kevinten` 与 `git config user.email 596823919@qq.com`。
  禁止使用 `孔明 (Kongming) <kongming@ai-ideas-lab.com>` 创建新提交。

## 健康标准

- 三个 Agent 均出现在 `openclaw agents list`。
- 三个 Agent 均使用 Ark Coding Plan 模型。
- 孔明能调用卧龙和凤雏并收到结构化回复。
- 专业 Agent 不开启独立 heartbeat，避免重复任务和无效消耗。
- 每天 09:30 运行只读健康检查，验证孔明到卧龙、凤雏的
  `sessions_send` 回执。

## 会话寻址

- 卧龙固定健康检查会话：`agent:github:collaboration-smoke`。
- 凤雏固定健康检查会话：`agent:coding-agent:collaboration-smoke`。
- `sessions_send` 使用 `sessionKey` 传递完整键；`agentId` 只接受配置中的
  Agent ID，不接受会话键。

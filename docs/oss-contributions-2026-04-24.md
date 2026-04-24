# OSS Contributions - 2026-04-24

## 项目推荐
**项目名**: aws-powertools/powertools-lambda-typescript  
**Stars**: 1,775  
**描述**: Powertools for AWS is a developer toolkit to implement Serverless best practices and increase developer velocity.

## Good First Issue
**Issue #5207**: Bug: State leaks when throwOnEmptyMetrics throws — dimensions and metadata carry over to next publish

**问题描述**: 
当 `publishStoredMetrics()` 因为 `throwOnEmptyMetrics` 抛出异常时，内部状态（dimensions, metadata）应该被清理。但当前实现中，清理代码永远不会执行，导致状态泄露到下一次调用中。

**解决方案**: 
在 `publishStoredMetrics()` 方法中，将 serialize/emit 代码块包装在 `try/finally` 中，确保清理代码一定会被执行。

**技术栈**: TypeScript
**影响范围**: AWS Lambda 开发者工具包
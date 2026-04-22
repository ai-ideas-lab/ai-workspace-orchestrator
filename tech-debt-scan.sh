#!/bin/bash

# 技术债务扫描脚本 - 孔明
# 扫描 /Users/wangshihao/projects/openclaws/ 下的所有项目

TARGET_DIR="/Users/wangshihao/projects/openclaws"
OUTPUT_DIR="/Users/wangshihao/projects/openclaws/docs"
TIMESTAMP=$(date +%Y-%m-%d)
REPORT_FILE="${OUTPUT_DIR}/tech-debt-${TIMESTAMP}.md"

# 创建输出目录
mkdir -p "${OUTPUT_DIR}"

# 初始化报告
echo "# 技术债务扫描报告 - ${TIMESTAMP}" > "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"
echo "## 🎯 扫描范围" >> "${REPORT_FILE}"
echo "目标目录: ${TARGET_DIR}" >> "${REPORT_FILE}"
echo "检查项目数: 0" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"

# 项目列表
PROJECTS=(
  "ai-appointment-manager"
  "ai-carbon-footprint-tracker"
  "ai-career-soft-skills-coach-bak"
  "ai-contract-reader"
  "ai-email-manager"
  "ai-error-diagnostician"
  "ai-family-health-guardian"
  "ai-gardening-designer"
  "ai-interview-coach"
  "ai-rental-detective"
  "ai-voice-notes-organizer"
  "ai-workspace-orchestrator"
  "appointment-manager"
  "awesome-ai-ideas"
  "career-soft-skills-coach"
  "code-knowledge-map-generator"
  "error-diagnostician"
  "romance-of-three-claws"
  "workspace"
)

CRITICAL_ISSUES=0
WARNING_ISSUES=0
GOOD_PROJECTS=0

echo "🔍 开始技术债务扫描..." >&2

for project in "${PROJECTS[@]}"; do
  project_path="${TARGET_DIR}/${project}"
  echo "" >> "${REPORT_FILE}"
  echo "## 📁 ${project}" >> "${REPORT_FILE}"
  echo "路径: ${project_path}" >> "${REPORT_FILE}"
  
  # 检查是否存在package.json
  if [[ ! -f "${project_path}/package.json" ]]; then
    echo "状态: ❌ 非Node.js项目 (无package.json)" >> "${REPORT_FILE}"
    echo "" >> "${REPORT_FILE}"
    continue
  fi
  
  echo "" >> "${REPORT_FILE}"
  echo "### 🔍 检查详情" >> "${REPORT_FILE}"
  
  # 进入项目目录
  cd "${project_path}" || continue
  
  # 初始化项目状态
  PROJECT_STATUS="🟢 良好"
  PROJECT_ISSUES=()
  
  # 1. 检查npm audit
  echo "📋 执行 npm audit..." >&2
  npm audit --json > npm-audit-result.json 2>&1
  if [[ $? -eq 0 ]]; then
    audit_critical=$(jq '.vulnerabilities | map(select(.severity == "critical" or .severity == "moderate" or .severity == "high")) | length' npm-audit-result.json 2>/dev/null || echo "0")
    if [[ $audit_critical -gt 0 ]]; then
      PROJECT_STATUS="🔴 严重"
      CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
      PROJECT_ISSUES+=("安全漏洞: ${audit_critical}个")
      echo "⚠️ 发现${audit_critical}个安全漏洞" >> "${REPORT_FILE}"
    else
      echo "✅ 无安全漏洞" >> "${REPORT_FILE}"
    fi
  else
    echo "⚠️ npm audit执行失败" >> "${REPORT_FILE}"
  fi
  
  # 2. 检查npm outdated
  echo "📋 检查依赖过期..." >&2
  npm outdated --json > npm-outdated-result.json 2>&1
  if [[ $? -eq 0 ]]; then
    outdated_count=$(jq '. | length' npm-outdated-result.json 2>/dev/null || echo "0")
    if [[ $outdated_count -gt 0 ]]; then
      if [[ "$PROJECT_STATUS" != "🔴 严重" ]]; then
        PROJECT_STATUS="🟡 警告"
        WARNING_ISSUES=$((WARNING_ISSUES + 1))
      fi
      PROJECT_ISSUES+=("依赖过期: ${outdated_count}个")
      echo "⚠️ 发现${outdated_count}个过期依赖" >> "${REPORT_FILE}"
    else
      echo "✅ 无过期依赖" >> "${REPORT_FILE}"
    fi
  else
    echo "⚠️ npm outdated执行失败" >> "${REPORT_FILE}"
  fi
  
  # 3. 检查TypeScript编译
  if [[ -f "tsconfig.json" ]]; then
    echo "📋 检查TypeScript编译..." >&2
    if command -v tsc &> /dev/null; then
      npx tsc --noEmit --skipLibCheck 2> tsc-errors.txt
      if [[ $? -ne 0 ]]; then
        if [[ "$PROJECT_STATUS" != "🔴 严重" ]]; then
          PROJECT_STATUS="🟡 警告"
          WARNING_ISSUES=$((WARNING_ISSUES + 1))
        fi
        tsc_error_count=$(wc -l < tsc-errors.txt 2>/dev/null || echo "0")
        PROJECT_ISSUES+=("TypeScript错误: ${tsc_error_count}个")
        echo "⚠️ 发现${tsc_error_count}个TypeScript错误" >> "${REPORT_FILE}"
      else
        echo "✅ TypeScript编译通过" >> "${REPORT_FILE}"
      fi
    else
      echo "ℹ️ TypeScript编译器不可用" >> "${REPORT_FILE}"
    fi
  fi
  
  # 4. 检查ESLint
  if [[ -f ".eslintrc.js" || -f ".eslintrc.json" || -f ".eslintrc.cjs" ]]; then
    echo "📋 检查ESLint..." >&2
    if command -v eslint &> /dev/null; then
      # 检查是否存在src目录
      if [[ -d "src" ]]; then
        npx eslint src/ --format json > eslint-result.json 2>&1
        if [[ $? -ne 0 ]]; then
          eslint_error_count=$(jq '.[].fatal + .[].error | length' eslint-result.json 2>/dev/null || echo "0")
          if [[ $eslint_error_count -gt 0 ]]; then
            if [[ "$PROJECT_STATUS" != "🔴 严重" ]]; then
              PROJECT_STATUS="🟡 警告"
              WARNING_ISSUES=$((WARNING_ISSUES + 1))
            fi
            PROJECT_ISSUES+=("ESLint错误: ${eslint_error_count}个")
            echo "⚠️ 发现${eslint_error_count}个ESLint错误" >> "${REPORT_FILE}"
          fi
        else
          echo "✅ ESLint检查通过" >> "${REPORT_FILE}"
        fi
      else
        echo "ℹ️ 无src目录，跳过ESLint检查" >> "${REPORT_FILE}"
      fi
    else
      echo "ℹ️ ESLint不可用" >> "${REPORT_FILE}"
    fi
  fi
  
  # 5. 检查未使用的依赖
  if command -v depcheck &> /dev/null; then
    echo "📋 检查未使用的依赖..." >&2
    depcheck --json --skip-missing > depcheck-result.json 2>&1
    if [[ $? -ne 0 ]]; then
      unused_count=$(jq '.dependencies | length + .devDependencies | length' depcheck-result.json 2>/dev/null || echo "0")
      if [[ $unused_count -gt 0 ]]; then
        if [[ "$PROJECT_STATUS" != "🔴 严重" ]]; then
          PROJECT_STATUS="🟡 警告"
          WARNING_ISSUES=$((WARNING_ISSUES + 1))
        fi
        PROJECT_ISSUES+=("未使用依赖: ${unused_count}个")
        echo "⚠️ 发现${unused_count}个未使用依赖" >> "${REPORT_FILE}"
      else
        echo "✅ 无未使用依赖" >> "${REPORT_FILE}"
      fi
    fi
  else
    echo "ℹ️ depcheck不可用" >> "${REPORT_FILE}"
  fi
  
  # 更新项目状态
  echo "" >> "${REPORT_FILE}"
  echo "### 📊 项目状态: ${PROJECT_STATUS}" >> "${REPORT_FILE}"
  echo "" >> "${REPORT_FILE}"
  
  # 更新统计
  if [[ "$PROJECT_STATUS" == "🔴 严重" ]]; then
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
  elif [[ "$PROJECT_STATUS" == "🟡 警告" ]]; then
    WARNING_ISSUES=$((WARNING_ISSUES + 1))
  else
    GOOD_PROJECTS=$((GOOD_PROJECTS + 1))
  fi
  
  # 清理临时文件
  rm -f npm-audit-result.json npm-outdated-result.json tsc-errors.txt eslint-result.json depcheck-result.json
  
  echo "✅ ${project} 扫描完成" >&2
done

# 更新统计信息
echo "" >> "${REPORT_FILE}"
echo "## 📈 总体统计" >> "${REPORT_FILE}"
echo "🔴 严重问题: ${CRITICAL_ISSUES} 个项目" >> "${REPORT_FILE}"
echo "🟡 警告问题: ${WARNING_ISSUES} 个项目" >> "${REPORT_FILE}"
echo "🟢 良好项目: ${GOOD_PROJECTS} 个项目" >> "${REPORT_FILE}"
echo "总计项目: $((CRITICAL_ISSUES + WARNING_ISSUES + GOOD_PROJECTS)) 个" >> "${REPORT_FILE}"

# 生成GitHub Issue列表（针对严重问题）
echo "" >> "${REPORT_FILE}"
echo "## 🐛 严重问题需创建GitHub Issue" >> "${REPORT_FILE}"
echo "" >> "${REPORT_FILE}"

echo "🎯 技术债务扫描完成！" >&2
echo "📄 报告已保存到: ${REPORT_FILE}" >&2
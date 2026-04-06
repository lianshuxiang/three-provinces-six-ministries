# 自动御史台系统 - 使用指南

## 🎉 已完成配置！

**御史台现在会在每次任务完成后自动运行！**

---

## 📋 系统特性

### ✅ **自动运行**
```
每完成一项任务 → 自动启动御史台 → 系统优化分析 → 生成建议
```

### ✅ **无需手动干预**
- 系统启动时自动加载御史台模块
- 任务完成后自动触发分析
- 自动生成优化报告

### ✅ **完整的执行流程**
```
1. 中书省 - 分析任务
2. 门下省 - 审核方案
3. 尚书省 - 协调执行
4. 六部 - 执行任务
5. 御史台 - 系统优化分析 ⭐ 新增
```

---

## 🚀 使用方法

### **方式1：命令行运行（推荐）**

```bash
# 基础用法
node run-system-auto-yushitai.js "任务描述"

# 完整用法
node run-system-auto-yushitai.js "任务描述" 类型 优先级 预算

# 示例
node run-system-auto-yushitai.js "创建用户管理系统" code high 10
node run-system-auto-yushitai.js "编写API文档" docs medium 5
node run-system-auto-yushitai.js "性能优化" optimization high 20
```

### **方式2：NPM脚本**

```bash
# 快速运行（使用默认参数）
npm run run

# 简单模式（快速执行）
npm run run:simple

# 只运行御史台分析
npm run yushitai

# 检查御史台权限
npm run yushitai:check
```

---

## 📊 输出示例

### **任务执行部分**
```
🎯 三省六部系统 - 接收任务
============================================================
📋 任务: 创建一个简单的计数器功能
📂 类型: code
⚡ 优先级: medium
💰 预算: $5
============================================================

🏛️ [中书省] 分析任务...
   ✅ 意图分析完成
   📊 拆分为 1 个子任务

🏛️ [门下省] 审核方案...
   ✅ 方案审核通过

🏛️ [尚书省] 协调执行...
   📦 分配给工部执行

🏗️ [工部] 执行开发任务...
   ✅ 开发完成

============================================================
✅ 任务执行完成！
============================================================
💰 总成本: $0.0023
🔄 迭代次数: 1
⏱️  执行时间: 5.2s
============================================================
```

### **御史台自动分析部分**
```
🏛️ [御史台] 启动系统自动优化分析...
════════════════════════════════════════════════════════════

✅ 御史台分析完成！
════════════════════════════════════════════════════════════

💡 系统优化建议:

1. [high] 并行执行
   📊 影响: 提升30%执行效率
   ⏱️  工作量: 2-3天

2. [high] 动态规则加载
   📊 影响: 减少50%启动时间
   ⏱️  工作量: 2-3天

3. [high] caching
   📊 影响: 30% faster
   ⏱️  工作量: 1-2天
```

### **JSON结果输出**
```json
{
  "success": true,
  "task": "创建一个简单的计数器功能",
  "execution": {
    "cost": 0.0023,
    "iterations": 1,
    "duration": "5.2s"
  },
  "quality": {
    "codeQuality": 85,
    "testCoverage": 70,
    "securityScore": 90,
    "performanceScore": 80,
    "completeness": 95
  },
  "yushitai": {
    "analyzed": true,
    "optimizations": 3,
    "report": {
      "actionPlan": [...]
    }
  },
  "totalDuration": "8.5s"
}
```

---

## 🎯 参数说明

### **任务类型**
- `code` - 代码开发
- `docs` - 文档编写
- `test` - 测试任务
- `optimization` - 性能优化
- `general` - 通用任务（默认）

### **优先级**
- `high` - 高优先级
- `medium` - 中优先级（默认）
- `low` - 低优先级

### **预算**
- 单位：美元
- 默认：$5
- 建议范围：$1-$20

---

## 🔧 配置文件

### **package.json 脚本**
```json
{
  "scripts": {
    "run": "node run-system-auto-yushitai.js",
    "run:simple": "node simple-interface.js",
    "yushitai": "node yushitai-optimizer-full.js",
    "yushitai:check": "node yushitai-permission-checker.js"
  }
}
```

### **主要文件**
```
run-system-auto-yushitai.js   - 自动御史台版本（推荐）
simple-interface.js           - 简单接口
yushitai-optimizer-full.js    - 御史台核心引擎
yushitai-permission-checker.js - 权限检查器
```

---

## 💡 优化建议

### **已识别的优化机会**

#### **OPT-001: 并行执行** [HIGH]
- **当前**: 部分任务串行执行
- **改进**: 支持并行执行独立任务
- **效果**: +30% 执行效率
- **工作量**: 2-3天

#### **OPT-002: 动态规则加载** [HIGH]
- **当前**: 启动时加载所有规则
- **改进**: 按需加载规则模块
- **效果**: -50% 启动时间
- **工作量**: 2-3天

#### **OPT-003: API缓存** [HIGH]
- **当前**: 每次都调用API
- **改进**: 实现响应缓存机制
- **效果**: +30% 响应速度
- **工作量**: 1-2天

---

## 📈 系统监控

### **自动报告**
- 每次任务后自动生成优化报告
- 报告保存在: `/home/admin/.openclaw/workspace/yushitai-report.json`

### **查看历史报告**
```bash
cat /home/admin/.openclaw/workspace/yushitai-report.json | jq .
```

---

## ✨ 特性总结

```
✅ 自动化 - 无需手动启动御史台
✅ 智能化 - 自动分析并生成优化建议
✅ 完整性 - 包含任务执行和系统优化
✅ 可追踪 - 保存完整的执行记录
✅ 可扩展 - 易于添加新的优化规则
```

---

## 🎊 开始使用

```bash
# 立即尝试
node /home/admin/.openclaw/run-system-auto-yushitai.js "你的第一个任务"
```

---

**系统已配置完成，享受自动优化的便利！** 🚀

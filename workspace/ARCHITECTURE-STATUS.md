# 🏛️ 三省六部系统架构说明

## 📊 当前架构状态

### ✅ 已完成部分（代码框架）

1. **代码结构** ✅
   - 三省（中书省、门下省、尚书省）
   - 六部（工部、兵部、刑部、吏部、户部、礼部）
   - 迭代系统（封驳、申诉、验收）
   - 成本监控
   - 用户体验

2. **类型定义** ✅
   - 63 个接口定义
   - 完整的类型系统

3. **流程逻辑** ✅
   - 任务路由
   - 依赖分析
   - 质量门控

### ⚠️ 需要补充部分（API 调用）

**当前状态**: 代码中有注释说明"实际调用时会通过 OpenClaw 的 sessions_spawn"，但还没有实现真正的 API 调用层。

---

## 🎯 系统架构（设计目标）

```
用户请求
   ↓
[路由层] Router - 任务分类
   ↓
[中书省] Zhongshu - 决策层
   ├─ 分析用户意图
   ├─ 拆分任务
   ├─ 分配给六部
   └─ 生成诏书
   ↓
[门下省] Menxia - 审核层
   ├─ 审核诏书
   ├─ 质量检查
   └─ 封驳/通过
   ↓
[尚书省] Shangshu - 协调层
   ├─ 协调六部
   ├─ 监控进度
   └─ 验收结果
   ↓
[六部] Ministries - 执行层
   ├─ 工部 (代码开发)
   ├─ 兵部 (安全检查)
   ├─ 刑部 (测试审计)
   ├─ 吏部 (配置管理)
   ├─ 户部 (资源管理)
   └─ 礼部 (文档通信)
```

---

## 🧠 大模型调用方式

### 方式 1: OpenClaw Agent 集成（推荐）

```typescript
// 在中书省分析时
async analyzeIntent(intent: string): Promise<Analysis> {
  // 使用 OpenClaw 的 sessions_spawn 调用 AI
  const result = await sessions_spawn({
    runtime: "acp",
    task: `分析以下用户意图并返回结构化数据：
    
    用户意图: ${intent}
    
    请返回 JSON 格式：
    {
      "type": "任务类型",
      "scope": "影响范围",
      "complexity": "复杂度评估",
      "risks": ["风险列表"]
    }`,
    model: "zai/glm-4.7"  // 使用 GLM-4.7
  });

  return JSON.parse(result);
}
```

### 方式 2: 直接 HTTP 调用 GLM API

```typescript
// 在需要独立调用时
async callGLM(prompt: string, model: string = "glm-4-flash") {
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7
    })
  });

  return await response.json();
}
```

---

## 🔄 实际工作流程

### 当前实现（简化版）

```
用户说："创建一个 HTTP 服务器"
   ↓
我（OpenClaw Agent）接收
   ↓
我理解任务（用我的 AI 能力）
   ↓
我直接执行（使用 exec/write/edit 工具）
   ↓
返回结果给用户
```

**特点**:
- ✅ 立即可用
- ✅ 功能完整
- ⚠️ 不是真正的三省六部架构
- ⚠️ 没有多层迭代

### 完整实现（目标架构）

```
用户说："创建一个 HTTP 服务器"
   ↓
路由层：分析任务类型=code, 难度=simple
   ↓
中书省：调用 GLM-4.7 分析意图
   → API 调用：返回任务分解方案
   ↓
门下省：调用 GLM-5 审核方案
   → API 调用：返回审核结果
   ↓
尚书省：协调执行
   ↓
工部：调用 GLM-4-Flash 生成代码
   → API 调用：生成实际代码
   ↓
质量门控：检查代码质量
   ↓
返回完整结果
```

**特点**:
- ✅ 真正的三省六部架构
- ✅ 多层迭代和质量控制
- ✅ 可追溯的决策过程
- ⚠️ 需要实现 API 调用层

---

## 🛠️ 需要补充的代码

### 1. API 调用封装

```typescript
// agents/utils/api-caller.ts
export class GLMAPICaller {
  async call(prompt: string, model: string): Promise<string> {
    // 实现实际的 API 调用
  }
}
```

### 2. 三省的 API 集成

```typescript
// 在 zhongshu/province.ts 中
private async analyzeIntent(intent: string): Promise<Analysis> {
  const apiCaller = new GLMAPICaller();
  const response = await apiCaller.call(
    this.buildAnalysisPrompt(intent),
    "glm-4.7"
  );
  return JSON.parse(response);
}
```

---

## 💡 现在你可以选择

### 选项 A: 立即使用（当前状态）

**我可以直接帮你**：
```
你: "创建一个 HTTP 服务器"
我: 立即执行并返回结果
```

**优点**: 立即可用
**缺点**: 不是真正的三省六部架构

### 选项 B: 完善系统（需要开发）

**补充 API 调用层**：
1. 实现 GLM API 调用封装
2. 在三省中集成 API 调用
3. 实现完整的迭代流程

**优点**: 真正的架构
**缺点**: 需要开发时间

---

## 🎯 我的建议

**两步走**：

1. **先用起来**（现在）
   - 我直接帮你执行任务
   - 享受 AI 助手服务
   - 积累使用经验

2. **逐步完善**（有空时）
   - 补充 API 调用层
   - 实现完整的三省六部架构
   - 享受多层迭代和质量控制

---

**你想先试试现在的版本吗？还是想帮我完善这个系统？** 🚀

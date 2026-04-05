# Claude Code 架构学习笔记

> 来源: [Yuyz0112/claude-code-reverse](https://github.com/Yuyz0112/claude-code-reverse) 逆向分析项目
> 分析时间: 2025-04-05

## 一、整体架构概览

Claude Code 是一个终端里的 Agent 编程工具，核心架构如下：

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Agent (Sonnet 4)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   System    │  │   Tools     │  │   Context Manager   │  │
│  │   Prompts   │  │   (Bash,    │  │   (Compaction,      │  │
│  │             │  │   Read,     │  │    Summarization)   │  │
│  │             │  │   Edit...)  │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Task Tool (Sub Agent)                   │    │
│  │         独立任务隔离，脏上下文隔离                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、核心设计理念

### 1. 多模型分层
| 任务类型 | 使用模型 | 原因 |
|---------|---------|------|
| Quota Check | Haiku 3.5 | 轻量检查，省钱 |
| Topic Detection | Haiku 3.5 | 简单分类 |
| Core Agent | Sonnet 4 | 复杂任务，高质量 |
| Context Compaction | Sonnet 4 | 压缩质量重要 |

### 2. Sub Agent 设计（关键创新）

**问题**：多轮工具调用产生大量"脏上下文"（搜索无关文件、中间结果等）

**解决方案**：
```
Main Context                    Sub Context
┌──────────────┐               ┌──────────────┐
│  User Task   │ ──Task Tool─▶ │  Isolated    │
│              │               │  Agent       │
│              │ ◀──Result──── │  (脏上下文)  │
└──────────────┘               └──────────────┘ (销毁)
```

**优势**：
- 主上下文只保留最终结果
- 子上下文用完即销毁
- 大幅节省 token 消耗

### 3. TodoWrite 短期记忆

```
~/.claude/todos/
└── <session-id>.json   # 任务进度持久化
```

每次对话开始时，system-reminder-end prompt 会重新加载 Todo 列表，让模型"记住"之前的进度。

---

## 三、Prompt 工程亮点

### 1. System Workflow Prompt (核心)

```markdown
# Tone and style
You should be concise, direct, and to the point.
You MUST answer concisely with fewer than 4 lines (not including tool use or code generation)

# Task Management
You have access to the TodoWrite tools to help you manage and plan tasks.
Use these tools VERY frequently.

# Code style
IMPORTANT: DO NOT ADD ANY COMMENTS unless asked
```

**关键约束**：
- 极简输出（< 4 行）
- 频繁使用 TodoWrite
- 不添加代码注释

### 2. Context Compaction Prompt

当上下文不足时触发：
1. 加载 system-compact prompt
2. 在当前对话末尾追加 compact prompt
3. LLM 将整个对话压缩成一段摘要
4. 压缩结果作为下一个对话的初始信息

### 3. 动态注入 Prompts

**System Reminder Start** (对话开始前)：
- 加载环境信息（cwd, git status, OS）
- 加载 IDE 打开的文件

**System Reminder End** (对话开始后)：
- 检查是否需要加载 Todo 列表

---

## 四、工具定义设计

### 1. Task Tool (Sub Agent)

```yaml
name: Task
description: Launch a new agent to handle complex, multi-step tasks autonomously.
parameters:
  subagent_type: string  # agent 类型
  description: string    # 简短描述
  prompt: string         # 完整任务指令
```

**使用规则**：
- 并行启动多个 agent 提升性能
- agent 是无状态的，只能返回一次结果
- prompt 必须包含完整任务描述

### 2. TodoWrite Tool

```yaml
name: TodoWrite
parameters:
  todos:
    - id: string
      content: string
      status: pending | in_progress | completed
      priority: high | medium | low
```

**使用时机**：
- 3 步以上复杂任务
- 非平凡任务
- 用户明确要求
- 开始任务前标记 in_progress
- 完成后立即标记 completed

---

## 五、自迭代机制（Self-Iteration）

### 1. 核心：Tool-Use 循环

```
┌────────────────────────────────────────────┐
│                                            │
│  ┌──────────┐    ┌──────────┐    ┌───────┐│
│  │  LLM     │───▶│  Tool    │───▶│ Result││
│  │  决策    │    │  执行    │    │       ││
│  └──────────┘    └──────────┘    └───────┘│
│       ▲                                 │  │
│       └─────────────────────────────────┘  │
│                   循环                      │
└────────────────────────────────────────────┘
```

**本质**：不是一次性输出，而是持续调用工具直到成功。

### 2. 验证驱动循环

```
写代码 → 运行测试/lint → 失败？→ 修复 → 再验证 → ... → 成功
```

**Prompt 约束**（system-workflow prompt）：
```markdown
VERY IMPORTANT: When you have completed a task, you MUST run the lint and 
typecheck commands (eg. npm run lint, npm run typecheck, ruff, etc.) with Bash 
if they were provided to you to ensure your code is correct.
```

**机制**：完成后**必须**运行验证，失败就继续修复，直到通过。

### 3. Pre-commit Hook 自动重试

```yaml
# Bash.tool.yaml
If the commit fails due to pre-commit hook changes, retry the commit ONCE 
to include these automated changes. If it fails again, it usually means a 
pre-commit hook is preventing the commit.
```

**流程**：
```
git commit → hook 改了文件 → 失败
    ↓
自动重试（包含 hook 改动）→ 成功/失败
```

### 4. TodoWrite 任务循环

```markdown
# system-workflow prompt
It is critical that you mark todos as completed as soon as you are done with 
a task. Do not batch up multiple tasks before marking them as completed.
```

**流程**：
```
TodoWrite 规划任务 → 执行第一个任务 → 标记完成 
    → 执行第二个任务 → 标记完成 → ... → 全部完成
```

### 5. Sub Agent 隔离迭代

对于复杂搜索/修改任务：
```
Main Agent 发现问题
    ↓
Task Tool 启动 Sub Agent
    ↓
Sub Agent 内部迭代（读文件 → 搜索 → 修改 → 验证 → 再改...）
    ↓
返回最终结果
    ↓
Main Context 只保留结果（脏上下文被隔离销毁）
```

### 6. 完整示例

用户说："帮我修复这个 bug"

```
1. LLM: 分析代码，定位问题
2. LLM → Edit Tool: 修改代码
3. LLM → Bash Tool: npm test
4. Result: ❌ 3 tests failed
5. LLM: 看到失败，继续修复
6. LLM → Edit Tool: 修改代码
7. LLM → Bash Tool: npm test
8. Result: ✅ All tests passed
9. LLM: Done.
```

### 7. 关键设计要点

| 要素 | 作用 |
|-----|------|
| Prompt 约束 | "MUST run lint/typecheck after completing" |
| Todo 跟踪 | 确保不遗漏任务 |
| 上下文累积 | 每次迭代结果追加到上下文，模型"看到"之前的错误 |
| 自动重试 | 某些失败场景自动重试一次 |
| Sub Agent | 隔离复杂迭代的"脏上下文" |

---

## 六、工作流总结

```
1. 启动时
   ├── Quota Check (Haiku)
   ├── Summarize Previous Conversations (Haiku)
   └── Load Todos (如果有)

2. 用户输入后
   ├── Topic Detection (Haiku) → 更新终端标题
   └── Core Agent (Sonnet 4)
       ├── 加载 System Workflow Prompt
       ├── 加载 System Reminder Start (环境信息)
       ├── 加载 System Reminder End (Todo 检查)
       └── 执行任务（调用工具）

3. 上下文不足时
   └── Context Compaction (Sonnet 4)
       └── 压缩对话历史

4. 独立子任务
   └── Task Tool → Sub Agent (Sonnet 4)
       └── 隔离执行，返回结果
```

---

## 七、可借鉴的设计

### 1. 多模型分层使用
- 简单任务用便宜模型
- 复杂任务用强模型
- 显著降低成本

### 2. Sub Agent 脏上下文隔离
- 避免无关信息污染主上下文
- 子任务完成后只保留结果

### 3. Todo 持久化 + 动态加载
- 对话间保持任务进度
- 每次"提醒"模型之前的任务

### 4. Context Compaction
- 智能压缩对话历史
- 保留关键信息，丢弃噪音

### 5. 极简输出风格
- 减少 token 消耗
- 提升响应速度
- 符合终端使用习惯

### 6. 验证驱动的自迭代
- 完成后必须运行测试/lint
- 失败自动继续修复
- 直到验证通过才算完成

### 7. 自动重试机制
- pre-commit hook 失败自动重试一次
- 减少用户干预

---

## 八、文件结构

```
results/
├── prompts/
│   ├── system-workflow.prompt.md      # 核心工作流 (13KB)
│   ├── compact.prompt.md              # 压缩指令
│   ├── system-reminder-start/end.md   # 动态注入
│   └── check-*.md                     # 各种检查
└── tools/
    ├── Task.tool.yaml                 # Sub Agent
    ├── TodoWrite.tool.yaml            # 任务管理
    ├── Bash.tool.yaml                 # 命令执行
    ├── Read/Edit/Write.tool.yaml      # 文件操作
    └── ...
```

---

## 九、与 OpenClaw 的对比

| 特性 | Claude Code | OpenClaw |
|-----|-------------|----------|
| Sub Agent | Task Tool (隔离上下文) | sessions_spawn (类似) |
| Todo 管理 | TodoWrite + JSON 文件 | 无内置 |
| Context 压缩 | Compaction Prompt | 无内置 |
| 多渠道 | 无 | 多渠道支持 |
| 多 Agent | 仅 Sub Agent | 完整多 Agent 支持 |
| Skills | 无 | Skills 系统 |

**可学习**：
1. Todo 持久化 + 动态加载机制
2. Context Compaction 的 prompt 设计
3. 多模型分层使用策略
4. Sub Agent 的"脏上下文隔离"理念
5. 验证驱动的自迭代机制
6. 自动重试策略

---

---

## 十、三省六部 Agent 系统设计（融合方案）

> 结合三省六部制的**分权制衡** + Claude Code 的**自迭代**机制

### 0. 规则系统（Rules）

系统支持动态添加规则，所有 Agent 必须遵守。

#### 当前规则

| ID | 规则 | 触发条件 | 优先级 |
|----|------|---------|--------|
| R001 | 非技术问题及时反馈 | 权限/账号等问题重试 3 次失败 | P0（最高） |

#### 规则详情

**R001: 非技术问题及时反馈**
```yaml
id: R001
name: 非技术问题及时反馈
priority: P0
trigger:
  - 权限被拒绝
  - 认证失败
  - 账号锁定
  - 配额耗尽
  - API 密钥失效
  - 网络隔离/防火墙阻止
condition:
  retryCount: ">= 3"
  category: "non-technical"
action:
  - 停止当前任务
  - 生成问题报告
  - 请求用户介入
  - 等待用户确认后继续
```

#### 规则存储

```
~/.openclaw/rules/
├── rules.json           # 规则列表
├── R001.yaml            # 规则详情
├── R002.yaml            # （未来规则）
└── triggered/           # 触发记录
    └── R001-2025-04-05-001.json
```

#### 规则加载机制

每个 Agent 启动时加载 `rules.json`，关键规则注入到 System Prompt：

```markdown
# 系统规则（必须遵守）

## R001: 非技术问题及时反馈（P0）
如果遇到以下问题，重试 3 次后仍无法解决，必须立即停止并反馈用户：
- 权限被拒绝
- 认证失败/账号问题
- 配额耗尽
- API 密钥失效
- 网络访问被阻止

不要继续尝试，不要假设问题会自动解决。
```

#### 添加新规则

用户可以随时添加新规则：
```
用户: "添加规则：所有文件操作必须先备份"
系统: 创建 R003.yaml，下次对话生效
```

---

### 1. 核心理念

**三省六部制精髓**：
- 中书草拟 → 门下审议 → 尚书执行
- 门下有权**封驳**，形成闭环验证
- 六部**各司其职**，专业分工

**Claude Code 自迭代精髓**：
- Tool-Use 循环：LLM → Tool → Result → LLM...
- 验证驱动：完成后必须运行测试，失败继续修复
- Sub Agent 隔离：脏上下文隔离，只保留结果

**融合设计**：
```
用户请求
    ↓
中书省（决策）→ 草拟诏书（任务计划）
    ↓
门下省（审议）→ 封驳/批红
    ↓ (驳回则返回中书省修改)
尚书省（协调）→ 调度六部执行
    ↓
六部（执行）→ Sub Agent 隔离迭代
    ↓
门下省（验收）→ 不通过则驳回重做
    ↓
汇报用户
```

### 2. 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                            用户（皇帝）                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      中书省（决策层）                            │
│  模型：GLM-4.7（性价比高）                                      │
│  职责：理解意图、拆分任务、制定计划                              │
│  产出：诏书 JSON                                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      门下省（审议层）                            │
│  模型：GLM-5（强推理）                                          │
│  职责：审核计划、风险评估、验收结果                              │
│  产出：批红（通过）或 封驳（驳回）                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      尚书省（协调层）                            │
│  模型：GLM-5（强协调）                                          │
│  职责：协调六部、监控进度、异常处理                              │
│  产出：执行报告                                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        六部（执行层）                            │
│                                                                │
│  吏部(GLM-4.7)    户部(GLM-4.7)    礼部(GLM-4.7)               │
│  配置管理          资源管理          通信文档                    │
│                                                                │
│  兵部(GLM-5)      刑部(GLM-4.7)    工部(GLM-5)                 │
│  安全防御          日志审计          工程开发（核心）             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   工部 Sub Agents（隔离执行）                    │
│                                                                │
│  Coder Agent(GLM-5)  Tester Agent(GLM-4.7)  Fixer Agent(GLM-5) │
│  编码                测试生成              Bug 修复             │
└─────────────────────────────────────────────────────────────────┘
```

### 3. 模型分配（仅 GLM-4.7 / GLM-5）

| Agent | 模型 | 原因 |
|-------|------|------|
| 中书省 | GLM-4.7 | 决策任务，性价比优先 |
| 门下省 | GLM-5 | 审议需要强推理 |
| 尚书省 | GLM-5 | 协调复杂，需要强能力 |
| 吏部 | GLM-4.7 | 配置管理，标准任务 |
| 户部 | GLM-4.7 | 资源管理，标准任务 |
| 礼部 | GLM-4.7 | 通信文档，标准任务 |
| 兵部 | GLM-5 | 安全检查，需要强推理 |
| 刑部 | GLM-4.7 | 日志审计，标准任务 |
| 工部 | GLM-5 | 核心开发，需要强能力 |
| Coder Agent | GLM-5 | 编码任务 |
| Tester Agent | GLM-4.7 | 测试生成 |
| Fixer Agent | GLM-5 | Bug 修复 |

### 4. 迭代机制设计

#### 4.1 三层迭代

**第一层：封驳迭代（事前）**
```
中书省 → 草拟诏书
    ↓
门下省 → 审议
    ↓
┌───┴───┐
│ 批红  │ 封驳 → 返回中书省修改 → 重新提交审议
└───┬───┘
    ↓
执行
```

**第二层：Sub Agent 自迭代（事中）**
```
工部 Sub Agent:
    ↓
Coder Agent → 编码
    ↓
Bash: npm test
    ↓
┌────┴────┐
│ 通过     │ 失败 → Fixer Agent
└────┬────┘         ↓
     │         修复 → npm test → ... (循环直到通过)
     ↓
完成
```

**第三层：验收迭代（事后）**
```
尚书省 → 执行完成
    ↓
门下省 → 验收
    ↓
┌────┴────┐
│ 通过     │ 驳回 → 返回尚书省 → 重新执行
└────┬────┘
     ↓
汇报用户
```

#### 4.2 迭代参数配置

```yaml
iteration:
  # 封驳迭代
  rejection:
    maxRetries: 3              # 最多驳回 3 次
    backoff: exponential       # 指数退避
    
  # Sub Agent 自迭代
  subAgent:
    maxAttempts: 5             # 最多尝试 5 次
    verification: "npm test"   # 验证命令
    onFailure: "continue"      # 失败继续尝试
    
  # 验收迭代
  acceptance:
    maxRetries: 2              # 最多驳回重做 2 次
    qualityGate: true          # 质量门禁
```

#### 4.3 迭代流程示例

**用户请求**："修复登录 bug"

```
┌─────────────────────────────────────────────────────────────┐
│ 迭代 1：中书省草拟诏书                                       │
│   - 拆分任务：定位 bug → 安全检查 → 修复 → 测试              │
│   - 分配给工部、兵部                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 迭代 2：门下省审议                                           │
│   - 检查：安全风险？资源充足？                               │
│   - 结果：批红（通过）                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 迭代 3：尚书省调度 → 工部执行                                │
│                                                             │
│   Sub Agent 自迭代：                                         │
│   ┌─────────────────────────────────────────────────────┐  │
│   │ Round 1:                                             │  │
│   │   Coder Agent → 修改代码                             │  │
│   │   Bash: npm test → ❌ 2 tests failed                │  │
│   │                                                     │  │
│   │ Round 2:                                             │  │
│   │   Fixer Agent → 修复测试                             │  │
│   │   Bash: npm test → ❌ 1 test failed                 │  │
│   │                                                     │  │
│   │ Round 3:                                             │  │
│   │   Fixer Agent → 再次修复                             │  │
│   │   Bash: npm test → ✅ All passed                    │  │
│   │   Bash: npm run lint → ✅ No issues                 │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   结果：修复完成，验证通过                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 迭代 4：门下省验收                                           │
│   - 检查：代码质量？安全？测试？                             │
│   - 结果：验收通过                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 最终：汇报用户                                               │
│   "登录 bug 已修复，测试通过，请查看。"                       │
└─────────────────────────────────────────────────────────────┘
```

### 5. 数据结构

#### 5.1 诏书（任务计划）

```typescript
interface ImperialEdict {
  id: string;
  userIntent: string;
  
  tasks: {
    id: string;
    description: string;
    assignedTo: Ministry;
    priority: "high" | "medium" | "low";
    todos: Todo[];
    dependsOn?: string[];
  }[];
  
  status: "drafting" | "pending_review" | "approved" | "rejected" | "executing" | "completed";
  
  // 迭代追踪
  iteration: {
    version: number;           // 第几版诏书
    rejections: number;        // 被驳回次数
    lastModified: string;
  };
}
```

#### 5.2 执行记录

```typescript
interface ExecutionRecord {
  edictId: string;
  taskId: string;
  
  // Sub Agent 迭代记录
  iterations: {
    round: number;
    agent: "coder" | "tester" | "fixer";
    action: string;
    result: "success" | "failure";
    verification: {
      command: string;
      output: string;
      passed: boolean;
    };
    timestamp: string;
  }[];
  
  // 最终结果
  finalResult: {
    success: boolean;
    output: any;
  };
}
```

#### 5.3 验收报告

```typescript
interface AcceptanceReport {
  edictId: string;
  
  checks: {
    quality: boolean;      // lint/typecheck
    security: boolean;     // 安全扫描
    tests: boolean;        // 测试通过
    performance: boolean;  // 性能检查
  };
  
  passed: boolean;
  
  // 驳回记录
  rejection?: {
    reason: string;
    suggestedFix: string;
    retryCount: number;
  };
}
```

### 6. 规则管理系统

#### 概述

用户可以随时添加规则，所有 Agent 必须遵守。

```
~/.openclaw/rules/
├── rules.json           # 规则索引
├── R001.yaml            # 非技术问题反馈
├── R002.yaml            # （未来规则）
└── ...
```

#### 当前规则

| ID | 名称 | 优先级 | 说明 |
|----|------|--------|------|
| R001 | 非技术问题及时反馈 | P0 | 权限/账号问题重试3次后必须停止并反馈用户 |

#### R001 详情

**触发条件**：
- 权限被拒绝
- 认证失败/账号问题
- 配额耗尽
- API 密钥失效

**触发阈值**：重试 ≥ 3 次

**动作**：
1. 立即停止当前任务
2. 生成问题报告
3. 反馈用户请求介入
4. 等待用户确认后继续

**例外**：
- 用户明确要求继续尝试
- 临时故障已自动恢复

#### 规则注入点

每个 Agent 启动时加载规则：
```typescript
// 中书省启动
const rules = loadRules("~/.openclaw/rules/");
const systemPrompt = `
${basePrompt}

## 重要规则
${rules.map(r => r.toPrompt()).join("\n")}
`;
```

#### 添加新规则

```
用户: "添加规则：所有文件操作必须先备份"

系统:
1. 创建 R003.yaml
2. 更新 rules.json
3. 下次对话生效
4. 确认给用户
```

---

### 7. 系统改进（v2.0）

#### 7.1 路由层（快速通道）

**问题**：过度工程化，简单问题也要走完整三省流程

**解决方案**：增加路由层，按复杂度分流

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户请求                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      路由层（GLM-4.7）                          │
│  职责：判断任务复杂度，选择执行路径                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 分类规则：                                                │   │
│  │ - 简单问题（查询、解释、格式化）→ 直接回答 < 3s           │   │
│  │ - 中等任务（单文件修改、简单查询）→ 单部门执行 < 30s      │   │
│  │ - 复杂任务（多文件、重构、新功能）→ 完整三省流程          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
              │                    │                    │
              ▼                    ▼                    ▼
        直接回答            单部门执行           三省流程
         < 3s                < 30s              30s-5min
```

**分类标准**：

| 类型 | 特征 | 示例 | 路径 |
|------|------|------|------|
| 简单 | 单步、无工具调用 | "什么是闭包？" | 直接回答 |
| 中等 | 1-2步、单工具 | "读取 config.json" | 单部门 |
| 复杂 | 多步、多工具、需验证 | "重构登录模块" | 三省流程 |

---

#### 7.2 共享上下文层

**问题**：三省之间的上下文传递不明确

**解决方案**：增加共享上下文层

```typescript
interface SharedContext {
  // 用户原始意图（完整）
  userIntent: {
    raw: string;              // 原始输入
    parsed: string;           // 解析后的意图
    timestamp: string;
  };
  
  // 任务状态
  taskState: {
    edictId: string;
    currentPhase: "routing" | "planning" | "reviewing" | "executing" | "accepting";
    progress: number;        // 0-100
  };
  
  // 关键决策点
  decisions: {
    phase: string;
    decision: string;
    reason: string;
    timestamp: string;
  }[];
  
  // 压缩后的历史（< 5KB）
  compressedHistory: string;
  
  // 当前活跃的 Agent
  activeAgent: string;
}
```

**存储位置**：
```
~/.openclaw/shared-context/
└── session-xxx.json
```

**访问规则**：
- 所有 Agent 只读写共享上下文
- 不传递完整对话历史
- 压缩历史 < 5KB

---

#### 7.3 申诉机制

**问题**：门下省误判时无法纠正

**解决方案**：

```
门下省驳回
    ↓
中书省可选择：
├── 接受驳回 → 修改诏书
└── 提出申诉 → 门下省二次审议
                ↓
            ├── 通过 → 继续执行
            └── 仍驳回 → 询问用户裁决
```

**申诉流程**：

```typescript
interface Appeal {
  edictId: string;
  rejectionId: string;
  
  // 申诉理由
  appealReason: string;
  
  // 中书省认为驳回不合理的依据
  evidence: {
    type: "context" | "technical" | "efficiency";
    content: string;
  }[];
  
  // 二次审议结果
  secondReview?: {
    decision: "approved" | "rejected";
    reviewer: "门下省";
    reason: string;
  };
  
  // 用户裁决（如果二次审议仍驳回）
  userDecision?: {
    decision: "force_execute" | "modify" | "cancel";
    timestamp: string;
  };
}
```

---

#### 7.4 紧急强制执行

**问题**：紧急情况需要跳过审议

**解决方案**：

```
用户: "紧急！生产环境严重 bug，立即修复！"
        ↓
路由层识别 "紧急" 关键词
        ↓
跳过门下省审议，直接执行
        ↓
执行完成后补充验收
```

**触发条件**：
- 用户明确说 "紧急"、"立即"、"force"、"生产环境"
- 检测到严重错误（数据库连接失败、服务宕机等）

**配置**：
```yaml
emergency:
  keywords: ["紧急", "立即", "force", "生产", "production", "critical"]
  skipPhases: ["门下省审议"]
  requirePostExecutionReview: true  # 执行后必须补充验收
  alertUser: true                   # 通知用户使用了紧急模式
```

---

#### 7.5 检查点与崩溃恢复

**问题**：执行到一半崩溃，进度丢失

**解决方案**：检查点系统

```
~/.openclaw/checkpoints/
└── task-123/
    ├── checkpoint-1.json  ✅ 已完成 - 路由分类
    ├── checkpoint-2.json  ✅ 已完成 - 诏书草拟
    ├── checkpoint-3.json  ✅ 已完成 - 审议通过
    ├── checkpoint-4.json  ✅ 已完成 - 工部读取文件
    └── checkpoint-5.json  🔄 进行中 - 工部修改代码
```

**检查点内容**：

```typescript
interface Checkpoint {
  taskId: string;
  stepId: string;
  
  phase: string;           // 当前阶段
  agent: string;           // 执行的 Agent
  
  status: "completed" | "in_progress" | "failed";
  
  // 输入输出
  input: any;
  output?: any;
  
  // 时间戳
  startedAt: string;
  completedAt?: string;
  
  // 父检查点（Sub Agent 场景）
  parentCheckpoint?: string;
}
```

**恢复机制**：

```typescript
// 系统重启时
function recoverFromCheckpoint(taskId: string) {
  const checkpoints = loadCheckpoints(taskId);
  const lastCheckpoint = findLastInProgress(checkpoints);
  
  if (lastCheckpoint) {
    // 从上一个完成的检查点继续
    resumeFrom(lastCheckpoint.previousCompleted);
  }
}
```

---

#### 7.6 成本预算系统

**问题**：成本没有硬上限，可能失控

**解决方案**：分层预算控制

```yaml
budget:
  # 单任务预算
  perTask:
    limit: 5.00 USD          # 单任务上限（提高）
    alertAt: 3.00 USD        # 3 美元时警告
    hardStop: true           # 超限强制停止
  
  # 每日预算
  perDay:
    limit: 100.00 USD        # 每日上限（大幅提高）
    alertAt: 80.00 USD       # 80% 警告
    hardStop: true
  
  # 每月预算
  perMonth:
    limit: 2000.00 USD       # 每月上限
    alertAt: 1500.00 USD
    hardStop: true
  
  # 实时监控
  monitoring:
    updateInterval: 5000     # 5 秒更新一次
    logTo: "~/.openclaw/logs/cost.log"
    realTimeDisplay: true    # 实时显示成本
```

**成本估算**（执行前）：

```typescript
interface CostEstimate {
  taskId: string;
  
  // 估算明细
  breakdown: {
    phase: string;
    agent: string;
    model: "GLM-4.7" | "GLM-5";
    estimatedTokens: number;
    estimatedCost: number;   // USD
  }[];
  
  total: number;
  
  // 与预算对比
  budgetStatus: {
    remaining: number;
    percentUsed: number;
    willExceed: boolean;
  };
}
```

**超限处理**：

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ 预算警告                                                     │
│                                                                 │
│ 当前任务预估成本: $4.50                                         │
│ 今日已使用: $85.00 / $100.00                                    │
│ 本月已使用: $1,650.00 / $2,000.00                               │
│                                                                 │
│ 继续执行将接近预算上限。                                        │
│                                                                 │
│ [继续执行] [简化任务] [取消]                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

#### 7.7 动态模型选择

**问题**：模型选择不够动态，可能浪费成本

**解决方案**：根据任务复杂度动态选择模型

```typescript
interface ModelSelector {
  // 任务分类器
  classify(task: Task): {
    complexity: "simple" | "medium" | "complex";
    recommendedModel: "GLM-4.7" | "GLM-5";
    reason: string;
  };
  
  // 分类规则
  rules: {
    simple: {
      patterns: ["修改变量", "格式化", "简单查询"];
      model: "GLM-4.7";
    };
    medium: {
      patterns: ["重构函数", "添加测试", "修复简单 bug"];
      model: "GLM-4.7";
    };
    complex: {
      patterns: ["新功能", "架构调整", "跨模块修改"];
      model: "GLM-5";
    };
  };
}
```

**示例**：

| 任务 | 自动选择的模型 | 原因 |
|------|----------------|------|
| 修改变量名 | GLM-4.7 | 简单 |
| 重构单个函数 | GLM-4.7 | 中等 |
| 修复简单 bug | GLM-4.7 | 中等 |
| 实现新功能 | GLM-5 | 复杂 |
| 跨模块重构 | GLM-5 | 复杂 |
| 安全漏洞修复 | GLM-5 | 复杂 + 敏感 |

---

#### 7.8 实时进度流

**问题**：黑盒执行，用户不知道发生了什么

**解决方案**：实时进度展示

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 任务进行中: 修复登录 bug                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ✅ 路由层：分类为复杂任务 (0.5s)                                │
│ ✅ 中书省：已规划任务 (2.1s)                                    │
│   └─ 拆分为 4 个子任务                                          │
│ ✅ 门下省：审议通过 (3.2s)                                      │
│ 🔄 尚书省：调度执行中...                                        │
│   ├─ ✅ 工部：定位 bug (5.1s)                                   │
│   ├─ ✅ 兵部：安全检查 (2.3s)                                   │
│   └─ 🔄 工部：正在修复代码...                                   │
│       ├─ 📝 读取 auth/login.ts                                  │
│       ├─ 🔍 分析错误位置: line 45                               │
│       └─ ✏️ 修改代码中...                                       │
│ ⏳ 待执行：测试验证                                              │
│ ⏳ 待执行：门下省验收                                            │
│                                                                 │
│ 📊 预计剩余时间: 15s                                            │
│ 💰 当前成本: $0.03                                              │
└─────────────────────────────────────────────────────────────────┘
```

**实现**：

```typescript
interface ProgressStream {
  // 事件类型
  events: {
    phaseStarted: { phase: string; timestamp: string };
    phaseCompleted: { phase: string; duration: number };
    stepStarted: { step: string; details: string };
    stepCompleted: { step: string; result: string };
    progressUpdate: { percent: number; eta: number };
    costUpdate: { current: number; estimated: number };
  };
  
  // 推送方式
  delivery: "websocket" | "polling" | "stdout";
  
  // 格式
  format: "json" | "markdown" | "ansi";
}
```

---

#### 7.9 预览/确认模式

**问题**：用户无法预览执行计划，可能误操作

**解决方案**：默认开启预览模式

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 执行计划预览                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📝 将要执行的操作：                                             │
│                                                                 │
│ 文件变更：                                                      │
│   ✏️ 修改  auth/login.ts      (修复密码验证逻辑)                │
│   ✏️ 修改  auth/utils.ts      (优化密码比对函数)                │
│   📄 新增  tests/auth.test.ts (添加单元测试)                    │
│                                                                 │
│ Bash 命令：                                                     │
│   $ npm test                                                    │
│   $ npm run lint                                                │
│                                                                 │
│ ⚠️ 预估影响：                                                   │
│   - 3 个相关测试可能需要更新                                     │
│   - 预计影响 2 个依赖此模块的文件                                │
│                                                                 │
│ 💰 预估成本：$0.08                                              │
│ ⏱️ 预估时间：30-45 秒                                           │
│                                                                 │
│ 确认执行？                                                      │
│ [✅ 确认执行] [❌ 取消] [✏️ 修改计划] [🔍 查看详细差异]          │
└─────────────────────────────────────────────────────────────────┘
```

**配置**：

```yaml
preview:
  enabled: true                  # 默认开启
  
  # 自动跳过预览的条件
  skipIf: {
    riskLevel: "low",           # 低风险任务
    fileSize: "< 1KB",          # 小文件
    userApproved: true          # 用户已信任
  }
  
  # 强制预览的条件
  forceIf: {
    riskLevel: "high",          # 高风险
    affectsProduction: true,    # 影响生产环境
    deletesFiles: true          # 删除文件
  }
```

---

#### 7.10 资源锁系统

**问题**：六部之间的资源竞争

**解决方案**：尚书省管理资源锁

```typescript
interface ResourceLock {
  resourceId: string;        // 资源标识
  type: "file" | "api" | "quota";
  
  lockHolder: string;        // 当前持有者（部门名）
  lockTime: string;          // 锁定时间
  
  // 等待队列
  queue: {
    requester: string;
    requestTime: string;
    priority: number;
  }[];
  
  // 超时
  timeout: number;           // 锁超时时间
}
```

**示例**：

```yaml
locks:
  file:/auth/login.ts:
    holder: 工部
    lockedAt: "2025-04-05T06:10:00Z"
    queue:
      - requester: 兵部
        reason: "安全扫描"
        priority: 5
  
  resource:api-quota:
    holder: 户部
    lockedAt: "2025-04-05T06:08:00Z"
    remaining: 85%
```

**死锁检测**：

```typescript
// 尚书省定期检查死锁
function detectDeadlock(): DeadlockInfo[] {
  // 检测循环等待
  // A 等 B，B 等 C，C 等 A
  
  // 自动解决：按优先级强制释放
}
```

---

#### 7.11 事件总线

**问题**：跨部门协作不清晰

**解决方案**：事件驱动协作

```typescript
interface EventBus {
  // 事件类型
  events: {
    // 任务相关
    "task.started": { taskId: string; phase: string };
    "task.completed": { taskId: string; result: any };
    "task.failed": { taskId: string; error: string };
    
    // 安全相关
    "security.issue_found": { severity: string; details: string };
    "security.scan_completed": { passed: boolean };
    
    // 资源相关
    "resource.quota_warning": { remaining: number };
    "resource.lock_acquired": { resourceId: string; holder: string };
    
    // 质量相关
    "quality.test_failed": { test: string; error: string };
    "quality.lint_error": { file: string; errors: string[] };
  };
  
  // 订阅机制
  subscribe(eventType: string, handler: Function): void;
  publish(eventType: string, data: any): void;
}
```

**事件流示例**：

```
时间线：

06:10:00  工部 → task.started { taskId: "t123", phase: "coding" }
06:10:15  工部 → security.issue_found { severity: "medium" }
06:10:16  兵部 ← 收到事件，开始安全扫描
06:10:20  兵部 → security.scan_completed { passed: true }
06:10:25  工部 → task.completed { result: "code modified" }
06:10:26  刑部 ← 收到事件，开始测试
06:10:30  刑部 → quality.test_failed { test: "auth.test" }
06:10:31  工部 ← 收到事件，触发 Fixer Agent
```

---

#### 7.12 测试独立化

**问题**：Tester Agent 属于工部，不够独立

**解决方案**：测试归入刑部，独立于工部

```
┌─────────────────────────────────────────────────────────────────┐
│                        刑部（重组）                              │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │
│  │ 日志审计    │  │ 合规检查    │  │ 测试司（新增）       │     │
│  │             │  │             │  │                     │     │
│  │ - 执行日志  │  │ - 代码规范  │  │ - 测试生成（独立）  │     │
│  │ - 操作记录  │  │ - 安全合规  │  │ - 测试执行（独立）  │     │
│  │ - 错误追踪  │  │ - 审计报告  │  │ - 覆盖率分析        │     │
│  │             │  │             │  │ - 测试报告          │     │
│  └─────────────┘  └─────────────┘  └─────────────────────┘     │
│                                                                 │
│  测试司直接向门下省汇报，不受工部影响                            │
└─────────────────────────────────────────────────────────────────┘
```

**优势**：
- 测试独立于开发
- 客观评估代码质量
- 测试失败直接报告门下省

---

#### 7.13 事务与回滚系统

**问题**：执行到一半失败，无法回滚

**解决方案**：事务机制

```typescript
interface Transaction {
  id: string;
  taskId: string;
  
  status: "active" | "committed" | "rolled_back";
  
  // 操作记录
  operations: {
    id: string;
    type: "file_write" | "file_delete" | "bash_command";
    target: string;
    
    // 备份（用于回滚）
    backup?: {
      type: "file" | "git_stash";
      location: string;
    };
    
    status: "pending" | "completed" | "rolled_back";
  }[];
  
  // 回滚策略
  rollbackStrategy: "immediate" | "manual" | "checkpoint";
}
```

**备份策略**：

```yaml
backup:
  # 文件修改前自动备份
  fileModification:
    enabled: true
    location: "~/.openclaw/backups/"
    retention: 7d           # 保留 7 天
  
  # 删除操作额外保护
  fileDeletion:
    enabled: true
    moveToTrash: true       # 移到回收站而非直接删除
    confirmRequired: true   # 需要用户确认
  
  # Git 集成
  git:
    autoCommit: true        # 执行前自动 commit
    stashOnConflict: true   # 冲突时 stash
```

**回滚示例**：

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ 任务执行失败，是否回滚？                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 失败原因：测试失败（3/12 测试未通过）                           │
                                                                 │
│ 已完成的操作：                                                  │
│   ✅ 修改  auth/login.ts      ← 可回滚                         │
│   ✅ 修改  auth/utils.ts      ← 可回滚                         │
│   ❌ 测试失败                                                  │
│                                                                 │
│ [🔄 回滚所有更改] [🔍 查看失败详情] [✏️ 手动修复] [⏭️ 保留更改] │
└─────────────────────────────────────────────────────────────────┘
```

---

#### 7.14 分层规则系统

**问题**：规则不够灵活，无法针对特定场景

**解决方案**：分层规则

```
规则优先级（从高到低）：

1. 项目规则 ~/.openclaw/rules/           # 最高优先级
   └── 适用于当前项目/工作区

2. 用户规则 ~/config/openclaw/rules/     # 中等优先级
   └── 适用于该用户的所有项目

3. 全局规则（系统内置）                   # 最低优先级
   └── 默认规则，可被覆盖
```

**示例**：

```yaml
# 项目规则：严格模式
~/.openclaw/rules/R002.yaml
id: R002
name: 生产环境保护
priority: P0
rules:
  - match: { env: "production" }
    action: require_confirmation
    message: "检测到生产环境操作，需要确认"
  - match: { operation: "delete", fileType: "*.sql" }
    action: block
    message: "禁止删除 SQL 文件"

# 用户规则：个人偏好
~/config/openclaw/rules/R003.yaml
id: R003
name: 代码风格偏好
priority: P1
rules:
  - match: { language: "typescript" }
    style: "no-comments"    # 不添加注释
```

---

### 8. 改进后的完整架构（v2.0）

```
┌─────────────────────────────────────────────────────────────────┐
│                          用户（皇帝）                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      路由层（GLM-4.7）                          │
│  简单问题 → 直接回答 < 3s                                       │
│  中等任务 → 单部门执行 < 30s                                    │
│  复杂任务 → 三省流程                                            │
│  紧急任务 → 跳过审议，直接执行                                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    共享上下文层（新增）                          │
│  - 用户意图（完整）                                             │
│  - 任务状态                                                     │
│  - 关键决策点                                                   │
│  - 压缩历史 < 5KB                                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌───────────────┐                      ┌───────────────┐
        │   中书省      │◄───── 申诉 ─────────│   门下省      │
        │   (决策)      │                      │   (审议)      │
        │   GLM-4.7     │      二次审议仍驳回   │   GLM-5       │
        └───────────────┘          ↓           └───────────────┘
                                询问用户
                │                               │
                └───────────────┬───────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    尚书省（协调层 + 资源管理）                   │
│  - 任务调度                                                     │
│  - 资源锁管理                                                   │
│  - 事件总线                                                     │
│  - 检查点系统                                                   │
│  - 死锁检测                                                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          六部                                   │
│                                                                 │
│  吏部(GLM-4.7)    户部(GLM-4.7)    礼部(GLM-4.7)               │
│  配置管理          资源管理          通信文档                    │
│                                                                 │
│  兵部(GLM-5)      刑部(GLM-4.7)    工部(GLM-5)                 │
│  安全防御          日志+测试(独立)   工程开发                    │
│                                                                 │
│  资源锁保护 | 事件驱动协作 | 动态模型选择                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    工部 Sub Agents（隔离执行）                   │
│                                                                 │
│  Coder Agent(GLM-4.7/5)  Tester → 刑部（独立）  Fixer(GLM-5)   │
│  动态模型选择                               自迭代（最多5次）    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    事务与回滚系统（新增）                        │
│  - 自动备份                                                     │
│  - 事务管理                                                     │
│  - 回滚恢复                                                     │
│  - Git 集成                                                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    门下省验收                                    │
│  - 代码质量检查                                                 │
│  - 安全审查                                                     │
│  - 测试验证（刑部独立测试）                                      │
│  - 不通过 → 驳回重做（最多 2 次）                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    成本与监控（新增）                            │
│  - 实时成本追踪                                                 │
│  - 预算控制 ($5/任务, $100/天, $2000/月)                        │
│  - 预算警告                                                     │
│  - 超限暂停                                                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    进度汇报（新增）                              │
│  - 实时进度流                                                   │
│  - 预览/确认模式                                                │
│  - 成本报告                                                     │
│  - 回滚选项                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

### 9. 关键机制总结（v2.0）

| 机制 | 位置 | 作用 | 新增/改进 |
|-----|------|------|----------|
| 路由层 | 入口 | 按复杂度分流 | 新增 |
| 共享上下文 | 全局 | 上下文传递 < 5KB | 新增 |
| 封驳迭代 | 门下省 → 中书省 | 确保计划合理 | + 申诉机制 |
| Sub Agent 自迭代 | 工部内部 | 确保代码正确 | + 动态模型 |
| 验收迭代 | 门下省 → 尚书省 | 确保结果达标 | 不变 |
| 申诉机制 | 中书省 ↔ 门下省 | 处理误判 | 新增 |
| 紧急执行 | 路由层 | 跳过审议 | 新增 |
| 检查点 | 尚书省 | 崩溃恢复 | 新增 |
| 成本预算 | 全局 | 防止失控 | 新增 |
| 动态模型 | 六部 | 优化成本 | 新增 |
| 实时进度 | 全局 | 可见性 | 新增 |
| 预览确认 | 入口 | 用户控制 | 新增 |
| 资源锁 | 尚书省 | 并发控制 | 新增 |
| 事件总线 | 尚书省 | 协作优化 | 新增 |
| 测试独立 | 刑部 | 质量保证 | 改进 |
| 事务回滚 | 全局 | 安全性 | 新增 |
| 分层规则 | 全局 | 灵活性 | 新增 |
| Context 压缩 | 中书省 | 长对话优化 | 不变 |
| Todo 持久化 | 全局 | 任务进度保持 | 不变 |
| 规则系统 | 全局 | 用户控制 | + 分层 |

---

### 10. 与 Claude Code 对比（v2.0）

| 特性 | Claude Code | 三省六部系统 v2.0 |
|-----|-------------|-------------------|
| 决策层 | 无明确分离 | 中书省（GLM-4.7）|
| 审议层 | 无 | 门下省（GLM-5）+ 申诉 |
| 执行层 | Main + Sub Agent | 路由层 + 尚书省 + 六部 + Sub Agent |
| 验证机制 | Bash 测试 | 门下省 + 刑部独立测试 |
| 迭代机制 | 自动重试 | 三层迭代 + 申诉 + 紧急 |
| 模型分层 | Haiku/Sonnet | GLM-4.7/GLM-5（动态选择）|
| 脏上下文隔离 | Sub Agent | 工部 Sub Agent |
| Todo 管理 | TodoWrite | 中书省 + 全局持久化 |
| 成本控制 | 无 | 分层预算 + 实时监控 |
| 崩溃恢复 | 无 | 检查点系统 |
| 回滚机制 | 无 | 事务 + 备份 |
| 进度可见 | 无 | 实时进度流 |
| 用户控制 | 无 | 预览/确认模式 |
| 并发控制 | 无 | 资源锁系统 |
| 规则系统 | 无 | 分层规则 |
| 测试独立性 | 无 | 刑部独立测试 |

| 机制 | 位置 | 作用 | 迭代次数 |
|-----|------|------|---------|
| 封驳迭代 | 门下省 → 中书省 | 确保计划合理 | 最多 3 次 |
| Sub Agent 自迭代 | 工部内部 | 确保代码正确 | 最多 5 次 |
| 验收迭代 | 门下省 → 尚书省 | 确保结果达标 | 最多 2 次 |
| Context 压缩 | 中书省 | 长对话优化 | 自动触发 |
| Todo 持久化 | 全局 | 任务进度保持 | 每次更新 |

### 7. 与 Claude Code 对比

| 特性 | Claude Code | 三省六部系统 |
|-----|-------------|-------------|
| 决策层 | 无明确分离 | 中书省（GLM-4.7）|
| 审议层 | 无 | 门下省（GLM-5）|
| 执行层 | Main Agent + Sub Agent | 尚书省 + 六部 + Sub Agent |
| 验证机制 | Bash 工具运行测试 | 门下省验收 + Sub Agent 自验证 |
| 迭代机制 | 自动重试 | 三层迭代（封驳 + 自迭代 + 验收）|
| 模型分层 | Haiku/Sonnet | GLM-4.7/GLM-5 |
| 脏上下文隔离 | Sub Agent | 工部 Sub Agent |
| Todo 管理 | TodoWrite | 中书省 + 全局持久化 |

---

### 11. 实施计划（v2.0）

**Phase 0：基础设施（1-2 天）**
- [ ] 路由层实现（任务分类）
- [ ] 共享上下文层
- [ ] 规则系统框架

**Phase 1：核心框架（2-3 天）**
- [ ] 中书省决策逻辑
- [ ] 门下省审议逻辑 + 申诉机制
- [ ] 尚书省协调逻辑 + 资源锁 + 事件总线

**Phase 2：六部实现（2-3 天）**
- [ ] 工部（含 Sub Agents + 动态模型选择）
- [ ] 兵部（安全）
- [ ] 刑部（日志 + 独立测试）
- [ ] 其他三部（吏、户、礼）

**Phase 3：迭代与安全（1-2 天）**
- [ ] 三层迭代机制
- [ ] 申诉流程
- [ ] 紧急执行模式
- [ ] 检查点与崩溃恢复
- [ ] 事务与回滚系统

**Phase 4：成本与监控（1-2 天）**
- [ ] 成本预算系统（$5/$100/$2000）
- [ ] 实时成本追踪
- [ ] 预算警告与超限暂停

**Phase 5：用户体验（1-2 天）**
- [ ] 实时进度流
- [ ] 预览/确认模式
- [ ] 成本报告

**Phase 6：测试与优化（1-2 天）**
- [ ] 完整流程测试
- [ ] 性能调优
- [ ] 文档完善

**总计：9-16 天**

---

*持续更新中...*

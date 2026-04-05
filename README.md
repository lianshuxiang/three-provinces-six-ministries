# 三省六部 Agent 系统

> 基于 Claude Code 自迭代机制的智能 Agent 栶构，融合中国古代三省六部制

## 📊 项目状态

```
✅ Phase 0 - 基础设施     (100%) - 完成
✅ Phase 1 - 核心框架     (100%) - 完成
✅ Phase 2 - 六部实现     (100%) - 完成
✅ Phase 3 - 迭代验证     (100%) - 完成
✅ Phase 4 - 成本监控     (100%) - 完成
✅ Phase 5 - 用户体验     (100%) - 完成
✅ Phase 6 - 测试优化     (100%) - 完成

总代码量: 13.5KB (11196 行 TypeScript)
总文件数: 32 个
Git 提交: 8 次
```

## 📋 项目概述

本系统将 Claude Code 的 Tool-Use 循环、验证驱动、自动重试等机制与中国古代三省六部制相结合，构建一个具有多层级迭代、动态规则注入、成本控制的智能 Agent 系统。

**核心特性:**
- 🏛️ **三省流程**: 中书省 (决策) → 门下省 (审议) → 尚书省 (协调)
- ⚙️ **六部执行**: 吏、户、礼、兵、刑、工六部分工协作
- 🔄 **三层迭代**: 封驳迭代 + Sub Agent 自迭代 + 验收迭代
- 💰 **成本控制**: $5/任务、$100/天、$2000/月 预算上限
- 🛡️ **规则系统**: 动态加载、优先级控制、运行时生效
- 🚨 **紧急模式**: 检测紧急关键词，跳过审议直接执行
- 📊 **质量门控**: 5 维度质量检查 (代码/测试/安全/性能/完成度)
- 🎨 **用户体验**: 进度显示、预览模式、友好错误、回滚机制

## 🏗️ 架构

```
┌─────────────────────────────────────────────┐
│              用户（皇帝）                    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          路由层（GLM-4.7）                  │
│  简单 → 直接 | 中等 → 单部门 | 复杂 → 三省  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│        共享上下文层（< 5KB 压缩历史）        │
└─────────────────────────────────────────────┘
                    ↓
    ┌───────────────┼───────────────┐
    ↓               ↓               ↓
┌────────┐      申诉        ┌────────┐
│ 中书省 │◄─────────────────│ 门下省 │
│ (决策) │                   │ (审议) │
│GLM-4.7 │                   │ GLM-5  │
└────────┘                   └────────┘
    └───────────────┬───────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         尚书省（协调 + 资源锁 + 事件）       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│              六部（执行层）                  │
│  吏部(GLM-4.7)  户部(GLM-4.7)  礼部(GLM-4.7)│
│  兵部(GLM-5)    刑部(GLM-4.7)  工部(GLM-5)  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         工部 Sub Agents（隔离执行）          │
│  Coder → Tester → Fixer（自迭代 ≤5次）      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         质量门控（5 维度检查）              │
│  代码(25%) + 测试(25%) + 安全(20%)          │
│  性能(15%) + 完成度(15%)                   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         成本监控（实时追踪）                │
│  成本追踪 + 预算警告 + 优化建议            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         用户体验（友好交互）                │
│  进度显示 + 预览模式 + 错误处理 + 回滚     │
└─────────────────────────────────────────────┘
```

## 📁 目录结构

```
~/.openclaw/
├── agents/                  # Agent 系统核心
│   ├── types.ts            # 类型定义 (63 个接口)
│   ├── router.ts           # 路由层
│   ├── shared-context.ts   # 共享上下文
│   ├── rule-loader.ts      # 规则加载器
│   ├── orchestrator.ts     # 主协调器
│   ├── index.ts            # 统一导出
│   ├── zhongshu/           # 中书省 (决策层)
│   ├── menxia/             # 门下省 (审议层)
│   ├── shangshu/           # 尚书省 (协调层)
│   ├── ministries/         # 六部 (执行层)
│   │   ├── gongbu/        # 工部 (工程)
│   │   ├── bingbu/        # 兵部 (安全)
│   │   ├── xingbu/        # 刑部 (测试)
│   │   ├── libu/          # 吏部 (配置)
│   │   ├── hubu/          # 户部 (资源)
│   │   └── libu2/         # 礼部 (通信)
│   ├── iteration/         # 迭代系统
│   │   ├── rejection-handler.ts    # 封驳迭代
│   │   ├── appeal-handler.ts       # 申诉处理
│   │   ├── acceptance-handler.ts   # 验收迭代
│   │   └── quality-gate.ts         # 质量门控
│   ├── cost/              # 成本监控
│   │   ├── tracker.ts             # 成本追踪
│   │   ├── warning.ts             # 预算警告
│   │   └── optimizer.ts           # 成本优化
│   ├── ux/                # 用户体验
│   │   ├── progress.ts            # 进度显示
│   │   ├── error-handler.ts       # 错误处理
│   │   ├── preview-mode.ts        # 预览模式
│   │   └── rollback.ts            # 回滚机制
│   └── tests/             # 测试套件
│       ├── test-zhongshu.ts
│       ├── test-menxia.ts
│       ├── test-integration.ts
│       └── test-performance.ts
├── rules/                   # 规则系统
│   ├── rules.json          # 规则索引
│   ├── R001.yaml           # 非技术问题反馈
│   ├── R002.yaml           # 成本预算控制
│   ├── R003.yaml           # 紧急强制执行
│   └── R004.yaml           # 预览确认模式
└── workspace/               # 工作区
    ├── memory/              # 记忆文件
    └── USAGE.md             # 使用文档
```

## 🚀 快速开始

### 安装

```bash
# 克隆仓库
git clone <repo-url>
cd openclaw

# 安装依赖
npm install
```

### 基础使用

```typescript
import { SystemOrchestrator } from './agents/orchestrator';

const orchestrator = new SystemOrchestrator();

// 处理用户请求
const result = await orchestrator.processRequest('创建一个简单的 Hello World 程序');

console.log(result);
```

### 直接使用三省

```typescript
import { zhongshuProvince } from './agents/zhongshu/province';
import { menxiaProvince } from './agents/menxia/province';
import { shangshuProvince } from './agents/shangshu/province';

// 中书省生成诏书
const edict = await zhongshuProvince.generateEdict(
  '创建用户认证系统',
  '需要实现 JWT 认证',
  context
);

// 门下省审议
const approval = await menxiaProvince.reviewEdict(edict);

if (approval.status === 'approved') {
  // 尚书省执行
  await shangshuProvince.executeEdict(edict);
}
```

## 📖 API 文档

详细 API 文档请参考 [USAGE.md](workspace/USAGE.md)

### 核心组件

| 组件 | 文件 | 职责 |
|------|------|------|
| SystemOrchestrator | orchestrator.ts | 主协调器 |
| ZhongshuProvince | zhongshu/province.ts | 决策层 |
| MenxiaProvince | menxia/province.ts | 审议层 |
| ShangshuProvince | shangshu/province.ts | 协调层 |
| CostTracker | cost/tracker.ts | 成本追踪 |
| QualityGateSystem | iteration/quality-gate.ts | 质量门控 |
| ProgressDisplay | ux/progress.ts | 进度显示 |

## 🎯 模型分配

| 组件 | 模型 | 原因 |
|------|------|------|
| 路由层 | GLM-4.7 | 快速分类，成本低 |
| 中书省 | GLM-4.7 | 任务拆分，中等复杂度 |
| 门下省 | GLM-5 | 审议决策，强推理 |
| 尚书省 | GLM-5 | 协调复杂，需强推理 |
| 吏/户/礼/刑部 | GLM-4.7 | 标准任务 |
| 兵/工部 | GLM-5 | 安全/工程需强推理 |

## 📊 成本预算

| 类型 | 限额 | 说明 |
|------|------|------|
| 单任务 | $5.00 | 每个任务的最大成本 |
| 每日 | $100.00 | 每天的总成本上限 |
| 每月 | $2000.00 | 每月的总成本上限 |

### 模型定价 (每 1K tokens)

| 模型 | 输入 | 输出 | 缓存 |
|------|------|------|------|
| GLM-4.7 | $0.0005 | $0.001 | $0.00005 |
| GLM-5 | $0.001 | $0.002 | $0.0001 |

## 🔄 迭代机制

| 迭代类型 | 最多次数 | 触发条件 |
|----------|----------|----------|
| 封驳迭代 | 3 | 门下省驳回 |
| Sub Agent 自迭代 | 5 | 测试失败 |
| 验收迭代 | 2 | 验收不通过 |

## 🛡️ 訡型分配

| 部门 | 模型 | 职责 |
|------|------|------|
| 中书省 | GLM-4.7 | 决策层：诏书生成、任务拆分、申诉机制 |
| 门下省 | GLM-5 | 审议层：6项检查、批准/驳回、最终验收 |
| 尚书省 | GLM-5 | 协调层：任务调度、资源锁、事件总线 |
| 工部 | GLM-5 | 代码实现、Sub Agent 管理 |
| 兵部 | GLM-5 | 安全检查、权限验证 |
| 刑部 | GLM-4.7 | 独立测试、日志审计 |
| 吏部 | GLM-4.7 | 配置管理、环境变量 |
| 户部 | GLM-4.7 | 资源管理、成本预算 |
| 礼部 | GLM-4.7 | 通信文档、通知发送 |

## 📜 Git 提交历史

```
3e746ea (HEAD) - feat: Phase 4 - 成本监控系统完成 (2026-04-05)
3fee155 - feat: Phase 3 - 迭代与验证系统完成 (2026-04-05)
d93780c - feat: Phase 2 - 六部实现完成 (2026-04-05)
80a464c - feat: Phase 1 - 核心框架完成 (2026-04-05)
474abc2 - feat: Phase 1 - 核心框架完成 (2026-04-05)
6e64588 - docs: 添加项目 README (2026-04-05)
c6480ea - feat: Phase 0 - 基础设施完成 (2026-04-05)
```

## 📝 相关文档

- [使用文档](workspace/USAGE.md)
- [架构设计](workspace/memory/claude-code-architecture.md)
- [Phase 1 完成](workspace/memory/phase1-complete.md)
- [Phase 2 完成](workspace/memory/phase2-complete.md)
- [Phase 3 完成](workspace/memory/phase3-complete.md)
- [Phase 4 完成](workspace/memory/phase4-complete.md)

## 🤝 贡献

这是个人项目，暂不接受外部贡献。

## 📄 许可

MIT

---

**构建时间**: 2026-04-05  
**当前版本**: v1.0.0  
**状态**: ✅ 完成

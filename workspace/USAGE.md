# 三省六部系统 - 使用文档

=======
=======
使用文档

## 📋 前置要求

- Node.js >= 16
- TypeScript >= 5.0
- GLM-4.7 或 GLM-5 API Key

- 上下文窗口： 8k-32k tokens

## 🚀 快速开始

### 1. 基础使用

```typescript
import { SystemOrchestrator } from './agents/orchestrator';

const orchestrator = new SystemOrchestrator();

// 处理用户请求
const result = await orchestrator.processRequest('创建一个简单的 Hello World 程序');

console.log(result);
```

### 2. 直接使用三省

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

### 3. 使用六部

```typescript
import { gongbuMinistry } from './agents/ministries/gongbu/ministry';

// 工部执行编码任务
const iterations = await gongbuMinistry.executeTask(task, context);

console.log('Iterations:', iterations);
```

## 🏗 架构说明

### 三省

| 省份 | 模型 | 职责 |
|------|------|------|
| 中书省 | GLM-4.7 | 决策层：诏书生成、任务拆分、申诉机制 |
| 门下省 | GLM-5 | 审议层：6项检查、批准/驳回、最终验收 |
| 尚书省 | GLM-5 | 协调层：任务调度、资源锁、事件总线 |

### 六部

| 部门 | 模型 | 职责 |
|------|------|------|
| 工部 | GLM-5 | 代码实现、Sub Agent 管理 |
| 兵部 | GLM-5 | 安全检查、权限验证 |
| 刑部 | GLM-4.7 | 独立测试、日志审计 |
| 吏部 | GLM-4.7 | 配置管理、环境变量 |
| 户部 | GLM-4.7 | 资源管理、成本预算 |
| 礼部 | GLM-4.7 | 通信文档、报告生成 |

### 迭代机制

| 迭代类型 | 最多次数 | 触发条件 |
|----------|----------|----------|
| 封驳迭代 | 3 | 门下省驳回 |
| Sub Agent 自迭代 | 5 | 测试失败 |
| 验收迭代 | 2 | 验收不通过 |

### 质量门控

| 维度 | 阈值 | 权重 |
|------|------|------|
| 代码质量 | 80 | 25% |
| 测试覆盖 | 70 | 25% |
| 安全评分 | 85 | 20% |
| 性能指标 | 75 | 15% |
| 完成度 | 90 | 15% |

### 成本监控

| 预算类型 | 限额 |
|----------|------|
| 单任务 | $5.00 |
| 每日 | $100.00 |
| 每月 | $2000.00 |

## 📖 API 文档

### SystemOrchestrator

主协调器，统一入口。

```typescript
const orchestrator = new SystemOrchestrator();

// 处理请求
const result = await orchestrator.processRequest(userRequest);

// 获取状态
const status = orchestrator.getStatus();
```

### ZhongshuProvince
决策层，生成诏书和拆分任务。

```typescript
// 生成诏书
const edict = await zhongshuProvince.generateEdict(
  title,
  description,
  context
);

// 处理申诉
const appealResult = await zhongshuProvince.handleAppeal(
  edict,
  appealReason
);
```

### MenxiaProvince
审议层，检查和批准诏书。

```typescript
// 宣议诏书
const approval = await menxiaProvince.reviewEdict(edict);

// 最终验收
const acceptance = await menxiaProvince.performFinalAcceptance(
  edict,
  executionRecords
);
```

### ShangshuProvince
协调层，调度和执行任务。

```typescript
// 执行诏书
const records = await shangshuProvince.executeEdict(edict);

// 创建检查点
const checkpoint = shangshuProvince.createCheckpoint(
  taskId,
  data,
);
```

### CostTracker
成本追踪，预算管理。

```typescript
import { costTracker } from './agents/cost/tracker';

// 记录成本
costTracker.recordCost({
  taskId: 'task-001',
  agent: 'coder',
  model: 'glm-5',
  tokensIn: 1000,
  tokensOut: 500,
  tokensCached: 800,
  cacheHit: true,
});

// 获取摘要
const summary = costTracker.getSummary('task-001');

// 检查预算
const budget = costTracker.checkBudget('task-001');

// 生成报告
const report = costTracker.generateReport('task-001');
```

### ProgressDisplay
进度显示，实时跟踪。

```typescript
import { progressDisplay } from './agents/ux/progress';

// 开始任务
progressDisplay.startTask('task-001');

// 更新阶段
progressDisplay.updateStage('execution', {
  completedTasks: 1,
  totalTasks: 5,
});

// 生成报告
const report = progressDisplay.generateTextReport();
```

### ErrorHandler
错误处理，友好提示。

```typescript
import { errorHandler } from './agents/ux/error-handler';

// 处理错误
const friendlyError = errorHandler.handleError(error);

// 生成用户消息
const userMessage = errorHandler.generateUserMessage(friendlyError);

// 检查是否可重试
const retryable = errorHandler.isRetryable(error);
```

## 🎯 最佳实践

### 1. 任务拆分

- 单个任务不超过 5 个子任务
- 依赖关系清晰，避免循环
- 优先级合理分配

### 2. 成本控制

- 使用缓存提高命中率
- 简单任务用 GLM-4.7
- 复杂任务用 GLM-5

### 3. 错误处理

- 使用预览模式检查高风险操作
- 讍友好的错误消息
- 及时回滚

### 4. 质量保证

- 质量门控阈值合理
- 测试覆盖充分
- 代码质量检查

## 📊 性能指标

| 指标 | 目标 |
|------|------|
| 单任务成本 | < $0.50 |
| 平均迭代次数 | < 2 |
| 缓存命中率 | > 70% |
| 任务成功率 | > 90% |

## 🔍 故障排查

### 常见问题

1. **成本超支**
   - 检查任务复杂度
   - 优化提示词
   - 使用缓存

2. **迭代过多**
   - 简化任务
   - 提高初始质量
   - 调整检查标准

3. **权限不足**
   - 使用预览模式
   - 装置需要确认
   - 管理员授权

## 📝 开发指南

### 添加新规则

1. 创建规则文件 `rules/R005.yaml`
2. 在 `rules/rules.json` 中注册
3. 実现规则逻辑

### 添加新部门

1. 创建部门文件 `agents/ministries/new-bu/ministry.ts`
2. 实现接口
3. 在 `ministries/index.ts` 中导出

### 添加质量门控

1. 定义门控规则
2. 实现检查逻辑
3. 更新权重分配

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
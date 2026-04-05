# 🚀 快速开始指南

## 📋 前置要求

- ✅ Node.js >= 16.0.0
- ✅ npm 或 yarn
- ✅ GLM API Key (从 https://open.bigmodel.cn/ 获取)

## 🔧 安装步骤

### 1. 安装依赖

```bash
cd /home/admin/.openclaw
npm install
```

### 2. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置文件
nano .env
```

在 `.env` 文件中设置你的 API Key：

```bash
GLM_API_KEY=your_actual_api_key_here
```

### 3. 编译 TypeScript

```bash
npm run build
```

## 🎯 运行示例

### 运行所有示例

```bash
npm run example
```

### 运行特定示例

```bash
# 示例 1: 使用主协调器
npm run example 1

# 示例 2: 直接使用三省
npm run example 2

# 示例 3: 成本监控
npm run example 3

# 示例 4: 进度显示
npm run example 4
```

## 💻 使用方法

### 方法 1: 使用主协调器（推荐）

```typescript
import { SystemOrchestrator } from './agents/orchestrator';

const orchestrator = new SystemOrchestrator();

// 处理用户请求
const result = await orchestrator.processRequest('创建一个简单的 Hello World 程序');
console.log(result);
```

### 方法 2: 直接使用三省

```typescript
import { zhongshuProvince } from './agents/zhongshu/province';
import { menxiaProvince } from './agents/menxia/province';
import { shangshuProvince } from './agents/shangshu/province';

// 1. 中书省生成诏书
const edict = await zhongshuProvince.generateEdict(
  '创建用户认证系统',
  '需要实现 JWT 认证',
  context
);

// 2. 门下省审议
const approval = await menxiaProvince.reviewEdict(edict);

if (approval.status === 'approved') {
  // 3. 尚书省执行
  await shangshuProvince.executeEdict(edict);
}
```

### 方法 3: 使用单个部门

```typescript
import { gongbuMinistry } from './agents/ministries/gongbu/ministry';

// 工部执行编码任务
const iterations = await gongbuMinistry.executeTask(task, context);
console.log('迭代次数:', iterations.length);
```

## 🔍 功能演示

### 成本监控

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

// 查看成本报告
const report = costTracker.generateReport('task-001');
console.log(report);
```

### 进度显示

```typescript
import { progressDisplay } from './agents/ux/progress';

// 开始任务
progressDisplay.startTask('task-001');

// 更新进度
progressDisplay.updateStage('execution', {
  completedTasks: 2,
  totalTasks: 5
});

// 完成任务
progressDisplay.completeTask();

// 查看报告
const report = progressDisplay.generateTextReport();
console.log(report);
```

### 错误处理

```typescript
import { errorHandler } from './agents/ux/error-handler';

try {
  // 执行任务
  await someTask();
} catch (error) {
  // 友好的错误消息
  const friendlyError = errorHandler.handleError(error);
  console.log(errorHandler.generateUserMessage(friendlyError));
  
  // 检查是否可重试
  if (errorHandler.isRetryable(error)) {
    console.log('可以重试此任务');
  }
}
```

## 📊 监控和调试

### 查看成本统计

```bash
# 查看今日成本
npm run cost:today

# 查看本月成本
npm run cost:month

# 导出成本报告
npm run cost:export
```

### 查看任务历史

```bash
# 查看最近任务
npm run tasks:recent

# 查看任务详情
npm run tasks:show <task-id>
```

## 🎨 自定义配置

### 调整成本预算

编辑 `.env` 文件：

```bash
COST_BUDGET_PER_TASK=10    # 提高单任务预算
COST_BUDGET_PER_DAY=200    # 提高每日预算
COST_BUDGET_PER_MONTH=5000 # 提高每月预算
```

### 调整质量门控

编辑 `agents/iteration/quality-gate.ts`：

```typescript
const THRESHOLDS = {
  codeQuality: 80,    // 代码质量阈值
  testCoverage: 70,   // 测试覆盖阈值
  securityScore: 85,  // 安全评分阈值
  performanceScore: 75, // 性能指标阈值
  completeness: 90    // 完成度阈值
};
```

### 添加新规则

1. 创建规则文件 `rules/R005.yaml`
2. 在 `rules/rules.json` 中注册
3. 重启系统

## 🐛 故障排查

### 问题 1: API Key 无效

```bash
# 检查 API Key 是否设置
echo $GLM_API_KEY

# 测试 API 连接
npm run test:api
```

### 问题 2: 成本超支

```bash
# 查看当前成本
npm run cost:status

# 清除成本记录（谨慎使用）
npm run cost:reset
```

### 问题 3: 任务执行失败

```bash
# 查看错误日志
npm run logs:error

# 查看详细日志
DEBUG=true npm run example
```

## 📚 下一步

1. **阅读完整文档**: [USAGE.md](workspace/USAGE.md)
2. **了解架构**: [README.md](README.md)
3. **查看 API 文档**: [workspace/USAGE.md#api-文档](workspace/USAGE.md#api-文档)
4. **运行测试**: `npm test`

## 🎯 推荐工作流

### 新手推荐

1. 从简单任务开始
2. 使用主协调器
3. 观察进度显示
4. 检查成本报告

### 高级用户

1. 直接使用三省
2. 自定义质量门控
3. 调整迭代参数
4. 优化成本配置

## 💡 最佳实践

1. **任务拆分**: 单个任务不超过 5 个子任务
2. **成本控制**: 使用缓存，简单任务用 GLM-4.7
3. **错误处理**: 使用预览模式检查高风险操作
4. **质量保证**: 定期检查质量门控报告

## 🆘 获取帮助

- 📖 查看文档: `workspace/USAGE.md`
- 🐛 报告问题: GitHub Issues
- 💬 社区讨论: Discord

---

**准备好了吗？开始你的第一个任务吧！** 🚀

```bash
npm run example 1
```

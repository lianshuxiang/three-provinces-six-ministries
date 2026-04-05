# 🎯 如何开始使用三省六部系统

## 📋 快速开始（3 步）

### 第 1 步： 安装依赖

```bash
cd /home/admin/.openclaw
npm install
```

### 第 2 步: 配置 API Key

```bash
# 复制配置文件
cp .env.example .env

# 编辑并设置你的 GLM API Key
nano .env
```

在 `.env` 文件中添加:
```bash
GLM_API_KEY=your_glm_api_key_here
```

**获取 API Key**: https://open.bigmodel.cn/

### 第 3 步: 编译并运行

```bash
# 编译 TypeScript
npm run build

# 运行示例
npm run example
```

## 🚀 运行示例

### 示例 1: 主协调器（推荐新手）

```bash
npm run example:1
```

### 示例 2: 直接使用三省

```bash
npm run example:2
```

### 示例 3: 成本监控

```bash
npm run example=3
```

### 示例 4: 进度显示

```bash
npm run example=4
```

## 💻 在代码中使用

### TypeScript

```typescript
import { SystemOrchestrator } from './agents/orchestrator';

const orchestrator = new SystemOrchestrator();
const result = await orchestrator.processRequest('创建一个简单的 Hello World 程序');
```

### JavaScript (CommonJS)

```javascript
const { SystemOrchestrator } = './agents/orchestrator';

const orchestrator = new SystemOrchestrator();
const result = await orchestrator.processRequest('创建一个简单的 Hello World 程序');
```

## 📊 查看监控

### 成本报告

```bash
npm run cost:status
```

### 测试

```bash
npm test
```

## 📚 更多信息

- **完整文档**: [QUICK-START.md](workspace/QUICK-START.md)
- **使用文档**: [USAGE.md](workspace/USAGE.md)
- **项目说明**: [README.md](README.md)

## ⚠️ 重要提示

1. **确保有 GLM API Key** - 没有 API Key 系统无法运行
2. **检查成本预算** - 默认 $5/任务，可调整
3. **从简单任务开始** - 先测试简单任务，再尝试复杂任务

## 🎉 准备好了吗开始吧！

```bash
npm install
npm run example
```

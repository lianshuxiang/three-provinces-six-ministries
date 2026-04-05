# 🔧 三省六部系统 - API Key 配置指南

## 📋 配置步骤（3 分钟完成）

### 步骤 1: 获取你的 GLM API Key

如果你还没有，访问：
- 🔗 https://open.bigmodel.cn/
- 注册账号
- 进入控制台 → API Keys
- 复制你的 API Key

---

### 步骤 2: 配置到系统

#### 方法 A: 使用文本编辑器（推荐）

```bash
cd /home/admin/.openclaw
nano .env
```

找到这一行：
```
GLM_API_KEY=your_glm_api_key_here
```

替换为你的实际 API Key：
```
GLM_API_KEY=your_actual_api_key_from_bigmodel
```

按 `Ctrl + O` 保存，`Ctrl + X` 退出

---

#### 方法 B: 使用命令行（快速）

```bash
cd /home/admin/.openclaw

# 替换 YOUR_API_KEY 为你的实际 Key
sed -i 's/your_glm_api_key_here/YOUR_ACTUAL_API_KEY/' .env
```

---

### 步骤 3: 验证配置

```bash
# 检查配置
cat .env | grep GLM_API_KEY

# 应该显示：
# GLM_API_KEY=your_actual_key...
```

---

## 🧪 测试是否配置成功

### 测试 1: 运行示例

```bash
cd /home/admin/.openclaw
npm install  # 如果还没安装依赖
npm run example
```

**期望输出：**
```
✅ GLM API 连接成功
✅ 三省六部系统就绪
```

---

### 测试 2: 简单任务

```bash
npm run example:1
```

这会运行一个简单的测试任务。

---

## 📊 成本说明

### GLM 模型定价（参考）

| 模型 | 输入 ($/1K tokens) | 输出 ($/1K tokens) | 缓存 ($/1K tokens) |
|------|-------------------|-------------------|-------------------|
| GLM-4-Flash | $0.0001 | $0.0001 | $0.00001 |
| GLM-4 | $0.014 | $0.014 | $0.0007 |
| GLM-4-Plus | $0.05 | $0.05 | $0.0025 |
| GLM-4-Air | $0.001 | $0.001 | $0.00005 |
| GLM-4-Airx | $0.001 | $0.001 | $0.00005 |
| GLM-4-Long | $0.001 | $0.001 | $0.00005 |

**三省六部系统使用：**
- 中书省、吏/户/礼/刑部：GLM-4-Flash（快速、便宜）
- 门下省、尚书省、兵/工部：GLM-4（质量高）

### 预算控制

系统默认设置：
- 单任务最大：$5
- 每日最大：$100
- 每月最大：$2000

可以在 `.env` 文件中调整。

---

## 🎯 配置完成后

### 你可以：

1. **直接向我下达任务**
   ```
   "创建一个 HTTP 服务器"
   "编写一个文件搜索工具"
   "生成一个 REST API"
   ```

2. **我会自动：**
   - 调用三省六部系统
   - 中书省分析任务
   - 门下省审核方案
   - 尚书省协调执行
   - 六部实施开发
   - 返回高质量结果

3. **实时监控：**
   ```bash
   npm run cost:status  # 查看成本使用情况
   ```

---

## 🔒 安全提示

**⚠️ 重要：**
- ✅ `.env` 文件已添加到 `.gitignore`
- ✅ API Key 不会被提交到 Git
- ✅ 只在本地存储
- ⚠️ 不要分享你的 API Key
- ⚠️ 定期轮换 Key（建议每 3 个月）

---

## 🆘 常见问题

### Q: 提示 "API Key 无效"
**A:** 检查 `.env` 文件中的 Key 是否正确，没有多余空格

### Q: 如何查看当前配置？
```bash
cat .env
```

### Q: 如何修改预算？
编辑 `.env` 文件中的：
```
COST_BUDGET_PER_TASK=5
COST_BUDGET_PER_DAY=100
COST_BUDGET_PER_MONTH=2000
```

### Q: 如何查看 API 调用日志？
```bash
# 修改 .env
LOG_LEVEL=debug
DEBUG=true
```

---

## ✅ 配置完成后告诉我

**你现在可以：**

1. **配置好 API Key** → 编辑 `/home/admin/.openclaw/.env`
2. **告诉我"配置完成"** → 我会测试连接
3. **开始下达任务** → 直接告诉我你想做什么

---

**准备好了吗？现在就去配置你的 API Key！** 🚀

```bash
cd /home/admin/.openclaw
nano .env
```

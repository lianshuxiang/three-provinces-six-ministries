# 🏛️ 御史台 Agent - 权限体系

**版本**: 1.0.0
**创建时间**: 2026-04-06
**最后更新**: 2026-04-06

---

## 📋 权限概览

御史台在三省六部系统中拥有**特殊地位**，类似于古代御史台的独立监察权。

```
地位: 独立监察机构
权限级别: 超部门 (Meta-Level)
直接负责: 系统管理员（皇帝）
权限范围: 全系统监察
```

---

## 🔐 权限分类

### **1️⃣ 监察权限 (Monitoring)**

#### **✅ 拥有的权限**
```
✅ 读取所有系统日志
✅ 读取所有Agent运行状态
✅ 读取所有规则配置
✅ 读取所有成本数据
✅ 读取所有性能指标
✅ 读取所有代码文件
✅ 读取所有测试结果
✅ 读取所有用户反馈
```

#### **❌ 没有的权限**
```
❌ 修改用户数据
❌ 访问敏感配置（API密钥等）
❌ 读取用户私密信息
```

---

### **2️⃣ 分析权限 (Analysis)**

#### **✅ 拥有的权限**
```
✅ 分析系统性能瓶颈
✅ 分析成本消耗趋势
✅ 分析代码质量问题
✅ 分析规则冲突
✅ 分析Agent效率
✅ 分析用户满意度
✅ 分析任务成功率
✅ 预测未来问题
```

#### **❌ 没有的权限**
```
❌ 分析用户行为（隐私保护）
❌ 分析竞争对手数据
```

---

### **3️⃣ 建议权限 (Recommendation)**

#### **✅ 拥有的权限**
```
✅ 提出优化建议
✅ 提出规则修改建议
✅ 提出架构改进建议
✅ 提出成本优化建议
✅ 提出性能优化建议
✅ 生成优先级排序
✅ 生成行动计划
```

#### **❌ 没有的权限**
```
❌ 强制执行建议（需人工批准）
❌ 自动修改核心配置
❌ 自动部署到生产环境
```

---

### **4️⃣ 执行权限 (Execution)**

#### **✅ 自动执行权限**
```
✅ 清理临时文件
✅ 压缩日志文件
✅ 生成报告文档
✅ 发送通知提醒
✅ 更新监控指标
✅ 重启失败服务（非关键）
```

#### **⚠️ 需要批准的权限**
```
⚠️ 修改规则配置（需管理员批准）
⚠️ 调整Agent参数（需管理员批准）
⚠️ 执行代码重构（需管理员批准）
⚠️ 修改成本预算（需管理员批准）
⚠️ 禁用某个Agent（需管理员批准）
```

#### **❌ 禁止执行**
```
❌ 修改用户数据
❌ 删除代码文件
❌ 修改API密钥
❌ 关闭系统服务
❌ 访问外部网络（除API调用外）
```

---

## 🎯 权限级别

### **权限等级体系**
```
Level 5: 系统管理员（皇帝）
  └─ 最高权限，所有操作

Level 4: 御史台（监察官）⭐ 当前
  ├─ 监察: 全系统
  ├─ 建议: 全系统
  ├─ 执行: 受限自动执行
  └─ 修改: 需批准

Level 3: 尚书省（执行协调）
  ├─ 协调六部执行
  └─ 验收任务结果

Level 2: 门下省（审核）
  └─ 审核诏书

Level 1: 中书省（起草）
  └─ 起草诏书

Level 0: 六部（执行）
  └─ 执行具体任务
```

---

## 🔒 权限限制

### **安全边界**
```
1. 不能修改核心系统文件
2. 不能访问用户私密数据
3. 不能绕过门下省审核
4. 不能直接调用外部API（除GLM-5）
5. 不能自动部署到生产环境
```

### **成本限制**
```
1. 单次优化成本上限: $0.10
2. 日优化成本上限: $0.50
3. 月优化成本上限: $5.00
4. 超限需人工批准
```

### **操作频率限制**
```
1. 系统健康检查: 每30分钟1次
2. 性能分析: 每2小时1次
3. 成本分析: 每天1次
4. 代码质量分析: 每周1次
5. 架构分析: 每月1次
```

---

## 🤝 与其他部门的关系

### **与中书省**
```
关系: 监察
权限:
  ✅ 分析中书省的方案质量
  ✅ 建议改进方案起草方式
  ❌ 不能直接修改中书省的方案
  ❌ 不能绕过中书省起草诏书
```

### **与门下省**
```
关系: 独立平行
权限:
  ✅ 分析门下省的审核效率
  ✅ 建议调整审核标准
  ❌ 不能干预门下省的封驳权
  ❌ 不能绕过门下省审核
```

### **与尚书省**
```
关系: 监察与协作
权限:
  ✅ 分析尚书省的协调效率
  ✅ 监控任务执行进度
  ✅ 建议优化协调流程
  ❌ 不能直接指挥六部
```

### **与六部**
```
关系: 监察
权限:
  ✅ 监控各部门执行效率
  ✅ 分析各部门成本消耗
  ✅ 建议部门间协作优化
  ❌ 不能直接给六部下达任务
  ❌ 不能修改部门代码
```

---

## 📊 权限配置

### **权限配置文件** (`yushitai-permissions.yaml`)
```yaml
agent:
  name: 御史台
  level: 4
  role: 系统监察与优化官

permissions:
  # 监察权限
  monitoring:
    - read_logs
    - read_metrics
    - read_costs
    - read_config
    - read_code
    - read_tests
  
  # 分析权限
  analysis:
    - analyze_performance
    - analyze_costs
    - analyze_quality
    - analyze_rules
    - analyze_agents
    - predict_issues
  
  # 建议权限
  recommendation:
    - suggest_optimizations
    - suggest_rule_changes
    - suggest_architecture_changes
    - prioritize_actions
    - generate_reports
  
  # 执行权限（自动）
  execution_auto:
    - clean_temp_files
    - compress_logs
    - generate_reports
    - send_notifications
    - update_metrics
  
  # 执行权限（需批准）
  execution_approval:
    - modify_rules
    - adjust_agent_params
    - refactor_code
    - modify_budget
    - disable_agents

restrictions:
  forbidden:
    - modify_user_data
    - delete_code_files
    - modify_api_keys
    - shutdown_services
    - access_external_networks
  
  cost_limits:
    single_run: 0.10
    daily: 0.50
    monthly: 5.00
  
  rate_limits:
    health_check: "*/30 * * * *"
    performance_analysis: "0 */2 * * *"
    cost_analysis: "0 0 * * *"
    code_quality_analysis: "0 0 * * 0"
    architecture_analysis: "0 0 1 * *"

audit:
  enabled: true
  log_all_actions: true
  report_to: admin@example.com
  retention_days: 90
```

---

## 🔍 权限使用示例

### **示例1: 性能优化**
```javascript
// ✅ 允许: 分析性能问题
await yushitai.analyzePerformance();

// ✅ 允许: 生成优化建议
await yushitai.generateOptimizationReport();

// ❌ 禁止: 直接修改代码
await yushitai.modifyAgentCode(agentId, newCode); // 抛出权限错误

// ✅ 允许: 提交优化建议（需批准）
await yushitai.submitOptimizationProposal(proposal);
```

### **示例2: 规则修改**
```javascript
// ✅ 允许: 分析规则冲突
await yushitai.analyzeRuleConflicts();

// ✅ 允许: 生成规则修改建议
await yushitai.suggestRuleChanges();

// ❌ 禁止: 直接修改规则
await yushitai.modifyRule(ruleId, newRule); // 抛出权限错误

// ✅ 允许: 提交规则修改请求（需批准）
await yushitai.requestRuleChange(ruleId, changes);
```

### **示例3: 成本控制**
```javascript
// ✅ 允许: 分析成本趋势
await yushitai.analyzeCostTrends();

// ✅ 允许: 自动清理低价值缓存
await yushitai.cleanLowValueCache();

// ❌ 禁止: 直接修改预算
await yushitai.modifyBudget(newBudget); // 抛出权限错误

// ✅ 允许: 提交预算调整建议（需批准）
await yushitai.suggestBudgetAdjustment(suggestion);
```

---

## 🚨 权限违规处理

### **违规检测**
```
1. 所有操作都记录到审计日志
2. 实时监控权限使用
3. 自动检测越权操作
4. 违规操作立即阻止
```

### **违规处理**
```
Level 1 (轻微): 警告并记录
Level 2 (中等): 暂停权限1小时
Level 3 (严重): 暂停权限24小时
Level 4 (致命): 永久禁用，需人工恢复
```

---

## 📈 权限升级路径

### **当前: Level 4 (御史台)**
```
✅ 全系统监察
✅ 优化建议
✅ 受限自动执行
⚠️ 需批准修改
```

### **未来可能升级: Level 4.5 (智能御史台)**
```
✅ 增加学习能力
✅ 增加预测能力
✅ 自动执行低风险优化
⚠️ 仍需批准高风险操作
```

### **最高级别: Level 5 (系统管理员)**
```
⚠️ 仅人类可以担任
⚠️ 所有操作权限
⚠️ 可以修改御史台权限
```

---

## 🎯 权限设计原则

### **1. 最小权限原则**
```
只授予完成任务所需的最小权限
```

### **2. 分权制衡原则**
```
御史台不能替代其他部门，保持制衡
```

### **3. 审计透明原则**
```
所有操作都可追溯，可审计
```

### **4. 安全优先原则**
```
安全边界不可越，用户隐私最高
```

### **5. 成本控制原则**
```
优化成本不能超过节省成本
```

---

## 💡 使用建议

### **适合使用御史台的场景**
```
✅ 定期系统健康检查
✅ 性能瓶颈分析
✅ 成本优化建议
✅ 代码质量提升
✅ 架构演进规划
```

### **不适合的场景**
```
❌ 紧急故障修复（用尚书省）
❌ 日常任务执行（用六部）
❌ 方案审核（用门下省）
❌ 需求分析（用中书省）
```

---

## 📚 相关文档

- **设计文档**: `workspace/YUSHITAI-DESIGN.md`
- **实现代码**: `yushitai-optimizer-full.js`
- **权限配置**: `yushitai-permissions.yaml` (待创建)
- **使用指南**: `docs/yushitai-guide.md` (待创建)

---

**创建时间**: 2026-04-06 15:03:00 CST
**版本**: 1.0.0
**状态**: ✅ 权限体系已定义

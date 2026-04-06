# 🔄 三省六部系统 - 迭代机制详解

**文档版本**: 1.0.0  
**更新时间**: 2026-04-05 18:58:00 CST  
**适用系统**: 三省六部 Agent 系统

---

## 📋 **迭代层级概览**

三省六部系统采用**四层迭代机制**，从宏观到微观：

```
┌─────────────────────────────────────────────────┐
│  Level 1: 封驳迭代（门下省 ↔ 中书省）           │
│  最多 3 次                                       │
├─────────────────────────────────────────────────┤
│  Level 2: Sub Agent 自迭代（执行层）            │
│  最多 5 次                                       │
├─────────────────────────────────────────────────┤
│  Level 3: 验收迭代（尚书省）                     │
│  最多 2 次                                       │
├─────────────────────────────────────────────────┤
│  Level 4: 质量门控（5 维度检查）                 │
│  每次迭代必检                                    │
└─────────────────────────────────────────────────┘
```

---

## 🔄 **Level 1: 封驳迭代（最高层）**

### **参与角色**
- **中书省**（Zhongshu）：起草诏书（任务计划）
- **门下省**（Menxia）：审核诏书，行使封驳权

### **迭代流程**

```
用户请求
   ↓
中书省起草诏书
   ↓
门下省审议
   ├─ 通过 → 提交给尚书省执行
   └─ 驳回 → 触发封驳迭代
       ↓
   中书省收到驳回意见
       ↓
   分析驳回理由
       ├─ 可以修改 → 修改诏书 → 重新提交
       ├─ 应该申诉 → 提出申诉 → 门下省二次审议
       └─ 无法处理 → 询问用户
       ↓
   迭代次数 +1
       ↓
   达到 3 次？→ 询问用户
```

### **迭代限制**
- **最大次数**: 3 次
- **申诉次数**: 最多 1 次
- **超限处理**: 询问用户决策

### **驳回理由分类**
1. **成本过高** (cost_too_high)
2. **过于复杂** (too_complex)
3. **任务过多** (too_many_tasks)
4. **优先级不当** (priority_issue)
5. **风险过高** (high_risk)

### **自动修复策略**
```typescript
// 根据驳回理由自动修改诏书
switch (rejectionReason) {
  case "成本过高":
    // 移除低优先级任务，降低成本 30%
    tasks = tasks.filter(t => t.priority === "high");
    estimated_cost *= 0.7;
    break;
    
  case "过于复杂":
    // 合并相似任务
    tasks = mergeSimilarTasks(tasks);
    break;
    
  case "任务过多":
    // 按部门合并
    tasks = mergeByMinistry(tasks);
    break;
    
  case "优先级不当":
    // 调整优先级
    tasks = adjustPriorities(tasks);
    break;
}
```

### **申诉机制**
当驳回理由不充分时，中书省可以提出申诉：
1. **收集证据**
   - 技术证据（任务数量、依赖关系）
   - 上下文证据（用户意图复杂度）
   - 效率证据（成本、并行度）

2. **二次审议**
   - 评估证据强度（0-1 分）
   - 重新评估风险（0-1 分）
   - 综合评分 = 证据强度 × 0.6 + 风险评分 × 0.4

3. **决策阈值**
   - ≥ 0.7：申诉通过
   - ≥ 0.5：通过但警告
   - < 0.5：申诉失败

---

## 🔄 **Level 2: Sub Agent 自迭代（执行层）**

### **参与角色**
- **工部**（Gongbu）：代码开发
  - Coder Agent：编写代码
  - Tester Agent：测试代码
  - Fixer Agent：修复缺陷

### **迭代流程**

```
工部接收任务
   ↓
Round 1:
   ├─ Coder Agent 编写代码
   ├─ Tester Agent 测试代码
   │   ├─ 通过 → 迭代结束
   │   └─ 失败 → 触发 Fixer
   └─ Fixer Agent 修复缺陷
       ↓
Round 2:
   ├─ Coder Agent 根据反馈修改
   ├─ Tester Agent 重新测试
   └─ Fixer Agent 修复（如果需要）
       ↓
   ...
       ↓
Round 5 (最大):
   └─ 最终结果（成功或失败）
```

### **迭代限制**
- **最大次数**: 5 次
- **触发条件**: 测试失败
- **退出条件**: 测试通过 或 达到最大次数

### **三个 Agent 协作**

#### 1. **Coder Agent**（编码者）
```typescript
async runCoderAgent(task, context, round) {
  // 分析任务
  const analysis = await analyzeTask(task);
  
  // 生成代码变更
  const changes = await generateCodeChanges(task, analysis);
  
  // 应用变更
  const applied = await applyChanges(changes);
  
  // 返回迭代记录
  return {
    round,
    agent: "coder",
    result: applied.success ? "success" : "failure",
    output: changes,
    verification: applied
  };
}
```

#### 2. **Tester Agent**（测试者）
```typescript
async runTesterAgent(task, context, round) {
  // 生成测试用例
  const testCases = await generateTestCases(task);
  
  // 执行测试
  const testResults = await executeTests(testCases);
  
  // 返回测试结果
  return {
    round,
    agent: "tester",
    result: testResults.allPassed ? "success" : "failure",
    verification: {
      passed: testResults.allPassed,
      details: testResults
    }
  };
}
```

#### 3. **Fixer Agent**（修复者）
```typescript
async runFixerAgent(task, context, round, testResult) {
  // 分析失败原因
  const failureAnalysis = await analyzeFailure(testResult);
  
  // 生成修复方案
  const fixPlan = await generateFixPlan(failureAnalysis);
  
  // 应用修复
  const fixed = await applyFix(fixPlan);
  
  // 返回修复结果
  return {
    round,
    agent: "fixer",
    result: fixed.success ? "success" : "failure",
    output: fixPlan,
    metadata: { failureAnalysis }
  };
}
```

---

## 🔄 **Level 3: 验收迭代（结果层）**

### **参与角色**
- **尚书省**（Shangshu）：最终验收
- **门下省**（Menxia）：协助质量检查

### **迭代流程**

```
六部执行完成
   ↓
尚书省验收
   ├─ 5 维度检查
   │   ├─ 代码质量 ✅
   │   ├─ 安全检查 ✅
   │   ├─ 测试检查 ✅
   │   ├─ 性能检查 ✅
   │   └─ 完整性检查 ✅
   ↓
全部通过？
   ├─ 是 → 任务完成 ✅
   └─ 否 → 触发验收迭代
       ↓
   分析失败原因
       ├─ 可重试 → 重新执行失败任务
       ├─ 部分接受 → 询问用户
       └─ 无法处理 → 询问用户
       ↓
   迭代次数 +1
       ↓
   达到 2 次？→ 询问用户
```

### **迭代限制**
- **最大次数**: 2 次
- **触发条件**: 验收不通过
- **退出条件**: 验收通过 或 达到最大次数

### **五维度检查**

#### 1. **代码质量检查**
```typescript
checkQuality(records: ExecutionRecord[]): boolean {
  for (const record of records) {
    // 失败的任务
    if (record.status === "failed") return false;
    
    // 迭代次数过多
    if (record.iterations.length > 3) return false;
  }
  return true;
}
```

#### 2. **安全检查**
```typescript
checkSecurity(records: ExecutionRecord[]): boolean {
  for (const record of records) {
    for (const iteration of record.iterations) {
      const output = JSON.stringify(iteration.output).toLowerCase();
      
      // 检查安全关键词
      if (output.includes("security") && output.includes("fail")) {
        return false;
      }
      if (output.includes("vulnerability")) {
        return false;
      }
    }
  }
  return true;
}
```

#### 3. **测试检查**
```typescript
checkTests(records: ExecutionRecord[]): boolean {
  for (const record of records) {
    const testIterations = record.iterations.filter(i => i.agent === "tester");
    
    for (const testIter of testIterations) {
      if (testIter.verification && !testIter.verification.passed) {
        return false;
      }
    }
  }
  return true;
}
```

#### 4. **性能检查**
```typescript
checkPerformance(records: ExecutionRecord[]): boolean {
  for (const record of records) {
    // 执行时间不超过 5 分钟
    if (record.duration && record.duration > 300000) {
      return false;
    }
  }
  return true;
}
```

#### 5. **完整性检查**
```typescript
checkCompleteness(edict: ImperialEdict, records: ExecutionRecord[]): boolean {
  // 检查所有任务是否都已执行
  const executedTaskIds = new Set(records.map(r => r.taskId));
  
  for (const task of edict.tasks) {
    if (!executedTaskIds.has(task.id)) {
      return false; // 有任务未执行
    }
  }
  
  // 检查所有任务是否都成功
  for (const record of records) {
    if (record.status !== "completed") {
      return false;
    }
  }
  
  return true;
}
```

### **验收失败处理**
```typescript
handleAcceptanceFailure(report, edict) {
  // 检查迭代次数
  if (edict.iteration.rejections >= 2) {
    return { action: "ask_user" };
  }
  
  // 分析失败原因
  const failureAnalysis = analyzeFailure(report, edict);
  
  if (failureAnalysis.canRetry) {
    return {
      action: "retry",
      retryTasks: failureAnalysis.retryTasks
    };
  } else if (failureAnalysis.canPartialAccept) {
    return {
      action: "partial_accept"
    };
  } else {
    return { action: "ask_user" };
  }
}
```

---

## 🔄 **Level 4: 质量门控（基准层）**

### **参与角色**
- **质量门控系统**（QualityGateSystem）：独立的质量检查

### **五维度评分体系**

| 维度 | 权重 | 阈值 | 检查内容 |
|------|------|------|---------|
| 代码质量 | 25% | 80 分 | Lint 错误、类型错误、代码规范 |
| 测试覆盖 | 25% | 70 分 | 单元测试、集成测试覆盖率 |
| 安全评分 | 20% | 85 分 | 漏洞扫描、敏感数据检查 |
| 性能指标 | 15% | 75 分 | 响应时间、资源使用率 |
| 完成度 | 15% | 90 分 | 功能完整性、需求覆盖度 |

### **质量门控检查**
```typescript
async executeQualityGates(edict, records, context): QualityScore {
  const dimensions = {};
  
  // 1. 代码质量
  dimensions["代码质量"] = await checkCodeQuality(records);
  
  // 2. 测试覆盖
  dimensions["测试覆盖"] = await checkTestCoverage(records);
  
  // 3. 安全评分
  dimensions["安全评分"] = await checkSecurityScore(records);
  
  // 4. 性能指标
  dimensions["性能指标"] = await checkPerformanceScore(records);
  
  // 5. 完成度
  dimensions["完成度"] = await checkCompletenessScore(edict, records);
  
  // 计算加权总分
  let overall = 0;
  for (const gate of gates) {
    overall += dimensions[gate.name] * gate.weight;
  }
  
  // 判断是否通过（所有维度都达到阈值）
  const passed = gates.every(
    gate => dimensions[gate.name] >= gate.threshold
  );
  
  // 计算等级
  const grade = calculateGrade(overall);
  
  return { overall, dimensions, passed, grade };
}
```

### **等级评定**
```
A: 90-100 分（优秀）
B: 80-89 分（良好）
C: 70-79 分（合格）
D: 60-69 分（需改进）
F: 0-59 分（不合格）
```

### **质量门控强制执行**
- **每次迭代必检**：无论哪一层迭代，都要通过质量门控
- **不通过不通过**：任何维度不达标，整个任务不通过
- **不可绕过**：最高权限规则，无法禁用

---

## 🔄 **迭代协同机制**

### **四层迭代如何协同工作？**

```
用户请求："创建一个 HTTP 服务器"
   ↓
【Level 1: 封驳迭代】
中书省起草诏书
   → 任务拆分：1 个任务（工部：创建服务器）
   → 预估成本：$0.01
   ↓
门下省审核
   → 通过 ✅
   ↓
【Level 2: Sub Agent 自迭代】
工部接收任务
   ↓
Round 1:
   → Coder Agent: 生成代码
   → Tester Agent: 测试通过 ✅
   ↓
【Level 3: 验收迭代】
尚书省验收
   → 代码质量: 85/100 ✅
   → 安全检查: 90/100 ✅
   → 测试检查: 95/100 ✅
   → 性能检查: 80/100 ✅
   → 完整性: 100/100 ✅
   ↓
【Level 4: 质量门控】
   → 代码质量: 85 (阈值 80) ✅
   → 测试覆盖: 95 (阈值 70) ✅
   → 安全评分: 90 (阈值 85) ✅
   → 性能指标: 80 (阈值 75) ✅
   → 完成度: 100 (阈值 90) ✅
   → 总分: 89.25 分 (等级 B) ✅
   ↓
任务完成 ✅
```

### **复杂场景示例**

```
用户请求："创建一个完整的博客系统"
   ↓
【Level 1: 封驳迭代】
中书省起草诏书
   → 任务拆分：10 个任务（工部×5，兵部×2，刑部×2，礼部×1）
   → 预估成本：$0.5
   ↓
门下省审核
   → 驳回：任务过多，成本过高
   ↓
【第 1 次迭代】
中书省修改诏书
   → 合并任务：6 个任务
   → 预估成本：$0.35
   ↓
门下省再次审核
   → 通过 ✅
   ↓
【Level 2: Sub Agent 自迭代】
工部执行任务 1（用户认证）
   ↓
Round 1:
   → Coder Agent: 编写认证代码
   → Tester Agent: 测试失败 ❌
   → Fixer Agent: 修复问题
   ↓
Round 2:
   → Coder Agent: 修改代码
   → Tester Agent: 测试通过 ✅
   ↓
工部执行任务 2（数据库集成）
   ↓
Round 1:
   → Coder Agent: 编写数据库代码
   → Tester Agent: 测试通过 ✅
   ↓
...（继续执行其他任务）
   ↓
【Level 3: 验收迭代】
尚书省验收
   → 代码质量: 75/100 ❌ (阈值 80)
   → 安全检查: 90/100 ✅
   → 测试检查: 85/100 ✅
   → 性能检查: 70/100 ❌ (阈值 75)
   → 完整性: 100/100 ✅
   ↓
【第 1 次迭代】
重新执行失败任务（代码质量、性能优化）
   ↓
Round 1:
   → Coder Agent: 优化代码
   → Tester Agent: 测试通过 ✅
   ↓
【Level 3: 验收迭代（第 2 次）】
尚书省再次验收
   → 代码质量: 82/100 ✅
   → 安全检查: 90/100 ✅
   → 测试检查: 88/100 ✅
   → 性能检查: 78/100 ✅
   → 完整性: 100/100 ✅
   ↓
【Level 4: 质量门控】
   → 代码质量: 82 (阈值 80) ✅
   → 测试覆盖: 88 (阈值 70) ✅
   → 安全评分: 90 (阈值 85) ✅
   → 性能指标: 78 (阈值 75) ✅
   → 完成度: 100 (阈值 90) ✅
   → 总分: 86.7 分 (等级 B) ✅
   ↓
任务完成 ✅
```

---

## 📊 **迭代成本分析**

### **各级迭代的成本影响**

| 迭代层级 | 单次成本 | 最大次数 | 最大成本 | 典型成本 |
|---------|---------|---------|---------|---------|
| Level 1 | $0.001 | 3 | $0.003 | $0.001 |
| Level 2 | $0.01 | 5 | $0.05 | $0.02 |
| Level 3 | $0.005 | 2 | $0.01 | $0.005 |
| Level 4 | $0.002 | ∞ | $0.002 | $0.002 |
| **总计** | - | - | **$0.065** | **$0.028** |

### **成本优化策略**
1. **提前终止**: 任何层级通过即停止
2. **智能判断**: 根据驳回理由自动决策
3. **并行执行**: 减少总迭代次数
4. **缓存机制**: 避免重复计算

---

## 🎯 **关键特性**

### 1. **多层防护**
- 四层迭代确保质量
- 每层都有独立阈值
- 互相补充，全面覆盖

### 2. **自动修复**
- 根据失败原因自动调整
- 智能选择修复策略
- 减少用户干预

### 3. **灵活决策**
- 可申诉机制
- 部分接受选项
- 用户最终裁决权

### 4. **透明可追溯**
- 每次迭代都有详细记录
- 完整的审计跟踪
- 可视化的迭代过程

### 5. **成本可控**
- 严格的迭代限制
- 实时成本监控
- 预算保护机制

---

## 📝 **总结**

三省六部系统的迭代机制通过**四层迭代**实现了：

✅ **质量保证** - 多维度检查，层层把关  
✅ **自动修复** - 智能判断，自动调整  
✅ **成本控制** - 严格限制，实时监控  
✅ **用户友好** - 减少干预，透明可追溯  
✅ **灵活应对** - 申诉机制，部分接受  

**这套迭代机制是三省六部系统的核心优势，确保了任务的高质量完成！** 🚀

---

**文档编写**: OpenClaw Agent  
**文档时间**: 2026-04-05 18:58:00 CST  
**文档版本**: 1.0.0

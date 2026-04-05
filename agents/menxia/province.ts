/**
 * 门下省 - 审议层
 * 
 * 职责：
 * 1. 审议中书省的诏书
 * 2. 检查合理性、安全性、成本
 * 3. 批准或驳回
 * 4. 处理申诉
 * 5. 最终验收
 * 
 * 模型：GLM-5（强推理）
 */

import type {
  ImperialEdict,
  Approval,
  Appeal,
  AcceptanceReport,
  Ministry,
  SharedContext,
} from '../types';

export class MenxiaProvince {
  private model: "glm-5" = "glm-5";
  private maxRejections: number = 3;  // 最多驳回 3 次
  private maxAppeals: number = 1;     // 最多申诉 1 次
  
  /**
   * 审议诏书
   */
  async reviewEdict(
    edict: ImperialEdict,
    context: SharedContext
  ): Promise<Approval> {
    const approvalId = this.generateApprovalId();
    const timestamp = new Date().toISOString();
    
    // 1. 执行各项检查
    const checks = await this.performChecks(edict, context);
    
    // 2. 评估风险
    const riskLevel = this.assessRisk(edict, checks);
    
    // 3. 做出决策
    const decision = this.makeDecision(checks, riskLevel, edict);
    
    // 4. 生成审批结果
    const approval: Approval = {
      id: approvalId,
      edictId: edict.id,
      timestamp,
      reviewer: "门下省",
      decision,
      consultedMinistries: this.getConsultedMinistries(edict),
    };
    
    // 5. 如果驳回，添加驳回理由
    if (decision === "rejected") {
      approval.rejectionReason = {
        riskLevel,
        issues: checks.filter(c => !c.passed).map(c => c.issue),
        suggestions: this.generateSuggestions(checks, riskLevel),
      };
    } else {
      approval.comments = this.generateApprovalComment(edict, checks);
    }
    
    return approval;
  }
  
  /**
   * 执行各项检查
   */
  private async performChecks(
    edict: ImperialEdict,
    context: SharedContext
  ): Promise<CheckResult[]> {
    const checks: CheckResult[] = [];
    
    // 1. 任务合理性检查
    checks.push(this.checkTaskValidity(edict));
    
    // 2. 依赖关系检查
    checks.push(this.checkDependencies(edict));
    
    // 3. 成本检查
    checks.push(this.checkCost(edict, context));
    
    // 4. 安全检查
    checks.push(this.checkSecurity(edict));
    
    // 5. 资源检查
    checks.push(this.checkResources(edict, context));
    
    // 6. 规则检查
    checks.push(this.checkRules(edict));
    
    return checks;
  }
  
  /**
   * 检查任务合理性
   */
  private checkTaskValidity(edict: ImperialEdict): CheckResult {
    const issues: string[] = [];
    
    // 检查是否有任务
    if (edict.tasks.length === 0) {
      issues.push("任务列表为空");
    }
    
    // 检查任务描述是否清晰
    for (const task of edict.tasks) {
      if (task.description.length < 5) {
        issues.push(`任务 ${task.id} 描述过于简短`);
      }
    }
    
    // 检查是否有循环依赖
    if (this.hasCircularDependency(edict)) {
      issues.push("存在循环依赖");
    }
    
    return {
      name: "任务合理性",
      passed: issues.length === 0,
      issue: issues.join("; "),
    };
  }
  
  /**
   * 检查依赖关系
   */
  private checkDependencies(edict: ImperialEdict): CheckResult {
    const issues: string[] = [];
    const taskIds = new Set(edict.tasks.map(t => t.id));
    
    // 检查依赖的任务是否存在
    for (const dep of edict.dependencies) {
      for (const dependsOn of dep.dependsOn) {
        if (!taskIds.has(dependsOn)) {
          issues.push(`任务 ${dep.taskId} 依赖不存在的任务 ${dependsOn}`);
        }
      }
    }
    
    return {
      name: "依赖关系",
      passed: issues.length === 0,
      issue: issues.join("; "),
    };
  }
  
  /**
   * 检查成本
   */
  private checkCost(edict: ImperialEdict, context: SharedContext): CheckResult {
    const issues: string[] = [];
    
    const estimatedCost = edict.cost.estimated;
    const budget = 5.00; // $5 单任务上限
    
    if (estimatedCost > budget) {
      issues.push(`预估成本 $${estimatedCost.toFixed(2)} 超过预算 $${budget.toFixed(2)}`);
    }
    
    // 检查今日已用成本
    const dailyUsed = context.costTracking.current;
    const dailyBudget = 100.00; // $100 每日上限
    
    if (dailyUsed + estimatedCost > dailyBudget) {
      issues.push(`执行后将超过每日预算（已用 $${dailyUsed.toFixed(2)}）`);
    }
    
    return {
      name: "成本检查",
      passed: issues.length === 0,
      issue: issues.join("; "),
    };
  }
  
  /**
   * 检查安全性
   */
  private checkSecurity(edict: ImperialEdict): CheckResult {
    const issues: string[] = [];
    
    // 检查是否涉及敏感操作
    const sensitiveKeywords = ["删除", "drop", "truncate", "rm ", "格式化"];
    const intent = edict.userIntent.toLowerCase();
    
    for (const keyword of sensitiveKeywords) {
      if (intent.includes(keyword)) {
        issues.push(`检测到敏感操作：${keyword}`);
      }
    }
    
    // 检查是否涉及生产环境
    if (intent.includes("生产") || intent.includes("production")) {
      issues.push("涉及生产环境操作");
    }
    
    return {
      name: "安全检查",
      passed: issues.length === 0,
      issue: issues.join("; "),
    };
  }
  
  /**
   * 检查资源
   */
  private checkResources(edict: ImperialEdict, context: SharedContext): CheckResult {
    const issues: string[] = [];
    
    // 检查是否有足够的执行能力
    const taskCount = edict.tasks.length;
    const maxTasks = 20;
    
    if (taskCount > maxTasks) {
      issues.push(`任务数量 ${taskCount} 超过最大限制 ${maxTasks}`);
    }
    
    return {
      name: "资源检查",
      passed: issues.length === 0,
      issue: issues.join("; "),
    };
  }
  
  /**
   * 检查规则
   */
  private checkRules(edict: ImperialEdict): CheckResult {
    const issues: string[] = [];
    
    // 检查是否违反规则 R001-R004
    // 这里简化处理，实际会加载规则系统
    
    // R003: 紧急模式检查
    if (edict.routing.emergency) {
      // 紧急模式下跳过某些检查
      return {
        name: "规则检查",
        passed: true,
        issue: "",
      };
    }
    
    return {
      name: "规则检查",
      passed: issues.length === 0,
      issue: issues.join("; "),
    };
  }
  
  /**
   * 评估风险等级
   */
  private assessRisk(edict: ImperialEdict, checks: CheckResult[]): "high" | "medium" | "low" {
    const failedChecks = checks.filter(c => !c.passed).length;
    
    if (failedChecks >= 3) return "high";
    if (failedChecks >= 1) return "medium";
    
    // 检查任务复杂度
    if (edict.tasks.length > 10) return "medium";
    if (edict.tasks.length > 15) return "high";
    
    // 检查成本
    if (edict.cost.estimated > 3.00) return "medium";
    if (edict.cost.estimated > 4.50) return "high";
    
    return "low";
  }
  
  /**
   * 做出决策
   */
  private makeDecision(
    checks: CheckResult[],
    riskLevel: "high" | "medium" | "low",
    edict: ImperialEdict
  ): "approved" | "rejected" {
    // 高风险直接驳回
    if (riskLevel === "high") {
      return "rejected";
    }
    
    // 中风险：根据失败检查数量决定
    const failedChecks = checks.filter(c => !c.passed).length;
    if (riskLevel === "medium" && failedChecks >= 2) {
      return "rejected";
    }
    
    // 低风险：通过
    return "approved";
  }
  
  /**
   * 处理申诉
   */
  async handleAppeal(
    appeal: Appeal,
    edict: ImperialEdict,
    context: SharedContext
  ): Promise<{
    decision: "approved" | "rejected" | "ask_user";
    reason: string;
  }> {
    // 检查是否达到最大申诉次数
    if (edict.iteration.appeals >= this.maxAppeals) {
      return {
        decision: "ask_user",
        reason: "已达到最大申诉次数，需要用户裁决",
      };
    }
    
    // 二次审议
    const secondReview = await this.performSecondReview(appeal, edict, context);
    
    if (secondReview.approved) {
      return {
        decision: "approved",
        reason: secondReview.reason,
      };
    } else {
      // 仍驳回，询问用户
      return {
        decision: "ask_user",
        reason: `二次审议仍不通过：${secondReview.reason}`,
      };
    }
  }
  
  /**
   * 二次审议
   */
  private async performSecondReview(
    appeal: Appeal,
    edict: ImperialEdict,
    context: SharedContext
  ): Promise<{
    approved: boolean;
    reason: string;
  }> {
    // 分析申诉理由
    const evidenceStrength = this.evaluateEvidence(appeal.evidence);
    
    // 如果证据充分，可以考虑通过
    if (evidenceStrength > 0.7) {
      return {
        approved: true,
        reason: "申诉理由充分，证据支持继续执行",
      };
    }
    
    return {
      approved: false,
      reason: "申诉理由不够充分，建议修改诏书",
    };
  }
  
  /**
   * 评估证据强度
   */
  private evaluateEvidence(evidence: Appeal["evidence"]): number {
    if (!evidence || evidence.length === 0) return 0;
    
    let strength = 0;
    
    for (const e of evidence) {
      switch (e.type) {
        case "technical":
          strength += 0.3;
          break;
        case "context":
          strength += 0.2;
          break;
        case "efficiency":
          strength += 0.2;
          break;
      }
    }
    
    return Math.min(strength, 1.0);
  }
  
  /**
   * 最终验收
   */
  async acceptResult(
    edict: ImperialEdict,
    executionResult: any,
    context: SharedContext
  ): Promise<AcceptanceReport> {
    const reportId = this.generateReportId();
    const timestamp = new Date().toISOString();
    
    // 执行验收检查
    const checks = {
      quality: await this.checkQuality(executionResult),
      security: await this.checkSecurityResult(executionResult),
      tests: await this.checkTests(executionResult),
      performance: await this.checkPerformance(executionResult),
    };
    
    const passed = Object.values(checks).every(v => v);
    
    const report: AcceptanceReport = {
      edictId: edict.id,
      taskId: executionResult.taskId,
      timestamp,
      passed,
      checks,
      issues: [],
    };
    
    // 如果不通过，添加驳回信息
    if (!passed) {
      report.rejection = {
        reason: this.generateRejectionReason(checks),
        suggestedFix: this.generateSuggestedFix(checks),
        retryCount: edict.iteration.rejections,
      };
    }
    
    return report;
  }
  
  /**
   * 检查代码质量
   */
  private async checkQuality(result: any): Promise<boolean> {
    // 实际会运行 lint, typecheck 等
    return result.quality !== false;
  }
  
  /**
   * 检查安全性结果
   */
  private async checkSecurityResult(result: any): Promise<boolean> {
    return result.security !== false;
  }
  
  /**
   * 检查测试
   */
  private async checkTests(result: any): Promise<boolean> {
    return result.tests !== false;
  }
  
  /**
   * 检查性能
   */
  private async checkPerformance(result: any): Promise<boolean> {
    return result.performance !== false;
  }
  
  /**
   * 生成驳回理由
   */
  private generateRejectionReason(checks: AcceptanceReport["checks"]): string {
    const reasons: string[] = [];
    
    if (!checks.quality) reasons.push("代码质量检查未通过");
    if (!checks.security) reasons.push("安全检查未通过");
    if (!checks.tests) reasons.push("测试未通过");
    if (!checks.performance) reasons.push("性能检查未通过");
    
    return reasons.join("；");
  }
  
  /**
   * 生成修复建议
   */
  private generateSuggestedFix(checks: AcceptanceReport["checks"]): string {
    const suggestions: string[] = [];
    
    if (!checks.quality) suggestions.push("修复 lint 错误和类型错误");
    if (!checks.security) suggestions.push("处理安全问题");
    if (!checks.tests) suggestions.push("修复失败的测试");
    if (!checks.performance) suggestions.push("优化性能瓶颈");
    
    return suggestions.join("；");
  }
  
  /**
   * 辅助方法：检查循环依赖
   */
  private hasCircularDependency(edict: ImperialEdict): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (taskId: string): boolean => {
      visited.add(taskId);
      recursionStack.add(taskId);
      
      const deps = edict.dependencies.find(d => d.taskId === taskId);
      if (deps) {
        for (const dep of deps.dependsOn) {
          if (!visited.has(dep)) {
            if (hasCycle(dep)) return true;
          } else if (recursionStack.has(dep)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(taskId);
      return false;
    };
    
    for (const task of edict.tasks) {
      if (!visited.has(task.id)) {
        if (hasCycle(task.id)) return true;
      }
    }
    
    return false;
  }
  
  /**
   * 辅助方法：获取咨询的部门
   */
  private getConsultedMinistries(edict: ImperialEdict): Ministry[] {
    const ministries = new Set<Ministry>();
    for (const task of edict.tasks) {
      ministries.add(task.assignedTo);
    }
    return Array.from(ministries);
  }
  
  /**
   * 辅助方法：生成建议
   */
  private generateSuggestions(
    checks: CheckResult[],
    riskLevel: "high" | "medium" | "low"
  ): string[] {
    const suggestions: string[] = [];
    
    for (const check of checks) {
      if (!check.passed) {
        suggestions.push(`建议修复：${check.name} - ${check.issue}`);
      }
    }
    
    if (riskLevel === "high") {
      suggestions.push("建议：重新评估任务拆分，降低复杂度");
    }
    
    return suggestions;
  }
  
  /**
   * 辅助方法：生成审批意见
   */
  private generateApprovalComment(
    edict: ImperialEdict,
    checks: CheckResult[]
  ): string {
    const passedCount = checks.filter(c => c.passed).length;
    return `审议通过。${passedCount}/${checks.length} 项检查通过。`;
  }
  
  /**
   * 辅助方法：生成 ID
   */
  private generateApprovalId(): string {
    return `approval-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }
  
  private generateReportId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }
}

// 类型定义
interface CheckResult {
  name: string;
  passed: boolean;
  issue: string;
}

// 导出单例
export const menxiaProvince = new MenxiaProvince();

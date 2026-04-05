/**
 * 申诉处理器
 * 
 * 职责：
 * 1. 接收中书省的申诉
 * 2. 门下省二次审议
 * 3. 评估申诉证据
 * 4. 做出最终决定
 * 5. 必要时询问用户
 */

import type {
  ImperialEdict,
  Appeal,
  Approval,
  SharedContext,
  RejectionReason,
} from '../types';

export class AppealHandler {
  private maxAppeals: number = 1; // 最多申诉 1 次
  
  /**
   * 处理申诉
   */
  async handleAppeal(
    edict: ImperialEdict,
    appealReason: string,
    context: SharedContext
  ): Promise<{
    decision: "approved" | "rejected" | "ask_user";
    reason: string;
    secondReview?: Approval;
  }> {
    // 1. 检查申诉次数
    if (edict.iteration.appeals >= this.maxAppeals) {
      return {
        decision: "ask_user",
        reason: "已达到最大申诉次数，需要用户裁决",
      };
    }
    
    // 2. 创建申诉记录
    const appeal = await this.createAppeal(edict, appealReason, context);
    
    // 3. 执行二次审议
    const secondReview = await this.performSecondReview(appeal, edict, context);
    
    // 4. 做出决定
    if (secondReview.approved) {
      return {
        decision: "approved",
        reason: secondReview.reason,
        secondReview,
      };
    } else {
      // 申诉失败，询问用户
      return {
        decision: "ask_user",
        reason: `二次审议仍不通过：${secondReview.reason}`,
        secondReview,
      };
    }
  }
  
  /**
   * 创建申诉记录
   */
  private async createAppeal(
    edict: ImperialEdict,
    appealReason: string,
    context: SharedContext
  ): Promise<Appeal> {
    // 收集证据
    const evidence = await this.collectEvidence(edict, context);
    
    const appeal: Appeal = {
      edictId: edict.id,
      timestamp: new Date().toISOString(),
      reason: appealReason,
      evidence,
      status: "pending",
    };
    
    return appeal;
  }
  
  /**
   * 收集证据
   */
  private async collectEvidence(
    edict: ImperialEdict,
    context: SharedContext
  ): Promise<Appeal["evidence"]> {
    const evidence: Appeal["evidence"] = [];
    
    // 1. 技术证据
    const technicalEvidence = this.collectTechnicalEvidence(edict);
    if (technicalEvidence) {
      evidence.push(technicalEvidence);
    }
    
    // 2. 上下文证据
    const contextEvidence = this.collectContextEvidence(edict, context);
    if (contextEvidence) {
      evidence.push(contextEvidence);
    }
    
    // 3. 效率证据
    const efficiencyEvidence = this.collectEfficiencyEvidence(edict);
    if (efficiencyEvidence) {
      evidence.push(efficiencyEvidence);
    }
    
    return evidence;
  }
  
  /**
   * 收集技术证据
   */
  private collectTechnicalEvidence(edict: ImperialEdict): Appeal["evidence"][0] | null {
    const technicalReasons: string[] = [];
    
    // 检查任务数量是否合理
    if (edict.tasks.length <= 10) {
      technicalReasons.push(`任务数量（${edict.tasks.length}）在合理范围内`);
    }
    
    // 检查依赖关系
    const hasCircular = this.hasCircularDependency(edict);
    if (!hasCircular) {
      technicalReasons.push("依赖关系清晰，无循环依赖");
    }
    
    if (technicalReasons.length > 0) {
      return {
        type: "technical",
        description: "技术分析支持当前方案",
        details: technicalReasons,
        strength: 0.8,
      };
    }
    
    return null;
  }
  
  /**
   * 收集上下文证据
   */
  private collectContextEvidence(
    edict: ImperialEdict,
    context: SharedContext
  ): Appeal["evidence"][0] | null {
    const contextReasons: string[] = [];
    
    // 检查用户意图
    if (edict.userIntent.length > 50) {
      contextReasons.push("用户意图复杂，需要详细拆分");
    }
    
    // 检查历史决策
    if (context.decisions.length > 0) {
      contextReasons.push("基于历史决策优化当前方案");
    }
    
    if (contextReasons.length > 0) {
      return {
        type: "context",
        description: "上下文分析支持当前方案",
        details: contextReasons,
        strength: 0.6,
      };
    }
    
    return null;
  }
  
  /**
   * 收集效率证据
   */
  private collectEfficiencyEvidence(edict: ImperialEdict): Appeal["evidence"][0] | null {
    const efficiencyReasons: string[] = [];
    
    // 检查成本
    if (edict.cost.estimated <= 3.00) {
      efficiencyReasons.push(`预估成本（$${edict.cost.estimated.toFixed(2)}）在预算内`);
    }
    
    // 检查并行度
    const parallelTasks = this.countParallelTasks(edict);
    if (parallelTasks > 1) {
      efficiencyReasons.push(`有 ${parallelTasks} 个任务可并行执行，提高效率`);
    }
    
    if (efficiencyReasons.length > 0) {
      return {
        type: "efficiency",
        description: "效率分析支持当前方案",
        details: efficiencyReasons,
        strength: 0.7,
      };
    }
    
    return null;
  }
  
  /**
   * 执行二次审议
   */
  private async performSecondReview(
    appeal: Appeal,
    edict: ImperialEdict,
    context: SharedContext
  ): Promise<{
    approved: boolean;
    reason: string;
    score: number;
  }> {
    // 评估证据强度
    const evidenceScore = this.evaluateEvidence(appeal.evidence);
    
    // 二次分析风险
    const riskScore = this.reassessRisk(edict, context);
    
    // 综合评分
    const totalScore = (evidenceScore * 0.6) + (riskScore * 0.4);
    
    // 做出决定
    if (totalScore >= 0.7) {
      return {
        approved: true,
        reason: "证据充分，风险可控，申诉通过",
        score: totalScore,
      };
    } else if (totalScore >= 0.5) {
      // 边缘情况，倾向于通过但给予警告
      return {
        approved: true,
        reason: "申诉通过，但建议在执行过程中密切监控",
        score: totalScore,
      };
    } else {
      return {
        approved: false,
        reason: "证据不足或风险过高，建议修改方案",
        score: totalScore,
      };
    }
  }
  
  /**
   * 评估证据强度
   */
  private evaluateEvidence(evidence: Appeal["evidence"]): number {
    if (!evidence || evidence.length === 0) return 0;
    
    let totalStrength = 0;
    
    for (const e of evidence) {
      // 根据证据类型加权
      let weight = 1.0;
      switch (e.type) {
        case "technical":
          weight = 1.2;
          break;
        case "context":
          weight = 1.0;
          break;
        case "efficiency":
          weight = 0.8;
          break;
      }
      
      totalStrength += e.strength * weight;
    }
    
    // 归一化到 0-1
    return Math.min(totalStrength / evidence.length, 1.0);
  }
  
  /**
   * 重新评估风险
   */
  private reassessRisk(edict: ImperialEdict, context: SharedContext): number {
    // 风险评分（0-1，越高越安全）
    let riskScore = 1.0;
    
    // 任务数量风险
    if (edict.tasks.length > 15) {
      riskScore -= 0.2;
    } else if (edict.tasks.length > 10) {
      riskScore -= 0.1;
    }
    
    // 成本风险
    if (edict.cost.estimated > 4.00) {
      riskScore -= 0.2;
    } else if (edict.cost.estimated > 3.00) {
      riskScore -= 0.1;
    }
    
    // 依赖复杂度风险
    const depComplexity = this.calculateDependencyComplexity(edict);
    if (depComplexity > 10) {
      riskScore -= 0.2;
    } else if (depComplexity > 5) {
      riskScore -= 0.1;
    }
    
    return Math.max(0, riskScore);
  }
  
  /**
   * 检查循环依赖
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
   * 计算可并行任务数
   */
  private countParallelTasks(edict: ImperialEdict): number {
    // 找出没有依赖的任务（可并行）
    const tasksWithDeps = new Set(
      edict.dependencies.flatMap(d => d.taskId)
    );
    
    const parallelTasks = edict.tasks.filter(
      task => !tasksWithDeps.has(task.id)
    );
    
    return parallelTasks.length;
  }
  
  /**
   * 计算依赖复杂度
   */
  private calculateDependencyComplexity(edict: ImperialEdict): number {
    let complexity = 0;
    
    for (const dep of edict.dependencies) {
      complexity += dep.dependsOn.length;
    }
    
    return complexity;
  }
  
  /**
   * 生成申诉报告
   */
  generateAppealReport(
    appeal: Appeal,
    secondReview: any
  ): string {
    const report = [
      `# 申诉报告`,
      ``,
      `## 申诉信息`,
      `- 诏书 ID: ${appeal.edictId}`,
      `- 申诉时间: ${appeal.timestamp}`,
      `- 状态: ${appeal.status}`,
      ``,
      `## 申诉理由`,
      appeal.reason,
      ``,
      `## 证据`,
    ];
    
    for (const e of appeal.evidence) {
      report.push(`\n### ${e.type.toUpperCase()}`);
      report.push(`- 描述: ${e.description}`);
      report.push(`- 强度: ${(e.strength * 100).toFixed(0)}%`);
      report.push(`- 详情:`);
      for (const detail of e.details) {
        report.push(`  - ${detail}`);
      }
    }
    
    report.push(`\n## 二次审议结果`);
    report.push(`- 决定: ${secondReview.approved ? "通过" : "驳回"}`);
    report.push(`- 理由: ${secondReview.reason}`);
    report.push(`- 评分: ${(secondReview.score * 100).toFixed(0)}%`);
    
    return report.join("\n");
  }
}

// 导出单例
export const appealHandler = new AppealHandler();

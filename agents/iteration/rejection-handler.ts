/**
 * 封驳迭代处理器
 * 
 * 职责：
 * 1. 处理门下省驳回
 * 2. 中书省修改诏书
 * 3. 重新提交审议
 * 4. 控制迭代次数（最多 3 次）
 * 5. 触发申诉或询问用户
 */

import type {
  ImperialEdict,
  Approval,
  SharedContext,
  RejectionReason,
} from '../types';

export class RejectionHandler {
  private maxIterations: number = 3; // 最多驳回 3 次
  
  /**
   * 处理驳回
   */
  async handleRejection(
    edict: ImperialEdict,
    rejection: RejectionReason,
    context: SharedContext
  ): Promise<{
    action: "modify" | "appeal" | "ask_user" | "abort";
    modifiedEdict?: ImperialEdict;
    appealReason?: string;
    userMessage?: string;
  }> {
    // 1. 检查迭代次数
    if (edict.iteration.rejections >= this.maxIterations) {
      return {
        action: "ask_user",
        userMessage: this.generateUserMessage(edict, rejection),
      };
    }
    
    // 2. 分析驳回理由
    const analysis = this.analyzeRejection(rejection, edict);
    
    // 3. 决定下一步行动
    if (analysis.shouldAppeal) {
      // 提出申诉
      return {
        action: "appeal",
        appealReason: this.generateAppealReason(rejection, edict, analysis),
      };
    } else if (analysis.canModify) {
      // 修改诏书
      const modifiedEdict = await this.modifyEdict(edict, rejection, analysis, context);
      return {
        action: "modify",
        modifiedEdict,
      };
    } else {
      // 无法自动处理，询问用户
      return {
        action: "ask_user",
        userMessage: this.generateUserMessage(edict, rejection),
      };
    }
  }
  
  /**
   * 分析驳回理由
   */
  private analyzeRejection(
    rejection: RejectionReason,
    edict: ImperialEdict
  ): {
    severity: "low" | "medium" | "high";
    shouldAppeal: boolean;
    canModify: boolean;
    modificationStrategy?: string;
  } {
    const issueCount = rejection.issues.length;
    
    // 判断严重性
    let severity: "low" | "medium" | "high" = "low";
    if (rejection.riskLevel === "high" || issueCount > 3) {
      severity = "high";
    } else if (rejection.riskLevel === "medium" || issueCount > 1) {
      severity = "medium";
    }
    
    // 判断是否应该申诉
    const appealKeywords = [
      "过于复杂",
      "不必要",
      "效率",
      "成本过高",
      "过度设计",
      "过度拆分",
    ];
    const shouldAppeal = rejection.issues.some(issue => 
      appealKeywords.some(keyword => issue.includes(keyword))
    );
    
    // 判断是否可以自动修改
    const autoFixableIssues = [
      "成本过高",
      "过于复杂",
      "任务过多",
      "优先级",
    ];
    const canModify = rejection.issues.some(issue =>
      autoFixableIssues.some(keyword => issue.includes(keyword))
    );
    
    // 确定修改策略
    let modificationStrategy: string | undefined;
    if (canModify) {
      if (rejection.issues.some(i => i.includes("成本过高"))) {
        modificationStrategy = "reduce_cost";
      } else if (rejection.issues.some(i => i.includes("过于复杂"))) {
        modificationStrategy = "simplify";
      } else if (rejection.issues.some(i => i.includes("任务过多"))) {
        modificationStrategy = "merge_tasks";
      } else if (rejection.issues.some(i => i.includes("优先级"))) {
        modificationStrategy = "adjust_priorities";
      }
    }
    
    return {
      severity,
      shouldAppeal,
      canModify,
      modificationStrategy,
    };
  }
  
  /**
   * 修改诏书
   */
  private async modifyEdict(
    edict: ImperialEdict,
    rejection: RejectionReason,
    analysis: any,
    context: SharedContext
  ): Promise<ImperialEdict> {
    const modifiedEdict = { ...edict };
    
    // 更新迭代信息
    modifiedEdict.iteration = {
      ...edict.iteration,
      version: edict.iteration.version + 1,
      rejections: edict.iteration.rejections + 1,
      lastModified: new Date().toISOString(),
    };
    
    // 根据策略修改
    switch (analysis.modificationStrategy) {
      case "reduce_cost":
        modifiedEdict.tasks = this.reduceCost(edict.tasks);
        modifiedEdict.cost.estimated *= 0.7; // 降低 30%
        break;
        
      case "simplify":
        modifiedEdict.tasks = this.simplifyTasks(edict.tasks);
        break;
        
      case "merge_tasks":
        modifiedEdict.tasks = this.mergeTasks(edict.tasks);
        break;
        
      case "adjust_priorities":
        modifiedEdict.tasks = this.adjustPriorities(edict.tasks, rejection);
        break;
    }
    
    // 重新分析依赖
    modifiedEdict.dependencies = this.reanalyzeDependencies(modifiedEdict.tasks);
    
    return modifiedEdict;
  }
  
  /**
   * 降低成本
   */
  private reduceCost(tasks: any[]): any[] {
    // 移除低优先级的任务
    return tasks.filter(task => task.priority === "high");
  }
  
  /**
   * 简化任务
   */
  private simplifyTasks(tasks: any[]): any[] {
    // 合并相似的任务
    return tasks.filter((task, index, self) => 
      index === self.findIndex(t => 
        t.assignedTo === task.assignedTo && 
        task.priority === "high"
      )
    );
  }
  
  /**
   * 合并任务
   */
  private mergeTasks(tasks: any[]): any[] {
    // 按部门分组合并
    const grouped = new Map<string, any[]>();
    
    for (const task of tasks) {
      const ministry = task.assignedTo;
      if (!grouped.has(ministry)) {
        grouped.set(ministry, []);
      }
      grouped.get(ministry)!.push(task);
    }
    
    // 合并同部门的任务
    const merged: any[] = [];
    for (const [ministry, ministryTasks] of grouped) {
      if (ministryTasks.length === 1) {
        merged.push(ministryTasks[0]);
      } else {
        // 合并为一个任务
        merged.push({
          id: `merged-${Date.now()}`,
          description: ministryTasks.map(t => t.description).join("; "),
          assignedTo: ministry,
          priority: "high",
          todos: ministryTasks.flatMap(t => t.todos),
          status: "pending",
        });
      }
    }
    
    return merged;
  }
  
  /**
   * 调整优先级
   */
  private adjustPriorities(tasks: any[], rejection: RejectionReason): any[] {
    // 根据建议调整优先级
    return tasks.map(task => ({
      ...task,
      priority: task.priority === "high" ? "medium" : task.priority,
    }));
  }
  
  /**
   * 重新分析依赖
   */
  private reanalyzeDependencies(tasks: any[]): any[] {
    const dependencies: any[] = [];
    const taskIds = tasks.map(t => t.id);
    
    for (let i = 1; i < tasks.length; i++) {
      dependencies.push({
        taskId: tasks[i].id,
        dependsOn: [tasks[i - 1].id],
      });
    }
    
    return dependencies;
  }
  
  /**
   * 生成申诉理由
   */
  private generateAppealReason(
    rejection: RejectionReason,
    edict: ImperialEdict,
    analysis: any
  ): string {
    const reasons: string[] = [];
    
    reasons.push(`关于门下省的驳回意见，中书省认为：`);
    reasons.push(`\n驳回理由：${rejection.issues.join("; ")}`);
    reasons.push(`\n\n申诉理由：`);
    
    if (analysis.shouldAppeal) {
      reasons.push(`1. 该任务拆分是基于完整的技术评估和上下文分析`);
      reasons.push(`2. 任务之间的依赖关系经过仔细分析，确保执行顺序合理`);
      reasons.push(`3. 预估成本在合理范围内（$${edict.cost.estimated.toFixed(2)}）`);
      reasons.push(`4. 任务复杂度与用户请求的复杂度匹配`);
    }
    
    reasons.push(`\n\n请门下省重新审议。`);
    
    return reasons.join("\n");
  }
  
  /**
   * 生成用户消息
   */
  private generateUserMessage(
    edict: ImperialEdict,
    rejection: RejectionReason
  ): string {
    const message = [
      `任务计划已被驳回 ${edict.iteration.rejections} 次，无法自动调整。`,
      ``,
      `驳回原因：`,
      ...rejection.issues.map((issue, i) => `${i + 1}. ${issue}`),
      ``,
      `建议：`,
      ...rejection.suggestions.map((suggestion, i) => `${i + 1}. ${suggestion}`),
      ``,
      `请选择：`,
      `1. 简化任务（移除低优先级部分）`,
      `2. 调整预算（提高成本上限）`,
      `3. 分步执行（拆分为多个独立任务）`,
      `4. 取消任务`,
    ];
    
    return message.join("\n");
  }
  
  /**
   * 检查是否应该中止
   */
  shouldAbort(edict: ImperialEdict): boolean {
    // 超过最大迭代次数
    if (edict.iteration.rejections >= this.maxIterations) {
      return true;
    }
    
    // 申诉被驳回
    if (edict.iteration.appeals >= 1) {
      return true;
    }
    
    return false;
  }
}

// 导出单例
export const rejectionHandler = new RejectionHandler();

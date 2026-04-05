/**
 * 验收迭代处理器
 * 
 * 职责：
 * 1. 门下省最终验收
 * 2. 质量检查
 * 3. 安全检查
 * 4. 测试检查
 * 5. 不通过时触发重新执行
 * 6. 控制验收迭代次数（最多 2 次）
 */

import type {
  ImperialEdict,
  AcceptanceReport,
  ExecutionRecord,
  SharedContext,
  ValidationResult,
} from '../types';

export class AcceptanceHandler {
  private maxIterations: number = 2; // 最多验收 2 次
  
  /**
   * 执行验收
   */
  async performAcceptance(
    edict: ImperialEdict,
    executionRecords: ExecutionRecord[],
    context: SharedContext
  ): Promise<AcceptanceReport> {
    const reportId = this.generateReportId();
    const timestamp = new Date().toISOString();
    
    // 1. 执行各项检查
    const checks = {
      quality: await this.checkQuality(executionRecords),
      security: await this.checkSecurity(executionRecords),
      tests: await this.checkTests(executionRecords),
      performance: await this.checkPerformance(executionRecords),
      completeness: await this.checkCompleteness(edict, executionRecords),
    };
    
    // 2. 判断是否通过
    const allPassed = Object.values(checks).every(v => v === true);
    
    // 3. 收集问题
    const issues: string[] = [];
    if (!checks.quality) issues.push("代码质量检查未通过");
    if (!checks.security) issues.push("安全检查未通过");
    if (!checks.tests) issues.push("测试未通过");
    if (!checks.performance) issues.push("性能检查未通过");
    if (!checks.completeness) issues.push("任务未完全完成");
    
    // 4. 生成验收报告
    const report: AcceptanceReport = {
      edictId: edict.id,
      taskId: executionRecords[0]?.taskId || "unknown",
      timestamp,
      passed: allPassed,
      checks,
      issues,
    };
    
    // 5. 如果不通过，生成修复建议
    if (!allPassed) {
      report.rejection = {
        reason: issues.join("；"),
        suggestedFix: this.generateSuggestedFix(checks, executionRecords),
        retryCount: edict.iteration.rejections,
      };
    }
    
    return report;
  }
  
  /**
   * 检查代码质量
   */
  private async checkQuality(records: ExecutionRecord[]): Promise<boolean> {
    // 检查所有执行记录的质量
    for (const record of records) {
      if (record.status === "failed") {
        return false;
      }
      
      // 检查迭代结果
      for (const iteration of record.iterations) {
        if (iteration.result === "failure") {
          // 如果有失败的迭代，但没有后续成功的修复，则质量不通过
          const hasFix = record.iterations.some(
            (iter, idx) => 
              idx > record.iterations.indexOf(iteration) && 
              iter.result === "success"
          );
          if (!hasFix) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  /**
   * 检查安全性
   */
  private async checkSecurity(records: ExecutionRecord[]): Promise<boolean> {
    // 检查是否有安全相关的失败
    for (const record of records) {
      for (const iteration of record.iterations) {
        // 检查输出中是否有安全警告
        if (iteration.output) {
          const output = JSON.stringify(iteration.output).toLowerCase();
          if (output.includes("security") && output.includes("fail")) {
            return false;
          }
          if (output.includes("vulnerability")) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  /**
   * 检查测试
   */
  private async checkTests(records: ExecutionRecord[]): Promise<boolean> {
    // 检查是否有测试失败
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
  
  /**
   * 检查性能
   */
  private async checkPerformance(records: ExecutionRecord[]): Promise<boolean> {
    // 检查执行时间是否过长
    for (const record of records) {
      if (record.duration && record.duration > 300000) { // 5 分钟
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 检查完整性
   */
  private async checkCompleteness(
    edict: ImperialEdict,
    records: ExecutionRecord[]
  ): Promise<boolean> {
    // 检查所有任务是否都已执行
    const executedTaskIds = new Set(records.map(r => r.taskId));
    
    for (const task of edict.tasks) {
      if (!executedTaskIds.has(task.id)) {
        return false;
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
  
  /**
   * 生成修复建议
   */
  private generateSuggestedFix(
    checks: AcceptanceReport["checks"],
    records: ExecutionRecord[]
  ): string {
    const suggestions: string[] = [];
    
    if (!checks.quality) {
      suggestions.push("修复代码质量问题（lint 错误、类型错误）");
    }
    
    if (!checks.security) {
      suggestions.push("处理安全问题（漏洞、敏感数据）");
    }
    
    if (!checks.tests) {
      suggestions.push("修复失败的测试用例");
    }
    
    if (!checks.performance) {
      suggestions.push("优化性能瓶颈");
    }
    
    if (!checks.completeness) {
      const failedTasks = records.filter(r => r.status !== "completed");
      suggestions.push(`重新执行失败的任务：${failedTasks.map(r => r.taskId).join(", ")}`);
    }
    
    return suggestions.join("；");
  }
  
  /**
   * 处理验收失败
   */
  async handleAcceptanceFailure(
    report: AcceptanceReport,
    edict: ImperialEdict,
    context: SharedContext
  ): Promise<{
    action: "retry" | "partial_accept" | "ask_user" | "abort";
    retryTasks?: string[];
    userMessage?: string;
  }> {
    // 1. 检查迭代次数
    if (edict.iteration.rejections >= this.maxIterations) {
      return {
        action: "ask_user",
        userMessage: this.generateUserMessage(report, edict),
      };
    }
    
    // 2. 分析失败原因
    const failureAnalysis = this.analyzeFailure(report, edict);
    
    // 3. 决定下一步行动
    if (failureAnalysis.canRetry) {
      // 可以重试
      return {
        action: "retry",
        retryTasks: failureAnalysis.retryTasks,
      };
    } else if (failureAnalysis.canPartialAccept) {
      // 可以部分接受
      return {
        action: "partial_accept",
        userMessage: "部分任务已完成，是否接受当前结果？",
      };
    } else {
      // 无法自动处理，询问用户
      return {
        action: "ask_user",
        userMessage: this.generateUserMessage(report, edict),
      };
    }
  }
  
  /**
   * 分析失败原因
   */
  private analyzeFailure(
    report: AcceptanceReport,
    edict: ImperialEdict
  ): {
    canRetry: boolean;
    canPartialAccept: boolean;
    retryTasks: string[];
    severity: "low" | "medium" | "high";
  } {
    const failedChecks = Object.entries(report.checks)
      .filter(([_, passed]) => !passed)
      .map(([name]) => name);
    
    // 判断严重性
    let severity: "low" | "medium" | "high" = "low";
    if (failedChecks.includes("security") || failedChecks.includes("tests")) {
      severity = "high";
    } else if (failedChecks.length > 2) {
      severity = "medium";
    }
    
    // 判断是否可以重试
    const canRetry = failedChecks.includes("tests") || 
                     failedChecks.includes("quality") ||
                     failedChecks.includes("completeness");
    
    // 判断是否可以部分接受
    const canPartialAccept = failedChecks.includes("performance") && 
                              failedChecks.length === 1;
    
    // 确定需要重试的任务
    const retryTasks: string[] = [];
    if (failedChecks.includes("completeness") && report.rejection) {
      // 从报告中提取需要重试的任务
      // 简化：返回所有任务
      retryTasks.push(...edict.tasks.map(t => t.id));
    }
    
    return {
      canRetry,
      canPartialAccept,
      retryTasks,
      severity,
    };
  }
  
  /**
   * 生成用户消息
   */
  private generateUserMessage(
    report: AcceptanceReport,
    edict: ImperialEdict
  ): string {
    const message = [
      `验收未通过，已尝试 ${edict.iteration.rejections} 次。`,
      ``,
      `未通过项：`,
      ...Object.entries(report.checks)
        .filter(([_, passed]) => !passed)
        .map(([name]) => `- ${name}`),
      ``,
      `问题：`,
      ...report.issues.map((issue, i) => `${i + 1}. ${issue}`),
      ``,
      `修复建议：`,
      report.rejection?.suggestedFix || "无",
      ``,
      `请选择：`,
      `1. 重试失败的任务`,
      `2. 接受当前结果（部分完成）`,
      `3. 重新制定计划`,
      `4. 取消任务`,
    ];
    
    return message.join("\n");
  }
  
  /**
   * 生成验收报告
   */
  generateAcceptanceReport(report: AcceptanceReport): string {
    const lines = [
      `# 验收报告`,
      ``,
      `## 基本信息`,
      `- 诏书 ID: ${report.edictId}`,
      `- 任务 ID: ${report.taskId}`,
      `- 验收时间: ${report.timestamp}`,
      `- 结果: ${report.passed ? "✅ 通过" : "❌ 未通过"}`,
      ``,
      `## 检查结果`,
    ];
    
    for (const [name, passed] of Object.entries(report.checks)) {
      lines.push(`- ${name}: ${passed ? "✅" : "❌"}`);
    }
    
    if (!report.passed) {
      lines.push(`\n## 问题`);
      for (const issue of report.issues) {
        lines.push(`- ${issue}`);
      }
      
      if (report.rejection) {
        lines.push(`\n## 修复建议`);
        lines.push(report.rejection.suggestedFix);
      }
    }
    
    return lines.join("\n");
  }
  
  /**
   * 生成报告 ID
   */
  private generateReportId(): string {
    return `acceptance-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }
  
  /**
   * 检查是否应该中止
   */
  shouldAbort(edict: ImperialEdict): boolean {
    return edict.iteration.rejections >= this.maxIterations;
  }
}

// 导出单例
export const acceptanceHandler = new AcceptanceHandler();

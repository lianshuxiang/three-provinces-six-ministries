/**
 * 刑部 - 测试与审计部
 * 
 * 职责：
 * 1. 独立测试（单元测试、集成测试）
 * 2. 日志审计
 * 3. 覆盖率分析
 * 4. 代码质量检查
 * 5. 结果验证
 * 
 * 模型：GLM-4.7（成本优化，测试任务较简单）
 */

import type {
  EdictTask,
  ExecutionIteration,
  SharedContext,
  TestResult,
  AuditLog,
} from '../../types';

export class XingbuMinistry {
  private model: "glm-5" = "glm-5"; // 最高权限规则 R000：强制使用 GLM-5
  
  /**
   * 执行测试任务
   */
  async executeTask(
    task: EdictTask,
    context: SharedContext
  ): Promise<ExecutionIteration[]> {
    const iterations: ExecutionIteration[] = [];
    
    // 刑部的核心职责：独立测试
    const testResult = await this.runTests(task, context);
    
    iterations.push({
      round: 1,
      agent: "tester",
      model: this.model,
      action: `独立测试: ${task.description}`,
      result: testResult.passed ? "success" : "failure",
      verification: {
        command: testResult.command,
        output: testResult.output,
        passed: testResult.passed,
      },
      timestamp: new Date().toISOString(),
    });
    
    return iterations;
  }
  
  /**
   * 运行测试
   */
  async runTests(
    task: EdictTask,
    context: SharedContext
  ): Promise<TestResult> {
    // 1. 确定测试类型
    const testType = this.determineTestType(task);
    
    // 2. 执行测试
    const result = await this.executeTest(testType, task);
    
    // 3. 分析覆盖率
    const coverage = await this.analyzeCoverage(task);
    
    return {
      type: testType,
      passed: result.passed,
      output: result.output,
      command: result.command,
      coverage,
      failedTests: result.failedTests,
      passedTests: result.passedTests,
    };
  }
  
  /**
   * 确定测试类型
   */
  private determineTestType(task: EdictTask): "unit" | "integration" | "e2e" {
    const description = task.description.toLowerCase();
    
    if (description.includes("集成") || description.includes("integration")) {
      return "integration";
    }
    if (description.includes("e2e") || description.includes("端到端")) {
      return "e2e";
    }
    return "unit";
  }
  
  /**
   * 执行测试
   */
  private async executeTest(
    testType: "unit" | "integration" | "e2e",
    task: EdictTask
  ): Promise<{
    passed: boolean;
    output: string;
    command: string;
    failedTests: number;
    passedTests: number;
  }> {
    // 根据测试类型执行不同的命令
    const commands = {
      unit: "npm test -- --coverage",
      integration: "npm run test:integration",
      e2e: "npm run test:e2e",
    };
    
    const command = commands[testType];
    
    // 实际会执行命令
    // 这里返回模拟结果
    return {
      passed: true,
      output: "✓ All tests passed\nTests: 10 passed, 0 failed",
      command,
      failedTests: 0,
      passedTests: 10,
    };
  }
  
  /**
   * 分析覆盖率
   */
  private async analyzeCoverage(task: EdictTask): Promise<{
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  }> {
    // 实际会解析覆盖率报告
    // 这里返回模拟数据
    return {
      lines: 85,
      functions: 90,
      branches: 75,
      statements: 88,
    };
  }
  
  /**
   * 日志审计
   */
  async auditLogs(
    task: EdictTask,
    context: SharedContext
  ): Promise<AuditLog> {
    const entries: AuditLog["entries"] = [];
    
    // 1. 收集日志
    const logs = await this.collectLogs(task);
    
    // 2. 分析日志
    const analysis = await this.analyzeLogs(logs);
    
    // 3. 生成审计条目
    for (const event of analysis.events) {
      entries.push({
        timestamp: event.timestamp,
        action: event.action,
        agent: event.agent,
        result: event.result,
        details: event.details,
      });
    }
    
    return {
      taskId: task.id,
      entries,
      summary: {
        totalEvents: analysis.events.length,
        failedEvents: analysis.events.filter(e => e.result === "failure").length,
        warnings: analysis.warnings,
      },
    };
  }
  
  /**
   * 收集日志
   */
  private async collectLogs(task: EdictTask): Promise<string[]> {
    // 实际会从日志系统收集
    return [
      `[INFO] Task ${task.id} started`,
      `[INFO] Assigned to ${task.assignedTo}`,
      `[INFO] Executing task: ${task.description}`,
      `[INFO] Task completed successfully`,
    ];
  }
  
  /**
   * 分析日志
   */
  private async analyzeLogs(logs: string[]): Promise<{
    events: Array<{
      timestamp: string;
      action: string;
      agent: string;
      result: "success" | "failure" | "warning";
      details?: any;
    }>;
    warnings: string[];
  }> {
    const events: any[] = [];
    const warnings: string[] = [];
    
    for (const log of logs) {
      const timestamp = new Date().toISOString();
      
      if (log.includes("[INFO]")) {
        events.push({
          timestamp,
          action: log.replace("[INFO] ", ""),
          agent: "system",
          result: "success",
        });
      } else if (log.includes("[WARN]")) {
        events.push({
          timestamp,
          action: log.replace("[WARN] ", ""),
          agent: "system",
          result: "warning",
        });
        warnings.push(log);
      } else if (log.includes("[ERROR]")) {
        events.push({
          timestamp,
          action: log.replace("[ERROR] ", ""),
          agent: "system",
          result: "failure",
        });
      }
    }
    
    return { events, warnings };
  }
  
  /**
   * 代码质量检查
   */
  async checkCodeQuality(code: string): Promise<{
    score: number;
    issues: Array<{
      type: string;
      severity: "info" | "warning" | "error";
      message: string;
      line?: number;
    }>;
    metrics: {
      linesOfCode: number;
      complexity: number;
      maintainability: number;
    };
  }> {
    const issues: any[] = [];
    
    // 1. Lint 检查
    const lintIssues = await this.runLint(code);
    issues.push(...lintIssues);
    
    // 2. 类型检查
    const typeIssues = await this.runTypeCheck(code);
    issues.push(...typeIssues);
    
    // 3. 计算指标
    const metrics = this.calculateMetrics(code);
    
    // 4. 计算分数
    const score = this.calculateScore(issues, metrics);
    
    return {
      score,
      issues,
      metrics,
    };
  }
  
  /**
   * 运行 Lint
   */
  private async runLint(code: string): Promise<any[]> {
    // 实际会运行 ESLint
    const issues: any[] = [];
    
    // 简单检查
    if (code.includes("console.log")) {
      issues.push({
        type: "lint",
        severity: "warning",
        message: "避免使用 console.log",
      });
    }
    
    if (code.includes("var ")) {
      issues.push({
        type: "lint",
        severity: "warning",
        message: "使用 let 或 const 代替 var",
      });
    }
    
    return issues;
  }
  
  /**
   * 运行类型检查
   */
  private async runTypeCheck(code: string): Promise<any[]> {
    // 实际会运行 TypeScript 编译器
    const issues: any[] = [];
    
    // 简单检查
    if (code.includes(": any")) {
      issues.push({
        type: "type",
        severity: "info",
        message: "避免使用 any 类型",
      });
    }
    
    return issues;
  }
  
  /**
   * 计算指标
   */
  private calculateMetrics(code: string): {
    linesOfCode: number;
    complexity: number;
    maintainability: number;
  } {
    const lines = code.split('\n').length;
    
    // 简化的复杂度计算
    const complexityKeywords = ["if", "for", "while", "switch", "catch"];
    let complexity = 1;
    for (const keyword of complexityKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }
    
    // 可维护性指数（0-100）
    const maintainability = Math.max(0, 100 - complexity * 5);
    
    return {
      linesOfCode: lines,
      complexity,
      maintainability,
    };
  }
  
  /**
   * 计算分数
   */
  private calculateScore(issues: any[], metrics: any): number {
    let score = 100;
    
    // 根据问题扣分
    for (const issue of issues) {
      if (issue.severity === "error") score -= 10;
      if (issue.severity === "warning") score -= 5;
      if (issue.severity === "info") score -= 1;
    }
    
    // 根据复杂度扣分
    if (metrics.complexity > 20) score -= 10;
    if (metrics.complexity > 30) score -= 20;
    
    return Math.max(0, score);
  }
  
  /**
   * 验证结果
   */
  async validateResult(
    expectedResult: any,
    actualResult: any
  ): Promise<{
    match: boolean;
    differences: Array<{
      path: string;
      expected: any;
      actual: any;
    }>;
  }> {
    const differences: any[] = [];
    
    // 简单的深度比较
    this.deepCompare(expectedResult, actualResult, "", differences);
    
    return {
      match: differences.length === 0,
      differences,
    };
  }
  
  /**
   * 深度比较
   */
  private deepCompare(
    expected: any,
    actual: any,
    path: string,
    differences: any[]
  ): void {
    if (typeof expected !== typeof actual) {
      differences.push({
        path: path || "root",
        expected: typeof expected,
        actual: typeof actual,
      });
      return;
    }
    
    if (typeof expected !== "object" || expected === null) {
      if (expected !== actual) {
        differences.push({
          path: path || "root",
          expected,
          actual,
        });
      }
      return;
    }
    
    // 比较对象
    for (const key in expected) {
      const newPath = path ? `${path}.${key}` : key;
      if (!(key in actual)) {
        differences.push({
          path: newPath,
          expected: expected[key],
          actual: undefined,
        });
      } else {
        this.deepCompare(expected[key], actual[key], newPath, differences);
      }
    }
    
    // 检查额外的键
    for (const key in actual) {
      if (!(key in expected)) {
        const newPath = path ? `${path}.${key}` : key;
        differences.push({
          path: newPath,
          expected: undefined,
          actual: actual[key],
        });
      }
    }
  }
}

// 导出单例
export const xingbuMinistry = new XingbuMinistry();

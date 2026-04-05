/**
 * 工部 - 工程开发部
 * 
 * 职责：
 * 1. 代码实现与修改
 * 2. 文件读写操作
 * 3. 代码重构
 * 4. Sub Agent 管理（Coder/Tester/Fixer）
 * 5. 代码质量保证
 * 
 * 模型：GLM-5（强推理，复杂代码任务）
 */

import type {
  EdictTask,
  Todo,
  ExecutionIteration,
  SharedContext,
  CodeChange,
  ValidationResult,
} from '../types';

export class GongbuMinistry {
  private model: "glm-5" = "glm-5";
  private maxSelfIterations: number = 5; // Sub Agent 自迭代最多 5 次
  
  /**
   * 执行任务
   */
  async executeTask(
    task: EdictTask,
    context: SharedContext
  ): Promise<ExecutionIteration[]> {
    const iterations: ExecutionIteration[] = [];
    let round = 0;
    let success = false;

    while (!success && round < this.maxSelfIterations) {
      round++;

      // 1. Coder Agent - 编写代码
      const coderResult = await this.runCoderAgent(task, context, round);
      iterations.push(coderResult);

      if (coderResult.result === "failure") {
        break;
      }

      // 2. Tester Agent - 独立测试（由刑部执行）
      const testerResult = await this.runTesterAgent(task, context, round);
      iterations.push(testerResult);

      if (testerResult.result === "success") {
        success = true;
        break;
      }

      // 3. Fixer Agent - 修复失败
      if (testerResult.result === "failure") {
        const fixerResult = await this.runFixerAgent(
          task,
          context,
          round,
          testerResult
        );
        iterations.push(fixerResult);

        if (fixerResult.result === "success") {
          // 再次测试
          const retestResult = await this.runTesterAgent(task, context, round);
          iterations.push(retestResult);

          if (retestResult.result === "success") {
            success = true;
          }
        }
      }
    }

    return iterations;
  }

  /**
   * Coder Agent - 编写代码
   */
  private async runCoderAgent(
    task: EdictTask,
    context: SharedContext,
    round: number
  ): Promise<ExecutionIteration> {
    const timestamp = new Date().toISOString();

    // 分析任务
    const analysis = await this.analyzeTask(task, context);

    // 生成代码变更
    const changes = await this.generateCodeChanges(task, analysis, context);

    // 应用变更
    const applied = await this.applyChanges(changes);

    // 返回迭代记录
    return {
      round,
      agent: "coder",
      model: this.model,
      action: `执行: ${task.description}`,
      result: applied.success ? "success" : "failure",
      output: {
        analysis,
        changes: changes.map(c => ({
          file: c.file,
          type: c.type,
          lines: c.newContent.split('\n').length,
        })),
      },
      timestamp,
    };
  }

  /**
   * Tester Agent - 独立测试
   * 注意：实际由刑部执行，这里只是接口
   */
  private async runTesterAgent(
    task: EdictTask,
    context: SharedContext,
    round: number
  ): Promise<ExecutionIteration> {
    const timestamp = new Date().toISOString();

    // 调用刑部进行独立测试
    // 实际会通过事件总线调用 xingbu.testCode()
    const testResult = await this.invokeXingbuTest(task);

    return {
      round,
      agent: "tester",
      model: "glm-4.7", // 刑部使用 GLM-4.7
      action: `测试: ${task.description}`,
      result: testResult.passed ? "success" : "failure",
      verification: {
        command: testResult.command,
        output: testResult.output,
        passed: testResult.passed,
      },
      timestamp,
    };
  }

  /**
   * Fixer Agent - 修复失败
   */
  private async runFixerAgent(
    task: EdictTask,
    context: SharedContext,
    round: number,
    failureInfo: ExecutionIteration
  ): Promise<ExecutionIteration> {
    const timestamp = new Date().toISOString();

    // 分析失败原因
    const failureAnalysis = await this.analyzeFailure(failureInfo);

    // 生成修复方案
    const fixPlan = await this.generateFixPlan(failureAnalysis, context);

    // 应用修复
    const fixChanges = await this.applyFix(fixPlan);

    return {
      round,
      agent: "fixer",
      model: this.model,
      action: `修复: ${failureInfo.verification?.output}`,
      result: fixChanges.success ? "success" : "failure",
      output: {
        failureAnalysis,
        fixPlan,
      },
      timestamp,
    };
  }

  /**
   * 分析任务
   */
  private async analyzeTask(
    task: EdictTask,
    context: SharedContext
  ): Promise<{
    type: "create" | "modify" | "delete" | "refactor";
    scope: "single" | "multiple" | "global";
    complexity: "low" | "medium" | "high";
    risks: string[];
  }> {
    const description = task.description.toLowerCase();

    // 检测任务类型
    let type: "create" | "modify" | "delete" | "refactor" = "modify";
    if (description.includes("创建") || description.includes("新建")) {
      type = "create";
    } else if (description.includes("删除") || description.includes("移除")) {
      type = "delete";
    } else if (description.includes("重构")) {
      type = "refactor";
    }

    // 检测范围
    const scope = this.detectScope(description);

    // 检测复杂度
    const complexity = this.detectComplexity(task, context);

    // 检测风险
    const risks = this.detectRisks(description);

    return { type, scope, complexity, risks };
  }

  /**
   * 生成代码变更
   */
  private async generateCodeChanges(
    task: EdictTask,
    analysis: any,
    context: SharedContext
  ): Promise<CodeChange[]> {
    const changes: CodeChange[] = [];

    // 根据任务类型生成不同的变更
    switch (analysis.type) {
      case "create":
        changes.push(await this.generateCreateChanges(task, context));
        break;
      case "modify":
        changes.push(...(await this.generateModifyChanges(task, context)));
        break;
      case "delete":
        changes.push(await this.generateDeleteChanges(task, context));
        break;
      case "refactor":
        changes.push(...(await this.generateRefactorChanges(task, context)));
        break;
    }

    return changes;
  }

  /**
   * 生成创建文件的变更
   */
  private async generateCreateChanges(
    task: EdictTask,
    context: SharedContext
  ): Promise<CodeChange> {
    // 实际会通过 GLM-5 生成代码
    return {
      file: this.inferFilePath(task.description),
      type: "create",
      oldContent: "",
      newContent: `// Generated by Gongbu Ministry\n// Task: ${task.description}\n\nexport function placeholder() {\n  // TODO: Implement\n}\n`,
      reason: `创建新文件以完成任务: ${task.description}`,
    };
  }

  /**
   * 生成修改文件的变更
   */
  private async generateModifyChanges(
    task: EdictTask,
    context: SharedContext
  ): Promise<CodeChange[]> {
    // 实际会读取文件，分析需要修改的部分
    const filePath = this.inferFilePath(task.description);

    return [
      {
        file: filePath,
        type: "modify",
        oldContent: "// old content",
        newContent: "// new content",
        reason: `修改文件以完成任务: ${task.description}`,
      },
    ];
  }

  /**
   * 生成删除文件的变更
   */
  private async generateDeleteChanges(
    task: EdictTask,
    context: SharedContext
  ): Promise<CodeChange> {
    return {
      file: this.inferFilePath(task.description),
      type: "delete",
      oldContent: "// content to delete",
      newContent: "",
      reason: `删除文件以完成任务: ${task.description}`,
    };
  }

  /**
   * 生成重构的变更
   */
  private async generateRefactorChanges(
    task: EdictTask,
    context: SharedContext
  ): Promise<CodeChange[]> {
    // 重构通常涉及多个文件
    return [
      {
        file: "example1.ts",
        type: "modify",
        oldContent: "// old",
        newContent: "// refactored",
        reason: "重构：提取公共逻辑",
      },
      {
        file: "example2.ts",
        type: "modify",
        oldContent: "// old",
        newContent: "// refactored",
        reason: "重构：更新依赖",
      },
    ];
  }

  /**
   * 应用变更
   */
  private async applyChanges(changes: CodeChange[]): Promise<{
    success: boolean;
    appliedChanges: number;
  }> {
    // 实际会通过文件系统应用变更
    // 这里简化处理
    return {
      success: true,
      appliedChanges: changes.length,
    };
  }

  /**
   * 调用刑部测试
   */
  private async invokeXingbuTest(task: EdictTask): Promise<{
    passed: boolean;
    command: string;
    output: string;
  }> {
    // 实际会通过事件总线调用刑部
    // 这里返回模拟结果
    return {
      passed: true,
      command: "npm test",
      output: "All tests passed",
    };
  }

  /**
   * 分析失败原因
   */
  private async analyzeFailure(failureInfo: ExecutionIteration): Promise<{
    type: "syntax" | "logic" | "test" | "integration";
    rootCause: string;
    affectedFiles: string[];
  }> {
    const output = failureInfo.verification?.output || "";

    // 简单的关键词匹配
    let type: "syntax" | "logic" | "test" | "integration" = "test";
    if (output.includes("SyntaxError")) {
      type = "syntax";
    } else if (output.includes("AssertionError")) {
      type = "logic";
    } else if (output.includes("Integration")) {
      type = "integration";
    }

    return {
      type,
      rootCause: output,
      affectedFiles: this.extractAffectedFiles(output),
    };
  }

  /**
   * 生成修复方案
   */
  private async generateFixPlan(
    failureAnalysis: any,
    context: SharedContext
  ): Promise<{
    strategy: string;
    steps: string[];
    estimatedChanges: number;
  }> {
    return {
      strategy: `修复 ${failureAnalysis.type} 错误`,
      steps: [
        "分析错误堆栈",
        "定位问题代码",
        "生成修复代码",
        "应用修复",
      ],
      estimatedChanges: failureAnalysis.affectedFiles.length,
    };
  }

  /**
   * 应用修复
   */
  private async applyFix(fixPlan: any): Promise<{
    success: boolean;
    changesApplied: number;
  }> {
    // 实际会应用修复代码
    return {
      success: true,
      changesApplied: fixPlan.estimatedChanges,
    };
  }

  /**
   * 检测范围
   */
  private detectScope(description: string): "single" | "multiple" | "global" {
    if (description.includes("所有") || description.includes("全部")) {
      return "global";
    }
    if (description.includes("多个")) {
      return "multiple";
    }
    return "single";
  }

  /**
   * 检测复杂度
   */
  private detectComplexity(
    task: EdictTask,
    context: SharedContext
  ): "low" | "medium" | "high" {
    // 根据 Todo 数量判断
    if (task.todos.length > 5) return "high";
    if (task.todos.length > 2) return "medium";
    return "low";
  }

  /**
   * 检测风险
   */
  private detectRisks(description: string): string[] {
    const risks: string[] = [];
    const riskKeywords: Record<string, string> = {
      "删除": "data_loss",
      "生产": "production_environment",
      "数据库": "database_change",
      "迁移": "migration_risk",
    };

    for (const [keyword, risk] of Object.entries(riskKeywords)) {
      if (description.includes(keyword)) {
        risks.push(risk);
      }
    }

    return risks;
  }

  /**
   * 推断文件路径
   */
  private inferFilePath(description: string): string {
    // 简化：从描述中提取文件名
    const match = description.match(/(\w+\.\w+)/);
    return match ? match[1] : "unknown.ts";
  }

  /**
   * 提取受影响的文件
   */
  private extractAffectedFiles(output: string): string[] {
    // 简化：从错误输出中提取文件名
    const files: string[] = [];
    const regex = /([\/\w-]+\.\w+)/g;
    const matches = output.match(regex);
    if (matches) {
      files.push(...matches);
    }
    return files;
  }
}

// 导出单例
export const gongbuMinistry = new GongbuMinistry();

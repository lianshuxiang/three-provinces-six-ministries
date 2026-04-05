/**
 * 路由层 - 任务分类与路由决策
 */

import type {
  TaskComplexity,
  RoutingDecision,
  Model
} from './types';

export class Router {
  private patterns = {
    simple: [
      /^什么是/,
      /^解释/,
      /^说明/,
      /^如何(理解|实现|解决)/,
      /^为什么/,
      /是什么$/,
      /怎么(样|做)$/,
      /^定义/,
      /^比较/,
      /^列出/,
      /^总结/,
      /^翻译/,
      /^格式化/,
    ],
    medium: [
      /^读取/,
      /^查看/,
      /^修改(单个)?/,
      /^更新/,
      /^添加(一个)?/,
      /^删除(一个)?/,
      /^重命名/,
      /^移动/,
      /^复制/,
      /^搜索/,
      /^查找/,
      /^运行(单个)?(命令|脚本)/,
      /^安装/,
      /^卸载/,
    ];
    complex: [
      /^重构/,
      /^实现(新)?功能/,
      /^开发/,
      /^修复(多个)?/,
      /^优化/,
      /^迁移/,
      /^集成/,
      /^部署/,
      /系统/,
      /架构/,
      /模块/,
      /多个文件/,
      /全部/,
      /整体/,
    ],
    emergency: [
      /紧急/,
      /立即/,
      /马上/,
      /force/i,
      /生产/,
      /production/i,
      /critical/i,
      /严重/,
      /宕机/,
      /崩溃/,
      /事故/,
      /报警/,
      /故障/,
    ],
  };

  private modelCosts: Record<Model, { input: number; output: number }> = {
    "glm-4.7": { input: 0.5 / 1_000_000, output: 2 / 1_000_000 },
    "glm-5": { input: 15 / 1_000_000, output: 60 / 1_000_000 },
  };

  /**
   * 分类用户意图
   */
  classify(intent: string): RoutingDecision {
    const taskId = this.generateTaskId();
    const timestamp = new Date().toISOString();

    // 1. 检测紧急模式
    const isEmergency = this.detectEmergency(intent);

    // 2. 判断复杂度
    const complexity = this.assessComplexity(intent);

    // 3. 决定路由
    const route = this.determineRoute(complexity, isEmergency);

    // 4. 预估时间和成本
    const estimate = this.estimate(route, complexity);

    // 5. 生成理由
    const reason = this.generateReason(complexity, route, isEmergency);

    return {
      taskId,
      timestamp,
      complexity,
      route,
      emergency: isEmergency
      reason
      estimate
    };
  }

  private detectEmergency(intent: string): boolean {
    return this.patterns.emergency.some(pattern => pattern.test(intent));
  }

  private assessComplexity(intent: string): TaskComplexity {
    // 检查简单模式
    if (this.patterns.simple.some(p => p.test(intent))) {
      // 但如果包含复杂关键词，仍为复杂
      if (this.patterns.complex.some(p => p.test(intent))) {
        return "complex";
      }
      return "simple";
    }

    // 检查中等模式
    if (this.patterns.medium.some(p => p.test(intent))) {
      // 如果涉及多个操作，提升为复杂
      const multiKeywords = /多个|所有|全部|批量|递归|整个/;
      if (multiKeywords.test(intent)) {
        return "complex";
      }
      return "medium";
    }

    // 检查复杂模式
    if (this.patterns.complex.some(p => p.test(intent))) {
      return "complex";
    }

    // 默认：中文字数判断
    const charCount = intent.replace(/[^\u4e00-\u9fa5]/g, '').length;
    if (charCount > 50) {
      return "complex";
    } else if (charCount > 20) {
      return "medium";
    }

    return "simple";
  }

  private determineRoute(
    complexity: TaskComplexity,
    isEmergency: boolean
  ): RoutingDecision["route"] {
    // 紧急模式：跳过审议
    if (isEmergency) {
      return complexity === "simple" ? "direct" : "three_provinces";
    }

    switch (complexity) {
      case "simple":
        return "direct";
      case "medium":
        return "single_ministry";
      case "complex":
        return "three_provinces";
    }
  }

  private estimate(
    route: RoutingDecision["route"],
    complexity: TaskComplexity
  ): { time: number; cost: number } {
    const estimates = {
      direct: { time: 3, cost: 0.001 },
      single_ministry: { time: 30, cost: 0.01 },
      three_provinces: {
        simple: { time: 60, cost: 0.05 },
        medium: { time: 180, cost: 0.15 },
        complex: { time: 300, cost: 0.50 },
      },
    };

    if (route === "three_provinces") {
      return estimates.three_provinces[complexity];
    }

    return estimates[route];
  }

  private generateReason(
    complexity: TaskComplexity,
    route: RoutingDecision["route"],
    isEmergency: boolean
  ): string {
    const reasons: string[] = [];

    if (isEmergency) {
      reasons.push("检测到紧急关键词");
    }

    reasons.push(`任务复杂度评估为「${complexity}」`);

    const routeReasons = {
      direct: "无需工具调用，直接回答",
      single_ministry: "单步操作,单部门执行即可",
      three_provinces: "多步骤复杂任务,需要三省六部协作",
    };

    reasons.push(routeReasons[route]);

    if (isEmergency && route === "three_provinces") {
      reasons.push("紧急模式：跳过门下省审议，事后补充验收");
    }

    return reasons.join("；") + "。";
  }

  private generateTaskId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `task-${timestamp}-${random}`;
  }
}


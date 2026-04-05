/**
 * 质量门控
 * 
 * 职责：
 * 1. 定义质量标准
 * 2. 多维度质量检查
 * 3. 质量评分系统
 * 4. 质量报告生成
 * 5. 质量趋势分析
 */

import type {
  ImperialEdict,
  ExecutionRecord,
  SharedContext,
  ValidationResult,
} from '../types';

export interface QualityGate {
  name: string;
  threshold: number;
  weight: number;
  check: (context: any) => Promise<number>;
}

export interface QualityScore {
  overall: number;
  dimensions: Record<string, number>;
  passed: boolean;
  grade: "A" | "B" | "C" | "D" | "F";
}

export class QualityGateSystem {
  private gates: QualityGate[] = [];
  
  constructor() {
    // 初始化质量门控
    this.initializeGates();
  }
  
  /**
   * 初始化质量门控
   */
  private initializeGates(): void {
    this.gates = [
      {
        name: "代码质量",
        threshold: 80,
        weight: 0.25,
        check: this.checkCodeQuality.bind(this),
      },
      {
        name: "测试覆盖",
        threshold: 70,
        weight: 0.25,
        check: this.checkTestCoverage.bind(this),
      },
      {
        name: "安全评分",
        threshold: 85,
        weight: 0.20,
        check: this.checkSecurityScore.bind(this),
      },
      {
        name: "性能指标",
        threshold: 75,
        weight: 0.15,
        check: this.checkPerformanceScore.bind(this),
      },
      {
        name: "完成度",
        threshold: 90,
        weight: 0.15,
        check: this.checkCompletenessScore.bind(this),
      },
    ];
  }
  
  /**
   * 执行质量门控检查
   */
  async executeQualityGates(
    edict: ImperialEdict,
    records: ExecutionRecord[],
    context: SharedContext
  ): Promise<QualityScore> {
    const dimensions: Record<string, number> = {};
    
    // 执行每个质量门控
    for (const gate of this.gates) {
      const score = await gate.check({ edict, records, context });
      dimensions[gate.name] = score;
    }
    
    // 计算加权总分
    let overall = 0;
    for (const gate of this.gates) {
      const score = dimensions[gate.name];
      const weight = gate.weight;
      overall += score * weight;
    }
    
    // 判断是否通过
    const passed = this.gates.every(
      gate => dimensions[gate.name] >= gate.threshold
    );
    
    // 计算等级
    const grade = this.calculateGrade(overall);
    
    return {
      overall,
      dimensions,
      passed,
      grade,
    };
  }
  
  /**
   * 检查代码质量
   */
  private async checkCodeQuality(ctx: any): Promise<number> {
    let score = 100;
    
    // 检查执行记录
    for (const record of ctx.records) {
      // 失败的任务扣分
      if (record.status === "failed") {
        score -= 20;
      }
      
      // 迭代次数过多扣分
      if (record.iterations.length > 3) {
        score -= 10;
      }
    }
    
    return Math.max(0, score);
  }
  
  /**
   * 检查测试覆盖
   */
  private async checkTestCoverage(ctx: any): Promise<number> {
    // 简化：基于测试迭代计算
    let testIterations = 0;
    let passedTests = 0;
    
    for (const record of ctx.records) {
      for (const iteration of record.iterations) {
        if (iteration.agent === "tester") {
          testIterations++;
          if (iteration.result === "success") {
            passedTests++;
          }
        }
      }
    }
    
    if (testIterations === 0) return 100; // 没有测试任务，默认满分
    
    return (passedTests / testIterations) * 100;
  }
  
  /**
   * 检查安全评分
   */
  private async checkSecurityScore(ctx: any): Promise<number> {
    let score = 100;
    
    // 检查是否有安全相关的失败
    for (const record of ctx.records) {
      for (const iteration of record.iterations) {
        if (iteration.agent === "security" && iteration.result === "failure") {
          score -= 30;
        }
      }
    }
    
    return Math.max(0, score);
  }
  
  /**
   * 检查性能评分
   */
  private async checkPerformanceScore(ctx: any): Promise<number> {
    let score = 100;
    
    // 检查执行时间
    for (const record of ctx.records) {
      if (record.duration) {
        // 超过 1 分钟扣分
        if (record.duration > 60000) {
          score -= 10;
        }
        // 超过 3 分钟扣更多分
        if (record.duration > 180000) {
          score -= 20;
        }
        // 超过 5 分钟严重扣分
        if (record.duration > 300000) {
          score -= 40;
        }
      }
    }
    
    return Math.max(0, score);
  }
  
  /**
   * 检查完成度评分
   */
  private async checkCompletenessScore(ctx: any): Promise<number> {
    const edict = ctx.edict;
    const records = ctx.records;
    
    // 检查任务完成率
    const totalTasks = edict.tasks.length;
    const completedTasks = records.filter(r => r.status === "completed").length;
    
    return (completedTasks / totalTasks) * 100;
  }
  
  /**
   * 计算等级
   */
  private calculateGrade(score: number): "A" | "B" | "C" | "D" | "F" {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }
  
  /**
   * 生成质量报告
   */
  generateQualityReport(score: QualityScore): string {
    const lines = [
      `# 质量报告`,
      ``,
      `## 总体评分`,
      `- 分数: ${score.overall.toFixed(1)} / 100`,
      `- 等级: ${score.grade}`,
      `- 结果: ${score.passed ? "✅ 通过" : "❌ 未通过"}`,
      ``,
      `## 分项评分`,
    ];
    
    for (const gate of this.gates) {
      const dimensionScore = score.dimensions[gate.name];
      const threshold = gate.threshold;
      const passed = dimensionScore >= threshold;
      
      lines.push(
        `- ${gate.name}: ${dimensionScore.toFixed(1)} / 100 ` +
        `(阈值: ${threshold}) ${passed ? "✅" : "❌"}`
      );
    }
    
    // 添加改进建议
    lines.push(`\n## 改进建议`);
    
    const failedGates = this.gates.filter(
      gate => score.dimensions[gate.name] < gate.threshold
    );
    
    if (failedGates.length === 0) {
      lines.push(`- 所有质量门控均已通过`);
    } else {
      for (const gate of failedGates) {
        const currentScore = score.dimensions[gate.name];
        const gap = gate.threshold - currentScore;
        lines.push(`- ${gate.name}: 需要提升 ${gap.toFixed(1)} 分`);
        lines.push(`  - 建议: ${this.getImprovementSuggestion(gate.name)}`);
      }
    }
    
    return lines.join("\n");
  }
  
  /**
   * 获取改进建议
   */
  private getImprovementSuggestion(dimension: string): string {
    const suggestions: Record<string, string> = {
      "代码质量": "修复 lint 错误、类型错误，优化代码结构",
      "测试覆盖": "增加测试用例，提高覆盖率",
      "安全评分": "修复安全漏洞，加强权限验证",
      "性能指标": "优化性能瓶颈，减少执行时间",
      "完成度": "确保所有任务都已完成",
    };
    
    return suggestions[dimension] || "无具体建议";
  }
  
  /**
   * 质量趋势分析
   */
  analyzeQualityTrend(history: QualityScore[]): {
    trend: "improving" | "stable" | "declining";
    avgScore: number;
    avgGrade: string;
  } {
    if (history.length === 0) {
      return {
        trend: "stable",
        avgScore: 0,
        avgGrade: "N/A",
      };
    }
    
    // 计算平均分
    const avgScore = history.reduce((sum, s) => sum + s.overall, 0) / history.length;
    
    // 计算平均等级
    const avgGrade = this.calculateGrade(avgScore);
    
    // 分析趋势
    let trend: "improving" | "stable" | "declining" = "stable";
    
    if (history.length >= 3) {
      const recent = history.slice(-3);
      const scores = recent.map(s => s.overall);
      
      // 简单的线性趋势判断
      const increasing = scores.every((s, i) => i === 0 || s >= scores[i - 1]);
      const decreasing = scores.every((s, i) => i === 0 || s <= scores[i - 1]);
      
      if (increasing) {
        trend = "improving";
      } else if (decreasing) {
        trend = "declining";
      }
    }
    
    return {
      trend,
      avgScore,
      avgGrade,
    };
  }
  
  /**
   * 自定义质量门控
   */
  addCustomGate(gate: QualityGate): void {
    this.gates.push(gate);
    
    // 重新计算权重
    const totalWeight = this.gates.reduce((sum, g) => sum + g.weight, 0);
    this.gates.forEach(g => g.weight /= totalWeight);
  }
  
  /**
   * 移除质量门控
   */
  removeGate(name: string): boolean {
    const index = this.gates.findIndex(g => g.name === name);
    if (index >= 0) {
      const removed = this.gates.splice(index, 1)[0];
      
      // 重新分配权重
      const totalWeight = this.gates.reduce((sum, g) => sum + g.weight, 0);
      if (totalWeight > 0) {
        this.gates.forEach(g => g.weight /= totalWeight);
      }
      
      return true;
    }
    return false;
  }
  
  /**
   * 获取所有质量门控
   */
  getGates(): QualityGate[] {
    return [...this.gates];
  }
  
  /**
   * 更新质量门控阈值
   */
  updateThreshold(name: string, threshold: number): boolean {
    const gate = this.gates.find(g => g.name === name);
    if (gate) {
      gate.threshold = Math.max(0, Math.min(100, threshold));
      return true;
    }
    return false;
  }
}

// 导出单例
export const qualityGateSystem = new QualityGateSystem();

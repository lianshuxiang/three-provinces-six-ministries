/**
 * 成本追踪器
 * 
 * 职责：
 * 1. 实时追踪每次 API 调用成本
 * 2. Token 使用统计
 * 3. 成本累积计算
 * 4. 预算检查
 * 5. 成本报告生成
 */

import type { SharedContext, CostTracking, ResourceUsage } from '../types';

export interface CostEntry {
  timestamp: string;
  taskId: string;
  agent: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  tokensCached: number;
  cost: number;
  cacheHit: boolean;
}

export interface CostSummary {
  totalCost: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalTokensCached: number;
  avgCostPerTask: number;
  cacheHitRate: number;
  byModel: Record<string, { cost: number; calls: number }>;
  byAgent: Record<string, { cost: number; calls: number }>;
}

export interface BudgetStatus {
  withinBudget: boolean;
  taskBudget: {
    limit: number;
    used: number;
    remaining: number;
    percentage: number;
  };
  dailyBudget: {
    limit: number;
    used: number;
    remaining: number;
    percentage: number;
  };
  monthlyBudget: {
    limit: number;
    used: number;
    remaining: number;
    percentage: number;
  };
}

export class CostTracker {
  private entries: CostEntry[] = [];
  private budgets = {
    perTask: 5.00,    // $5 单任务
    daily: 100.00,    // $100 每日
    monthly: 2000.00, // $2000 每月
  };
  
  // 模型价格表（每 1K tokens）
  private modelPricing: Record<string, { input: number; output: number; cached: number }> = {
    // 最高权限规则 R000：只支持 GLM-5
    "glm-5": { input: 0.001, output: 0.002, cached: 0.0001 },
  };
  
  /**
   * 记录成本
   */
  recordCost(entry: Omit<CostEntry, 'timestamp' | 'cost'>): CostEntry {
    const timestamp = new Date().toISOString();
    
    // 计算成本
    const pricing = this.modelPricing[entry.model] || this.modelPricing["glm-5"];
    const cost = 
      (entry.tokensIn / 1000 * pricing.input) +
      (entry.tokensOut / 1000 * pricing.output) -
      (entry.tokensCached / 1000 * (pricing.input - pricing.cached));
    
    const fullEntry: CostEntry = {
      ...entry,
      timestamp,
      cost: Math.max(0, cost), // 确保成本不为负
    };
    
    this.entries.push(fullEntry);
    
    return fullEntry;
  }
  
  /**
   * 获取成本摘要
   */
  getSummary(taskId?: string): CostSummary {
    const filtered = taskId 
      ? this.entries.filter(e => e.taskId === taskId)
      : this.entries;
    
    if (filtered.length === 0) {
      return {
        totalCost: 0,
        totalTokensIn: 0,
        totalTokensOut: 0,
        totalTokensCached: 0,
        avgCostPerTask: 0,
        cacheHitRate: 0,
        byModel: {},
        byAgent: {},
      };
    }
    
    const totalCost = filtered.reduce((sum, e) => sum + e.cost, 0);
    const totalTokensIn = filtered.reduce((sum, e) => sum + e.tokensIn, 0);
    const totalTokensOut = filtered.reduce((sum, e) => sum + e.tokensOut, 0);
    const totalTokensCached = filtered.reduce((sum, e) => sum + e.tokensCached, 0);
    
    const cacheHits = filtered.filter(e => e.cacheHit).length;
    const cacheHitRate = (cacheHits / filtered.length) * 100;
    
    // 按模型统计
    const byModel: Record<string, { cost: number; calls: number }> = {};
    for (const entry of filtered) {
      if (!byModel[entry.model]) {
        byModel[entry.model] = { cost: 0, calls: 0 };
      }
      byModel[entry.model].cost += entry.cost;
      byModel[entry.model].calls++;
    }
    
    // 按 Agent 统计
    const byAgent: Record<string, { cost: number; calls: number }> = {};
    for (const entry of filtered) {
      if (!byAgent[entry.agent]) {
        byAgent[entry.agent] = { cost: 0, calls: 0 };
      }
      byAgent[entry.agent].cost += entry.cost;
      byAgent[entry.agent].calls++;
    }
    
    // 计算平均每任务成本
    const taskIds = new Set(filtered.map(e => e.taskId));
    const avgCostPerTask = taskIds.size > 0 ? totalCost / taskIds.size : 0;
    
    return {
      totalCost,
      totalTokensIn,
      totalTokensOut,
      totalTokensCached,
      avgCostPerTask,
      cacheHitRate,
      byModel,
      byAgent,
    };
  }
  
  /**
   * 检查预算状态
   */
  checkBudget(taskId?: string): BudgetStatus {
    const summary = this.getSummary(taskId);
    const dailyCost = this.getDailyCost();
    const monthlyCost = this.getMonthlyCost();
    
    const taskBudget = {
      limit: this.budgets.perTask,
      used: summary.totalCost,
      remaining: Math.max(0, this.budgets.perTask - summary.totalCost),
      percentage: (summary.totalCost / this.budgets.perTask) * 100,
    };
    
    const dailyBudget = {
      limit: this.budgets.daily,
      used: dailyCost,
      remaining: Math.max(0, this.budgets.daily - dailyCost),
      percentage: (dailyCost / this.budgets.daily) * 100,
    };
    
    const monthlyBudget = {
      limit: this.budgets.monthly,
      used: monthlyCost,
      remaining: Math.max(0, this.budgets.monthly - monthlyCost),
      percentage: (monthlyCost / this.budgets.monthly) * 100,
    };
    
    const withinBudget = 
      taskBudget.percentage < 100 &&
      dailyBudget.percentage < 100 &&
      monthlyBudget.percentage < 100;
    
    return {
      withinBudget,
      taskBudget,
      dailyBudget,
      monthlyBudget,
    };
  }
  
  /**
   * 获取今日成本
   */
  private getDailyCost(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.entries
      .filter(e => e.timestamp.startsWith(today))
      .reduce((sum, e) => sum + e.cost, 0);
  }
  
  /**
   * 获取本月成本
   */
  private getMonthlyCost(): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    return this.entries
      .filter(e => e.timestamp >= monthStart)
      .reduce((sum, e) => sum + e.cost, 0);
  }
  
  /**
   * 生成成本报告
   */
  generateReport(taskId?: string): string {
    const summary = this.getSummary(taskId);
    const budget = this.checkBudget(taskId);
    
    const lines = [
      `# 成本报告`,
      ``,
      `## 总览`,
      `- 总成本: $${summary.totalCost.toFixed(4)}`,
      `- 输入 Tokens: ${summary.totalTokensIn.toLocaleString()}`,
      `- 输出 Tokens: ${summary.totalTokensOut.toLocaleString()}`,
      `- 缓存 Tokens: ${summary.totalTokensCached.toLocaleString()}`,
      `- 缓存命中率: ${summary.cacheHitRate.toFixed(1)}%`,
      `- 平均每任务成本: $${summary.avgCostPerTask.toFixed(4)}`,
      ``,
      `## 预算状态`,
      ``,
      `### 单任务预算`,
      `- 限额: $${budget.taskBudget.limit.toFixed(2)}`,
      `- 已用: $${budget.taskBudget.used.toFixed(4)}`,
      `- 剩余: $${budget.taskBudget.remaining.toFixed(4)}`,
      `- 使用率: ${budget.taskBudget.percentage.toFixed(1)}%`,
      ``,
      `### 每日预算`,
      `- 限额: $${budget.dailyBudget.limit.toFixed(2)}`,
      `- 已用: $${budget.dailyBudget.used.toFixed(4)}`,
      `- 剩余: $${budget.dailyBudget.remaining.toFixed(4)}`,
      `- 使用率: ${budget.dailyBudget.percentage.toFixed(1)}%`,
      ``,
      `### 每月预算`,
      `- 限额: $${budget.monthlyBudget.limit.toFixed(2)}`,
      `- 已用: $${budget.monthlyBudget.used.toFixed(4)}`,
      `- 剩余: $${budget.monthlyBudget.remaining.toFixed(4)}`,
      `- 使用率: ${budget.monthlyBudget.percentage.toFixed(1)}%`,
      ``,
      `## 按模型统计`,
    ];
    
    for (const [model, stats] of Object.entries(summary.byModel)) {
      lines.push(`- ${model}: $${stats.cost.toFixed(4)} (${stats.calls} 次调用)`);
    }
    
    lines.push(`\n## 按 Agent 统计`);
    
    for (const [agent, stats] of Object.entries(summary.byAgent)) {
      lines.push(`- ${agent}: $${stats.cost.toFixed(4)} (${stats.calls} 次调用)`);
    }
    
    return lines.join("\n");
  }
  
  /**
   * 更新预算
   */
  updateBudget(type: 'perTask' | 'daily' | 'monthly', amount: number): void {
    if (type === 'perTask') {
      this.budgets.perTask = amount;
    } else if (type === 'daily') {
      this.budgets.daily = amount;
    } else if (type === 'monthly') {
      this.budgets.monthly = amount;
    }
  }
  
  /**
   * 获取成本历史
   */
  getHistory(limit?: number): CostEntry[] {
    const sorted = [...this.entries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return limit ? sorted.slice(0, limit) : sorted;
  }
  
  /**
   * 清除历史记录
   */
  clearHistory(): void {
    this.entries = [];
  }
  
  /**
   * 导出成本数据
   */
  export(): {
    entries: CostEntry[];
    budgets: typeof this.budgets;
    summary: CostSummary;
  } {
    return {
      entries: this.entries,
      budgets: this.budgets,
      summary: this.getSummary(),
    };
  }
  
  /**
   * 导入成本数据
   */
  import(data: {
    entries: CostEntry[];
    budgets?: typeof this.budgets;
  }): void {
    this.entries = data.entries;
    if (data.budgets) {
      this.budgets = data.budgets;
    }
  }
}

// 导出单例
export const costTracker = new CostTracker();

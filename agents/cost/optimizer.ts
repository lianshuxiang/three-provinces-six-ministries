/**
 * 成本优化建议系统
 * 
 * 职责：
 * 1. 分析成本数据
 * 2. 识别成本浪费点
 * 3. 生成优化建议
 * 4. 估算优化收益
 * 5. 优先级排序
 */

import { CostTracker, CostSummary } from './tracker';

export interface OptimizationSuggestion {
  id: string;
  category: 'model' | 'cache' | 'task' | 'workflow' | 'budget';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialSavings: number; // 预估节省（美元）
  effort: 'low' | 'medium' | 'high'; // 实施难度
  impact: number; // 影响分数 0-100
  details: string[];
  actionItems: string[];
}

export class CostOptimizer {
  private costTracker: CostTracker;
  
  constructor(costTracker: CostTracker) {
    this.costTracker = costTracker;
  }
  
  /**
   * 生成优化建议
   */
  generateSuggestions(): OptimizationSuggestion[] {
    const summary = this.costTracker.getSummary();
    const suggestions: OptimizationSuggestion[] = [];
    
    // 1. 模型优化建议
    suggestions.push(...this.analyzeModelUsage(summary));
    
    // 2. 缓存优化建议
    suggestions.push(...this.analyzeCacheUsage(summary));
    
    // 3. 任务优化建议
    suggestions.push(...this.analyzeTaskEfficiency(summary));
    
    // 4. 工作流优化建议
    suggestions.push(...this.analyzeWorkflow(summary));
    
    // 5. 预算优化建议
    suggestions.push(...this.analyzeBudget(summary));
    
    // 按优先级和影响排序
    return this.prioritizeSuggestions(suggestions);
  }
  
  /**
   * 分析模型使用
   */
  private analyzeModelUsage(summary: CostSummary): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // 检查是否过度使用昂贵模型
    const expensiveModelCost = summary.byModel['glm-5']?.cost || 0;
    const cheapModelCost = summary.byModel['glm-4.7']?.cost || 0;
    const totalCost = expensiveModelCost + cheapModelCost;
    
    if (totalCost > 0 && expensiveModelCost / totalCost > 0.7) {
      // 如果 GLM-5 占比超过 70%
      suggestions.push({
        id: 'opt-model-1',
        category: 'model',
        priority: 'high',
        title: '优化模型选择',
        description: '当前过度使用 GLM-5，建议在简单任务中使用 GLM-4.7',
        potentialSavings: totalCost * 0.3,
        effort: 'low',
        impact: 80,
        details: [
          `GLM-5 使用占比: ${((expensiveModelCost / totalCost) * 100).toFixed(1)}%`,
          `GLM-4.7 使用占比: ${((cheapModelCost / totalCost) * 100).toFixed(1)}%`,
          `GLM-5 价格是 GLM-4.7 的 2 倍`,
        ],
        actionItems: [
          '审查任务分类逻辑，将简单任务分配给 GLM-4.7',
          '配置/礼部应使用 GLM-4.7（任务简单）',
          '安全/兵部可保持使用 GLM-5（安全关键）',
        ],
      });
    }
    
    // 检查模型调用次数
    const glm5Calls = summary.byModel['glm-5']?.calls || 0;
    const totalCalls = Object.values(summary.byModel).reduce((sum, m) => sum + m.calls, 0);
    
    if (totalCalls > 0 && glm5Calls / totalCalls > 0.5) {
      suggestions.push({
        id: 'opt-model-2',
        category: 'model',
        priority: 'medium',
        title: '减少 GLM-5 调用次数',
        description: 'GLM-5 调用次数过多，建议合并或优化任务',
        potentialSavings: expensiveModelCost * 0.2,
        effort: 'medium',
        impact: 60,
        details: [
          `GLM-5 调用次数: ${glm5Calls}`,
          `总调用次数: ${totalCalls}`,
          `GLM-5 占比: ${((glm5Calls / totalCalls) * 100).toFixed(1)}%`,
        ],
        actionItems: [
          '合并相似任务，减少 API 调用',
          '优化提示词，减少输入 tokens',
          '考虑批量处理任务',
        ],
      });
    }
    
    return suggestions;
  }
  
  /**
   * 分析缓存使用
   */
  private analyzeCacheUsage(summary: CostSummary): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // 检查缓存命中率
    if (summary.cacheHitRate < 50) {
      suggestions.push({
        id: 'opt-cache-1',
        category: 'cache',
        priority: 'high',
        title: '提高缓存命中率',
        description: '当前缓存命中率较低，浪费了大量 tokens',
        potentialSavings: summary.totalCost * 0.4,
        effort: 'medium',
        impact: 90,
        details: [
          `当前缓存命中率: ${summary.cacheHitRate.toFixed(1)}%`,
          `理想缓存命中率: >70%`,
          `缓存 tokens 价格是正常的 10%`,
        ],
        actionItems: [
          '优化提示词结构，增加可复用部分',
          '使用模板化的提示词',
          '减少动态内容在提示词中的占比',
          '考虑预加载常用上下文',
        ],
      });
    } else if (summary.cacheHitRate < 70) {
      suggestions.push({
        id: 'opt-cache-2',
        category: 'cache',
        priority: 'medium',
        title: '进一步优化缓存',
        description: '缓存命中率尚可，但仍有优化空间',
        potentialSavings: summary.totalCost * 0.2,
        effort: 'low',
        impact: 60,
        details: [
          `当前缓存命中率: ${summary.cacheHitRate.toFixed(1)}%`,
          `可优化至: >80%`,
        ],
        actionItems: [
          '分析未命中缓存的调用',
          '优化提示词格式',
        ],
      });
    }
    
    // 检查缓存 tokens 绝对值
    if (summary.totalTokensCached < summary.totalTokensIn * 0.5) {
      suggestions.push({
        id: 'opt-cache-3',
        category: 'cache',
        priority: 'medium',
        title: '增加缓存使用量',
        description: '缓存使用量较低，应充分利用缓存机制',
        potentialSavings: summary.totalCost * 0.3,
        effort: 'medium',
        impact: 70,
        details: [
          `缓存 tokens: ${summary.totalTokensCached.toLocaleString()}`,
          `输入 tokens: ${summary.totalTokensIn.toLocaleString()}`,
          `缓存/输入比: ${((summary.totalTokensCached / summary.totalTokensIn) * 100).toFixed(1)}%`,
        ],
        actionItems: [
          '在任务开始时预加载常用上下文',
          '使用更长的缓存上下文',
          '优化上下文管理策略',
        ],
      });
    }
    
    return suggestions;
  }
  
  /**
   * 分析任务效率
   */
  private analyzeTaskEfficiency(summary: CostSummary): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // 检查平均任务成本
    if (summary.avgCostPerTask > 1.00) {
      suggestions.push({
        id: 'opt-task-1',
        category: 'task',
        priority: 'high',
        title: '降低单任务成本',
        description: '平均任务成本过高，需要优化任务拆分策略',
        potentialSavings: (summary.avgCostPerTask - 0.5) * (summary.totalCost / summary.avgCostPerTask),
        effort: 'high',
        impact: 85,
        details: [
          `平均任务成本: $${summary.avgCostPerTask.toFixed(4)}`,
          `目标成本: <$0.50`,
          `差距: $${(summary.avgCostPerTask - 0.5).toFixed(4)}`,
        ],
        actionItems: [
          '审查任务拆分逻辑，避免过度拆分',
          '合并相似任务',
          '优化任务依赖关系，减少冗余',
          '简化任务描述和提示词',
        ],
      });
    }
    
    // 检查任务数量
    const taskCount = Object.keys(summary.byAgent).length;
    if (summary.totalCost > 0 && summary.totalCost / taskCount > 0.2) {
      suggestions.push({
        id: 'opt-task-2',
        category: 'task',
        priority: 'medium',
        title: '优化 Agent 分工',
        description: '部分 Agent 成本过高，需要优化分工策略',
        potentialSavings: summary.totalCost * 0.15,
        effort: 'medium',
        impact: 65,
        details: [
          `Agent 数量: ${taskCount}`,
          `平均每 Agent 成本: $${(summary.totalCost / taskCount).toFixed(4)}`,
        ],
        actionItems: [
          '识别高成本 Agent',
          '优化该 Agent 的任务分配',
          '考虑使用更便宜的模型',
        ],
      });
    }
    
    return suggestions;
  }
  
  /**
   * 分析工作流
   */
  private analyzeWorkflow(summary: CostSummary): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // 检查迭代次数（通过 Agent 调用次数推断）
    const totalCalls = Object.values(summary.byAgent).reduce((sum, a) => sum + a.calls, 0);
    const uniqueAgents = Object.keys(summary.byAgent).length;
    const avgCallsPerAgent = totalCalls / uniqueAgents;
    
    if (avgCallsPerAgent > 3) {
      suggestions.push({
        id: 'opt-workflow-1',
        category: 'workflow',
        priority: 'medium',
        title: '减少迭代次数',
        description: 'Agent 平均调用次数过多，存在过度迭代',
        potentialSavings: summary.totalCost * 0.25,
        effort: 'medium',
        impact: 70,
        details: [
          `总调用次数: ${totalCalls}`,
          `Agent 数量: ${uniqueAgents}`,
          `平均每 Agent 调用: ${avgCallsPerAgent.toFixed(1)} 次`,
        ],
        actionItems: [
          '优化迭代终止条件',
          '提高第一次执行成功率',
          '改进错误处理逻辑',
          '设置更严格的迭代上限',
        ],
      });
    }
    
    // 检查并行度（简化：通过 Agent 分布推断）
    const agentCosts = Object.values(summary.byAgent).map(a => a.cost);
    const maxCost = Math.max(...agentCosts);
    const avgCost = agentCosts.reduce((sum, c) => sum + c, 0) / agentCosts.length;
    
    if (maxCost > avgCost * 2) {
      suggestions.push({
        id: 'opt-workflow-2',
        category: 'workflow',
        priority: 'low',
        title: '提高并行度',
        description: '某些 Agent 成本过高，可能是串行瓶颈',
        potentialSavings: summary.totalCost * 0.1,
        effort: 'high',
        impact: 40,
        details: [
          `最高成本 Agent: $${maxCost.toFixed(4)}`,
          `平均成本: $${avgCost.toFixed(4)}`,
          `成本比: ${(maxCost / avgCost).toFixed(1)}x`,
        ],
        actionItems: [
          '分析高成本 Agent 的依赖关系',
          '尝试并行化独立任务',
          '优化任务调度策略',
        ],
      });
    }
    
    return suggestions;
  }
  
  /**
   * 分析预算
   */
  private analyzeBudget(summary: CostSummary): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const budget = this.costTracker.checkBudget();
    
    // 检查预算使用情况
    if (!budget.withinBudget) {
      suggestions.push({
        id: 'opt-budget-1',
        category: 'budget',
        priority: 'critical',
        title: '预算超支',
        description: '当前已超出预算，需要立即采取行动',
        potentialSavings: 0, // 已超支
        effort: 'low',
        impact: 100,
        details: [
          `单任务预算使用: ${budget.taskBudget.percentage.toFixed(1)}%`,
          `每日预算使用: ${budget.dailyBudget.percentage.toFixed(1)}%`,
          `每月预算使用: ${budget.monthlyBudget.percentage.toFixed(1)}%`,
        ],
        actionItems: [
          '暂停非关键任务',
          '审查所有进行中的任务',
          '考虑提高预算上限',
          '实施更严格的成本控制',
        ],
      });
    } else if (budget.monthlyBudget.percentage > 80) {
      suggestions.push({
        id: 'opt-budget-2',
        category: 'budget',
        priority: 'high',
        title: '预算即将用尽',
        description: '本月预算使用率已超过 80%，需要谨慎',
        potentialSavings: 0,
        effort: 'low',
        impact: 80,
        details: [
          `每月预算使用: ${budget.monthlyBudget.percentage.toFixed(1)}%`,
          `剩余: $${budget.monthlyBudget.remaining.toFixed(2)}`,
        ],
        actionItems: [
          '审查任务优先级',
          '推迟非紧急任务',
          '优化成本结构',
        ],
      });
    }
    
    return suggestions;
  }
  
  /**
   * 优先级排序
   */
  private prioritizeSuggestions(suggestions: OptimizationSuggestion[]): OptimizationSuggestion[] {
    return suggestions.sort((a, b) => {
      // 先按优先级排序
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // 同优先级按影响排序
      return b.impact - a.impact;
    });
  }
  
  /**
   * 生成优化报告
   */
  generateOptimizationReport(): string {
    const suggestions = this.generateSuggestions();
    const summary = this.costTracker.getSummary();
    
    const lines = [
      `# 成本优化报告`,
      ``,
      `## 总览`,
      `- 当前成本: $${summary.totalCost.toFixed(4)}`,
      `- 优化建议数: ${suggestions.length}`,
      `- 预估总节省: $${suggestions.reduce((sum, s) => sum + s.potentialSavings, 0).toFixed(4)}`,
      ``,
      `## 优化建议`,
    ];
    
    for (const suggestion of suggestions) {
      lines.push(`\n### ${suggestion.title}`);
      lines.push(`- 类别: ${suggestion.category}`);
      lines.push(`- 优先级: ${suggestion.priority}`);
      lines.push(`- 预估节省: $${suggestion.potentialSavings.toFixed(4)}`);
      lines.push(`- 实施难度: ${suggestion.effort}`);
      lines.push(`- 影响分数: ${suggestion.impact}`);
      lines.push(`\n**描述**: ${suggestion.description}`);
      
      if (suggestion.details.length > 0) {
        lines.push(`\n**详情**:`);
        for (const detail of suggestion.details) {
          lines.push(`  - ${detail}`);
        }
      }
      
      if (suggestion.actionItems.length > 0) {
        lines.push(`\n**行动项**:`);
        for (const item of suggestion.actionItems) {
          lines.push(`  - ${item}`);
        }
      }
    }
    
    return lines.join("\n");
  }
}

// 导出单例工厂
export function createCostOptimizer(costTracker: CostTracker): CostOptimizer {
  return new CostOptimizer(costTracker);
}

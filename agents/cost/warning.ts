/**
 * 预算警告系统
 * 
 * 职责：
 * 1. 实时监控预算使用情况
 * 2. 生成警告信息
 * 3. 触发警告通知
 * 4. 警告历史记录
 * 5. 自定义警告规则
 */

import { CostTracker, BudgetStatus } from './tracker';

export interface Warning {
  id: string;
  timestamp: string;
  type: 'task' | 'daily' | 'monthly';
  level: 'info' | 'warning' | 'critical';
  message: string;
  percentage: number;
  budget: BudgetStatus['taskBudget'] | BudgetStatus['dailyBudget'] | BudgetStatus['monthlyBudget'];
  acknowledged: boolean;
}

export interface WarningRule {
  type: 'task' | 'daily' | 'monthly';
  thresholds: number[]; // 百分比阈值
  actions: ('notify' | 'pause' | 'reject')[];
}

export class BudgetWarningSystem {
  private costTracker: CostTracker;
  private warnings: Warning[] = [];
  private rules: WarningRule[] = [];
  
  constructor(costTracker: CostTracker) {
    this.costTracker = costTracker;
    this.initializeRules();
  }
  
  /**
   * 初始化警告规则
   */
  private initializeRules(): void {
    this.rules = [
      {
        type: 'task',
        thresholds: [50, 80, 100],
        actions: ['notify', 'notify', 'pause'],
      },
      {
        type: 'daily',
        thresholds: [50, 80, 100],
        actions: ['notify', 'notify', 'pause'],
      },
      {
        type: 'monthly',
        thresholds: [50, 80, 90, 100],
        actions: ['notify', 'notify', 'notify', 'reject'],
      },
    ];
  }
  
  /**
   * 检查预算并生成警告
   */
  checkBudget(taskId?: string): Warning[] {
    const budget = this.costTracker.checkBudget(taskId);
    const newWarnings: Warning[] = [];
    
    // 检查单任务预算
    const taskWarning = this.checkBudgetLevel(
      'task',
      budget.taskBudget,
      taskId
    );
    if (taskWarning) {
      newWarnings.push(taskWarning);
    }
    
    // 检查每日预算
    const dailyWarning = this.checkBudgetLevel(
      'daily',
      budget.dailyBudget
    );
    if (dailyWarning) {
      newWarnings.push(dailyWarning);
    }
    
    // 检查每月预算
    const monthlyWarning = this.checkBudgetLevel(
      'monthly',
      budget.monthlyBudget
    );
    if (monthlyWarning) {
      newWarnings.push(monthlyWarning);
    }
    
    // 添加到历史
    this.warnings.push(...newWarnings);
    
    return newWarnings;
  }
  
  /**
   * 检查单个预算级别
   */
  private checkBudgetLevel(
    type: 'task' | 'daily' | 'monthly',
    budget: BudgetStatus['taskBudget'] | BudgetStatus['dailyBudget'] | BudgetStatus['monthlyBudget'],
    taskId?: string
  ): Warning | null {
    const rule = this.rules.find(r => r.type === type);
    if (!rule) return null;
    
    const percentage = budget.percentage;
    
    // 找到触发的阈值
    let triggeredThreshold = 0;
    let level: 'info' | 'warning' | 'critical' = 'info';
    
    for (let i = rule.thresholds.length - 1; i >= 0; i--) {
      if (percentage >= rule.thresholds[i]) {
        triggeredThreshold = rule.thresholds[i];
        
        // 确定级别
        if (percentage >= 100) {
          level = 'critical';
        } else if (percentage >= 80) {
          level = 'warning';
        } else {
          level = 'info';
        }
        break;
      }
    }
    
    // 如果没有触发阈值，返回 null
    if (triggeredThreshold === 0) return null;
    
    // 检查是否已经生成过类似的警告（避免重复）
    const recentWarning = this.warnings.find(
      w => 
        w.type === type && 
        w.level === level && 
        Date.now() - new Date(w.timestamp).getTime() < 60000 // 1 分钟内
    );
    if (recentWarning) return null;
    
    // 生成警告
    return {
      id: this.generateWarningId(),
      timestamp: new Date().toISOString(),
      type,
      level,
      message: this.generateWarningMessage(type, level, percentage, budget),
      percentage,
      budget,
      acknowledged: false,
    };
  }
  
  /**
   * 生成警告消息
   */
  private generateWarningMessage(
    type: 'task' | 'daily' | 'monthly',
    level: 'info' | 'warning' | 'critical',
    percentage: number,
    budget: any
  ): string {
    const typeNames = {
      task: '单任务',
      daily: '每日',
      monthly: '每月',
    };
    
    const levelEmojis = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨',
    };
    
    const messages: Record<string, string[]> = {
      info: [
        `${levelEmojis.info} ${typeNames[type]}预算已使用 ${percentage.toFixed(1)}%`,
        `已用: $${budget.used.toFixed(4)} / 限额: $${budget.limit.toFixed(2)}`,
      ],
      warning: [
        `${levelEmojis.warning} ${typeNames[type]}预算即将用尽！`,
        `已使用 ${percentage.toFixed(1)}% ($${budget.used.toFixed(4)} / $${budget.limit.toFixed(2)})`,
        `剩余: $${budget.remaining.toFixed(4)}`,
      ],
      critical: [
        `${levelEmojis.critical} ${typeNames[type]}预算已超支！`,
        `已使用 ${percentage.toFixed(1)}% ($${budget.used.toFixed(4)} / $${budget.limit.toFixed(2)})`,
        `超支: $${Math.abs(budget.remaining).toFixed(4)}`,
        `任务将被暂停或拒绝！`,
      ],
    };
    
    return messages[level].join("\n");
  }
  
  /**
   * 确认警告
   */
  acknowledgeWarning(warningId: string): boolean {
    const warning = this.warnings.find(w => w.id === warningId);
    if (warning) {
      warning.acknowledged = true;
      return true;
    }
    return false;
  }
  
  /**
   * 获取未确认的警告
   */
  getUnacknowledgedWarnings(): Warning[] {
    return this.warnings.filter(w => !w.acknowledged);
  }
  
  /**
   * 获取所有警告
   */
  getAllWarnings(limit?: number): Warning[] {
    const sorted = [...this.warnings].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return limit ? sorted.slice(0, limit) : sorted;
  }
  
  /**
   * 获取特定级别的警告
   */
  getWarningsByLevel(level: 'info' | 'warning' | 'critical'): Warning[] {
    return this.warnings.filter(w => w.level === level);
  }
  
  /**
   * 获取特定类型的警告
   */
  getWarningsByType(type: 'task' | 'daily' | 'monthly'): Warning[] {
    return this.warnings.filter(w => w.type === type);
  }
  
  /**
   * 清除已确认的警告
   */
  clearAcknowledgedWarnings(): number {
    const count = this.warnings.filter(w => w.acknowledged).length;
    this.warnings = this.warnings.filter(w => !w.acknowledged);
    return count;
  }
  
  /**
   * 添加自定义警告规则
   */
  addCustomRule(rule: WarningRule): void {
    this.rules.push(rule);
  }
  
  /**
   * 移除警告规则
   */
  removeRule(type: 'task' | 'daily' | 'monthly'): boolean {
    const index = this.rules.findIndex(r => r.type === type);
    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * 获取所有规则
   */
  getRules(): WarningRule[] {
    return [...this.rules];
  }
  
  /**
   * 生成警告报告
   */
  generateWarningReport(): string {
    const unacknowledged = this.getUnacknowledgedWarnings();
    const critical = this.getWarningsByLevel('critical');
    const warnings = this.getWarningsByLevel('warning');
    const info = this.getWarningsByLevel('info');
    
    const lines = [
      `# 预算警告报告`,
      ``,
      `## 总览`,
      `- 总警告数: ${this.warnings.length}`,
      `- 未确认: ${unacknowledged.length}`,
      `- 严重: ${critical.length}`,
      `- 警告: ${warnings.length}`,
      `- 信息: ${info.length}`,
      ``,
    ];
    
    if (unacknowledged.length > 0) {
      lines.push(`## 未确认的警告`);
      for (const warning of unacknowledged) {
        lines.push(`\n### ${warning.id}`);
        lines.push(`- 时间: ${warning.timestamp}`);
        lines.push(`- 类型: ${warning.type}`);
        lines.push(`- 级别: ${warning.level}`);
        lines.push(`- 使用率: ${warning.percentage.toFixed(1)}%`);
        lines.push(`\n${warning.message}`);
      }
    }
    
    return lines.join("\n");
  }
  
  /**
   * 生成警告 ID
   */
  private generateWarningId(): string {
    return `warning-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }
}

// 导出单例工厂
export function createBudgetWarningSystem(costTracker: CostTracker): BudgetWarningSystem {
  return new BudgetWarningSystem(costTracker);
}

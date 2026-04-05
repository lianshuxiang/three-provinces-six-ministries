/**
 * 共享上下文管理器
 */

import type {
  SharedContext,
  Phase,
  Decision,
  CostBreakdown,
} from './types';

export class SharedContextManager {
  private context: SharedContext | null = null;
  private contextFile: string;
  
  constructor(contextFile?: string) {
    this.contextFile = contextFile || '';
  }
  
  /**
   * 创建新上下文
   */
  createNewContext(sessionId: string): SharedContext {
    const timestamp = new Date().toISOString();
    
    this.context = {
      sessionId,
      userIntent: {
        raw: '',
        parsed: '',
        timestamp,
      },
      taskState: {
        currentPhase: 'routing',
        progress: 0,
      },
      decisions: [],
      compressedHistory: '',
      activeAgent: '',
      costTracking: {
        current: 0,
        estimated: 0,
        breakdown: [],
      },
      timestamps: {
        created: timestamp,
        lastUpdated: timestamp,
      },
    };
    
    return this.context;
  }
  
  /**
   * 获取当前上下文
   */
  getContext(): SharedContext {
    if (!this.context) {
      throw new Error('上下文未初始化，请先调用 createNewContext');
    }
    return this.context;
  }
  
  /**
   * 加载上下文（从文件）
   */
  loadContext(): SharedContext {
    // 简化实现，实际会从文件加载
    return this.getContext();
  }
  
  /**
   * 保存上下文（到文件）
   */
  saveContext(): void {
    // 简化实现，实际会保存到文件
  }
  
  /**
   * 更新任务状态
   */
  updateTaskState(state: Partial<SharedContext['taskState']>): void {
    if (!this.context) return;
    
    Object.assign(this.context.taskState, state);
    this.context.timestamps.lastUpdated = new Date().toISOString();
    this.saveContext();
  }
  
  /**
   * 更新进度
   */
  updateProgress(delta: number): void {
    if (!this.context) return;
    
    this.context.taskState.progress = Math.min(100, Math.max(0, 
      this.context.taskState.progress + delta
    ));
    this.context.timestamps.lastUpdated = new Date().toISOString();
    this.saveContext();
  }
  
  /**
   * 添加决策
   */
  addDecision(decision: Omit<Decision, 'timestamp'>): void {
    if (!this.context) return;
    
    this.context.decisions.push({
      ...decision,
      timestamp: new Date().toISOString(),
    });
    
    this.context.timestamps.lastUpdated = new Date().toISOString();
    this.saveContext();
  }
  
  /**
   * 添加成本记录
   */
  addCostEntry(cost: Omit<CostBreakdown, never>): void {
    if (!this.context) return;
    
    this.context.costTracking.breakdown.push(cost);
    this.context.costTracking.current += cost.cost;
    this.context.timestamps.lastUpdated = new Date().toISOString();
    this.saveContext();
  }
  
  /**
   * 更新活跃 Agent
   */
  updateActiveAgent(agent: string): void {
    if (!this.context) return;
    
    this.context.activeAgent = agent;
    this.context.timestamps.lastUpdated = new Date().toISOString();
    this.saveContext();
  }
  
  /**
   * 设置用户意图
   */
  setUserIntent(raw: string, parsed: string): void {
    if (!this.context) return;
    
    this.context.userIntent = {
      raw,
      parsed,
      timestamp: new Date().toISOString(),
    };
    this.context.timestamps.lastUpdated = new Date().toISOString();
    this.saveContext();
  }
  
  /**
   * 获取压缩历史
   */
  getCompressedHistory(): string {
    if (!this.context) return '';
    
    if (this.context.compressedHistory.length < 5000) {
      return this.context.compressedHistory;
    }
    
    // 压缩历史：保留关键决策点
    const compressed = this.context.decisions
      .map(d => `[${d.phase}] ${d.agent}: ${d.decision}`)
      .join('\n');
    
    this.context.compressedHistory = compressed;
    this.saveContext();
    
    return compressed;
  }
  
  /**
   * 获取决策列表
   */
  getDecisions(): Decision[] {
    if (!this.context) return [];
    return this.context.decisions;
  }
  
  /**
   * 获取成本追踪
   */
  getCostTracking(): SharedContext['costTracking'] {
    if (!this.context) {
      return {
        current: 0,
        estimated: 0,
        breakdown: [],
      };
    }
    return this.context.costTracking;
  }
}

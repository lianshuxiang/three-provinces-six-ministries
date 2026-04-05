/**
 * 进度显示器
 * 
 * 职责：
 * 1. 实时显示任务进度
 * 2. 显示各阶段状态
 * 3. 估算剩余时间
 * 4. 生成进度报告
 * 5. 支持多种格式输出
 */

import type { ImperialEdict, EdictTask, ExecutionRecord } from '../types';

export interface ProgressState {
  taskId: string;
  stage: 'routing' | 'planning' | 'review' | 'execution' | 'acceptance' | 'completed' | 'failed';
  stageIndex: number;
  totalStages: number;
  percentage: number;
  currentTask?: string;
  completedTasks: number;
  totalTasks: number;
  elapsedMs: number;
  estimatedRemainingMs: number;
  timestamp: string;
}

export interface StageInfo {
  name: string;
  description: string;
  icon: string;
  weight: number; // 该阶段占总进度的权重
}

export class ProgressDisplay {
  private startTime: number = 0;
  private currentState: ProgressState | null = null;
  private history: ProgressState[] = [];
  
  // 阶段定义
  private stages: StageInfo[] = [
    { name: 'routing', description: '任务路由', icon: '🔀', weight: 5 },
    { name: 'planning', description: '制定计划', icon: '📋', weight: 10 },
    { name: 'review', description: '安全审议', icon: '🔍', weight: 10 },
    { name: 'execution', description: '任务执行', icon: '⚙️', weight: 50 },
    { name: 'acceptance', description: '验收检查', icon: '✅', weight: 20 },
    { name: 'completed', description: '完成', icon: '🎉', weight: 5 },
  ];
  
  /**
   * 开始任务
   */
  startTask(taskId: string): ProgressState {
    this.startTime = Date.now();
    
    this.currentState = {
      taskId,
      stage: 'routing',
      stageIndex: 0,
      percentage: 0,
      completedTasks: 0,
      totalTasks: 0,
      elapsedMs: 0,
      estimatedRemainingMs: 0,
      timestamp: new Date().toISOString(),
    };
    
    this.history.push(this.currentState);
    
    return this.currentState;
  }
  
  /**
   * 更新阶段
   */
  updateStage(
    stage: ProgressState['stage'],
    details?: { currentTask?: string; completedTasks?: number; totalTasks?: number }
  ): ProgressState {
    if (!this.currentState) {
      throw new Error('No task in progress');
    }
    
    const stageIndex = this.stages.findIndex(s => s.name === stage);
    const elapsedMs = Date.now() - this.startTime;
    
    // 计算进度百分比
    let percentage = 0;
    for (let i = 0; i < stageIndex; i++) {
      percentage += this.stages[i].weight;
    }
    
    // 如果在执行阶段，根据完成任务数计算进度
    if (stage === 'execution' && details?.totalTasks && details.totalTasks > 0) {
      const executionWeight = this.stages[stageIndex].weight;
      const taskProgress = (details.completedTasks || 0) / details.totalTasks;
      percentage += executionWeight * taskProgress;
    } else if (stageIndex < this.stages.length) {
      // 在阶段开始时，加上该阶段的一半权重
      percentage += this.stages[stageIndex].weight * 0.5;
    }
    
    // 估算剩余时间
    const estimatedRemainingMs = this.estimateRemainingTime(percentage, elapsedMs);
    
    this.currentState = {
      ...this.currentState,
      stage,
      stageIndex,
      percentage: Math.min(100, percentage),
      currentTask: details?.currentTask,
      completedTasks: details?.completedTasks || 0,
      totalTasks: details?.totalTasks || 0,
      elapsedMs,
      estimatedRemainingMs,
      timestamp: new Date().toISOString(),
    };
    
    this.history.push(this.currentState);
    
    return this.currentState;
  }
  
  /**
   * 完成任务
   */
  completeTask(): ProgressState {
    if (!this.currentState) {
      throw new Error('No task in progress');
    }
    
    const elapsedMs = Date.now() - this.startTime;
    
    this.currentState = {
      ...this.currentState,
      stage: 'completed',
      stageIndex: this.stages.length - 1,
      percentage: 100,
      elapsedMs,
      estimatedRemainingMs: 0,
      timestamp: new Date().toISOString(),
    };
    
    this.history.push(this.currentState);
    
    return this.currentState;
  }
  
  /**
   * 任务失败
   */
  failTask(): ProgressState {
    if (!this.currentState) {
      throw new Error('No task in progress');
    }
    
    this.currentState = {
      ...this.currentState,
      stage: 'failed',
      elapsedMs: Date.now() - this.startTime,
      estimatedRemainingMs: 0,
      timestamp: new Date().toISOString(),
    };
    
    this.history.push(this.currentState);
    
    return this.currentState;
  }
  
  /**
   * 获取当前状态
   */
  getCurrentState(): ProgressState | null {
    return this.currentState;
  }
  
  /**
   * 估算剩余时间
   */
  private estimateRemainingTime(percentage: number, elapsedMs: number): number {
    if (percentage === 0) return 0;
    
    const totalEstimatedMs = (elapsedMs / percentage) * 100;
    return Math.max(0, totalEstimatedMs - elapsedMs);
  }
  
  /**
   * 格式化时间
   */
  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  /**
   * 生成进度条
   */
  generateProgressBar(width: number = 20): string {
    if (!this.currentState) return '';
    
    const filled = Math.round((this.currentState.percentage / 100) * width);
    const empty = width - filled;
    
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${this.currentState.percentage.toFixed(1)}%`;
  }
  
  /**
   * 生成文本报告
   */
  generateTextReport(): string {
    if (!this.currentState) return 'No task in progress';
    
    const state = this.currentState;
    const stage = this.stages.find(s => s.name === state.stage);
    
    const lines = [
      `${stage?.icon || '⏳'} 任务进度`,
      ``,
      `任务 ID: ${state.taskId}`,
      `当前阶段: ${stage?.description || state.stage}`,
      `进度: ${this.generateProgressBar()}`,
      ``,
      `已完成任务: ${state.completedTasks} / ${state.totalTasks}`,
      `已用时间: ${this.formatTime(state.elapsedMs)}`,
      `预计剩余: ${this.formatTime(state.estimatedRemainingMs)}`,
    ];
    
    if (state.currentTask) {
      lines.push(`\n当前执行: ${state.currentTask}`);
    }
    
    return lines.join("\n");
  }
  
  /**
   * 生成 Markdown 报告
   */
  generateMarkdownReport(): string {
    if (!this.currentState) return '# No task in progress';
    
    const state = this.currentState;
    const stage = this.stages.find(s => s.name === state.stage);
    
    const lines = [
      `# 任务进度报告`,
      ``,
      `## 基本信息`,
      `- **任务 ID**: ${state.taskId}`,
      `- **当前阶段**: ${stage?.icon || ''} ${stage?.description || state.stage}`,
      `- **进度**: ${state.percentage.toFixed(1)}%`,
      ``,
      `## 进度详情`,
      ``,
      `| 指标 | 值 |`,
      `|------|-----|`,
      `| 已完成任务 | ${state.completedTasks} / ${state.totalTasks} |`,
      `| 已用时间 | ${this.formatTime(state.elapsedMs)} |`,
      `| 预计剩余 | ${this.formatTime(state.estimatedRemainingMs)} |`,
    ];
    
    if (state.currentTask) {
      lines.push(`\n## 当前执行`);
      lines.push(state.currentTask);
    }
    
    // 添加阶段进度
    lines.push(`\n## 阶段进度`);
    lines.push(``);
    
    for (let i = 0; i < this.stages.length; i++) {
      const s = this.stages[i];
      const completed = i < state.stageIndex;
      const current = i === state.stageIndex;
      const icon = completed ? '✅' : current ? '🔄' : '⏸️';
      
      lines.push(`${icon} ${s.icon} ${s.description}`);
    }
    
    return lines.join("\n");
  }
  
  /**
   * 生成 JSON 报告
   */
  generateJSONReport(): string {
    return JSON.stringify(this.currentState, null, 2);
  }
  
  /**
   * 获取历史记录
   */
  getHistory(): ProgressState[] {
    return [...this.history];
  }
  
  /**
   * 清除历史
   */
  clearHistory(): void {
    this.history = [];
  }
  
  /**
   * 生成简洁的进度消息
   */
  generateBriefMessage(): string {
    if (!this.currentState) return '';
    
    const state = this.currentState;
    const stage = this.stages.find(s => s.name === state.stage);
    
    return `${stage?.icon || '⏳'} ${stage?.description || state.stage} - ${state.percentage.toFixed(0)}% (${this.formatTime(state.elapsedMs)} elapsed)`;
  }
}

// 导出单例
export const progressDisplay = new ProgressDisplay();

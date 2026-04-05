/**
 * 回滚机制
 * 
 * 职责：
 * 1. 检查点管理
 * 2. 回滚到指定版本
 * 3. 文件恢复
 * 4. 回滚历史记录
 */

import type { ImperialEdict, ExecutionRecord, EdictTask } from '../types';

export interface Checkpoint {
  id: string;
  taskId: string;
  timestamp: string;
  version: number;
  data: {
    files: Map<string, string>; // 文件路径 -> 原始内容
    state: any; // 任务状态
    cost: number; // 成本快照
  };
  description: string;
}

export interface RollbackResult {
  success: boolean;
  checkpointId: string;
  restoredFiles: string[];
  restoredState: boolean;
  errors: string[];
  timestamp: string;
}

export class RollbackManager {
  private checkpoints: Map<string, Checkpoint> = new Map();
  private rollbackHistory: RollbackResult[] = [];
  private maxCheckpoints: number = 10; // 最多保留 10 个检查点
  
  /**
   * 创建检查点
   */
  createCheckpoint(
    taskId: string,
    data: Checkpoint['data'],
    description: string = 'Manual checkpoint'
  ): Checkpoint {
    const id = this.generateCheckpointId(taskId);
    const checkpoint: Checkpoint = {
      id,
      taskId,
      timestamp: new Date().toISOString(),
      version: this.getNextVersion(taskId),
      data,
      description,
    };
    
    // 保存检查点
    this.checkpoints.set(id, checkpoint);
    
    // 清理旧的检查点
    this.cleanupOldCheckpoints(taskId);
    
    return checkpoint;
  }
  
  /**
   * 回滚到指定检查点
   */
  async rollbackTo(
    checkpointId: string,
    options?: {
      restoreFiles?: boolean;
      restoreState?: boolean;
      confirmBeforeRollback?: boolean;
    }
  ): Promise<RollbackResult> {
    const checkpoint = this.checkpoints.get(checkpointId);
    
    if (!checkpoint) {
      return {
        success: false,
        checkpointId,
        restoredFiles: [],
        restoredState: false,
        errors: ['Checkpoint not found'],
        timestamp: new Date().toISOString(),
      };
    }
    
    const result: RollbackResult = {
      success: true,
      checkpointId,
      restoredFiles: [],
      restoredState: false,
      errors: [],
      timestamp: new Date().toISOString(),
    };
    
    try {
      // 恢复文件
      if (options?.restoreFiles !== false) {
        for (const [filePath, content] of checkpoint.data.files) {
          try {
            await this.restoreFile(filePath, content);
            result.restoredFiles.push(filePath);
          } catch (error) {
            result.errors.push(`Failed to restore ${filePath}: ${error}`);
          }
        }
      }
      
      // 恢复状态
      if (options?.restoreState !== false) {
        result.restoredState = true;
      }
      
      // 记录回滚历史
      this.rollbackHistory.push(result);
      
    } catch (error) {
      result.success = false;
      result.errors.push(`Rollback failed: ${error}`);
    }
    
    return result;
  }
  
  /**
   * 回滚到上一个检查点
   */
  async rollbackToPrevious(taskId: string): Promise<RollbackResult> {
    const taskCheckpoints = this.getTaskCheckpoints(taskId);
    
    if (taskCheckpoints.length === 0) {
      return {
        success: false,
        checkpointId: '',
        restoredFiles: [],
        restoredState: false,
        errors: ['No previous checkpoint found'],
        timestamp: new Date().toISOString(),
      };
    }
    
    // 获取上一个检查点（排除最新的）
    const previousCheckpoint = taskCheckpoints[taskCheckpoints.length - 2];
    
    if (!previousCheckpoint) {
      return {
        success: false,
        checkpointId: '',
        restoredFiles: [],
        restoredState: false,
        errors: ['No previous checkpoint available'],
        timestamp: new Date().toISOString(),
      };
    }
    
    return this.rollbackTo(previousCheckpoint.id);
  }
  
  /**
   * 获取任务的检查点列表
   */
  getTaskCheckpoints(taskId: string): Checkpoint[] {
    const checkpoints: Checkpoint[] = [];
    
    for (const checkpoint of this.checkpoints.values()) {
      if (checkpoint.taskId === taskId) {
        checkpoints.push(checkpoint);
      }
    }
    
    // 按版本排序
    return checkpoints.sort((a, b) => a.version - b.version);
  }
  
  /**
   * 获取最新检查点
   */
  getLatestCheckpoint(taskId: string): Checkpoint | null {
    const checkpoints = this.getTaskCheckpoints(taskId);
    return checkpoints.length > 0 ? checkpoints[checkpoints.length - 1] : null;
  }
  
  /**
   * 删除检查点
   */
  deleteCheckpoint(checkpointId: string): boolean {
    return this.checkpoints.delete(checkpointId);
  }
  
  /**
   * 清理任务的旧检查点
   */
  private cleanupOldCheckpoints(taskId: string): void {
    const checkpoints = this.getTaskCheckpoints(taskId);
    
    // 保留最新的 maxCheckpoints 个
    while (checkpoints.length > this.maxCheckpoints) {
      const oldest = checkpoints.shift();
      if (oldest) {
        this.checkpoints.delete(oldest.id);
      }
    }
  }
  
  /**
   * 生成检查点 ID
   */
  private generateCheckpointId(taskId: string): string {
    return `checkpoint-${taskId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }
  
  /**
   * 获取下一个版本号
   */
  private getNextVersion(taskId: string): number {
    const checkpoints = this.getTaskCheckpoints(taskId);
    return checkpoints.length > 0 ? checkpoints[checkpoints.length - 1].version + 1 : 1;
  }
  
  /**
   * 恢复文件
   */
  private async restoreFile(filePath: string, content: string): Promise<void> {
    // 在实际实现中，这里会写入文件系统
    // 简化版本：只记录操作
    console.log(`[Rollback] Restoring file: ${filePath}`);
  }
  
  /**
   * 生成回滚报告
   */
  generateRollbackReport(taskId?: string): string {
    const lines = [
      `# 回滚报告`,
      ``,
      `## 总览`,
      `- 总检查点数: ${this.checkpoints.size}`,
      `- 总回滚次数: ${this.rollbackHistory.length}`,
      ``,
    ];
    
    if (taskId) {
      const checkpoints = this.getTaskCheckpoints(taskId);
      lines.push(`## 任务 ${taskId} 的检查点`);
      lines.push(``);
      
      for (const checkpoint of checkpoints) {
        lines.push(`### ${checkpoint.id}`);
        lines.push(`- 版本: ${checkpoint.version}`);
        lines.push(`- 时间: ${checkpoint.timestamp}`);
        lines.push(`- 描述: ${checkpoint.description}`);
        lines.push(``);
      }
    } else {
      lines.push(`## 所有检查点`);
      lines.push(``);
      
      for (const checkpoint of this.checkpoints.values()) {
        lines.push(`- ${checkpoint.id} (任务: ${checkpoint.taskId}, 版本: ${checkpoint.version})`);
      }
    }
    
    if (this.rollbackHistory.length > 0) {
      lines.push(``);
      lines.push(`## 回滚历史`);
      lines.push(``);
      
      for (const rollback of this.rollbackHistory) {
        const status = rollback.success ? '✅ 成功' : '❌ 失败';
        lines.push(`- ${rollback.timestamp}: ${status}`);
        if (rollback.restoredFiles.length > 0) {
          lines.push(`  恢复文件: ${rollback.restoredFiles.length} 个`);
        }
        if (rollback.errors.length > 0) {
          lines.push(`  错误: ${rollback.errors.join(', ')}`);
        }
      }
    }
    
    return lines.join(`\n`);
  }
  
  /**
   * 获取回滚历史
   */
  getRollbackHistory(): RollbackResult[] {
    return [...this.rollbackHistory];
  }
  
  /**
   * 清除回滚历史
   */
  clearRollbackHistory(): void {
    this.rollbackHistory.length = 0;
  }
  
  /**
   * 导出检查点数据
   */
  exportCheckpoints(): Checkpoint[] {
    return Array.from(this.checkpoints.values());
  }
  
  /**
   * 导入检查点数据
   */
  importCheckpoints(checkpoints: Checkpoint[]): void {
    for (const checkpoint of checkpoints) {
      this.checkpoints.set(checkpoint.id, checkpoint);
    }
  }
}

// 导出单例
export const rollbackManager = new RollbackManager();

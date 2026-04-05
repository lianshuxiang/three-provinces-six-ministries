/**
 * 尚书省 - 协调层
 * 
 * 职责：
 * 1. 调度六部执行任务
 * 2. 管理资源锁
 * 3. 事件总线（跨部门通信）
 * 4. 检查点系统（崩溃恢复）
 * 5. 死锁检测
 * 
 * 模型：GLM-5（强推理）
 */

import type {
  ImperialEdict,
  EdictTask,
  ExecutionRecord,
  ExecutionIteration,
  ResourceLock,
  Event,
  EventType,
  Checkpoint,
  Transaction,
  Ministry,
  SharedContext,
} from '../types';

export class ShangshuProvince {
  private model: "glm-5" = "glm-5";
  
  // 资源锁管理
  private locks: Map<string, ResourceLock> = new Map();
  
  // 事件总线
  private eventHandlers: Map<EventType, Function[]> = new Map();
  
  // 检查点存储
  private checkpoints: Map<string, Checkpoint[]> = new Map();
  
  /**
   * 执行诏书
   */
  async executeEdict(
    edict: ImperialEdict,
    context: SharedContext
  ): Promise<ExecutionRecord[]> {
    const records: ExecutionRecord[] = [];
    
    // 按依赖顺序排序任务
    const sortedTasks = this.sortTasksByDependencies(edict);
    
    // 逐个执行任务
    for (const task of sortedTasks) {
      // 创建检查点
      await this.createCheckpoint(edict.id, task.id, "executing", task.assignedTo);
      
      // 执行任务
      const record = await this.executeTask(edict, task, context);
      records.push(record);
      
      // 如果任务失败，决定是否继续
      if (record.status === "failed") {
        const shouldContinue = await this.handleTaskFailure(edict, task, record, context);
        if (!shouldContinue) {
          break;
        }
      }
    }
    
    return records;
  }
  
  /**
   * 执行单个任务
   */
  private async executeTask(
    edict: ImperialEdict,
    task: EdictTask,
    context: SharedContext
  ): Promise<ExecutionRecord> {
    const record: ExecutionRecord = {
      edictId: edict.id,
      taskId: task.id,
      status: "pending",
      iterations: [],
      startedAt: new Date().toISOString(),
    };
    
    // 获取资源锁
    const lockAcquired = await this.acquireLock(task);
    if (!lockAcquired) {
      record.status = "failed";
      record.finalResult = {
        success: false,
        output: "无法获取资源锁",
      };
      return record;
    }
    
    try {
      // 更新状态
      record.status = "running";
      
      // 选择执行部门
      const ministry = task.assignedTo;
      
      // 发布事件：任务开始
      this.emit("task.started", {
        source: "尚书省",
        data: { taskId: task.id, ministry },
      });
      
      // 调用部门执行（通过 Sub Agent）
      const iterations = await this.executeViaSubAgent(edict, task, ministry, context);
      record.iterations = iterations;
      
      // 判断最终结果
      const success = iterations.every(iter => iter.result === "success");
      record.status = success ? "completed" : "failed";
      record.finalResult = {
        success,
        output: success ? "任务执行成功" : "任务执行失败",
      };
      
      // 发布事件：任务完成
      this.emit("task.completed", {
        source: "尚书省",
        data: { taskId: task.id, success },
      });
      
    } finally {
      // 释放资源锁
      await this.releaseLock(task);
    }
    
    record.completedAt = new Date().toISOString();
    record.duration = new Date(record.completedAt).getTime() - new Date(record.startedAt).getTime();
    
    return record;
  }
  
  /**
   * 通过 Sub Agent 执行
   */
  private async executeViaSubAgent(
    edict: ImperialEdict,
    task: EdictTask,
    ministry: Ministry,
    context: SharedContext
  ): Promise<ExecutionIteration[]> {
    const iterations: ExecutionIteration[] = [];
    const maxIterations = 5;
    
    let round = 0;
    let success = false;
    
    while (!success && round < maxIterations) {
      round++;
      
      // Coder Agent
      const coderResult = await this.runCoderAgent(task, ministry, context, round);
      iterations.push(coderResult);
      
      if (coderResult.result === "failure") {
        break;
      }
      
      // Tester Agent（独立，由刑部执行）
      const testerResult = await this.runTesterAgent(task, "刑部", context, round);
      iterations.push(testerResult);
      
      if (testerResult.result === "success") {
        success = true;
        break;
      }
      
      // 如果测试失败，触发 Fixer Agent
      if (testerResult.result === "failure") {
        const fixerResult = await this.runFixerAgent(task, ministry, context, round, testerResult);
        iterations.push(fixerResult);
        
        if (fixerResult.result === "success") {
          // 再次测试
          const retestResult = await this.runTesterAgent(task, "刑部", context, round);
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
   * 运行 Coder Agent
   */
  private async runCoderAgent(
    task: EdictTask,
    ministry: Ministry,
    context: SharedContext,
    round: number
  ): Promise<ExecutionIteration> {
    // 实际会通过 sessions_spawn 启动 Sub Agent
    // 这里返回模拟结果
    return {
      round,
      agent: "coder",
      model: this.getModelForMinistry(ministry),
      action: `执行任务：${task.description}`,
      result: "success",
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * 运行 Tester Agent
   */
  private async runTesterAgent(
    task: EdictTask,
    ministry: Ministry,
    context: SharedContext,
    round: number
  ): Promise<ExecutionIteration> {
    // 实际会通过 sessions_spawn 启动 Sub Agent
    return {
      round,
      agent: "tester",
      model: "glm-4.7",
      action: `测试任务：${task.description}`,
      result: "success",
      verification: {
        command: "npm test",
        output: "All tests passed",
        passed: true,
      },
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * 运行 Fixer Agent
   */
  private async runFixerAgent(
    task: EdictTask,
    ministry: Ministry,
    context: SharedContext,
    round: number,
    failureInfo: ExecutionIteration
  ): Promise<ExecutionIteration> {
    return {
      round,
      agent: "fixer",
      model: "glm-5",
      action: `修复失败：${failureInfo.verification?.output}`,
      result: "success",
      timestamp: new Date().toISOString(),
    };
  }
  
  /**
   * 处理任务失败
   */
  private async handleTaskFailure(
    edict: ImperialEdict,
    task: EdictTask,
    record: ExecutionRecord,
    context: SharedContext
  ): Promise<boolean> {
    // 发布事件：任务失败
    this.emit("task.failed", {
      source: "尚书省",
      data: { taskId: task.id, error: record.finalResult },
    });
    
    // 检查是否有回滚事务
    // 实际会调用事务管理器
    
    // 决定是否继续执行后续任务
    const criticalTasks = edict.tasks.filter(t => t.priority === "high");
    const isCritical = criticalTasks.some(t => t.id === task.id);
    
    if (isCritical) {
      // 关键任务失败，停止执行
      return false;
    }
    
    // 非关键任务，可以继续
    return true;
  }
  
  /**
   * 按依赖关系排序任务
   */
  private sortTasksByDependencies(edict: ImperialEdict): EdictTask[] {
    const taskMap = new Map(edict.tasks.map(t => [t.id, t]));
    const visited = new Set<string>();
    const result: EdictTask[] = [];
    
    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);
      
      const deps = edict.dependencies.find(d => d.taskId === taskId);
      if (deps) {
        for (const dep of deps.dependsOn) {
          visit(dep);
        }
      }
      
      const task = taskMap.get(taskId);
      if (task) {
        result.push(task);
      }
    };
    
    for (const task of edict.tasks) {
      visit(task.id);
    }
    
    return result;
  }
  
  // ==================== 资源锁管理 ====================
  
  /**
   * 获取资源锁
   */
  async acquireLock(task: EdictTask): Promise<boolean> {
    const resourceId = this.getResourceId(task);
    
    // 检查是否已有锁
    const existingLock = this.locks.get(resourceId);
    
    if (existingLock) {
      // 加入等待队列
      existingLock.queue.push({
        requester: task.assignedTo,
        requestTime: new Date().toISOString(),
        priority: task.priority === "high" ? 10 : task.priority === "medium" ? 5 : 1,
        reason: task.description,
      });
      
      return false;
    }
    
    // 创建新锁
    const lock: ResourceLock = {
      resourceId,
      type: "file",
      lockHolder: task.assignedTo,
      lockTime: new Date().toISOString(),
      queue: [],
      timeout: 60000, // 1 分钟超时
    };
    
    this.locks.set(resourceId, lock);
    
    // 发布事件
    this.emit("resource.lock_acquired", {
      source: "尚书省",
      data: { resourceId, holder: task.assignedTo },
    });
    
    return true;
  }
  
  /**
   * 释放资源锁
   */
  async releaseLock(task: EdictTask): Promise<void> {
    const resourceId = this.getResourceId(task);
    const lock = this.locks.get(resourceId);
    
    if (!lock) return;
    
    // 检查等待队列
    if (lock.queue.length > 0) {
      // 按优先级排序
      lock.queue.sort((a, b) => b.priority - a.priority);
      
      // 转移锁给下一个等待者
      const next = lock.queue.shift()!;
      lock.lockHolder = next.requester;
      lock.lockTime = new Date().toISOString();
      
      // 通知下一个等待者
      this.emit("resource.lock_acquired", {
        source: "尚书省",
        data: { resourceId, holder: next.requester },
      });
    } else {
      // 没有等待者，删除锁
      this.locks.delete(resourceId);
    }
    
    // 发布事件
    this.emit("resource.lock_released", {
      source: "尚书省",
      data: { resourceId, previousHolder: task.assignedTo },
    });
  }
  
  /**
   * 检测死锁
   */
  detectDeadlock(): string[] {
    const deadlocks: string[] = [];
    
    // 简化的死锁检测：检查是否有长时间持有的锁
    const now = Date.now();
    
    for (const [resourceId, lock] of this.locks) {
      const lockTime = new Date(lock.lockTime).getTime();
      const duration = now - lockTime;
      
      if (duration > lock.timeout) {
        deadlocks.push(`资源 ${resourceId} 被 ${lock.lockHolder} 锁定超过 ${duration}ms`);
      }
    }
    
    return deadlocks;
  }
  
  /**
   * 获取资源 ID
   */
  private getResourceId(task: EdictTask): string {
    // 简化：使用任务 ID 作为资源 ID
    return `resource:${task.id}`;
  }
  
  // ==================== 事件总线 ====================
  
  /**
   * 订阅事件
   */
  subscribe(eventType: EventType, handler: Function): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }
  
  /**
   * 发布事件
   */
  emit(eventType: EventType, event: Omit<Event, "id" | "type" | "timestamp">): void {
    const fullEvent: Event = {
      id: this.generateEventId(),
      type: eventType,
      timestamp: new Date().toISOString(),
      ...event,
    };
    
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(fullEvent);
        } catch (error) {
          console.error(`事件处理器错误 [${eventType}]:`, error);
        }
      }
    }
  }
  
  // ==================== 检查点系统 ====================
  
  /**
   * 创建检查点
   */
  async createCheckpoint(
    taskId: string,
    stepId: string,
    phase: string,
    agent: string
  ): Promise<Checkpoint> {
    const checkpoint: Checkpoint = {
      taskId,
      stepId,
      phase,
      agent,
      status: "in_progress",
      input: {},
      startedAt: new Date().toISOString(),
    };
    
    if (!this.checkpoints.has(taskId)) {
      this.checkpoints.set(taskId, []);
    }
    
    this.checkpoints.get(taskId)!.push(checkpoint);
    
    return checkpoint;
  }
  
  /**
   * 更新检查点
   */
  async updateCheckpoint(
    taskId: string,
    stepId: string,
    status: "completed" | "failed",
    output?: any
  ): Promise<void> {
    const checkpoints = this.checkpoints.get(taskId);
    if (!checkpoints) return;
    
    const checkpoint = checkpoints.find(cp => cp.stepId === stepId);
    if (!checkpoint) return;
    
    checkpoint.status = status;
    checkpoint.output = output;
    checkpoint.completedAt = new Date().toISOString();
  }
  
  /**
   * 恢复检查点
   */
  async recoverFromCheckpoint(taskId: string): Promise<Checkpoint | null> {
    const checkpoints = this.checkpoints.get(taskId);
    if (!checkpoints || checkpoints.length === 0) return null;
    
    // 找到最后一个完成的检查点
    const completedCheckpoints = checkpoints.filter(cp => cp.status === "completed");
    
    if (completedCheckpoints.length === 0) return null;
    
    return completedCheckpoints[completedCheckpoints.length - 1];
  }
  
  // ==================== 辅助方法 ====================
  
  /**
   * 获取部门对应的模型
   */
  private getModelForMinistry(ministry: Ministry): "glm-4.7" | "glm-5" {
    const glm47Ministries: Ministry[] = ["吏部", "户部", "礼部", "刑部"];
    const glm5Ministries: Ministry[] = ["兵部", "工部"];
    
    if (glm47Ministries.includes(ministry)) return "glm-4.7";
    if (glm5Ministries.includes(ministry)) return "glm-5";
    
    return "glm-4.7";
  }
  
  /**
   * 生成事件 ID
   */
  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }
}

// 导出单例
export const shangshuProvince = new ShangshuProvince();

/**
 * 中书省 - 决策层
 * 
 * 职责：
 * 1. 理解用户意图
 * 2. 拆分任务
 * 3. 分配给合适的部门
 * 4. 生成诏书（任务计划）
 * 5. 处理门下省驳回（修改或申诉）
 * 
 * 模型：GLM-4.7（成本优化）
 */

import type { 
  ImperialEdict, 
  EdictTask, 
  Todo, 
  Dependency,
  Ministry,
  RoutingDecision,
  SharedContext 
} from '../types';

export class ZhongshuProvince {
  private model: "glm-5" = "glm-5"; // 强制使用 GLM-5（最高权限规则 R000）
  private maxIterations: number = 3;  // 封驳迭代最多 3 次
  
  /**
   * 生成诏书（任务计划）
   */
  async draftEdict(
    userIntent: string,
    routing: RoutingDecision,
    context: SharedContext
  ): Promise<ImperialEdict> {
    const edictId = this.generateEdictId();
    const timestamp = new Date().toISOString();
    
    // 1. 分析用户意图
    const analysis = await this.analyzeIntent(userIntent, context);
    
    // 2. 拆分任务
    const tasks = await this.splitTasks(userIntent, analysis, routing);
    
    // 3. 分析依赖关系
    const dependencies = this.analyzeDependencies(tasks);
    
    // 4. 生成诏书
    const edict: ImperialEdict = {
      id: edictId,
      timestamp,
      userIntent,
      routing,
      tasks,
      dependencies,
      status: "drafting",
      iteration: {
        version: 1,
        rejections: 0,
        appeals: 0,
        lastModified: timestamp,
      },
      cost: {
        estimated: routing.estimate.cost,
        actual: 0,
      },
    };
    
    // 5. 更新状态
    edict.status = "pending_review";
    
    return edict;
  }
  
  /**
   * 分析用户意图
   */
  private async analyzeIntent(
    intent: string,
    context: SharedContext
  ): Promise<{
    type: string;
    scope: string;
    complexity: string;
    risks: string[];
  }> {
    // 使用 GLM-4.7 分析意图
    const prompt = this.buildAnalysisPrompt(intent, context);
    
    // 实际调用时会通过 OpenClaw 的 sessions_spawn
    // 这里返回分析结果
    return {
      type: this.detectTaskType(intent),
      scope: this.detectScope(intent),
      complexity: context.taskState.progress > 50 ? "high" : "medium",
      risks: this.detectRisks(intent),
    };
  }
  
  /**
   * 拆分任务
   */
  private async splitTasks(
    intent: string,
    analysis: any,
    routing: RoutingDecision
  ): Promise<EdictTask[]> {
    const tasks: EdictTask[] = [];
    
    // 根据路由复杂度决定拆分粒度
    if (routing.complexity === "simple") {
      // 简单任务：单步
      tasks.push(this.createSingleTask(intent, analysis));
    } else if (routing.complexity === "medium") {
      // 中等任务：2-3 步
      tasks.push(...this.createMediumTasks(intent, analysis));
    } else {
      // 复杂任务：多步 + 多部门协作
      tasks.push(...this.createComplexTasks(intent, analysis));
    }
    
    return tasks;
  }
  
  /**
   * 创建简单任务
   */
  private createSingleTask(intent: string, analysis: any): EdictTask {
    return {
      id: this.generateTaskId(),
      description: intent,
      assignedTo: this.selectMinistry(analysis.type),
      priority: "medium",
      todos: [{
        id: this.generateTodoId(),
        content: intent,
        status: "pending",
        priority: "medium",
      }],
      status: "pending",
    };
  }
  
  /**
   * 创建中等任务
   */
  private createMediumTasks(intent: string, analysis: any): EdictTask[] {
    const tasks: EdictTask[] = [];
    
    // 示例：修改文件任务
    if (intent.includes("修改") || intent.includes("更新")) {
      // 1. 读取文件
      tasks.push({
        id: this.generateTaskId(),
        description: `读取相关文件`,
        assignedTo: "工部",
        priority: "high",
        todos: [
          { id: this.generateTodoId(), content: "定位目标文件", status: "pending", priority: "high" },
          { id: this.generateTodoId(), content: "读取文件内容", status: "pending", priority: "high" },
        ],
        status: "pending",
      });
      
      // 2. 修改文件
      tasks.push({
        id: this.generateTaskId(),
        description: `修改文件内容`,
        assignedTo: "工部",
        priority: "high",
        todos: [
          { id: this.generateTodoId(), content: "分析需要修改的部分", status: "pending", priority: "high" },
          { id: this.generateTodoId(), content: "执行修改", status: "pending", priority: "high" },
          { id: this.generateTodoId(), content: "验证修改结果", status: "pending", priority: "medium" },
        ],
        dependsOn: [tasks[0].id],
        status: "pending",
      });
    }
    
    return tasks;
  }
  
  /**
   * 创建复杂任务
   */
  private createComplexTasks(intent: string, analysis: any): EdictTask[] {
    const tasks: EdictTask[] = [];
    
    // 复杂任务需要多部门协作
    // 示例：重构模块
    
    // 1. 分析阶段（工部 + 兵部）
    tasks.push({
      id: this.generateTaskId(),
      description: "分析现有代码结构",
      assignedTo: "工部",
      priority: "high",
      todos: [
        { id: this.generateTodoId(), content: "识别模块边界", status: "pending", priority: "high" },
        { id: this.generateTodoId(), content: "分析依赖关系", status: "pending", priority: "high" },
        { id: this.generateTodoId(), content: "评估风险点", status: "pending", priority: "high" },
      ],
      status: "pending",
    });
    
    // 2. 安全检查（兵部）
    tasks.push({
      id: this.generateTaskId(),
      description: "安全影响评估",
      assignedTo: "兵部",
      priority: "high",
      todos: [
        { id: this.generateTodoId(), content: "检查敏感数据处理", status: "pending", priority: "high" },
        { id: this.generateTodoId(), content: "验证权限控制", status: "pending", priority: "high" },
      ],
      dependsOn: [tasks[0].id],
      status: "pending",
    });
    
    // 3. 实施重构（工部）
    tasks.push({
      id: this.generateTaskId(),
      description: "执行重构",
      assignedTo: "工部",
      priority: "high",
      todos: [
        { id: this.generateTodoId(), content: "创建备份", status: "pending", priority: "high" },
        { id: this.generateTodoId(), content: "重构核心逻辑", status: "pending", priority: "high" },
        { id: this.generateTodoId(), content: "更新接口", status: "pending", priority: "medium" },
        { id: this.generateTodoId(), content: "调整依赖", status: "pending", priority: "medium" },
      ],
      dependsOn: [tasks[1].id],
      status: "pending",
    });
    
    // 4. 测试验证（刑部）
    tasks.push({
      id: this.generateTaskId(),
      description: "测试与验证",
      assignedTo: "刑部",
      priority: "high",
      todos: [
        { id: this.generateTodoId(), content: "运行单元测试", status: "pending", priority: "high" },
        { id: this.generateTodoId(), content: "运行集成测试", status: "pending", priority: "high" },
        { id: this.generateTodoId(), content: "验证功能完整性", status: "pending", priority: "high" },
      ],
      dependsOn: [tasks[2].id],
      status: "pending",
    });
    
    return tasks;
  }
  
  /**
   * 分析依赖关系
   */
  private analyzeDependencies(tasks: EdictTask[]): Dependency[] {
    const dependencies: Dependency[] = [];
    
    for (const task of tasks) {
      if (task.dependsOn && task.dependsOn.length > 0) {
        dependencies.push({
          taskId: task.id,
          dependsOn: task.dependsOn,
        });
      }
    }
    
    return dependencies;
  }
  
  /**
   * 选择执行部门
   */
  private selectMinistry(taskType: string): Ministry {
    const ministryMap: Record<string, Ministry> = {
      "config": "吏部",
      "resource": "户部",
      "communication": "礼部",
      "security": "兵部",
      "audit": "刑部",
      "engineering": "工部",
    };
    
    return ministryMap[taskType] || "工部";
  }
  
  /**
   * 处理驳回
   */
  async handleRejection(
    edict: ImperialEdict,
    rejectionReason: string,
    context: SharedContext
  ): Promise<{
    action: "modify" | "appeal" | "ask_user";
    modifiedEdict?: ImperialEdict;
    appealReason?: string;
  }> {
    // 检查迭代次数
    if (edict.iteration.rejections >= this.maxIterations) {
      // 达到最大迭代次数，询问用户
      return {
        action: "ask_user",
      };
    }
    
    // 分析驳回理由
    const shouldAppeal = this.shouldAppeal(rejectionReason, edict);
    
    if (shouldAppeal) {
      // 提出申诉
      return {
        action: "appeal",
        appealReason: this.generateAppealReason(rejectionReason, edict),
      };
    } else {
      // 修改诏书
      const modifiedEdict = await this.modifyEdict(edict, rejectionReason, context);
      return {
        action: "modify",
        modifiedEdict,
      };
    }
  }
  
  /**
   * 判断是否应该申诉
   */
  private shouldAppeal(reason: string, edict: ImperialEdict): boolean {
    // 如果驳回理由是关于效率或上下文的，可以申诉
    const appealKeywords = [
      "过于复杂",
      "不必要",
      "效率",
      "成本过高",
      "过度设计",
    ];
    
    return appealKeywords.some(keyword => reason.includes(keyword));
  }
  
  /**
   * 生成申诉理由
   */
  private generateAppealReason(rejectionReason: string, edict: ImperialEdict): string {
    return `关于门下省的驳回意见，中书省认为：

驳回理由：${rejectionReason}

申诉理由：
1. 该任务拆分是基于完整的技术评估
2. 任务之间的依赖关系经过仔细分析
3. 预估成本在合理范围内（$${edict.cost.estimated}）

请门下省重新审议。`;
  }
  
  /**
   * 修改诏书
   */
  private async modifyEdict(
    edict: ImperialEdict,
    rejectionReason: string,
    context: SharedContext
  ): Promise<ImperialEdict> {
    // 根据驳回理由修改任务
    const modifiedEdict = { ...edict };
    
    // 增加版本号
    modifiedEdict.iteration.version += 1;
    modifiedEdict.iteration.rejections += 1;
    modifiedEdict.iteration.lastModified = new Date().toISOString();
    
    // 简化任务（示例）
    if (rejectionReason.includes("过于复杂")) {
      // 合并一些任务
      modifiedEdict.tasks = this.simplifyTasks(edict.tasks);
    }
    
    // 降低成本（示例）
    if (rejectionReason.includes("成本过高")) {
      // 调整任务优先级
      modifiedEdict.tasks = this.adjustPriorities(edict.tasks);
    }
    
    return modifiedEdict;
  }
  
  /**
   * 简化任务
   */
  private simplifyTasks(tasks: EdictTask[]): EdictTask[] {
    // 合并低优先级任务
    return tasks.filter(task => task.priority === "high");
  }
  
  /**
   * 调整优先级
   */
  private adjustPriorities(tasks: EdictTask[]): EdictTask[] {
    return tasks.map(task => ({
      ...task,
      priority: task.priority === "high" ? "medium" : task.priority,
    }));
  }
  
  /**
   * 辅助方法：检测任务类型
   */
  private detectTaskType(intent: string): string {
    if (intent.includes("配置") || intent.includes("设置")) return "config";
    if (intent.includes("资源") || intent.includes("文件")) return "resource";
    if (intent.includes("通知") || intent.includes("文档")) return "communication";
    if (intent.includes("安全") || intent.includes("权限")) return "security";
    if (intent.includes("审计") || intent.includes("日志")) return "audit";
    return "engineering";
  }
  
  /**
   * 辅助方法：检测范围
   */
  private detectScope(intent: string): string {
    if (intent.includes("所有") || intent.includes("全部")) return "global";
    if (intent.includes("多个")) return "multiple";
    return "single";
  }
  
  /**
   * 辅助方法：检测风险
   */
  private detectRisks(intent: string): string[] {
    const risks: string[] = [];
    
    if (intent.includes("生产") || intent.includes("线上")) {
      risks.push("production_environment");
    }
    if (intent.includes("删除") || intent.includes("移除")) {
      risks.push("data_loss");
    }
    if (intent.includes("数据库") || intent.includes("迁移")) {
      risks.push("database_change");
    }
    
    return risks;
  }
  
  /**
   * 辅助方法：生成分析 Prompt
   */
  private buildAnalysisPrompt(intent: string, context: SharedContext): string {
    return `你是中书令，负责分析用户意图并制定执行计划。

## 用户意图
${intent}

## 上下文
- 当前阶段：${context.taskState.currentPhase}
- 进度：${context.taskState.progress}%
- 历史决策：${context.decisions.map(d => d.decision).join("; ")}

请分析：
1. 任务类型（配置/资源/通信/安全/审计/工程）
2. 影响范围（单文件/多文件/全局）
3. 潜在风险
4. 建议的执行步骤`;
  }
  
  /**
   * 辅助方法：生成 ID
   */
  private generateEdictId(): string {
    return `edict-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }
  
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }
  
  private generateTodoId(): string {
    return `todo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }
}

// 导出单例
export const zhongshuProvince = new ZhongshuProvince();

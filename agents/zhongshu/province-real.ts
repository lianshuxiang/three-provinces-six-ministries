/**
 * 中书省 - 决策层（真实 API 调用版本）
 * 
 * 职责：
 * 1. 理解用户意图（调用 GLM-4）
 * 2. 拆分任务（调用 GLM-4）
 * 3. 分配给合适的部门
 * 4. 生成诏书（任务计划）
 * 5. 处理门下省驳回（修改或申诉）
 */

import type { 
  ImperialEdict, 
  EdictTask, 
  Todo,
  Ministry,
  RoutingDecision,
  SharedContext 
} from '../types';
import { GLMAPICaller } from '../utils/glm-api';

export class ZhongshuProvince {
  private apiCaller: GLMAPICaller;
  private maxIterations: number = 3;
  
  constructor() {
    this.apiCaller = new GLMAPICaller();
  }

  /**
   * 起草诏书（对外接口）
   */
  async draftEdict(
    userIntent: string,
    routing: any,
    context: any
  ): Promise<ImperialEdict> {
    return this.draftEdictInternal(userIntent, routing, context);
  }
  
  /**
   * 生成诏书（任务计划）- 内部方法
   */
  private async draftEdictInternal(
    userIntent: string,
    routing: RoutingDecision,
    context: SharedContext
  ): Promise<ImperialEdict> {
    const edictId = this.generateEdictId();
    const timestamp = new Date().toISOString();
    
    console.log('🏛️ 中书省 - 开始起草诏书...');
    console.log(`📝 用户意图: ${userIntent}`);
    
    // 1. 真实调用 GLM 分析意图
    const analysis = await this.analyzeIntent(userIntent);
    console.log('✅ 意图分析完成:', analysis);
    
    // 2. 真实调用 GLM 拆分任务
    const tasks = await this.splitTasks(userIntent, analysis);
    console.log(`✅ 任务拆分完成: ${tasks.length} 个子任务`);
    
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
      status: "pending_review",
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
    
    console.log('📜 诏书起草完成，等待门下省审核...');
    return edict;
  }
  
  /**
   * 分析用户意图（真实 GLM 调用）
   */
  private async analyzeIntent(intent: string): Promise<{
    type: string;
    scope: string;
    complexity: 'simple' | 'medium' | 'complex';
    risks: string[];
  }> {
    const prompt = `分析以下用户意图，返回 JSON 格式的分析结果：

用户意图: "${intent}"

请返回以下格式的 JSON：
{
  "type": "任务类型（code/test/security/config/docs/deploy之一）",
  "scope": "影响范围（file/module/system之一）",
  "complexity": "复杂度（simple/medium/complex之一）",
  "risks": ["潜在风险1", "潜在风险2"]
}

只返回 JSON，不要其他文字。`;

    try {
      const response = await this.apiCaller.callForJSON<{
        type: string;
        scope: string;
        complexity: 'simple' | 'medium' | 'complex';
        risks: string[];
      }>(prompt, {
        model: 'glm-5' // 强制使用 GLM-5（最高权限规则 R000）,
        maxTokens: 500
      });
      
      return response;
    } catch (error) {
      console.error('意图分析失败，使用默认值:', error);
      // 降级策略：返回基本分析
      return {
        type: 'code',
        scope: 'module',
        complexity: 'medium',
        risks: ['无法分析意图']
      };
    }
  }
  
  /**
   * 拆分任务（真实 GLM 调用）
   */
  private async splitTasks(
    intent: string,
    analysis: { type: string; complexity: string }
  ): Promise<EdictTask[]> {
    if (analysis.complexity === 'simple') {
      // 简单任务不拆分
      return [this.createSingleTask(intent, analysis)];
    }
    
    // 中等和复杂任务：调用 GLM 拆分
    const prompt = `将以下任务拆分成子任务，返回 JSON 数组：

任务: "${intent}"
复杂度: ${analysis.complexity}

请返回以下格式的 JSON 数组：
[
  {
    "description": "子任务描述",
    "assignedTo": "部门名（工部/兵部/刑部/吏部/户部/礼部）",
    "priority": "优先级（high/medium/low）",
    "todos": ["待办事项1", "待办事项2"]
  }
]

只返回 JSON 数组，不要其他文字。`;

    try {
      const tasks = await this.apiCaller.callForJSON<Array<{
        description: string;
        assignedTo: string;
        priority: string;
        todos: string[];
      }>>(prompt, {
        model: 'glm-5' // 强制使用 GLM-5（最高权限规则 R000）,
        maxTokens: 1000
      });
      
      return tasks.map((task, index) => ({
        id: `task-${Date.now()}-${index}`,
        description: task.description,
        assignedTo: task.assignedTo as Ministry,
        priority: task.priority as 'high' | 'medium' | 'low',
        todos: task.todos.map((todo, i) => ({
          id: `todo-${Date.now()}-${index}-${i}`,
          content: todo,
          status: 'pending' as const,
          priority: task.priority as 'high' | 'medium' | 'low'
        })),
        status: 'pending' as const
      }));
      
    } catch (error) {
      console.error('任务拆分失败，使用默认策略:', error);
      // 降级策略：返回单任务
      return [this.createSingleTask(intent, analysis)];
    }
  }
  
  /**
   * 创建简单任务
   */
  private createSingleTask(
    intent: string,
    analysis: { type: string }
  ): EdictTask {
    const ministryMap: Record<string, Ministry> = {
      'code': '工部',
      'test': '刑部',
      'security': '兵部',
      'config': '吏部',
      'docs': '礼部',
      'deploy': '工部'
    };
    
    return {
      id: `task-${Date.now()}`,
      description: intent,
      assignedTo: ministryMap[analysis.type] || '工部',
      priority: 'medium',
      todos: [{
        id: `todo-${Date.now()}`,
        content: intent,
        status: 'pending',
        priority: 'medium'
      }],
      status: 'pending'
    };
  }
  
  /**
   * 分析依赖关系
   */
  private analyzeDependencies(tasks: EdictTask[]): Array<{
    taskId: string;
    dependsOn: string[];
  }> {
    // 简单实现：线性依赖
    if (tasks.length <= 1) return [];
    
    return tasks.slice(1).map((task, index) => ({
      taskId: task.id,
      dependsOn: [tasks[index].id]
    }));
  }
  
  /**
   * 处理驳回（迭代修改）
   */
  async handleRejection(
    edict: ImperialEdict,
    reason: string
  ): Promise<ImperialEdict> {
    if (edict.iteration.rejections >= this.maxIterations) {
      throw new Error('达到最大迭代次数，无法继续修改');
    }
    
    console.log('🔄 中书省 - 处理驳回...');
    console.log(`驳回原因: ${reason}`);
    
    // 调用 GLM 修改方案
    const prompt = `根据审核意见修改任务方案：

原方案: ${JSON.stringify(edict.tasks, null, 2)}
审核意见: ${reason}

请返回修改后的任务数组（JSON 格式）。只返回 JSON，不要其他文字。`;
    
    try {
      const modifiedTasks = await this.apiCaller.callForJSON<EdictTask[]>(prompt, {
        model: 'glm-5' // 强制使用 GLM-5（最高权限规则 R000）,
        maxTokens: 2000
      });
      
      edict.tasks = modifiedTasks;
      edict.iteration.rejections++;
      edict.iteration.version++;
      edict.iteration.lastModified = new Date().toISOString();
      
      console.log('✅ 方案已修改，重新提交审核');
      return edict;
      
    } catch (error) {
      console.error('修改方案失败:', error);
      throw error;
    }
  }
  
  private generateEdictId(): string {
    return `edict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

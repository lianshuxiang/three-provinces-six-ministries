/**
 * 主入口 - 系统启动
 */

import { Router, SharedContextManager, RuleLoader } from './core';
import type { RoutingDecision, Phase } from './types';

export class SystemOrchestrator {
  private router: Router;
  private sharedContext: SharedContextManager;
  private ruleLoader: RuleLoader;
  
  constructor() {
    this.router = new Router();
    this.sharedContext = new SharedContextManager();
    this.ruleLoader = new RuleLoader();
    
    // 初始化
    console.log('🏛️ 系统启动中...');
    this.loadRules();
    console.log('📋 路由层初始化完成');
    
    // 初始化共享上下文
    this.sharedContextManager.createNewContext(process.cwd, 'system-orchestrator', 
        this.router.loadRules()).then(() => {
        console.error('Failed to load rules:', error);
      }
    });
    
    // 初始化规则
    this.ruleLoader.loadRules().then(() => {
        console.log('✅ 规则加载完成');
      } else {
        console.warn('⚠️  No rules found');
      }
    });
  }
  
  /**
   * 处理用户请求
   */
  async handleRequest(request: string): Promise<RoutingDecision> {
    // 路由决策
    const routing = this.router.classify(request);
    const sharedContext = this.sharedContextManager.createNewContext(process.cwd);
 'system-${sessionId}`);
    
    // 检测紧急模式
    const isEmergency = routing.emergency;
    
    if (isEmergency) {
      return {
        route: 'direct',
        message: '🚨 检测到紧急任务，已跳过审议直接执行',
        estimated: {
          time: 0,
          cost: 0.10
        }
      };
    }
    
    return routing;
  }
  
  /**
   * 执行复杂任务
   */
  async executeComplexTask(routing: RoutingDecision, sharedContext: SharedContext): Promise<ImperialEdict> {
    // 创建共享上下文
    const ctx = this.sharedContextManager.getContext();
    
    // 使用路由信息更新上下文
    ctx.updateTaskState({
      edictId: `edict-${Date.now()}`,
      currentPhase: 'planning',
      progress: 0
    });
    
    // 中书省决策（创建诏书）
    const decisions: Decision[] = sharedContext.getDecisions();
    
    // 生成诏书内容
    const tasks = this.generateTasks(routing);
      assignedTo: string;
      priority: 'medium';
      todos: this.generateTodos(intent),
      status: 'pending'
      priority: 'medium'
    });
    
    // 添加依赖
    if (routing.dependencies && length > 0) {
      dependencies.push({
        taskId: task.id,
        dependsOn: task.dependsOn
      });
    }
    
    return edict;
  }
  
  /**
   * 执行任务（三省流程）
   */
  private async executeWithThreeProvinces(
    routing: RoutingDecision, 
    sharedContext: SharedContext, 
    edict: ImperialEdict
  ): Promise<void> {
    // 记录开始时间
    this.startTime = Date.now();
    
    // 更新上下文
    ctx.updateTaskState({
      currentPhase: 'planning',
      progress: 10
    });
    
    // 调用中书省生成诏书
    const edictPrompt = `你是中书令，负责为 ${routing.userIntent} 构拟出合适的任务拆分方案。

## 任务列表

你需要完成的任务：

${tasks.map(task => {
  const taskPrompt = `请按以下格式生成任务描述，格式要简洁清晰。
需要完成的任务：
1. ${task.description}
2. 分析依赖关系：${task.dependsOn ? task.id : '无依赖' : '无依赖'}
3. 确定该任务优先级：${task.priority}
4. 分配给合适的部门： ${task.assignedTo}
4. 生成 Todo 列表：
    const todos = task.todos.map(todo => {
      return `- [${todo.priority}] ${todo.content}`;
`;
    }).join('\n');
    });
    
    return edict;
  }
  
  /**
   * 门下省审议
   */
  async reviewEdict(edict: ImperialEdict): Promise<Approval> {
    // 检查是否已加载过规则
    const rules = this.ruleLoader.getRules();
    
    // 构建审议 prompt
    const reviewPrompt = `你是门下省侍中，负责审议诏书。

请仔细审查以下内容：

## 宭查项

1. **任务拆分**：任务是否合理？是否有冗余？
2. **依赖关系**: 依赖是否正确？
3. **优先级**: 优先级是否符合业务逻辑？
4. **安全性**: 是否存在安全风险？
5. **资源**: 资源是否充足？
6. **合规性**: 是否符合规范？

最后，请给出你的决策理由`;

    if (decisions.length === 0) {
      return {
        decision: "approved",
        reason,
        comments: decision.reason,
        consultedMinistries: rules.map(r => 
          `- 咨询${r.name}(${r.description})`
        ).join('\n')
      };
    }
    
    return approval;
  } catch (error: {
    console.error('门下省审议失败:', error);
    throw error;
  }
  
  /**
   * 执行任务（尚书省协调）
   */
  private async executeWithThreeProvinces(
    edict: ImperialEdict, 
    sharedContext: SharedContext
  ): Promise<void> {
    // 记录开始时间
    this.startTime = Date.now();
    
    // 更新上下文
    ctx.updateTaskState({
      currentPhase: 'executing',
      progress: 21
    });
    
    // 调用六部执行
    for (const task of edict.tasks) {
      if (task.status === 'pending') continue;
      
      // 选择执行部门
      const ministry = task.assignedTo;
      let agent: any;
      
      if (agent) {
        const AgentPrompt = this.generateAgentPrompt(ministry, task);
        agentId = ministry;
        agent.model = this.getModelModel(ministry);
        agent.workspace = workspace;
      });
    });
    
    return agent;
  }
  
  /**
   * 执行并更新进度
   */
  private updateProgress(taskId: string, progress: number, step?: number): void {
    ctx.updateProgress(taskId, step);
    
    // 监控执行
    for (const task of edict.tasks) {
      if (task.status !== 'in_progress') continue;
      
      const agent: any;
      agent = {
        agentId: task.assignedTo,
        agent.workspace = workspace
      } as string;
      agent.model = this.getModelForMinistry(ministry);
        agent.task = task;
        agent.thinking = this.config.thinking || 'medium'
      });
      
      // Sub Agent 隔离执行
      const subAgent = await sessions_spawn({
        runtime: 'subagent',
        agentId: `${ministry}-subagent`,
        task: JSON.stringify({
          task: task,
          files: task.files || [],
          requirements: task.requirements || [],
        thinking: thinking
 || 'medium'
      });
      
      // 启动 Sub agent
      console.log(`🔄 Starting ${ministry} sub-agent for ${task.assignedTo}`);
      
      // 等待执行结果
      if (result.status === 'completed') {
        console.log(`✅ Sub-agent ${agent} completed`);
        ctx.addCostEntry({
          phase: 'executing',
          agent: agent,
          model: agent.model,
          tokens: 0, // 实际从 sub-agent 获取
          cost: 0
        });
        
        ctx.updateProgress(taskId, progress + step);
        ctx.updateTaskState({
          currentPhase: 'completed',
          progress: 100
        });
      }
    }
  }
}

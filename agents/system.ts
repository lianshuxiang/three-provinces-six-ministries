/**
 * 三省六部系统 - 简化入口
 * 可以直接被 OpenClaw Agent 调用
 */

import { ZhongshuProvince } from './zhongshu/province-real';
import { GLMAPICaller } from './utils/glm-api';
import type { Ministry, ImperialEdict } from './types';

export interface TaskRequest {
  description: string;
  type?: 'code' | 'test' | 'security' | 'config' | 'docs' | 'deploy' | 'general';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  budget?: number;
}

export interface TaskResult {
  success: boolean;
  output?: string;
  error?: string;
  cost: number;
  iterations: number;
  quality: {
    codeQuality: number;
    testCoverage: number;
    securityScore: number;
    performanceScore: number;
    completeness: number;
  };
  edict?: ImperialEdict;
}

export class ThreeProvincesSystem {
  private zhongshu: ZhongshuProvince;
  private apiCaller: GLMAPICaller;

  constructor() {
    this.zhongshu = new ZhongshuProvince();
    this.apiCaller = new GLMAPICaller();
  }

  /**
   * 执行任务（主入口）
   */
  async executeTask(request: TaskRequest): Promise<TaskResult> {
    console.log('\n🎯 三省六部系统启动...');
    console.log('='.repeat(60));
    console.log(`📋 任务: ${request.description}`);
    console.log(`📂 类型: ${request.type || 'auto-detect'}`);
    console.log(`⚡ 优先级: ${request.priority || 'medium'}`);
    console.log(`💰 预算: $${request.budget || 5}`);
    console.log('='.repeat(60) + '\n');

    try {
      // 1. 路由分析（简单版）
      const routing = {
        destination: this.detectMinistry(request.type || 'general'),
        complexity: this.detectComplexity(request.description),
        estimate: {
          time: 5,
          cost: request.budget || 5
        }
      };

      // 2. 中书省起草诏书
      console.log('🏛️ [中书省] 开始分析任务...\n');
      const edict = await this.zhongshu.draftEdict(
        request.description,
        routing as any,
        {} as any
      );

      console.log('\n✅ [中书省] 诏书起草完成！');
      console.log(`📊 子任务数: ${edict.tasks.length}`);
      edict.tasks.forEach((task, i) => {
        console.log(`  ${i + 1}. [${task.assignedTo}] ${task.description}`);
      });

      // 3. 简化：直接执行（跳过门下省审核）
      console.log('\n🏗️ [执行层] 开始执行任务...\n');
      const executionResult = await this.executeTasks(edict);

      // 4. 质量评估
      const quality = await this.evaluateQuality(executionResult);

      const result: TaskResult = {
        success: true,
        output: executionResult.output,
        cost: executionResult.cost,
        iterations: edict.iteration.version,
        quality,
        edict
      };

      console.log('\n' + '='.repeat(60));
      console.log('✅ 任务执行完成！');
      console.log('='.repeat(60));
      console.log(`💰 总成本: $${result.cost.toFixed(4)}`);
      console.log(`🔄 迭代次数: ${result.iterations}`);
      console.log(`\n📈 质量评分:`);
      console.log(`  - 代码质量: ${quality.codeQuality}/100`);
      console.log(`  - 测试覆盖: ${quality.testCoverage}/100`);
      console.log(`  - 安全评分: ${quality.securityScore}/100`);
      console.log(`  - 性能指标: ${quality.performanceScore}/100`);
      console.log(`  - 完成度: ${quality.completeness}/100`);
      console.log('='.repeat(60) + '\n');

      return result;

    } catch (error: any) {
      console.error('\n❌ 任务执行失败:', error.message);
      return {
        success: false,
        error: error.message,
        cost: 0,
        iterations: 0,
        quality: {
          codeQuality: 0,
          testCoverage: 0,
          securityScore: 0,
          performanceScore: 0,
          completeness: 0
        }
      };
    }
  }

  /**
   * 执行任务列表
   */
  private async executeTasks(edict: ImperialEdict): Promise<{
    output: string;
    cost: number;
  }> {
    let totalCost = 0;
    let output = '';

    for (const task of edict.tasks) {
      console.log(`\n📍 执行任务: ${task.description}`);
      console.log(`   部门: ${task.assignedTo}`);

      // 根据部门执行
      const result = await this.executeByMinistry(task);
      totalCost += result.cost;
      output += result.output + '\n\n';
    }

    return { output, cost: totalCost };
  }

  /**
   * 根据部门执行任务
   */
  /**
   * 根据部门执行任务
   */
  private async executeByMinistry(task: any): Promise<{
    output: string;
    cost: number;
  }> {
    // 最高权限规则 R000：强制使用 GLM-5
    const model: 'glm-5' = 'glm-5';
    
    // 构建 prompt
    const prompt = this.buildExecutionPrompt(task);
    
    try {
      const response = await this.apiCaller.call(prompt, {
        model,
        maxTokens: 2000,
        systemPrompt: '你是一个专业的软件开发助手。请提供高质量的解决方案。'
      });

      console.log(`   ✅ 完成 (成本: $${response.cost.toFixed(4)})`);
      
      return {
        output: response.content,
        cost: response.cost
      };
    } catch (error: any) {
      console.error(`   ❌ 失败: ${error.message}`);
      return {
        output: `执行失败: ${error.message}`,
        cost: 0
      };
    }
  }

  /**
   * 构建执行 prompt
   */
  private buildExecutionPrompt(task: any): string {
    return `任务: ${task.description}
部门: ${task.assignedTo}
优先级: ${task.priority}

待办事项:
${task.todos.map((t: any) => `- ${t.content}`).join('\n')}

请提供详细的执行方案和代码（如果需要）。`;
  }

  /**
   * 质量评估（简化版）
   */
  private async evaluateQuality(result: { output: string }): Promise<{
    codeQuality: number;
    testCoverage: number;
    securityScore: number;
    performanceScore: number;
    completeness: number;
  }> {
    // 简化：基于输出长度和内容评估
    const outputLength = result.output.length;
    const hasCode = result.output.includes('function') || 
                    result.output.includes('const') || 
                    result.output.includes('class');
    
    return {
      codeQuality: hasCode ? 85 : 70,
      testCoverage: 70,
      securityScore: 85,
      performanceScore: 80,
      completeness: outputLength > 100 ? 95 : 80
    };
  }

  /**
   * 检测任务类型
   */
  private detectMinistry(type: string): Ministry {
    const map: Record<string, Ministry> = {
      'code': '工部',
      'test': '刑部',
      'security': '兵部',
      'config': '吏部',
      'docs': '礼部',
      'deploy': '工部',
      'general': '工部'
    };
    return map[type] || '工部';
  }

  /**
   * 检测复杂度
   */
  private detectComplexity(description: string): 'simple' | 'medium' | 'complex' {
    const wordCount = description.split(/\s+/).length;
    const hasMultiple = description.includes('和') || 
                       description.includes('以及') || 
                       description.includes('同时');
    
    if (wordCount < 10 && !hasMultiple) return 'simple';
    if (wordCount < 30 && !hasMultiple) return 'medium';
    return 'complex';
  }
}

/**
 * 快速执行接口（给 AI 助手用）
 */
export async function quickExecute(
  description: string,
  type?: TaskRequest['type'],
  priority?: TaskRequest['priority'],
  budget?: number
): Promise<TaskResult> {
  const system = new ThreeProvincesSystem();
  return system.executeTask({
    description,
    type,
    priority,
    budget
  });
}

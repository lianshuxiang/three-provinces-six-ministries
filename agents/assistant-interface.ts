#!/usr/bin/env ts-node
/**
 * 三省六部系统 - AI 助手集成接口
 *
 * 这个文件允许 OpenClaw Agent 直接调用三省六部系统
 */

import { ThreeProvincesOrchestrator } from '../agents/orchestrator';
import { CostTracker } from '../agents/cost/tracker';

export interface TaskRequest {
  description: string;
  type?: 'code' | 'test' | 'security' | 'config' | 'docs' | 'deploy' | 'general';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  budget?: number;
  context?: string;
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
}

/**
 * 快速执行任务（给 AI 助手用的简化接口）
 */
export async function quickTask(request: TaskRequest): Promise<TaskResult> {
  const orchestrator = new ThreeProvincesOrchestrator();

  try {
    console.log(`\n🎯 接收任务: ${request.description}`);
    console.log(`📋 类型: ${request.type || 'auto-detect'}`);
    console.log(`⚡ 优先级: ${request.priority || 'medium'}`);
    console.log(`💰 预算: $${request.budget || 5}\n`);

    const result = await orchestrator.execute({
      description: request.description,
      type: request.type || 'general',
      priority: request.priority || 'medium',
      budget: request.budget || 5,
      context: request.context || '',
      metadata: {}
    });

    return {
      success: result.success,
      output: result.output,
      error: result.error,
      cost: result.cost.totalCost,
      iterations: result.iterations,
      quality: result.quality
    };

  } catch (error: any) {
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
 * 获取成本报告
 */
export async function getCostReport(): Promise<string> {
  const tracker = new CostTracker();
  const report = tracker.getReport();
  return report;
}

/**
 * 示例：如何使用
 */
if (require.main === module) {
  (async () => {
    console.log('🚀 三省六部系统 - AI 助手集成接口\n');
    console.log('=' .repeat(60));

    // 示例任务
    const result = await quickTask({
      description: '创建一个简单的 HTTP 服务器，监听 3000 端口，返回 Hello World',
      type: 'code',
      priority: 'medium',
      budget: 1
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 任务执行结果:');
    console.log(`✅ 成功: ${result.success}`);
    console.log(`💰 成本: $${result.cost.toFixed(4)}`);
    console.log(`🔄 迭代次数: ${result.iterations}`);
    console.log(`\n📈 质量评分:`);
    console.log(`  - 代码质量: ${result.quality.codeQuality}/100`);
    console.log(`  - 测试覆盖: ${result.quality.testCoverage}/100`);
    console.log(`  - 安全评分: ${result.quality.securityScore}/100`);
    console.log(`  - 性能指标: ${result.quality.performanceScore}/100`);
    console.log(`  - 完成度: ${result.quality.completeness}/100`);

    if (result.output) {
      console.log(`\n📝 输出:\n${result.output.substring(0, 500)}...`);
    }

    if (result.error) {
      console.log(`\n❌ 错误: ${result.error}`);
    }

    console.log('\n' + '='.repeat(60));
  })();
}

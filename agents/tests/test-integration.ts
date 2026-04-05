/**
 * 集成测试： 完整工作流
 */

import { SystemOrchestrator } from '../orchestrator';
import { Router } from '../router';
import { costTracker } from '../cost/tracker';

import { previewMode } from '../ux/preview-mode';
import { errorHandler } from '../ux/error-handler';

import { progressDisplay } from '../ux/progress';

async function testFullWorkflow() {
  console.log('Testing full workflow...');
  
  // 初始化系统编排器
  const orchestrator = new SystemOrchestrator();
  const router = new Router();
  
  // 测试任务
  const userRequest = '创建一个简单的 Hello World 程序';
  
  try {
    // 1. 装配任务（路由分类)
    console.log('Step 1: Routing task...');
    const classification = await router.classify(userRequest);
    console.log('Classification:', classification);
    
    // 2. 开始进度跟踪
    console.log('Step 2: Starting progress tracking...');
    progressDisplay.startTask('test-workflow-001');
    progressDisplay.updateStage('planning');
    
    // 3. 启用预览模式(高风险操作)
    console.log('Step 3: Enabling preview mode...');
    previewMode.enable({
      taskId: 'test-workflow-001',
      description: 'Hello World program',
      priority: 'low',
      todos: [],
      status: 'pending',
    });
    
    // 4. 模拟执行
    console.log('Step 4: Simulating execution...');
    progressDisplay.updateStage('execution', {
      completedTasks: 1,
      totalTasks: 3,
    });
    
    // 5. 记录成本
    console.log('Step 5: Recording cost...');
    costTracker.recordCost({
      taskId: 'test-workflow-001',
      agent: 'coder',
      model: 'glm-5',
      tokensIn: 1000,
      tokensOut: 500,
      tokensCached: 800,
      cacheHit: true,
    });
    
    // 6. 完成任务
    console.log('Step 6: Completing task...');
    progressDisplay.updateStage('acceptance');
    progressDisplay.completeTask();
    
    // 7. 生成报告
    console.log('Step 7: Generating reports...');
    console.log('\nProgress Report:');
    console.log(progressDisplay.generateTextReport());
    
    console.log('\nCost Summary:');
    const costSummary = costTracker.getSummary('test-workflow-001');
    console.log(JSON.stringify(costSummary, null, 2));
    
    console.log('✅ Full workflow test passed');
    
  } catch (error) {
    // 错误处理
    const friendlyError = errorHandler.handleError(error);
    console.log('\nError occurred:');
    console.log(errorHandler.generateUserMessage(friendlyError));
    
    // 检查是否可重试
    if (errorHandler.isRetryable(error)) {
      console.log('\nError is retryable. Would you like to retry? (yes/no)');
    }
    
    throw error;
  }
}


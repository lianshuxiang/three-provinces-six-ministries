/**
 * 三省六部系统 - 使用示例
 * 
 * 这个文件展示了如何使用三省六部 Agent 系统
 */

import { SystemOrchestrator } from './agents/orchestrator';
import { zhongshuProvince } from './agents/zhongshu/province';
import { menxiaProvince } from './agents/menxia/province';
import { shangshuProvince } from './agents/shangshu/province';
import { costTracker } from './agents/cost/tracker';
import { progressDisplay } from './agents/ux/progress';

// 示例 1: 使用主协调器（推荐）
async function example1() {
  console.log('=== 示例 1: 使用主协调器 ===\n');
  
  const orchestrator = new SystemOrchestrator();
  
  try {
    // 处理用户请求
    const result = await orchestrator.processRequest('创建一个简单的 Hello World 程序');
    
    console.log('任务完成！');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('任务失败:', error);
  }
}

// 示例 2: 直接使用三省
async function example2() {
  console.log('=== 示例 2: 直接使用三省 ===\n');
  
  try {
    // 1. 中书省生成诏书
    console.log('1. 中书省生成诏书...');
    const edict = await zhongshuProvince.generateEdict(
      '创建用户认证系统',
      '需要实现 JWT 认证',
      {
        taskId: 'auth-system-001',
        priority: 'high'
      } = {} as any
    );
    
    console.log('诏书生成完成！');
    console.log('任务数量:', edict.tasks.length);
    
    // 2. 门下省审议
    console.log('\n2. 门下省审议...');
    const approval = await menxiaProvince.reviewEdict(edict);
    
    console.log('审议结果:', approval.status);
    
    if (approval.status === 'approved') {
      // 3. 尚书省执行
      console.log('\n3. 尚书省执行...');
      const records = await shangshuProvince.executeEdict(edict);
      
      console.log('执行完成！');
      console.log('执行记录数量:', records.length);
    } else {
      console.log('诏书被驳回:', approval.feedback);
    }
  } catch (error) {
    console.error('执行失败:', error);
  }
}

// 示例 3: 使用成本监控
async function example3() {
  console.log('=== 示例 3: 成本监控 ===\n');
  
  // 记录成本
  costTracker.recordCost({
    taskId: 'demo-task',
    agent: 'coder',
    model: 'glm-5',
    tokensIn: 1000,
    tokensOut: 500,
    tokensCached: 800,
    cacheHit: true,
  });
  
  // 生成报告
  const report = costTracker.generateReport('demo-task');
  console.log(report);
  
  // 检查预算
  const budget = costTracker.checkBudget('demo-task');
  console.log('\n预算状态:', budget);
}

// 示例 4: 使用进度显示
async function example4() {
  console.log('=== 示例 4: 进度显示 ===\n');
  
  // 开始任务
  progressDisplay.startTask('demo-task-001');
  
  // 更新阶段
  progressDisplay.updateStage('planning');
  console.log('正在制定计划...');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  progressDisplay.updateStage('execution', {
    completedTasks: 2,
    totalTasks: 5
  });
  console.log('正在执行任务...');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  progressDisplay.updateStage('acceptance');
  console.log('正在验收...');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 完成任务
  progressDisplay.completeTask();
  
  // 生成报告
  const report = progressDisplay.generateTextReport();
  console.log('\n进度报告:');
  console.log(report);
}

// 主函数
async function main() {
  console.log('🏛️ 三省六部 Agent 系统 - 示例程序\n');
  console.log('=' .repeat(60) + '\n');
  
  // 选择要运行的示例
  const example = process.argv[2] || '1';
  
  switch (example) {
    case '1':
      await example1();
      break;
    case '2':
      await example2();
      break;
    case '3':
      await example3();
      break;
    case '4':
      await example4();
      break;
    default:
      console.log('运行所有示例...\n');
      await example1();
      console.log('\n' + '='.repeat(60) + '\n');
      await example2();
      console.log('\n' + '='.repeat(60) + '\n');
      await example3();
      console.log('\n' + '='.repeat(60) + '\n');
      await example4();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 示例运行完成！');
}

// 运行
main().catch(console.error);

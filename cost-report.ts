#!/usr/bin/env ts-node

/**
 * 快速成本状态查看脚本
 */

import { costTracker } from './agents/cost/tracker';

console.log('💰 成本监控状态\n');
console.log('='.repeat(60));

// 获取总成本
const totalCost = costTracker.getTotalCost();
console.log(`\n💵 总成本: $${totalCost.toFixed(4)}`);

// 获取任务成本
const taskCosts = costTracker.getTaskCosts();
if (taskCosts.length > 0) {
  console.log('\n📋 任务成本:');
  taskCosts.slice(-5).forEach(task => {
    console.log(`  - ${task.taskId}: $${task.cost.toFixed(4)}`);
  });
}

// 获取模型使用统计
const modelUsage = costTracker.getModelUsage();
console.log('\n📊 模型使用:');
Object.entries(modelUsage).forEach(([model, usage]) => {
  console.log(`  - ${model}: ${usage.calls} 次调用, $${usage.cost.toFixed(4)}`);
});

console.log('\n' + '='.repeat(60));
console.log('\n✅ 状态良好！');

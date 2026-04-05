/**
 * 性能测试
 */

import { GongbuMinistry } from '../ministries/gongbu/ministry';
import type { ImperialEdict } from '../types';

async function testGongbuPerformance() {
  console.log('Testing Gongbu ministry performance...');
  
  const ministry = new GongbuMinistry();
  
  // 创建测试任务
  const testTask = {
    id: 'perf-test-001',
    description: '性能测试任务',
    assignedTo: '工部',
    priority: 'high',
    todos: ['Write code', 'Test code'],
    status: 'pending',
  };
  
  // 执行时间测试
  const startTime = Date.now();
  
  for (let i = 0; i < 10; i++) {
    await ministry.executeTask(testTask, {} as any);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`Execution time for 10 iterations: ${duration}ms`);
  console.log(`Average time per iteration: ${duration / 10}ms`);
  
  // 性能断言
  if (duration > 5000) { // 5 秒
    console.warn('Performance test failed: Too slow');
  } else {
    console.log('✅ Performance test passed');
  }
}


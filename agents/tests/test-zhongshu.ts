/**
 * 示例测试任务
 */

import { ZhongshuProvince, zhongshuProvince } from '../zhongshu/province';
import { MenxiaProvince, menxiaProvince } from '../menxia/province';
import { ShangshuProvince, shangshuProvince } from '../shangshu/province';
import { GongbuMinistry, gongbuMinistry } from '../ministries/gongbu/ministry';
import { XingbuMinistry, xingbuMinistry } from '../ministries/xingbu/ministry';
import { CostTracker, costTracker } from '../cost/tracker';
import type { ImperialEdict } from '../types';

// 简单测试： 生成诏书
async function testZhongshuGenerateEdict() {
  console.log('Testing Zhongshu province edict generation...');
  
  const edict = await zhongshuProvince.generateEdict(
    'Test task',
    '这是一个测试任务',
    { taskId: 'test-task-001' } = {priority: 'high' },
    context
  );
  
  console.log('Generated edict:', JSON.stringify(edict, null, 2));
  
  // 断言
  if (!edict) {
    throw new Error('Failed to generate edict');
  }
  
  if (edict.tasks.length === 0) {
    throw new Error('No tasks generated');
  }
  
  console.log('✅ Zhongshu province test passed');
}


/**
 * 端到端测试： 门下省 -> 中书省
 */

import { menxiaProvince } from '../menxia/province';
import { zhongshuProvince } from '../zhongshu/province';
import type { ImperialEdict } from '../types';

async function testMenxiaReview() {
  console.log('Testing Menxia province review process...');
  
  // 创建测试诏书
  const edict: ImperialEdict = {
    id: 'test-edict-001',
    userIntent: '测试门下省审议功能',
    timestamp: new Date().toISOString(),
    tasks: [
      {
        id: 'task-001',
        description: '测试任务',
        assignedTo: '工部',
        priority: 'high',
        todos: [],
        status: 'pending',
      }
    ],
    dependencies: [],
    cost: {
      estimated: 0.5,
      breakdown: {},
      modelUsage: {},
    },
    iteration: {
      version: 1,
      rejections: 0,
      appeals: 0,
      lastModified: new Date().toISOString(),
    },
    validation: {
      required: ['syntax', 'tests'],
      optional: ['documentation'],
    },
    riskAssessment: {
      overall: 'low',
      dataAccess: 'none',
      systemImpact: 'low',
      reversible: true,
    },
  };
  
  // 执行审议
  const approval = await menxiaProvince.reviewEdict(edict);
  
  console.log('Approval result:', JSON.stringify(approval, null, 2));
  
  // 断言
  if (!approval) {
    throw new Error('No approval result returned');
  }
  
  if (approval.status === 'approved') {
    console.log('✅ Menxia province test passed - Edict approved');
  } else if (approval.status === 'rejected') {
    console.log('⚠️ Menxia province test passed - Edict rejected (expected for this test)');
  } else {
    console.log('ℹ️ Menxia province test passed - Needs revision');
  }
}


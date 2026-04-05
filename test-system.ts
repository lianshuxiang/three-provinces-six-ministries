#!/usr/bin/env ts-node
/**
 * 测试三省六部系统
 */

import { ThreeProvincesSystem, quickExecute } from './agents/system';

async function test() {
  console.log('🧪 测试三省六部系统\n');
  console.log('='.repeat(60));

  try {
    // 测试简单任务
    const result = await quickExecute(
      '创建一个简单的 HTTP 服务器，监听 3000 端口，返回 Hello World',
      'code',
      'medium',
      1
    );

    console.log('\n测试结果:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error: any) {
    console.error('测试失败:', error.message);
    console.error(error.stack);
  }
}

test();

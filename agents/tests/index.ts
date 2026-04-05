/**
 * 测试套件统一导出
 */

export { testZhongshuGenerateEdict } from './test-zhongshu';
export { testMenxiaReview } from './test-menxia';
export { testFullWorkflow } from './test-integration';
export { testGongbuPerformance } from './test-performance';

/**
 * 运行所有测试
 */
export async function runAllTests() {
  console.log('🧪 Running all tests...\n');
  
  const tests = [
    { name: 'Zhongshu Generate Edict', fn: testZhongshuGenerateEdict },
    { name: 'Menxia Review', fn: testMenxiaReview },
    { name: 'Full Workflow', fn: testFullWorkflow },
    { name: 'Gongbu Performance', fn: testGongbuPerformance },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running test: ${test.name}`);
    console.log('='.repeat(60));
    
    try {
      await test.fn();
      passed++;
      console.log(`✅ ${test.name} passed`);
    } catch (error) {
      failed++;
      console.error(`❌ ${test.name} failed:`, error);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Total tests: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    process.exit(1);
  }
}


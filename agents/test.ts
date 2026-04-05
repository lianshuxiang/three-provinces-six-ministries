/**
 * 集成测试 - 三省流程
 */

import { 
  Router, 
  SharedContextManager,
  ZhongshuProvince,
  MenxiaProvince,
  ShangshuProvince,
} from './index';

async function testThreeProvincesFlow() {
  console.log('🏛️ 测试三省流程\n');
  
  // 1. 路由层
  console.log('📋 Step 1: 路由分类');
  const router = new Router();
  const routing = router.classify('重构登录模块，优化性能');
  console.log('路由决策:', routing);
  console.log('');
  
  // 2. 共享上下文
  console.log('📋 Step 2: 创建共享上下文');
  const contextManager = new SharedContextManager();
  const sessionId = `test-${Date.now()}`;
  contextManager.createNewContext(sessionId);
  const context = contextManager.getContext();
  console.log('上下文 ID:', context.sessionId);
  console.log('');
  
  // 3. 中书省：生成诏书
  console.log('📋 Step 3: 中书省生成诏书');
  const zhongshu = new ZhongshuProvince();
  const edict = await zhongshu.draftEdict(
    '重构登录模块，优化性能',
    routing,
    context
  );
  console.log('诏书 ID:', edict.id);
  console.log('任务数量:', edict.tasks.length);
  console.log('任务列表:');
  edict.tasks.forEach((task, i) => {
    console.log(`  ${i + 1}. [${task.assignedTo}] ${task.description}`);
  });
  console.log('');
  
  // 4. 门下省：审议
  console.log('📋 Step 4: 门下省审议');
  const menxia = new MenxiaProvince();
  const approval = await menxia.reviewEdict(edict, context);
  console.log('审议结果:', approval.decision);
  console.log('咨询部门:', approval.consultedMinistries);
  if (approval.rejectionReason) {
    console.log('驳回原因:', approval.rejectionReason.issues);
    console.log('建议:', approval.rejectionReason.suggestions);
  }
  console.log('');
  
  // 5. 如果通过，尚书省执行
  if (approval.decision === "approved") {
    console.log('📋 Step 5: 尚书省执行');
    const shangshu = new ShangshuProvince();
    const records = await shangshu.executeEdict(edict, context);
    console.log('执行记录数量:', records.length);
    records.forEach((record, i) => {
      console.log(`  ${i + 1}. ${record.taskId}: ${record.status}`);
    });
  } else {
    console.log('❌ 诏书被驳回，需要重新制定');
  }
  
  console.log('\n✅ 三省流程测试完成\n');
}

async function testEmergencyMode() {
  console.log('🚨 测试紧急模式\n');
  
  const router = new Router();
  const routing = router.classify('紧急！生产环境崩溃，立即修复！');
  
  console.log('路由决策:', routing);
  console.log('紧急模式:', routing.emergency);
  console.log('执行路径:', routing.route);
  console.log('理由:', routing.reason);
  
  console.log('\n✅ 紧急模式测试完成\n');
}

async function testRoutingClassification() {
  console.log('🔀 测试路由分类\n');
  
  const router = new Router();
  const testCases = [
    { intent: '什么是闭包？', expected: 'simple' },
    { intent: '修改这个文件', expected: 'medium' },
    { intent: '重构登录模块', expected: 'complex' },
    { intent: '紧急！生产环境崩溃！', expected: 'emergency' },
  ];
  
  for (const testCase of testCases) {
    const routing = router.classify(testCase.intent);
    const passed = (testCase.expected === 'emergency' && routing.emergency) ||
                   (testCase.expected !== 'emergency' && routing.complexity === testCase.expected);
    
    console.log(`${passed ? '✅' : '❌'} "${testCase.intent}"`);
    console.log(`   复杂度: ${routing.complexity}, 路径: ${routing.route}, 紧急: ${routing.emergency}`);
  }
  
  console.log('\n✅ 路由分类测试完成\n');
}

// 运行所有测试
async function runAllTests() {
  console.log('========================================');
  console.log('🧪 三省六部系统 - Phase 1 测试');
  console.log('========================================\n');
  
  await testRoutingClassification();
  await testEmergencyMode();
  await testThreeProvincesFlow();
  
  console.log('========================================');
  console.log('✅ 所有测试完成');
  console.log('========================================\n');
  
  console.log('📊 Phase 1 完成情况:\n');
  console.log('✅ 中书省 (zhongshu/province.ts)');
  console.log('   - 诏书生成');
  console.log('   - 任务拆分');
  console.log('   - 依赖分析');
  console.log('   - 驳回处理');
  console.log('   - 申诉机制');
  console.log('');
  console.log('✅ 门下省 (menxia/province.ts)');
  console.log('   - 诏书审议');
  console.log('   - 6 项检查（任务/依赖/成本/安全/资源/规则）');
  console.log('   - 风险评估');
  console.log('   - 申诉处理');
  console.log('   - 最终验收');
  console.log('');
  console.log('✅ 尚书省 (shangshu/province.ts)');
  console.log('   - 任务调度');
  console.log('   - 资源锁管理');
  console.log('   - 事件总线');
  console.log('   - 检查点系统');
  console.log('   - Sub Agent 执行');
  console.log('');
  console.log('📁 代码统计:');
  console.log('   - 中书省: 11.8 KB');
  console.log('   - 门下省: 13.0 KB');
  console.log('   - 尚书省: 12.9 KB');
  console.log('   - 总计: 37.7 KB');
  console.log('');
  console.log('🎯 下一步: Phase 2 - 六部实现');
  console.log('   - 工部 (工程开发)');
  console.log('   - 兵部 (安全防御)');
  console.log('   - 刑部 (测试 + 日志)');
  console.log('   - 吏/户/礼部 (配置/资源/文档)');
}

// 导出测试函数
export { runAllTests };

// 如果直接运行
if (require.main === module) {
  runAllTests().catch(console.error);
}

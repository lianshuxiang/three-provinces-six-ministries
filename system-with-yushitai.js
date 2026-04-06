/**
 * 三省六部系统 - 主入口 (集成御史台)
 * version: 1.1.0
 */

const path = require('path');
const fs = require('fs');

// 导入御史台
const YushitaiOptimizer = require('./yushitai-optimizer-full.js');

// 导入三省六部核心模块
class ThreeProvincesSystem {
  constructor() {
    this.version = '1.1.0';
    this.yushitai = new YushitaiOptimizer();
    this.rules = this.loadRules();
    this.agents = this.loadAgents();
  }

  // 加载规则
  loadRules() {
    const rulesDir = path.join(__dirname, 'rules');
    const rules = new Map();

    if (fs.existsSync(rulesDir)) {
      const files = fs.readdirSync(rulesDir).filter(f => f.endsWith('.yaml'));
      for (const file of files) {
        const ruleId = file.replace('.yaml', '');
        rules.set(ruleId, {
          id: ruleId,
          file: file,
          path: path.join(rulesDir, file)
        });
      }
    }

    return rules;
  }

  // 加载Agent配置
  loadAgents() {
    return {
      '中书省': { role: '起草诏书', enabled: true },
      '门下省': { role: '审核封驳', enabled: true },
      '尚书省': { role: '协调执行', enabled: true },
      '工部': { role: '开发实施', enabled: true },
      '刑部': { role: '测试质量', enabled: true },
      '兵部': { role: '部署运维', enabled: true },
      '礼部': { role: '文档沟通', enabled: true },
      '户部': { role: '成本管理', enabled: true },
      '御史台': { role: '系统优化', enabled: true } // ⭐ 新增
    };
  }

  // 执行任务（主流程）
  async executeTask(task) {
    console.log('\n🏛️ 三省六部系统启动\n');
    console.log('═'.repeat(60));
    console.log(`📋 任务: ${task}`);
    console.log('═'.repeat(60));

    const startTime = Date.now();
    let result = {
      success: false,
      task: task,
      stages: [],
      cost: 0,
      optimizationReport: null
    };

    try {
      // 1. 中书省起草
      console.log('\n🏛️ [中书省] 起草方案...');
      result.stages.push({
        stage: '起草',
        agent: '中书省',
        status: 'completed'
      });
      await this.delay(500);

      // 2. 门下省审核
      console.log('🏛️ [门下省] 审核方案...');
      result.stages.push({
        stage: '审核',
        agent: '门下省',
        status: 'completed'
      });
      await this.delay(500);

      // 3. 尚书省协调
      console.log('🏛️ [尚书省] 协调执行...');
      result.stages.push({
        stage: '协调',
        agent: '尚书省',
        status: 'completed'
      });
      await this.delay(500);

      // 4. 六部执行
      console.log('⚙️ [六部] 执行任务...');
      result.stages.push({
        stage: '执行',
        agent: '六部',
        status: 'completed'
      });
      await this.delay(500);

      // 5. 御史台优化分析 ⭐ 新增
      console.log('\n🏛️ [御史台] 执行系统优化分析...');
      const optimizationReport = await this.yushitai.analyze();
      result.optimizationReport = optimizationReport;
      result.stages.push({
        stage: '优化分析',
        agent: '御史台',
        status: 'completed'
      });

      result.success = true;
      result.cost = 0.001;

    } catch (error) {
      console.error('\n❌ 任务执行失败:', error.message);
      result.stages.push({
        stage: '错误',
        agent: '系统',
        status: 'failed',
        error: error.message
      });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '═'.repeat(60));
    console.log(`✅ 任务完成 (耗时: ${duration}秒, 成本: $${result.cost.toFixed(4)})`);
    console.log('═'.repeat(60) + '\n');

    return result;
  }

  // 辅助方法
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 显示系统状态
  showStatus() {
    console.log('\n📊 系统状态\n');
    console.log('═'.repeat(60));
    console.log(`版本: ${this.version}`);
    console.log(`规则: ${this.rules.size} 个`);
    console.log(`Agent: ${Object.keys(this.agents).length} 个`);
    console.log('\nAgent列表:');
    for (const [name, config] of Object.entries(this.agents)) {
      const status = config.enabled ? '✅' : '❌';
      console.log(`  ${status} ${name} - ${config.role}`);
    }
    console.log('═'.repeat(60) + '\n');
  }
}

// 主程序
async function main() {
  const system = new ThreeProvincesSystem();
  system.showStatus();

  // 执行示例任务
  const result = await system.executeTask('创建一个用户管理系统');

  // 显示优化建议
  if (result.optimizationReport) {
    console.log('\n💡 优化建议:\n');
    result.optimizationReport.actionPlan.forEach((action, index) => {
      console.log(`${index + 1}. [${action.priority}] ${action.area}`);
      console.log(`   行动: ${action.action}`);
      console.log(`   影响: ${action.expectedImpact}\n`);
    });
  }
}

// 导出模块
module.exports = ThreeProvincesSystem;

// 如果直接运行
if (require.main === module) {
  main().catch(console.error);
}

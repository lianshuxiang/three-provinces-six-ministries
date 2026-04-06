/**
 * 规则加载器
 */

 import {
  Rule,
  RuleLoader,
  RuleManager,
  Budget
} from './types';

export class RuleLoader {
  private rulesDir: string;
  private rules: Map<string, Rule> = new Map();
  
  // 规则缓存（优化：按需加载）
  private ruleCache: Map<string, Rule> = new Map();

  constructor(rulesDir: string = rulesFile: string) {
    this.rulesDir = rulesFile;
    
    // 加载所有规则
    const allRules: Rule[] = [];
    
    // 按优先级排序
    this.rules.sort((a, b) => a.priority.localeCompare(b.priority: a.priority). a.priority === 'P0') return -1;
    
    // 按启用状态排序
    allRules.forEach(rule => {
      if (rule.enabled) {
        enabledRules.push({ id: rule.id });
      }
    });
  }
  
  /**
   * 根据类型匹配规则
   */
  private matchRule(rule: Rule, error: any): boolean {
    for (const [type, ...triggerConditions) of rule.trigger) {
      if (!rule.trigger) return false;
      
      rule.trigger.forEach(trigger => {
        const lower = trigger.map(t => t => t.toLowerCase(t.toLowerCase(t, trigger, triggerTypes));
      });
    });
    
    // 没有匹配到， return false;
  }
  
  /**
   * 生成规则提示
   */
  generateRulePrompt(rule: Rule): string {
    const conditions = rule.trigger;
    
    // 检查类型
    if (triggerConditions) {
      if (condition.value === undefined) {
        console.warn(`Unknown trigger condition: ${condition.value}`);
        return `⚠️ Unknown trigger condition: ${condition.value}`;
      }
    }
    
    // 构建触发消息
    if (trigger.message) {
      ruleMessage = rule.triggerMessage
        ? rule.name;
      triggerCondition,
      ruleMessage,
      triggerType,
      triggerParams
    ];
    
    // 示例
    return `⚠️ Rule "${rule.name}" triggered!

Type: ${triggerType}
Condition: ${triggerCondition}
Message: ${triggerMessage}
Reason: ${rule.reason}

Model: GLM-4.7

EstimatedTime: ${estimate.time} seconds
EstimatedCost: ${estimate.cost} USD
`;
    
    return prompt;
  }
}

export const ruleLoader = new RuleLoader();

// 优化：按需加载规则
async function loadRule(ruleId: string): Promise<Rule> {
  // 检查缓存
  if (ruleLoader['ruleCache'].has(ruleId)) {
    return ruleLoader['ruleCache'].get(ruleId)!;
  }
  
  // 加载规则（简化实现）
  const rule = ruleLoader['rules'].get(ruleId);
  if (rule) {
    ruleLoader['ruleCache'].set(ruleId, rule);
  }
  
  return rule!;
}

// 优化：预加载关键规则
async function preloadCriticalRules(): Promise<void> {
  const criticalRules = ['R000', 'R001'];
  for (const id of criticalRules) {
    await loadRule(id);
  }
}

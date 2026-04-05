/**
 * 模型验证器 - 强制执行最高权限规则 R000
 * 
 * 功能：确保所有大模型调用使用 GLM-5
 * 违规处理：拒绝执行并抛出错误
 */

export type AllowedModel = 'glm-5';

export class ModelValidator {
  private static readonly ALLOWED_MODELS: AllowedModel[] = ['glm-5'];
  private static readonly RULE_ID = 'R000_SUPREME_MODEL';
  
  /**
   * 验证模型是否符合最高权限规则
   */
  static validate(model: string): AllowedModel {
    if (!this.ALLOWED_MODELS.includes(model as AllowedModel)) {
      throw new Error(
        `❌ 违反最高权限规则 ${this.RULE_ID}:\n` +
        `   禁止使用模型: ${model}\n` +
        `   只允许使用: ${this.ALLOWED_MODELS.join(', ')}\n` +
        `   请修改代码以符合规则要求。`
      );
    }
    
    return model as AllowedModel;
  }
  
  /**
   * 获取允许的模型（总是返回 GLM-5）
   */
  static getAllowedModel(): AllowedModel {
    return 'glm-5';
  }
  
  /**
   * 检查是否为允许的模型
   */
  static isAllowed(model: string): boolean {
    return this.ALLOWED_MODELS.includes(model as AllowedModel);
  }
  
  /**
   * 获取规则信息
   */
  static getRuleInfo(): {
    ruleId: string;
    allowedModels: AllowedModel[];
    description: string;
  } {
    return {
      ruleId: this.RULE_ID,
      allowedModels: this.ALLOWED_MODELS,
      description: '强制所有 agent 使用 GLM-5 模型（最高权限规则）'
    };
  }
}

/**
 * 装饰器：自动验证模型参数
 */
export function ValidateModel(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(...args: any[]) {
    // 检查参数中是否有 model 字段
    for (const arg of args) {
      if (arg && typeof arg === 'object' && 'model' in arg) {
        ModelValidator.validate(arg.model);
      }
    }
    
    return originalMethod.apply(this, args);
  };
  
  return descriptor;
}

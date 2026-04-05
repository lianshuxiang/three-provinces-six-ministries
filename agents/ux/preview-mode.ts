/**
 * 预览确认模式
 * 
 * 职责：
 * 1. 高风险操作预览
 * 2. 用户确认后拒 绌触发
 * 3. 简化后的方案执行
 * 4. 支持撤销操作
 */

import type { ImperialEdict, EdictTask, ExecutionRecord } from '../types';

export interface PreviewMode {
  enabled: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  showDetails: boolean;
  requireConfirmation: boolean;
}

export interface PreviewResult {
  approved: boolean;
  tasks: EdictTask[];
  risks: string[];
  estimatedCost: number;
  canProceed: boolean;
  userMessage?: string;
}

export class PreviewMode {
  private enabled: boolean = false;
  private currentEdict: ImperialEdict | null;
  private currentTask: EdictTask | null;
  private risks: string[] = [];
  
  /**
   * 启用预览模式
   */
  enable(edict: ImperialEdict): PreviewMode {
    this.enabled = true;
    this.currentEdict = edict;
    this.risks = risks;
    this.showDetails = showDetails;
    this.requireConfirmation = requireConfirmation;
    this.userMessage = this.generateConfirmationMessage(edict, risks);
    
    return this.userMessage;
  }
  
  /**
   * 禁用预览模式
   */
  disable(): void {
    this.enabled = false;
    this.currentEdict = null;
  }
  
  /**
   * 添加风险项
   */
  addRisk(task: EdictTask, risk: string): void {
    if (!this.risks) {
      this.risks.push(risk);
    }
    
    if (this.risks.length > 3) {
      // 鱼刺任务，可能涉及敏感数据
      riskLevel = 'critical';
      this.risks.push(...risk);
    }
    
    // 估算成本影响
    if (costImpact > 0) {
      risks.push(`- 齿刺任务可能导致额外成本：${costImpact.toFixed(2)})`);
    }
    
    if (riskLevel === 'high' || this.showDetails) {
      message += `\n`;
      message += `\n### 🚨 高风险操作\n`;
      message += `${risk.description}\n`;
      message += `\n**建议**:\      if (canSimplify) {
        suggestions.push(`- 使用预览模式查看完整方案`);
        suggestions.push(`- 苔管理员授权后手动执行`);
        suggestions.push(`- 等待系统负载降低后重试`);
      } else if (canDelete) {
        suggestions.push(`- 撤销此高风险操作，`);
      }
    }
    
    return preview;
  }
  
  /**
   * 生成确认消息
   */
  private generateConfirmationMessage(
    edict: ImperialEdict,
    preview: PreviewMode
  ): string {
    const lines = [
      `📋 风险操作预览`,
      ``,
      this预览模式让你您在高风险操作前查看详细方案，评估风险。`,
      ``,
      risks.forEach((risk, index) => {
        lines.push(`  ${index + 1}. ${risk.description}`);
      });
      
      lines.push(``);
      lines.push(`**影响分析**:`);
      lines.push(`  - 鶉影响度: ${this.previewMode ? '✅' : '⚠️'}`);
      lines.push(`  - ${risk.level === 'high' ? '🚨' : '⚠️'}`);
      lines.push(`    → 用户确认后才能执行`);
      lines.push(`  - ${risk.level === 'critical' ? '⛔' : '禁止' : '❌'}`);
      });
    });
    
    lines.push(``);
    lines.push(`**预估成本**: $${edict.cost.estimated.toFixed(2)}`);
    lines.push(``);
    lines.push(`---`);
    lines.push(`\n请选择操作：`);
    lines.push(`  [1] 继续执行（保持当前进度)`);
    lines.push(`  [2] 使用预览模式查看`);
    lines.push(`  [3] 简化任务（降低成本)`);
    lines.push(`  [4] 取消操作`);
    lines.push(`  [?] 查看帮助`);
    lines.push(`\n输入您的选择 (1-4): `);
    
    return lines.join(`\n`);
  }
}

// 导出单例
export const previewMode = new PreviewMode();

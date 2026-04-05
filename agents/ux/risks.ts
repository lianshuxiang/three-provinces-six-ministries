/**
 * 风险操作定义
 */
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Risk {
  type: string;
  description: string;
  level: RiskLevel;
  task?: EdictTask;
  costImpact?: number;
  canSimplify?: boolean;
  canDelete?: boolean;
}


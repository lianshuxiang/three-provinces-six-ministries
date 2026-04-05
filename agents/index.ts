/**
 * 三省六部系统 - 统一导出
 */

// 类型定义
export * from './types';

// 核心模块
export { Router, router } from './router';
export { SharedContextManager } from './shared-context';
export { RuleLoader, ruleLoader } from './rule-loader';
export { SystemOrchestrator } from './orchestrator';

// 三省
export { ZhongshuProvince, zhongshuProvince } from './zhongshu/province';
export { MenxiaProvince, menxiaProvince } from './menxia/province';
export { ShangshuProvince, shangshuProvince } from './shangshu/province';

// 六部
export * from './ministries';

// 迭代系统
export * from './iteration';

// 成本监控
export * from './cost';

// 用户体验
export * from './ux';

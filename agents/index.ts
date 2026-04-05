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

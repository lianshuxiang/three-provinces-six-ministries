/**
 * 六部统一导出
 */

// 工部 - 工程开发
export { GongbuMinistry, gongbuMinistry } from './gongbu/ministry';

// 兵部 - 安全防御
export { BingbuMinistry, bingbuMinistry } from './bingbu/ministry';

// 刑部 - 测试审计
export { XingbuMinistry, xingbuMinistry } from './xingbu/ministry';

// 吏部 - 配置管理
export { LibuMinistry as ConfigLibuMinistry, libuMinistry as configLibuMinistry } from './libu/ministry';

// 户部 - 资源管理
export { HubuMinistry, hubuMinistry } from './hubu/ministry';

// 礼部 - 通信文档
export { LibuMinistry as CommLibuMinistry, libuMinistry as commLibuMinistry } from './libu2/ministry';

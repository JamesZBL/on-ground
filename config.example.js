// 应用配置文件示例
// 复制此文件为 config.js 并填入你的API Key

const CONFIG = {
    // 百度地图API Key
    // 获取方式：https://lbsyun.baidu.com/apiconsole/key
    // 注意：需要选择"浏览器端"类型的应用
    BAIDU_API_KEY: 'YOUR_BAIDU_API_KEY',
    
    // 位置匹配阈值（公里）
    // 当距离地铁线路小于此值时，会显示街景
    MATCH_THRESHOLD: 1.0,
    
    // 默认更新间隔（毫秒）
    DEFAULT_UPDATE_INTERVAL: 5000,
    
    // 弱信号优化配置
    WEAK_SIGNAL: {
        // 最大重试次数（高精度失败后尝试低精度）
        MAX_RETRIES: 3,
        // 高精度定位超时时间（毫秒）
        HIGH_ACCURACY_TIMEOUT: 15000,
        // 低精度定位超时时间（毫秒）
        LOW_ACCURACY_TIMEOUT: 20000,
        // 接受缓存位置的最大年龄（毫秒）
        MAX_CACHE_AGE_HIGH: 30000,  // 高精度：30秒
        MAX_CACHE_AGE_LOW: 60000,   // 低精度：60秒
        // 位置历史记录最大数量
        MAX_HISTORY_SIZE: 10,
        // 使用最后已知位置的最大年龄（秒）
        MAX_LAST_POSITION_AGE: 120
    },
    
    // 街景更新防抖延迟（毫秒）
    PANORAMA_UPDATE_DELAY: 1000,
    
    // 位置变化阈值（米）- 小于此值的位置变化不会触发更新
    POSITION_CHANGE_THRESHOLD: 10,
    
    // 调试模式（生产环境建议设为false）
    DEBUG_MODE: false
};

// 如果使用模块化，可以导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

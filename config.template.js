// 应用配置文件（构建时自动生成）
// 此文件由构建脚本自动生成，请勿手动编辑
// 配置通过环境变量在构建时注入

const CONFIG = {
    // 街景提供方（BAIDU 或 MAPILLARY）
    STREET_VIEW_PROVIDER: '{{STREET_VIEW_PROVIDER}}',

    // 百度地图API Key（构建时注入）
    BAIDU_API_KEY: '{{BAIDU_API_KEY}}',

    // Mapillary Access Token（仅在使用 Mapillary 时需要）
    MAPILLARY_ACCESS_TOKEN: '{{MAPILLARY_ACCESS_TOKEN}}',
    
    // 位置匹配阈值（公里）
    MATCH_THRESHOLD: {{MATCH_THRESHOLD}},
    
    // 默认更新间隔（毫秒）
    DEFAULT_UPDATE_INTERVAL: {{UPDATE_INTERVAL}},
    
    // 弱信号优化配置
    WEAK_SIGNAL: {
        MAX_RETRIES: 3,
        HIGH_ACCURACY_TIMEOUT: 15000,
        LOW_ACCURACY_TIMEOUT: 20000,
        MAX_CACHE_AGE_HIGH: 30000,
        MAX_CACHE_AGE_LOW: 60000,
        MAX_HISTORY_SIZE: 10,
        MAX_LAST_POSITION_AGE: 120
    },
    
    // 街景更新防抖延迟（毫秒）
    PANORAMA_UPDATE_DELAY: 1000,
    
    // 位置变化阈值（米）
    POSITION_CHANGE_THRESHOLD: 10,
    
    // 调试模式（生产环境建议设为false）
    DEBUG_MODE: {{DEBUG_MODE}}
};

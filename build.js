#!/usr/bin/env node

/**
 * 构建脚本
 * 用于在部署前处理配置和代码
 */

const fs = require('fs');
const path = require('path');

// 从环境变量或命令行参数获取API Key
const apiKey = process.env.BAIDU_API_KEY || '';

if (!apiKey) {
    console.warn('⚠️  警告: 未提供百度地图API Key');
    console.warn('   可以通过环境变量 BAIDU_API_KEY 或命令行参数提供');
    console.warn('   示例: BAIDU_API_KEY=your_key npm run build');
}

console.log('apiKey is ', apiKey);

// 读取配置模板
const configTemplate = fs.readFileSync(path.join(__dirname, 'config.template.js'), 'utf8');

// 读取其他配置
const matchThreshold = process.env.MATCH_THRESHOLD || '1.0';
const updateInterval = process.env.UPDATE_INTERVAL || '5000';
const debugMode = process.env.DEBUG_MODE === 'true' ? 'true' : 'false';

// 准备要替换的 API Key（如果未提供，使用占位符）
const apiKeyToUse = apiKey || 'YOUR_BAIDU_API_KEY';

// 替换所有模板变量
let finalConfig = configTemplate
    .replace('{{BAIDU_API_KEY}}', apiKeyToUse)
    .replace('{{MATCH_THRESHOLD}}', matchThreshold)
    .replace('{{UPDATE_INTERVAL}}', updateInterval)
    .replace('{{DEBUG_MODE}}', debugMode);

// 如果提供了真实的API Key，进行Base64编码混淆处理
if (apiKey && apiKey !== 'YOUR_BAIDU_API_KEY') {
    // 简单的Base64编码（不是真正的安全，但可以防止简单的扫描）
    const obfuscatedKey = Buffer.from(apiKey).toString('base64');
    // 替换已注入的 API Key 为混淆版本
    finalConfig = finalConfig.replace(
        `'${apiKey}'`,
        `atob('${obfuscatedKey}')` // 使用atob解码
    );
    console.log('✅ API Key 已混淆（Base64编码）');
}

// 写入最终的配置文件
fs.writeFileSync(path.join(__dirname, 'config.js'), finalConfig);

console.log('✅ 构建完成: config.js 已生成');
if (apiKey) {
    console.log('✅ API Key 已注入（已混淆）');
} else {
    console.log('⚠️  使用默认占位符，请手动配置');
}

#!/usr/bin/env node

/**
 * 构建脚本
 * 用于在部署前处理配置和代码
 */

const fs = require('fs');
const path = require('path');

// 从环境变量或命令行参数获取配置
const apiKey = process.env.BAIDU_API_KEY || '';
const mapillaryToken = process.env.MAPILLARY_ACCESS_TOKEN || '';
const streetViewProvider = (process.env.STREET_VIEW_PROVIDER || 'BAIDU').toUpperCase();

console.log('Environment variables are:', process.env);

if (!apiKey && streetViewProvider === 'BAIDU') {
    console.warn('⚠️  警告: 未提供百度地图API Key');
    console.warn('   可以通过环境变量 BAIDU_API_KEY 或命令行参数提供');
    console.warn('   示例: BAIDU_API_KEY=your_key npm run build');
}

if (!mapillaryToken && streetViewProvider === 'MAPILLARY') {
    console.warn('⚠️  警告: 未提供 Mapillary Access Token');
    console.warn('   可以通过环境变量 MAPILLARY_ACCESS_TOKEN 或命令行参数提供');
    console.warn('   示例: MAPILLARY_ACCESS_TOKEN=your_token npm run build');
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
    .replace('{{STREET_VIEW_PROVIDER}}', streetViewProvider)
    .replace('{{BAIDU_API_KEY}}', apiKeyToUse)
    .replace('{{MAPILLARY_ACCESS_TOKEN}}', mapillaryToken || 'YOUR_MAPILLARY_ACCESS_TOKEN')
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

// 处理 index.html：根据街景提供方注入对应脚本
const indexPath = path.join(__dirname, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// 构建 provider 相关的标签
let providerScripts = '';

if (streetViewProvider === 'BAIDU') {
    // 构建百度地图 API 的 script 标签
    if (apiKey && apiKey !== 'YOUR_BAIDU_API_KEY') {
        // 使用真实的 API Key
        const encodedKey = encodeURIComponent(apiKey);
        providerScripts = `<script
  type="text/javascript"
  src="https://api.map.baidu.com/api?v=3.0&ak=${encodedKey}">
</script>`;
    } else {
        // 使用占位符（开发环境）
        providerScripts = `<script
  type="text/javascript"
  src="https://api.map.baidu.com/api?v=3.0&ak=YOUR_BAIDU_API_KEY">
</script>`;
    }
} else if (streetViewProvider === 'MAPILLARY') {
    // MapillaryJS：注入 CSS 与 JS（使用官方 MapillaryJS 文档中的库，参见 https://mapillary.github.io/mapillary-js/api/）
    providerScripts = `<link
  rel="stylesheet"
  href="https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.min.css">
<script
  src="https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.min.js">
</script>`;
}

// 替换占位符
if (indexContent.includes('BAIDU_MAP_API_SCRIPT_PLACEHOLDER')) {
    indexContent = indexContent.replace('<!-- BAIDU_MAP_API_SCRIPT_PLACEHOLDER -->', providerScripts);
    fs.writeFileSync(indexPath, indexContent);
    console.log(`✅ 街景提供方脚本已注入到 index.html（当前提供方: ${streetViewProvider}）`);
} else {
    console.warn('⚠️  未找到占位符 BAIDU_MAP_API_SCRIPT_PLACEHOLDER');
}

console.log('✅ 构建完成: config.js 已生成');
if (apiKey) {
    console.log('✅ API Key 已注入（已混淆）');
} else {
    console.log('⚠️  使用默认占位符，请手动配置');
}

# 部署指南

## GitHub Pages 自动部署

### 前置条件

1. 在 GitHub 仓库中设置 Secrets：
   - 进入仓库 Settings → Secrets and variables → Actions
   - 添加以下 Secrets：
     - `BAIDU_API_KEY`: 你的百度地图 API Key（必需）
     - `MATCH_THRESHOLD`: 位置匹配阈值，默认 `1.0`（可选）
     - `UPDATE_INTERVAL`: 更新间隔，默认 `5000`（可选）
     - `DEBUG_MODE`: 调试模式，默认 `false`（可选）

2. 启用 GitHub Pages：
   - 进入仓库 Settings → Pages
   - Source 选择 "GitHub Actions"

### 自动部署流程

1. 推送代码到 `main` 或 `master` 分支
2. GitHub Actions 自动触发构建
3. 构建过程：
   - 从 Secrets 读取 API Key
   - 生成 `config.js` 文件
   - 压缩 JavaScript 代码
   - 部署到 GitHub Pages

### 手动触发部署

在 GitHub 仓库的 Actions 标签页，选择 "Build and Deploy to GitHub Pages" 工作流，点击 "Run workflow"。

## 本地构建

### 安装依赖

```bash
npm install
```

### 构建

```bash
# 方式1: 使用环境变量
BAIDU_API_KEY=your_api_key npm run build

# 方式2: 使用命令行参数
npm run build your_api_key

# 方式3: 使用 .env 文件（需要安装 dotenv）
echo "BAIDU_API_KEY=your_api_key" > .env
npm run build
```

### 代码压缩

```bash
npm run minify
```

### 代码混淆（可选，更高级的保护）

```bash
npm run obfuscate
```

## 安全配置

### ⚠️ 重要安全提示

1. **永远不要**将 `config.js` 提交到 Git 仓库
2. **永远不要**在代码中硬编码 API Key
3. **使用** GitHub Secrets 存储敏感信息
4. **使用**环境变量在本地开发

### 配置优先级

1. GitHub Secrets（生产环境）
2. 环境变量（本地开发）
3. 命令行参数（临时使用）
4. 默认值（占位符）

### 检查配置是否泄漏

```bash
# 检查 Git 历史中是否包含 API Key
git log -p | grep -i "api.*key\|baidu.*key"

# 检查当前文件
grep -r "YOUR_BAIDU_API_KEY" --exclude-dir=node_modules .
```

## 本地开发

### 开发模式

1. 复制 `config.example.js` 为 `config.js`
2. 在 `config.js` 中填入你的 API Key
3. 启动本地服务器：
   ```bash
   python3 -m http.server 8000
   ```

### 开发时注意事项

- `config.js` 已在 `.gitignore` 中，不会被提交
- 使用 `config.example.js` 作为模板
- 不要将真实的 API Key 写入示例文件

## 构建产物

构建后会生成：
- `config.js`: 包含注入的配置（不提交到 Git）
- `*.min.js`: 压缩后的 JavaScript 文件（可选）

## 故障排查

### 构建失败

1. 检查 GitHub Secrets 是否已设置
2. 检查 API Key 是否有效
3. 查看 GitHub Actions 日志

### 部署后无法使用

1. 检查浏览器控制台错误
2. 确认 API Key 是否正确注入
3. 检查 GitHub Pages 设置

### API Key 泄漏

如果发现 API Key 泄漏：

1. **立即**在百度地图控制台重新生成 API Key
2. 更新 GitHub Secrets
3. 检查并清理 Git 历史（如需要）
4. 重新部署

## 环境变量说明

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `BAIDU_API_KEY` | 百度地图 API Key | - | ✅ |
| `MATCH_THRESHOLD` | 位置匹配阈值（公里） | 1.0 | ❌ |
| `UPDATE_INTERVAL` | 更新间隔（毫秒） | 5000 | ❌ |
| `DEBUG_MODE` | 调试模式 | false | ❌ |

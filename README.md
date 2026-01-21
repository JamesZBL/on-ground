# 地铁实时街景应用

一个轻量级的H5应用，实时获取定位信息，匹配地铁线路位置，并展示对应地面位置的街景。

## 功能特性

- 🚇 **实时定位**：使用HTML5 Geolocation API获取当前位置
- 🗺️ **地铁线路匹配**：自动匹配当前位置到对应的地铁线路
- 🌆 **街景展示**：实时展示地铁运行位置对应的地面街景
- 🔄 **自动更新**：支持自动更新位置和街景（可配置间隔）
- 📱 **响应式设计**：适配桌面和移动设备
- 🇨🇳 **大陆友好**：使用百度地图API，国内可正常访问
- 📶 **弱信号优化**：针对地铁隧道等弱信号环境的智能优化
  - 自动降级策略（高精度失败后使用低精度）
  - 位置缓存和历史轨迹
  - 基于速度的位置预测
  - 信号强度显示
  - 重试机制
- 🔒 **安全配置**：API Key 通过环境变量注入，支持代码混淆
- 🚀 **自动部署**：支持 GitHub Pages 自动构建和部署

## 技术栈

- 纯HTML/CSS/JavaScript（无框架依赖，轻量级）
- 百度地图API / MapillaryJS（多街景提供方）
- HTML5 Geolocation API
- GitHub Actions（自动构建和部署）

## 快速开始

### 本地开发

1. **获取百度地图API Key**
   - 访问 [百度地图开放平台](https://lbsyun.baidu.com/)
   - 注册/登录账号
   - 进入 [控制台](https://lbsyun.baidu.com/apiconsole/key)
   - 创建应用，选择"浏览器端"类型
   - 获取API Key

2. **配置API Key**

   **方式一（推荐）**：使用构建脚本
   ```bash
   npm install
   BAIDU_API_KEY=your_key npm run build
   ```

   **方式二**：手动配置
   ```bash
   cp config.example.js config.js
   # 编辑 config.js，填入你的 API Key
   ```

3. **启动本地服务器**

   ```bash
   # Python 3
   python3 -m http.server 8000

   # 或使用 Node.js
   npx http-server -p 8000
   ```

4. **访问应用**
   - 打开浏览器访问：`http://localhost:8000`
   - 选择地铁线路
   - 点击"开始定位"

### GitHub Pages 部署

详细部署说明请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

**快速步骤**：

1. 在 GitHub 仓库设置 Secrets：
   - `BAIDU_API_KEY`: 你的百度地图 API Key

2. 启用 GitHub Pages：
   - Settings → Pages → Source: GitHub Actions

3. 推送代码到 `main` 分支，自动部署

## 安全配置

⚠️ **重要**：API Key 是敏感信息，请妥善保管！

- ✅ API Key 通过环境变量注入，不存储在代码中
- ✅ `config.js` 已在 `.gitignore` 中，不会被提交
- ✅ 支持 Base64 编码混淆
- ✅ 支持代码压缩和混淆

详细安全指南请参考 [SECURITY.md](./SECURITY.md)

## 项目结构

```
on-ground/
├── index.html              # 主页面
├── style.css               # 样式文件
├── app.js                  # 应用主逻辑
├── subway-data.js          # 地铁线路数据
├── config.example.js       # 配置示例文件
├── config.template.js      # 配置模板（构建时使用）
├── build.js                # 构建脚本
├── package.json            # 项目配置
├── .github/
│   └── workflows/
│       ├── deploy.yml      # 自动部署工作流
│       └── build-only.yml  # 构建检查工作流
├── README.md               # 说明文档
├── DEPLOYMENT.md           # 部署指南
├── SECURITY.md             # 安全配置指南
└── QUICKSTART.md           # 快速启动指南
```

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `STREET_VIEW_PROVIDER` | 街景提供方（`BAIDU` 或 `MAPILLARY`） | BAIDU | ❌ |
| `BAIDU_API_KEY` | 百度地图 API Key（当 provider=BAIDU 时必填） | - | 条件必需 |
| `MAPILLARY_ACCESS_TOKEN` | Mapillary Access Token（当 provider=MAPILLARY 时必填） | - | 条件必需 |
| `MATCH_THRESHOLD` | 位置匹配阈值（公里） | 1.0 | ❌ |
| `UPDATE_INTERVAL` | 更新间隔（毫秒） | 5000 | ❌ |
| `DEBUG_MODE` | 调试模式 | false | ❌ |

### 配置文件

- `config.example.js`: 配置示例，可复制为 `config.js`
- `config.template.js`: 构建模板，用于自动生成 `config.js`
- `config.js`: 实际配置文件（构建时生成，不提交到 Git）

## 地铁线路数据

当前包含以下地铁线路数据：

- 北京地铁1号线
- 北京地铁2号线
- 上海地铁1号线

### 添加更多线路

编辑 `subway-data.js` 文件，在 `SUBWAY_LINES` 对象中添加新的线路数据。

## 浏览器兼容性

- Chrome/Edge（推荐）
- Firefox
- Safari
- 移动端浏览器（iOS Safari、Android Chrome）

**注意**：需要HTTPS环境或localhost才能使用Geolocation API。

## 开发命令

```bash
# 安装依赖
npm install

# 构建（注入API Key）
BAIDU_API_KEY=your_key npm run build

# 压缩代码
npm run minify

# 代码混淆（可选）
npm run obfuscate
```

## 常见问题

### 1. 定位失败

- 确保浏览器已授予位置权限
- 检查设备GPS是否开启
- 尝试在HTTPS环境下运行

### 2. 街景无法显示

- 检查百度地图API Key是否正确配置
- 确认该位置有街景数据（某些区域可能没有街景）
- 检查网络连接

### 3. 构建失败

- 检查环境变量是否设置
- 查看构建日志
- 参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 相关文档

- [快速启动指南](./QUICKSTART.md)
- [部署指南](./DEPLOYMENT.md)
- [安全配置指南](./SECURITY.md)
- [弱信号优化说明](./WEAK_SIGNAL_OPTIMIZATION.md)
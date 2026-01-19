# 安全配置指南

## 🔒 API Key 安全保护

### 为什么需要保护 API Key？

1. **防止滥用**：API Key 泄露可能导致他人滥用你的配额
2. **成本控制**：防止产生意外费用
3. **服务安全**：保护你的服务不被恶意使用

### 当前实现的安全措施

1. ✅ **构建时注入**：API Key 在构建时通过环境变量注入，不存储在代码中
2. ✅ **Base64 混淆**：API Key 使用 Base64 编码，防止简单的字符串扫描
3. ✅ **Git 忽略**：`config.js` 已在 `.gitignore` 中，不会被提交
4. ✅ **GitHub Secrets**：生产环境使用 GitHub Secrets 存储
5. ✅ **代码压缩**：JavaScript 代码被压缩，增加逆向难度

### 安全等级说明

| 措施 | 安全等级 | 说明 |
|------|---------|------|
| 环境变量 | ⭐⭐⭐⭐⭐ | 最安全，不存储在代码中 |
| Base64 编码 | ⭐⭐ | 基础混淆，可防止简单扫描 |
| 代码压缩 | ⭐ | 增加阅读难度，但不提供真正保护 |
| 代码混淆 | ⭐⭐⭐ | 更强的保护，但仍有被破解的可能 |

## 🛡️ 最佳实践

### 1. 开发环境

```bash
# 使用环境变量
export BAIDU_API_KEY=your_key_here
npm run build

# 或使用 .env 文件（需要安装 dotenv）
echo "BAIDU_API_KEY=your_key_here" > .env
npm run build
```

### 2. 生产环境（GitHub Pages）

1. 在 GitHub 仓库设置 Secrets：
   - Settings → Secrets and variables → Actions
   - 添加 `BAIDU_API_KEY`

2. API Key 会自动注入到构建产物中

### 3. 检查配置是否安全

```bash
# 检查 Git 历史
git log -p | grep -i "api.*key"

# 检查当前文件
grep -r "your_actual_key" --exclude-dir=node_modules .

# 检查是否提交了 config.js
git ls-files | grep config.js
```

## ⚠️ 如果 API Key 泄露了怎么办？

1. **立即行动**：
   - 在百度地图控制台重新生成 API Key
   - 更新 GitHub Secrets
   - 更新本地环境变量

2. **清理历史**（如需要）：
   ```bash
   # 使用 git filter-branch 或 BFG Repo-Cleaner
   # 注意：这会重写 Git 历史
   ```

3. **监控使用**：
   - 检查百度地图控制台的使用统计
   - 设置使用限额和告警

## 🔐 进一步的安全建议

### 1. 使用 API Key 限制

在百度地图控制台设置：
- **IP 白名单**：限制允许访问的 IP
- **Referer 限制**：限制允许的域名
- **使用限额**：设置每日/每月限额

### 2. 定期轮换

- 定期更换 API Key
- 使用不同的 Key 用于开发和生产

### 3. 监控和告警

- 监控 API 使用量
- 设置异常使用告警
- 定期检查访问日志

## 📝 配置检查清单

- [ ] `config.js` 在 `.gitignore` 中
- [ ] `config.example.js` 不包含真实 Key
- [ ] GitHub Secrets 已设置
- [ ] 本地使用环境变量
- [ ] API Key 设置了使用限制
- [ ] 定期检查使用情况

## 🚨 常见错误

### ❌ 错误做法

```javascript
// 不要这样做！
const API_KEY = "your_actual_key_here"; // 硬编码
```

```bash
# 不要提交 config.js
git add config.js  # ❌
```

### ✅ 正确做法

```javascript
// 使用环境变量
const API_KEY = process.env.BAIDU_API_KEY;
```

```bash
# 只提交模板文件
git add config.example.js  # ✅
git add config.template.js  # ✅
```

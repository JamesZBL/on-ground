# 快速启动指南

## 5分钟快速开始

### 步骤1：获取百度地图API Key（2分钟）

1. 访问 https://lbsyun.baidu.com/apiconsole/key
2. 登录/注册百度账号
3. 点击"创建应用"
4. 填写应用信息：
   - 应用名称：地铁街景（任意名称）
   - 应用类型：**浏览器端**
   - 白名单：可以留空（开发阶段）或填写你的域名
5. 创建后复制 **AK（访问应用密钥）**

### 步骤2：配置API Key（1分钟）

```bash
# 复制配置文件
cp config.example.js config.js

# 编辑 config.js，将 YOUR_BAIDU_API_KEY 替换为你的AK
```

或者直接创建 `config.js` 文件：

```javascript
const CONFIG = {
    BAIDU_API_KEY: '你的API_Key_在这里',
    MATCH_THRESHOLD: 1.0,
    DEFAULT_UPDATE_INTERVAL: 5000
};
```

### 步骤3：启动本地服务器（1分钟）

**方式一：使用Python（推荐）**

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**方式二：使用Node.js**

```bash
npx http-server -p 8000
```

**方式三：使用PHP**

```bash
php -S localhost:8000
```

### 步骤4：打开应用（1分钟）

1. 在浏览器中访问：`http://localhost:8000`
2. 选择一条地铁线路（如：北京地铁1号线）
3. 点击"开始定位"
4. 允许浏览器获取位置权限
5. 等待定位成功后，街景会自动显示

## 测试建议

### 在真实地铁上测试

1. 乘坐地铁时打开应用
2. 选择对应的地铁线路
3. 开始定位
4. 观察街景是否实时更新

### 在电脑上模拟测试

由于电脑无法移动，可以：

1. 手动修改 `app.js` 中的测试坐标
2. 或者使用浏览器的开发者工具模拟位置
   - Chrome: F12 → More tools → Sensors → Geolocation
   - 输入地铁线路附近的坐标进行测试

## 常见问题

**Q: 定位失败怎么办？**
A: 
- 确保浏览器已授予位置权限
- 在HTTPS环境下运行（或localhost）
- 检查设备GPS是否开启

**Q: 街景不显示？**
A:
- 检查API Key是否正确配置
- 确认该位置有街景数据（某些区域可能没有）
- 查看浏览器控制台是否有错误信息

**Q: 无法匹配到地铁线路？**
A:
- 确保已选择正确的地铁线路
- 检查是否在所选线路附近（1公里内）
- 可以调整 `config.js` 中的 `MATCH_THRESHOLD` 值

## 下一步

- 添加更多城市的地铁线路数据
- 自定义更新间隔和匹配阈值
- 优化UI和用户体验

// 应用主逻辑
class SubwayPanoramaApp {
    constructor() {
        this.watchId = null;
        this.panorama = null;
        this.currentLine = null;
        this.updateInterval = typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_UPDATE_INTERVAL : 5000;
        this.autoUpdateTimer = null;
        this.isTracking = false;
        this.matchThreshold = typeof CONFIG !== 'undefined' ? CONFIG.MATCH_THRESHOLD : 1.0;
        
        // 弱信号优化：位置缓存和历史轨迹
        const weakSignalConfig = typeof CONFIG !== 'undefined' && CONFIG.WEAK_SIGNAL 
            ? CONFIG.WEAK_SIGNAL 
            : {
                MAX_RETRIES: 3,
                HIGH_ACCURACY_TIMEOUT: 15000,
                LOW_ACCURACY_TIMEOUT: 20000,
                MAX_CACHE_AGE_HIGH: 30000,
                MAX_CACHE_AGE_LOW: 60000,
                MAX_HISTORY_SIZE: 10,
                MAX_LAST_POSITION_AGE: 120
            };
        
        this.lastKnownPosition = null;
        this.positionHistory = []; // 存储最近的位置历史
        this.maxHistorySize = weakSignalConfig.MAX_HISTORY_SIZE;
        this.fallbackMode = false; // 降级模式标志
        this.retryCount = 0;
        this.maxRetries = weakSignalConfig.MAX_RETRIES;
        this.lastUpdateTime = null;
        this.estimatedSpeed = 0; // 估计速度（米/秒）
        this.lastPositionTime = null;
        this.weakSignalConfig = weakSignalConfig;

        // 街景提供方（默认为 BAIDU，可在 CONFIG 中配置为 MAPILLARY）
        this.providerType = typeof CONFIG !== 'undefined' && CONFIG.STREET_VIEW_PROVIDER
            ? String(CONFIG.STREET_VIEW_PROVIDER).toUpperCase()
            : 'BAIDU';
        
        // 防抖相关
        this.panoramaUpdateTimer = null;
        this.panoramaUpdateDelay = typeof CONFIG !== 'undefined' && CONFIG.PANORAMA_UPDATE_DELAY 
            ? CONFIG.PANORAMA_UPDATE_DELAY 
            : 1000; // 默认1秒防抖
        
        // 离线检测
        this.isOnline = navigator.onLine;
        
        // 坐标转换缓存
        this.coordinateCache = new Map();
        this.cacheMaxSize = 100;
        
        // 日志控制
        this.debugMode = typeof CONFIG !== 'undefined' && CONFIG.DEBUG_MODE || false;
        
        // 位置变化阈值（米）- 避免微小位置变化触发更新
        this.positionChangeThreshold = typeof CONFIG !== 'undefined' && CONFIG.POSITION_CHANGE_THRESHOLD 
            ? CONFIG.POSITION_CHANGE_THRESHOLD 
            : 10; // 默认10米
        
        // 最近站点索引缓存（避免重复计算）
        this.lastNearestStationIndex = -1;
        
        // 街景加载超时
        this.panoramaLoadTimeout = null;
        this.panoramaLoadTimeoutDuration = 10000; // 10秒超时
        
        // 性能统计
        this.stats = {
            locationSuccessCount: 0,
            locationErrorCount: 0,
            panoramaLoadCount: 0,
            panoramaErrorCount: 0,
            startTime: Date.now()
        };
        
        // 事件监听器清理列表
        this.eventListeners = [];
        
        // 首次使用标记
        this.isFirstTime = !localStorage.getItem('subwayPanoramaFirstTime');
        
        this.init();
    }

    init() {
        // 检查浏览器兼容性
        this.checkBrowserCompatibility();
        
        // 检查HTTPS
        this.checkHTTPS();
        
        // 根据提供方检查必要的全局对象或配置
        if (this.isBaiduProvider()) {
            // 检查百度地图API是否加载
            if (typeof BMap === 'undefined') {
                console.error('百度地图API未加载，请检查API Key配置');
                this.showError('百度地图API未加载，请检查配置');
                return;
            }
        } else if (this.isMapillaryProvider()) {
            // 检查 Mapillary 配置
            if (!CONFIG.MAPILLARY_ACCESS_TOKEN || CONFIG.MAPILLARY_ACCESS_TOKEN === 'YOUR_MAPILLARY_ACCESS_TOKEN') {
                console.error('Mapillary Access Token 未配置或仍为占位符');
                this.showError('Mapillary Access Token 未配置，请检查 config.js');
                return;
            }
            if (typeof mapillary === 'undefined') {
                console.error('MapillaryJS 未加载，请检查构建或网络');
                this.showError('MapillaryJS 未加载，请检查网络或构建配置');
                return;
            }
        }

        // 初始化UI
        this.initUI();
        
        // 初始化街景
        this.initPanorama();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化离线检测
        this.initOfflineDetection();
        
        // 加载用户偏好
        this.loadUserPreferences();
        
        // 首次使用引导
        if (this.isFirstTime) {
            setTimeout(() => {
                this.showFirstTimeGuide();
            }, 1000);
        }
    }

    // 当前是否使用百度街景
    isBaiduProvider() {
        return this.providerType === 'BAIDU';
    }

    // 当前是否使用 Mapillary 街景
    isMapillaryProvider() {
        return this.providerType === 'MAPILLARY';
    }
    
    // 检查HTTPS
    checkHTTPS() {
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            this.showToast('⚠️ Geolocation API需要HTTPS环境，当前为HTTP，定位功能可能无法使用', 'warning', 5000);
        }
    }
    
    // 检查浏览器兼容性
    checkBrowserCompatibility() {
        const requiredFeatures = {
            'Geolocation API': typeof navigator !== 'undefined' && 'geolocation' in navigator,
            'LocalStorage': typeof Storage !== 'undefined',
            'Map': typeof Map !== 'undefined',
            'Promise': typeof Promise !== 'undefined'
        };
        
        const missingFeatures = Object.entries(requiredFeatures)
            .filter(([_, supported]) => !supported)
            .map(([name]) => name);
        
        if (missingFeatures.length > 0) {
            this.showToast(`⚠️ 浏览器不支持以下功能: ${missingFeatures.join(', ')}`, 'warning', 5000);
        }
    }
    
    // 安全的DOM元素获取
    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`元素 ${id} 不存在`);
        }
        return element;
    }

    initUI() {
        // 填充地铁线路选择器
        const lineSelector = this.getElement('lineSelector');
        if (!lineSelector) return;
        
        const lines = getAllLines();
        
        lines.forEach(line => {
            const option = document.createElement('option');
            option.value = line.id;
            option.textContent = line.name;
            lineSelector.appendChild(option);
        });

        // 线路选择变化事件
        lineSelector.addEventListener('change', (e) => {
            this.currentLine = e.target.value;
            this.saveUserPreferences();
            // 重置最近站点索引缓存
            this.lastNearestStationIndex = -1;
            
            const subwayLineEl = this.getElement('subwayLine');
            if (subwayLineEl) {
                if (this.currentLine) {
                    const line = SUBWAY_LINES[this.currentLine];
                    subwayLineEl.textContent = line.name;
                    subwayLineEl.className = 'status-value active';
                } else {
                    subwayLineEl.textContent = '-';
                    subwayLineEl.className = 'status-value';
                }
            }
        });
    }

    initPanorama() {
        const container = this.getElement('panorama');
        if (!container) {
            console.error('街景容器不存在');
            return;
        }
        
        this.logDebug('initPanorama', '初始化街景容器成功，准备根据提供方进行初始化', {
            providerType: this.providerType
        });
        
        if (this.isBaiduProvider()) {
            // 初始化百度街景（默认位置：北京天安门）
            // 注意：百度地图使用BD-09坐标系，需要转换GPS坐标
            this.panorama = new BMap.Panorama(container);
            
            // 设置默认位置（天安门，BD-09坐标）
            const defaultPoint = new BMap.Point(116.3974, 39.9093);
            this.panorama.setPosition(defaultPoint);
            
            // 街景加载完成事件
            this.panorama.addEventListener('position_changed', () => {
                // 更新统计
                this.stats.panoramaLoadCount++;
                this.logDebug('BaiduPanorama', 'position_changed 事件触发，街景加载成功', {
                    loadCount: this.stats.panoramaLoadCount
                });
                
                // 清除超时定时器
                if (this.panoramaLoadTimeout) {
                    clearTimeout(this.panoramaLoadTimeout);
                    this.panoramaLoadTimeout = null;
                }
                this.hideLoading();
            });

            // 街景加载错误事件
            this.panorama.addEventListener('error', (e) => {
                // 更新统计
                this.stats.panoramaErrorCount++;
                this.logDebug('BaiduPanorama', '街景加载错误事件触发', {
                    error: e,
                    errorCount: this.stats.panoramaErrorCount
                });
                this.hideLoading();
                // 显示友好的错误提示
                this.showToast('该位置暂无街景数据', 'warning', 3000);
            });
        } else if (this.isMapillaryProvider()) {
            // MapillaryJS 的 viewer 将在第一次 updatePanorama 调用时按最近影像位置懒加载
            // 这里只做容器存在性检查与简单标记
            this.panorama = null;
            this.logDebug('Mapillary', 'Mapillary 模式初始化完成，等待第一次 updatePanorama 懒加载 Viewer');
        }
    }

    bindEvents() {
        // 开始定位按钮
        const startBtn = this.getElement('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startTracking();
            });
        }

        // 停止定位按钮
        const stopBtn = this.getElement('stopBtn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopTracking();
            });
        }

        // 刷新街景按钮
        const refreshBtn = this.getElement('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshPanorama();
            });
        }
        
        // 导出数据按钮
        const exportBtn = this.getElement('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportPositionHistory();
            });
        }

        // 自动更新复选框
        const autoUpdate = this.getElement('autoUpdate');
        if (autoUpdate) {
            autoUpdate.addEventListener('change', (e) => {
                this.saveUserPreferences();
                if (e.target.checked && this.isTracking) {
                    this.startAutoUpdate();
                } else {
                    this.stopAutoUpdate();
                }
            });
        }

        // 更新间隔选择
        const updateInterval = this.getElement('updateInterval');
        if (updateInterval) {
            updateInterval.addEventListener('change', (e) => {
                this.updateInterval = parseInt(e.target.value);
                this.saveUserPreferences();
                const autoUpdateCheck = this.getElement('autoUpdate');
                if (this.isTracking && autoUpdateCheck && autoUpdateCheck.checked) {
                    this.stopAutoUpdate();
                    this.startAutoUpdate();
                }
            });
        }
        
        // 页面可见性检测（页面隐藏时暂停更新）
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 页面隐藏，可以暂停某些更新以节省资源
                if (this.debugMode) {
                    console.log('页面隐藏，暂停部分更新');
                }
            } else {
                // 页面显示，恢复更新
                if (this.isTracking && this.getElement('autoUpdate')?.checked) {
                    // 立即获取一次位置
                    this.tryGetPosition(!this.fallbackMode);
                }
            }
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            // 如果焦点在输入框，不触发快捷键
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Ctrl/Cmd + S: 开始/停止定位
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (this.isTracking) {
                    this.stopTracking();
                } else {
                    this.startTracking();
                }
            }
            // Esc: 停止定位或关闭帮助
            if (e.key === 'Escape') {
                if (this.isTracking) {
                    this.stopTracking();
                }
                this.closeHelpDialog();
            }
            // F5: 刷新街景
            if (e.key === 'F5') {
                e.preventDefault();
                this.refreshPanorama();
            }
            // F1: 显示帮助
            if (e.key === 'F1') {
                e.preventDefault();
                this.showHelpDialog();
            }
        });
        
        // 帮助按钮
        const helpBtn = this.getElement('helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this.showHelpDialog();
            });
        }
        
        // 关闭帮助按钮
        const closeHelpBtn = this.getElement('closeHelpBtn');
        if (closeHelpBtn) {
            closeHelpBtn.addEventListener('click', () => {
                this.closeHelpDialog();
            });
        }
        
        // 点击对话框外部关闭
        const helpDialog = this.getElement('helpDialog');
        if (helpDialog) {
            helpDialog.addEventListener('click', (e) => {
                if (e.target === helpDialog) {
                    this.closeHelpDialog();
                }
            });
        }
    }
    
    // 初始化离线检测
    initOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.hideOfflineIndicator();
            this.showToast('网络连接已恢复', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineIndicator();
            this.showToast('网络连接已断开', 'error');
        });
        
        // 初始状态
        if (!this.isOnline) {
            this.showOfflineIndicator();
        }
    }
    
    // 显示离线提示
    showOfflineIndicator() {
        const indicator = this.getElement('offlineIndicator');
        if (indicator) {
            indicator.classList.remove('hidden');
        }
    }
    
    // 隐藏离线提示
    hideOfflineIndicator() {
        const indicator = this.getElement('offlineIndicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
    }
    
    // 保存用户偏好
    saveUserPreferences() {
        try {
            const autoUpdateEl = this.getElement('autoUpdate');
            const preferences = {
                updateInterval: this.updateInterval,
                autoUpdate: autoUpdateEl ? autoUpdateEl.checked : true,
                selectedLine: this.currentLine
            };
            localStorage.setItem('subwayPanoramaPrefs', JSON.stringify(preferences));
        } catch (e) {
            if (this.debugMode) {
                console.warn('无法保存用户偏好:', e);
            }
        }
    }
    
    // 加载用户偏好
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('subwayPanoramaPrefs');
            if (saved) {
                const preferences = JSON.parse(saved);
                
                // 恢复更新间隔
                if (preferences.updateInterval) {
                    this.updateInterval = preferences.updateInterval;
                    const intervalSelect = this.getElement('updateInterval');
                    if (intervalSelect) {
                        intervalSelect.value = preferences.updateInterval;
                    }
                }
                
                // 恢复自动更新设置
                if (preferences.autoUpdate !== undefined) {
                    const autoUpdateCheck = this.getElement('autoUpdate');
                    if (autoUpdateCheck) {
                        autoUpdateCheck.checked = preferences.autoUpdate;
                    }
                }
                
                // 恢复线路选择
                if (preferences.selectedLine) {
                    const lineSelector = this.getElement('lineSelector');
                    if (lineSelector) {
                        lineSelector.value = preferences.selectedLine;
                        lineSelector.dispatchEvent(new Event('change'));
                    }
                }
            }
        } catch (e) {
            if (this.debugMode) {
                console.warn('无法加载用户偏好:', e);
            }
        }
    }

    startTracking() {
        if (!navigator.geolocation) {
            this.showError('您的浏览器不支持地理定位');
            return;
        }

        if (!this.currentLine) {
            this.showError('请先选择地铁线路');
            return;
        }

        this.isTracking = true;
        this.logDebug('Geo', '开始定位追踪', {
            currentLine: this.currentLine,
            matchThreshold: this.matchThreshold,
            updateInterval: this.updateInterval
        });
        this.fallbackMode = false;
        this.retryCount = 0;
        this.updateLocationStatus('定位中...', 'warning');
        
        // 尝试高精度定位
        this.tryGetPosition(true);

        // 更新按钮状态
        const startBtn = this.getElement('startBtn');
        const stopBtn = this.getElement('stopBtn');
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;

        // 如果自动更新开启，启动定时器
        const autoUpdate = this.getElement('autoUpdate');
        if (autoUpdate && autoUpdate.checked) {
            this.startAutoUpdate();
        }
    }

    // 尝试获取位置（带降级策略）
    tryGetPosition(highAccuracy = true) {
        this.logDebug('Geo', '尝试获取位置', {
            highAccuracy,
            retryCount: this.retryCount,
            fallbackMode: this.fallbackMode
        });
        // 高精度选项（弱信号环境下可能失败）
        const highAccuracyOptions = {
            enableHighAccuracy: true,
            timeout: this.weakSignalConfig.HIGH_ACCURACY_TIMEOUT,
            maximumAge: this.weakSignalConfig.MAX_CACHE_AGE_HIGH
        };

        // 低精度选项（降级方案）
        const lowAccuracyOptions = {
            enableHighAccuracy: false,
            timeout: this.weakSignalConfig.LOW_ACCURACY_TIMEOUT,
            maximumAge: this.weakSignalConfig.MAX_CACHE_AGE_LOW
        };

        const options = highAccuracy ? highAccuracyOptions : lowAccuracyOptions;

        // 使用watchPosition持续监听
        if (!this.watchId) {
            this.logDebug('Geo', '创建新的 watchPosition 监听', { options });
            this.watchId = navigator.geolocation.watchPosition(
                (position) => this.onLocationSuccess(position),
                (error) => {
                    // 高精度失败，尝试低精度
                    if (highAccuracy && this.retryCount < this.maxRetries) {
                        this.retryCount++;
                        this.logDebug('Geo', `watchPosition 高精度失败，准备切换低精度模式 (${this.retryCount}/${this.maxRetries})`, error);
                        this.fallbackMode = true;
                        this.updateLocationStatus('信号弱，使用低精度模式', 'warning');
                        setTimeout(() => {
                            this.tryGetPosition(false);
                        }, 1000);
                    } else {
                        this.onLocationError(error);
                    }
                },
                options
            );
        }

        // 立即获取一次位置
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.retryCount = 0; // 重置重试计数
                this.logDebug('Geo', 'getCurrentPosition 成功返回', {
                    coords: position.coords,
                    fallbackMode: this.fallbackMode
                });
                this.fallbackMode = false;
                this.onLocationSuccess(position);
            },
            (error) => {
                // 高精度失败，尝试低精度
                if (highAccuracy && this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    this.logDebug('Geo', `getCurrentPosition 高精度失败，准备切换低精度模式 (${this.retryCount}/${this.maxRetries})`, error);
                    this.fallbackMode = true;
                    this.updateLocationStatus('信号弱，使用低精度模式', 'warning');
                    setTimeout(() => {
                        this.tryGetPosition(false);
                    }, 1000);
                } else {
                    // 如果低精度也失败，使用最后已知位置
                        if (this.lastKnownPosition) {
                            this.logDebug('Geo', '高/低精度都失败，回退使用最后已知位置', {
                                lastKnownPosition: this.lastKnownPosition
                            });
                            this.useLastKnownPosition();
                    } else {
                        this.onLocationError(error);
                    }
                }
            },
            options
        );
    }

    stopTracking() {
        this.isTracking = false;
        
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        this.stopAutoUpdate();
        
        // 清理防抖定时器
        if (this.panoramaUpdateTimer) {
            clearTimeout(this.panoramaUpdateTimer);
            this.panoramaUpdateTimer = null;
        }
        
        // 清理街景加载超时定时器
        if (this.panoramaLoadTimeout) {
            clearTimeout(this.panoramaLoadTimeout);
            this.panoramaLoadTimeout = null;
        }
        
        // 重置缓存
        this.lastNearestStationIndex = -1;
        
        this.updateLocationStatus('已停止', '');
        
        // 更新按钮状态
        const startBtn = this.getElement('startBtn');
        const stopBtn = this.getElement('stopBtn');
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
    }

    onLocationSuccess(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const timestamp = position.timestamp || Date.now();
        
        this.logDebug('Geo', 'onLocationSuccess 收到定位结果', {
            lat,
            lng,
            accuracy,
            timestamp
        });
        
        // 更新统计
        this.stats.locationSuccessCount++;
        
        // 验证位置数据有效性
        if (!this.isValidPosition(lat, lng, accuracy)) {
            if (this.debugMode) {
                console.warn('无效的位置数据，已忽略:', { lat, lng, accuracy });
            }
            return;
        }

        // 计算速度（如果有历史位置）
        if (this.lastKnownPosition && this.lastPositionTime) {
            const timeDiff = (timestamp - this.lastPositionTime) / 1000; // 秒
            if (timeDiff > 0 && timeDiff < 300) { // 时间差在5分钟内才计算速度
                const distance = calculateDistance(
                    this.lastKnownPosition.lat,
                    this.lastKnownPosition.lng,
                    lat,
                    lng
                ) * 1000; // 转换为米
                const calculatedSpeed = distance / timeDiff; // 米/秒
                
                // 过滤异常值：地铁速度通常在0-30 m/s (0-108 km/h)之间
                if (calculatedSpeed >= 0 && calculatedSpeed <= 30) {
                    // 使用平滑算法，避免速度突变
                    if (this.estimatedSpeed > 0) {
                        this.estimatedSpeed = this.estimatedSpeed * 0.7 + calculatedSpeed * 0.3;
                    } else {
                        this.estimatedSpeed = calculatedSpeed;
                    }
                }
            }
        }

        // 检查位置是否显著变化（避免微小变化触发更新）
        if (this.lastKnownPosition) {
            const distance = calculateDistance(
                this.lastKnownPosition.lat,
                this.lastKnownPosition.lng,
                lat,
                lng
            ) * 1000; // 转换为米
            
            // 如果位置变化小于阈值，且不是首次定位，跳过更新
            if (distance < this.positionChangeThreshold && this.lastUpdateTime) {
                if (this.debugMode) {
                    console.log(`位置变化 ${distance.toFixed(1)}米，小于阈值 ${this.positionChangeThreshold}米，跳过更新`);
                }
                return;
            }
        }
        
        // 保存位置到历史记录
        const positionData = {
            lat,
            lng,
            accuracy,
            timestamp,
            speed: this.estimatedSpeed
        };
        
        this.addToHistory(positionData);
        this.lastKnownPosition = positionData;
        this.lastPositionTime = timestamp;
        this.lastUpdateTime = Date.now();

        // 更新位置信息显示
        const latEl = this.getElement('latitude');
        const lngEl = this.getElement('longitude');
        const accuracyEl = this.getElement('accuracy');
        const speedEl = this.getElement('speed');
        
        if (latEl) latEl.textContent = lat.toFixed(6);
        if (lngEl) lngEl.textContent = lng.toFixed(6);
        
        // 显示精度和信号强度
        if (accuracyEl) {
            const accuracyText = `${accuracy.toFixed(0)}米`;
            const signalStrength = this.getSignalStrength(accuracy);
            accuracyEl.textContent = `${accuracyText} ${signalStrength}`;
            accuracyEl.title = `信号强度: ${signalStrength}`;
        }
        
        // 显示速度（过滤异常值）
        if (speedEl) {
            const speedKmh = (this.estimatedSpeed * 3.6).toFixed(1); // 转换为km/h
            // 地铁速度通常在0-100 km/h之间，过滤异常值
            const validSpeed = this.estimatedSpeed > 0 && this.estimatedSpeed < 30 
                ? `${speedKmh} km/h` 
                : '-';
            speedEl.textContent = validSpeed;
        }
        
        // 计算到下一站的距离和预计到达时间
        if (this.currentLine) {
            const nextStationInfo = this.getNextStationInfo(lat, lng);
            if (nextStationInfo) {
                const distanceText = nextStationInfo.distance < 1 
                    ? `${(nextStationInfo.distance * 1000).toFixed(0)}米`
                    : `${nextStationInfo.distance.toFixed(2)}公里`;
                
                // 计算预计到达时间
                let timeText = '';
                if (this.estimatedSpeed > 0) {
                    const timeSeconds = (nextStationInfo.distance * 1000) / this.estimatedSpeed;
                    if (timeSeconds < 60) {
                        timeText = `约${Math.round(timeSeconds)}秒`;
                    } else {
                        const minutes = Math.round(timeSeconds / 60);
                        timeText = `约${minutes}分钟`;
                    }
                }
                
                const displayText = timeText 
                    ? `${nextStationInfo.station.name} (${distanceText}, ${timeText})`
                    : `${nextStationInfo.station.name} (${distanceText})`;
                
                const nextStationEl = this.getElement('nextStationDistance');
                if (nextStationEl) {
                    nextStationEl.textContent = displayText;
                }
            } else {
                const nextStationEl = this.getElement('nextStationDistance');
                if (nextStationEl) {
                    nextStationEl.textContent = '-';
                }
            }
        }

        // 检查是否在地铁线路附近
        if (this.currentLine) {
            const projectedPoint = getProjectedPoint(lat, lng, this.currentLine);
            
            if (projectedPoint && projectedPoint.distance <= this.matchThreshold) {
                this.logDebug('LineMatch', '当前位置在线路附近，准备更新街景', {
                    distanceToLine: projectedPoint.distance,
                    projectedLat: projectedPoint.lat,
                    projectedLng: projectedPoint.lng
                });
                // 更新当前站点显示
                const nearestStation = findNearestStation(lat, lng, this.currentLine);
                const currentStationEl = this.getElement('currentStation');
                if (nearestStation && currentStationEl) {
                    currentStationEl.textContent = nearestStation.name;
                    currentStationEl.className = 'status-value active';
                }

                // 计算运行方向（基于位置历史）
                const heading = this.calculateHeading();
                
                // 更新街景到投影点位置（地面位置）- 使用防抖
                this.updatePanoramaDebounced(projectedPoint.lat, projectedPoint.lng, heading);
                
                const statusText = this.fallbackMode ? '定位成功（低精度）' : '定位成功';
                this.updateLocationStatus(statusText, 'active');
            } else {
                this.logDebug('LineMatch', '当前位置不在线路附近', {
                    distanceToLine: projectedPoint ? projectedPoint.distance : null
                });
                this.updateLocationStatus('不在线路附近', 'warning');
                const currentStationEl = this.getElement('currentStation');
                if (currentStationEl) {
                    currentStationEl.textContent = '-';
                    currentStationEl.className = 'status-value warning';
                }
            }
        }

        // 重置重试计数
        this.retryCount = 0;
    }

    // 添加到历史记录
    addToHistory(position) {
        this.positionHistory.push(position);
        if (this.positionHistory.length > this.maxHistorySize) {
            this.positionHistory.shift(); // 移除最旧的记录
        }
    }

    // 根据精度判断信号强度
    getSignalStrength(accuracy) {
        if (accuracy <= 20) return '📶强';
        if (accuracy <= 50) return '📶中';
        if (accuracy <= 100) return '📶弱';
        return '📶很弱';
    }
    
    // 验证位置数据有效性
    isValidPosition(lat, lng, accuracy) {
        // 检查是否为有效数字
        if (isNaN(lat) || isNaN(lng) || isNaN(accuracy)) {
            return false;
        }
        
        // 检查经纬度范围
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return false;
        }
        
        // 检查精度范围（0-10000米）
        if (accuracy < 0 || accuracy > 10000) {
            return false;
        }
        
        return true;
    }

    // 使用最后已知位置（降级方案）
    useLastKnownPosition() {
        if (!this.lastKnownPosition) {
            this.updateLocationStatus('无可用位置', 'error');
            return;
        }

        const age = (Date.now() - this.lastKnownPosition.timestamp) / 1000; // 秒
        
        // 如果最后位置太旧，不使用
        if (age > this.weakSignalConfig.MAX_LAST_POSITION_AGE) {
            this.updateLocationStatus('位置数据过期', 'error');
            return;
        }

        // 如果有速度信息，尝试预测当前位置
        let predictedLat = this.lastKnownPosition.lat;
        let predictedLng = this.lastKnownPosition.lng;

        if (this.estimatedSpeed > 0 && this.positionHistory.length >= 2) {
            // 基于速度和方向预测
            const lastPos = this.positionHistory[this.positionHistory.length - 1];
            const prevPos = this.positionHistory[this.positionHistory.length - 2];
            
            const timeSinceLastUpdate = (Date.now() - lastPos.timestamp) / 1000;
            
            // 计算方向
            const dLat = lastPos.lat - prevPos.lat;
            const dLng = lastPos.lng - prevPos.lng;
            const distance = Math.sqrt(dLat * dLat + dLng * dLng);
            
            if (distance > 0 && timeSinceLastUpdate < 60) { // 1分钟内
                // 预测位置（假设继续沿相同方向移动）
                const predictedDistance = this.estimatedSpeed * timeSinceLastUpdate * 0.000009; // 粗略转换
                predictedLat = lastPos.lat + (dLat / distance) * predictedDistance;
                predictedLng = lastPos.lng + (dLng / distance) * predictedDistance;
            }
        }

        // 使用预测或最后已知位置
        const useLat = predictedLat;
        const useLng = predictedLng;

        // 更新显示
        const latEl = this.getElement('latitude');
        const lngEl = this.getElement('longitude');
        const accuracyEl = this.getElement('accuracy');
        
        if (latEl) latEl.textContent = useLat.toFixed(6) + ' (估算)';
        if (lngEl) lngEl.textContent = useLng.toFixed(6) + ' (估算)';
        if (accuracyEl) {
            accuracyEl.textContent = `${this.lastKnownPosition.accuracy.toFixed(0)}米 📶估算`;
        }

        // 检查是否在地铁线路附近
        if (this.currentLine) {
            const projectedPoint = getProjectedPoint(useLat, useLng, this.currentLine);
            
            if (projectedPoint && projectedPoint.distance <= this.matchThreshold) {
                const nearestStation = findNearestStation(useLat, useLng, this.currentLine);
                const currentStationEl = this.getElement('currentStation');
                if (nearestStation && currentStationEl) {
                    currentStationEl.textContent = nearestStation.name + ' (估算)';
                    currentStationEl.className = 'status-value warning';
                }
                this.updatePanorama(projectedPoint.lat, projectedPoint.lng);
                this.updateLocationStatus('使用估算位置', 'warning');
            }
        }
    }

    onLocationError(error) {
        // 更新统计
        this.stats.locationErrorCount++;
        
        let errorMessage = '定位失败: ';
        this.logDebug('Geo', 'onLocationError 收到定位错误', {
            code: error.code,
            message: error.message
        });
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage += '用户拒绝了地理定位请求';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage += '位置信息不可用';
                break;
            case error.TIMEOUT:
                errorMessage += '定位请求超时';
                break;
            default:
                errorMessage += '未知错误';
                break;
        }

        this.showError(errorMessage);
        this.updateLocationStatus('定位失败', 'error');
    }

    updatePanorama(lat, lng, heading = null) {
        this.logDebug('updatePanorama', '开始更新街景', {
            providerType: this.providerType,
            lat,
            lng,
            heading
        });

        this.showLoading();
        
        // 清除之前的超时定时器
        if (this.panoramaLoadTimeout) {
            clearTimeout(this.panoramaLoadTimeout);
        }
        
        // 设置加载超时
        this.panoramaLoadTimeout = setTimeout(() => {
            this.hideLoading();
            this.showToast('街景加载超时，请重试', 'warning', 3000);
        }, this.panoramaLoadTimeoutDuration);
        
        if (this.isBaiduProvider()) {
            if (!this.panorama) {
                this.logDebug('updatePanorama', 'BaiduPanorama 实例不存在，无法更新街景');
                return;
            }

            // GPS坐标（WGS84）转换为百度坐标（BD-09）
            const bdPoint = this.wgs84ToBd09(lat, lng);
            this.logDebug('BaiduPanorama', 'WGS84 -> BD-09 坐标转换完成', bdPoint);
            const point = new BMap.Point(bdPoint.lng, bdPoint.lat);
            
            // 设置街景位置
            this.logDebug('BaiduPanorama', '即将设置街景位置');
            this.panorama.setPosition(point);
            
            // 如果提供了方向，调整街景视角
            if (heading !== null && heading !== undefined) {
                try {
                    this.panorama.setPov({
                        heading: heading, // 方向角（0-360度）
                        pitch: 0 // 俯仰角
                    });
                } catch (e) {
                    // 某些版本的API可能不支持setPov
                    this.logDebug('BaiduPanorama', '无法设置街景视角', e);
                }
            }
        } else if (this.isMapillaryProvider()) {
            // 使用 Mapillary Graph API 按经纬度查找最近的影像，并用 MapillaryJS viewer 展示
            const accessToken = CONFIG.MAPILLARY_ACCESS_TOKEN;
            const url = `https://graph.mapillary.com/images?access_token=${encodeURIComponent(accessToken)}&fields=id&closeto=${lng},${lat}`;
            this.logDebug('Mapillary', '准备通过 Graph API 拉取附近影像', { url });

            fetch(url)
                .then(res => {
                    this.logDebug('Mapillary', 'Graph API 返回响应', {
                        ok: res.ok,
                        status: res.status
                    });
                    return res.json();
                })
                .then(data => {
                    this.logDebug('Mapillary', 'Graph API JSON 解析成功', data);
                    const list = data && data.data;
                    if (!Array.isArray(list) || list.length === 0) {
                        this.stats.panoramaErrorCount++;
                        this.logDebug('Mapillary', '附近没有可用影像', {
                            errorCount: this.stats.panoramaErrorCount
                        });
                        this.showToast('该位置暂无 Mapillary 街景数据', 'warning', 3000);
                        return;
                    }

                    const imageId = list[0].id;
                    this.logDebug('Mapillary', '选取最近影像 ID', { imageId });

                    // 初始化或更新 MapillaryJS Viewer（参考 MapillaryJS API 文档：https://mapillary.github.io/mapillary-js/api/）
                    const container = this.getElement('panorama');
                    if (!container) {
                        this.logDebug('Mapillary', '找不到街景容器，无法创建/更新 Viewer');
                        return;
                    }

                    if (!this.panorama) {
                        // 通过全局 mapillary 对象创建 Viewer
                        this.logDebug('Mapillary', '创建新的 Mapillary Viewer');
                        this.panorama = new mapillary.Viewer({
                            accessToken,
                            container,
                            imageId
                        });
                    } else if (typeof this.panorama.moveTo === 'function') {
                        this.logDebug('Mapillary', '调用现有 Viewer.moveTo 切换影像', { imageId });
                        this.panorama.moveTo(imageId);
                    } else {
                        this.logDebug('Mapillary', '现有 panorama 实例不支持 moveTo 方法', {
                            type: typeof this.panorama
                        });
                    }

                    this.stats.panoramaLoadCount++;
                    this.logDebug('Mapillary', 'Mapillary 街景加载计数 +1', {
                        loadCount: this.stats.panoramaLoadCount
                    });
                })
                .catch(err => {
                    this.stats.panoramaErrorCount++;
                    this.logDebug('Mapillary', '加载 Mapillary 街景失败', err);
                    this.showToast('Mapillary 街景加载失败，请稍后重试', 'error', 3000);
                })
                .finally(() => {
                    if (this.panoramaLoadTimeout) {
                        clearTimeout(this.panoramaLoadTimeout);
                        this.panoramaLoadTimeout = null;
                    }
                    this.hideLoading();
                    this.logDebug('Mapillary', 'Mapillary 加载流程结束（成功或失败均会进入）');
                });
            
            return;
        }

        // 对于百度提供方，在同步调用后立即清除加载状态（实际完成事件在 position_changed 里也会清理）
        if (this.isBaiduProvider()) {
            if (this.panoramaLoadTimeout) {
                clearTimeout(this.panoramaLoadTimeout);
                this.panoramaLoadTimeout = null;
            }
            this.hideLoading();
        }
    }
    
    // 防抖版本的街景更新
    updatePanoramaDebounced(lat, lng, heading = null) {
        // 清除之前的定时器
        if (this.panoramaUpdateTimer) {
            clearTimeout(this.panoramaUpdateTimer);
        }
        
        // 设置新的定时器
        this.panoramaUpdateTimer = setTimeout(() => {
            this.updatePanorama(lat, lng, heading);
        }, this.panoramaUpdateDelay);
    }
    
    // 计算运行方向（度）
    calculateHeading() {
        if (this.positionHistory.length < 2) {
            return null;
        }
        
        const lastPos = this.positionHistory[this.positionHistory.length - 1];
        const prevPos = this.positionHistory[this.positionHistory.length - 2];
        
        // 计算方向角（0-360度，0度为正北，顺时针）
        const dLat = lastPos.lat - prevPos.lat;
        const dLng = lastPos.lng - prevPos.lng;
        
        if (Math.abs(dLat) < 0.000001 && Math.abs(dLng) < 0.000001) {
            return null; // 位置未变化
        }
        
        // 计算方位角（弧度）
        let angle = Math.atan2(dLng, dLat);
        
        // 转换为度数（0-360）
        let heading = (angle * 180 / Math.PI + 360) % 360;
        
        return heading;
    }
    
    // 获取下一站信息（带缓存优化）
    getNextStationInfo(lat, lng) {
        if (!this.currentLine || !SUBWAY_LINES[this.currentLine]) {
            return null;
        }
        
        const line = SUBWAY_LINES[this.currentLine];
        const stations = line.stations;
        
        // 找到最近的站点（使用缓存优化）
        let nearestIndex = -1;
        let minDistance = Infinity;
        
        // 如果上次计算的索引有效，先检查附近的站点
        if (this.lastNearestStationIndex >= 0 && this.lastNearestStationIndex < stations.length) {
            // 检查上次的站点和相邻站点
            const checkIndices = [
                this.lastNearestStationIndex - 1,
                this.lastNearestStationIndex,
                this.lastNearestStationIndex + 1
            ].filter(idx => idx >= 0 && idx < stations.length);
            
            checkIndices.forEach(index => {
                const station = stations[index];
                const distance = calculateDistance(lat, lng, station.lat, station.lng);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = index;
                }
            });
            
            // 如果找到的站点距离很近，使用它；否则重新搜索所有站点
            if (nearestIndex >= 0 && minDistance < 0.5) { // 500米内
                this.lastNearestStationIndex = nearestIndex;
            } else {
                // 重新搜索所有站点
                nearestIndex = -1;
                minDistance = Infinity;
                stations.forEach((station, index) => {
                    const distance = calculateDistance(lat, lng, station.lat, station.lng);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestIndex = index;
                    }
                });
                this.lastNearestStationIndex = nearestIndex;
            }
        } else {
            // 首次计算，搜索所有站点
            stations.forEach((station, index) => {
                const distance = calculateDistance(lat, lng, station.lat, station.lng);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = index;
                }
            });
            this.lastNearestStationIndex = nearestIndex;
        }
        
        if (nearestIndex === -1 || nearestIndex >= stations.length - 1) {
            return null;
        }
        
        // 返回下一站信息
        const nextStation = stations[nearestIndex + 1];
        const distance = calculateDistance(lat, lng, nextStation.lat, nextStation.lng);
        
        return {
            station: nextStation,
            distance: distance,
            index: nearestIndex + 1
        };
    }

    // WGS84坐标转BD-09坐标（百度地图坐标系）- 带缓存
    wgs84ToBd09(wgsLat, wgsLng) {
        // 使用缓存键（精度到小数点后6位）
        const cacheKey = `${wgsLat.toFixed(6)},${wgsLng.toFixed(6)}`;
        
        if (this.coordinateCache.has(cacheKey)) {
            return this.coordinateCache.get(cacheKey);
        }
        
        // 先转换为GCJ-02（火星坐标系）
        const gcj = this.wgs84ToGcj02(wgsLat, wgsLng);
        // 再转换为BD-09
        const result = this.gcj02ToBd09(gcj.lat, gcj.lng);
        
        // 缓存结果
        if (this.coordinateCache.size >= this.cacheMaxSize) {
            // 删除最旧的缓存（FIFO）
            const firstKey = this.coordinateCache.keys().next().value;
            this.coordinateCache.delete(firstKey);
        }
        this.coordinateCache.set(cacheKey, result);
        
        return result;
    }

    // WGS84转GCJ-02
    wgs84ToGcj02(wgsLat, wgsLng) {
        const a = 6378245.0;
        const ee = 0.00669342162296594323;
        
        let dLat = this.transformLat(wgsLng - 105.0, wgsLat - 35.0);
        let dLng = this.transformLng(wgsLng - 105.0, wgsLat - 35.0);
        const radLat = wgsLat / 180.0 * Math.PI;
        let magic = Math.sin(radLat);
        magic = 1 - ee * magic * magic;
        const sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
        dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
        
        return {
            lat: wgsLat + dLat,
            lng: wgsLng + dLng
        };
    }

    // GCJ-02转BD-09
    gcj02ToBd09(gcjLat, gcjLng) {
        const z = Math.sqrt(gcjLng * gcjLng + gcjLat * gcjLat) + 0.00002 * Math.sin(gcjLat * Math.PI * 3000.0 / 180.0);
        const theta = Math.atan2(gcjLat, gcjLng) + 0.000003 * Math.cos(gcjLng * Math.PI * 3000.0 / 180.0);
        
        return {
            lng: z * Math.cos(theta) + 0.0065,
            lat: z * Math.sin(theta) + 0.006
        };
    }

    transformLat(lat, lng) {
        let ret = -100.0 + 2.0 * lat + 3.0 * lng + 0.2 * lng * lng + 0.1 * lat * lng + 0.2 * Math.sqrt(Math.abs(lat));
        ret += (20.0 * Math.sin(6.0 * lat * Math.PI) + 20.0 * Math.sin(2.0 * lat * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(lng / 12.0 * Math.PI) + 320 * Math.sin(lng * Math.PI / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    transformLng(lat, lng) {
        let ret = 300.0 + lat + 2.0 * lng + 0.1 * lat * lat + 0.1 * lat * lng + 0.1 * Math.sqrt(Math.abs(lat));
        ret += (20.0 * Math.sin(6.0 * lat * Math.PI) + 20.0 * Math.sin(2.0 * lat * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(lat / 12.0 * Math.PI) + 300.0 * Math.sin(lat / 30.0 * Math.PI)) * 2.0 / 3.0;
        return ret;
    }

    refreshPanorama() {
        const latEl = this.getElement('latitude');
        const lngEl = this.getElement('longitude');
        
        if (!latEl || !lngEl) {
            this.showError('无法获取位置信息');
            return;
        }
        
        // 移除可能的"估算"标记
        const latText = latEl.textContent.replace(' (估算)', '');
        const lngText = lngEl.textContent.replace(' (估算)', '');
        
        const lat = parseFloat(latText);
        const lng = parseFloat(lngText);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            this.updatePanorama(lat, lng);
        } else {
            this.showError('请先获取位置信息');
        }
    }

    startAutoUpdate() {
        this.stopAutoUpdate();
        
        this.autoUpdateTimer = setInterval(() => {
            if (this.isTracking) {
                // 检查最后更新时间，如果太久没更新，使用降级方案
                const timeSinceLastUpdate = this.lastUpdateTime 
                    ? (Date.now() - this.lastUpdateTime) / 1000 
                    : Infinity;

                // 如果超过30秒没更新，使用最后已知位置
                if (timeSinceLastUpdate > 30 && this.lastKnownPosition) {
                    if (this.debugMode) {
                        console.log('长时间未更新，使用最后已知位置');
                    }
                    this.useLastKnownPosition();
                } else {
                    // 正常尝试获取位置（会根据当前模式自动选择高/低精度）
                    const highAccuracy = !this.fallbackMode && this.retryCount < 2;
                    this.tryGetPosition(highAccuracy);
                }
            }
        }, this.updateInterval);
    }

    stopAutoUpdate() {
        if (this.autoUpdateTimer) {
            clearInterval(this.autoUpdateTimer);
            this.autoUpdateTimer = null;
        }
    }

    updateLocationStatus(text, className) {
        const statusEl = this.getElement('locationStatus');
        if (statusEl) {
            statusEl.textContent = text;
            statusEl.className = `status-value ${className}`;
        }
    }

    showLoading() {
        const loadingOverlay = this.getElement('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loadingOverlay = this.getElement('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    showError(message) {
        this.showToast(message, 'error');
        console.error(message);
    }
    
    // 显示帮助对话框
    showHelpDialog() {
        const helpDialog = this.getElement('helpDialog');
        if (helpDialog) {
            helpDialog.classList.remove('hidden');
            // 聚焦到关闭按钮
            const closeBtn = this.getElement('closeHelpBtn');
            if (closeBtn) {
                setTimeout(() => closeBtn.focus(), 100);
            }
        }
    }
    
    // 关闭帮助对话框
    closeHelpDialog() {
        const helpDialog = this.getElement('helpDialog');
        if (helpDialog) {
            helpDialog.classList.add('hidden');
        }
    }
    
    // 显示首次使用引导
    showFirstTimeGuide() {
        const hasSeenGuide = localStorage.getItem('subwayPanoramaFirstTime');
        if (hasSeenGuide) {
            return;
        }
        
        this.showToast('👋 欢迎使用！点击右上角"?"查看使用帮助', 'info', 5000);
        
        // 标记已看过引导
        try {
            localStorage.setItem('subwayPanoramaFirstTime', 'true');
        } catch (e) {
            // 忽略存储错误
        }
    }
    
    // Toast提示
    showToast(message, type = 'info', duration = 3000) {
        const container = this.getElement('toastContainer');
        if (!container) {
            // 如果容器不存在，回退到alert
            alert(message);
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // 添加图标
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        // 使用textContent防止XSS攻击
        const iconSpan = document.createElement('span');
        iconSpan.textContent = icons[type] || '';
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        
        toast.appendChild(iconSpan);
        toast.appendChild(messageSpan);
        
        container.appendChild(toast);
        
        // 自动移除
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    // 统一调试日志输出（仅在 debugMode 为 true 时输出）
    logDebug(context, message, data) {
        if (!this.debugMode) return;
        const prefix = `[SubwayPanorama][${context}]`;
        if (data !== undefined) {
            console.log(prefix, message, data);
        } else {
            console.log(prefix, message);
        }
    }
}

// 页面加载完成后初始化应用
function initApp() {
    const providerType = typeof CONFIG !== 'undefined' && CONFIG.STREET_VIEW_PROVIDER
        ? String(CONFIG.STREET_VIEW_PROVIDER).toUpperCase()
        : 'BAIDU';

    if (providerType === 'MAPILLARY') {
        // Mapillary 模式下，直接初始化应用（SubwayPanoramaApp 内部会检查 MapillaryJS 和 Token）
        window.app = new SubwayPanoramaApp();
        return;
    }

    // 默认：百度模式，保持原有的 BMap 检查逻辑
    if (typeof BMap !== 'undefined') {
        window.app = new SubwayPanoramaApp();
        return;
    }

    // 延迟检查（API可能还在加载中）
    setTimeout(() => {
        if (typeof BMap !== 'undefined') {
            window.app = new SubwayPanoramaApp();
        } else {
            // 如果API未加载，显示提示并提供重试
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'padding: 50px; text-align: center; color: white; font-family: sans-serif;';
            errorDiv.innerHTML = `
                <h1>⚠️ 配置错误</h1>
                <p style="margin: 20px 0;">请在 config.js 中配置正确的百度地图 API Key</p>
                <p style="margin: 20px 0;">
                    <a href="https://lbsyun.baidu.com/apiconsole/key" target="_blank" 
                       style="color: #fff; text-decoration: underline;">
                        获取API Key
                    </a>
                </p>
                <p style="margin: 20px 0; font-size: 14px;">
                    1. 复制 config.example.js 为 config.js<br>
                    2. 在 config.js 中填入你的 API Key
                </p>
                <button id="retryApiBtn" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    重试加载
                </button>
            `;
            document.body.innerHTML = '';
            document.body.appendChild(errorDiv);
            
            // 添加重试按钮事件
            const retryBtn = document.getElementById('retryApiBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    location.reload();
                });
            }
        }
    }, 1000);
}

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    // 可以在这里添加错误上报逻辑
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
    // 可以在这里添加错误上报逻辑
});

// DOM加载完成后尝试初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM已经加载完成
    initApp();
}

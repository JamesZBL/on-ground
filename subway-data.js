// 地铁线路数据
// 包含线路名称、站点坐标和线路路径
const SUBWAY_LINES = {
    // 北京地铁1号线示例数据
    'beijing-line1': {
        name: '北京地铁1号线',
        color: '#C23A3F',
        stations: [
            { name: '苹果园', lat: 39.9289, lng: 116.1703 },
            { name: '古城', lat: 39.9144, lng: 116.1847 },
            { name: '八角游乐园', lat: 39.9078, lng: 116.1989 },
            { name: '八宝山', lat: 39.9011, lng: 116.2133 },
            { name: '玉泉路', lat: 39.8944, lng: 116.2278 },
            { name: '五棵松', lat: 39.9094, lng: 116.2744 },
            { name: '万寿路', lat: 39.9094, lng: 116.2911 },
            { name: '公主坟', lat: 39.9094, lng: 116.3078 },
            { name: '军事博物馆', lat: 39.9094, lng: 116.3244 },
            { name: '木樨地', lat: 39.9094, lng: 116.3411 },
            { name: '南礼士路', lat: 39.9094, lng: 116.3578 },
            { name: '复兴门', lat: 39.9094, lng: 116.3744 },
            { name: '西单', lat: 39.9094, lng: 116.3911 },
            { name: '天安门西', lat: 39.9094, lng: 116.4078 },
            { name: '天安门东', lat: 39.9094, lng: 116.4244 },
            { name: '王府井', lat: 39.9094, lng: 116.4411 },
            { name: '东单', lat: 39.9094, lng: 116.4578 },
            { name: '建国门', lat: 39.9094, lng: 116.4744 },
            { name: '永安里', lat: 39.9094, lng: 116.4911 },
            { name: '国贸', lat: 39.9094, lng: 116.5078 },
            { name: '大望路', lat: 39.9094, lng: 116.5244 },
            { name: '四惠', lat: 39.9094, lng: 116.5411 },
            { name: '四惠东', lat: 39.9094, lng: 116.5578 }
        ]
    },
    // 北京地铁2号线示例数据
    'beijing-line2': {
        name: '北京地铁2号线',
        color: '#003C7E',
        stations: [
            { name: '西直门', lat: 39.9406, lng: 116.3556 },
            { name: '车公庄', lat: 39.9333, lng: 116.3556 },
            { name: '阜成门', lat: 39.9261, lng: 116.3556 },
            { name: '复兴门', lat: 39.9094, lng: 116.3744 },
            { name: '长椿街', lat: 39.8928, lng: 116.3556 },
            { name: '宣武门', lat: 39.9000, lng: 116.3806 },
            { name: '和平门', lat: 39.9000, lng: 116.3917 },
            { name: '前门', lat: 39.9000, lng: 116.4028 },
            { name: '崇文门', lat: 39.9000, lng: 116.4139 },
            { name: '北京站', lat: 39.9000, lng: 116.4250 },
            { name: '建国门', lat: 39.9094, lng: 116.4744 },
            { name: '朝阳门', lat: 39.9250, lng: 116.4444 },
            { name: '东四十条', lat: 39.9333, lng: 116.4444 },
            { name: '东直门', lat: 39.9417, lng: 116.4444 },
            { name: '雍和宫', lat: 39.9500, lng: 116.4333 },
            { name: '安定门', lat: 39.9500, lng: 116.4222 },
            { name: '鼓楼大街', lat: 39.9500, lng: 116.4111 },
            { name: '积水潭', lat: 39.9500, lng: 116.4000 }
        ]
    },
    // 北京地铁4号线示例数据（含大兴线南延）
    'beijing-line4': {
        name: '北京地铁4号线',
        color: '#009688',
        stations: [
            { name: '安河桥北', lat: 40.0350, lng: 116.2770 },
            { name: '北宫门', lat: 40.0250, lng: 116.2820 },
            { name: '西苑', lat: 40.0150, lng: 116.2920 },
            { name: '圆明园', lat: 40.0070, lng: 116.3030 },
            { name: '北京大学东门', lat: 39.9990, lng: 116.3130 },
            { name: '中关村', lat: 39.9930, lng: 116.3220 },
            { name: '海淀黄庄', lat: 39.9870, lng: 116.3310 },
            { name: '人民大学', lat: 39.9810, lng: 116.3390 },
            { name: '魏公村', lat: 39.9730, lng: 116.3440 },
            { name: '国家图书馆', lat: 39.9660, lng: 116.3460 },
            { name: '动物园', lat: 39.9490, lng: 116.3430 },
            { name: '西直门', lat: 39.9406, lng: 116.3556 },
            { name: '新街口', lat: 39.9400, lng: 116.3660 },
            { name: '平安里', lat: 39.9400, lng: 116.3780 },
            { name: '西四', lat: 39.9400, lng: 116.3870 },
            { name: '灵境胡同', lat: 39.9400, lng: 116.3960 },
            { name: '西单', lat: 39.9089, lng: 116.3830 },
            { name: '宣武门', lat: 39.9000, lng: 116.3806 },
            { name: '菜市口', lat: 39.8900, lng: 116.3730 },
            { name: '陶然亭', lat: 39.8780, lng: 116.3730 },
            { name: '北京南站', lat: 39.8719, lng: 116.3858 },
            { name: '马家堡', lat: 39.8570, lng: 116.3720 },
            { name: '角门西', lat: 39.8500, lng: 116.3720 },
            { name: '公益西桥', lat: 39.8390, lng: 116.3720 },
            { name: '新宫', lat: 39.8140, lng: 116.3710 },
            { name: '西红门', lat: 39.7950, lng: 116.3660 },
            { name: '高米店北', lat: 39.7730, lng: 116.3670 },
            { name: '高米店南', lat: 39.7630, lng: 116.3670 },
            { name: '枣园', lat: 39.7520, lng: 116.3640 },
            { name: '清源路', lat: 39.7420, lng: 116.3640 },
            { name: '黄村西大街', lat: 39.7320, lng: 116.3390 },
            { name: '黄村火车站', lat: 39.7260, lng: 116.3380 },
            { name: '义和庄', lat: 39.7130, lng: 116.3280 },
            { name: '生物医药基地', lat: 39.6980, lng: 116.3190 },
            { name: '天宫院', lat: 39.6880, lng: 116.3180 }
        ]
    },
    // 上海地铁1号线示例数据
    'shanghai-line1': {
        name: '上海地铁1号线',
        color: '#E4002B',
        stations: [
            { name: '富锦路', lat: 31.3933, lng: 121.4250 },
            { name: '友谊西路', lat: 31.3833, lng: 121.4250 },
            { name: '宝安公路', lat: 31.3733, lng: 121.4250 },
            { name: '共富新村', lat: 31.3633, lng: 121.4250 },
            { name: '呼兰路', lat: 31.3533, lng: 121.4250 },
            { name: '通河新村', lat: 31.3433, lng: 121.4250 },
            { name: '共康路', lat: 31.3333, lng: 121.4250 },
            { name: '彭浦新村', lat: 31.3233, lng: 121.4250 },
            { name: '汶水路', lat: 31.3133, lng: 121.4250 },
            { name: '上海马戏城', lat: 31.3033, lng: 121.4250 },
            { name: '延长路', lat: 31.2933, lng: 121.4250 },
            { name: '中山北路', lat: 31.2833, lng: 121.4250 },
            { name: '上海火车站', lat: 31.2533, lng: 121.4550 },
            { name: '汉中路', lat: 31.2433, lng: 121.4550 },
            { name: '新闸路', lat: 31.2333, lng: 121.4650 },
            { name: '人民广场', lat: 31.2333, lng: 121.4750 },
            { name: '黄陂南路', lat: 31.2233, lng: 121.4750 },
            { name: '陕西南路', lat: 31.2133, lng: 121.4750 },
            { name: '常熟路', lat: 31.2033, lng: 121.4750 },
            { name: '衡山路', lat: 31.1933, lng: 121.4750 },
            { name: '徐家汇', lat: 31.1833, lng: 121.4750 },
            { name: '上海体育馆', lat: 31.1733, lng: 121.4750 },
            { name: '漕宝路', lat: 31.1633, lng: 121.4750 },
            { name: '上海南站', lat: 31.1533, lng: 121.4750 },
            { name: '锦江乐园', lat: 31.1433, lng: 121.4750 },
            { name: '莲花路', lat: 31.1333, lng: 121.4750 },
            { name: '外环路', lat: 31.1233, lng: 121.4750 },
            { name: '莘庄', lat: 31.1133, lng: 121.4750 }
        ]
    }
};

// 获取所有线路列表
function getAllLines() {
    return Object.keys(SUBWAY_LINES).map(key => ({
        id: key,
        name: SUBWAY_LINES[key].name,
        color: SUBWAY_LINES[key].color
    }));
}

// 根据坐标查找最近的地铁站
function findNearestStation(lat, lng, lineId) {
    if (!lineId || !SUBWAY_LINES[lineId]) {
        return null;
    }

    const line = SUBWAY_LINES[lineId];
    let nearestStation = null;
    let minDistance = Infinity;

    line.stations.forEach(station => {
        const distance = calculateDistance(lat, lng, station.lat, station.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearestStation = { ...station, distance };
        }
    });

    return nearestStation;
}

// 计算两点之间的距离（公里）
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 判断点是否在地铁线路附近（阈值：500米）
function isNearSubwayLine(lat, lng, lineId, threshold = 0.5) {
    const nearestStation = findNearestStation(lat, lng, lineId);
    return nearestStation && nearestStation.distance <= threshold;
}

// 获取线路上的投影点（用于显示当前位置）
function getProjectedPoint(lat, lng, lineId) {
    if (!lineId || !SUBWAY_LINES[lineId]) {
        return null;
    }

    const line = SUBWAY_LINES[lineId];
    const stations = line.stations;
    
    if (stations.length < 2) {
        return null;
    }

    let minDistance = Infinity;
    let projectedPoint = null;
    let segmentIndex = -1;

    // 遍历所有线段，找到最近的投影点
    for (let i = 0; i < stations.length - 1; i++) {
        const p1 = stations[i];
        const p2 = stations[i + 1];
        
        const projection = projectPointOnSegment(lat, lng, p1.lat, p1.lng, p2.lat, p2.lng);
        const distance = calculateDistance(lat, lng, projection.lat, projection.lng);
        
        if (distance < minDistance) {
            minDistance = distance;
            projectedPoint = projection;
            segmentIndex = i;
        }
    }

    return {
        ...projectedPoint,
        distance: minDistance,
        segmentIndex,
        station1: stations[segmentIndex],
        station2: stations[segmentIndex + 1]
    };
}

// 计算点到线段的投影点
function projectPointOnSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length2 = dx * dx + dy * dy;
    
    if (length2 === 0) {
        return { lat: x1, lng: y1 };
    }
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / length2));
    
    return {
        lat: x1 + t * dx,
        lng: y1 + t * dy
    };
}

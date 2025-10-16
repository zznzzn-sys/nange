// maps.js - 游戏地图和关卡生成系统

class Tile {
    constructor(type = 'floor', x = 0, y = 0) {
        this.type = type; // floor, wall, obstacle, portal, etc.
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.isSolid = this.type === 'wall' || this.type === 'obstacle';
        this.isWalkable = !this.isSolid;
        this.sprite = null;
        this.decorations = [];
        this.lightLevel = 1.0;
        this.isVisited = false;
        this.isVisible = false;
        this.properties = {};
    }
    
    setType(type) {
        this.type = type;
        this.isSolid = type === 'wall' || type === 'obstacle';
        this.isWalkable = !this.isSolid;
        return this;
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    
    setSprite(sprite) {
        this.sprite = sprite;
        return this;
    }
    
    addDecoration(decoration) {
        this.decorations.push(decoration);
        return this;
    }
    
    setLightLevel(level) {
        this.lightLevel = Math.max(0, Math.min(1, level));
        return this;
    }
    
    setProperty(key, value) {
        this.properties[key] = value;
        return this;
    }
    
    getProperty(key, defaultValue = null) {
        return this.properties[key] !== undefined ? this.properties[key] : defaultValue;
    }
    
    toJSON() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            decorations: this.decorations,
            properties: this.properties
        };
    }
    
    static fromJSON(data, x, y) {
        const tile = new Tile(data.type, x, y);
        if (data.decorations) {
            tile.decorations = data.decorations;
        }
        if (data.properties) {
            tile.properties = data.properties;
        }
        return tile;
    }
}

class Map {
    constructor(width = 20, height = 20) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.spawnPoint = { x: 0, y: 0 };
        this.exitPoint = { x: 0, y: 0 };
        this.obstacles = [];
        this.decorations = [];
        this.enemySpawnPoints = [];
        this.itemSpawnPoints = [];
        this.name = 'Dungeon Level';
        this.level = 1;
        this.difficulty = 1;
        this.seed = Math.random();
        this.roomCount = 0;
        this.corridorCount = 0;
        this.lastGeneratedTime = Date.now();
        
        // 初始化地图
        this.initializeMap();
    }
    
    initializeMap() {
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                // 默认创建墙壁
                row.push(new Tile('wall', x, y));
            }
            this.tiles.push(row);
        }
    }
    
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.tiles[y][x];
    }
    
    setTile(x, y, type) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        this.tiles[y][x].setType(type);
        return true;
    }
    
    getTileAtWorldPosition(worldX, worldY) {
        const tileX = Math.floor(worldX / 40);
        const tileY = Math.floor(worldY / 40);
        return this.getTile(tileX, tileY);
    }
    
    isPositionWalkable(x, y) {
        const tile = this.getTile(x, y);
        return tile ? tile.isWalkable : false;
    }
    
    isPositionSolid(x, y) {
        const tile = this.getTile(x, y);
        return tile ? tile.isSolid : true;
    }
    
    getWorldPosition(x, y) {
        return {
            x: x * 40 + 20,
            y: y * 40 + 20
        };
    }
    
    getTilePosition(worldX, worldY) {
        return {
            x: Math.floor(worldX / 40),
            y: Math.floor(worldY / 40)
        };
    }
    
    setSpawnPoint(x, y) {
        this.spawnPoint = { x, y };
        return this;
    }
    
    setExitPoint(x, y) {
        this.exitPoint = { x, y };
        return this;
    }
    
    addEnemySpawnPoint(x, y) {
        this.enemySpawnPoints.push({ x, y });
        return this;
    }
    
    addItemSpawnPoint(x, y) {
        this.itemSpawnPoints.push({ x, y });
        return this;
    }
    
    clearEnemySpawnPoints() {
        this.enemySpawnPoints = [];
        return this;
    }
    
    clearItemSpawnPoints() {
        this.itemSpawnPoints = [];
        return this;
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        return this;
    }
    
    setLevel(level) {
        this.level = level;
        this.difficulty = level;
        return this;
    }
    
    setSeed(seed) {
        this.seed = seed;
        return this;
    }
    
    // 获取随机敌人出生点
    getRandomEnemySpawnPoint() {
        if (this.enemySpawnPoints.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * this.enemySpawnPoints.length);
        return this.enemySpawnPoints[randomIndex];
    }
    
    // 获取随机物品出生点
    getRandomItemSpawnPoint() {
        if (this.itemSpawnPoints.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * this.itemSpawnPoints.length);
        return this.itemSpawnPoints[randomIndex];
    }
    
    // 导出地图为JSON
    toJSON() {
        const jsonTiles = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push(this.tiles[y][x].toJSON());
            }
            jsonTiles.push(row);
        }
        
        return {
            width: this.width,
            height: this.height,
            tiles: jsonTiles,
            spawnPoint: this.spawnPoint,
            exitPoint: this.exitPoint,
            name: this.name,
            level: this.level,
            difficulty: this.difficulty,
            seed: this.seed,
            roomCount: this.roomCount,
            corridorCount: this.corridorCount
        };
    }
    
    // 从JSON加载地图
    static fromJSON(json) {
        const map = new Map(json.width, json.height);
        map.name = json.name;
        map.level = json.level;
        map.difficulty = json.difficulty;
        map.seed = json.seed;
        map.roomCount = json.roomCount || 0;
        map.corridorCount = json.corridorCount || 0;
        
        // 加载瓦片
        for (let y = 0; y < json.height; y++) {
            for (let x = 0; x < json.width; x++) {
                map.tiles[y][x] = Tile.fromJSON(json.tiles[y][x], x, y);
            }
        }
        
        // 设置出生点和出口
        if (json.spawnPoint) {
            map.spawnPoint = json.spawnPoint;
        }
        if (json.exitPoint) {
            map.exitPoint = json.exitPoint;
        }
        
        return map;
    }
    
    // 重置地图
    reset() {
        this.initializeMap();
        this.spawnPoint = { x: 0, y: 0 };
        this.exitPoint = { x: 0, y: 0 };
        this.obstacles = [];
        this.decorations = [];
        this.enemySpawnPoints = [];
        this.itemSpawnPoints = [];
        this.roomCount = 0;
        this.corridorCount = 0;
        return this;
    }
    
    // 检查两个瓦片之间是否有视线
    hasLineOfSight(x1, y1, x2, y2) {
        // 简化版视线算法
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        while (x1 !== x2 || y1 !== y2) {
            if (this.isPositionSolid(x1, y1)) {
                return false;
            }
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x1 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y1 += sy;
            }
        }
        
        return true;
    }
    
    // 获取相邻的瓦片
    getNeighbors(x, y, includeDiagonals = false) {
        const neighbors = [];
        const directions = includeDiagonals ? 
            [[0, -1], [1, 0], [0, 1], [-1, 0], [-1, -1], [1, -1], [1, 1], [-1, 1]] : 
            [[0, -1], [1, 0], [0, 1], [-1, 0]];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            const tile = this.getTile(nx, ny);
            if (tile) {
                neighbors.push(tile);
            }
        }
        
        return neighbors;
    }
    
    // 查找路径（简化版A*算法）
    findPath(startX, startY, endX, endY) {
        // 简化的路径查找实现
        const openSet = [{ x: startX, y: startY, cost: 0, heuristic: this.heuristic(startX, startY, endX, endY), parent: null }];
        const closedSet = new Set();
        
        while (openSet.length > 0) {
            // 按总代价排序
            openSet.sort((a, b) => (a.cost + a.heuristic) - (b.cost + b.heuristic));
            const current = openSet.shift();
            
            // 检查是否到达终点
            if (current.x === endX && current.y === endY) {
                return this.reconstructPath(current);
            }
            
            // 添加到已访问集合
            closedSet.add(`${current.x},${current.y}`);
            
            // 检查相邻瓦片
            const neighbors = this.getNeighbors(current.x, current.y);
            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                
                // 如果是墙壁或者已经访问过
                if (!neighbor.isWalkable || closedSet.has(key)) {
                    continue;
                }
                
                // 计算代价
                const newCost = current.cost + 1;
                const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
                
                if (!existingNode) {
                    // 添加新节点
                    openSet.push({
                        x: neighbor.x,
                        y: neighbor.y,
                        cost: newCost,
                        heuristic: this.heuristic(neighbor.x, neighbor.y, endX, endY),
                        parent: current
                    });
                } else if (newCost < existingNode.cost) {
                    // 更新现有节点
                    existingNode.cost = newCost;
                    existingNode.parent = current;
                }
            }
        }
        
        // 没有找到路径
        return null;
    }
    
    // 启发式函数
    heuristic(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
    
    // 重建路径
    reconstructPath(node) {
        const path = [];
        let current = node;
        
        while (current) {
            path.unshift({ x: current.x, y: current.y });
            current = current.parent;
        }
        
        return path;
    }
}

class MapGenerator {
    constructor(seed = null) {
        this.seed = seed !== null ? seed : Math.random();
        this.currentSeed = this.seed;
    }
    
    // 使用种子初始化随机数生成器
    setSeed(seed) {
        this.seed = seed;
        this.currentSeed = seed;
        return this;
    }
    
    // 生成伪随机数
    random(min = 0, max = 1) {
        // 简单的线性同余生成器
        this.currentSeed = (this.currentSeed * 9301 + 49297) % 233280;
        const rnd = this.currentSeed / 233280;
        return min + rnd * (max - min);
    }
    
    // 生成随机整数
    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    }
    
    // 生成一个新地图
    generateMap(width = 40, height = 40, level = 1, roomCount = 10) {
        const map = new Map(width, height);
        map.setLevel(level);
        map.setSeed(this.seed);
        map.name = `Dungeon Level ${level}`;
        
        // 重置种子
        this.currentSeed = this.seed;
        
        // 使用地牢生成算法
        this.generateDungeon(map, roomCount);
        
        // 添加装饰和细节
        this.addDecorations(map);
        
        // 设置敌人和物品生成点
        this.setSpawnPoints(map);
        
        return map;
    }
    
    // 使用BSP（二叉空间分区）算法生成地牢
    generateDungeon(map, roomCount) {
        const rooms = [];
        const corridors = [];
        
        // 定义初始区域
        const regions = [{ x: 2, y: 2, width: map.width - 4, height: map.height - 4 }];
        
        // 分区直到达到足够的区域数
        while (regions.length < roomCount * 2) {
            const newRegions = [];
            
            for (const region of regions) {
                // 决定是水平分割还是垂直分割
                const splitHorizontal = region.width > region.height && region.width > 15;
                
                if (splitHorizontal && region.width > 15) {
                    // 水平分割
                    const splitPos = this.randomInt(5, region.width - 5);
                    newRegions.push({
                        x: region.x,
                        y: region.y,
                        width: splitPos,
                        height: region.height
                    });
                    newRegions.push({
                        x: region.x + splitPos,
                        y: region.y,
                        width: region.width - splitPos,
                        height: region.height
                    });
                } else if (!splitHorizontal && region.height > 15) {
                    // 垂直分割
                    const splitPos = this.randomInt(5, region.height - 5);
                    newRegions.push({
                        x: region.x,
                        y: region.y,
                        width: region.width,
                        height: splitPos
                    });
                    newRegions.push({
                        x: region.x,
                        y: region.y + splitPos,
                        width: region.width,
                        height: region.height - splitPos
                    });
                } else {
                    // 无法分割，添加到新区域
                    newRegions.push(region);
                }
            }
            
            regions.length = 0;
            newRegions.forEach(r => regions.push(r));
        }
        
        // 从区域生成房间
        for (const region of regions) {
            // 随机房间大小（比区域小一些）
            const roomWidth = this.randomInt(Math.max(3, region.width - 4), region.width - 2);
            const roomHeight = this.randomInt(Math.max(3, region.height - 4), region.height - 2);
            const roomX = region.x + this.randomInt(1, region.width - roomWidth - 1);
            const roomY = region.y + this.randomInt(1, region.height - roomHeight - 1);
            
            const room = {
                x: roomX,
                y: roomY,
                width: roomWidth,
                height: roomHeight,
                centerX: Math.floor(roomX + roomWidth / 2),
                centerY: Math.floor(roomY + roomHeight / 2)
            };
            
            // 绘制房间
            for (let y = roomY; y < roomY + roomHeight; y++) {
                for (let x = roomX; x < roomX + roomWidth; x++) {
                    map.setTile(x, y, 'floor');
                }
            }
            
            rooms.push(room);
        }
        
        // 连接房间（简单的连接方式，实际可以使用最小生成树）
        for (let i = 1; i < rooms.length; i++) {
            this.connectRooms(map, rooms[i - 1], rooms[i]);
        }
        
        map.roomCount = rooms.length;
        map.corridorCount = corridors.length;
        
        // 设置出生点和出口
        if (rooms.length > 0) {
            map.setSpawnPoint(rooms[0].centerX, rooms[0].centerY);
            
            // 出口放在最后一个房间
            if (rooms.length > 1) {
                const lastRoom = rooms[rooms.length - 1];
                map.setExitPoint(lastRoom.centerX, lastRoom.centerY);
                map.setTile(lastRoom.centerX, lastRoom.centerY, 'portal');
            }
        }
    }
    
    // 连接两个房间
    connectRooms(map, roomA, roomB) {
        const x1 = roomA.centerX;
        const y1 = roomA.centerY;
        const x2 = roomB.centerX;
        const y2 = roomB.centerY;
        
        // 先水平再垂直，或者先垂直再水平
        if (this.random() < 0.5) {
            // 水平再垂直
            this.createHorizontalCorridor(map, x1, x2, y1);
            this.createVerticalCorridor(map, y1, y2, x2);
        } else {
            // 垂直再水平
            this.createVerticalCorridor(map, y1, y2, x1);
            this.createHorizontalCorridor(map, x1, x2, y2);
        }
    }
    
    // 创建水平走廊
    createHorizontalCorridor(map, x1, x2, y) {
        const startX = Math.min(x1, x2);
        const endX = Math.max(x1, x2);
        
        for (let x = startX; x <= endX; x++) {
            map.setTile(x, y, 'floor');
            
            // 填充走廊上下的墙壁
            if (y > 0) map.setTile(x, y - 1, 'wall');
            if (y < map.height - 1) map.setTile(x, y + 1, 'wall');
        }
    }
    
    // 创建垂直走廊
    createVerticalCorridor(map, y1, y2, x) {
        const startY = Math.min(y1, y2);
        const endY = Math.max(y1, y2);
        
        for (let y = startY; y <= endY; y++) {
            map.setTile(x, y, 'floor');
            
            // 填充走廊左右的墙壁
            if (x > 0) map.setTile(x - 1, y, 'wall');
            if (x < map.width - 1) map.setTile(x + 1, y, 'wall');
        }
    }
    
    // 添加装饰和细节
    addDecorations(map) {
        // 添加一些障碍物
        const obstacleCount = Math.floor((map.width * map.height) / 100);
        
        for (let i = 0; i < obstacleCount; i++) {
            const x = this.randomInt(1, map.width - 2);
            const y = this.randomInt(1, map.height - 2);
            
            // 确保不阻塞关键路径
            if (map.getTile(x, y).type === 'floor' && 
                this.isNotNearSpawn(map, x, y) && 
                this.isNotNearExit(map, x, y)) {
                
                // 只在有足够空间的地方放置障碍物
                let hasSpace = true;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const tile = map.getTile(x + dx, y + dy);
                        if (!tile || tile.isSolid) {
                            hasSpace = false;
                            break;
                        }
                    }
                    if (!hasSpace) break;
                }
                
                if (hasSpace) {
                    map.setTile(x, y, 'obstacle');
                }
            }
        }
        
        // 添加一些装饰物
        const decorationCount = Math.floor((map.width * map.height) / 50);
        
        for (let i = 0; i < decorationCount; i++) {
            const x = this.randomInt(1, map.width - 2);
            const y = this.randomInt(1, map.height - 2);
            
            if (map.getTile(x, y).type === 'floor' && !map.getTile(x, y).isSolid) {
                const decorTypes = ['barrel', 'crate', 'torch', 'table', 'chair', 'rock', 'plant'];
                const decorType = decorTypes[this.randomInt(0, decorTypes.length - 1)];
                
                map.getTile(x, y).addDecoration({
                    type: decorType,
                    rotation: this.random(0, Math.PI * 2)
                });
            }
        }
    }
    
    // 检查是否不在出生点附近
    isNotNearSpawn(map, x, y) {
        const dx = Math.abs(x - map.spawnPoint.x);
        const dy = Math.abs(y - map.spawnPoint.y);
        return dx > 3 || dy > 3;
    }
    
    // 检查是否不在出口附近
    isNotNearExit(map, x, y) {
        const dx = Math.abs(x - map.exitPoint.x);
        const dy = Math.abs(y - map.exitPoint.y);
        return dx > 3 || dy > 3;
    }
    
    // 设置敌人和物品生成点
    setSpawnPoints(map) {
        // 为每个房间添加生成点
        for (let y = 1; y < map.height - 1; y++) {
            for (let x = 1; x < map.width - 1; x++) {
                const tile = map.getTile(x, y);
                
                // 只在地板上设置生成点
                if (tile.type === 'floor' && 
                    !tile.isSolid && 
                    this.isNotNearSpawn(map, x, y)) {
                    
                    // 随机决定是敌人还是物品生成点
                    if (this.random() < 0.7) {
                        // 70% 概率为敌人生成点
                        map.addEnemySpawnPoint(x, y);
                    } else if (this.random() < 0.5) {
                        // 15% 概率为物品生成点
                        map.addItemSpawnPoint(x, y);
                    }
                }
            }
        }
        
        // 确保有足够的生成点
        if (map.enemySpawnPoints.length < 5) {
            // 添加更多敌人生成点
            this.addMoreEnemySpawnPoints(map, 10);
        }
        
        if (map.itemSpawnPoints.length < 3) {
            // 添加更多物品生成点
            this.addMoreItemSpawnPoints(map, 5);
        }
    }
    
    // 添加更多敌人生成点
    addMoreEnemySpawnPoints(map, count) {
        let added = 0;
        
        for (let i = 0; i < count * 3; i++) { // 尝试多次
            const x = this.randomInt(1, map.width - 2);
            const y = this.randomInt(1, map.height - 2);
            
            if (map.getTile(x, y).type === 'floor' && 
                !map.getTile(x, y).isSolid && 
                this.isNotNearSpawn(map, x, y)) {
                
                map.addEnemySpawnPoint(x, y);
                added++;
                
                if (added >= count) {
                    break;
                }
            }
        }
    }
    
    // 添加更多物品生成点
    addMoreItemSpawnPoints(map, count) {
        let added = 0;
        
        for (let i = 0; i < count * 3; i++) { // 尝试多次
            const x = this.randomInt(1, map.width - 2);
            const y = this.randomInt(1, map.height - 2);
            
            if (map.getTile(x, y).type === 'floor' && 
                !map.getTile(x, y).isSolid) {
                
                map.addItemSpawnPoint(x, y);
                added++;
                
                if (added >= count) {
                    break;
                }
            }
        }
    }
    
    // 生成固定大小的小地图
    generateSmallMap() {
        return this.generateMap(20, 20, 1, 5);
    }
    
    // 生成中等大小的地图
    generateMediumMap() {
        return this.generateMap(30, 30, 1, 8);
    }
    
    // 生成大型地图
    generateLargeMap() {
        return this.generateMap(40, 40, 1, 12);
    }
}

class LevelGenerator {
    constructor() {
        this.mapGenerator = new MapGenerator();
        this.currentLevel = 1;
        this.difficultyScaling = 0.2;
        this.enemyTypes = [
            { type: 'basic', level: 1, weight: 1.0 },
            { type: 'fast', level: 2, weight: 0.5 },
            { type: 'tank', level: 3, weight: 0.3 },
            { type: 'ranged', level: 4, weight: 0.2 },
            { type: 'elite', level: 5, weight: 0.1 },
            { type: 'boss', level: 10, weight: 0.02 }
        ];
        this.waveConfig = this.createWaveConfig();
    }
    
    // 创建敌波配置
    createWaveConfig() {
        return {
            baseEnemiesPerWave: 5,
            enemiesPerWaveScaling: 2,
            wavesPerLevel: 5,
            bossWaveInterval: 5,
            eliteSpawnChanceBase: 0.05,
            eliteSpawnChanceScaling: 0.02
        };
    }
    
    // 生成关卡
    generateLevel(level = 1) {
        this.currentLevel = level;
        
        // 基于关卡生成随机种子
        const seed = (level * 12345) % 1000000;
        this.mapGenerator.setSeed(seed);
        
        // 根据关卡选择地图大小
        let map;
        if (level <= 3) {
            map = this.mapGenerator.generateSmallMap();
        } else if (level <= 7) {
            map = this.mapGenerator.generateMediumMap();
        } else {
            map = this.mapGenerator.generateLargeMap();
        }
        
        // 设置地图等级和难度
        map.setLevel(level);
        map.setDifficulty(level);
        
        // 生成敌波
        const waves = this.generateWaves(level);
        
        // 生成物品掉落表
        const lootTable = this.generateLootTable(level);
        
        return {
            map,
            waves,
            lootTable,
            level,
            difficulty: level,
            rewards: this.calculateRewards(level)
        };
    }
    
    // 生成敌波
    generateWaves(level) {
        const waves = [];
        const waveCount = this.waveConfig.wavesPerLevel;
        
        for (let waveNumber = 1; waveNumber <= waveCount; waveNumber++) {
            const isBossWave = (waveNumber === waveCount) && (level % this.waveConfig.bossWaveInterval === 0);
            const isEliteWave = waveNumber === Math.floor(waveCount / 2);
            
            // 计算波次难度
            const waveDifficulty = level + (waveNumber - 1) * 0.5;
            
            // 计算敌人数量
            let enemyCount = this.waveConfig.baseEnemiesPerWave + 
                            (level - 1) * this.waveConfig.enemiesPerWaveScaling;
            
            // 精英波次增加敌人数量
            if (isEliteWave) {
                enemyCount = Math.floor(enemyCount * 1.5);
            }
            
            // 生成敌人
            const enemies = [];
            
            if (isBossWave) {
                // 生成Boss
                enemies.push({
                    type: 'boss',
                    level: level,
                    health: this.calculateEnemyHealth('boss', level),
                    damage: this.calculateEnemyDamage('boss', level),
                    size: 2.0
                });
                
                // 添加一些随从
                const minionCount = Math.floor(level / 2) + 2;
                for (let i = 0; i < minionCount; i++) {
                    enemies.push({
                        type: 'basic',
                        level: Math.floor(level * 0.7),
                        health: this.calculateEnemyHealth('basic', Math.floor(level * 0.7)),
                        damage: this.calculateEnemyDamage('basic', Math.floor(level * 0.7))
                    });
                }
            } else {
                // 普通波次
                for (let i = 0; i < enemyCount; i++) {
                    const enemyType = this.selectEnemyType(waveDifficulty, isEliteWave);
                    
                    enemies.push({
                        type: enemyType,
                        level: waveDifficulty,
                        health: this.calculateEnemyHealth(enemyType, waveDifficulty),
                        damage: this.calculateEnemyDamage(enemyType, waveDifficulty)
                    });
                }
            }
            
            // 计算敌波间隔和准备时间
            const spawnInterval = Math.max(0.5, 2 - (level * 0.1)); // 随着关卡增加，生成间隔减小
            const preparationTime = Math.max(5, 15 - (level * 0.5)); // 随着关卡增加，准备时间减少
            
            waves.push({
                waveNumber,
                enemies,
                spawnInterval,
                preparationTime,
                isBossWave,
                isEliteWave,
                completed: false,
                startTime: 0,
                endTime: 0
            });
        }
        
        return waves;
    }
    
    // 选择敌人类型
    selectEnemyType(difficulty, isEliteWave = false) {
        // 过滤可用于当前难度的敌人类型
        const availableTypes = this.enemyTypes.filter(type => type.level <= difficulty);
        
        // 计算精英敌人的生成概率
        const eliteChance = this.waveConfig.eliteSpawnChanceBase + 
                           (difficulty - 1) * this.waveConfig.eliteSpawnChanceScaling;
        
        // 精英波次增加精英敌人概率
        const finalEliteChance = isEliteWave ? eliteChance * 2 : eliteChance;
        
        // 随机选择敌人类型
        let totalWeight = 0;
        availableTypes.forEach(type => {
            let weight = type.weight;
            
            // 精英波次增加精英权重
            if (isEliteWave && type.type === 'elite') {
                weight *= 3;
            }
            
            // 应用难度缩放
            const levelDiff = difficulty - type.level;
            if (levelDiff > 0) {
                weight *= Math.pow(1.1, levelDiff);
            }
            
            type.currentWeight = weight;
            totalWeight += weight;
        });
        
        // 如果精英敌人的概率触发
        if (Math.random() < finalEliteChance && availableTypes.some(type => type.type === 'elite')) {
            return 'elite';
        }
        
        // 按权重随机选择
        let random = Math.random() * totalWeight;
        
        for (const type of availableTypes) {
            random -= type.currentWeight;
            if (random <= 0) {
                return type.type;
            }
        }
        
        // 默认返回基本敌人
        return 'basic';
    }
    
    // 计算敌人生命值
    calculateEnemyHealth(type, level) {
        const baseHealth = {
            'basic': 100,
            'fast': 80,
            'tank': 200,
            'ranged': 90,
            'elite': 300,
            'boss': 1000
        };
        
        const health = baseHealth[type] * Math.pow(1 + this.difficultyScaling, level - 1);
        
        // 精英和Boss有额外生命值加成
        if (type === 'elite') {
            return health * 2;
        } else if (type === 'boss') {
            return health * 5;
        }
        
        return health;
    }
    
    // 计算敌人伤害
    calculateEnemyDamage(type, level) {
        const baseDamage = {
            'basic': 10,
            'fast': 8,
            'tank': 15,
            'ranged': 12,
            'elite': 20,
            'boss': 30
        };
        
        const damage = baseDamage[type] * Math.pow(1 + this.difficultyScaling, level - 1);
        
        // 精英和Boss有额外伤害加成
        if (type === 'elite') {
            return damage * 1.5;
        } else if (type === 'boss') {
            return damage * 2;
        }
        
        return damage;
    }
    
    // 生成物品掉落表
    generateLootTable(level) {
        const baseItems = [
            { type: 'healthPotion', chance: 0.3, minAmount: 1, maxAmount: 2 },
            { type: 'gold', chance: 0.8, minAmount: 10, maxAmount: 50 },
            { type: 'experience', chance: 1.0, minAmount: 15, maxAmount: 30 }
        ];
        
        // 随关卡解锁更多物品
        const advancedItems = [];
        
        if (level >= 2) {
            advancedItems.push({ type: 'shieldPotion', chance: 0.15, minAmount: 1, maxAmount: 1 });
        }
        
        if (level >= 3) {
            advancedItems.push({ type: 'attackSpeedPotion', chance: 0.1, minAmount: 1, maxAmount: 1 });
        }
        
        if (level >= 4) {
            advancedItems.push({ type: 'damagePotion', chance: 0.1, minAmount: 1, maxAmount: 1 });
        }
        
        if (level >= 5) {
            advancedItems.push({ type: 'goldBag', chance: 0.05, minAmount: 1, maxAmount: 1 });
        }
        
        if (level >= 7) {
            advancedItems.push({ type: 'experienceOrb', chance: 0.05, minAmount: 1, maxAmount: 1 });
        }
        
        // 精英和Boss有特殊掉落
        const eliteDrops = [
            { type: 'rareItem', chance: 0.3, minAmount: 1, maxAmount: 1 }
        ];
        
        const bossDrops = [
            { type: 'epicItem', chance: 0.5, minAmount: 1, maxAmount: 1 },
            { type: 'legendaryItem', chance: 0.1, minAmount: 1, maxAmount: 1 }
        ];
        
        return {
            baseItems,
            advancedItems,
            eliteDrops,
            bossDrops,
            // 随关卡增加掉落率
            dropRateMultiplier: 1 + (level - 1) * 0.05
        };
    }
    
    // 计算关卡奖励
    calculateRewards(level) {
        // 基础奖励
        const baseGold = 100;
        const baseExperience = 200;
        const baseScore = 500;
        
        // 随关卡增加的奖励
        const gold = Math.floor(baseGold * Math.pow(1.5, level - 1));
        const experience = Math.floor(baseExperience * Math.pow(1.5, level - 1));
        const score = Math.floor(baseScore * Math.pow(1.5, level - 1));
        
        // 精英波次和Boss波次的额外奖励
        const bonusGold = level % this.waveConfig.bossWaveInterval === 0 ? gold * 0.5 : 0;
        const bonusExperience = level % this.waveConfig.bossWaveInterval === 0 ? experience * 0.5 : 0;
        
        return {
            gold: gold + bonusGold,
            experience: experience + bonusExperience,
            score,
            bonusItems: this.generateBonusItems(level)
        };
    }
    
    // 生成额外物品奖励
    generateBonusItems(level) {
        const items = [];
        const itemTypes = ['healthPotion', 'shieldPotion', 'attackSpeedPotion', 'damagePotion'];
        
        // 根据关卡决定奖励物品数量
        const itemCount = Math.floor(level / 2) + 1;
        
        for (let i = 0; i < itemCount; i++) {
            // 随着关卡增加，高级物品概率增加
            const randomTypeIndex = Math.min(
                Math.floor(Math.random() * itemTypes.length * (1 + (level - 1) * 0.1)),
                itemTypes.length - 1
            );
            
            items.push(itemTypes[randomTypeIndex]);
        }
        
        return items;
    }
    
    // 检查是否为Boss关卡
    isBossLevel(level) {
        return level % this.waveConfig.bossWaveInterval === 0;
    }
    
    // 获取当前关卡
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    // 生成下一关
    generateNextLevel() {
        return this.generateLevel(this.currentLevel + 1);
    }
}

// 地图模块定义完成
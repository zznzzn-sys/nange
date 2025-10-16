// game.js - 游戏核心逻辑和主循环

class Game {
    constructor() {
        // 游戏画布和上下文
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏状态
        this.state = 'start'; // start, characterSelect, playing, pause, shop, upgrade, gameOver
        
        // 游戏配置
        this.config = {
            soundVolume: 80,
            musicVolume: 50,
            difficulty: 'normal',
            isMobile: false
        };
        
        // 游戏数据
        this.data = {
            player: null,
            enemies: [],
            weapons: [],
            projectiles: [],
            items: [],
            particles: [],
            waves: [],
            currentWave: 1,
            maxWaves: 100, // 增加最大波次到100波，让游戏可以持续更久
            waveTimer: 0,
            waveDuration: 30,
            shopTime: 15,
            score: 0,
            money: 0,
            highScore: localStorage.getItem('potatoBrosHighScore') || 0,
            keys: {
                w: false, a: false, s: false, d: false,
                space: false,
                shift: false,
                '1': false, '2': false, '3': false
            },
            mouse: {
                x: 0,
                y: 0,
                isDown: false
            }
        };
        
        // 游戏资源
        this.resources = {
            images: {},
            sounds: {},
            fonts: {}
        };
        
        // 时间管理
        this.time = {
            deltaTime: 0,
            lastTime: 0,
            gameTime: 0,
            waveTime: 0,
            shopTimeRemaining: 0
        };
        
        // 碰撞检测
        this.collisionGrid = {
            cellSize: 64,
            grid: []
        };
        
        // 初始化游戏
        this.init();
    }
    
    // 初始化游戏
    init() {
        // 设置画布尺寸
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 加载游戏资源
        this.loadResources();
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 设置c键全局监听器
        this.setupCKeyListener();
        
        // 初始化碰撞网格
        this.initializeCollisionGrid();
        
        // 开始游戏循环
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    // 调整画布尺寸
    resizeCanvas() {
        const container = document.getElementById('game-container');
        
        if (window.innerWidth < 850 || window.innerHeight < 650) {
            this.config.isMobile = true;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        } else {
            this.config.isMobile = false;
            this.canvas.width = 800;
            this.canvas.height = 600;
        }
        
        // 重新初始化碰撞网格
        this.initializeCollisionGrid();
    }
    
    // 加载游戏资源
    loadResources() {
        console.log('加载游戏资源...');
        
        // 这里可以加载图片、音频等资源
        // 由于没有实际资源，使用占位符
        
        // 模拟资源加载完成
        setTimeout(() => {
            console.log('资源加载完成');
        }, 1000);
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 键盘事件 - 使用bind确保this指向正确
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // 鼠标事件
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.handleMouseDown(e);
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.handleMouseUp(e);
        });
        
        // 触摸事件（移动端）
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        });
        
        // UI事件监听将在ui.js中处理
    }
    
    // 初始化碰撞网格
    initializeCollisionGrid() {
        const cols = Math.ceil(this.canvas.width / this.collisionGrid.cellSize);
        const rows = Math.ceil(this.canvas.height / this.collisionGrid.cellSize);
        
        this.collisionGrid.grid = [];
        for (let i = 0; i < rows; i++) {
            this.collisionGrid.grid[i] = [];
            for (let j = 0; j < cols; j++) {
                this.collisionGrid.grid[i][j] = [];
            }
        }
    }
    
    // 键盘按下处理
    handleKeyDown(e) {
        console.log('键盘按键按下:', e.key);
        
        // 为c键添加preventDefault，防止任何可能的默认行为
        if (e.key.toLowerCase() === 'c') {
            e.preventDefault();
            console.log('检测到c键按下，调用jumpToBossWave方法');
            // 跳转到BOSS波
            this.jumpToBossWave();
            return; // 提前返回，避免继续执行switch
        }
        
        // 按下T键测试特殊敌人（远程和治疗师）
        if (e.key.toLowerCase() === 't') {
            e.preventDefault();
            console.log("测试特殊敌人生成：清除当前敌人，生成测试波次");
            
            // 清除当前所有敌人
            this.data.enemies = [];
            
            // 设置测试波次数据
            const testWaveNumber = 8; // 使用第8波的配置，包含远程和治疗师
            const testEnemyCount = 5;
            const testEnemyTypes = ['ranged', 'healer'];
            const difficultyMultiplier = this.getDifficultyMultiplier();
            
            // 记录测试波次
            this.data.waves[testWaveNumber] = {
                enemyCount: testEnemyCount,
                enemyTypes: testEnemyTypes,
                requiredEnemyTypes: ['ranged', 'healer'],
                minRangedEnemies: 3,
                minHealerEnemies: 2,
                enemiesSpawned: 0,
                enemiesKilled: 0
            };
            
            // 生成测试波次敌人
            console.log("测试波次：生成3个远程敌人和2个治疗师敌人");
            this.spawnWaveEnemies(testWaveNumber, testEnemyCount, testEnemyTypes, difficultyMultiplier);
            return; // 提前返回，避免继续执行switch
        }
        
        switch (e.key.toLowerCase()) {
            case 'w': this.data.keys.w = true; break;
            case 'a': this.data.keys.a = true; break;
            case 's': this.data.keys.s = true; break;
            case 'd': this.data.keys.d = true; break;
            case ' ': this.data.keys.space = true; e.preventDefault(); break;
            case 'shift': this.data.keys.shift = true; break;
            case '1': this.data.keys['1'] = true; break;
            case '2': this.data.keys['2'] = true; break;
            case '3': this.data.keys['3'] = true; break;
            case 'p': 
                if (this.state === 'playing') {
                    this.togglePause();
                    e.preventDefault();
                }
                break;
            case 'escape':
                this.handleEscape();
                e.preventDefault();
                break;
        }
    }
    
    // 键盘释放处理
    handleKeyUp(e) {
        switch (e.key.toLowerCase()) {
            case 'w': this.data.keys.w = false; break;
            case 'a': this.data.keys.a = false; break;
            case 's': this.data.keys.s = false; break;
            case 'd': this.data.keys.d = false; break;
            case ' ': this.data.keys.space = false; break;
            case 'shift': this.data.keys.shift = false; break;
            case '1': this.data.keys['1'] = false; break;
            case '2': this.data.keys['2'] = false; break;
            case '3': this.data.keys['3'] = false; break;
        }
    }
    
    // 鼠标移动处理
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.data.mouse.x = e.clientX - rect.left;
        this.data.mouse.y = e.clientY - rect.top;
    }
    
    // 鼠标按下处理
    handleMouseDown(e) {
        this.data.mouse.isDown = true;
    }
    
    // 鼠标释放处理
    handleMouseUp(e) {
        this.data.mouse.isDown = false;
    }
    
    // 触摸移动处理
    handleTouchMove(e) {
        if (e.touches.length > 0) {
            const rect = this.canvas.getBoundingClientRect();
            this.data.mouse.x = e.touches[0].clientX - rect.left;
            this.data.mouse.y = e.touches[0].clientY - rect.top;
        }
    }
    
    // 触摸开始处理
    handleTouchStart(e) {
        if (e.touches.length > 0) {
            const rect = this.canvas.getBoundingClientRect();
            this.data.mouse.x = e.touches[0].clientX - rect.left;
            this.data.mouse.y = e.touches[0].clientY - rect.top;
            this.data.mouse.isDown = true;
        }
    }
    
    // 触摸结束处理
    handleTouchEnd(e) {
        this.data.mouse.isDown = false;
    }
    
    // 处理ESC键
    handleEscape() {
        switch (this.state) {
            case 'playing':
                this.togglePause();
                break;
            case 'pause':
                this.togglePause();
                break;
            case 'shop':
            case 'upgrade':
                this.closeMenu();
                break;
        }
    }
    
    // 切换暂停状态
    togglePause() {
        if (this.state === 'playing') {
            this.state = 'pause';
            UI.showMenu('pauseMenu');
        } else if (this.state === 'pause') {
            this.state = 'playing';
            UI.hideMenu('pauseMenu');
        }
    }
    
    // 关闭菜单
    closeMenu() {
        if (this.state === 'shop') {
            this.state = 'playing';
            UI.hideMenu('shopMenu');
        } else if (this.state === 'upgrade') {
            this.state = 'playing';
            UI.hideMenu('upgradeMenu');
        }
    }
    
    // 跳转到BOSS波
    jumpToBossWave() {
        console.log('jumpToBossWave方法被调用！');
        
        // 显示一个明显的屏幕闪烁效果作为视觉反馈
        this.visualFeedback();
        
        // 直接设置为第20波（第一次BOSS波）
        const bossWave = 20;
        console.log(`从第${this.data.currentWave}波跳转到BOSS波第${bossWave}波`);
        
        // 清除当前所有敌人
        console.log('清除当前所有敌人，清除前数量:', this.data.enemies.length);
        this.data.enemies = [];
        
        // 清除当前波次的生成定时器（如果有的话）
        if (this.waveSpawnTimer) {
            console.log('清除生成定时器');
            clearInterval(this.waveSpawnTimer);
        }
        
        // 设置当前波次为BOSS波
        this.data.currentWave = bossWave;
        console.log('设置当前波次为:', bossWave);
        
        // 生成BOSS波
        console.log('开始生成BOSS波');
        this.generateWave(bossWave);
        
        // 显示通知
        console.log('显示跳转通知');
        this.addNotification(`直接跳转到BOSS波 - 第${bossWave}波！`);
        
        // 确保游戏状态为playing
        this.state = 'playing';
        console.log('确保游戏状态为playing');
    }
    
    // 全局c键监听器 - 确保能被正确捕获
    setupCKeyListener() {
        // 保存游戏实例引用
        const gameInstance = this;
        
        // 确保不会重复添加监听器
        if (!window._potatoBrosCKeyListenerAdded) {
            window._potatoBrosCKeyListenerAdded = true;
            
            // 直接在window上添加监听器
            window.addEventListener('keydown', function(e) {
                // 只处理c键
                if (e.key.toLowerCase() === 'c') {
                    e.preventDefault();
                    console.log('全局监听器检测到c键按下');
                    
                    // 直接调用jumpToBossWave方法
                    if (typeof gameInstance.jumpToBossWave === 'function') {
                        console.log('调用jumpToBossWave方法');
                        gameInstance.jumpToBossWave();
                    } else {
                        console.error('jumpToBossWave方法不存在');
                    }
                }
            });
            
            console.log('全局c键监听器已成功添加');
        }
    }
    
    // 添加视觉反馈方法
    visualFeedback() {
        // 创建一个全屏闪烁效果
        const flashElement = document.createElement('div');
        flashElement.style.position = 'fixed';
        flashElement.style.top = '0';
        flashElement.style.left = '0';
        flashElement.style.width = '100%';
        flashElement.style.height = '100%';
        flashElement.style.backgroundColor = 'rgba(255, 255, 0, 0.5)';
        flashElement.style.zIndex = '9999';
        flashElement.style.pointerEvents = 'none';
        document.body.appendChild(flashElement);
        
        // 100毫秒后移除闪烁效果
        setTimeout(() => {
            document.body.removeChild(flashElement);
        }, 100);
        
        // 同时播放一个声音（如果有音频系统）
        console.log('播放视觉反馈效果');
    }
    
    // 开始新游戏
    startNewGame() {
        console.log('开始新游戏');
        
        // 重置游戏数据
        this.resetGameData();
        
        // 创建玩家
        this.data.player = new Player(this.canvas.width / 2, this.canvas.height / 2, 'potato');
        
        // 开发测试模式：直接跳转到特定波次测试
        console.log('===== 开发测试模式 =====');
        console.log('1. 按C键跳转到第20波(BOSS波)');
        console.log('2. 按T键测试远程和治疗师敌人生成');
        this.data.currentWave = 1;
        
        // 生成第一波敌人
        this.generateWave(1);
        
        // 更新UI
        UI.updateStatusBar(this.data);
        
        // 切换到游戏状态
        this.state = 'playing';
    }
    
    // 重置游戏数据
    resetGameData() {
        this.data.enemies = [];
        this.data.weapons = [];
        this.data.projectiles = [];
        this.data.items = [];
        this.data.particles = [];
        this.data.waves = [];
        this.data.currentWave = 1;
        this.data.waveTimer = 0;
        this.data.score = 0;
        this.data.money = 0;
        
        this.time.gameTime = 0;
        this.time.waveTime = 0;
        this.time.shopTimeRemaining = 0;
    }
    
    // 生成敌波
    generateWave(waveNumber) {
        console.log(`生成第 ${waveNumber} 波敌人`);
        
        // 清除之前波次可能残留的敌人
        this.data.enemies = [];
        
        const difficultyMultiplier = this.getDifficultyMultiplier();
        
        // 根据波次决定可用的敌人类型 - 降低波次要求，让特殊敌人更早出现
        const allEnemyTypes = ['basic', 'fast', 'tank', 'ranged', 'healer', 'boss'];
        let availableEnemyTypes = [];
        
        // 第一波只有基础敌人
        if (waveNumber >= 1) availableEnemyTypes.push('basic');
        // 第2波开始出现快速敌人
        if (waveNumber >= 2) availableEnemyTypes.push('fast');
        // 第4波开始出现坦克敌人
        if (waveNumber >= 4) availableEnemyTypes.push('tank');
        // 第6波开始出现远程敌人（降低要求）
        if (waveNumber >= 6) availableEnemyTypes.push('ranged');
        // 第8波开始出现治疗师敌人（降低要求）
        if (waveNumber >= 8) availableEnemyTypes.push('healer');
        // 每20波出现一次BOSS（作为特殊波次）
        
        // 增加敌人数量随波次的增长速率
        const enemyCount = Math.floor(10 + (waveNumber - 1) * 8 * difficultyMultiplier);
        
        // 创建波次数据 - 确保所有必需属性都存在
        const waveData = {
            number: waveNumber,
            enemyCount: enemyCount,
            enemiesSpawned: 0,
            enemiesKilled: 0,
            requiredEnemyTypes: [],
            minRangedEnemies: 0,
            minHealerEnemies: 0,
            isBossWave: false,
            maxWaveTime: 0,
            startTime: this.time.gameTime
        };
        
        // 特殊处理：为特定波次确保生成远程和回血型敌人
        if (waveNumber === 6) {
            console.log('第6波：确保生成远程敌人');
            waveData.requiredEnemyTypes = ['ranged'];
            // 至少生成2个远程敌人
            waveData.minRangedEnemies = 2;
        }
        
        if (waveNumber === 8) {
            console.log('第8波：确保生成远程和治疗师敌人');
            waveData.requiredEnemyTypes = ['ranged', 'healer'];
            // 至少生成2个远程敌人和1个治疗师敌人
            waveData.minRangedEnemies = 2;
            waveData.minHealerEnemies = 1;
        }
        
        // 特殊处理：每20波出现BOSS
        if (waveNumber % 20 === 0 && waveNumber >= 20) {
            // 对于BOSS波，只生成BOSS，不生成其他敌人
            availableEnemyTypes = ['boss'];
            console.log(`第 ${waveNumber} 波是BOSS波！`);
            
            // BOSS波设置 - 持续时间为4分钟(240秒)
            waveData.isBossWave = true;
            waveData.maxWaveTime = 240; // 4分钟 = 240秒
            waveData.startTime = this.time.gameTime; // 记录波次开始时间
            
            // BOSS波只生成1个BOSS
            waveData.enemyCount = 1;
        }
        
        this.data.waves[waveNumber] = waveData;
        
        // 分批生成敌人
        this.spawnWaveEnemies(waveNumber, waveData.enemyCount, availableEnemyTypes, difficultyMultiplier);
    }
    
    // 生成波次敌人
    spawnWaveEnemies(waveNumber, enemyCount, enemyTypes, difficultyMultiplier) {
        const spawnRate = 0.5 + (waveNumber - 1) * 0.05; // 随着波次增加，生成速率加快
        let enemiesSpawned = 0;
        
        // 确保波次数据存在
        if (!this.data.waves[waveNumber]) {
            console.warn(`波次${waveNumber}数据不存在，创建默认数据`);
            this.data.waves[waveNumber] = {
                number: waveNumber,
                enemyCount: enemyCount,
                enemiesSpawned: 0,
                enemiesKilled: 0,
                requiredEnemyTypes: [],
                minRangedEnemies: 0,
                minHealerEnemies: 0,
                isBossWave: false,
                maxWaveTime: 0,
                startTime: this.time.gameTime
            };
        }
        
        // 特殊敌人计数器
        let specialEnemyCounts = {
            ranged: 0,
            healer: 0
        };
        
        // 获取波次数据
        const waveData = this.data.waves[waveNumber];
        const hasRequiredTypes = waveData.requiredEnemyTypes && waveData.requiredEnemyTypes.length > 0;
        
        console.log(`波次${waveNumber}配置 - 敌人数量: ${enemyCount}, 可用敌人类型: ${enemyTypes.join(', ')}, 生成速率: ${spawnRate}/秒`);
        if (hasRequiredTypes) {
            console.log(`波次${waveNumber}特殊要求 - 必须生成: ${waveData.requiredEnemyTypes.join(', ')}`);
        }
        
        // 保存定时器引用，以便在跳转到BOSS波时可以清除
        this.waveSpawnTimer = setInterval(() => {
            // 检查游戏状态和波次完成条件
            if (this.state !== 'playing' || enemiesSpawned >= enemyCount) {
                clearInterval(this.waveSpawnTimer);
                console.log(`波次${waveNumber}敌人生成完成: ${enemiesSpawned}/${enemyCount}`);
                return;
            }
            
            // 检查波次数据是否存在
            if (!this.data.waves[waveNumber]) {
                console.warn(`波次${waveNumber}数据不存在，跳过生成`);
                clearInterval(this.waveSpawnTimer);
                return;
            }
            
            // 确定要生成的敌人类型
            let randomType;
            
            // 检查是否需要先生成特殊敌人
            if (hasRequiredTypes) {
                // 检查是否还有必须生成的特殊敌人类型
                if (waveData.requiredEnemyTypes.includes('ranged') && specialEnemyCounts.ranged < (waveData.minRangedEnemies || 0)) {
                    randomType = 'ranged';
                    console.log(`波次${waveNumber}强制生成远程敌人`);
                } else if (waveData.requiredEnemyTypes.includes('healer') && specialEnemyCounts.healer < (waveData.minHealerEnemies || 0)) {
                    randomType = 'healer';
                    console.log(`波次${waveNumber}强制生成治疗师敌人`);
                } else {
                    // 所有必须的特殊敌人都已生成，正常随机选择
                    if (waveNumber >= 6 && enemyTypes.includes('ranged') && enemyTypes.includes('healer')) {
                        // 对于较高波次，使用加权随机选择
                        const weights = [];
                        const types = [];
                        
                        // 根据敌人类型分配权重
                        enemyTypes.forEach(type => {
                            types.push(type);
                            switch (type) {
                                case 'basic': weights.push(0.4); break;     // 40%概率
                                case 'fast': weights.push(0.2); break;      // 20%概率
                                case 'tank': weights.push(0.15); break;     // 15%概率
                                case 'ranged': weights.push(0.15); break;   // 15%概率
                                case 'healer': weights.push(0.1); break;    // 10%概率
                                default: weights.push(1); break;
                            }
                        });
                        
                        // 加权随机选择
                        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
                        let randomValue = Math.random() * totalWeight;
                        
                        for (let i = 0; i < weights.length; i++) {
                            randomValue -= weights[i];
                            if (randomValue <= 0) {
                                randomType = types[i];
                                break;
                            }
                        }
                    } else {
                        // 简单随机选择
                        randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
                    }
                }
            } else if (waveNumber >= 6 && enemyTypes.includes('ranged') && enemyTypes.includes('healer')) {
                // 对于较高波次，使用加权随机选择
                const weights = [];
                const types = [];
                
                // 根据敌人类型分配权重
                enemyTypes.forEach(type => {
                    types.push(type);
                    switch (type) {
                        case 'basic': weights.push(0.4); break;     // 40%概率
                        case 'fast': weights.push(0.2); break;      // 20%概率
                        case 'tank': weights.push(0.15); break;     // 15%概率
                        case 'ranged': weights.push(0.15); break;   // 15%概率
                        case 'healer': weights.push(0.1); break;    // 10%概率
                        default: weights.push(1); break;
                    }
                });
                
                // 加权随机选择
                const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
                let randomValue = Math.random() * totalWeight;
                
                for (let i = 0; i < weights.length; i++) {
                    randomValue -= weights[i];
                    if (randomValue <= 0) {
                        randomType = types[i];
                        break;
                    }
                }
            } else {
                // 简单随机选择
                randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            }
            
            console.log(`生成敌人类型: ${randomType} (已生成: ${enemiesSpawned+1}/${enemyCount})`);
            
            // 增加特殊敌人计数器
            if (randomType === 'ranged') specialEnemyCounts.ranged++;
            if (randomType === 'healer') specialEnemyCounts.healer++;
            
            // 随机选择出生点（屏幕边缘）
            const spawnSide = Math.floor(Math.random() * 4);
            let x, y;
            
            switch (spawnSide) {
                case 0: // 上边
                    x = Math.random() * this.canvas.width;
                    y = -50;
                    break;
                case 1: // 右边
                    x = this.canvas.width + 50;
                    y = Math.random() * this.canvas.height;
                    break;
                case 2: // 下边
                    x = Math.random() * this.canvas.width;
                    y = this.canvas.height + 50;
                    break;
                case 3: // 左边
                    x = -50;
                    y = Math.random() * this.canvas.height;
                    break;
            }
            
            // 创建敌人
            if (randomType === 'boss') {
                // 根据波次选择不同类型的BOSS
                let boss;
                const bossTypeIndex = Math.floor((waveNumber / 20)) % 4;
                
                switch (bossTypeIndex) {
                    case 0:
                        // 第20波、60波、100波等 - 基础BOSS
                        boss = new BossEnemy(x, y, waveNumber, difficultyMultiplier);
                        console.log(`生成基础BOSS - 波次 ${waveNumber}`);
                        break;
                    case 1:
                        // 第40波、80波、120波等 - 范围型BOSS
                        boss = new RangeBoss(x, y, waveNumber, difficultyMultiplier);
                        console.log(`生成范围型BOSS - 波次 ${waveNumber}`);
                        break;
                    case 2:
                        // 第60波、100波、140波等 - 坦克型BOSS
                        boss = new TankBoss(x, y, waveNumber, difficultyMultiplier);
                        console.log(`生成坦克型BOSS - 波次 ${waveNumber}`);
                        break;
                    case 3:
                        // 第80波、120波、160波等 - 召唤型BOSS
                        boss = new SummonerBoss(x, y, waveNumber, difficultyMultiplier);
                        console.log(`生成召唤型BOSS - 波次 ${waveNumber}`);
                        break;
                }
                
                this.data.enemies.push(boss);
            } else {
                // 普通敌人或精英敌人
                const enemy = new Enemy(x, y, randomType, waveNumber, difficultyMultiplier);
                
                // 随波次增加精英敌人概率
                const eliteChance = Math.min(0.3, 0.02 * waveNumber);
                if (Math.random() < eliteChance) {
                    // 将普通敌人提升为精英敌人
                    Object.assign(enemy, {
                        isElite: true,
                        maxHealth: enemy.maxHealth * 2,
                        health: enemy.maxHealth * 2,
                        damage: enemy.damage * 1.5,
                        radius: enemy.radius * 1.2,
                        moneyValue: enemy.moneyValue * 3,
                        scoreValue: enemy.scoreValue * 3
                    });
                    console.log(`生成精英${randomType}敌人`);
                }
                
                this.data.enemies.push(enemy);
            }
            
            enemiesSpawned++;
            this.data.waves[waveNumber].enemiesSpawned = enemiesSpawned;
            
        }, 1000 / spawnRate);
    }
    
    // 获取难度乘数
    getDifficultyMultiplier() {
        switch (this.config.difficulty) {
            case 'easy': return 0.8;
            case 'normal': return 1.0;
            case 'hard': return 1.3;
            default: return 1.0;
        }
    }
    
    // 更新游戏状态
    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        // 更新时间
        this.updateTime(deltaTime);
        
        // 更新玩家
        if (this.data.player) {
            this.data.player.update(this, deltaTime);
            
            // 检查玩家是否死亡
            if (this.data.player.health <= 0) {
                this.gameOver();
                return;
            }
        }
        
        // 更新敌人
        this.updateEnemies(deltaTime);
        
        // 更新投射物
        this.updateProjectiles(deltaTime);
        
        // 更新物品
        this.updateItems(deltaTime);
        
        // 更新粒子
        this.updateParticles(deltaTime);
        
        // 碰撞检测
        this.handleCollisions();
        
        // 更新碰撞网格
        this.updateCollisionGrid();
        
        // 检查波次完成
        this.checkWaveCompletion();
        
        // 更新UI
        UI.updateStatusBar(this.data);
    }
    
    // 更新时间
    updateTime(deltaTime) {
        this.time.deltaTime = deltaTime;
        this.time.gameTime += deltaTime;
        this.time.waveTime += deltaTime;
        
        if (this.time.shopTimeRemaining > 0) {
            this.time.shopTimeRemaining -= deltaTime;
            if (this.time.shopTimeRemaining <= 0) {
                this.time.shopTimeRemaining = 0;
                if (this.state === 'shop') {
                    this.closeMenu();
                    // 商店时间结束后自动开始下一波
                    this.startNextWave();
                }
            }
        }
    }
    
    // 更新敌人
    updateEnemies(deltaTime) {
        for (let i = this.data.enemies.length - 1; i >= 0; i--) {
            const enemy = this.data.enemies[i];
            enemy.update(this, deltaTime);
            
            // 移除死亡的敌人
            if (enemy.health <= 0) {
                // 生成死亡特效
                this.createDeathParticles(enemy.x, enemy.y, enemy.color);
                
                // 播放敌人死亡音效
                console.log('尝试播放敌人死亡音效');
                if (typeof playSound === 'function') {
                    playSound('enemyDeath');
                    console.log('成功调用playSound函数');
                } else {
                    console.log('playSound函数不可用');
                }
                
                // 掉落物品
                this.spawnItem(enemy.x, enemy.y);
                
                // 增加分数和金钱
                this.data.score += enemy.scoreValue;
                this.data.money += enemy.moneyValue;
                
                // 更新波次进度
                if (this.data.waves[this.data.currentWave]) {
                    this.data.waves[this.data.currentWave].enemiesKilled++;
                    console.log(`波次${this.data.currentWave}敌人死亡计数: ${this.data.waves[this.data.currentWave].enemiesKilled}/${this.data.waves[this.data.currentWave].enemyCount}`);
                }
                
                // 更新全局敌人死亡计数
                this.data.enemiesKilled++;
                
                // 移除敌人
                this.data.enemies.splice(i, 1);
            }
        }
    }
    
    // 更新投射物
    updateProjectiles(deltaTime) {
        for (let i = this.data.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.data.projectiles[i];
            projectile.update(this, deltaTime);
            
            // 移除超出屏幕的投射物
            if (projectile.x < -projectile.radius || 
                projectile.x > this.canvas.width + projectile.radius || 
                projectile.y < -projectile.radius || 
                projectile.y > this.canvas.height + projectile.radius ||
                projectile.lifetime <= 0) {
                
                this.data.projectiles.splice(i, 1);
            }
        }
    }
    
    // 更新物品
    updateItems(deltaTime) {
        for (let i = this.data.items.length - 1; i >= 0; i--) {
            const item = this.data.items[i];
            item.update(this, deltaTime);
            
            // 移除过期物品
            if (item.lifetime <= 0) {
                this.data.items.splice(i, 1);
            }
        }
    }
    
    // 更新粒子
    updateParticles(deltaTime) {
        for (let i = this.data.particles.length - 1; i >= 0; i--) {
            const particle = this.data.particles[i];
            particle.update(deltaTime);
            
            // 移除过期粒子
            if (particle.lifetime <= 0) {
                this.data.particles.splice(i, 1);
            }
        }
    }
    
    // 创建死亡粒子特效
    createDeathParticles(x, y, color) {
        const particleCount = 10 + Math.floor(Math.random() * 10);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            const size = 2 + Math.random() * 4;
            const lifetime = 0.5 + Math.random() * 0.5;
            
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: color,
                alpha: 1,
                lifetime: lifetime,
                maxLifetime: lifetime,
                update: function(deltaTime) {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vy += 0.02; // 重力效果
                    this.lifetime -= deltaTime;
                    this.alpha = this.lifetime / this.maxLifetime;
                }
            };
            
            this.data.particles.push(particle);
        }
    }
    
    // 生成掉落物品
    spawnItem(x, y) {
        // 20%概率掉落物品
        if (Math.random() > 0.2) return;
        
        const itemTypes = ['health', 'money', 'ammo', 'weapon'];
        const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        
        const item = new Item(x, y, itemType);
        this.data.items.push(item);
    }
    
    // 处理碰撞
    handleCollisions() {
        // 玩家与物品碰撞
        if (this.data.player) {
            this.checkPlayerItemCollisions();
        }
        
        // 投射物与敌人碰撞
        this.checkProjectileEnemyCollisions();
        
        // 敌人与玩家碰撞
        this.checkEnemyPlayerCollisions();
    }
    
    // 检查玩家与物品碰撞
    checkPlayerItemCollisions() {
        for (let i = this.data.items.length - 1; i >= 0; i--) {
            const item = this.data.items[i];
            
            if (this.checkCollision(this.data.player, item)) {
                // 应用物品效果
                item.applyEffect(this);
                
                // 移除物品
                this.data.items.splice(i, 1);
            }
        }
    }
    
    // 检查投射物与敌人碰撞
    checkProjectileEnemyCollisions() {
        for (let i = this.data.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.data.projectiles[i];
            let hitEnemy = false;
            
            for (let j = this.data.enemies.length - 1; j >= 0; j--) {
                const enemy = this.data.enemies[j];
                
                if (this.checkCollision(projectile, enemy)) {
                    // 敌人受到伤害
                    enemy.takeDamage(projectile.damage);
                    
                    // 创建伤害粒子
                    this.createDamageParticles(enemy.x, enemy.y, projectile.damage);
                    
                    // 更新伤害显示
                    UI.showDamageIndicator(enemy.x, enemy.y, projectile.damage);
                    
                    // 检查投射物是否穿透
                    if (!projectile.piercing) {
                        hitEnemy = true;
                        break;
                    }
                }
            }
            
            if (hitEnemy) {
                this.data.projectiles.splice(i, 1);
            }
        }
    }
    
    // 检查敌人与玩家碰撞
    checkEnemyPlayerCollisions() {
        if (!this.data.player) return;
        
        for (let i = this.data.enemies.length - 1; i >= 0; i--) {
            const enemy = this.data.enemies[i];
            
            if (this.checkCollision(this.data.player, enemy)) {
                // 玩家受到伤害
                this.data.player.takeDamage(enemy.damage);
                
                // 创建伤害粒子
                this.createDamageParticles(this.data.player.x, this.data.player.y, enemy.damage);
                
                // 更新伤害显示
                UI.showDamageIndicator(this.data.player.x, this.data.player.y, enemy.damage);
                
                // 击退效果
                const angle = Math.atan2(this.data.player.y - enemy.y, this.data.player.x - enemy.x);
                this.data.player.knockback(angle, enemy.knockback);
            }
        }
    }
    
    // 创建伤害粒子
    createDamageParticles(x, y, damage) {
        const particleCount = 3 + Math.floor(damage / 10);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            const size = 1 + Math.random() * 3;
            const lifetime = 0.3 + Math.random() * 0.3;
            
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: '#ff4444',
                alpha: 1,
                lifetime: lifetime,
                maxLifetime: lifetime,
                update: function(deltaTime) {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.lifetime -= deltaTime;
                    this.alpha = this.lifetime / this.maxLifetime;
                }
            };
            
            this.data.particles.push(particle);
        }
    }
    
    // 基础碰撞检测（圆形碰撞）
    checkCollision(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (a.radius || 20) + (b.radius || 20);
    }
    
    // 更新碰撞网格
    updateCollisionGrid() {
        // 清空网格
        this.initializeCollisionGrid();
        
        // 添加敌人到网格
        for (const enemy of this.data.enemies) {
            const col = Math.floor(enemy.x / this.collisionGrid.cellSize);
            const row = Math.floor(enemy.y / this.collisionGrid.cellSize);
            
            if (row >= 0 && row < this.collisionGrid.grid.length && 
                col >= 0 && col < this.collisionGrid.grid[0].length) {
                this.collisionGrid.grid[row][col].push(enemy);
            }
        }
    }
    
    // 检查波次完成
    checkWaveCompletion() {
        const currentWave = this.data.waves[this.data.currentWave];
        if (!currentWave) return;
        
        // 检查BOSS波是否超时（4分钟限制）
        if (currentWave.isBossWave && currentWave.maxWaveTime) {
            const waveDuration = this.time.gameTime - currentWave.startTime;
            if (waveDuration >= currentWave.maxWaveTime) {
                console.log(`BOSS波时间到！波次 ${this.data.currentWave} 完成。`);
                // 提前结束BOSS波
                this.data.waves[this.data.currentWave].enemiesSpawned = currentWave.enemyCount;
                this.data.waves[this.data.currentWave].enemiesKilled = currentWave.enemyCount;
            }
        }
        
        // 检查当前波次是否所有敌人都已生成且被消灭
        if (currentWave.enemiesSpawned >= currentWave.enemyCount && 
            currentWave.enemiesKilled >= currentWave.enemyCount) {
            
            // 检查是否是最后一波
            if (this.data.currentWave >= this.data.maxWaves) {
                this.victory();
            } else {
                // 进入商店时间
                this.enterShop();
            }
        }
    }
    
    // 进入商店
    enterShop() {
        this.state = 'shop';
        this.time.shopTimeRemaining = this.data.shopTime;
        
        // 更新商店UI
        UI.updateShopUI(this.data);
        UI.showMenu('shopMenu');
    }
    
    // 开始下一波
    startNextWave() {
        // 增加波次计数
        this.data.currentWave++;
        
        console.log(`开始第 ${this.data.currentWave} 波`);
        
        // 生成新波次
        this.generateWave(this.data.currentWave);
        
        // 更新UI
        UI.updateStatusBar(this.data);
        
        // 显示通知
        this.addNotification(`第${this.data.currentWave}波开始！`);
        
        // 确保游戏状态为playing
        this.state = 'playing';
    }
    
    // 胜利
    victory() {
        console.log('游戏胜利！');
        this.state = 'gameOver';
        
        // 更新最高分
        if (this.data.score > this.data.highScore) {
            this.data.highScore = this.data.score;
            localStorage.setItem('potatoBrosHighScore', this.data.highScore);
        }
        
        // 更新游戏结束UI
        UI.updateGameOverUI(this.data, true);
        UI.showMenu('gameOverMenu');
    }
    
    // 游戏结束
    gameOver() {
        console.log('游戏结束');
        this.state = 'gameOver';
        
        // 更新最高分
        if (this.data.score > this.data.highScore) {
            this.data.highScore = this.data.score;
            localStorage.setItem('potatoBrosHighScore', this.data.highScore);
        }
        
        // 更新游戏结束UI
        UI.updateGameOverUI(this.data, false);
        UI.showMenu('gameOverMenu');
    }
    
    // 绘制游戏
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.drawBackground();
        
        if (this.state === 'playing' || this.state === 'pause') {
            // 绘制物品
            this.drawItems();
            
            // 绘制投射物
            this.drawProjectiles();
            
            // 绘制敌人
            this.drawEnemies();
            
            // 绘制玩家
            if (this.data.player) {
                this.drawPlayer();
            }
            
            // 绘制粒子
            this.drawParticles();
            
            // 绘制UI效果（如伤害显示）
            UI.drawEffects(this.ctx);
        }
        
        // 绘制UI
        // UI在HTML层处理，不需要在这里绘制
    }
    
    // 绘制背景
    drawBackground() {
        // 绘制渐变背景
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2,
            0, this.canvas.width / 2, this.canvas.height / 2,
            Math.max(this.canvas.width, this.canvas.height) / 2
        );
        gradient.addColorStop(0, '#2a2a2a');
        gradient.addColorStop(0.5, '#1a1a1a');
        gradient.addColorStop(1, '#0a0a0a');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格背景
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    // 绘制玩家
    drawPlayer() {
        const player = this.data.player;
        
        // 绘制玩家主体
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制玩家边框
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 绘制方向指示器
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(player.x, player.y - player.radius);
        this.ctx.lineTo(player.x + 5, player.y - player.radius + 10);
        this.ctx.lineTo(player.x - 5, player.y - player.radius + 10);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    // 绘制敌人
    drawEnemies() {
        for (const enemy of this.data.enemies) {
            // 绘制敌人主体
            this.ctx.fillStyle = enemy.color;
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制敌人边框
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制敌人名称
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(enemy.type, enemy.x, enemy.y - enemy.radius - 5);
            
            // 绘制血条
            const healthBarWidth = enemy.radius * 2;
            const healthBarHeight = 4;
            const healthPercent = enemy.health / enemy.maxHealth;
            
            // 血条背景
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(enemy.x - healthBarWidth / 2, enemy.y - enemy.radius - 15, healthBarWidth, healthBarHeight);
            
            // 血条当前值
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(enemy.x - healthBarWidth / 2, enemy.y - enemy.radius - 15, healthBarWidth * healthPercent, healthBarHeight);
        }
    }
    
    // 绘制投射物
    drawProjectiles() {
        for (const projectile of this.data.projectiles) {
            this.ctx.fillStyle = projectile.color;
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    // 绘制物品
    drawItems() {
        for (const item of this.data.items) {
            // 绘制物品闪烁效果
            const pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
            
            // 绘制物品光环
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.3 * pulse})`;
            this.ctx.beginPath();
            this.ctx.arc(item.x, item.y, item.radius + 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制物品主体
            this.ctx.fillStyle = item.color;
            this.ctx.beginPath();
            this.ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    // 绘制粒子
    drawParticles() {
        for (const particle of this.data.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    // 游戏主循环
    gameLoop(timestamp) {
        // 计算时间差
        const deltaTime = (timestamp - this.time.lastTime) / 1000;
        this.time.lastTime = timestamp;
        
        // 限制最大时间差
        const clampedDeltaTime = Math.min(deltaTime, 0.1);
        
        // 更新游戏状态
        this.update(clampedDeltaTime);
        
        // 绘制游戏
        this.render();
        
        // 继续游戏循环
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// 游戏核心类定义
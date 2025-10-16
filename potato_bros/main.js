// main.js - 游戏入口文件，整合所有模块并启动游戏

// 导入游戏核心模块
import Game from './game.js';
import { createUIManager } from './ui.js';
import { createParticleSystem } from './particles.js';
const GAME_CONFIG = {
    canvasWidth: 800,
    canvasHeight: 600,
    fps: 60,
    debug: false
};

// 游戏资源（实际项目中可以通过资源加载器加载）
const GAME_RESOURCES = {
    // 图像资源（这里使用占位符，实际项目中替换为真实图片路径）
    images: {
        player: 'assets/player.png',
        enemies: {
            basic: 'assets/enemy_basic.png',
            fast: 'assets/enemy_fast.png',
            tank: 'assets/enemy_tank.png',
            ranged: 'assets/enemy_ranged.png',
            elite: 'assets/enemy_elite.png',
            boss: 'assets/enemy_boss.png'
        },
        weapons: {
            pistol: 'assets/weapon_pistol.png',
            shotgun: 'assets/weapon_shotgun.png',
            machinegun: 'assets/weapon_machinegun.png',
            sniper: 'assets/weapon_sniper.png',
            rocketLauncher: 'assets/weapon_rocket.png',
            laser: 'assets/weapon_laser.png',
            flamethrower: 'assets/weapon_flame.png',
            lightning: 'assets/weapon_lightning.png'
        },
        items: {
            healthPotion: 'assets/item_health.png',
            shieldPotion: 'assets/item_shield.png',
            damagePotion: 'assets/item_damage.png',
            attackSpeedPotion: 'assets/item_speed.png',
            gold: 'assets/item_gold.png',
            experience: 'assets/item_exp.png'
        },
        tiles: {
            floor: 'assets/tile_floor.png',
            wall: 'assets/tile_wall.png',
            obstacle: 'assets/tile_obstacle.png',
            portal: 'assets/tile_portal.png'
        },
        ui: {
            background: 'assets/ui_background.png',
            buttons: 'assets/ui_buttons.png',
            icons: 'assets/ui_icons.png'
        }
    },
    
    // 音频资源
    sounds: {
        playerShoot: 'assets/sound_shoot.wav',
        playerHit: 'assets/sound_hit.wav',
        enemyDeath: 'assets/sound_enemy_death.wav',
        itemPickup: 'assets/sound_item_pickup.wav',
        levelUp: 'assets/sound_level_up.wav',
        gameOver: 'assets/sound_game_over.wav',
        bossSpawn: 'assets/sound_boss_spawn.wav',
        music: 'assets/music_loop.wav'
    },
    
    // 字体资源
    fonts: {
        main: 'assets/font_main.ttf',
        title: 'assets/font_title.ttf'
    }
};

// 游戏存档管理
class GameSaveManager {
    constructor() {
        this.saveKey = 'potato_bros_save';
        this.autoSaveInterval = 30000; // 30秒自动保存一次
    }
    
    // 保存游戏
    saveGame(gameState) {
        try {
            const saveData = {
                timestamp: Date.now(),
                version: '1.0.0',
                gameState: gameState
            };
            
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            console.log('游戏已保存');
            return true;
        } catch (error) {
            console.error('保存游戏失败:', error);
            return false;
        }
    }
    
    // 加载游戏
    loadGame() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            
            if (!saveData) {
                console.log('没有找到存档');
                return null;
            }
            
            const parsedData = JSON.parse(saveData);
            console.log('游戏已加载');
            return parsedData.gameState;
        } catch (error) {
            console.error('加载游戏失败:', error);
            return null;
        }
    }
    
    // 删除存档
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            console.log('存档已删除');
            return true;
        } catch (error) {
            console.error('删除存档失败:', error);
            return false;
        }
    }
    
    // 检查是否有存档
    hasSave() {
        return localStorage.getItem(this.saveKey) !== null;
    }
    
    // 获取存档信息
    getSaveInfo() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            
            if (!saveData) {
                return null;
            }
            
            const parsedData = JSON.parse(saveData);
            return {
                timestamp: parsedData.timestamp,
                version: parsedData.version,
                level: parsedData.gameState?.level || 1,
                score: parsedData.gameState?.score || 0
            };
        } catch (error) {
            console.error('获取存档信息失败:', error);
            return null;
        }
    }
    
    // 启动自动保存
    startAutoSave(game) {
        setInterval(() => {
            if (game && game.isRunning) {
                this.saveGame(game.getGameState());
            }
        }, this.autoSaveInterval);
    }
}

// 游戏设置管理
class GameSettingsManager {
    constructor() {
        this.settingsKey = 'potato_bros_settings';
        this.defaultSettings = {
            soundEnabled: true,
            musicEnabled: true,
            soundVolume: 0.7,
            musicVolume: 0.5,
            screenShake: true,
            particleEffects: true,
            showHud: true,
            difficulty: 'normal', // easy, normal, hard
            controlScheme: 'keyboard', // keyboard, gamepad
            autoAim: false,
            fullscreen: false
        };
        
        this.settings = this.loadSettings();
    }
    
    // 加载设置
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem(this.settingsKey);
            
            if (!savedSettings) {
                return { ...this.defaultSettings };
            }
            
            return { ...this.defaultSettings, ...JSON.parse(savedSettings) };
        } catch (error) {
            console.error('加载设置失败:', error);
            return { ...this.defaultSettings };
        }
    }
    
    // 保存设置
    saveSettings() {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
            console.log('设置已保存');
            return true;
        } catch (error) {
            console.error('保存设置失败:', error);
            return false;
        }
    }
    
    // 获取设置
    getSetting(key, defaultValue = null) {
        return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
    }
    
    // 设置设置
    setSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }
    
    // 重置设置
    resetSettings() {
        this.settings = { ...this.defaultSettings };
        this.saveSettings();
    }
    
    // 应用设置到游戏
    applySettingsToGame(game) {
        if (!game) return;
        
        // 应用声音设置
        if (game.audio) {
            game.audio.setSoundEnabled(this.getSetting('soundEnabled'));
            game.audio.setMusicEnabled(this.getSetting('musicEnabled'));
            game.audio.setSoundVolume(this.getSetting('soundVolume'));
            game.audio.setMusicVolume(this.getSetting('musicVolume'));
        }
        
        // 应用特效设置
        if (game.particleSystem) {
            game.particleSystem.enabled = this.getSetting('particleEffects');
        }
        
        // 应用HUD设置
        if (game.uiManager) {
            game.uiManager.setHudVisible(this.getSetting('showHud'));
        }
        
        // 应用全屏设置
        if (this.getSetting('fullscreen') && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('无法进入全屏模式:', err);
                this.setSetting('fullscreen', false);
            });
        } else if (!this.getSetting('fullscreen') && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
    }
}

// 游戏统计管理
class GameStatsManager {
    constructor() {
        this.statsKey = 'potato_bros_stats';
        this.stats = this.loadStats();
    }
    
    // 加载统计数据
    loadStats() {
        try {
            const savedStats = localStorage.getItem(this.statsKey);
            
            if (!savedStats) {
                return this.getEmptyStats();
            }
            
            return { ...this.getEmptyStats(), ...JSON.parse(savedStats) };
        } catch (error) {
            console.error('加载统计数据失败:', error);
            return this.getEmptyStats();
        }
    }
    
    // 创建空的统计数据
    getEmptyStats() {
        return {
            totalGamesPlayed: 0,
            totalEnemiesKilled: 0,
            totalDamageDealt: 0,
            totalDamageReceived: 0,
            totalItemsCollected: 0,
            totalGoldCollected: 0,
            totalExperienceGained: 0,
            highestLevelReached: 0,
            highestScore: 0,
            totalPlayTime: 0,
            weaponsUsed: {},
            enemiesKilled: {},
            itemsCollected: {},
            bossesDefeated: 0,
            wins: 0,
            losses: 0
        };
    }
    
    // 保存统计数据
    saveStats() {
        try {
            localStorage.setItem(this.statsKey, JSON.stringify(this.stats));
            return true;
        } catch (error) {
            console.error('保存统计数据失败:', error);
            return false;
        }
    }
    
    // 更新统计数据
    updateStats(gameStats) {
        // 更新基本统计
        this.stats.totalGamesPlayed += 1;
        this.stats.totalEnemiesKilled += gameStats.enemiesKilled || 0;
        this.stats.totalDamageDealt += gameStats.damageDealt || 0;
        this.stats.totalDamageReceived += gameStats.damageReceived || 0;
        this.stats.totalItemsCollected += gameStats.itemsCollected || 0;
        this.stats.totalGoldCollected += gameStats.goldCollected || 0;
        this.stats.totalExperienceGained += gameStats.experienceGained || 0;
        
        // 更新最高记录
        if (gameStats.levelReached > this.stats.highestLevelReached) {
            this.stats.highestLevelReached = gameStats.levelReached;
        }
        
        if (gameStats.score > this.stats.highestScore) {
            this.stats.highestScore = gameStats.score;
        }
        
        // 更新武器使用统计
        if (gameStats.weaponsUsed) {
            for (const [weapon, count] of Object.entries(gameStats.weaponsUsed)) {
                this.stats.weaponsUsed[weapon] = (this.stats.weaponsUsed[weapon] || 0) + count;
            }
        }
        
        // 更新敌人击杀统计
        if (gameStats.enemiesKilledByType) {
            for (const [enemy, count] of Object.entries(gameStats.enemiesKilledByType)) {
                this.stats.enemiesKilled[enemy] = (this.stats.enemiesKilled[enemy] || 0) + count;
            }
        }
        
        // 更新物品收集统计
        if (gameStats.itemsCollectedByType) {
            for (const [item, count] of Object.entries(gameStats.itemsCollectedByType)) {
                this.stats.itemsCollected[item] = (this.stats.itemsCollected[item] || 0) + count;
            }
        }
        
        // 更新Boss击败统计
        this.stats.bossesDefeated += gameStats.bossesDefeated || 0;
        
        // 更新胜负统计
        if (gameStats.victory) {
            this.stats.wins += 1;
        } else {
            this.stats.losses += 1;
        }
        
        // 保存统计
        this.saveStats();
    }
    
    // 获取统计数据
    getStats() {
        return { ...this.stats };
    }
    
    // 重置统计数据
    resetStats() {
        this.stats = this.getEmptyStats();
        this.saveStats();
    }
}

// 资源管理器（简化版，实际项目可能需要更复杂的加载逻辑）
class ResourceManager {
    constructor() {
        this.resources = {};
        this.loadedResources = 0;
        this.totalResources = 0;
        this.loadingComplete = false;
        this.onLoadCallback = null;
        this.onProgressCallback = null;
    }
    
    // 加载所有资源
    loadAllResources(onLoad, onProgress) {
        this.onLoadCallback = onLoad;
        this.onProgressCallback = onProgress;
        
        // 计算总资源数
        this.calculateTotalResources(GAME_RESOURCES);
        
        // 开始加载资源
        this.loadResources(GAME_RESOURCES);
    }
    
    // 计算总资源数
    calculateTotalResources(resources) {
        for (const key in resources) {
            const value = resources[key];
            
            if (typeof value === 'string') {
                this.totalResources++;
            } else if (typeof value === 'object' && value !== null) {
                this.calculateTotalResources(value);
            }
        }
    }
    
    // 加载资源
    loadResources(resources, parentKey = '') {
        for (const key in resources) {
            const value = resources[key];
            const currentKey = parentKey ? `${parentKey}.${key}` : key;
            
            if (typeof value === 'string') {
                // 在实际项目中，这里应该根据文件类型加载不同的资源
                // 由于我们使用占位符，这里模拟加载完成
                this.loadedResources++;
                
                if (this.onProgressCallback) {
                    const progress = this.loadedResources / this.totalResources;
                    this.onProgressCallback(progress);
                }
                
                // 检查是否所有资源都已加载
                if (this.loadedResources === this.totalResources) {
                    this.loadingComplete = true;
                    if (this.onLoadCallback) {
                        this.onLoadCallback();
                    }
                }
            } else if (typeof value === 'object' && value !== null) {
                this.resources[currentKey] = {};
                this.loadResources(value, currentKey);
            }
        }
    }
    
    // 获取资源
    getResource(path) {
        // 简化的资源获取，实际项目中可能需要更复杂的路径解析
        return this.resources[path] || null;
    }
    
    // 检查是否加载完成
    isLoadingComplete() {
        return this.loadingComplete;
    }
    
    // 获取加载进度
    getLoadingProgress() {
        return this.totalResources > 0 ? this.loadedResources / this.totalResources : 0;
    }
}

// 游戏控制器
class GameController {
    constructor() {
        this.game = null;
        this.uiManager = null;
        this.particleSystem = null;
        this.saveManager = new GameSaveManager();
        this.settingsManager = new GameSettingsManager();
        this.statsManager = new GameStatsManager();
        this.resourceManager = new ResourceManager();
        this.isGameStarted = false;
    }
    
    // 初始化游戏
    initialize() {
        console.log('正在初始化土豆兄弟游戏...');
        
        // 设置UI管理器
        this.uiManager = createUIManager();
        
        // 设置粒子系统
        this.particleSystem = createParticleSystem();
        
        // 加载资源
        this.loadGameResources();
        
        // 设置事件监听
        this.setupEventListeners();
    }
    
    // 加载游戏资源
    loadGameResources() {
        // 显示加载界面
        this.uiManager.showLoadingScreen();
        
        // 加载资源
        this.resourceManager.loadAllResources(
            // 加载完成回调
            () => {
                console.log('所有资源加载完成');
                this.uiManager.hideLoadingScreen();
                this.uiManager.showStartMenu();
            },
            // 加载进度回调
            (progress) => {
                this.uiManager.updateLoadingProgress(progress);
            }
        );
    }
    
    // 设置事件监听
    setupEventListeners() {
        // 开始游戏按钮点击
        this.uiManager.onStartGame = () => {
            this.startNewGame();
        };
        
        // 加载游戏按钮点击
        this.uiManager.onLoadGame = () => {
            this.loadSavedGame();
        };
        
        // 打开设置按钮点击
        this.uiManager.onOpenSettings = () => {
            this.uiManager.showSettingsMenu();
        };
        
        // 应用设置
        this.uiManager.onApplySettings = (settings) => {
            for (const [key, value] of Object.entries(settings)) {
                this.settingsManager.setSetting(key, value);
            }
            
            // 应用设置到游戏
            if (this.game) {
                this.settingsManager.applySettingsToGame(this.game);
            }
            
            this.uiManager.hideSettingsMenu();
        };
        
        // 打开商店
        this.uiManager.onOpenShop = () => {
            if (this.game) {
                this.game.openShop();
            }
        };
        
        // 打开升级菜单
        this.uiManager.onOpenUpgradeMenu = () => {
            if (this.game) {
                this.game.openUpgradeMenu();
            }
        };
        
        // 暂停/继续游戏
        this.uiManager.onTogglePause = () => {
            if (this.game) {
                this.game.togglePause();
            }
        };
        
        // 重新开始游戏
        this.uiManager.onRestartGame = () => {
            this.restartGame();
        };
        
        // 返回主菜单
        this.uiManager.onReturnToMainMenu = () => {
            this.returnToMainMenu();
        };
        
        // 键盘事件监听
        window.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
        
        window.addEventListener('keyup', (event) => {
            this.handleKeyUp(event);
        });
        
        // 全屏变化事件
        document.addEventListener('fullscreenchange', () => {
            const isFullscreen = !!document.fullscreenElement;
            this.settingsManager.setSetting('fullscreen', isFullscreen);
        });
    }
    
    // 处理键盘按下事件
    handleKeyDown(event) {
        // 全局C键处理 - 直接跳转到BOSS波
        if (event.key.toLowerCase() === 'c') {
            event.preventDefault();
            console.log('在GameController中检测到C键按下');
            
            // 确保游戏实例存在且有jumpToBossWave方法
            if (this.game && typeof this.game.jumpToBossWave === 'function') {
                // 检查游戏是否在适当的状态（playing或paused）
                if (this.game.state === 'playing' || this.game.state === 'paused') {
                    console.log('游戏状态允许跳转，调用jumpToBossWave方法');
                    // 如果是暂停状态，先恢复游戏
                    if (this.game.state === 'paused') {
                        this.game.togglePause();
                    }
                    // 调用跳转方法
                    this.game.jumpToBossWave();
                } else {
                    console.log('游戏不在适当的状态，当前状态:', this.game.state);
                }
            } else {
                console.log('游戏实例不存在或jumpToBossWave方法不可用');
            }
            
            return; // 提前返回，避免继续处理
        }
        
        // 如果游戏正在运行，将事件传递给游戏
        if (this.game && this.isGameStarted) {
            this.game.handleKeyDown(event);
            return;
        }
        
        // 菜单中的快捷键
        switch (event.key.toLowerCase()) {
            case 'enter':
                // 如果在主菜单，开始游戏
                if (this.uiManager.activeMenu === 'startMenu') {
                    this.startNewGame();
                }
                break;
                
            case 'escape':
                // 如果在设置菜单，关闭设置
                if (this.uiManager.activeMenu === 'settingsMenu') {
                    this.uiManager.hideSettingsMenu();
                }
                // 如果在商店或升级菜单，关闭菜单
                else if (this.uiManager.activeMenu === 'shopMenu' || 
                         this.uiManager.activeMenu === 'upgradeMenu') {
                    this.uiManager.hideAllMenus();
                }
                break;
                
            case 's':
                // 打开设置
                if (this.uiManager.activeMenu === 'startMenu') {
                    this.uiManager.showSettingsMenu();
                }
                break;
        }
    }
    
    // 处理键盘释放事件
    handleKeyUp(event) {
        // 如果游戏正在运行，将事件传递给游戏
        if (this.game && this.isGameStarted) {
            this.game.handleKeyUp(event);
        }
    }
    
    // 开始新游戏
    startNewGame() {
        console.log('开始新游戏');
        
        // 隐藏所有菜单
        this.uiManager.hideAllMenus();
        
        // 如果已有游戏实例，销毁它
        if (this.game) {
            this.game.destroy();
        }
        
        // 创建新游戏实例
        this.game = new Game(GAME_CONFIG, {
            uiManager: this.uiManager,
            particleSystem: this.particleSystem,
            settings: this.settingsManager.getSetting
        });
        
        // 应用设置
        this.settingsManager.applySettingsToGame(this.game);
        
        // 启动游戏
        this.game.start();
        this.isGameStarted = true;
        
        // 启动自动保存
        this.saveManager.startAutoSave(this.game);
        
        // 设置游戏结束回调
        this.game.onGameOver = (gameStats) => {
            this.handleGameOver(gameStats);
        };
    }
    
    // 加载存档游戏
    loadSavedGame() {
        const savedState = this.saveManager.loadGame();
        
        if (savedState) {
            console.log('加载存档游戏');
            
            // 隐藏所有菜单
            this.uiManager.hideAllMenus();
            
            // 如果已有游戏实例，销毁它
            if (this.game) {
                this.game.destroy();
            }
            
            // 创建新游戏实例并加载存档
            this.game = new Game(GAME_CONFIG, {
                uiManager: this.uiManager,
                particleSystem: this.particleSystem,
                settings: this.settingsManager.getSetting,
                savedState: savedState
            });
            
            // 应用设置
            this.settingsManager.applySettingsToGame(this.game);
            
            // 启动游戏
            this.game.start();
            this.isGameStarted = true;
            
            // 启动自动保存
            this.saveManager.startAutoSave(this.game);
            
            // 设置游戏结束回调
            this.game.onGameOver = (gameStats) => {
                this.handleGameOver(gameStats);
            };
        } else {
            // 没有找到存档
            this.uiManager.showMessage('没有找到存档文件');
        }
    }
    
    // 重新开始游戏
    restartGame() {
        this.startNewGame();
    }
    
    // 返回主菜单
    returnToMainMenu() {
        console.log('返回主菜单');
        
        // 销毁游戏实例
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }
        
        this.isGameStarted = false;
        
        // 显示主菜单
        this.uiManager.hideAllMenus();
        this.uiManager.showStartMenu();
    }
    
    // 处理游戏结束
    handleGameOver(gameStats) {
        console.log('游戏结束', gameStats);
        
        // 更新统计数据
        this.statsManager.updateStats(gameStats);
        
        // 显示游戏结束菜单
        this.uiManager.showGameOverMenu(gameStats);
        
        this.isGameStarted = false;
    }
    
    // 保存游戏
    saveGame() {
        if (this.game && this.isGameStarted) {
            return this.saveManager.saveGame(this.game.getGameState());
        }
        return false;
    }
    
    // 获取游戏统计
    getGameStats() {
        return this.statsManager.getStats();
    }
    
    // 获取设置
    getSettings() {
        return this.settingsManager.getSetting();
    }
    
    // 渲染游戏
    render() {
        if (this.game && this.isGameStarted) {
            this.game.render();
        }
    }
    
    // 更新游戏
    update(deltaTime) {
        if (this.game && this.isGameStarted) {
            this.game.update(deltaTime);
        }
    }
}

// 游戏主循环
function gameLoop() {
    let lastTime = 0;
    
    function loop(currentTime) {
        // 计算时间差
        const deltaTime = (currentTime - lastTime) / 1000; // 转换为秒
        lastTime = currentTime;
        
        // 更新游戏
        if (window.gameController) {
            window.gameController.update(deltaTime);
            window.gameController.render();
        }
        
        // 请求下一帧
        requestAnimationFrame(loop);
    }
    
    // 开始循环
    requestAnimationFrame(loop);
}

// 当DOM加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    // 创建游戏控制器实例
    window.gameController = new GameController();
    
    // 初始化游戏
    window.gameController.initialize();
    
    // 启动游戏循环
    gameLoop();
    
    console.log('土豆兄弟游戏已初始化');
});

// 导出一些全局函数供调试使用
function debugGameState() {
    if (window.gameController && window.gameController.game) {
        return window.gameController.game.getGameState();
    }
    return null;
}

function toggleDebugMode() {
    if (window.gameController && window.gameController.game) {
        window.gameController.game.toggleDebugMode();
    }
}

function getGameController() {
    return window.gameController;
}
// ui.js - 游戏UI系统

class UIManager {
    constructor(game) {
        this.game = game;
        this.uiElements = [];
        this.activeMenu = null;
        this.notifications = [];
        this.floatingTexts = [];
        this.shopVisible = false;
        
        // 初始化UI元素
        this.initializeUI();
    }
    
    // 初始化UI元素
    initializeUI() {
        this.createStatusBar();
    }
    
    // 显示商店
    showShop() {
        if (this.shopVisible) return;
        
        this.shopVisible = true;
        this.game.paused = true;
        
        // 创建商店界面
        const shopDiv = document.createElement('div');
        shopDiv.id = 'shop-interface';
        shopDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 107, 53, 0.5);
            border-radius: 16px;
            padding: 30px;
            z-index: 1000;
            color: #eee;
            font-family: 'Rajdhani', sans-serif;
            max-width: 700px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        `;
        
        // 添加商店标题
        const title = document.createElement('h2');
        title.textContent = '🛒 土豆商店';
        title.style.cssText = `
            margin: 0 0 20px 0;
            text-align: center;
            font-size: 28px;
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        `;
        shopDiv.appendChild(title);
        
        // 添加关闭按钮
        const closeButton = document.createElement('button');
        closeButton.textContent = '🚀 继续游戏';
        closeButton.style.cssText = `
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            border: none;
            border-radius: 12px;
            color: white;
            font-size: 18px;
            cursor: pointer;
        `;
        
        closeButton.addEventListener('click', () => {
            this.hideShop();
        });
        
        shopDiv.appendChild(closeButton);
        document.body.appendChild(shopDiv);
    }
    
    // 隐藏商店
    hideShop() {
        const shopDiv = document.getElementById('shop-interface');
        if (shopDiv) {
            shopDiv.remove();
        }
        this.shopVisible = false;
        this.game.paused = false;
    }
    
    // 创建状态栏
    createStatusBar() {
        const statusBar = {
            type: 'statusBar',
            draw: (ctx) => {
                const player = this.game.data.player;
                if (!player) return;
                
                const canvas = this.game.canvas;
                const barHeight = 40;
                
                // 绘制背景
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, canvas.width, barHeight);
                
                // 绘制生命值
                const healthBarWidth = 200;
                const healthBarHeight = 20;
                const healthRatio = player.health / player.maxHealth;
                
                let healthColor = '#4caf50';
                if (healthRatio < 0.3) healthColor = '#f44336';
                else if (healthRatio < 0.6) healthColor = '#ff9800';
                
                ctx.fillStyle = '#333';
                ctx.fillRect(20, 10, healthBarWidth, healthBarHeight);
                
                ctx.fillStyle = healthColor;
                ctx.fillRect(20, 10, healthBarWidth * healthRatio, healthBarHeight);
                
                ctx.fillStyle = '#fff';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${Math.floor(player.health)}/${player.maxHealth}`, 
                    20 + healthBarWidth / 2, 24);
                
                // 绘制金钱
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('$' + this.game.data.money, 250, 27);
                
                ctx.restore();
            }
        };
        
        this.uiElements.push(statusBar);
    }
    
    // 更新UI
    update(deltaTime) {
        // 更新通知
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notification = this.notifications[i];
            notification.update(deltaTime);
            
            if (notification.isExpired) {
                this.notifications.splice(i, 1);
            }
        }
    }
    
    // 绘制UI
    draw(ctx) {
        for (const element of this.uiElements) {
            element.draw(ctx);
        }
        
        for (const notification of this.notifications) {
            notification.draw(ctx);
        }
    }
    
    // 添加通知
    addNotification(message, duration = 3) {
        const notification = {
            message: message,
            duration: duration,
            timer: 0,
            isExpired: false,
            opacity: 1,
            update: function(deltaTime) {
                this.timer += deltaTime;
                if (this.timer >= this.duration) {
                    this.isExpired = true;
                }
            },
            draw: function(ctx) {
                const canvas = ctx.canvas;
                const width = 300;
                const height = 60;
                const x = (canvas.width - width) / 2;
                const y = canvas.height - 120;
                
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(x, y, width, height);
                
                ctx.strokeStyle = '#ff9800';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, width, height);
                
                ctx.fillStyle = '#fff';
                ctx.font = '18px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.message, x + width / 2, y + height / 2);
                ctx.restore();
            }
        };
        
        this.notifications.push(notification);
    }
    
    // 重置UI
    reset() {
        this.notifications = [];
        this.hideShop();
    }
}

// 全局UI管理器
let uiManager = null;

function getUIManager() {
    return uiManager;
}

function createUIManager(game) {
    uiManager = new UIManager(game);
    return uiManager;
}

function destroyUIManager() {
    uiManager = null;
}
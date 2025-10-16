// items.js - 道具系统和掉落机制

// 物品基类
class Item {
    constructor(name, type, value, rarity = 'common') {
        this.name = name;
        this.type = type;
        this.value = value;
        this.rarity = rarity;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.gravity = 200;
        this.friction = 0.95;
        this.radius = 15;
        this.pickupRadius = 40;
        this.lifetime = 15; // 15秒后消失
        this.pulseTimer = 0;
        this.pulseSpeed = 2;
        this.isCollected = false;
        this.isFalling = true;
        this.bounceCount = 0;
        this.maxBounces = 3;
        this.bounceFactor = 0.6;
        
        // 根据稀有度设置颜色和效果
        this.setRarityProperties();
    }
    
    // 设置稀有度属性
    setRarityProperties() {
        switch (this.rarity) {
            case 'common':
                this.color = '#a0a0a0';
                this.pulseColor = '#ffffff';
                this.priority = 1;
                break;
            case 'uncommon':
                this.color = '#4caf50';
                this.pulseColor = '#66bb6a';
                this.priority = 2;
                break;
            case 'rare':
                this.color = '#2196f3';
                this.pulseColor = '#42a5f5';
                this.priority = 3;
                break;
            case 'epic':
                this.color = '#9c27b0';
                this.pulseColor = '#ba68c8';
                this.priority = 4;
                break;
            case 'legendary':
                this.color = '#ff9800';
                this.pulseColor = '#ffb74d';
                this.priority = 5;
                break;
            default:
                this.color = '#a0a0a0';
                this.pulseColor = '#ffffff';
                this.priority = 1;
        }
    }
    
    // 更新物品状态
    update(game, deltaTime) {
        // 更新脉冲效果
        this.pulseTimer += this.pulseSpeed * deltaTime;
        
        // 更新生命周期
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.isCollected = true;
            return;
        }
        
        // 更新物理
        if (this.isFalling) {
            this.vy += this.gravity * deltaTime;
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
            
            // 边界碰撞检测
            this.handleBoundaries(game, deltaTime);
        }
        
        // 检查玩家是否可以拾取
        this.checkPlayerPickup(game);
    }
    
    // 处理边界碰撞
    handleBoundaries(game, deltaTime) {
        // 左右边界
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -this.bounceFactor;
        } else if (this.x + this.radius > game.canvas.width) {
            this.x = game.canvas.width - this.radius;
            this.vx *= -this.bounceFactor;
        }
        
        // 底部边界
        if (this.y + this.radius > game.canvas.height) {
            this.y = game.canvas.height - this.radius;
            this.vy *= -this.bounceFactor;
            
            this.bounceCount++;
            
            // 多次反弹后停止
            if (this.bounceCount >= this.maxBounces || Math.abs(this.vy) < 50) {
                this.isFalling = false;
                this.vx = 0;
                this.vy = 0;
            }
        }
        
        // 应用摩擦力
        this.vx *= this.friction;
    }
    
    // 检查玩家拾取
    checkPlayerPickup(game) {
        const player = game.data.player;
        if (!player) return;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.pickupRadius && !this.isCollected) {
            // 如果距离足够近，自动飞向玩家
            if (distance > this.radius * 2) {
                const angle = Math.atan2(dy, dx);
                const magnetSpeed = 200;
                this.x += Math.cos(angle) * magnetSpeed * deltaTime;
                this.y += Math.sin(angle) * magnetSpeed * deltaTime;
            } else {
                // 收集物品
                this.collect(game);
            }
        }
    }
    
    // 收集物品
    collect(game) {
        if (this.isCollected) return;
        
        this.isCollected = true;
        
        // 应用物品效果
        this.applyEffect(game);
        
        // 更新统计
        game.data.player.stats.itemsCollected++;
        
        // 创建收集特效
        this.createCollectEffect(game);
    }
    
    // 应用物品效果
    applyEffect(game) {
        // 基类空方法，由子类实现
    }
    
    // 创建收集特效
    createCollectEffect(game) {
        const particleCount = 10;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            const size = 3 + Math.random() * 5;
            
            const particle = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: this.color,
                alpha: 1,
                lifetime: 0.5,
                maxLifetime: 0.5,
                update: function(deltaTime) {
                    this.x += this.vx * deltaTime;
                    this.y += this.vy * deltaTime;
                    this.lifetime -= deltaTime;
                    this.alpha = this.lifetime / this.maxLifetime;
                    this.size = size * (this.lifetime / this.maxLifetime);
                }
            };
            
            game.data.particles.push(particle);
        }
    }
    
    // 绘制物品
    draw(ctx) {
        if (this.isCollected) return;
        
        // 绘制脉冲效果
        const pulseScale = 1 + Math.sin(this.pulseTimer) * 0.1;
        const pulseAlpha = 0.3 + Math.sin(this.pulseTimer) * 0.2;
        
        ctx.save();
        ctx.globalAlpha = pulseAlpha;
        ctx.fillStyle = this.pulseColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulseScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // 绘制物品本体
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        
        // 如果物品即将消失，添加闪烁效果
        if (this.lifetime <= 3) {
            const flashAlpha = 0.5 + Math.sin(this.lifetime * 10) * 0.5;
            
            ctx.save();
            ctx.globalAlpha = flashAlpha;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

// 生命药水
class HealthPotion extends Item {
    constructor(healAmount = 30) {
        const rarity = healAmount > 50 ? 'rare' : healAmount > 30 ? 'uncommon' : 'common';
        
        super(`生命药水${healAmount > 50 ? '+' : healAmount > 30 ? '' : '-'}`, 'health', healAmount, rarity);
        this.healAmount = healAmount;
    }
    
    applyEffect(game) {
        const player = game.data.player;
        if (player) {
            const actualHeal = player.heal(this.healAmount);
            
            // 添加治疗提示
            game.addFloatingText(this.x, this.y, `+${actualHeal} HP`, '#4caf50');
        }
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // 绘制十字图标
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        // 十字竖线
        ctx.fillRect(this.x - 3, this.y - 8, 6, 16);
        // 十字横线
        ctx.fillRect(this.x - 8, this.y - 3, 16, 6);
        ctx.fill();
        ctx.restore();
    }
}

// 金钱
class Money extends Item {
    constructor(amount = 10) {
        let rarity = 'common';
        if (amount >= 50) rarity = 'rare';
        else if (amount >= 25) rarity = 'uncommon';
        
        super(`金币 x${amount}`, 'money', amount, rarity);
        this.amount = amount;
    }
    
    applyEffect(game) {
        // 添加金钱到游戏状态
        game.data.money += this.amount;
        
        // 添加金钱提示
        game.addFloatingText(this.x, this.y, `+$${this.amount}`, '#ffd700');
        
        // 更新玩家统计
        game.data.player.stats.moneyCollected += this.amount;
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // 绘制金币图标
        ctx.save();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制中间的美元符号
        ctx.fillStyle = '#ffffff';
        ctx.font = `${this.radius * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', this.x, this.y);
        ctx.restore();
    }
}

// 经验水晶
class ExperienceCrystal extends Item {
    constructor(amount = 25) {
        let rarity = 'common';
        if (amount >= 100) rarity = 'rare';
        else if (amount >= 50) rarity = 'uncommon';
        
        super(`经验水晶 x${amount}`, 'xp', amount, rarity);
        this.amount = amount;
    }
    
    applyEffect(game) {
        // 添加经验到游戏状态
        game.data.experience += this.amount;
        
        // 检查升级
        game.checkLevelUp();
        
        // 添加经验提示
        game.addFloatingText(this.x, this.y, `+${this.amount} XP`, '#9c27b0');
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // 绘制水晶图标
        ctx.save();
        ctx.fillStyle = this.color;
        
        // 绘制一个六边形
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = this.x + Math.cos(angle) * this.radius * 0.7;
            const y = this.y + Math.sin(angle) * this.radius * 0.7;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // 绘制中心光点
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 临时buff道具
class TemporaryBuff extends Item {
    constructor(type, value, duration = 10) {
        const buffNames = {
            damage: '力量药水',
            speed: '速度药水',
            luck: '幸运药水',
            defense: '防御药水'
        };
        
        const buffColors = {
            damage: '#f44336',
            speed: '#2196f3',
            luck: '#ffeb3b',
            defense: '#4caf50'
        };
        
        const rarity = duration > 15 ? 'rare' : 'uncommon';
        
        super(`${buffNames[type]}`, 'buff', value, rarity);
        this.buffType = type;
        this.duration = duration;
        this.baseColor = this.color;
        this.color = buffColors[type] || this.color;
    }
    
    applyEffect(game) {
        const player = game.data.player;
        if (player) {
            let effectText = '';
            
            // 创建临时buff效果
            const buffEffect = {
                type: this.buffType,
                value: this.value,
                duration: this.duration,
                startTime: game.data.time,
                update: function(deltaTime) {
                    this.duration -= deltaTime;
                },
                isExpired: function() {
                    return this.duration <= 0;
                }
            };
            
            // 根据buff类型应用不同效果
            switch (this.buffType) {
                case 'damage':
                    player.increaseDamage(this.value);
                    effectText = `+${this.value} 伤害`;
                    buffEffect.onExpire = () => player.increaseDamage(-this.value);
                    break;
                case 'speed':
                    player.increaseSpeed(this.value);
                    effectText = `+${this.value} 速度`;
                    buffEffect.onExpire = () => player.increaseSpeed(-this.value);
                    break;
                case 'luck':
                    player.increaseLuck(this.value);
                    effectText = `+${this.value} 幸运`;
                    buffEffect.onExpire = () => player.increaseLuck(-this.value);
                    break;
                case 'defense':
                    if (!player.damageReduction) player.damageReduction = 0;
                    player.damageReduction += this.value / 100;
                    effectText = `+${this.value}% 减伤`;
                    buffEffect.onExpire = () => player.damageReduction -= this.value / 100;
                    break;
            }
            
            // 添加到主动效果列表
            player.activeEffects.push(buffEffect);
            
            // 添加效果提示
            game.addFloatingText(this.x, this.y, `${effectText} (${this.duration}s)`, this.color);
            
            // 添加buff图标到UI
            game.addActiveBuff(this.buffType, this.duration, this.value, this.color);
        }
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // 根据buff类型绘制不同图标
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = `${this.radius * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let icon = '?';
        switch (this.buffType) {
            case 'damage': icon = '⚔️'; break;
            case 'speed': icon = '💨'; break;
            case 'luck': icon = '🍀'; break;
            case 'defense': icon = '🛡️'; break;
        }
        
        ctx.fillText(icon, this.x, this.y);
        ctx.restore();
    }
}

// 永久属性提升道具
class PermanentUpgrade extends Item {
    constructor(type, value) {
        const upgradeNames = {
            maxHealth: '生命精华',
            damage: '力量精华',
            speed: '速度精华',
            luck: '幸运精华'
        };
        
        const rarity = value > 10 ? 'legendary' : value > 5 ? 'epic' : 'rare';
        
        super(`${upgradeNames[type]}`, 'upgrade', value, rarity);
        this.upgradeType = type;
    }
    
    applyEffect(game) {
        const player = game.data.player;
        if (player) {
            let effectText = '';
            
            // 根据升级类型应用不同效果
            switch (this.upgradeType) {
                case 'maxHealth':
                    player.increaseMaxHealth(this.value);
                    effectText = `+${this.value} 最大生命值`;
                    break;
                case 'damage':
                    player.increaseDamage(this.value);
                    effectText = `+${this.value} 永久伤害`;
                    break;
                case 'speed':
                    player.increaseSpeed(this.value);
                    effectText = `+${this.value} 永久速度`;
                    break;
                case 'luck':
                    player.increaseLuck(this.value);
                    effectText = `+${this.value} 永久幸运`;
                    break;
            }
            
            // 添加效果提示
            game.addFloatingText(this.x, this.y, effectText, '#ff9800');
        }
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // 绘制星星图标表示永久提升
        ctx.save();
        ctx.fillStyle = '#ffeb3b';
        
        // 绘制五角星
        const radius = this.radius * 0.6;
        const cx = this.x;
        const cy = this.y;
        
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i / 5) - Math.PI / 2;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            const innerAngle = (Math.PI * 2 * (i + 0.5) / 5) - Math.PI / 2;
            const innerX = cx + Math.cos(innerAngle) * (radius * 0.5);
            const innerY = cy + Math.sin(innerAngle) * (radius * 0.5);
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

// 武器箱
class WeaponChest extends Item {
    constructor(level = 1) {
        const rarity = level >= 4 ? 'legendary' : level >= 3 ? 'epic' : level >= 2 ? 'rare' : 'uncommon';
        
        super(`武器箱 Lv.${level}`, 'weapon', level, rarity);
        this.weaponLevel = level;
    }
    
    applyEffect(game) {
        // 创建随机武器
        const newWeapon = WeaponFactory.createRandomWeapon(this.weaponLevel);
        
        // 添加武器到玩家
        game.data.player.addWeapon(newWeapon);
        
        // 添加武器获得提示
        game.addFloatingText(this.x, this.y, `获得 ${newWeapon.name}`, '#2196f3');
        
        // 显示武器获得界面
        game.showWeaponReward(newWeapon);
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // 绘制宝箱图标
        ctx.save();
        ctx.fillStyle = '#8b4513';
        
        // 宝箱底部
        ctx.fillRect(this.x - this.radius * 0.6, this.y - this.radius * 0.4, this.radius * 1.2, this.radius * 0.8);
        
        // 宝箱盖子
        ctx.fillStyle = '#6d3914';
        ctx.fillRect(this.x - this.radius * 0.6, this.y - this.radius * 0.6, this.radius * 1.2, this.radius * 0.2);
        
        // 宝箱装饰
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.radius * 0.5, this.radius * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 掉落管理器
class DropManager {
    constructor() {
        this.dropTables = {
            // 基础敌人掉落表
            basic: [
                { item: Money, params: [5], chance: 0.7 },
                { item: HealthPotion, params: [20], chance: 0.1 },
                { item: ExperienceCrystal, params: [15], chance: 0.2 }
            ],
            // 精英敌人掉落表
            elite: [
                { item: Money, params: [20], chance: 0.6 },
                { item: HealthPotion, params: [40], chance: 0.2 },
                { item: ExperienceCrystal, params: [50], chance: 0.3 },
                { item: TemporaryBuff, params: ['damage', 10, 10], chance: 0.15 },
                { item: WeaponChest, params: [2], chance: 0.1 }
            ],
            // Boss掉落表
            boss: [
                { item: Money, params: [100], chance: 0.8 },
                { item: HealthPotion, params: [80], chance: 0.4 },
                { item: ExperienceCrystal, params: [200], chance: 0.6 },
                { item: PermanentUpgrade, params: ['maxHealth', 15], chance: 0.3 },
                { item: WeaponChest, params: [4], chance: 0.4 },
                { item: TemporaryBuff, params: ['damage', 20, 20], chance: 0.3 }
            ],
            // 特殊事件掉落表
            event: [
                { item: Money, params: [50], chance: 0.5 },
                { item: ExperienceCrystal, params: [100], chance: 0.5 },
                { item: WeaponChest, params: [3], chance: 0.3 },
                { item: PermanentUpgrade, params: ['damage', 10], chance: 0.2 }
            ]
        };
    }
    
    // 生成掉落
    generateDrop(dropType, x, y, count = 1) {
        const dropTable = this.dropTables[dropType] || this.dropTables.basic;
        const drops = [];
        
        // 根据敌人等级增加掉落数量
        let actualCount = count;
        if (dropType === 'elite') actualCount = Math.max(1, Math.floor(count * 1.5));
        if (dropType === 'boss') actualCount = Math.max(1, Math.floor(count * 3));
        
        for (let i = 0; i < actualCount; i++) {
            // 随机选择掉落物
            for (const entry of dropTable) {
                if (Math.random() < entry.chance) {
                    const item = new entry.item(...entry.params);
                    item.x = x + (Math.random() - 0.5) * 50;
                    item.y = y + (Math.random() - 0.5) * 50;
                    
                    // 添加一些随机初速度
                    item.vx = (Math.random() - 0.5) * 100;
                    item.vy = (Math.random() - 0.5) * 50 - 100;
                    
                    drops.push(item);
                }
            }
        }
        
        // 如果没有掉落物，生成保底金钱
        if (drops.length === 0) {
            const minMoney = dropType === 'boss' ? 50 : dropType === 'elite' ? 10 : 5;
            const maxMoney = dropType === 'boss' ? 100 : dropType === 'elite' ? 30 : 15;
            const moneyAmount = minMoney + Math.floor(Math.random() * (maxMoney - minMoney + 1));
            
            const money = new Money(moneyAmount);
            money.x = x;
            money.y = y;
            money.vx = (Math.random() - 0.5) * 50;
            money.vy = -50;
            
            drops.push(money);
        }
        
        return drops;
    }
    
    // 生成随机掉落位置
    getRandomDropPosition(game, player) {
        // 确保掉落位置不会太靠近玩家
        let x, y;
        let distanceToPlayer;
        
        do {
            x = Math.random() * game.canvas.width;
            y = Math.random() * game.canvas.height * 0.7; // 主要在屏幕上半部分
            
            distanceToPlayer = Math.sqrt(
                Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2)
            );
        } while (distanceToPlayer < 100);
        
        return { x, y };
    }
    
    // 生成商店物品
    generateShopItems(level = 1) {
        const items = [];
        const itemCount = 4; // 商店每次显示4个物品
        
        // 可能的物品类型
        const itemTypes = [
            { generator: this.generateShopWeapon, weight: 3 },
            { generator: this.generateShopPotion, weight: 2 },
            { generator: this.generateShopUpgrade, weight: 2 },
            { generator: this.generateShopBuff, weight: 1 }
        ];
        
        // 权重总和
        const totalWeight = itemTypes.reduce((sum, type) => sum + type.weight, 0);
        
        for (let i = 0; i < itemCount; i++) {
            // 根据权重随机选择物品类型
            let random = Math.random() * totalWeight;
            let selectedType = itemTypes[0];
            
            for (const type of itemTypes) {
                random -= type.weight;
                if (random <= 0) {
                    selectedType = type;
                    break;
                }
            }
            
            // 生成物品
            const item = selectedType.generator(level);
            items.push(item);
        }
        
        return items;
    }
    
    // 生成商店武器
    generateShopWeapon(level) {
        const weapon = WeaponFactory.createShopWeapon(level);
        
        // 计算价格
        let basePrice = 50 + (level - 1) * 20;
        
        // 根据武器类型调整价格
        switch (weapon.type) {
            case 'pistol': basePrice *= 0.8; break;
            case 'shotgun': basePrice *= 1.2; break;
            case 'rifle': basePrice *= 1.3; break;
            case 'launcher': basePrice *= 1.5; break;
            case 'magic': basePrice *= 1.4; break;
            case 'sniper': basePrice *= 1.6; break;
            case 'laser': basePrice *= 1.5; break;
        }
        
        return {
            item: weapon,
            type: 'weapon',
            price: Math.floor(basePrice),
            description: `伤害: ${weapon.damage} | 射速: ${(1/weapon.fireRate).toFixed(1)}/秒`
        };
    }
    
    // 生成商店药水
    generateShopPotion(level) {
        const potionTypes = [
            { item: HealthPotion, params: [50 + (level - 1) * 20], name: '强效生命药水', priceBase: 30 },
            { item: TemporaryBuff, params: ['damage', 15 + level * 5, 15], name: '力量药水+', priceBase: 40 },
            { item: TemporaryBuff, params: ['speed', 20 + level * 5, 15], name: '速度药水+', priceBase: 40 },
            { item: TemporaryBuff, params: ['defense', 20 + level * 5, 15], name: '防御药水+', priceBase: 45 }
        ];
        
        const potion = potionTypes[Math.floor(Math.random() * potionTypes.length)];
        const item = new potion.item(...potion.params);
        const price = potion.priceBase + (level - 1) * 10;
        
        return {
            item: item,
            type: 'consumable',
            price: price,
            description: potion.description || `${potion.name} (持续15秒)`
        };
    }
    
    // 生成商店升级
    generateShopUpgrade(level) {
        const upgradeTypes = [
            { item: PermanentUpgrade, params: ['maxHealth', 10 + level * 3], name: '生命精华', priceBase: 100 },
            { item: PermanentUpgrade, params: ['damage', 8 + level * 2], name: '力量精华', priceBase: 90 },
            { item: PermanentUpgrade, params: ['speed', 10 + level * 3], name: '速度精华', priceBase: 80 },
            { item: PermanentUpgrade, params: ['luck', 20 + level * 5], name: '幸运精华', priceBase: 70 }
        ];
        
        const upgrade = upgradeTypes[Math.floor(Math.random() * upgradeTypes.length)];
        const item = new upgrade.item(...upgrade.params);
        const price = upgrade.priceBase + (level - 1) * 20;
        
        return {
            item: item,
            type: 'upgrade',
            price: price,
            description: `${upgrade.name} (永久提升)`
        };
    }
    
    // 生成商店特殊buff
    generateShopBuff(level) {
        const buff = new TemporaryBuff('all', 10 + level * 5, 30); // 全属性提升30秒
        
        return {
            item: buff,
            type: 'special',
            price: 150 + (level - 1) * 30,
            description: '全属性提升 (伤害、速度、防御) 持续30秒'
        };
    }
}

// 全局掉落管理器实例
globalDropManager = new DropManager();
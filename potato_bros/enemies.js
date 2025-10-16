// enemies.js - 敌人相关逻辑

class Enemy {
    constructor(x, y, type, waveNumber, difficultyMultiplier = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.waveNumber = waveNumber;
        this.difficultyMultiplier = difficultyMultiplier;
        
        // 基础属性（根据类型和波次调整）
        this.setBaseProperties();
        
        // 计算实际属性
        this.calculateProperties();
        
        // 移动相关
        this.vx = 0;
        this.vy = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.lastPathUpdate = 0;
        this.pathUpdateInterval = 0.5; // 秒
        
        // 攻击相关
        this.lastAttackTime = 0;
        this.attackRange = this.radius + 20;
        
        // 状态
        this.isHit = false;
        this.hitTimer = 0;
        this.isStunned = false;
        this.stunTimer = 0;
        
        // 动画
        this.animationFrame = 0;
        this.animationTimer = 0;
    }
    
    // 设置基础属性
    setBaseProperties() {
        switch (this.type) {
            case 'basic':
                this.baseHealth = 50;
                this.baseDamage = 5;
                this.baseSpeed = 50;
                this.baseSize = 20;
                this.baseMoneyValue = 5;
                this.baseScoreValue = 10;
                this.color = '#ff6b6b';
                this.knockback = 100;
                this.attackSpeed = 1.5;
                break;
                
            case 'fast':
                this.baseHealth = 30;
                this.baseDamage = 3;
                this.baseSpeed = 100;
                this.baseSize = 15;
                this.baseMoneyValue = 8;
                this.baseScoreValue = 15;
                this.color = '#4ecdc4';
                this.knockback = 80;
                this.attackSpeed = 1.0;
                break;
                
            case 'tank':
                this.baseHealth = 100;
                this.baseDamage = 10;
                this.baseSpeed = 30;
                this.baseSize = 30;
                this.baseMoneyValue = 12;
                this.baseScoreValue = 25;
                this.color = '#ffd166';
                this.knockback = 150;
                this.attackSpeed = 2.0;
                break;
                
            case 'ranged':
                this.baseHealth = 40;
                this.baseDamage = 8;
                this.baseSpeed = 40;
                this.baseSize = 18;
                this.baseMoneyValue = 10;
                this.baseScoreValue = 20;
                this.color = '#6a0572';
                this.knockback = 90;
                this.attackSpeed = 2.5;
                this.attackRange = 150;
                this.canShoot = true;
                break;
                
            case 'healer':
                this.baseHealth = 60;
                this.baseDamage = 2;
                this.baseSpeed = 35;
                this.baseSize = 22;
                this.baseMoneyValue = 15;
                this.baseScoreValue = 30;
                this.color = '#1a535c';
                this.knockback = 70;
                this.attackSpeed = 0.5;
                this.healRange = 100;
                this.healAmount = 5;
                this.healInterval = 2.0;
                this.lastHealTime = 0;
                break;
                
            default:
                this.baseHealth = 50;
                this.baseDamage = 5;
                this.baseSpeed = 50;
                this.baseSize = 20;
                this.baseMoneyValue = 5;
                this.baseScoreValue = 10;
                this.color = '#ff6b6b';
                this.knockback = 100;
                this.attackSpeed = 1.5;
        }
    }
    
    // 根据波次和难度计算实际属性
    calculateProperties() {
        const waveMultiplier = 1 + (this.waveNumber - 1) * 0.15;
        const finalMultiplier = waveMultiplier * this.difficultyMultiplier;
        
        this.maxHealth = Math.floor(this.baseHealth * finalMultiplier);
        this.health = this.maxHealth;
        this.damage = Math.floor(this.baseDamage * finalMultiplier);
        this.speed = this.baseSpeed * (0.8 + 0.4 * (1 / finalMultiplier)); // 速度增长较慢
        this.radius = this.baseSize * (0.9 + 0.2 * Math.min(finalMultiplier, 2)); // 大小适度增长
        this.moneyValue = Math.floor(this.baseMoneyValue * finalMultiplier);
        this.scoreValue = Math.floor(this.baseScoreValue * finalMultiplier);
    }
    
    // 更新敌人状态
    update(game, deltaTime) {
        // 处理受击状态
        if (this.isHit) {
            this.hitTimer -= deltaTime;
            if (this.hitTimer <= 0) {
                this.isHit = false;
            }
        }
        
        // 处理眩晕状态
        if (this.isStunned) {
            this.stunTimer -= deltaTime;
            if (this.stunTimer <= 0) {
                this.isStunned = false;
                this.vx = 0;
                this.vy = 0;
            } else {
                // 眩晕状态下仍然减速移动
                this.x += this.vx * 0.3 * deltaTime;
                this.y += this.vy * 0.3 * deltaTime;
                return;
            }
        }
        
        // 更新动画
        this.updateAnimation(deltaTime);
        
        // 跟踪玩家
        this.followPlayer(game, deltaTime);
        
        // 攻击玩家
        this.attackPlayer(game, deltaTime);
        
        // 特殊行为
        this.specialBehavior(game, deltaTime);
        
        // 边界检查（防止敌人离开太远）
        this.boundaryCheck(game);
    }
    
    // 更新动画
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        if (this.animationTimer >= 0.1) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
    }
    
    // 跟随玩家
    followPlayer(game, deltaTime) {
        if (!game.data.player) return;
        
        // 定期更新路径
        this.lastPathUpdate += deltaTime;
        if (this.lastPathUpdate >= this.pathUpdateInterval) {
            this.targetX = game.data.player.x;
            this.targetY = game.data.player.y;
            this.lastPathUpdate = 0;
        }
        
        // 计算移动方向
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果足够接近，调整移动速度
        let moveSpeed = this.speed;
        if (distance < this.attackRange) {
            // 进入攻击范围，减速
            moveSpeed *= 0.5;
        }
        
        // 设置移动速度
        if (distance > 0) {
            this.vx = (dx / distance) * moveSpeed;
            this.vy = (dy / distance) * moveSpeed;
        }
        
        // 应用移动
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }
    
    // 攻击玩家
    attackPlayer(game, deltaTime) {
        if (!game.data.player) return;
        
        // 检查是否可以攻击
        this.lastAttackTime += deltaTime;
        if (this.lastAttackTime < this.attackSpeed) return;
        
        // 计算与玩家的距离
        const dx = game.data.player.x - this.x;
        const dy = game.data.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 检查是否在攻击范围内
        if (distance <= this.attackRange) {
            // 普通攻击
            this.performAttack(game);
            this.lastAttackTime = 0;
        }
    }
    
    // 执行攻击
    performAttack(game) {
        // 近战攻击
        if (!this.canShoot) {
            // 玩家已经在update中通过碰撞检测受到伤害
            // 这里可以添加攻击特效
            this.createAttackParticles();
        } else {
            // 远程攻击
            this.shootProjectile(game);
        }
    }
    
    // 远程敌人射击
    shootProjectile(game) {
        if (!game.data.player) return;
        
        // 计算射击方向
        const dx = game.data.player.x - this.x;
        const dy = game.data.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const angle = Math.atan2(dy, dx);
            const projectileSpeed = 200;
            
            // 创建投射物
            const projectile = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * projectileSpeed,
                vy: Math.sin(angle) * projectileSpeed,
                radius: 8,
                damage: this.damage,
                color: this.color,
                lifetime: 3,
                owner: 'enemy',
                piercing: false,
                update: function(game, deltaTime) {
                    this.x += this.vx * deltaTime;
                    this.y += this.vy * deltaTime;
                    this.lifetime -= deltaTime;
                }
            };
            
            game.data.projectiles.push(projectile);
            
            // 创建射击特效
            this.createShootParticles();
        }
    }
    
    // 特殊行为
    specialBehavior(game, deltaTime) {
        switch (this.type) {
            case 'healer':
                this.healNearbyEnemies(game, deltaTime);
                break;
                
            case 'fast':
                // 快速敌人有几率冲刺
                this.dashBehavior(deltaTime);
                break;
                
            case 'tank':
                // 坦克敌人减伤
                this.damageReduction();
                break;
        }
    }
    
    // 治疗者治疗附近敌人
    healNearbyEnemies(game, deltaTime) {
        this.lastHealTime += deltaTime;
        if (this.lastHealTime >= this.healInterval) {
            let enemiesHealed = false;
            
            for (const enemy of game.data.enemies) {
                if (enemy === this) continue;
                
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.healRange && enemy.health < enemy.maxHealth) {
                    // 治疗敌人
                    enemy.health = Math.min(enemy.health + this.healAmount, enemy.maxHealth);
                    enemiesHealed = true;
                    
                    // 创建治疗特效
                    this.createHealParticles(enemy.x, enemy.y);
                }
            }
            
            if (enemiesHealed) {
                this.lastHealTime = 0;
            }
        }
    }
    
    // 快速敌人冲刺行为
    dashBehavior(deltaTime) {
        // 10%概率冲刺
        if (Math.random() < 0.01 && !this.isDashing) {
            this.isDashing = true;
            this.dashDuration = 0.5;
            this.dashTimer = this.dashDuration;
            this.dashSpeed = this.speed * 2.5;
        }
        
        if (this.isDashing) {
            this.dashTimer -= deltaTime;
            
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.speed = this.baseSpeed;
            } else {
                // 冲刺时速度增加
                this.speed = this.baseSpeed + (this.dashSpeed - this.baseSpeed) * (this.dashTimer / this.dashDuration);
            }
        }
    }
    
    // 坦克敌人减伤
    damageReduction() {
        // 坦克敌人受到的伤害减少20%
        this.damageReductionFactor = 0.8;
    }
    
    // 受到伤害
    takeDamage(amount) {
        // 应用减伤效果
        if (this.damageReductionFactor) {
            amount *= this.damageReductionFactor;
        }
        
        // 最小伤害为1
        amount = Math.max(1, Math.floor(amount));
        
        // 扣除生命值
        this.health -= amount;
        
        // 设置受击状态
        this.isHit = true;
        this.hitTimer = 0.1;
        
        // 特殊效果反馈
        this.onHit();
        
        return amount;
    }
    
    // 受击效果
    onHit() {
        // 闪烁效果等在render中处理
    }
    
    // 眩晕
    stun(duration) {
        this.isStunned = true;
        this.stunTimer = duration;
    }
    
    // 击退
    knockback(angle, force) {
        this.vx = Math.cos(angle) * force;
        this.vy = Math.sin(angle) * force;
    }
    
    // 边界检查
    boundaryCheck(game) {
        // 保持敌人在屏幕范围内或附近
        const margin = 100;
        
        if (this.x < -margin) this.x = -margin;
        if (this.x > game.canvas.width + margin) this.x = game.canvas.width + margin;
        if (this.y < -margin) this.y = -margin;
        if (this.y > game.canvas.height + margin) this.y = game.canvas.height + margin;
    }
    
    // 创建攻击粒子效果
    createAttackParticles() {
        // 可以在game.js中实现具体的粒子效果
    }
    
    // 创建射击粒子效果
    createShootParticles() {
        // 可以在game.js中实现具体的粒子效果
    }
    
    // 创建治疗粒子效果
    createHealParticles(targetX, targetY) {
        // 可以在game.js中实现具体的粒子效果
    }
}

// 精英敌人类型
class EliteEnemy extends Enemy {
    constructor(x, y, type, waveNumber, difficultyMultiplier = 1) {
        super(x, y, type, waveNumber, difficultyMultiplier);
        
        // 精英敌人强化
        this.isElite = true;
        this.maxHealth *= 2;
        this.health = this.maxHealth;
        this.damage *= 1.5;
        this.radius *= 1.2;
        this.moneyValue *= 3;
        this.scoreValue *= 3;
        
        // 精英特效颜色
        this.eliteGlowColor = this.getEliteGlowColor();
    }
    
    // 获取精英敌人的发光颜色
    getEliteGlowColor() {
        switch (this.type) {
            case 'basic': return '#ff4444';
            case 'fast': return '#44ffff';
            case 'tank': return '#ffff44';
            case 'ranged': return '#aa00ff';
            case 'healer': return '#00ffaa';
            default: return '#ffaa00';
        }
    }
    
    // 精英敌人特殊能力
    specialBehavior(game, deltaTime) {
        super.specialBehavior(game, deltaTime);
        
        // 精英敌人每10秒恢复10%生命值
        this.regenerationTimer = (this.regenerationTimer || 0) + deltaTime;
        if (this.regenerationTimer >= 10) {
            const healAmount = this.maxHealth * 0.1;
            this.health = Math.min(this.health + healAmount, this.maxHealth);
            this.regenerationTimer = 0;
            
            // 创建恢复特效
            this.createRegenParticles();
        }
    }
    
    // 创建生命恢复粒子效果
    createRegenParticles() {
        // 可以在game.js中实现具体的粒子效果
    }
}

// BOSS敌人类型
class BossEnemy extends Enemy {
    constructor(x, y, waveNumber, difficultyMultiplier = 1) {
        super(x, y, 'boss', waveNumber, difficultyMultiplier);
        
        // BOSS属性
        this.isBoss = true;
        this.maxHealth = 1000 * (1 + (waveNumber - 1) * 0.5);
        this.health = this.maxHealth;
        this.damage = 20 * (1 + (waveNumber - 1) * 0.2);
        this.speed = 25;
        this.radius = 50;
        this.moneyValue = 50;
        this.scoreValue = 500;
        this.color = '#ff0000';
        this.knockback = 200;
        this.attackSpeed = 3.0;
        
        // BOSS特殊属性
        this.phase = 1;
        this.phaseThreshold = this.maxHealth * 0.7;
        this.abilities = ['shockwave', 'summon', 'charge'];
        this.lastAbilityTime = 0;
        this.abilityCooldown = 10;
        
        // BOSS光环
        this.auraRadius = this.radius + 30;
        this.auraColor = '#ff6600';
    }
    
    // BOSS更新
    update(game, deltaTime) {
        super.update(game, deltaTime);
        
        // 检查阶段转换
        this.checkPhaseTransition();
        
        // 使用特殊能力
        this.useBossAbilities(game, deltaTime);
    }
    
    // 检查阶段转换
    checkPhaseTransition() {
        if (this.health <= this.phaseThreshold && this.phase === 1) {
            this.phase = 2;
            this.phaseThreshold = this.maxHealth * 0.3;
            this.speed *= 1.2;
            this.attackSpeed *= 0.8;
            this.damage *= 1.5;
            this.auraColor = '#ff0066';
            
            // 阶段转换特效
            this.createPhaseTransitionEffect();
        } else if (this.health <= this.phaseThreshold && this.phase === 2) {
            this.phase = 3;
            this.speed *= 1.2;
            this.attackSpeed *= 0.8;
            this.damage *= 1.5;
            this.auraColor = '#6600ff';
            
            // 阶段转换特效
            this.createPhaseTransitionEffect();
        }
    }
    
    // 使用BOSS能力
    useBossAbilities(game, deltaTime) {
        this.lastAbilityTime += deltaTime;
        if (this.lastAbilityTime >= this.abilityCooldown) {
            // 选择一个能力
            const ability = this.abilities[Math.floor(Math.random() * this.abilities.length)];
            
            // 使用能力
            switch (ability) {
                case 'shockwave':
                    this.shockwaveAbility(game);
                    break;
                case 'summon':
                    this.summonAbility(game);
                    break;
                case 'charge':
                    this.chargeAbility(game);
                    break;
            }
            
            this.lastAbilityTime = 0;
        }
    }
    
    // 冲击波能力
    shockwaveAbility(game) {
        if (!game.data.player) return;
        
        // 创建冲击波
        const shockwave = {
            x: this.x,
            y: this.y,
            radius: this.radius,
            maxRadius: this.radius * 5,
            damage: this.damage * 0.8,
            color: this.auraColor,
            lifetime: 1,
            maxLifetime: 1,
            update: function(deltaTime) {
                this.lifetime -= deltaTime;
                const progress = 1 - (this.lifetime / this.maxLifetime);
                this.radius = this.maxRadius * progress;
            }
        };
        
        // 添加冲击波到游戏中
        game.data.shockwaves = game.data.shockwaves || [];
        game.data.shockwaves.push(shockwave);
        
        // 对范围内的玩家造成伤害
        const dx = game.data.player.x - this.x;
        const dy = game.data.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= shockwave.maxRadius) {
            game.data.player.takeDamage(shockwave.damage);
            
            // 击退玩家
            const angle = Math.atan2(dy, dx);
            game.data.player.knockback(angle, 300);
        }
        
        // 创建冲击波特效
        this.createShockwaveEffect();
    }
    
    // 召唤能力
    summonAbility(game) {
        const summonCount = 3 + this.phase;
        const enemyTypes = ['basic', 'fast', 'ranged'];
        
        for (let i = 0; i < summonCount; i++) {
            // 围绕BOSS随机位置
            const angle = Math.random() * Math.PI * 2;
            const distance = this.radius + 50;
            const x = this.x + Math.cos(angle) * distance;
            const y = this.y + Math.sin(angle) * distance;
            
            // 随机敌人类型
            const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            // 创建敌人
            const enemy = new Enemy(x, y, enemyType, this.waveNumber, this.difficultyMultiplier);
            game.data.enemies.push(enemy);
        }
        
        // 创建召唤特效
        this.createSummonEffect();
    }
    
    // 冲锋能力
    chargeAbility(game) {
        if (!game.data.player) return;
        
        // 计算冲锋方向
        const dx = game.data.player.x - this.x;
        const dy = game.data.player.y - this.y;
        const angle = Math.atan2(dy, dx);
        const chargeSpeed = 200;
        
        // 设置冲锋状态
        this.isCharging = true;
        this.chargeDuration = 1.5;
        this.chargeTimer = this.chargeDuration;
        this.chargeVX = Math.cos(angle) * chargeSpeed;
        this.chargeVY = Math.sin(angle) * chargeSpeed;
        
        // 创建冲锋特效
        this.createChargeEffect();
    }
    
    // 覆盖移动方法以处理冲锋
    followPlayer(game, deltaTime) {
        if (this.isCharging) {
            this.chargeTimer -= deltaTime;
            
            if (this.chargeTimer <= 0) {
                this.isCharging = false;
                this.vx = 0;
                this.vy = 0;
            } else {
                // 冲锋移动
                this.x += this.chargeVX * deltaTime;
                this.y += this.chargeVY * deltaTime;
                
                // 检查是否撞到玩家
                if (game.data.player) {
                    const dx = game.data.player.x - this.x;
                    const dy = game.data.player.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= this.radius + game.data.player.radius) {
                        // 造成伤害
                        game.data.player.takeDamage(this.damage * 1.5);
                        
                        // 击退玩家
                        const angle = Math.atan2(dy, dx);
                        game.data.player.knockback(angle, 400);
                        
                        // 结束冲锋
                        this.isCharging = false;
                        this.vx = 0;
                        this.vy = 0;
                    }
                }
            }
        } else {
            // 正常跟随
            super.followPlayer(game, deltaTime);
        }
    }
    
    // 创建阶段转换效果
    createPhaseTransitionEffect() {
        // 可以在game.js中实现具体的粒子效果
    }
    
    // 创建冲击波效果
    createShockwaveEffect() {
        // 可以在game.js中实现具体的粒子效果
    }
    
    // 创建召唤效果
    createSummonEffect() {
        // 可以在game.js中实现具体的粒子效果
    }
    
    // 创建冲锋效果
    createChargeEffect() {
        // 可以在game.js中实现具体的粒子效果
    }
}

// BOSS类型1: 范围型BOSS
class RangeBoss extends BossEnemy {
    constructor(x, y, waveNumber, difficultyMultiplier = 1) {
        super(x, y, waveNumber, difficultyMultiplier);
        
        // 修改基本属性
        this.maxHealth = 1200 * (1 + (waveNumber - 1) * 0.5);
        this.health = this.maxHealth;
        this.damage = 15 * (1 + (waveNumber - 1) * 0.2);
        this.speed = 20;
        this.color = '#0099ff';
        this.auraColor = '#00ccff';
        
        // 特殊属性
        this.bossType = 'range';
        this.abilities = ['volley', 'minefield', 'teleport'];
        this.abilityCooldown = 8; // 冷却时间更短
        
        // 特定能力相关属性
        this.volleyProjectileCount = 8;
        this.mineCount = 5;
    }
    
    // 弹幕攻击
    volleyAbility(game) {
        if (!game.data.player) return;
        
        const angleStep = (Math.PI * 2) / this.volleyProjectileCount;
        
        for (let i = 0; i < this.volleyProjectileCount; i++) {
            const angle = i * angleStep;
            const projectileSpeed = 250;
            
            // 创建投射物
            const projectile = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * projectileSpeed,
                vy: Math.sin(angle) * projectileSpeed,
                radius: 10,
                damage: this.damage * 0.6,
                color: this.auraColor,
                lifetime: 3,
                owner: 'boss',
                update: function(deltaTime) {
                    this.x += this.vx * deltaTime;
                    this.y += this.vy * deltaTime;
                    this.lifetime -= deltaTime;
                }
            };
            
            game.data.projectiles.push(projectile);
        }
    }
    
    // 布雷能力
    minefieldAbility(game) {
        for (let i = 0; i < this.mineCount; i++) {
            // 在地图上随机位置布雷
            const x = Math.random() * game.canvas.width;
            const y = Math.random() * game.canvas.height;
            
            // 创建地雷
            const mine = {
                x: x,
                y: y,
                radius: 15,
                damage: this.damage * 1.2,
                color: '#ff6600',
                triggerRadius: 100,
                lifetime: 15,
                activated: false,
                update: function(deltaTime, game) {
                    this.lifetime -= deltaTime;
                    
                    // 检查是否有玩家接近
                    if (!this.activated && game.data.player) {
                        const dx = game.data.player.x - this.x;
                        const dy = game.data.player.y - this.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance <= this.triggerRadius) {
                            this.activated = true;
                            this.explode(game);
                        }
                    }
                },
                explode: function(game) {
                    // 创建爆炸效果
                    // 对范围内的玩家造成伤害
                    if (game.data.player) {
                        const dx = game.data.player.x - this.x;
                        const dy = game.data.player.y - this.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance <= this.radius * 3) {
                            game.data.player.takeDamage(this.damage);
                            const angle = Math.atan2(dy, dx);
                            game.data.player.knockback(angle, 250);
                        }
                    }
                }
            };
            
            // 添加地雷到游戏中
            game.data.mines = game.data.mines || [];
            game.data.mines.push(mine);
        }
    }
    
    // 传送能力
    teleportAbility(game) {
        // 在地图上随机位置传送
        this.x = Math.random() * game.canvas.width;
        this.y = Math.random() * game.canvas.height;
        
        // 创建传送特效
    }
    
    // 重写使用能力方法
    useBossAbilities(game, deltaTime) {
        this.lastAbilityTime += deltaTime;
        if (this.lastAbilityTime >= this.abilityCooldown) {
            // 随机选择一个能力
            const abilityIndex = Math.floor(Math.random() * this.abilities.length);
            const ability = this.abilities[abilityIndex];
            
            // 执行选中的能力
            switch (ability) {
                case 'volley':
                    this.volleyAbility(game);
                    break;
                case 'minefield':
                    this.minefieldAbility(game);
                    break;
                case 'teleport':
                    this.teleportAbility(game);
                    break;
            }
            
            this.lastAbilityTime = 0;
        }
    }
}

// BOSS类型2: 近战坦克型BOSS
class TankBoss extends BossEnemy {
    constructor(x, y, waveNumber, difficultyMultiplier = 1) {
        super(x, y, waveNumber, difficultyMultiplier);
        
        // 修改基本属性
        this.maxHealth = 1800 * (1 + (waveNumber - 1) * 0.5); // 更高的生命值
        this.health = this.maxHealth;
        this.damage = 30 * (1 + (waveNumber - 1) * 0.2); // 更高的伤害
        this.speed = 15; // 更慢的速度
        this.radius = 60; // 更大的体积
        this.color = '#990000';
        this.auraColor = '#ff3333';
        
        // 特殊属性
        this.bossType = 'tank';
        this.abilities = ['smash', 'taunt', 'shield'];
        this.abilityCooldown = 12; // 冷却时间更长
        
        // 特定能力相关属性
        this.shieldActive = false;
        this.shieldDuration = 5;
        this.shieldRemaining = 0;
        this.damageReduction = 0.7; // 护盾减伤70%
    }
    
    // 重写受伤方法以处理护盾减伤
    takeDamage(damage, source = null) {
        if (this.shieldActive) {
            // 护盾状态下减少伤害
            const reducedDamage = damage * (1 - this.damageReduction);
            super.takeDamage(reducedDamage, source);
        } else {
            super.takeDamage(damage, source);
        }
    }
    
    // 重写更新方法以处理护盾持续时间
    update(game, deltaTime) {
        super.update(game, deltaTime);
        
        // 处理护盾状态
        if (this.shieldActive) {
            this.shieldRemaining -= deltaTime;
            if (this.shieldRemaining <= 0) {
                this.shieldActive = false;
            }
        }
    }
    
    // 粉碎攻击
    smashAbility(game) {
        // 范围AOE攻击
        const smashRadius = this.radius * 3;
        const smashDamage = this.damage * 1.5;
        
        // 对范围内的玩家造成伤害
        if (game.data.player) {
            const dx = game.data.player.x - this.x;
            const dy = game.data.player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= smashRadius) {
                game.data.player.takeDamage(smashDamage);
                const angle = Math.atan2(dy, dx);
                game.data.player.knockback(angle, 400); // 强力击退
            }
        }
        
        // 创建粉碎特效
    }
    
    // 嘲讽能力 - 将玩家拉向BOSS
    tauntAbility(game) {
        if (!game.data.player) return;
        
        const pullForce = 300;
        const dx = this.x - game.data.player.x;
        const dy = this.y - game.data.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // 拉拽玩家
            game.data.player.vx += (dx / distance) * pullForce;
            game.data.player.vy += (dy / distance) * pullForce;
        }
    }
    
    // 护盾能力
    shieldAbility(game) {
        this.shieldActive = true;
        this.shieldRemaining = this.shieldDuration;
        
        // 创建护盾特效
    }
    
    // 重写使用能力方法
    useBossAbilities(game, deltaTime) {
        this.lastAbilityTime += deltaTime;
        if (this.lastAbilityTime >= this.abilityCooldown) {
            // 随机选择一个能力
            const abilityIndex = Math.floor(Math.random() * this.abilities.length);
            const ability = this.abilities[abilityIndex];
            
            // 执行选中的能力
            switch (ability) {
                case 'smash':
                    this.smashAbility(game);
                    break;
                case 'taunt':
                    this.tauntAbility(game);
                    break;
                case 'shield':
                    this.shieldAbility(game);
                    break;
            }
            
            this.lastAbilityTime = 0;
        }
    }
}

// BOSS类型3: 召唤型BOSS
class SummonerBoss extends BossEnemy {
    constructor(x, y, waveNumber, difficultyMultiplier = 1) {
        super(x, y, waveNumber, difficultyMultiplier);
        
        // 修改基本属性
        this.maxHealth = 1000 * (1 + (waveNumber - 1) * 0.5);
        this.health = this.maxHealth;
        this.damage = 10 * (1 + (waveNumber - 1) * 0.2);
        this.speed = 30;
        this.color = '#660066';
        this.auraColor = '#990099';
        
        // 特殊属性
        this.bossType = 'summoner';
        this.abilities = ['massSummon', 'buff', 'split'];
        this.abilityCooldown = 10;
        
        // 特定能力相关属性
        this.summonGroups = 3;
        this.minionsPerGroup = 4;
    }
    
    // 大规模召唤能力
    massSummonAbility(game) {
        // 分几组召唤敌人
        const enemyTypes = ['basic', 'fast', 'tank', 'ranged', 'healer'];
        
        for (let g = 0; g < this.summonGroups; g++) {
            // 每组敌人围绕一个点生成
            const groupAngle = (Math.PI * 2 / this.summonGroups) * g;
            const groupDistance = this.radius + 100;
            const groupX = this.x + Math.cos(groupAngle) * groupDistance;
            const groupY = this.y + Math.sin(groupAngle) * groupDistance;
            
            // 在组点周围生成多个敌人
            for (let i = 0; i < this.minionsPerGroup; i++) {
                // 围绕组点随机位置
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 50;
                const x = groupX + Math.cos(angle) * distance;
                const y = groupY + Math.sin(angle) * distance;
                
                // 随机敌人类型
                const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
                
                // 创建敌人
                const enemy = new Enemy(x, y, enemyType, this.waveNumber, this.difficultyMultiplier);
                game.data.enemies.push(enemy);
            }
        }
        
        // 创建召唤特效
    }
    
    // 增益能力 - 强化所有当前敌人
    buffAbility(game) {
        for (const enemy of game.data.enemies) {
            if (enemy !== this && !enemy.isBoss) { // 不强化自己和其他BOSS
                // 增加敌人属性
                enemy.maxHealth *= 1.5;
                enemy.health = Math.min(enemy.health * 1.5, enemy.maxHealth);
                enemy.damage *= 1.2;
                enemy.speed *= 1.1;
                
                // 添加视觉效果标记
                enemy.isBuffed = true;
                enemy.buffDuration = 10; // 增益持续10秒
            }
        }
    }
    
    // 分裂能力 - 生命值低于50%时触发，分裂成小BOSS
    splitAbility(game) {
        // 只有在生命值低于50%时才能使用此能力
        if (this.health / this.maxHealth > 0.5) {
            // 如果生命值太高，选择其他能力
            const otherAbilities = ['massSummon', 'buff'];
            const abilityIndex = Math.floor(Math.random() * otherAbilities.length);
            
            switch (otherAbilities[abilityIndex]) {
                case 'massSummon':
                    this.massSummonAbility(game);
                    break;
                case 'buff':
                    this.buffAbility(game);
                    break;
            }
            return;
        }
        
        // 创建两个小分身
        const splitCount = 2;
        const splitAngleStep = (Math.PI * 2) / splitCount;
        
        for (let i = 0; i < splitCount; i++) {
            const angle = i * splitAngleStep;
            const distance = this.radius + 50;
            const x = this.x + Math.cos(angle) * distance;
            const y = this.y + Math.sin(angle) * distance;
            
            // 创建小分身（使用基本Enemy类但有特殊属性）
            const minion = new Enemy(x, y, 'miniBoss', this.waveNumber, this.difficultyMultiplier);
            minion.maxHealth = this.maxHealth * 0.3;
            minion.health = minion.maxHealth;
            minion.damage = this.damage * 0.7;
            minion.speed = this.speed * 1.2;
            minion.radius = this.radius * 0.6;
            minion.color = this.auraColor;
            minion.isMiniBoss = true;
            
            game.data.enemies.push(minion);
        }
        
        // 创建分裂特效
    }
    
    // 重写使用能力方法
    useBossAbilities(game, deltaTime) {
        this.lastAbilityTime += deltaTime;
        if (this.lastAbilityTime >= this.abilityCooldown) {
            // 随机选择一个能力
            const abilityIndex = Math.floor(Math.random() * this.abilities.length);
            const ability = this.abilities[abilityIndex];
            
            // 执行选中的能力
            switch (ability) {
                case 'massSummon':
                    this.massSummonAbility(game);
                    break;
                case 'buff':
                    this.buffAbility(game);
                    break;
                case 'split':
                    this.splitAbility(game);
                    break;
            }
            
            this.lastAbilityTime = 0;
        }
    }
}
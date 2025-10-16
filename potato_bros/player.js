// player.js - 玩家相关逻辑

class Player {
    constructor(x, y, characterType = 'potato') {
        this.x = x;
        this.y = y;
        this.characterType = characterType;
        
        // 基础属性
        this.setBaseProperties();
        
        // 实际属性
        this.maxHealth = this.baseHealth;
        this.health = this.maxHealth;
        this.speed = this.baseSpeed;
        this.damage = this.baseDamage;
        this.luck = this.baseLuck;
        this.radius = 20;
        
        // 移动相关
        this.vx = 0;
        this.vy = 0;
        this.maxSpeed = this.speed;
        this.acceleration = this.speed * 5;
        this.deceleration = this.speed * 8;
        this.isMoving = false;
        this.moveDirection = { x: 0, y: 0 };
        
        // 攻击相关
        this.weapons = [];
        this.currentWeaponIndex = 0;
        this.lastAttackTime = 0;
        this.attackRange = 100;
        
        // 技能相关
        this.skills = [];
        this.activeEffects = [];
        
        // 状态效果
        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;
        this.isStunned = false;
        this.stunTimer = 0;
        this.isSlowed = false;
        this.slowTimer = 0;
        this.slowFactor = 1;
        
        // 统计数据
        this.stats = {
            enemiesKilled: 0,
            damageDealt: 0,
            damageTaken: 0,
            shotsFired: 0,
            shotsHit: 0,
            itemsCollected: 0,
            highestCombo: 0,
            currentCombo: 0,
            moneyCollected: 0,
            timePlayed: 0
        };
        
        // 视觉效果
        this.color = '#ff9800';
        this.visualEffects = [];
        
        // 初始化默认武器
        this.initializeDefaultWeapon();
        
        // 初始化技能
        this.initializeSkills();
    }
    
    // 设置基础属性
    setBaseProperties() {
        switch (this.characterType) {
            case 'potato':
                this.baseHealth = 100;
                this.baseSpeed = 100;
                this.baseDamage = 10;
                this.baseLuck = 100;
                this.specialAbility = '无特殊能力，但属性均衡';
                break;
                
            case 'strong':
                this.baseHealth = 150;
                this.baseSpeed = 70;
                this.baseDamage = 12;
                this.baseLuck = 80;
                this.specialAbility = '受到伤害减少10%';
                this.damageReduction = 0.1;
                break;
                
            case 'fast':
                this.baseHealth = 80;
                this.baseSpeed = 150;
                this.baseDamage = 9;
                this.baseLuck = 120;
                this.specialAbility = '移动时闪避率提高15%';
                this.dodgeBonus = 0.15;
                break;
                
            default:
                this.baseHealth = 100;
                this.baseSpeed = 100;
                this.baseDamage = 10;
                this.baseLuck = 100;
                this.specialAbility = '无特殊能力，但属性均衡';
        }
    }
    
    // 初始化默认武器
    initializeDefaultWeapon() {
        const defaultWeapon = new Weapon({
            name: '土豆枪',
            type: 'pistol',
            damage: 10,
            fireRate: 1,
            ammo: Infinity,
            maxAmmo: Infinity,
            reloadTime: 0,
            bulletSpeed: 500,
            bulletSize: 8,
            bulletColor: '#ff9800',
            bulletLifetime: 2,
            piercing: false,
            spread: 0,
            projectilesPerShot: 1,
            bulletEffect: null,
            sound: null
        });
        
        this.weapons.push(defaultWeapon);
    }
    
    // 初始化技能
    initializeSkills() {
        // 土豆护盾技能
        const shieldSkill = new Skill({
            name: '土豆护盾',
            type: 'defensive',
            cooldown: 10,
            duration: 3,
            effect: () => {
                this.isInvulnerable = true;
                this.addVisualEffect('shield');
                
                setTimeout(() => {
                    this.isInvulnerable = false;
                    this.removeVisualEffect('shield');
                }, 3000);
            },
            description: '创造一个护盾，使你在3秒内免疫所有伤害'
        });
        
        // 土豆炸弹技能
        const bombSkill = new Skill({
            name: '土豆炸弹',
            type: 'offensive',
            cooldown: 15,
            effect: (game) => {
                // 创建一个范围爆炸
                const bombDamage = 50 + this.damage * 0.5;
                const bombRadius = 150;
                
                // 对范围内敌人造成伤害
                for (let i = game.data.enemies.length - 1; i >= 0; i--) {
                    const enemy = game.data.enemies[i];
                    const dx = enemy.x - this.x;
                    const dy = enemy.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= bombRadius) {
                        // 距离越近伤害越高
                        const damageMultiplier = 1 - (distance / bombRadius);
                        const damage = Math.floor(bombDamage * (0.5 + damageMultiplier * 0.5));
                        enemy.takeDamage(damage);
                        
                        // 击退敌人
                        const angle = Math.atan2(dy, dx);
                        enemy.knockback(angle, 200);
                    }
                }
                
                // 创建爆炸特效
                this.createBombExplosionEffect(game);
            },
            description: '投掷一个土豆炸弹，对范围内敌人造成伤害并击退'
        });
        
        this.skills.push(shieldSkill, bombSkill);
    }
    
    // 更新玩家状态
    update(game, deltaTime) {
        // 更新统计时间
        this.stats.timePlayed += deltaTime;
        
        // 处理移动
        this.handleMovement(game, deltaTime);
        
        // 处理攻击
        this.handleAttack(game, deltaTime);
        
        // 处理技能
        this.updateSkills(deltaTime);
        
        // 处理状态效果
        this.updateStatusEffects(deltaTime);
        
        // 更新视觉效果
        this.updateVisualEffects(deltaTime);
        
        // 边界检查
        this.boundaryCheck(game);
    }
    
    // 处理移动
    handleMovement(game, deltaTime) {
        // 重置移动方向
        this.moveDirection.x = 0;
        this.moveDirection.y = 0;
        
        // 检查按键输入
        if (game.data.keys.w) this.moveDirection.y -= 1;
        if (game.data.keys.s) this.moveDirection.y += 1;
        if (game.data.keys.a) this.moveDirection.x -= 1;
        if (game.data.keys.d) this.moveDirection.x += 1;
        
        // 检查是否移动
        this.isMoving = this.moveDirection.x !== 0 || this.moveDirection.y !== 0;
        
        // 归一化移动方向
        if (this.isMoving) {
            const magnitude = Math.sqrt(this.moveDirection.x * this.moveDirection.x + this.moveDirection.y * this.moveDirection.y);
            this.moveDirection.x /= magnitude;
            this.moveDirection.y /= magnitude;
        }
        
        // 计算目标速度
        const targetSpeed = this.isMoving ? this.maxSpeed : 0;
        
        // 加速或减速
        if (this.isMoving) {
            // 加速
            let currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (currentSpeed < targetSpeed) {
                currentSpeed += this.acceleration * deltaTime;
                if (currentSpeed > targetSpeed) currentSpeed = targetSpeed;
            }
            
            // 应用移动方向
            this.vx = this.moveDirection.x * currentSpeed;
            this.vy = this.moveDirection.y * currentSpeed;
        } else {
            // 减速
            if (Math.abs(this.vx) > 0 || Math.abs(this.vy) > 0) {
                const decelAmount = this.deceleration * deltaTime;
                
                if (Math.abs(this.vx) > decelAmount) {
                    this.vx -= Math.sign(this.vx) * decelAmount;
                } else {
                    this.vx = 0;
                }
                
                if (Math.abs(this.vy) > decelAmount) {
                    this.vy -= Math.sign(this.vy) * decelAmount;
                } else {
                    this.vy = 0;
                }
            }
        }
        
        // 应用减速效果
        if (this.isSlowed) {
            this.vx *= this.slowFactor;
            this.vy *= this.slowFactor;
        }
        
        // 应用移动
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }
    
    // 处理攻击
    handleAttack(game, deltaTime) {
        const currentWeapon = this.weapons[this.currentWeaponIndex];
        if (!currentWeapon) return;
        
        // 检查是否可以攻击
        this.lastAttackTime += deltaTime;
        if (this.lastAttackTime < currentWeapon.fireRate) return;
        
        // 检查攻击输入
        if (game.data.mouse.isDown || game.data.keys.space) {
            this.fireWeapon(game, currentWeapon);
            this.lastAttackTime = 0;
        }
        
        // 检查武器切换
        this.checkWeaponSwitch(game);
    }
    
    // 发射武器
    fireWeapon(game, weapon) {
        // 检查弹药
        if (weapon.ammo <= 0 && weapon.maxAmmo !== Infinity) {
            // 需要换弹
            this.reloadWeapon(weapon);
            return;
        }
        
        // 消耗弹药
        if (weapon.maxAmmo !== Infinity) {
            weapon.ammo -= 1;
        }
        
        // 更新统计
        this.stats.shotsFired += weapon.projectilesPerShot;
        
        // 计算射击方向（鼠标位置）
        const dx = game.data.mouse.x - this.x;
        const dy = game.data.mouse.y - this.y;
        let angle = Math.atan2(dy, dx);
        
        // 处理散射
        for (let i = 0; i < weapon.projectilesPerShot; i++) {
            // 应用散射
            let spreadAngle = angle;
            if (weapon.spread > 0) {
                spreadAngle += (Math.random() - 0.5) * weapon.spread;
            }
            
            // 创建投射物
            const projectile = {
                x: this.x,
                y: this.y,
                vx: Math.cos(spreadAngle) * weapon.bulletSpeed,
                vy: Math.sin(spreadAngle) * weapon.bulletSpeed,
                radius: weapon.bulletSize,
                damage: this.calculateDamage(weapon.damage),
                color: weapon.bulletColor,
                lifetime: weapon.bulletLifetime,
                owner: 'player',
                piercing: weapon.piercing,
                weapon: weapon,
                update: function(game, deltaTime) {
                    this.x += this.vx * deltaTime;
                    this.y += this.vy * deltaTime;
                    this.lifetime -= deltaTime;
                    
                    // 应用子弹特效
                    if (this.weapon.bulletEffect) {
                        this.weapon.bulletEffect.update(this, game, deltaTime);
                    }
                }
            };
            
            game.data.projectiles.push(projectile);
        }
        
        // 播放射击音效
        // if (weapon.sound) weapon.sound.play();
        
        // 后坐力效果
        this.applyRecoil(angle, weapon.recoil || 50);
    }
    
    // 计算最终伤害
    calculateDamage(baseDamage) {
        // 应用伤害加成
        let finalDamage = baseDamage + this.damage * 0.1;
        
        // 应用暴击
        if (this.isCriticalHit()) {
            finalDamage *= 1.5;
        }
        
        return Math.floor(finalDamage);
    }
    
    // 检查是否暴击
    isCriticalHit() {
        // 基础暴击率5%，受幸运值影响
        const baseCritChance = 0.05;
        const luckBonus = (this.luck - 100) * 0.001;
        const critChance = Math.min(baseCritChance + luckBonus, 0.5); // 最高50%暴击率
        
        return Math.random() < critChance;
    }
    
    // 应用后坐力
    applyRecoil(angle, force) {
        this.vx -= Math.cos(angle) * force * 0.01;
        this.vy -= Math.sin(angle) * force * 0.01;
    }
    
    // 换弹
    reloadWeapon(weapon) {
        if (weapon.isReloading) return;
        
        weapon.isReloading = true;
        
        setTimeout(() => {
            weapon.ammo = weapon.maxAmmo;
            weapon.isReloading = false;
        }, weapon.reloadTime * 1000);
    }
    
    // 检查武器切换
    checkWeaponSwitch(game) {
        for (let i = 0; i < 3; i++) {
            const key = (i + 1).toString();
            if (game.data.keys[key] && i < this.weapons.length) {
                this.switchWeapon(i);
                break;
            }
        }
    }
    
    // 切换武器
    switchWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            this.currentWeaponIndex = index;
            // 可以添加武器切换特效
        }
    }
    
    // 添加武器
    addWeapon(weapon) {
        // 检查是否已有同类型武器
        const existingIndex = this.weapons.findIndex(w => w.type === weapon.type);
        
        if (existingIndex !== -1) {
            // 升级现有武器
            this.weapons[existingIndex].upgrade(weapon);
        } else {
            // 添加新武器
            if (this.weapons.length < 3) {
                this.weapons.push(weapon);
            } else {
                // 替换当前武器
                this.weapons[this.currentWeaponIndex] = weapon;
            }
        }
    }
    
    // 更新技能
    updateSkills(deltaTime) {
        for (const skill of this.skills) {
            skill.update(deltaTime);
        }
    }
    
    // 使用技能
    useSkill(index, game) {
        if (index >= 0 && index < this.skills.length) {
            const skill = this.skills[index];
            if (skill.canUse()) {
                skill.activate(game);
            }
        }
    }
    
    // 更新状态效果
    updateStatusEffects(deltaTime) {
        // 处理无敌状态
        if (this.isInvulnerable) {
            this.invulnerabilityTimer -= deltaTime;
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false;
            }
        }
        
        // 处理眩晕状态
        if (this.isStunned) {
            this.stunTimer -= deltaTime;
            if (this.stunTimer <= 0) {
                this.isStunned = false;
            }
        }
        
        // 处理减速状态
        if (this.isSlowed) {
            this.slowTimer -= deltaTime;
            if (this.slowTimer <= 0) {
                this.isSlowed = false;
                this.slowFactor = 1;
            }
        }
        
        // 更新主动效果
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.update(deltaTime);
            
            if (effect.isExpired()) {
                effect.onExpire(this);
                this.activeEffects.splice(i, 1);
            }
        }
    }
    
    // 受到伤害
    takeDamage(amount) {
        // 检查无敌状态
        if (this.isInvulnerable) return 0;
        
        // 检查闪避
        if (this.isDodging()) {
            return 0;
        }
        
        // 应用减伤效果
        if (this.damageReduction) {
            amount *= (1 - this.damageReduction);
        }
        
        // 最小伤害为1
        amount = Math.max(1, Math.floor(amount));
        
        // 扣除生命值
        this.health -= amount;
        
        // 更新统计
        this.stats.damageTaken += amount;
        
        // 重置连击
        this.stats.currentCombo = 0;
        
        // 添加受击特效
        this.addVisualEffect('hit');
        
        return amount;
    }
    
    // 检查是否闪避
    isDodging() {
        let dodgeChance = 0;
        
        // 移动时的闪避加成
        if (this.isMoving && this.dodgeBonus) {
            dodgeChance += this.dodgeBonus;
        }
        
        // 幸运值影响
        dodgeChance += (this.luck - 100) * 0.0005;
        
        // 最大闪避率30%
        dodgeChance = Math.min(dodgeChance, 0.3);
        
        return Math.random() < dodgeChance;
    }
    
    // 治疗
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        
        // 添加治疗特效
        this.addVisualEffect('heal');
        
        return amount;
    }
    
    // 增加生命值上限
    increaseMaxHealth(amount) {
        this.maxHealth += amount;
        this.health += amount;
    }
    
    // 增加伤害
    increaseDamage(amount) {
        this.damage += amount;
    }
    
    // 增加移动速度
    increaseSpeed(amount) {
        this.baseSpeed += amount;
        this.maxSpeed = this.baseSpeed;
    }
    
    // 增加幸运值
    increaseLuck(amount) {
        this.luck += amount;
    }
    
    // 眩晕
    stun(duration) {
        this.isStunned = true;
        this.stunTimer = duration;
    }
    
    // 减速
    slow(duration, factor = 0.5) {
        this.isSlowed = true;
        this.slowTimer = duration;
        this.slowFactor = factor;
    }
    
    // 击退
    knockback(angle, force) {
        this.vx += Math.cos(angle) * force * 0.01;
        this.vy += Math.sin(angle) * force * 0.01;
    }
    
    // 添加视觉效果
    addVisualEffect(type) {
        const effect = this.createVisualEffect(type);
        if (effect) {
            this.visualEffects.push(effect);
        }
    }
    
    // 创建视觉效果
    createVisualEffect(type) {
        switch (type) {
            case 'hit':
                return {
                    type: 'hit',
                    timer: 0.2,
                    color: '#ff4444',
                    update: function(deltaTime) {
                        this.timer -= deltaTime;
                    },
                    isActive: function() {
                        return this.timer > 0;
                    }
                };
                
            case 'heal':
                return {
                    type: 'heal',
                    timer: 0.5,
                    color: '#44ff44',
                    update: function(deltaTime) {
                        this.timer -= deltaTime;
                    },
                    isActive: function() {
                        return this.timer > 0;
                    }
                };
                
            case 'shield':
                return {
                    type: 'shield',
                    timer: 3,
                    color: '#4444ff',
                    update: function(deltaTime) {
                        this.timer -= deltaTime;
                    },
                    isActive: function() {
                        return this.timer > 0;
                    }
                };
        }
    }
    
    // 移除视觉效果
    removeVisualEffect(type) {
        this.visualEffects = this.visualEffects.filter(effect => effect.type !== type);
    }
    
    // 更新视觉效果
    updateVisualEffects(deltaTime) {
        for (let i = this.visualEffects.length - 1; i >= 0; i--) {
            const effect = this.visualEffects[i];
            effect.update(deltaTime);
            
            if (!effect.isActive()) {
                this.visualEffects.splice(i, 1);
            }
        }
    }
    
    // 边界检查
    boundaryCheck(game) {
        // 保持玩家在屏幕内
        const margin = this.radius;
        
        if (this.x < margin) this.x = margin;
        if (this.x > game.canvas.width - margin) this.x = game.canvas.width - margin;
        if (this.y < margin) this.y = margin;
        if (this.y > game.canvas.height - margin) this.y = game.canvas.height - margin;
    }
    
    // 创建炸弹爆炸效果
    createBombExplosionEffect(game) {
        // 创建爆炸粒子
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            const size = 5 + Math.random() * 10;
            const lifetime = 0.5 + Math.random() * 0.5;
            
            const particle = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: '#ff6b6b',
                alpha: 1,
                lifetime: lifetime,
                maxLifetime: lifetime,
                update: function(deltaTime) {
                    this.x += this.vx * deltaTime;
                    this.y += this.vy * deltaTime;
                    this.vy += 50; // 重力效果
                    this.lifetime -= deltaTime;
                    this.alpha = this.lifetime / this.maxLifetime;
                    this.size = size * (this.lifetime / this.maxLifetime);
                }
            };
            
            game.data.particles.push(particle);
        }
    }
    
    // 获取当前武器
    getCurrentWeapon() {
        return this.weapons[this.currentWeaponIndex] || null;
    }
    
    // 获取武器栏显示信息
    getWeaponDisplayInfo() {
        const info = [];
        
        for (let i = 0; i < 3; i++) {
            if (i < this.weapons.length) {
                const weapon = this.weapons[i];
                info.push({
                    name: weapon.name,
                    ammo: weapon.ammo,
                    maxAmmo: weapon.maxAmmo,
                    isActive: i === this.currentWeaponIndex
                });
            } else {
                info.push({
                    name: '未装备',
                    ammo: 0,
                    maxAmmo: 0,
                    isActive: false
                });
            }
        }
        
        return info;
    }
}

// 武器类
class Weapon {
    constructor(props) {
        this.name = props.name;
        this.type = props.type;
        this.damage = props.damage;
        this.fireRate = props.fireRate;
        this.ammo = props.ammo;
        this.maxAmmo = props.maxAmmo;
        this.reloadTime = props.reloadTime;
        this.bulletSpeed = props.bulletSpeed;
        this.bulletSize = props.bulletSize;
        this.bulletColor = props.bulletColor;
        this.bulletLifetime = props.bulletLifetime;
        this.piercing = props.piercing;
        this.spread = props.spread;
        this.projectilesPerShot = props.projectilesPerShot;
        this.bulletEffect = props.bulletEffect;
        this.sound = props.sound;
        
        // 武器状态
        this.isReloading = false;
        this.level = 1;
        
        // 额外属性
        this.recoil = props.recoil || 0;
        this.critChance = props.critChance || 0;
        this.critDamage = props.critDamage || 1.5;
    }
    
    // 升级武器
    upgrade(newWeapon) {
        // 合并属性升级
        this.damage = Math.max(this.damage, newWeapon.damage) * 1.1; // 10%升级加成
        this.fireRate = Math.min(this.fireRate, newWeapon.fireRate) * 0.95; // 5%射速提升
        this.maxAmmo = Math.max(this.maxAmmo, newWeapon.maxAmmo) * 1.2; // 20%弹药提升
        this.bulletSpeed = Math.max(this.bulletSpeed, newWeapon.bulletSpeed);
        this.piercing = this.piercing || newWeapon.piercing;
        
        // 提升武器等级
        this.level++;
        
        // 特殊升级效果
        if (this.level >= 3) {
            this.projectilesPerShot = Math.max(this.projectilesPerShot, newWeapon.projectilesPerShot) + 1;
        }
        
        // 重置弹药
        this.ammo = this.maxAmmo;
    }
}

// 技能类
class Skill {
    constructor(props) {
        this.name = props.name;
        this.type = props.type;
        this.cooldown = props.cooldown;
        this.duration = props.duration;
        this.effect = props.effect;
        this.description = props.description;
        
        // 技能状态
        this.currentCooldown = 0;
        this.isActive = false;
        this.activeTimer = 0;
    }
    
    // 更新技能状态
    update(deltaTime) {
        // 更新冷却时间
        if (this.currentCooldown > 0) {
            this.currentCooldown -= deltaTime;
            if (this.currentCooldown < 0) {
                this.currentCooldown = 0;
            }
        }
        
        // 更新持续时间
        if (this.isActive) {
            this.activeTimer -= deltaTime;
            if (this.activeTimer <= 0) {
                this.isActive = false;
                this.activeTimer = 0;
            }
        }
    }
    
    // 检查是否可以使用
    canUse() {
        return this.currentCooldown <= 0;
    }
    
    // 激活技能
    activate(game) {
        if (!this.canUse()) return;
        
        // 触发技能效果
        this.effect(game);
        
        // 设置冷却时间
        this.currentCooldown = this.cooldown;
        
        // 如果有持续时间，设置激活状态
        if (this.duration) {
            this.isActive = true;
            this.activeTimer = this.duration;
        }
    }
    
    // 获取冷却时间百分比
    getCooldownPercent() {
        if (this.cooldown === 0) return 0;
        return (this.currentCooldown / this.cooldown) * 100;
    }
    
    // 获取持续时间百分比
    getDurationPercent() {
        if (this.duration === 0 || !this.isActive) return 0;
        return (this.activeTimer / this.duration) * 100;
    }
}
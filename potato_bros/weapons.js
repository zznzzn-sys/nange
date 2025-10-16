// weapons.js - 武器系统和投射物效果

// 武器工厂 - 创建各种不同类型的武器
class WeaponFactory {
    // 创建随机武器
    static createRandomWeapon(level = 1) {
        const weaponTypes = [
            'pistol', 'shotgun', 'rifle', 'sniper', 
            'launcher', 'laser', 'magic', 'melee'
        ];
        
        const type = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
        const weaponLevel = Math.min(level, 5); // 最大5级
        
        switch (type) {
            case 'pistol': return this.createPistol(weaponLevel);
            case 'shotgun': return this.createShotgun(weaponLevel);
            case 'rifle': return this.createRifle(weaponLevel);
            case 'sniper': return this.createSniper(weaponLevel);
            case 'launcher': return this.createLauncher(weaponLevel);
            case 'laser': return this.createLaser(weaponLevel);
            case 'magic': return this.createMagicWeapon(weaponLevel);
            case 'melee': return this.createMeleeWeapon(weaponLevel);
            default: return this.createPistol(weaponLevel);
        }
    }
    
    // 创建土豆枪（基础手枪）
    static createPistol(level = 1) {
        const baseDamage = 10 + (level - 1) * 3;
        const baseFireRate = 0.7 - (level - 1) * 0.05;
        
        return new Weapon({
            name: `土豆枪 Lv.${level}`,
            type: 'pistol',
            damage: baseDamage,
            fireRate: baseFireRate,
            ammo: 15,
            maxAmmo: 60 + (level - 1) * 10,
            reloadTime: 1,
            bulletSpeed: 500 + (level - 1) * 25,
            bulletSize: 8 + Math.floor((level - 1) * 1.5),
            bulletColor: '#ff9800',
            bulletLifetime: 2,
            piercing: false,
            spread: 0.1 - (level - 1) * 0.01,
            projectilesPerShot: 1,
            bulletEffect: null,
            sound: null,
            recoil: 40 - (level - 1) * 2
        });
    }
    
    // 创建霰弹枪
    static createShotgun(level = 1) {
        const baseDamage = 8 + (level - 1) * 2;
        const baseFireRate = 1.2 - (level - 1) * 0.08;
        const pellets = 5 + Math.floor((level - 1) * 1.5);
        
        return new Weapon({
            name: `土豆霰弹枪 Lv.${level}`,
            type: 'shotgun',
            damage: baseDamage,
            fireRate: baseFireRate,
            ammo: 8,
            maxAmmo: 32 + (level - 1) * 6,
            reloadTime: 1.5,
            bulletSpeed: 400 + (level - 1) * 20,
            bulletSize: 6 + Math.floor((level - 1) * 1),
            bulletColor: '#ff7043',
            bulletLifetime: 1.5,
            piercing: level >= 4,
            spread: 0.8 - (level - 1) * 0.05,
            projectilesPerShot: pellets,
            bulletEffect: null,
            sound: null,
            recoil: 80 - (level - 1) * 4
        });
    }
    
    // 创建步枪
    static createRifle(level = 1) {
        const baseDamage = 12 + (level - 1) * 3;
        const baseFireRate = 0.4 - (level - 1) * 0.02;
        
        return new Weapon({
            name: `土豆步枪 Lv.${level}`,
            type: 'rifle',
            damage: baseDamage,
            fireRate: baseFireRate,
            ammo: 30,
            maxAmmo: 120 + (level - 1) * 20,
            reloadTime: 1.2,
            bulletSpeed: 600 + (level - 1) * 30,
            bulletSize: 7 + Math.floor((level - 1) * 1.2),
            bulletColor: '#2196f3',
            bulletLifetime: 2.5,
            piercing: level >= 3,
            spread: 0.05 - (level - 1) * 0.005,
            projectilesPerShot: 1,
            bulletEffect: level >= 5 ? new RicochetEffect() : null,
            sound: null,
            recoil: 50 - (level - 1) * 2
        });
    }
    
    // 创建狙击枪
    static createSniper(level = 1) {
        const baseDamage = 30 + (level - 1) * 10;
        const baseFireRate = 1.8 - (level - 1) * 0.1;
        
        return new Weapon({
            name: `土豆狙击枪 Lv.${level}`,
            type: 'sniper',
            damage: baseDamage,
            fireRate: baseFireRate,
            ammo: 5,
            maxAmmo: 20 + (level - 1) * 3,
            reloadTime: 2,
            bulletSpeed: 800 + (level - 1) * 50,
            bulletSize: 10 + Math.floor((level - 1) * 2),
            bulletColor: '#9c27b0',
            bulletLifetime: 3,
            piercing: true,
            spread: 0.01,
            projectilesPerShot: 1,
            bulletEffect: level >= 4 ? new PenetrateEffect() : null,
            sound: null,
            recoil: 120 - (level - 1) * 8
        });
    }
    
    // 创建发射器
    static createLauncher(level = 1) {
        const baseDamage = 25 + (level - 1) * 8;
        const baseFireRate = 2 - (level - 1) * 0.15;
        
        return new Weapon({
            name: `土豆发射器 Lv.${level}`,
            type: 'launcher',
            damage: baseDamage,
            fireRate: baseFireRate,
            ammo: 4,
            maxAmmo: 16 + (level - 1) * 2,
            reloadTime: 2.5,
            bulletSpeed: 300 + (level - 1) * 15,
            bulletSize: 15 + Math.floor((level - 1) * 3),
            bulletColor: '#f44336',
            bulletLifetime: 2,
            piercing: false,
            spread: 0.15 - (level - 1) * 0.02,
            projectilesPerShot: 1,
            bulletEffect: new ExplosionEffect(baseDamage * 0.5, 100 + (level - 1) * 20),
            sound: null,
            recoil: 150 - (level - 1) * 10
        });
    }
    
    // 创建激光枪
    static createLaser(level = 1) {
        const baseDamage = 5 + (level - 1) * 2;
        const baseFireRate = 0.1 - (level - 1) * 0.01; // 激光持续发射，所以射速非常快
        
        return new Weapon({
            name: `土豆激光枪 Lv.${level}`,
            type: 'laser',
            damage: baseDamage,
            fireRate: baseFireRate,
            ammo: 100,
            maxAmmo: 400 + (level - 1) * 50,
            reloadTime: 1.8,
            bulletSpeed: 1000,
            bulletSize: 5 + Math.floor((level - 1) * 1),
            bulletColor: '#00ff00',
            bulletLifetime: 0.5,
            piercing: true,
            spread: 0.02,
            projectilesPerShot: 1,
            bulletEffect: level >= 3 ? new LaserBeamEffect() : null,
            sound: null,
            recoil: 20 - (level - 1) * 1
        });
    }
    
    // 创建魔法武器
    static createMagicWeapon(level = 1) {
        const baseDamage = 15 + (level - 1) * 4;
        const baseFireRate = 0.9 - (level - 1) * 0.06;
        
        // 随机魔法效果
        let magicEffect = null;
        const effectType = level >= 4 ? 
            ['fire', 'ice', 'lightning', 'poison'][Math.floor(Math.random() * 4)] :
            ['fire', 'ice'][Math.floor(Math.random() * 2)];
        
        switch (effectType) {
            case 'fire':
                magicEffect = new BurnEffect(1, 3);
                bulletColor = '#ff5722';
                weaponName = '火焰土豆法杖';
                break;
            case 'ice':
                magicEffect = new FreezeEffect(0.5, 0.5);
                bulletColor = '#2196f3';
                weaponName = '冰霜土豆法杖';
                break;
            case 'lightning':
                magicEffect = new ChainLightningEffect(3);
                bulletColor = '#ffeb3b';
                weaponName = '闪电土豆法杖';
                break;
            case 'poison':
                magicEffect = new PoisonEffect(2, 5);
                bulletColor = '#4caf50';
                weaponName = '剧毒土豆法杖';
                break;
        }
        
        return new Weapon({
            name: `${weaponName} Lv.${level}`,
            type: 'magic',
            damage: baseDamage,
            fireRate: baseFireRate,
            ammo: 20,
            maxAmmo: 80 + (level - 1) * 15,
            reloadTime: 1.3,
            bulletSpeed: 450 + (level - 1) * 25,
            bulletSize: 12 + Math.floor((level - 1) * 2),
            bulletColor: bulletColor,
            bulletLifetime: 1.8,
            piercing: level >= 3,
            spread: 0.1 - (level - 1) * 0.01,
            projectilesPerShot: 1,
            bulletEffect: magicEffect,
            sound: null,
            recoil: 30 - (level - 1) * 2
        });
    }
    
    // 创建近战武器
    static createMeleeWeapon(level = 1) {
        const baseDamage = 20 + (level - 1) * 5;
        const baseFireRate = 0.3 - (level - 1) * 0.02; // 近战攻击速度
        
        return new Weapon({
            name: `土豆剑 Lv.${level}`,
            type: 'melee',
            damage: baseDamage,
            fireRate: baseFireRate,
            ammo: Infinity,
            maxAmmo: Infinity,
            reloadTime: 0,
            bulletSpeed: 0,
            bulletSize: 1,
            bulletColor: '#ffc107',
            bulletLifetime: 0.1,
            piercing: level >= 4,
            spread: 0,
            projectilesPerShot: 1,
            bulletEffect: level >= 3 ? new SlashEffect() : null,
            sound: null,
            recoil: 10
        });
    }
    
    // 创建商店武器
    static createShopWeapon(priceTier = 1) {
        // 根据价格等级创建不同品质的武器
        const level = Math.max(1, Math.floor(priceTier / 2));
        const randomType = Math.floor(Math.random() * 5); // 商店只提供5种主要武器类型
        
        switch (randomType) {
            case 0: return this.createPistol(level);
            case 1: return this.createShotgun(level);
            case 2: return this.createRifle(level);
            case 3: return this.createLauncher(level);
            case 4: return this.createMagicWeapon(level);
            default: return this.createPistol(level);
        }
    }
}

// 子弹特效类
class BulletEffect {
    update(bullet, game, deltaTime) {
        // 基类空方法
    }
    
    onHit(bullet, target, game) {
        // 基类空方法
    }
}

// 爆炸效果
class ExplosionEffect extends BulletEffect {
    constructor(damage, radius) {
        super();
        this.damage = damage;
        this.radius = radius;
    }
    
    onHit(bullet, target, game) {
        // 创建爆炸粒子
        this.createExplosionParticles(bullet.x, bullet.y, game);
        
        // 对范围内敌人造成伤害
        for (let i = game.data.enemies.length - 1; i >= 0; i--) {
            const enemy = game.data.enemies[i];
            const dx = enemy.x - bullet.x;
            const dy = enemy.y - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.radius) {
                // 距离越近伤害越高
                const damageMultiplier = 1 - (distance / this.radius);
                const damage = Math.floor(this.damage * (0.5 + damageMultiplier * 0.5));
                
                // 造成伤害
                enemy.takeDamage(damage);
                
                // 击退敌人
                const angle = Math.atan2(dy, dx);
                const force = 100 * damageMultiplier;
                enemy.knockback(angle, force);
            }
        }
    }
    
    createExplosionParticles(x, y, game) {
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 70;
            const size = 3 + Math.random() * 7;
            const lifetime = 0.3 + Math.random() * 0.4;
            
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: '#ff5722',
                alpha: 1,
                lifetime: lifetime,
                maxLifetime: lifetime,
                update: function(deltaTime) {
                    this.x += this.vx * deltaTime;
                    this.y += this.vy * deltaTime;
                    this.lifetime -= deltaTime;
                    this.alpha = this.lifetime / this.maxLifetime;
                    this.size *= (this.lifetime / this.maxLifetime);
                }
            };
            
            game.data.particles.push(particle);
        }
    }
}

// 燃烧效果
class BurnEffect extends BulletEffect {
    constructor(damagePerTick, duration) {
        super();
        this.damagePerTick = damagePerTick;
        this.duration = duration;
        this.tickRate = 0.5; // 每0.5秒造成一次伤害
    }
    
    onHit(bullet, target, game) {
        // 添加燃烧状态到敌人
        if (target && typeof target.addStatusEffect === 'function') {
            target.addStatusEffect({
                type: 'burn',
                damagePerTick: this.damagePerTick,
                duration: this.duration,
                tickRate: this.tickRate,
                color: '#ff5722',
                tickTimer: 0,
                update: function(deltaTime) {
                    this.duration -= deltaTime;
                    this.tickTimer -= deltaTime;
                    
                    if (this.tickTimer <= 0) {
                        // 造成燃烧伤害
                        this.target.takeDamage(this.damagePerTick);
                        this.tickTimer = this.tickRate;
                        
                        // 添加燃烧粒子效果
                        this.createBurnParticle(this.target.x, this.target.y, game);
                    }
                },
                isExpired: function() {
                    return this.duration <= 0;
                },
                createBurnParticle: function(x, y, game) {
                    const particle = {
                        x: x + (Math.random() - 0.5) * 20,
                        y: y + (Math.random() - 0.5) * 20,
                        vx: (Math.random() - 0.5) * 10,
                        vy: -50 + Math.random() * 20,
                        size: 2 + Math.random() * 3,
                        color: '#ff5722',
                        alpha: 1,
                        lifetime: 0.3,
                        maxLifetime: 0.3,
                        update: function(deltaTime) {
                            this.x += this.vx * deltaTime;
                            this.y += this.vy * deltaTime;
                            this.lifetime -= deltaTime;
                            this.alpha = this.lifetime / this.maxLifetime;
                        }
                    };
                    
                    game.data.particles.push(particle);
                }
            });
        }
    }
}

// 冻结效果
class FreezeEffect extends BulletEffect {
    constructor(slowFactor, duration) {
        super();
        this.slowFactor = slowFactor;
        this.duration = duration;
    }
    
    onHit(bullet, target, game) {
        // 添加冻结状态到敌人
        if (target && typeof target.addStatusEffect === 'function') {
            target.addStatusEffect({
                type: 'freeze',
                slowFactor: this.slowFactor,
                duration: this.duration,
                update: function(deltaTime) {
                    this.duration -= deltaTime;
                    
                    // 应用减速效果
                    if (this.target) {
                        this.target.speedMultiplier = this.slowFactor;
                    }
                },
                isExpired: function() {
                    return this.duration <= 0;
                },
                onExpire: function() {
                    if (this.target) {
                        this.target.speedMultiplier = 1;
                    }
                }
            });
        }
    }
}

// 闪电链效果
class ChainLightningEffect extends BulletEffect {
    constructor(maxChains) {
        super();
        this.maxChains = maxChains;
        this.currentChains = 0;
        this.chainRange = 200;
    }
    
    onHit(bullet, target, game) {
        // 创建闪电视觉效果
        this.createLightningEffect(bullet.x, bullet.y, target.x, target.y, game);
        
        // 尝试链式反应
        if (this.currentChains < this.maxChains) {
            this.chainLightning(target, game);
        }
    }
    
    chainLightning(sourceEnemy, game) {
        // 查找附近的敌人
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        for (const enemy of game.data.enemies) {
            if (enemy === sourceEnemy || enemy.isDead) continue;
            
            const dx = enemy.x - sourceEnemy.x;
            const dy = enemy.y - sourceEnemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.chainRange && distance < nearestDistance) {
                nearestEnemy = enemy;
                nearestDistance = distance;
            }
        }
        
        if (nearestEnemy) {
            // 创建闪电链
            this.createLightningEffect(sourceEnemy.x, sourceEnemy.y, nearestEnemy.x, nearestEnemy.y, game);
            
            // 对新目标造成伤害（伤害递减）
            const damageReduction = 0.8; // 每次链式伤害降低20%
            const chainDamage = Math.floor(bullet.damage * Math.pow(damageReduction, this.currentChains + 1));
            
            nearestEnemy.takeDamage(chainDamage);
            
            // 继续链式反应
            this.currentChains++;
            if (this.currentChains < this.maxChains) {
                setTimeout(() => {
                    this.chainLightning(nearestEnemy, game);
                }, 100);
            }
        }
    }
    
    createLightningEffect(x1, y1, x2, y2, game) {
        // 创建闪电粒子效果
        const lightningParticle = {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            alpha: 1,
            lifetime: 0.15,
            maxLifetime: 0.15,
            update: function(deltaTime) {
                this.lifetime -= deltaTime;
                this.alpha = this.lifetime / this.maxLifetime;
            },
            draw: function(ctx) {
                ctx.save();
                ctx.strokeStyle = `rgba(255, 235, 59, ${this.alpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x1, this.y1);
                ctx.lineTo(this.x2, this.y2);
                ctx.stroke();
                ctx.restore();
            }
        };
        
        game.data.specialEffects.push(lightningParticle);
    }
}

// 毒伤效果
class PoisonEffect extends BulletEffect {
    constructor(damagePerTick, duration) {
        super();
        this.damagePerTick = damagePerTick;
        this.duration = duration;
        this.tickRate = 0.3; // 每0.3秒造成一次伤害
    }
    
    onHit(bullet, target, game) {
        // 添加中毒状态到敌人
        if (target && typeof target.addStatusEffect === 'function') {
            target.addStatusEffect({
                type: 'poison',
                damagePerTick: this.damagePerTick,
                duration: this.duration,
                tickRate: this.tickRate,
                color: '#4caf50',
                tickTimer: 0,
                update: function(deltaTime) {
                    this.duration -= deltaTime;
                    this.tickTimer -= deltaTime;
                    
                    if (this.tickTimer <= 0) {
                        // 造成中毒伤害
                        this.target.takeDamage(this.damagePerTick);
                        this.tickTimer = this.tickRate;
                        
                        // 添加毒雾粒子效果
                        this.createPoisonParticle(this.target.x, this.target.y, game);
                    }
                },
                isExpired: function() {
                    return this.duration <= 0;
                },
                createPoisonParticle: function(x, y, game) {
                    const particle = {
                        x: x + (Math.random() - 0.5) * 15,
                        y: y + (Math.random() - 0.5) * 15,
                        vx: (Math.random() - 0.5) * 20,
                        vy: (Math.random() - 0.5) * 20,
                        size: 3 + Math.random() * 4,
                        color: '#4caf50',
                        alpha: 0.7,
                        lifetime: 0.5,
                        maxLifetime: 0.5,
                        update: function(deltaTime) {
                            this.x += this.vx * deltaTime;
                            this.y += this.vy * deltaTime;
                            this.lifetime -= deltaTime;
                            this.alpha = this.lifetime / this.maxLifetime;
                        }
                    };
                    
                    game.data.particles.push(particle);
                }
            });
        }
    }
}

// 反弹效果
class RicochetEffect extends BulletEffect {
    constructor(maxRicochets = 3) {
        super();
        this.maxRicochets = maxRicochets;
        this.currentRicochets = 0;
        this.ricochetRange = 400;
    }
    
    onHit(bullet, target, game) {
        if (this.currentRicochets < this.maxRicochets) {
            // 查找可以反弹的最近敌人
            let nearestEnemy = null;
            let nearestDistance = Infinity;
            
            for (const enemy of game.data.enemies) {
                if (enemy === target || enemy.isDead) continue;
                
                const dx = enemy.x - bullet.x;
                const dy = enemy.y - bullet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.ricochetRange && distance < nearestDistance) {
                    nearestEnemy = enemy;
                    nearestDistance = distance;
                }
            }
            
            if (nearestEnemy) {
                // 计算反弹方向
                const angle = Math.atan2(nearestEnemy.y - bullet.y, nearestEnemy.x - bullet.x);
                
                // 创建反弹投射物
                const ricochetBullet = {
                    x: bullet.x,
                    y: bullet.y,
                    vx: Math.cos(angle) * bullet.bulletSpeed * 0.8, // 稍微减速
                    vy: Math.sin(angle) * bullet.bulletSpeed * 0.8,
                    radius: bullet.radius,
                    damage: Math.floor(bullet.damage * 0.8), // 伤害递减
                    color: '#ffeb3b', // 反弹子弹特殊颜色
                    lifetime: bullet.lifetime,
                    owner: 'player',
                    piercing: false,
                    weapon: bullet.weapon,
                    bulletEffect: new RicochetEffect(this.maxRicochets, this.currentRicochets + 1),
                    update: function(game, deltaTime) {
                        this.x += this.vx * deltaTime;
                        this.y += this.vy * deltaTime;
                        this.lifetime -= deltaTime;
                    }
                };
                
                game.data.projectiles.push(ricochetBullet);
                this.currentRicochets++;
            }
        }
    }
}

// 穿透效果
class PenetrateEffect extends BulletEffect {
    constructor(maxPenetrations = 3) {
        super();
        this.maxPenetrations = maxPenetrations;
        this.currentPenetrations = 0;
    }
    
    onHit(bullet, target, game) {
        this.currentPenetrations++;
        
        // 如果还能穿透，允许子弹继续飞行
        if (this.currentPenetrations < this.maxPenetrations) {
            bullet.piercing = true;
        }
        
        // 创建穿透特效
        this.createPenetrateEffect(bullet.x, bullet.y, game);
    }
    
    createPenetrateEffect(x, y, game) {
        const particle = {
            x: x,
            y: y,
            size: 15,
            color: '#9c27b0',
            alpha: 0.7,
            lifetime: 0.1,
            maxLifetime: 0.1,
            update: function(deltaTime) {
                this.lifetime -= deltaTime;
                this.alpha = this.lifetime / this.maxLifetime;
                this.size *= 0.8;
            }
        };
        
        game.data.particles.push(particle);
    }
}

// 激光束效果
class LaserBeamEffect extends BulletEffect {
    update(bullet, game, deltaTime) {
        // 绘制激光束
        const laserBeam = {
            x1: game.data.player.x,
            y1: game.data.player.y,
            x2: bullet.x,
            y2: bullet.y,
            alpha: 0.5,
            lifetime: 0.1,
            maxLifetime: 0.1,
            update: function(deltaTime) {
                this.lifetime -= deltaTime;
                this.alpha = this.lifetime / this.maxLifetime;
            },
            draw: function(ctx) {
                ctx.save();
                ctx.strokeStyle = `rgba(0, 255, 0, ${this.alpha})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(this.x1, this.y1);
                ctx.lineTo(this.x2, this.y2);
                ctx.stroke();
                ctx.restore();
            }
        };
        
        game.data.specialEffects.push(laserBeam);
    }
}

// 近战攻击特效
class SlashEffect extends BulletEffect {
    onHit(bullet, target, game) {
        // 创建近战攻击特效
        const slash = {
            x: game.data.player.x,
            y: game.data.player.y,
            angle: Math.atan2(bullet.y - game.data.player.y, bullet.x - game.data.player.x),
            size: 40,
            alpha: 1,
            lifetime: 0.15,
            maxLifetime: 0.15,
            update: function(deltaTime) {
                this.lifetime -= deltaTime;
                this.alpha = this.lifetime / this.maxLifetime;
                this.size *= 0.85;
            },
            draw: function(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.strokeStyle = `rgba(255, 193, 7, ${this.alpha})`;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(this.size, -this.size * 0.3);
                ctx.stroke();
                ctx.restore();
            }
        };
        
        game.data.specialEffects.push(slash);
    }
}

// 特殊武器 - 超级土豆炸弹
class SuperPotatoBomb extends Weapon {
    constructor(level = 1) {
        const baseDamage = 100 + (level - 1) * 40;
        
        super({
            name: `超级土豆炸弹 Lv.${level}`,
            type: 'special',
            damage: baseDamage,
            fireRate: 5 - (level - 1) * 0.3, // 较长的冷却时间
            ammo: 1,
            maxAmmo: 1 + Math.floor((level - 1) * 0.5),
            reloadTime: 3,
            bulletSpeed: 200,
            bulletSize: 25,
            bulletColor: '#ff5722',
            bulletLifetime: 2,
            piercing: false,
            spread: 0,
            projectilesPerShot: 1,
            bulletEffect: new MassiveExplosionEffect(baseDamage * 0.8, 200 + (level - 1) * 40),
            sound: null,
            recoil: 200
        });
        
        // 特殊属性
        this.explosionCount = 1 + Math.floor((level - 1) * 0.3);
    }
}

// 大规模爆炸效果
class MassiveExplosionEffect extends ExplosionEffect {
    constructor(damage, radius) {
        super(damage, radius);
        this.shockwaveRadius = radius * 1.5;
    }
    
    onHit(bullet, target, game) {
        // 创建主要爆炸
        super.onHit(bullet, target, game);
        
        // 创建冲击波
        this.createShockwave(bullet.x, bullet.y, game);
        
        // 对玩家周围的敌人造成恐惧效果
        this.applyFearEffect(bullet.x, bullet.y, game);
    }
    
    createShockwave(x, y, game) {
        const shockwave = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: this.shockwaveRadius,
            alpha: 0.8,
            color: '#4fc3f7',
            update: function(deltaTime) {
                this.radius += this.maxRadius * 0.5 * deltaTime;
                this.alpha = 1 - (this.radius / this.maxRadius);
            },
            draw: function(ctx) {
                ctx.save();
                ctx.strokeStyle = `rgba(79, 195, 247, ${this.alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            },
            isActive: function() {
                return this.radius < this.maxRadius;
            }
        };
        
        game.data.specialEffects.push(shockwave);
    }
    
    applyFearEffect(x, y, game) {
        for (const enemy of game.data.enemies) {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.shockwaveRadius) {
                // 添加恐惧效果
                enemy.addStatusEffect({
                    type: 'fear',
                    duration: 1.5,
                    update: function(deltaTime) {
                        this.duration -= deltaTime;
                        
                        // 让敌人远离爆炸中心
                        if (this.target) {
                            const angle = Math.atan2(this.target.y - y, this.target.x - x);
                            const runAwayAngle = angle + Math.PI; // 相反方向
                            this.target.setTargetPosition(
                                this.target.x + Math.cos(runAwayAngle) * 50 * deltaTime,
                                this.target.y + Math.sin(runAwayAngle) * 50 * deltaTime
                            );
                        }
                    },
                    isExpired: function() {
                        return this.duration <= 0;
                    },
                    onExpire: function() {
                        // 恢复敌人正常行为
                        if (this.target) {
                            this.target.setTargetPosition(null);
                        }
                    }
                });
            }
        }
    }
}
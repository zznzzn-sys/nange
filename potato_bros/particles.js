// particles.js - 游戏粒子特效系统

class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || 0;
        this.vy = options.vy || 0;
        this.ax = options.ax || 0;
        this.ay = options.ay || 0;
        this.life = options.life || 1;
        this.maxLife = this.life;
        this.radius = options.radius || 5;
        this.color = options.color || '#fff';
        this.opacity = options.opacity || 1;
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || 0;
        this.size = options.size || 1;
        this.sizeChange = options.sizeChange || 0;
        this.shape = options.shape || 'circle'; // circle, square, star
        this.fadeOut = options.fadeOut !== undefined ? options.fadeOut : true;
        this.gravity = options.gravity !== undefined ? options.gravity : 0;
        this.isDead = false;
    }
    
    update(deltaTime) {
        // 更新生命周期
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.isDead = true;
            return;
        }
        
        // 更新速度
        this.vx += this.ax * deltaTime;
        this.vy += (this.ay + this.gravity) * deltaTime;
        
        // 更新位置
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // 更新旋转
        this.rotation += this.rotationSpeed * deltaTime;
        
        // 更新大小
        this.size += this.sizeChange * deltaTime;
        
        // 更新透明度
        if (this.fadeOut) {
            this.opacity = this.life / this.maxLife;
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        // 设置透明度
        ctx.globalAlpha = this.opacity;
        
        // 移动到粒子位置
        ctx.translate(this.x, this.y);
        
        // 应用旋转
        ctx.rotate(this.rotation);
        
        // 根据形状绘制
        ctx.fillStyle = this.color;
        
        switch (this.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'square':
                const halfSize = this.radius * this.size;
                ctx.fillRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);
                break;
                
            case 'star':
                // 简单的星形
                const points = 5;
                const outerRadius = this.radius * this.size;
                const innerRadius = outerRadius * 0.5;
                
                ctx.beginPath();
                for (let i = 0; i < points * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / points - Math.PI / 2;
                    const px = radius * Math.cos(angle);
                    const py = radius * Math.sin(angle);
                    
                    if (i === 0) {
                        ctx.moveTo(px, py);
                    } else {
                        ctx.lineTo(px, py);
                    }
                }
                ctx.closePath();
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
}

class ParticleSystem {
    constructor(game) {
        this.game = game;
        this.particleGroups = [];
        this.emitters = [];
        this.particleTemplates = this.createParticleTemplates();
    }
    
    createParticleTemplates() {
        return {
            // 爆炸粒子模板
            explosion: {
                life: 0.8,
                radius: 5,
                color: '#ff6b35',
                fadeOut: true,
                shape: 'circle',
                sizeChange: -2
            },
            // 击中粒子模板
            hit: {
                life: 0.5,
                radius: 3,
                color: '#ffffff',
                fadeOut: true,
                shape: 'circle',
                sizeChange: -1
            },
            // 死亡粒子模板
            death: {
                life: 1.2,
                radius: 8,
                color: '#4caf50',
                fadeOut: true,
                shape: 'circle',
                sizeChange: -1
            },
            // 金币粒子模板
            coin: {
                life: 0.5,
                radius: 4,
                color: '#ffd700',
                fadeOut: true,
                shape: 'star',
                sizeChange: 0,
                rotationSpeed: 10
            },
            // 经验粒子模板
            exp: {
                life: 0.7,
                radius: 5,
                color: '#9c27b0',
                fadeOut: true,
                shape: 'circle',
                sizeChange: 0,
                rotationSpeed: 5
            },
            // 火粒子模板
            fire: {
                life: 1.0,
                radius: 6,
                color: '#ff9800',
                fadeOut: true,
                shape: 'square',
                sizeChange: -1,
                gravity: -200
            },
            // 冰粒子模板
            ice: {
                life: 0.8,
                radius: 4,
                color: '#03a9f4',
                fadeOut: true,
                shape: 'circle',
                sizeChange: 0,
                rotationSpeed: 3
            },
            // 血粒子模板
            blood: {
                life: 1.0,
                radius: 4,
                color: '#f44336',
                fadeOut: true,
                shape: 'circle',
                sizeChange: 0,
                gravity: 200
            },
            // 技能粒子模板
            skill: {
                life: 1.5,
                radius: 7,
                color: '#ff9800',
                fadeOut: true,
                shape: 'star',
                sizeChange: -2,
                rotationSpeed: 5
            },
            // 护盾粒子模板
            shield: {
                life: 0.6,
                radius: 3,
                color: '#2196f3',
                fadeOut: true,
                shape: 'square',
                sizeChange: 0
            },
            // 闪光粒子模板
            spark: {
                life: 0.4,
                radius: 2,
                color: '#ffffff',
                fadeOut: true,
                shape: 'circle',
                sizeChange: 0,
                rotationSpeed: 0
            }
        };
    }
    
    update(deltaTime) {
        // 更新所有粒子组
        for (let i = this.particleGroups.length - 1; i >= 0; i--) {
            const group = this.particleGroups[i];
            group.update(deltaTime);
            
            if (group.isDead) {
                this.particleGroups.splice(i, 1);
            }
        }
        
        // 更新所有发射器
        for (let i = this.emitters.length - 1; i >= 0; i--) {
            const emitter = this.emitters[i];
            emitter.update(deltaTime);
            
            if (emitter.isDead) {
                this.emitters.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        // 绘制所有粒子组
        for (const group of this.particleGroups) {
            group.draw(ctx);
        }
    }
    
    // 创建粒子组
    createParticleGroup(x, y, count, template, options = {}) {
        const group = new ParticleGroup(this, x, y, count, template, options);
        this.particleGroups.push(group);
        return group;
    }
    
    // 创建发射器
    createEmitter(x, y, options = {}) {
        const emitter = new ParticleEmitter(this, x, y, options);
        this.emitters.push(emitter);
        return emitter;
    }
    
    // 爆炸效果
    createExplosion(x, y, size = 1, color = null) {
        const options = {
            count: Math.floor(20 * size),
            speedRange: { min: 50 * size, max: 200 * size },
            angleRange: { min: 0, max: Math.PI * 2 }
        };
        
        if (color) {
            options.colorOverride = color;
        }
        
        return this.createParticleGroup(x, y, 20, 'explosion', options);
    }
    
    // 击中效果
    createHitEffect(x, y, size = 1) {
        const options = {
            count: Math.floor(8 * size),
            speedRange: { min: 30 * size, max: 100 * size },
            angleRange: { min: 0, max: Math.PI * 2 }
        };
        
        return this.createParticleGroup(x, y, 8, 'hit', options);
    }
    
    // 死亡效果
    createDeathEffect(x, y, size = 1) {
        const options = {
            count: Math.floor(30 * size),
            speedRange: { min: 80 * size, max: 250 * size },
            angleRange: { min: 0, max: Math.PI * 2 }
        };
        
        return this.createParticleGroup(x, y, 30, 'death', options);
    }
    
    // 金币拾取效果
    createCoinEffect(x, y, amount = 1) {
        const options = {
            count: amount * 5,
            speedRange: { min: 30, max: 80 },
            angleRange: { min: 0, max: Math.PI * 2 },
            gravity: -200
        };
        
        return this.createParticleGroup(x, y, amount * 5, 'coin', options);
    }
    
    // 经验值拾取效果
    createExpEffect(x, y, amount = 1) {
        const options = {
            count: amount * 3,
            speedRange: { min: 20, max: 60 },
            angleRange: { min: 0, max: Math.PI * 2 }
        };
        
        return this.createParticleGroup(x, y, amount * 3, 'exp', options);
    }
    
    // 火焰效果
    createFireEffect(x, y, size = 1) {
        const options = {
            count: Math.floor(15 * size),
            speedRange: { min: 50 * size, max: 120 * size },
            angleRange: { min: Math.PI * 1.5, max: Math.PI * 2.5 },
            gravity: -200 * size
        };
        
        return this.createParticleGroup(x, y, 15, 'fire', options);
    }
    
    // 冰冻效果
    createIceEffect(x, y, size = 1) {
        const options = {
            count: Math.floor(20 * size),
            speedRange: { min: 80 * size, max: 150 * size },
            angleRange: { min: 0, max: Math.PI * 2 }
        };
        
        return this.createParticleGroup(x, y, 20, 'ice', options);
    }
    
    // 流血效果
    createBloodEffect(x, y, amount = 1) {
        const options = {
            count: amount * 10,
            speedRange: { min: 50, max: 150 },
            angleRange: { min: 0, max: Math.PI },
            gravity: 200
        };
        
        return this.createParticleGroup(x, y, amount * 10, 'blood', options);
    }
    
    // 技能效果
    createSkillEffect(x, y, size = 1) {
        const options = {
            count: Math.floor(25 * size),
            speedRange: { min: 100 * size, max: 200 * size },
            angleRange: { min: 0, max: Math.PI * 2 }
        };
        
        return this.createParticleGroup(x, y, 25, 'skill', options);
    }
    
    // 护盾效果
    createShieldEffect(x, y, size = 1) {
        const options = {
            count: Math.floor(30 * size),
            speedRange: { min: 150 * size, max: 250 * size },
            angleRange: { min: 0, max: Math.PI * 2 }
        };
        
        return this.createParticleGroup(x, y, 30, 'shield', options);
    }
    
    // 闪光效果
    createSparkEffect(x, y, amount = 1) {
        const options = {
            count: amount * 10,
            speedRange: { min: 50, max: 150 },
            angleRange: { min: 0, max: Math.PI * 2 }
        };
        
        return this.createParticleGroup(x, y, amount * 10, 'spark', options);
    }
    
    // 射线效果
    createRayEffect(x1, y1, x2, y2, thickness = 3, color = '#ffffff', duration = 0.2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // 创建射线粒子组
        const particleCount = Math.max(5, Math.floor(length / 20));
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const t = i / (particleCount - 1);
            const px = x1 + dx * t;
            const py = y1 + dy * t;
            
            particles.push(new Particle(px, py, {
                life: duration,
                radius: thickness,
                color: color,
                opacity: 0.8,
                fadeOut: true,
                shape: 'circle',
                sizeChange: -0.5
            }));
        }
        
        // 创建并添加粒子组
        const group = new ParticleGroup(this, 0, 0, 0, null, { particles });
        this.particleGroups.push(group);
        return group;
    }
    
    // 环形效果
    createRingEffect(x, y, radius = 50, color = '#ffffff', thickness = 2, duration = 0.5) {
        const particleCount = Math.max(10, Math.floor(radius * Math.PI / 15));
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            const vx = Math.cos(angle) * 100;
            const vy = Math.sin(angle) * 100;
            
            particles.push(new Particle(px, py, {
                life: duration,
                radius: thickness,
                color: color,
                opacity: 0.8,
                fadeOut: true,
                shape: 'circle',
                sizeChange: -0.5,
                vx: vx,
                vy: vy
            }));
        }
        
        // 创建并添加粒子组
        const group = new ParticleGroup(this, 0, 0, 0, null, { particles });
        this.particleGroups.push(group);
        return group;
    }
    
    // 清理所有粒子
    clear() {
        this.particleGroups = [];
        this.emitters = [];
    }
}

class ParticleGroup {
    constructor(system, x, y, count, template, options = {}) {
        this.system = system;
        this.x = x;
        this.y = y;
        this.particles = [];
        this.isDead = false;
        
        // 创建粒子
        this.createParticles(count, template, options);
    }
    
    createParticles(count, template, options = {}) {
        // 如果直接提供了粒子数组
        if (options.particles) {
            this.particles = options.particles;
            return;
        }
        
        // 获取模板
        const particleTemplate = this.system.particleTemplates[template] || {};
        
        for (let i = 0; i < count; i++) {
            // 计算角度和速度
            const angleRange = options.angleRange || { min: 0, max: Math.PI * 2 };
            const speedRange = options.speedRange || { min: 50, max: 150 };
            
            const angle = angleRange.min + Math.random() * (angleRange.max - angleRange.min);
            const speed = speedRange.min + Math.random() * (speedRange.max - speedRange.min);
            
            // 创建粒子配置
            const particleOptions = {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                ...particleTemplate,
                ...options,
                color: options.colorOverride || particleTemplate.color || '#ffffff'
            };
            
            // 创建粒子
            const particle = new Particle(this.x, this.y, particleOptions);
            this.particles.push(particle);
        }
    }
    
    update(deltaTime) {
        // 更新所有粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            
            if (particle.isDead) {
                this.particles.splice(i, 1);
            }
        }
        
        // 检查是否所有粒子都死亡
        if (this.particles.length === 0) {
            this.isDead = true;
        }
    }
    
    draw(ctx) {
        // 绘制所有粒子
        for (const particle of this.particles) {
            particle.draw(ctx);
        }
    }
    
    // 添加更多粒子
    addParticles(count, template, options = {}) {
        this.createParticles(count, template, options);
    }
    
    // 移除所有粒子
    clearParticles() {
        this.particles = [];
        this.isDead = true;
    }
}

class ParticleEmitter {
    constructor(system, x, y, options = {}) {
        this.system = system;
        this.x = x;
        this.y = y;
        this.particleTemplate = options.particleTemplate || 'explosion';
        this.emitRate = options.emitRate || 20; // 每秒发射的粒子数
        this.emitCount = options.emitCount || 1; // 每次发射的粒子数
        this.emitDuration = options.emitDuration || Infinity; // 发射持续时间
        this.emissionAngleMin = options.emissionAngleMin || 0;
        this.emissionAngleMax = options.emissionAngleMax || Math.PI * 2;
        this.speedMin = options.speedMin || 50;
        this.speedMax = options.speedMax || 150;
        this.particleLifeMin = options.particleLifeMin || 0.5;
        this.particleLifeMax = options.particleLifeMax || 1.5;
        this.particleColor = options.particleColor || null;
        this.isActive = true;
        this.isDead = false;
        this.timer = 0;
        this.lastEmitTime = 0;
        this.lifeTime = 0;
        this.onUpdate = options.onUpdate || null;
        this.onEnd = options.onEnd || null;
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // 更新计时器
        this.timer += deltaTime;
        this.lifeTime += deltaTime;
        
        // 检查是否超过持续时间
        if (this.lifeTime >= this.emitDuration) {
            this.isDead = true;
            if (this.onEnd) {
                this.onEnd();
            }
            return;
        }
        
        // 调用更新回调
        if (this.onUpdate) {
            this.onUpdate(this, deltaTime);
        }
        
        // 计算发射间隔
        const emitInterval = 1 / this.emitRate;
        
        // 检查是否需要发射粒子
        while (this.timer - this.lastEmitTime >= emitInterval) {
            this.emitParticles();
            this.lastEmitTime += emitInterval;
        }
    }
    
    emitParticles() {
        // 计算角度范围
        const angleMin = this.emissionAngleMin;
        const angleMax = this.emissionAngleMax;
        
        // 发射指定数量的粒子
        for (let i = 0; i < this.emitCount; i++) {
            // 计算随机角度和速度
            const angle = angleMin + Math.random() * (angleMax - angleMin);
            const speed = this.speedMin + Math.random() * (this.speedMax - this.speedMin);
            const life = this.particleLifeMin + Math.random() * (this.particleLifeMax - this.particleLifeMin);
            
            // 创建粒子选项
            const options = {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: life,
                angleRange: { min: angle, max: angle },
                speedRange: { min: 0, max: 0 }
            };
            
            // 如果指定了颜色
            if (this.particleColor) {
                options.colorOverride = this.particleColor;
            }
            
            // 创建单个粒子
            this.system.createParticleGroup(this.x, this.y, 1, this.particleTemplate, options);
        }
    }
    
    // 启动发射器
    start() {
        this.isActive = true;
        this.timer = 0;
        this.lastEmitTime = 0;
        this.lifeTime = 0;
    }
    
    // 停止发射器
    stop() {
        this.isActive = false;
    }
    
    // 销毁发射器
    destroy() {
        this.isDead = true;
    }
    
    // 设置位置
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    // 设置发射角度
    setEmissionAngle(min, max) {
        this.emissionAngleMin = min;
        this.emissionAngleMax = max;
    }
    
    // 设置粒子速度范围
    setSpeedRange(min, max) {
        this.speedMin = min;
        this.speedMax = max;
    }
    
    // 设置粒子生命周期范围
    setLifeRange(min, max) {
        this.particleLifeMin = min;
        this.particleLifeMax = max;
    }
    
    // 设置发射率
    setEmitRate(rate) {
        this.emitRate = rate;
    }
    
    // 设置发射持续时间
    setDuration(duration) {
        this.emitDuration = duration;
    }
}

// 预定义特效函数
function createExplosion(x, y, size = 1, color = null) {
    if (globalParticleSystem) {
        return globalParticleSystem.createExplosion(x, y, size, color);
    }
    return null;
}

function createHitEffect(x, y, size = 1) {
    if (globalParticleSystem) {
        return globalParticleSystem.createHitEffect(x, y, size);
    }
    return null;
}

function createDeathEffect(x, y, size = 1) {
    if (globalParticleSystem) {
        return globalParticleSystem.createDeathEffect(x, y, size);
    }
    return null;
}

function createCoinEffect(x, y, amount = 1) {
    if (globalParticleSystem) {
        return globalParticleSystem.createCoinEffect(x, y, amount);
    }
    return null;
}

function createExpEffect(x, y, amount = 1) {
    if (globalParticleSystem) {
        return globalParticleSystem.createExpEffect(x, y, amount);
    }
    return null;
}

function createFireEffect(x, y, size = 1) {
    if (globalParticleSystem) {
        return globalParticleSystem.createFireEffect(x, y, size);
    }
    return null;
}

function createIceEffect(x, y, size = 1) {
    if (globalParticleSystem) {
        return globalParticleSystem.createIceEffect(x, y, size);
    }
    return null;
}

function createBloodEffect(x, y, amount = 1) {
    if (globalParticleSystem) {
        return globalParticleSystem.createBloodEffect(x, y, amount);
    }
    return null;
}

function createSkillEffect(x, y, size = 1) {
    if (globalParticleSystem) {
        return globalParticleSystem.createSkillEffect(x, y, size);
    }
    return null;
}

function createShieldEffect(x, y, size = 1) {
    if (globalParticleSystem) {
        return globalParticleSystem.createShieldEffect(x, y, size);
    }
    return null;
}

function createSparkEffect(x, y, amount = 1) {
    if (globalParticleSystem) {
        return globalParticleSystem.createSparkEffect(x, y, amount);
    }
    return null;
}

function createRayEffect(x1, y1, x2, y2, thickness = 3, color = '#ffffff', duration = 0.2) {
    if (globalParticleSystem) {
        return globalParticleSystem.createRayEffect(x1, y1, x2, y2, thickness, color, duration);
    }
    return null;
}

function createRingEffect(x, y, radius = 50, color = '#ffffff', thickness = 2, duration = 0.5) {
    if (globalParticleSystem) {
        return globalParticleSystem.createRingEffect(x, y, radius, color, thickness, duration);
    }
    return null;
}

// 全局粒子系统实例
let globalParticleSystem = null;

// 粒子系统函数
function getParticleSystem() {
    return globalParticleSystem;
}

function createParticleSystem(game) {
    globalParticleSystem = new ParticleSystem(game);
    return globalParticleSystem;
}

function destroyParticleSystem() {
    if (globalParticleSystem) {
        globalParticleSystem.clear();
    }
    globalParticleSystem = null;
}

// 特效函数
const effects = {
    createExplosion,
    createHitEffect,
    createDeathEffect,
    createCoinEffect,
    createExpEffect,
    createFireEffect,
    createIceEffect,
    createBloodEffect,
    createSkillEffect,
    createShieldEffect,
    createSparkEffect,
    createRayEffect,
    createRingEffect
};
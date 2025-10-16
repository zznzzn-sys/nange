export class Game extends Phaser.Scene {
    constructor() {
        super({ key: 'Game' })
        
        // 游戏状态
        this.player1 = null
        this.player2 = null
        this.bullets = null
        this.obstacles = null
        this.score = { player1: 0, player2: 0 }
        this.gameOver = false
    }

    create() {
        // 设置背景色
        this.cameras.main.setBackgroundColor(0x2c3e50)
        
        // 创建物理组
        this.bullets = this.physics.add.group()
        this.obstacles = this.physics.add.group()
        
        // 创建地图边界
        this.physics.world.setBounds(0, 0, 800, 600)
        
        // 创建障碍物
        this.createObstacles()
        
        // 创建玩家坦克
        this.createTanks()
        
        // 设置碰撞检测
        this.setupCollisions()
        
        // 创建分数显示
        this.createScoreDisplay()
        
        // 创建游戏说明
        this.createInstructions()
        
        // 设置键盘控制
        this.setupControls()
    }

    createObstacles() {
        // 创建随机障碍物
        const positions = [
            { x: 200, y: 150 }, { x: 400, y: 150 }, { x: 600, y: 150 },
            { x: 200, y: 300 }, { x: 600, y: 300 },
            { x: 200, y: 450 }, { x: 400, y: 450 }, { x: 600, y: 450 }
        ]
        
        positions.forEach(pos => {
            const obstacle = this.add.rectangle(pos.x, pos.y, 50, 50, 0x8B4513)
            obstacle.setStrokeStyle(3, 0x000000)
            this.physics.add.existing(obstacle)
            obstacle.body.setImmovable(true)
            this.obstacles.add(obstacle)
        })
    }

    createTanks() {
        // 玩家1坦克（绿色）
        this.player1 = this.add.rectangle(100, 300, 40, 40, 0x00ff00)
        this.player1.setStrokeStyle(2, 0x000000)
        this.physics.add.existing(this.player1)
        this.player1.body.setCollideWorldBounds(true)
        this.player1.direction = 'right'
        this.player1.cooldown = 0
        this.player1.health = 3
        
        // 玩家2坦克（红色）
        this.player2 = this.add.rectangle(700, 300, 40, 40, 0xff0000)
        this.player2.setStrokeStyle(2, 0x000000)
        this.physics.add.existing(this.player2)
        this.player2.body.setCollideWorldBounds(true)
        this.player2.direction = 'left'
        this.player2.cooldown = 0
        this.player2.health = 3
    }

    setupCollisions() {
        // 子弹与障碍物碰撞
        this.physics.add.collider(this.bullets, this.obstacles, (bullet, obstacle) => {
            bullet.destroy()
        })
        
        // 子弹与坦克碰撞
        this.physics.add.overlap(this.bullets, this.player1, this.hitTank, null, this)
        this.physics.add.overlap(this.bullets, this.player2, this.hitTank, null, this)
        
        // 坦克与障碍物碰撞
        this.physics.add.collider(this.player1, this.obstacles)
        this.physics.add.collider(this.player2, this.obstacles)
        
        // 坦克之间碰撞
        this.physics.add.collider(this.player1, this.player2)
    }

    createScoreDisplay() {
        this.scoreText = this.add.text(10, 10, '玩家1: 0 | 玩家2: 0', {
            fontSize: '20px',
            fill: '#fff'
        })
        
        this.healthText = this.add.text(10, 40, '生命值: 玩家1(3) 玩家2(3)', {
            fontSize: '16px',
            fill: '#ccc'
        })
    }

    createInstructions() {
        this.add.text(10, 70, '玩家1: WASD移动, 空格射击', {
            fontSize: '14px',
            fill: '#0f0'
        })
        
        this.add.text(10, 90, '玩家2: 方向键移动, Enter射击', {
            fontSize: '14px',
            fill: '#f00'
        })
        
        this.add.text(10, 110, '目标: 先获得10分的玩家获胜', {
            fontSize: '14px',
            fill: '#ff0'
        })
    }

    setupControls() {
        // 玩家1控制（WASD + 空格）
        this.keys = {
            w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            
            // 玩家2控制（方向键 + Enter）
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            enter: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
        }
    }

    update(time, delta) {
        if (this.gameOver) return
        
        // 更新冷却时间
        this.player1.cooldown = Math.max(0, this.player1.cooldown - delta)
        this.player2.cooldown = Math.max(0, this.player2.cooldown - delta)
        
        // 玩家1移动控制
        this.handleTankMovement(this.player1, 'w', 'a', 's', 'd')
        
        // 玩家2移动控制
        this.handleTankMovement(this.player2, 'up', 'left', 'down', 'right')
        
        // 玩家1射击
        if (Phaser.Input.Keyboard.JustDown(this.keys.space) && this.player1.cooldown === 0) {
            this.shootBullet(this.player1)
            this.player1.cooldown = 500 // 0.5秒冷却
        }
        
        // 玩家2射击
        if (Phaser.Input.Keyboard.JustDown(this.keys.enter) && this.player2.cooldown === 0) {
            this.shootBullet(this.player2)
            this.player2.cooldown = 500 // 0.5秒冷却
        }
        
        // 更新显示
        this.updateDisplay()
    }

    handleTankMovement(tank, upKey, leftKey, downKey, rightKey) {
        const speed = 200
        tank.setVelocity(0, 0)
        
        if (this.keys[upKey].isDown) {
            tank.setVelocityY(-speed)
            tank.direction = 'up'
        } else if (this.keys[downKey].isDown) {
            tank.setVelocityY(speed)
            tank.direction = 'down'
        }
        
        if (this.keys[leftKey].isDown) {
            tank.setVelocityX(-speed)
            tank.direction = 'left'
        } else if (this.keys[rightKey].isDown) {
            tank.setVelocityX(speed)
            tank.direction = 'right'
        }
        
        // 对角线移动时调整速度
        if (tank.body.velocity.x !== 0 && tank.body.velocity.y !== 0) {
            tank.body.velocity.normalize().scale(speed)
        }
    }

    shootBullet(tank) {
        const bullet = this.add.circle(tank.x, tank.y, 5, 0xffff00)
        bullet.setStrokeStyle(1, 0x000000)
        this.physics.add.existing(bullet)
        bullet.owner = tank === this.player1 ? 'player1' : 'player2'
        
        const speed = 400
        switch (tank.direction) {
            case 'up':
                bullet.body.setVelocity(0, -speed)
                break
            case 'down':
                bullet.body.setVelocity(0, speed)
                break
            case 'left':
                bullet.body.setVelocity(-speed, 0)
                break
            case 'right':
                bullet.body.setVelocity(speed, 0)
                break
        }
        
        this.bullets.add(bullet)
        
        // 子弹超出屏幕自动销毁
        bullet.body.setCollideWorldBounds(true)
        bullet.body.onWorldBounds = true
        bullet.body.world.on('worldbounds', (body) => {
            if (body.gameObject === bullet) {
                bullet.destroy()
            }
        })
    }

    hitTank(bullet, tank) {
        if (bullet.owner === (tank === this.player1 ? 'player1' : 'player2')) {
            return // 不能打自己
        }
        
        bullet.destroy()
        tank.health--
        
        if (tank.health <= 0) {
            // 坦克被摧毁
            this.respawnTank(tank)
            
            // 增加对方分数
            if (tank === this.player1) {
                this.score.player2++
            } else {
                this.score.player1++
            }
            
            // 检查游戏结束
            if (this.score.player1 >= 10 || this.score.player2 >= 10) {
                this.gameOver = true
                this.showGameOver()
            }
        }
    }

    respawnTank(tank) {
        tank.health = 3
        
        // 随机重生位置
        if (tank === this.player1) {
            tank.setPosition(100, Phaser.Math.Between(100, 500))
            tank.direction = 'right'
        } else {
            tank.setPosition(700, Phaser.Math.Between(100, 500))
            tank.direction = 'left'
        }
    }

    updateDisplay() {
        this.scoreText.setText(`玩家1: ${this.score.player1} | 玩家2: ${this.score.player2}`)
        this.healthText.setText(`生命值: 玩家1(${this.player1.health}) 玩家2(${this.player2.health})`)
    }

    showGameOver() {
        const winner = this.score.player1 >= 10 ? '玩家1' : '玩家2'
        
        const gameOverText = this.add.text(400, 300, `游戏结束！${winner}获胜！`, {
            fontSize: '32px',
            fill: '#ff0'
        })
        gameOverText.setOrigin(0.5)
        
        const restartText = this.add.text(400, 350, '按R键重新开始', {
            fontSize: '20px',
            fill: '#fff'
        })
        restartText.setOrigin(0.5)
        
        // 重新开始游戏
        this.input.keyboard.once('keydown-R', () => {
            this.scene.restart()
        })
    }
}
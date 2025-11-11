<template>
  <div class="game-container">
    <div class="game-wrap">
      <canvas ref="canvas" :width="canvasWidth" :height="canvasHeight"></canvas>
      <!-- 普尼扣血按钮 -->
      <button 
        v-if="puniBoss && puniBoss.spawned && puniBoss.hp > 0" 
        @click="damagePuni10Percent" 
        class="puni-damage-btn"
        title="扣除普尼10%血量"
      >
        普尼-10%
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GamePage',
  props: {
    playerData: {
      type: Object,
      default: () => ({})
    },
    characterDesign: {
      type: Object,
      default: () => ({
        hair: 'default',
        eyes: 'default',
        outfit: 'default'
      })
    },
    gameTime: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      canvasWidth: 1920,  // 增加画布宽度以扩大视野
      canvasHeight: 1080, // 增加画布高度以扩大视野
      ctx: null,
      mapTiles: [],       // 地图瓦片数组
      tileSize: 100,       // 每个瓦片大小
      viewportOffset: { x: 0, y: 0 }, // 视口偏移
      lastTileX: 0,       // 最后生成的瓦片X坐标
      lastTileY: 0,       // 最后生成的瓦片Y坐标
      gameStatus: '准备中',
      level: 1,
      mapName: '基地外',
      elapsedTime: 0,
      muted: false,
      errorMessage: '',
      musicEnabled: true,
      backgroundMusic: null,
      
      // 游戏状态
      running: false,
      startTime: 0,
      lastFrame: null,
      animationFrameId: null,
      
      // 玩家属性
      player: {
        x: 90,
        y: 0,
        w: 51,
        h: 66,
        vx: 0,
        vy: 0,
        onGround: false,
        color: '#ff6b6b',
        // 新增射击属性
        facingRight: true,
        // 装备系统
        currentWeapon: null,
        currentArmor: null,
        ammo: {},
        // 装备格子系统（16个格子，分为上下两层）
        // 上层（0-7）：武器工具，用鼠标滚轮选择
        // 下层（8-15）：采集工具，用数字键1-8选择
        equipmentSlots: [
          // 上层：武器工具（0-7）
          { id: 1, name: '电击枪', type: 'weapon', icon: '⚡', active: true, layer: 'weapon' },
          { id: 2, name: '光子盾', type: 'shield', icon: '🛡️', active: false, layer: 'weapon' },
          { id: 3, name: '空', type: 'empty', icon: '□', active: false, layer: 'weapon' },
          { id: 4, name: '空', type: 'empty', icon: '□', active: false, layer: 'weapon' },
          { id: 5, name: '空', type: 'empty', icon: '□', active: false, layer: 'weapon' },
          { id: 6, name: '空', type: 'empty', icon: '□', active: false, layer: 'weapon' },
          { id: 7, name: '空', type: 'empty', icon: '□', active: false, layer: 'weapon' },
          { id: 8, name: '空', type: 'empty', icon: '□', active: false, layer: 'weapon' },
          // 下层：采集工具（9-16）
          { id: 9, name: '空', type: 'empty', icon: '□', active: false, layer: 'tool' },
          { id: 10, name: '空', type: 'empty', icon: '□', active: false, layer: 'tool' },
          { id: 11, name: '空', type: 'empty', icon: '□', active: false, layer: 'tool' },
          { id: 12, name: '空', type: 'empty', icon: '□', active: false, layer: 'tool' },
          { id: 13, name: '空', type: 'empty', icon: '□', active: false, layer: 'tool' },
          { id: 14, name: '空', type: 'empty', icon: '□', active: false, layer: 'tool' },
          { id: 15, name: '空', type: 'empty', icon: '□', active: false, layer: 'tool' },
          { id: 16, name: '空', type: 'empty', icon: '□', active: false, layer: 'tool' }
        ],
        currentSlot: 1, // 当前选中的格子编号（兼容旧代码）
        currentWeaponSlot: 1, // 当前选中的武器工具格子（上层，1-8）
        currentToolSlot: 9, // 当前选中的采集工具格子（下层，9-16）
        // 激光工具系统
        laserTool: {
          isActive: false,
          targetBasalt: null,
          targetQuartz: null, // 目标石英岩
          targetIlmenite: null, // 目标钛铁矿
          miningProgress: 0,
          miningTime: 3000, // 3秒挖取时间（玄武岩和石英岩）
          miningTimeIlmenite: 5000, // 5秒挖取时间（钛铁矿，更困难）
          miningRange: 500, // 挖取范围（增加到500像素，因为石英岩可能在高处）
          energy: 100, // 激光能量
          maxEnergy: 100
        },
        // 能源格子系统（8个格子）- 用于存储采集的资源
        energySlots: [
          { id: 1, name: '资源格1', type: 'resource', icon: '📦', active: true, resource: null, count: 0 },
          { id: 2, name: '资源格2', type: 'resource', icon: '📦', active: false, resource: null, count: 0 },
          { id: 3, name: '资源格3', type: 'resource', icon: '📦', active: false, resource: null, count: 0 },
          { id: 4, name: '资源格4', type: 'resource', icon: '📦', active: false, resource: null, count: 0 },
          { id: 5, name: '资源格5', type: 'resource', icon: '📦', active: false, resource: null, count: 0 },
          { id: 6, name: '资源格6', type: 'resource', icon: '📦', active: false, resource: null, count: 0 },
          { id: 7, name: '资源格7', type: 'resource', icon: '📦', active: false, resource: null, count: 0 },
          { id: 8, name: '资源格8', type: 'resource', icon: '📦', active: false, resource: null, count: 0 }
        ],
        currentEnergySlot: 1, // 当前选中的能源格子编号
        // 背包系统
        backpack: [],
        // 掉落物系统
        drops: [],
        // 人物体力与状态
        stamina: {
          max: 2000,
          current: 2000,
          lastUpdateTime: 0,
          // 体力消耗
          decayRate: 1, // 每分钟减少1点
          shootCost: 1, // 每发子弹消耗1点体力
          // 体力恢复
          foodRecovery: 1000, // 每个食物包恢复1000体力
          waterRecovery: 400, // 每瓶水恢复400体力
          passiveRecovery: 1.5 // 不受到攻击时每分钟回复1.5体力
        }
      },
      
      // 输入控制
      input: {
        left: false,
        right: false,
        jump: false,
        run: false, // 奔跑状态（按住Shift）
        shoot: false,
        rapidFire: false,
        useItem: false // 新增使用道具状态
      },
      rapidFireInterval: null,
      fireRate: 100,
      chipCooldown: 0, // 薯片使用冷却时间
      chipCooldownTime: 5000, // 5秒冷却
      // 电击枪连发系统
      electricGun: {
        lastFireTime: 0, // 上次射击时间
        fireCooldown: 200, // 基础射击冷却时间（毫秒）
        minFireCooldown: 50, // 最小射击冷却时间（最快射速）
        rapidFireBonus: 0, // 连发奖励（快速点击时减少冷却）
        clickHistory: [], // 点击历史记录（用于计算点击速度）
        rapidFireDecay: 0.95 // 连发奖励衰减速度
      },
      
      // 游戏物理参数(优化后的月球环境)
      GRAVITY: 1600 / 4, // 增加重力，加快下降速度（原来是1/8，现在是1/4）
      MOVE_SPEED: 280 * 1.3, // 增加基础移动速度
      RUN_SPEED: 400 * 1.5, // 奔跑速度（按住Shift）
      JUMP_V: 820 * 1.0, // 减小跳跃初速度
      AIR_RESISTANCE: 0.9, // 更强的空气阻力
      MAX_JUMP_HEIGHT: 200, // 降低最大跳跃高度
      MAX_HORIZONTAL_SPEED: 500, // 最大水平速度（相应提高，支持奔跑）
      
      // 游戏对象
      obstacles: [],
      groundGaps: [],
      speedZones: [],
      traps: [],
      items: [], // 道具系统
      impactCraters: [], // 陨石撞击坑
      hiddenIlmeniteOres: [], // 隐藏的钛铁矿（地面下，默认不可见）
      visibleIlmeniteOres: [], // 扫描后可见的钛铁矿
      generatedIlmeniteRegions: [], // 已生成的钛铁矿区域标记
      // 钻探机系统
      drillMachine: {
        deployed: false, // 是否已部署
        activated: false, // 是否已激活（需要装备冷凝模块并点击激活）
        x: 0, // 部署位置X
        y: 0, // 部署位置Y
        energy: 0, // 当前能源（从StartMenu传递，最大100）
        maxEnergy: 100, // 最大能量100
        lastExtractTime: 0, // 上次提取时间
        extractInterval: 10000, // 提取间隔10秒（毫秒）
        extractAmount: 2, // 每次提取2单位水冰
        energyConsumption: 1, // 每秒消耗1单位能源
        lastEnergyConsumeTime: 0, // 上次消耗能源时间
        hasCondensationModule: false, // 是否装备了冷凝模块
        waterIceDrops: [], // 生成的水冰掉落物
        lastWarningTime: 0 // 上次警告时间（用于提示装备冷凝模块）
      },
      avatarImg: null,
      
      // 准心相关
      crosshair: {
        x: 0,
        y: 0,
        visible: false
      },
      
      // 地图边界（以基地为原点）
      mapSize: 10000,  // 地图总大小10000px
      mapMinX: -5000, // X轴最小边界
      mapMaxX: 5000,  // X轴最大边界
      mapMinY: -5000, // Y轴最小边界（负Y轴）
      mapMaxY: 5000,  // Y轴最大边界
      
      // 永久阴影区定义
      // 南极永久阴影区：x轴 3500px到5000px，y轴从-750px到100px（包括地面上方和地面附近）
      // 北极永久阴影区：x轴 -5000px到-3500px，y轴从-750px到100px（包括地面上方和地面附近）
      // 注意：在Canvas坐标系中，Y=0是地面，Y>0是地面下方，Y<0是地面上方
      shadowZones: [
        {
          name: '南极永久阴影区',
          x: 3500,      // X轴起始位置：3500px
          y: -750,     // Y轴起始位置：-750px（地面上方750px）
          width: 1500,  // 宽度：5000 - 3500 = 1500px
          height: 850  // 高度：从Y=-750向下延伸到Y=100（包括地面和地面下方100px）
        },
        {
          name: '北极永久阴影区',
          x: -5000,    // X轴起始位置：-5000px（从-5000到-3500）
          y: -750,     // Y轴起始位置：-750px（地面上方750px）
          width: 1500,  // 宽度：-3500 - (-5000) = 1500px
          height: 850  // 高度：从Y=-750向下延伸到Y=100（包括地面和地面下方100px）
        }
      ],
      
      // 雨海区域定义（Y轴从-750px到-3000px，整个X轴范围）
      rainSeaZone: {
        name: '月球雨海',
        x: -5000,      // X轴起始位置：-5000px（整个地图宽度）
        y: -3000,       // Y轴起始位置：-3000px（地面上方3000px）
        width: 10000,   // 宽度：覆盖整个地图（-5000到5000）
        height: 2250    // 高度：从Y=-3000向下延伸到Y=-750（2250px高度）
        // 注意：雨海区域在地面上方，玩家需要向上跳或飞行才能到达
      },
      
      // 风暴洋、澄海玄武岩地区定义（X轴从-3500px到3500px，Y轴从0px到-750px）
      stormOceanZone: {
        name: '风暴洋、澄海玄武岩地区',
        x: -3500,       // X轴起始位置：-3500px
        y: -750,       // Y轴起始位置：-750px（地面上方750px）
        width: 7000,   // 宽度：3500 - (-3500) = 7000px
        height: 750    // 高度：从Y=-750向下延伸到Y=0（地面）
      },
      
      // 未知区定义（Y轴从-5000px到-3000px，整个X轴范围）
      unknownZone: {
        name: '未知区',
        x: -5000,      // X轴起始位置：-5000px（整个地图宽度）
        y: -5000,      // Y轴起始位置：-5000px（地图最底部）
        width: 10000,  // 宽度：覆盖整个地图（-5000到5000）
        height: 2000   // 高度：从Y=-5000向上延伸到Y=-3000（2000px高度）
      },
      
      // 已生成的陨石区域标记（避免重复生成）
      generatedMeteorRegions: [],
      // 已生成的撞击坑区域标记（避免重复生成）
      generatedCraterRegions: [],
      // 已生成的风暴洋地形区域标记（避免重复生成）
      generatedStormOceanTerrainRegions: [],
      
      // 谱尼BOSS系统
      puniBoss: {
        spawned: false,
        x: 0, // 未知区中心X
        y: -4000, // 未知区中心Y（-5000到-3000的中心）
        w: 2000, // 超级巨大的体型（增强压迫感）
        h: 800, // 巨大的高度
        hp: 10000, // 超级高的血量
        maxHp: 10000,
        attackRange: 3000, // 攻击范围（像素），玩家进入此范围内BOSS开始攻击（增加到3000像素）
        // 形态
        form: 'original', // 'original' 或 'evolved'
        // 原初形态属性
        energyBody: {
          glowIntensity: 1,
          glowPhase: 0,
          contractionPhase: 0, // 缩壳状态
          isContracted: false
        },
        // 触翼（6根）- 改为触手
        wings: Array(6).fill(0).map((_, i) => ({
          angle: (Math.PI * 2 * i) / 6,
          phase: i * 0.5,
          glow: 0,
          swingPhase: i * 0.8, // 摆动相位
          swingAmplitude: 0.3 + Math.random() * 0.2 // 摆动幅度
        })),
        // 触手（6-8根，从主体延伸出来）
        tentacles: Array(8).fill(0).map((_, i) => ({
          angle: (Math.PI * 2 * i) / 8, // 8根触手均匀分布
          phase: i * 0.6,
          glow: 0,
          swingPhase: i * 1.2, // 摆动相位（每根触手不同）
          swingAmplitude: 0.4 + Math.random() * 0.3, // 摆动幅度（0.4-0.7）
          length: 400 + Math.random() * 200, // 触手长度（400-600像素）
          segments: 15 + Math.floor(Math.random() * 10), // 触手分段数（15-25段）
          baseWidth: 20 + Math.random() * 10, // 触手根部宽度
          tipWidth: 5 + Math.random() * 5 // 触手末端宽度
        })),
        // 封印之石（7颗）
        sealStones: Array(7).fill(0).map((_, i) => ({
          angle: (Math.PI * 2 * i) / 7,
          distance: 120,
          color: '#ffffff',
          glow: 1,
          sealType: ['虚无', '元素', '能量', '生命', '轮回', '永恒', '圣洁'][i]
        })),
        // 战斗状态
        attackCooldown: 0,
        skillQueue: [],
        currentSkill: null,
        skillCastTime: 0,
        wasInZone: false, // 标记玩家是否在攻击范围内（用于检测刚刚进入）
        lastBattleDebugTime: 0, // 上次战斗调试信息输出时间
        lastRangeWarningTime: 0, // 上次范围警告时间
        lastSkillDebugTime: 0, // 上次技能执行调试时间
        lastCooldownDebugTime: 0, // 上次冷却调试时间
        // 技能CD
        skillCooldowns: {
          siZhouJiGuang: 0, // 一技能：四周激光
          qianLieXuGuangShan: 0, // 千烈虚光闪
          xuanMieLieKongZhen: 0, // 旋灭裂空阵
          shengGuangQi: 0, // 圣光气
          ruoXuFeiWu: 0, // 若虚非无
          shengLingMoShanGuang: 0, // 圣灵魔闪光
          cuiLingShengGuang: 0, // 璀灵圣光
          shengYingLiuGuangPo: 0, // 圣影流光破
          // 新攻击技能
          shanXingDanMu: 0, // 扇形弹幕（三向/五向扇形子弹）
          genZongZiDan: 0, // 跟踪子弹（缓慢跟踪玩家）
          xuanZhuanDanMu: 0, // 旋转弹幕（环绕旋转后扩散）
          lianXuChongCi: 0, // 连续冲刺（快速向玩家冲刺3次）
          jiGuangSaoShe: 0, // 激光扫射（持续扫射激光）
          quYuBaoZha: 0, // 区域爆炸（在玩家位置生成爆炸区域）
          yuanQiDan: 0, // 元气弹（向四周发射黄色元气弹）
          // 形态专属技能
          shiZiJiGuangZhen: 0, // 原初形态：十字激光阵（可躲避）
          zhuiZongNengLiangBo: 0, // 进化形态：追踪能量波（可躲避）
          sanSheJiGuangDan: 0, // 原初形态：散发激光子弹（持续散发一圈激光子弹）
          chengQunZiDan: 0 // 成群子弹：向玩家发射大量子弹（所有阶段可用）
        },
        // 状态效果
        buffs: {
          shengGuangQi: 0, // 圣光气剩余回合（下两回合必定暴击）
          cuiLingShengGuang: 0, // 璀灵圣光剩余回合（免疫伤害+先手翻倍）
          shield: 0 // 护盾值
        },
        // 悬浮高度
        floatHeight: 300, // 悬浮在地面上方的高度
        floatPhase: 0, // 悬浮动画相位
        // 移动
        targetX: 0,
        moveSpeed: 30,
        // 伤害数值
        damageValues: {
          siZhouJiGuang: 5, // 一技能：四周激光伤害
          qianLieXuGuangShan: 140,
          xuanMieLieKongZhen: 135,
          shengLingMoShanGuang: 160,
          shengYingLiuGuangPo: 150,
          // 新攻击技能伤害
          shanXingDanMu: 8, // 扇形弹幕伤害
          genZongZiDan: 10, // 跟踪子弹伤害
          xuanZhuanDanMu: 6, // 旋转弹幕伤害
          lianXuChongCi: 15, // 连续冲刺伤害（每次冲撞击中）
          jiGuangSaoShe: 3, // 激光扫射伤害（持续伤害）
          quYuBaoZha: 20, // 区域爆炸伤害
          yuanQiDan: 8, // 元气弹伤害
          // 形态专属技能伤害
          shiZiJiGuangZhen: 15, // 十字激光阵伤害
          zhuiZongNengLiangBo: 12, // 追踪能量波伤害
          sanSheJiGuangDan: 8, // 散发激光子弹伤害
          chengQunZiDan: 6 // 成群子弹伤害（单发伤害较低，但数量多）
        }
      },
      
      // 无限模式参数
      totalDistance: 0,
      spawnCursorX: 0,
      patternIndex: 0,
      hp: 10000, // 提高血量到10000，便于观察BOSS攻击模式
      maxHp: 10000, // 最大血量
      invincibleUntil: 0,
      
      // 地面位置（世界坐标系中的固定值）
      groundY: 0,  // 固定的世界坐标Y值，地面在Y=0位置
      
      // 新增系统
      bullets: [], // 玩家子弹
      monsterBullets: [], // 怪物子弹
      monsters: [], // 怪物
      crystalFragments: [], // 晶体碎片（洞刺兽的晶体喷射产生的碎片）
      // treasures: [], // 宝物（已移除）
      boss: null, // BOSS
      damageEffects: [], // 伤害效果
      dashEffects: [], // 冲刺视觉效果
      bossSpawnDistance: 5000, // BOSS生成距离
      
      // 光子盾牌系统
      photonShield: {
        active: false,
        x: 0,
        y: 0,
        width: 80,
        height: 120,
        duration: 0.5, // 持续时间0.5秒
        activeTime: 0,
        energy: 0, // 当前能量（会在loadPhotonShieldEnergy中设置）
        maxEnergy: 20, // 最大能量20格
        uses: 0, // 当前使用次数
        maxUses: 20, // 最大使用次数20次
        angle: 0 // 盾牌朝向角度
      },
      
      // 游戏统计
      money: 0,
      kills: 0,
      // treasuresCollected: 0 // 宝物收集统计（已移除）
    }
  },
  
  computed: {
    // groundY 已移至 data 中作为固定值
  },
  
  mounted() {
    this.initGame()
    this.setupEventListeners()
    this.startGame(1)
  },
  
  beforeUnmount() {
    this.cleanup()
  },
  
  methods: {
    // 绘制圆角矩形辅助方法
    drawRoundedRect(ctx, x, y, width, height, radius) {
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + width - radius, y)
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
      ctx.lineTo(x + width, y + height - radius)
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
      ctx.lineTo(x + radius, y + height)
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    },
    
    initializePlayerEquipment() {
      // 确保ammo对象存在
      this.player.ammo = this.player.ammo || {}
      
      // 初始化玩家装备
      if (this.playerData.weapons?.length > 0) {
        this.player.currentWeapon = this.playerData.weapons[0]
      } else {
        // 如果没有武器，给玩家默认武器（电击枪）
        this.player.currentWeapon = {
          name: '电击枪',
          type: 'electric',
          damage: 15
        }
      }
      
      // 初始化电击子弹（从初始界面传递）
      if (this.playerData.electricBullets !== undefined) {
        this.player.ammo.electric = this.playerData.electricBullets
      } else {
        this.player.ammo.electric = 0
      }
      
      if (this.playerData.armor && this.playerData.armor.length > 0) {
        this.player.currentArmor = this.playerData.armor[0]
      }
      
      // 初始化玩家背包
      this.player.backpack = []
      
      // 修复弹药数据格式问题：将数组格式转换为对象格式
      // 先保存电击子弹数量
      const electricBullets = this.player.ammo.electric || 0
      
      this.player.ammo = {}
      if (this.playerData.ammo && Array.isArray(this.playerData.ammo)) {
        // 处理数组格式的弹药数据
        this.playerData.ammo.forEach(ammoItem => {
          this.player.ammo[ammoItem.type] = ammoItem.count
        })
      } else if (this.playerData.ammo && typeof this.playerData.ammo === 'object') {
        // 处理对象格式的弹药数据
        this.player.ammo = { ...this.playerData.ammo }
      } else {
        // 如果没有子弹，给玩家默认子弹（电击子弹）
        this.player.ammo = {
          electric: 30
        }
      }
      
      // 恢复电击子弹数量
      this.player.ammo.electric = electricBullets
      
      this.money = this.playerData.money || 0
      
      // 从localStorage加载已拥有的工具，并添加到装备格子
      this.loadToolsToEquipmentSlots()
    },
    
    // 新增方法：从localStorage加载工具到装备格子（所有采集工具都加载到下层9-16号格子）
    loadToolsToEquipmentSlots() {
      const saved = localStorage.getItem('delta-action-game')
      let ownedTools = {}
      
      if (saved) {
        try {
          const data = JSON.parse(saved)
          ownedTools = data.ownedTools || {}
        } catch (e) {
          console.error('加载存档失败:', e)
        }
      }
      
      // 确保初始装备始终存在（即使存档中没有）
      ownedTools['基础激光镐'] = ownedTools['基础激光镐'] || true
      ownedTools['电击枪'] = ownedTools['电击枪'] || true
      ownedTools['光子盾'] = ownedTools['光子盾'] || true
      
      try {
        
        // 武器工具映射（上层，索引0-7，对应id 1-8）
        const weaponMapping = {
          '电击枪': { icon: '⚡', type: 'weapon' },
          '光子盾': { icon: '🛡️', type: 'shield' }
        }
        
        // 武器工具优先级列表
        const priorityWeapons = ['电击枪', '光子盾']
        
        // 首先加载武器工具到上层（索引0-7，对应id 1-8）
        let weaponSlotIndex = 0 // 上层第一个格子（1号格子）
        
        for (const weaponName of priorityWeapons) {
          if (weaponSlotIndex >= 8) break // 上层只有8个格子（1-8号）
          
          const isOwned = ownedTools[weaponName] === true || (typeof ownedTools[weaponName] === 'number' && ownedTools[weaponName] > 0)
          
          if (isOwned && weaponMapping[weaponName]) {
            const weapon = weaponMapping[weaponName]
            this.player.equipmentSlots[weaponSlotIndex] = {
              id: weaponSlotIndex + 1,
              name: weaponName,
              type: weapon.type,
              icon: weapon.icon,
              active: weaponName === '电击枪', // 电击枪默认激活
              layer: 'weapon'
            }
            weaponSlotIndex++
          }
        }
        
        // 处理其他武器工具（不在优先级列表中的）
        for (const toolName in ownedTools) {
          if (weaponSlotIndex >= 8) break // 上层只有8个格子
          
          // 跳过已处理的武器
          if (priorityWeapons.includes(toolName)) continue
          
          const isOwned = ownedTools[toolName] === true || (typeof ownedTools[toolName] === 'number' && ownedTools[toolName] > 0)
          
          if (isOwned && weaponMapping[toolName]) {
            const weapon = weaponMapping[toolName]
            this.player.equipmentSlots[weaponSlotIndex] = {
              id: weaponSlotIndex + 1,
              name: toolName,
              type: weapon.type,
              icon: weapon.icon,
              active: false,
              layer: 'weapon'
            }
            weaponSlotIndex++
          }
        }
        
        // 上层剩余格子保持为空
        for (let i = weaponSlotIndex; i < 8; i++) {
          this.player.equipmentSlots[i] = {
            id: i + 1,
            name: '空',
            type: 'empty',
            icon: '□',
            active: false,
            layer: 'weapon'
          }
        }
        
        // 工具名称到图标和类型的映射（所有这些都是采集工具）
        const toolMapping = {
          '钻探机': { icon: '🛠️', type: 'tool' },
          '冷凝模块': { icon: '❄️', type: 'module' },
          '高级激光镐': { icon: '⚡', type: 'laser' },
          '基础激光镐': { icon: '🔦', type: 'laser' },
          '地质探测器': { icon: '📡', type: 'tool' },
          '机械拆解机': { icon: '🔧', type: 'tool' }
        }
        
        // 需要特殊处理的工具顺序（优先显示）
        const priorityTools = ['高级激光镐', '基础激光镐', '地质探测器', '钻探机', '机械拆解机', '冷凝模块']
        
        // 从下层第1个格子开始（索引8，对应id 9），下层是采集工具格子
        let slotIndex = 8 // 下层第一个格子（9号格子）
        
        // 首先检查激光镐（特殊处理）
        const hasAdvancedLaser = ownedTools['高级激光镐'] === true || (typeof ownedTools['高级激光镐'] === 'number' && ownedTools['高级激光镐'] > 0)
        const hasBasicLaser = ownedTools['基础激光镐'] === true || (typeof ownedTools['基础激光镐'] === 'number' && ownedTools['基础激光镐'] > 0)
        
        // 如果拥有高级激光镐，放在下层第1格
        if (hasAdvancedLaser) {
          this.player.equipmentSlots[8] = {
            id: 9,
              name: '高级激光镐',
              type: 'laser',
              icon: '⚡',
            active: false,
            layer: 'tool'
          }
          slotIndex = 9 // 从第2个格子开始放置其他工具
        } else if (hasBasicLaser) {
          // 如果只拥有基础激光镐，放在下层第1格
          this.player.equipmentSlots[8] = {
            id: 9,
            name: '基础激光镐',
            type: 'laser',
            icon: '🔦',
            active: false,
            layer: 'tool'
          }
          slotIndex = 9 // 从第2个格子开始放置其他工具
        } else {
          // 如果都没有，清空第1格
          this.player.equipmentSlots[8] = {
            id: 9,
            name: '空',
            type: 'empty',
            icon: '□',
            active: false,
            layer: 'tool'
          }
          slotIndex = 8 // 从第1个格子开始放置其他工具
        }
        
        // 然后处理其他优先工具（跳过激光镐，因为已经处理了）
        for (const toolName of priorityTools) {
          if (slotIndex >= 16) break // 下层只有8个格子（9-16号）
          
          // 跳过激光镐，因为已经处理了
          if (toolName === '高级激光镐' || toolName === '基础激光镐') {
            continue
          }
          
          const isOwned = ownedTools[toolName] === true || (typeof ownedTools[toolName] === 'number' && ownedTools[toolName] > 0)
          
          if (isOwned && toolMapping[toolName]) {
            const tool = toolMapping[toolName]
            this.player.equipmentSlots[slotIndex] = {
              id: slotIndex + 1,
              name: toolName,
              type: tool.type,
              icon: tool.icon,
              active: false,
              layer: 'tool' // 确保所有工具都在下层
            }
            slotIndex++
          }
        }
        
        // 处理其他工具（不在优先级列表中的）
        for (const toolName in ownedTools) {
          if (slotIndex >= 16) break // 下层只有8个格子（9-16号）
          
          // 跳过已处理的工具
          if (priorityTools.includes(toolName)) continue
          
          const isOwned = ownedTools[toolName] === true || (typeof ownedTools[toolName] === 'number' && ownedTools[toolName] > 0)
          
          if (isOwned && toolMapping[toolName]) {
            const tool = toolMapping[toolName]
            this.player.equipmentSlots[slotIndex] = {
              id: slotIndex + 1,
              name: toolName,
              type: tool.type,
              icon: tool.icon,
              active: false,
              layer: 'tool' // 确保所有工具都在下层
            }
            slotIndex++
          }
        }
        
        // 剩余的格子保持为空（但确保layer属性正确）
        for (let i = slotIndex; i < this.player.equipmentSlots.length; i++) {
          const layer = i < 8 ? 'weapon' : 'tool' // 前8个是上层武器工具，后8个是下层采集工具
          this.player.equipmentSlots[i] = {
            id: i + 1,
            name: '空',
            type: 'empty',
            icon: '□',
            active: false,
            layer: layer
          }
        }
        
        // 如果电击枪被加载，设置当前武器
        const electricGunSlot = this.player.equipmentSlots.find(slot => slot.name === '电击枪' && slot.layer === 'weapon')
        if (electricGunSlot && electricGunSlot.active) {
          this.player.currentWeapon = { name: '电击枪', type: 'electric', damage: 15 }
          this.player.currentWeaponSlot = electricGunSlot.id
          this.player.currentSlot = electricGunSlot.id
        }
        
        // 确保初始工具保存到 localStorage
        const saved = localStorage.getItem('delta-action-game')
        let gameData = saved ? JSON.parse(saved) : {}
        if (!gameData.ownedTools) {
          gameData.ownedTools = {}
        }
        // 确保初始装备始终存在
        gameData.ownedTools['基础激光镐'] = gameData.ownedTools['基础激光镐'] || true
        gameData.ownedTools['电击枪'] = gameData.ownedTools['电击枪'] || true
        gameData.ownedTools['光子盾'] = gameData.ownedTools['光子盾'] || true
        localStorage.setItem('delta-action-game', JSON.stringify(gameData))
        
        console.log('工具已加载到装备格子:', this.player.equipmentSlots)
      } catch (e) {
        console.error('加载工具到装备格子失败:', e)
      }
    },
    
    // 加载光子盾能量状态
    loadPhotonShieldEnergy() {
      const saved = localStorage.getItem('delta-action-game');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.photonShieldEnergy !== undefined) {
          // 设置光子盾能量为保存的值
          this.photonShield.energy = data.photonShieldEnergy;
          console.log('光子盾能量已加载:', this.photonShield.energy);
        }
      }
    },
    
    // 加载钻探机能量状态
    loadDrillMachineEnergy() {
      // 优先从playerData获取（从StartMenu传递）
      if (this.playerData && this.playerData.drillMachineEnergy !== undefined) {
        this.drillMachine.energy = this.playerData.drillMachineEnergy;
        console.log('钻探机能量已加载（从playerData）:', this.drillMachine.energy);
        return
      }
      
      // 如果没有从playerData获取，从localStorage加载
      const saved = localStorage.getItem('delta-action-game');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.drillMachineEnergy !== undefined) {
            this.drillMachine.energy = data.drillMachineEnergy;
            console.log('钻探机能量已加载（从localStorage）:', this.drillMachine.energy);
          }
        } catch (e) {
          console.error('加载钻探机能量失败:', e);
        }
      }
    },
    
    initGame() {
      const canvas = this.$refs.canvas
      this.ctx = canvas.getContext('2d')
      // 隐藏系统鼠标光标，使用自定义准星
      if (canvas) {
        canvas.style.cursor = 'none'
      }
      this.resizeCanvas()
      window.addEventListener('resize', this.resizeCanvas)
      
      // 飞船初始状态 (以原点(0,0)为基地位置)
      // 基地位置：x=0（原点），y在地面上方
      this.ship = {
        x: -90,  // 基地中心在原点，所以x = -宽度/2
        y: this.groundY - 225,
        w: 180,
        h: 225,
        doorOpen: false,
        doorProgress: 0,
        isStatic: true  // 作为场景元素
      }
      
      // 将飞船添加到障碍物列表，使其随场景移动
      this.obstacles.push({
        x: this.ship.x,
        y: this.ship.y,
        w: this.ship.w,
        h: this.ship.h,
        isStatic: true,
        type: 'ship'
      })
    },
    
    resizeCanvas() {
      // 扩大视野：允许更大的画布尺寸
      const maxW = Math.min(1920, window.innerWidth - 32)
      const maxH = Math.min(1080, window.innerHeight - 32)
      this.canvasWidth = Math.round(maxW)
      this.canvasHeight = Math.round(maxH)
    },
    
    setupEventListeners() {
      window.addEventListener('keydown', this.handleKeyDown)
      window.addEventListener('keyup', this.handleKeyUp)
      // 添加鼠标点击射击控制 - 修复canvas引用问题
      if (this.$refs.canvas) {
        this.$refs.canvas.addEventListener('click', this.handleMouseShoot)
        this.$refs.canvas.addEventListener('contextmenu', this.handleRightClick)
        // 添加鼠标移动事件监听准心
        this.$refs.canvas.addEventListener('mousemove', this.handleMouseMove)
        this.$refs.canvas.addEventListener('mouseenter', this.handleMouseEnter)
        this.$refs.canvas.addEventListener('mouseleave', this.handleMouseLeave)
        // 添加鼠标滚轮事件监听装备切换
        this.$refs.canvas.addEventListener('wheel', this.handleMouseWheel)
        
        // 阻止右键默认菜单
        this.$refs.canvas.addEventListener('contextmenu', (e) => e.preventDefault())
      }
    },
    
    handleKeyDown(e) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.input.left = true
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.input.right = true
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.input.jump = true
      }
      
      // 按住Shift键奔跑
      if (e.key === 'Shift' || e.key === 'ShiftLeft' || e.key === 'ShiftRight') {
        this.input.run = true
      }
      
      // 数字键1-8选择下层采集工具（9-16号格子）
      if (e.key >= '1' && e.key <= '8') {
        const toolIndex = parseInt(e.key) - 1 // 0-7
        const toolSlotId = 9 + toolIndex // 9-16
        this.switchToolSlot(toolSlotId)
      }
      
      // 按E进入/离开飞船
      if (e.key === 'e' || e.key === 'E') {
        this.tryEnterShip()
      }
    },
    
    // 检测是否在舱门附近 (适配新尺寸)
    isNearShipDoor() {
      const doorX = this.ship.x + this.ship.w/2
      const doorY = this.ship.y + this.ship.h
      const playerCenterX = this.player.x + this.player.w/2
      const playerCenterY = this.player.y + this.player.h
      
      // 检测玩家是否在舱门下方区域 (扩大交互范围)
      return Math.abs(playerCenterX - doorX) < 80 &&  // 进一步扩大交互范围
             playerCenterY >= doorY - 30 &&         // 增加垂直检测范围
             playerCenterY <= doorY + 80            // 增加上方检测范围
    },
    
    // 尝试进入/返回飞船
    tryEnterShip() {
      if (this.isNearShipDoor() || this.player.inShip) {
        if (!this.player.inShip) {
          // 进入飞船并返回初始界面
          this.player.inShip = true
          this.ship.doorOpen = true
          this.ship.doorProgress = 100
          
          // 停止游戏循环和清理资源
          this.running = false
          if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId)
            this.animationFrameId = null
          }
          
          // 清除连射定时器
          if (this.rapidFireInterval) {
            clearInterval(this.rapidFireInterval)
            this.rapidFireInterval = null
          }
          
          // 收集所有资源格中的资源
          const collectedResources = {}
          this.player.energySlots.forEach(slot => {
            if (slot.resource && slot.count > 0) {
              const resourceName = slot.resource.name
              if (collectedResources[resourceName]) {
                collectedResources[resourceName] += slot.count
              } else {
                collectedResources[resourceName] = slot.count
              }
            }
          })
          
          // 保存当前游戏状态
          const currentState = {
            gameTime: this.gameTime + this.elapsedTime,
            playerData: {
              electricBullets: this.player.ammo.electric || 0,
              hp: this.hp,
              money: this.money,
              kills: this.kills,
              // treasuresCollected: this.treasuresCollected // 宝物收集统计（已移除）
            },
            collectedResources: collectedResources // 传递收集的资源
          }
          
          // 延迟执行以完成动画
          setTimeout(() => {
            this.$emit('return-to-menu', currentState)
          }, 500)
        } else {
          // 离开飞船
          this.player.inShip = false
          this.ship.doorOpen = true
          this.ship.doorProgress = 100
          
          // 将玩家移动到舱门外
          this.player.x = this.ship.x + this.ship.w/2 - this.player.w/2
          this.player.y = this.ship.y + this.ship.h
          this.player.vx = 0
          this.player.vy = 0
          
          // 强制重置玩家状态
          this.player.onGround = true
        }
      }
      return true // 确保返回成功
    },
    
    handleKeyUp(e) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.input.left = false
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.input.right = false
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.input.jump = false
      }
      
      // 释放Shift键停止奔跑
      if (e.key === 'Shift' || e.key === 'ShiftLeft' || e.key === 'ShiftRight') {
        this.input.run = false
      }
    },
    
    // 返回主界面方法
    returnToMainMenu() {
      // 停止游戏循环
      this.running = false
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }
      
      // 清除连射定时器
      if (this.rapidFireInterval) {
        clearInterval(this.rapidFireInterval)
        this.rapidFireInterval = null
      }
      
      // 收集所有资源格中的资源
      const collectedResources = {}
      this.player.energySlots.forEach(slot => {
        if (slot.resource && slot.count > 0) {
          const resourceName = slot.resource.name
          if (collectedResources[resourceName]) {
            collectedResources[resourceName] += slot.count
          } else {
            collectedResources[resourceName] = slot.count
          }
        }
      })
      
      // 收集当前游戏状态数据
      const currentState = {
        gameTime: this.gameTime + this.elapsedTime,
        playerData: {
          electricBullets: this.player.ammo.electric || 0,
          hp: this.hp,
          money: this.money,
          kills: this.kills,
          treasuresCollected: this.treasuresCollected
        },
        collectedResources: collectedResources // 传递收集的资源
      }
      
      // 延迟执行以完成动画
      setTimeout(() => {
        this.$emit('return-to-menu', currentState)
      }, 500)
    },
    
    // 新增：鼠标移动处理准心 - 实时跟随鼠标光标
    handleMouseMove(e) {
      if (!this.running) return
      
      const canvas = this.$refs.canvas
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      // 计算鼠标相对于canvas的位置（考虑canvas的实际显示尺寸）
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      
      // 实时更新准星位置，精确跟随鼠标光标
      this.crosshair.x = (e.clientX - rect.left) * scaleX
      this.crosshair.y = (e.clientY - rect.top) * scaleY
      this.crosshair.visible = true
      
      // 确保坐标在画布范围内
      this.crosshair.x = Math.max(0, Math.min(this.crosshair.x, this.canvasWidth))
      this.crosshair.y = Math.max(0, Math.min(this.crosshair.y, this.canvasHeight))
    },
    
    // 新增：鼠标进入画布
    handleMouseEnter() {
      if (this.running) {
        this.crosshair.visible = true
      }
    },
    
    // 新增：鼠标离开画布
    handleMouseLeave() {
      this.crosshair.visible = false
    },
    
    // 新增：鼠标滚轮切换上层武器工具（只在上层1-8号格子中切换）
    handleMouseWheel(e) {
      if (!this.running) return
      
      // 阻止默认滚动行为
      e.preventDefault()
      
      // 获取滚轮方向（deltaY > 0 表示向下滚动，< 0 表示向上滚动）
      const delta = e.deltaY
      
      if (delta > 0) {
        // 向下滚动：切换到下一个非空武器工具
        this.switchToNextNonEmptyWeapon(true)
      } else if (delta < 0) {
        // 向上滚动：切换到上一个非空武器工具
        this.switchToNextNonEmptyWeapon(false)
      }
    },
    
    // 新增：切换到下一个非空武器工具（只在上层1-8号格子中）
    switchToNextNonEmptyWeapon(forward = true) {
      const weaponSlots = this.player.equipmentSlots.filter(slot => slot.layer === 'weapon') // 只获取上层武器工具
      let currentIndex = weaponSlots.findIndex(slot => slot.id === this.player.currentWeaponSlot)
      if (currentIndex === -1) currentIndex = 0
      
      let attempts = 0
      const slotCount = weaponSlots.length
      
      // 最多尝试所有格子，避免无限循环
      while (attempts < slotCount) {
        // 计算下一个格子的索引
        let nextIndex
        if (forward) {
          nextIndex = (currentIndex + 1) % slotCount
        } else {
          nextIndex = (currentIndex - 1 + slotCount) % slotCount
        }
        
        // 检查格子是否为空
        const nextSlot = weaponSlots[nextIndex]
        if (nextSlot.type !== 'empty') {
          // 找到非空格子，切换到该格子
          this.switchWeaponSlot(nextSlot.id)
          return
        }
        
        // 继续查找下一个格子
        currentIndex = nextIndex
        attempts++
      }
      
      // 如果没有找到非空格子，显示提示
      this.gameStatus = '没有可用的武器工具'
      setTimeout(() => {
        if (this.running) this.gameStatus = '进行中'
      }, 1000)
    },
    
    // 新增：切换武器工具格子（上层）
    switchWeaponSlot(slotId) {
      // 取消所有武器工具格子的激活状态
      this.player.equipmentSlots.forEach(slot => {
        if (slot.layer === 'weapon') {
          slot.active = false
        }
      })
      
      // 激活选中的武器工具格子
      const slot = this.player.equipmentSlots.find(s => s.id === slotId && s.layer === 'weapon')
      if (slot) {
        slot.active = true
        this.player.currentWeaponSlot = slotId
        this.player.currentSlot = slotId // 兼容旧代码
        
        // 根据工具类型执行相应操作
        if (slot.type === 'weapon') {
          // 切换到武器
          this.player.currentWeapon = slot
        } else if (slot.type === 'shield') {
          // 切换到盾牌
          // 可以在这里添加盾牌激活逻辑
        }
      }
    },
    
    // 新增：切换采集工具格子（下层）
    switchToolSlot(slotId) {
      // 取消所有采集工具格子的激活状态
      this.player.equipmentSlots.forEach(slot => {
        if (slot.layer === 'tool') {
          slot.active = false
        }
      })
      
      // 激活选中的采集工具格子
      const slot = this.player.equipmentSlots.find(s => s.id === slotId && s.layer === 'tool')
      if (slot) {
        slot.active = true
        this.player.currentToolSlot = slotId
        
        // 根据工具类型执行相应操作
        if (slot.type === 'laser') {
          // 激活激光镐
          this.player.laserTool.isActive = true
        } else if (slot.type === 'tool') {
          // 激活其他工具
          // 可以在这里添加其他工具的激活逻辑
        }
      }
    },
    
    // 新增：鼠标点击攻击怪兽
    handleMouseShoot(e) {
      if (!this.running) return
      
      // 先检查是否点击了撞击坑（优先处理撞击坑交互）
      const canvas = this.$refs.canvas
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        const worldX = -this.viewportOffset.x + (e.clientX - rect.left) * scaleX
        const worldY = -this.viewportOffset.y + (e.clientY - rect.top) * scaleY
        
        // 检查是否点击了撞击坑
        if (this.checkImpactCraterInteraction(worldX, worldY)) {
          return // 如果点击了撞击坑，不再处理其他交互
        }
      }
      
      // 根据当前装备格子类型执行不同操作
      // 优先使用当前激活的采集工具（工具层优先级更高，因为用户可能更想使用工具）
      let currentSlot = null
      if (this.player.currentToolSlot) {
        currentSlot = this.player.equipmentSlots.find(s => s.id === this.player.currentToolSlot && s.layer === 'tool')
      }
      // 如果工具层没有激活的slot，再检查武器层
      if (!currentSlot && this.player.currentWeaponSlot) {
        currentSlot = this.player.equipmentSlots.find(s => s.id === this.player.currentWeaponSlot && s.layer === 'weapon')
      }
      // 兼容旧代码
      if (!currentSlot) {
        currentSlot = this.player.equipmentSlots[this.player.currentSlot - 1]
      }
      
      if (!currentSlot) return
      
      if (currentSlot.type === 'weapon') {
        // 武器模式：发射子弹
        if (!this.player.currentWeapon) return
        this.fireBullet(e)
      } else if (currentSlot.type === 'shield') {
        // 光子盾模式：激活光子盾
        this.activatePhotonShield()
      } else if (currentSlot.type === 'laser') {
        // 激光工具模式：开始/停止挖取玄武岩、石英岩或钛铁矿
        this.handleLaserTool(e)
      } else if (currentSlot.type === 'tool' && currentSlot.name === '地质探测器') {
        // 地质探测器模式：手动扫描（点击位置扫描）
        console.log('🔍 使用地质探测器扫描...', {
          当前slot: currentSlot.name,
          位置: { x: this.player.x, y: this.player.y }
        })
        const canvas = this.$refs.canvas
        if (canvas) {
          const rect = canvas.getBoundingClientRect()
          const scaleX = canvas.width / rect.width
          const scaleY = canvas.height / rect.height
          const worldX = -this.viewportOffset.x + (e.clientX - rect.left) * scaleX
          const worldY = -this.viewportOffset.y + (e.clientY - rect.top) * scaleY
          console.log('🔍 扫描位置:', { worldX: Math.floor(worldX), worldY: Math.floor(worldY) })
          this.scanForIlmenite(worldX, worldY, false) // false表示显示扫描消息
        } else {
          console.warn('⚠️ 无法获取canvas元素')
        }
      } else if (currentSlot.type === 'tool' && currentSlot.name === '钻探机') {
        // 钻探机模式：部署、激活或收回钻探机
        console.log('🔧 使用钻探机', {
          currentSlot: currentSlot.name,
          currentSlotType: currentSlot.type,
          currentToolSlot: this.player.currentToolSlot,
          currentWeaponSlot: this.player.currentWeaponSlot,
          deployed: this.drillMachine.deployed,
          activated: this.drillMachine.activated,
          energy: this.drillMachine.energy,
          playerPos: { x: this.player.x, y: this.player.y },
          equipmentSlots: this.player.equipmentSlots.filter(s => s.name === '钻探机')
        })
        
        const canvas = this.$refs.canvas
        if (canvas) {
          const rect = canvas.getBoundingClientRect()
          const scaleX = canvas.width / rect.width
          const scaleY = canvas.height / rect.height
          const worldX = -this.viewportOffset.x + (e.clientX - rect.left) * scaleX
          const worldY = -this.viewportOffset.y + (e.clientY - rect.top) * scaleY
          
          console.log('🔧 点击位置:', { worldX: Math.floor(worldX), worldY: Math.floor(worldY) })
          
          // 如果已经部署了钻探机，检查是否点击了钻探机位置
          if (this.drillMachine.deployed) {
            const drillX = this.drillMachine.x
            const drillY = this.drillMachine.y
            const distance = Math.sqrt(
              Math.pow(worldX - drillX, 2) + Math.pow(worldY - drillY, 2)
            )
            
            console.log('🔧 钻探机已部署，距离:', Math.floor(distance))
            
            // 如果点击位置在钻探机附近（50像素内）
            if (distance < 50) {
              // 如果未激活，尝试激活
              if (!this.drillMachine.activated) {
                console.log('🔧 尝试激活钻探机')
                this.activateDrillMachine()
                return
              }
              // 如果已激活，则收回
              console.log('🔧 收回钻探机')
              this.retrieveDrillMachine()
              return
            }
          }
          
          // 否则尝试部署
          console.log('🔧 尝试部署钻探机')
          this.deployDrillMachine(worldX, worldY)
        } else {
          console.warn('⚠️ 无法获取canvas元素')
        }
      } else if (currentSlot.type === 'module' && currentSlot.name === '冷凝模块') {
        // 冷凝模块模式：点击已部署但未激活的钻探机来激活
        const canvas = this.$refs.canvas
        if (canvas) {
          const rect = canvas.getBoundingClientRect()
          const scaleX = canvas.width / rect.width
          const scaleY = canvas.height / rect.height
          const worldX = -this.viewportOffset.x + (e.clientX - rect.left) * scaleX
          const worldY = -this.viewportOffset.y + (e.clientY - rect.top) * scaleY
          
          // 如果已经部署了钻探机但未激活，检查是否点击了钻探机位置
          if (this.drillMachine.deployed && !this.drillMachine.activated) {
            const drillX = this.drillMachine.x
            const drillY = this.drillMachine.y
            const distance = Math.sqrt(
              Math.pow(worldX - drillX, 2) + Math.pow(worldY - drillY, 2)
            )
            
            // 如果点击位置在钻探机附近（50像素内），激活钻探机
            if (distance < 50) {
              this.activateDrillMachine()
              return
            }
          }
        }
      }
      // 空格子不做任何操作
    },
    
    // 新增：激光工具处理 - 朝向准星方向
    handleLaserTool(e) {
      if (!this.running) return
      
      // 如果激光工具已经在工作，停止挖取（但给出提示）
      if (this.player.laserTool.isActive) {
        const remainingTime = Math.ceil((this.player.laserTool.miningTime - this.player.laserTool.miningProgress) / 1000)
        this.stopLaserMining()
        this.gameStatus = `挖取已取消（还需${remainingTime}秒完成）`
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 1500)
        return
      }
      
      // 检查激光能量
      if (this.player.laserTool.energy <= 0) {
        this.gameStatus = '激光能量不足！'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 1000)
        return
      }
      
      // 使用准星位置（屏幕坐标），转换为世界坐标
      const crosshairX = this.crosshair.x
      const crosshairY = this.crosshair.y
      const worldCrosshairX = crosshairX - this.viewportOffset.x
      const worldCrosshairY = crosshairY - this.viewportOffset.y
      
      // 获取当前激活的采集工具
      let currentSlot = this.player.equipmentSlots.find(s => s.id === this.player.currentToolSlot && s.layer === 'tool')
      if (!currentSlot) {
        currentSlot = this.player.equipmentSlots[this.player.currentSlot - 1]
      }
      
      // 调试：检查所有陨石和石英岩
      const allMeteors = this.obstacles.filter(ob => ob.type === 'meteor')
      const allQuartz = allMeteors.filter(ob => ob.isQuartz === true)
      
      // 调试信息：显示统计
      console.log('调试信息：', {
        总陨石数: allMeteors.length,
        石英岩数: allQuartz.length,
        准星世界坐标: { x: worldCrosshairX, y: worldCrosshairY },
        玩家坐标: { x: this.player.x, y: this.player.y },
        视口偏移: { x: this.viewportOffset.x, y: this.viewportOffset.y }
      })
      
      // 检查当前装备是否为高级激光镐
      const isAdvancedLaser = currentSlot && currentSlot.name === '高级激光镐'
      
      // 如果是高级激光镐，优先查找钛铁矿
      if (isAdvancedLaser) {
        const targetIlmenite = this.findNearbyIlmenite(worldCrosshairX, worldCrosshairY)
        if (targetIlmenite) {
          console.log('找到钛铁矿！', targetIlmenite)
          // 开始挖取钛铁矿
          this.startLaserMiningIlmenite(targetIlmenite)
          return
        }
      }
      
      // 优先查找准星位置附近的石英岩（使用世界坐标）
      const targetQuartz = this.findNearbyQuartz(worldCrosshairX, worldCrosshairY)
      if (targetQuartz) {
        console.log('找到石英岩！', targetQuartz)
        // 开始挖取石英岩
        this.startLaserMiningQuartz(targetQuartz)
        return
      }
      
      // 如果没有找到石英岩，查找玄武岩
      const targetBasalt = this.findNearbyBasalt(worldCrosshairX, worldCrosshairY)
      if (targetBasalt) {
        console.log('找到玄武岩！', targetBasalt)
        // 开始挖取玄武岩
        this.startLaserMining(targetBasalt)
      } else {
        // 调试信息：检查是否有玄武岩，但距离太远
        const allBasalt = this.traps.filter(trap => trap.type === 'basalt')
        if (allBasalt.length > 0) {
          // 找到最近的玄武岩并显示距离
          let nearestBasalt = null
          let nearestDistance = Infinity
          for (const basalt of allBasalt) {
            const basaltCenterX = basalt.x + basalt.w / 2
            const basaltCenterY = basalt.y + basalt.h / 2
            const distance = Math.sqrt(
              Math.pow(worldCrosshairX - basaltCenterX, 2) + 
              Math.pow(worldCrosshairY - basaltCenterY, 2)
            )
            if (distance < nearestDistance) {
              nearestBasalt = basalt
              nearestDistance = distance
            }
          }
          if (nearestBasalt) {
            this.gameStatus = `最近的玄武岩距离：${Math.floor(nearestDistance)}px（需要${this.player.laserTool.miningRange}px内）位置：(${Math.floor(nearestBasalt.x)}, ${Math.floor(nearestBasalt.y)})`
            setTimeout(() => {
              if (this.running) this.gameStatus = '进行中'
            }, 3000)
          } else {
            this.gameStatus = `检测到${allBasalt.length}个玄武岩，但距离太远`
            setTimeout(() => {
              if (this.running) this.gameStatus = '进行中'
            }, 2000)
          }
      } else {
        // 调试信息：检查是否有石英岩，但距离太远
        if (allQuartz.length > 0) {
          // 找到最近的石英岩并显示距离
          let nearestQuartz = null
          let nearestDistance = Infinity
          for (const quartz of allQuartz) {
            const quartzCenterX = quartz.x + quartz.w / 2
            const quartzCenterY = quartz.y + quartz.h / 2
            const distance = Math.sqrt(
              Math.pow(worldCrosshairX - quartzCenterX, 2) + 
              Math.pow(worldCrosshairY - quartzCenterY, 2)
            )
            if (distance < nearestDistance) {
              nearestQuartz = quartz
              nearestDistance = distance
            }
          }
          if (nearestQuartz) {
            this.gameStatus = `最近的石英岩距离：${Math.floor(nearestDistance)}px（需要${this.player.laserTool.miningRange}px内）位置：(${Math.floor(nearestQuartz.x)}, ${Math.floor(nearestQuartz.y)})`
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
            }, 3000)
          } else {
            this.gameStatus = `检测到${allQuartz.length}个石英岩，但距离太远`
            setTimeout(() => {
              if (this.running) this.gameStatus = '进行中'
            }, 2000)
          }
        } else {
          // 检查是否有陨石但没有石英岩
          if (allMeteors.length > 0) {
            this.gameStatus = `检测到${allMeteors.length}个陨石，但没有石英岩（石英岩概率5%）`
            setTimeout(() => {
              if (this.running) this.gameStatus = '进行中'
            }, 2000)
          } else {
            this.gameStatus = '附近没有可采集的资源（没有陨石）'
            setTimeout(() => {
              if (this.running) this.gameStatus = '进行中'
            }, 2000)
            }
          }
        }
      }
    },
    
    // 查找附近的玄武岩
    findNearbyBasalt(x, y) {
      let closestBasalt = null
      let closestDistance = Infinity
      
      for (const trap of this.traps) {
        if (trap.type === 'basalt') {
          // 检查点击位置是否在玄武岩范围内
          const basaltCenterX = trap.x + trap.w / 2
          const basaltCenterY = trap.y + trap.h / 2
          const distance = Math.sqrt(
            Math.pow(x - basaltCenterX, 2) + 
            Math.pow(y - basaltCenterY, 2)
          )
          
          // 找到最近的玄武岩（在挖取范围内）
          if (distance <= this.player.laserTool.miningRange && distance < closestDistance) {
            closestBasalt = trap
            closestDistance = distance
          }
        }
      }
      
      // 调试信息
      if (closestBasalt) {
        console.log('找到玄武岩', {
          距离: Math.floor(closestDistance),
          位置: { x: Math.floor(closestBasalt.x), y: Math.floor(closestBasalt.y) },
          准星位置: { x: Math.floor(x), y: Math.floor(y) },
          挖取范围: this.player.laserTool.miningRange
        })
      } else {
        const allBasalt = this.traps.filter(t => t.type === 'basalt')
        if (allBasalt.length > 0) {
          // 找到最近的玄武岩（即使不在范围内）
          let nearestBasalt = null
          let nearestDistance = Infinity
          for (const basalt of allBasalt) {
            const basaltCenterX = basalt.x + basalt.w / 2
            const basaltCenterY = basalt.y + basalt.h / 2
            const distance = Math.sqrt(
              Math.pow(x - basaltCenterX, 2) + 
              Math.pow(y - basaltCenterY, 2)
            )
            if (distance < nearestDistance) {
              nearestBasalt = basalt
              nearestDistance = distance
            }
          }
          if (nearestBasalt) {
            console.log('玄武岩距离太远', {
              最近距离: Math.floor(nearestDistance),
              需要距离: this.player.laserTool.miningRange,
              玄武岩位置: { x: Math.floor(nearestBasalt.x), y: Math.floor(nearestBasalt.y) },
              准星位置: { x: Math.floor(x), y: Math.floor(y) },
              总玄武岩数: allBasalt.length
            })
          }
        } else {
          console.log('未找到任何玄武岩', {
            总陷阱数: this.traps.length,
            准星位置: { x: Math.floor(x), y: Math.floor(y) }
          })
        }
      }
      
      return closestBasalt
    },
    
    // 查找附近的石英岩
    findNearbyQuartz(x, y) {
      let closestQuartz = null
      let closestDistance = Infinity
      
      for (const obstacle of this.obstacles) {
        if (obstacle.type === 'meteor' && obstacle.isQuartz) {
          // 计算距离（考虑石英岩的中心点）
          const quartzCenterX = obstacle.x + obstacle.w / 2
          const quartzCenterY = obstacle.y + obstacle.h / 2
          const distance = Math.sqrt(
            Math.pow(x - quartzCenterX, 2) + 
            Math.pow(y - quartzCenterY, 2)
          )
          
          // 找到最近的石英岩（在挖取范围内）
          if (distance <= this.player.laserTool.miningRange && distance < closestDistance) {
            closestQuartz = obstacle
            closestDistance = distance
          }
        }
      }
      
      return closestQuartz
    },
    
    // 开始激光挖取
    startLaserMining(basalt) {
      this.player.laserTool.isActive = true
      this.player.laserTool.targetBasalt = basalt
      this.player.laserTool.miningProgress = 0
      
      this.gameStatus = '挖取玄武岩中...'
    },
    
    // 开始激光挖取钛铁矿
    startLaserMiningIlmenite(ilmenite) {
      // 检查玩家与钛铁矿的距离
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      const ilmeniteCenterX = ilmenite.x + ilmenite.w / 2
      const ilmeniteCenterY = ilmenite.y + ilmenite.h / 2
      const distance = Math.sqrt(
        Math.pow(playerCenterX - ilmeniteCenterX, 2) + 
        Math.pow(playerCenterY - ilmeniteCenterY, 2)
      )
      
      if (distance > this.player.laserTool.miningRange) {
        this.gameStatus = `距离太远（${Math.floor(distance)}px），无法挖取（需要${this.player.laserTool.miningRange}px内）`
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 2000)
        return
      }
      
      // 检查是否为高级激光镐
      // 获取当前激活的采集工具
      let currentSlot = this.player.equipmentSlots.find(s => s.id === this.player.currentToolSlot && s.layer === 'tool')
      if (!currentSlot) {
        currentSlot = this.player.equipmentSlots[this.player.currentSlot - 1]
      }
      if (!currentSlot || currentSlot.name !== '高级激光镐') {
        this.gameStatus = '需要使用高级激光镐才能挖取钛铁矿！'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 2000)
        return
      }
      
      this.player.laserTool.isActive = true
      this.player.laserTool.targetIlmenite = ilmenite
      this.player.laserTool.targetQuartz = null // 清除石英岩目标
      this.player.laserTool.targetBasalt = null // 清除玄武岩目标
      this.player.laserTool.miningProgress = 0
      
      console.log('开始挖取钛铁矿', { 
        距离: Math.floor(distance), 
        钛铁矿位置: { x: Math.floor(ilmenite.x), y: Math.floor(ilmenite.y) },
        玩家位置: { x: Math.floor(this.player.x), y: Math.floor(this.player.y) }
      })
      
      this.gameStatus = '挖取钛铁矿中...（需要5秒，请保持距离）'
    },
    
    // 开始激光挖取石英岩
    startLaserMiningQuartz(quartz) {
      // 检查玩家与石英岩的距离
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      const quartzCenterX = quartz.x + quartz.w / 2
      const quartzCenterY = quartz.y + quartz.h / 2
      const distance = Math.sqrt(
        Math.pow(playerCenterX - quartzCenterX, 2) + 
        Math.pow(playerCenterY - quartzCenterY, 2)
      )
      
      if (distance > this.player.laserTool.miningRange) {
        this.gameStatus = `距离太远（${Math.floor(distance)}px），无法挖取（需要${this.player.laserTool.miningRange}px内）`
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 2000)
        return
      }
      
      this.player.laserTool.isActive = true
      this.player.laserTool.targetQuartz = quartz
      this.player.laserTool.targetBasalt = null // 清除玄武岩目标
      this.player.laserTool.miningProgress = 0
      
      console.log('开始挖取石英岩', { 
        距离: Math.floor(distance), 
        石英岩位置: { x: Math.floor(quartz.x), y: Math.floor(quartz.y) },
        玩家位置: { x: Math.floor(this.player.x), y: Math.floor(this.player.y) }
      })
      
      this.gameStatus = '挖取石英岩中...（需要3秒，请保持距离）'
    },
    
    // 停止激光挖取
    stopLaserMining() {
      this.player.laserTool.isActive = false
      this.player.laserTool.targetBasalt = null
      this.player.laserTool.targetQuartz = null // 清除石英岩目标
      this.player.laserTool.targetIlmenite = null // 清除钛铁矿目标
      this.player.laserTool.miningProgress = 0
      
      this.gameStatus = '进行中'
    },
    
    // 完成挖取
    completeMining() {
      // 处理钛铁矿挖取
      if (this.player.laserTool.targetIlmenite) {
        const ilmenite = this.player.laserTool.targetIlmenite
        
        // 消耗激光能量
        this.player.laserTool.energy -= 15 // 钛铁矿消耗更多能量
        
        // 获取钛铁矿位置信息
        const ilmeniteCenterX = ilmenite.x + ilmenite.w / 2
        const ilmeniteCenterY = ilmenite.y + ilmenite.h / 2
        
        // 标记为已挖取
        ilmenite.mined = true
        ilmenite.visible = false
        
        // 从可见列表中移除
        const visibleIndex = this.visibleIlmeniteOres.findIndex(ore => ore === ilmenite)
        if (visibleIndex !== -1) {
          this.visibleIlmeniteOres.splice(visibleIndex, 1)
        }
        
        // 从隐藏列表中移除
        const hiddenIndex = this.hiddenIlmeniteOres.findIndex(ore => ore === ilmenite)
        if (hiddenIndex !== -1) {
          this.hiddenIlmeniteOres.splice(hiddenIndex, 1)
        }
        
        // 生成钛铁矿掉落物 - 固定在地面上
        const drop = {
          name: '钛铁矿',
          type: 'ilmenite',
          value: 120, // 钛铁矿价值较高
          icon: '⛏️',
          x: ilmeniteCenterX - 15, // 掉落物中心位置
          y: this.groundY - 30, // 固定在地面上
          w: 30,
          h: 30,
          timestamp: Date.now(),
          collected: false,
          fixedOnGround: true // 标记为固定在地面上
        }
        
        this.player.drops.push(drop)
        
        console.log('钛铁矿已生成！', {
          掉落物位置: { x: drop.x, y: drop.y },
          钛铁矿原位置: { x: ilmeniteCenterX, y: ilmeniteCenterY },
          掉落物数量: this.player.drops.length
        })
        
        // 显示挖取成功消息
        this.gameStatus = '钛铁矿已采集！掉落物已生成'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 1500)
        
        // 停止挖取
        this.stopLaserMining()
        return
      }
      
      // 处理石英岩挖取
      if (this.player.laserTool.targetQuartz) {
        const quartz = this.player.laserTool.targetQuartz
        
        // 消耗激光能量
        this.player.laserTool.energy -= 10
        
        // 获取石英岩位置信息
        const quartzCenterX = quartz.x + quartz.w / 2
        const quartzCenterY = quartz.y + quartz.h / 2
        
        // 从obstacles数组中移除石英岩（让石英岩消失）
        const quartzIndex = this.obstacles.findIndex(ob => ob === quartz)
        if (quartzIndex !== -1) {
          this.obstacles.splice(quartzIndex, 1)
        }
        
        // 生成石英岩掉落物模块 - 生成在石英岩位置附近（不是地面）
        const drop = {
          name: '石英模块',
          type: 'quartz_module',
          value: 100, // 石英模块价值更高
          icon: '💎', // 使用钻石图标表示石英模块
          x: quartzCenterX - 15, // 掉落物中心位置（X坐标）
          y: quartzCenterY - 15, // 掉落物中心位置（Y坐标，在石英岩位置附近）
          w: 30,
          h: 30,
          timestamp: Date.now(),
          collected: false,
          fixedOnGround: false // 不固定在地面上，而是在空中
        }
        
        this.player.drops.push(drop)
        
        console.log('石英模块已生成！', {
          掉落物位置: { x: drop.x, y: drop.y },
          石英岩原位置: { x: quartzCenterX, y: quartzCenterY },
          掉落物数量: this.player.drops.length
        })
        
        // 显示挖取成功消息
        this.gameStatus = '石英岩已采集！掉落物已生成'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 1500)
        
        // 停止挖取
        this.stopLaserMining()
        return
      }
      
      // 处理玄武岩挖取（原有逻辑）
      if (!this.player.laserTool.targetBasalt) return
      
      // 消耗激光能量
      this.player.laserTool.energy -= 10
      
      // 获取玄武岩位置信息
      const basalt = this.player.laserTool.targetBasalt
      const basaltCenterX = basalt.x + basalt.w / 2
      const basaltCenterY = basalt.y + basalt.h / 2
      
      // 从traps数组中移除玄武岩（让玄武岩消失）
      const basaltIndex = this.traps.findIndex(trap => trap === basalt)
      if (basaltIndex !== -1) {
        this.traps.splice(basaltIndex, 1)
      }
      
      // 检查是否在风暴洋、澄海玄武岩地区内，有很小概率掉落废弃卫星的太阳能电池板
      const stormZone = this.stormOceanZone
      const isInStormZone = 
        basaltCenterX >= stormZone.x && 
        basaltCenterX <= stormZone.x + stormZone.width &&
        basaltCenterY >= stormZone.y && 
        basaltCenterY <= stormZone.y + stormZone.height
      
      // 如果在风暴洋、澄海玄武岩地区内，有30%的概率掉落废弃卫星的太阳能电池板
      if (isInStormZone && Math.random() < 0.30) {
        // 生成废弃卫星的太阳能电池板
        this.player.drops.push({
          name: '废弃卫星的太阳能电池板',
          type: 'satellite_solar_panel',
          value: 150, // 价值较高
          icon: '🔋',
          x: basaltCenterX - 15, // 掉落物中心位置
          y: this.groundY - 30, // 固定在地面上
          w: 30,
          h: 30,
          timestamp: Date.now(),
          collected: false,
          fixedOnGround: true // 标记为固定在地面上
        })
        
        console.log('获得稀有掉落物：废弃卫星的太阳能电池板！', {
          位置: { x: basaltCenterX, y: basaltCenterY }
        })
        
        // 显示挖取成功消息（特殊提示）
        this.gameStatus = '获得稀有物品：废弃卫星的太阳能电池板！'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 2000)
      } else {
      // 生成月球玄武岩掉落物 - 固定在地面上
      this.player.drops.push({
        name: '月球玄武岩',
        type: 'lunar_basalt',
        value: 50,
        icon: '🪨',
        x: basaltCenterX - 15, // 掉落物中心位置
        y: this.groundY - 30, // 固定在地面上
        w: 30,
        h: 30,
        timestamp: Date.now(),
        collected: false,
        fixedOnGround: true // 标记为固定在地面上
      })
      
      // 显示挖取成功消息
      this.gameStatus = '玄武岩已采集！掉落物已生成'
      setTimeout(() => {
        if (this.running) this.gameStatus = '进行中'
      }, 1500)
      }
      
      // 停止挖取
      this.stopLaserMining()
    },
    
    // 更新激光工具
    updateLaserTool(dt) {
      if (!this.player.laserTool.isActive) return
      
      // 检查玩家是否移动太远，自动停止挖取（处理钛铁矿）- 先检查距离
      if (this.player.laserTool.targetIlmenite) {
        const playerCenterX = this.player.x + this.player.w / 2
        const playerCenterY = this.player.y + this.player.h / 2
        const ilmeniteCenterX = this.player.laserTool.targetIlmenite.x + this.player.laserTool.targetIlmenite.w / 2
        const ilmeniteCenterY = this.player.laserTool.targetIlmenite.y + this.player.laserTool.targetIlmenite.h / 2
        
        const distance = Math.sqrt(
          Math.pow(playerCenterX - ilmeniteCenterX, 2) + 
          Math.pow(playerCenterY - ilmeniteCenterY, 2)
        )
        
        if (distance > this.player.laserTool.miningRange) {
          console.log('距离太远，钛铁矿挖取中断', { 距离: Math.floor(distance), 最大距离: this.player.laserTool.miningRange })
          this.stopLaserMining()
          this.gameStatus = `距离太远，挖取中断（距离：${Math.floor(distance)}px，需要${this.player.laserTool.miningRange}px内）`
          setTimeout(() => {
            if (this.running) this.gameStatus = '进行中'
          }, 2000)
          return
        }
        
        // 更新挖取进度
        this.player.laserTool.miningProgress += dt * 1000 // 转换为毫秒
        
        // 检查是否完成挖取（使用钛铁矿的挖取时间）
        if (this.player.laserTool.miningProgress >= this.player.laserTool.miningTimeIlmenite) {
          console.log('钛铁矿挖取完成！')
          this.completeMining()
        }
        return
      }
      
      // 检查玩家是否移动太远，自动停止挖取（处理石英岩）- 先检查距离
      if (this.player.laserTool.targetQuartz) {
        const playerCenterX = this.player.x + this.player.w / 2
        const playerCenterY = this.player.y + this.player.h / 2
        const quartzCenterX = this.player.laserTool.targetQuartz.x + this.player.laserTool.targetQuartz.w / 2
        const quartzCenterY = this.player.laserTool.targetQuartz.y + this.player.laserTool.targetQuartz.h / 2
        
        const distance = Math.sqrt(
          Math.pow(playerCenterX - quartzCenterX, 2) + 
          Math.pow(playerCenterY - quartzCenterY, 2)
        )
        
        // 调试信息：每0.5秒输出一次挖取状态
        if (Math.floor(this.player.laserTool.miningProgress / 500) !== Math.floor((this.player.laserTool.miningProgress - dt * 1000) / 500)) {
          console.log('石英岩挖取中...', {
            进度: Math.floor(this.player.laserTool.miningProgress) + 'ms',
            距离: Math.floor(distance) + 'px',
            目标距离: this.player.laserTool.miningRange + 'px'
          })
        }
        
        if (distance > this.player.laserTool.miningRange) {
          console.log('距离太远，挖取中断', { 距离: Math.floor(distance), 最大距离: this.player.laserTool.miningRange })
          this.stopLaserMining()
          this.gameStatus = `距离太远，挖取中断（距离：${Math.floor(distance)}px，需要${this.player.laserTool.miningRange}px内）`
          setTimeout(() => {
            if (this.running) this.gameStatus = '进行中'
          }, 2000)
          return
        }
      
      // 更新挖取进度
      this.player.laserTool.miningProgress += dt * 1000 // 转换为毫秒
      
      // 检查是否完成挖取
      if (this.player.laserTool.miningProgress >= this.player.laserTool.miningTime) {
          console.log('石英岩挖取完成！')
        this.completeMining()
        }
        return
      }
      
      // 检查玩家是否移动太远，自动停止挖取（处理玄武岩）- 先检查距离
      if (this.player.laserTool.targetBasalt) {
        const playerCenterX = this.player.x + this.player.w / 2
        const playerCenterY = this.player.y + this.player.h / 2
        const basaltCenterX = this.player.laserTool.targetBasalt.x + this.player.laserTool.targetBasalt.w / 2
        const basaltCenterY = this.player.laserTool.targetBasalt.y + this.player.laserTool.targetBasalt.h / 2
        
        const distance = Math.sqrt(
          Math.pow(playerCenterX - basaltCenterX, 2) + 
          Math.pow(playerCenterY - basaltCenterY, 2)
        )
        
        // 调试信息：每0.5秒输出一次挖取状态
        if (Math.floor(this.player.laserTool.miningProgress / 500) !== Math.floor((this.player.laserTool.miningProgress - dt * 1000) / 500)) {
          console.log('玄武岩挖取中...', {
            进度: Math.floor(this.player.laserTool.miningProgress) + 'ms',
            距离: Math.floor(distance) + 'px',
            目标距离: this.player.laserTool.miningRange + 'px'
          })
        }
        
        if (distance > this.player.laserTool.miningRange) {
          console.log('距离太远，挖取中断', { 距离: Math.floor(distance), 最大距离: this.player.laserTool.miningRange })
          this.stopLaserMining()
          this.gameStatus = `距离太远，挖取中断（距离：${Math.floor(distance)}px，需要${this.player.laserTool.miningRange}px内）`
          setTimeout(() => {
            if (this.running) this.gameStatus = '进行中'
          }, 2000)
          return
        }
        
        // 更新挖取进度
        this.player.laserTool.miningProgress += dt * 1000 // 转换为毫秒
        
        // 检查是否完成挖取
        if (this.player.laserTool.miningProgress >= this.player.laserTool.miningTime) {
          console.log('玄武岩挖取完成！')
          this.completeMining()
        }
        return
      }
    },
    
    // 新增方法：更新掉落物系统
    updateDrops(dt) {
      const time = performance.now() / 1000
      
      // 检查玩家与掉落物的碰撞
      for (let i = this.player.drops.length - 1; i >= 0; i--) {
        const drop = this.player.drops[i]
        
        // 跳过已收集的掉落物
        if (drop.collected) continue
        
        // 特殊处理：无尽能源掉落物的漂浮动画
        if (drop.isInfiniteEnergy || drop.type === 'infinite_energy' || drop.name === '无尽能源') {
          // 初始化漂浮相关属性
          if (drop.floatPhase === undefined) {
            drop.floatPhase = Math.random() * Math.PI * 2 // 随机初始相位
            drop.baseY = drop.y // 记录基础Y位置
          }
          
          // 漂浮动画（上下浮动）
          drop.floatPhase += dt * 2 // 漂浮速度
          const floatOffset = Math.sin(drop.floatPhase) * 15 // 浮动幅度15像素
          drop.y = drop.baseY + floatOffset
          
          // 旋转动画（可选）
          if (drop.rotation === undefined) {
            drop.rotation = 0
          }
          drop.rotation += dt * 0.5 // 缓慢旋转
        }
        
        // 检查碰撞
        if (this.rectsCollide(this.player, drop)) {
          // 捡取掉落物
          this.collectDrop(drop, i)
        }
      }
    },
    
    // 新增方法：捡取掉落物
    collectDrop(drop, index) {
      // 标记为已收集
      drop.collected = true
      
      // 特殊处理：无尽能源直接保存到工作台资源，不放入背包
      if (drop.type === 'infinite_energy' || drop.name === '无尽能源') {
        try {
          const saved = localStorage.getItem('delta-action-game')
          const data = saved ? JSON.parse(saved) : {}
          data.workbenchResources = data.workbenchResources || {}
          const oldCount = data.workbenchResources['无尽能源'] || 0
          data.workbenchResources['无尽能源'] = oldCount + 1
          localStorage.setItem('delta-action-game', JSON.stringify(data))
          
          this.gameStatus = `⚡ 获得无尽能源！已自动存入资源储藏库（当前：${oldCount + 1}）`
          console.log('✅ 无尽能源已收集并保存:', {
            之前数量: oldCount,
            现在数量: oldCount + 1
          })
        } catch (e) {
          console.error('❌ 保存无尽能源失败:', e)
          this.gameStatus = '⚠️ 获得无尽能源，但保存失败！'
        }
        
        // 从掉落物数组中移除
        setTimeout(() => {
          const dropIndex = this.player.drops.findIndex(d => d === drop)
          if (dropIndex !== -1) {
            this.player.drops.splice(dropIndex, 1)
          }
        }, 500)
        
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 3000)
        return
      }
      
      // 普通资源的处理逻辑
      // 优先查找已有相同资源的格子
      let targetSlot = this.player.energySlots.find(slot => 
        slot.resource && slot.resource.type === drop.type
      )
      
      // 如果没有找到相同资源的格子，查找空格子
      if (!targetSlot) {
        targetSlot = this.player.energySlots.find(slot => slot.resource === null)
      }
      
      // 如果找到了目标格子
      if (targetSlot) {
        if (targetSlot.resource === null) {
          // 格子为空，放入资源
          targetSlot.resource = {
            name: drop.name,
            type: drop.type,
            value: drop.value,
            icon: drop.icon
          }
          targetSlot.count = 1
          targetSlot.icon = drop.icon // 更新格子图标为资源图标
          
          // 显示捡取消息（钛铁矿、飞船零件和水冰有特殊提示）
          if (drop.name === '飞船零件' || drop.name === '钛铁矿' || drop.name === '月球水冰') {
            this.gameStatus = `${drop.icon} 获得${drop.name}！返回基地后将自动存入资源储藏库`
        } else {
            this.gameStatus = `资源已放入：${targetSlot.name}`
          }
        } else {
          // 格子已经有相同资源，增加数量
          if (targetSlot.resource.type === drop.type) {
            targetSlot.count += 1
            
            // 显示捡取消息（钛铁矿、飞船零件和水冰有特殊提示）
            if (drop.name === '飞船零件' || drop.name === '钛铁矿' || drop.name === '月球水冰') {
              this.gameStatus = `${drop.icon} 获得${drop.name} (${targetSlot.count})！返回基地后将自动存入资源储藏库`
          } else {
              this.gameStatus = `资源已叠加：${targetSlot.name} (${targetSlot.count})`
            }
          } else {
            // 这种情况理论上不会发生（因为我们已经检查了相同资源）
            this.gameStatus = `格子已有其他资源，请切换能源格子`
          }
        }
      } else {
        // 所有格子都已满且没有相同资源
        this.gameStatus = `资源存储已满！请先使用或丢弃部分资源`
      }
      
      setTimeout(() => {
        if (this.running) this.gameStatus = '进行中'
      }, 2000)
      
      // 从掉落物数组中移除（延迟移除以便显示动画）
      setTimeout(() => {
        const dropIndex = this.player.drops.findIndex(d => d === drop)
        if (dropIndex !== -1) {
          this.player.drops.splice(dropIndex, 1)
        }
      }, 500)
    },
    
    // 新增方法：检查玩家是否在阴影区
    isPlayerInShadowZone() {
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      
      for (const zone of this.shadowZones) {
        if (playerCenterX >= zone.x && 
            playerCenterX <= zone.x + zone.width &&
            playerCenterY >= zone.y && 
            playerCenterY <= zone.y + zone.height) {
          return true
        }
      }
      return false
    },
    // 检查指定点是否在阴影区
    isPointInShadowZone(x, y) {
      for (const zone of this.shadowZones) {
        if (x >= zone.x && 
            x <= zone.x + zone.width &&
            y >= zone.y && 
            y <= zone.y + zone.height) {
          return true
        }
      }
      return false
    },
    
    // 新增方法：部署钻探机
    deployDrillMachine(worldX, worldY) {
      console.log('🔧 部署钻探机检查:', {
        worldX: Math.floor(worldX),
        worldY: Math.floor(worldY),
        playerX: Math.floor(this.player.x),
        playerY: Math.floor(this.player.y),
        energy: this.drillMachine.energy,
        deployed: this.drillMachine.deployed
      })
      
      // 检查是否在阴影区（使用点击位置而不是玩家位置）
      const isInShadowZone = this.isPointInShadowZone(worldX, worldY)
      console.log('🔧 是否在阴影区:', isInShadowZone, '阴影区列表:', this.shadowZones.map(z => ({
        name: z.name,
        x: z.x,
        y: z.y,
        width: z.width,
        height: z.height,
        xRange: `${z.x} 到 ${z.x + z.width}`,
        yRange: `${z.y} 到 ${z.y + z.height}`
      })))
      
      if (!isInShadowZone) {
        // 提供更详细的提示信息
        const nearestZone = this.shadowZones.reduce((nearest, zone) => {
          const zoneCenterX = zone.x + zone.width / 2
          const zoneCenterY = zone.y + zone.height / 2
          const dist = Math.sqrt(
            Math.pow(worldX - zoneCenterX, 2) + Math.pow(worldY - zoneCenterY, 2)
          )
          if (!nearest || dist < nearest.dist) {
            return { zone, dist }
          }
          return nearest
        }, null)
        
        let hint = '只能在永久阴影区部署钻探机！'
        if (nearestZone) {
          hint += `\n最近的阴影区：${nearestZone.zone.name}（X: ${nearestZone.zone.x} 到 ${nearestZone.zone.x + nearestZone.zone.width}，Y: ${nearestZone.zone.y} 到 ${nearestZone.zone.y + nearestZone.zone.height}）`
        }
        hint += `\n当前点击位置：X=${Math.floor(worldX)}, Y=${Math.floor(worldY)}`
        
        this.gameStatus = hint
        console.warn('⚠️ 部署失败：不在阴影区', {
          点击位置: { x: worldX, y: worldY },
          最近阴影区: nearestZone?.zone,
          距离: nearestZone?.dist
        })
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 4000)
        return
      }
      
      // 检查是否已经部署
      if (this.drillMachine.deployed) {
        this.gameStatus = '钻探机已经部署！点击已部署的钻探机可以收回'
        console.warn('⚠️ 部署失败：已经部署')
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 2000)
        return
      }
      
      // 检查是否拥有钻探机
      const saved = localStorage.getItem('delta-action-game')
      let hasDrillMachine = false
      if (saved) {
        try {
          const data = JSON.parse(saved)
          const ownedTools = data.ownedTools || {}
          hasDrillMachine = !!ownedTools['钻探机']
          console.log('🔧 是否拥有钻探机:', hasDrillMachine, 'ownedTools:', ownedTools)
          
          if (!hasDrillMachine) {
            this.gameStatus = '您还没有钻探机！请先在工作台合成'
            console.warn('⚠️ 部署失败：没有钻探机')
            setTimeout(() => {
              if (this.running) this.gameStatus = '进行中'
            }, 2000)
            return
          }
        } catch (e) {
          console.error('检查钻探机失败:', e)
        }
      } else {
        console.warn('⚠️ 无法读取localStorage')
      }
      
      // 检查钻探机能量是否足够（至少需要1点能量才能部署）
      if (this.drillMachine.energy <= 0) {
        this.gameStatus = '❌ 部署失败！钻探机能量不足，请先在基地充能'
        console.warn('⚠️ 部署失败：能量不足', this.drillMachine.energy)
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 3000)
        return
      }
      
      // 部署钻探机（部署时不需要装备冷凝模块，但激活时需要）
      this.drillMachine.deployed = true
      this.drillMachine.activated = false // 部署后未激活
      this.drillMachine.x = worldX
      this.drillMachine.y = worldY
      this.drillMachine.lastExtractTime = performance.now()
      this.drillMachine.lastEnergyConsumeTime = performance.now()
      this.drillMachine.hasCondensationModule = false
      
      this.gameStatus = '✅ 钻探机已部署！请装备冷凝模块并点击钻探机激活'
      
      setTimeout(() => {
        if (this.running) this.gameStatus = '进行中'
      }, 3000)
    },
    
    // 新增方法：激活钻探机（需要装备冷凝模块并点击）
    activateDrillMachine() {
      if (!this.drillMachine.deployed) {
        this.gameStatus = '请先部署钻探机！'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 2000)
        return
      }
      
      if (this.drillMachine.activated) {
        this.gameStatus = '钻探机已经激活！'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 2000)
        return
      }
      
      // 检查是否装备了冷凝模块
      const hasCondensationModule = this.player.equipmentSlots.some(
        slot => slot.name === '冷凝模块'
      )
      
      if (!hasCondensationModule) {
        this.gameStatus = '❌ 激活失败！请先装备冷凝模块'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 3000)
        return
      }
      
      // 检查能量是否足够
      if (this.drillMachine.energy <= 0) {
        this.gameStatus = '❌ 激活失败！钻探机能量不足，请先在基地充能'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 3000)
        return
      }
      
      // 激活钻探机
      this.drillMachine.activated = true
      this.drillMachine.hasCondensationModule = true
      this.drillMachine.lastExtractTime = performance.now()
      this.drillMachine.lastEnergyConsumeTime = performance.now()
      
      this.gameStatus = '✅ 钻探机已激活！冷凝模块已连接，开始提取水冰...'
      
      setTimeout(() => {
        if (this.running) this.gameStatus = '进行中'
      }, 3000)
    },
    
    // 新增方法：收回钻探机
    retrieveDrillMachine() {
      if (!this.drillMachine.deployed) {
        this.gameStatus = '没有部署的钻探机！'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 2000)
        return
      }
      
      // 收回钻探机
      this.drillMachine.deployed = false
      this.drillMachine.activated = false
      this.drillMachine.x = 0
      this.drillMachine.y = 0
      this.drillMachine.lastExtractTime = 0
      this.drillMachine.lastEnergyConsumeTime = 0
      this.drillMachine.hasCondensationModule = false
      this.drillMachine.waterIceDrops = []
      this.drillMachine.lastWarningTime = 0
      
      this.gameStatus = '✅ 钻探机已收回！'
      setTimeout(() => {
        if (this.running) this.gameStatus = '进行中'
      }, 2000)
    },
    
    // 新增方法：更新钻探机系统
    updateDrillMachine(dt) {
      if (!this.drillMachine.deployed || !this.drillMachine.activated) return
      
      const now = performance.now()
      
      // 检查是否装备了冷凝模块
      const hasCondensationModule = this.player.equipmentSlots.some(
        slot => slot.name === '冷凝模块'
      )
      this.drillMachine.hasCondensationModule = hasCondensationModule
      
      // 如果没有冷凝模块，停止工作并提示
      if (!hasCondensationModule) {
        // 每5秒提示一次需要装备冷凝模块
        if (now - (this.drillMachine.lastWarningTime || 0) >= 5000) {
          this.gameStatus = '⚠️ 钻探机已停止工作！请装备冷凝模块以继续提取水冰'
          this.drillMachine.lastWarningTime = now
          setTimeout(() => {
            if (this.running && !this.drillMachine.hasCondensationModule) {
              this.gameStatus = '进行中'
            }
          }, 3000)
        }
        return
      }
      
      // 清除警告时间（因为已经装备了冷凝模块）
      this.drillMachine.lastWarningTime = 0
      
      // 检查能量是否足够
      if (this.drillMachine.energy <= 0) {
        // 能量耗尽，停止工作
        if (now - (this.drillMachine.lastWarningTime || 0) >= 5000) {
          this.gameStatus = '⚠️ 钻探机能量已耗尽！请返回基地充能'
          this.drillMachine.lastWarningTime = now
          setTimeout(() => {
            if (this.running && this.drillMachine.energy <= 0) {
              this.gameStatus = '进行中'
            }
          }, 3000)
        }
        return
      }
      
      // 每秒消耗1单位能源
      if (now - this.drillMachine.lastEnergyConsumeTime >= 1000) {
        this.drillMachine.energy = Math.max(0, this.drillMachine.energy - this.drillMachine.energyConsumption)
        this.drillMachine.lastEnergyConsumeTime = now
        
        // 保存能量状态到localStorage
        this.saveDrillMachineEnergy()
        
        // 如果能量耗尽，停止工作
        if (this.drillMachine.energy <= 0) {
          this.gameStatus = '⚠️ 钻探机能量已耗尽！已停止工作'
          setTimeout(() => {
            if (this.running) this.gameStatus = '进行中'
          }, 3000)
          return
        }
      }
      
      // 每10秒提取2单位水冰
      if (now - this.drillMachine.lastExtractTime >= this.drillMachine.extractInterval) {
        // 生成水冰掉落物（确保生成在地面上方，Y < 0）
        for (let i = 0; i < this.drillMachine.extractAmount; i++) {
          const dropX = this.drillMachine.x + (Math.random() - 0.5) * 100
          // 确保掉落物生成在地面上方（groundY = 0，地面上方是Y < 0）
          // 生成在地面附近，Y坐标在-50到-20之间（地面上方20-50像素）
          const dropY = this.groundY - (20 + Math.random() * 30) // -20到-50之间
          
          this.player.drops.push({
            x: dropX,
            y: dropY,
            w: 30,
            h: 30,
            vx: 0,
            vy: 0,
            type: 'waterIce',
            name: '月球水冰',
            icon: '🧊',
            value: 1,
            collected: false
          })
        }
        
        this.drillMachine.lastExtractTime = now
        this.gameStatus = `💧 钻探机提取了${this.drillMachine.extractAmount}单位水冰！`
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 2000)
      }
    },
    
    // 新增方法：绘制钻探机
    drawDrillMachine(ctx) {
      if (!this.drillMachine.deployed) return
      
      const x = this.drillMachine.x
      const y = this.drillMachine.y
      
      // 绘制钻探机主体
      ctx.fillStyle = '#4a4a4a'
      ctx.fillRect(x - 20, y - 30, 40, 60)
      
      // 绘制钻探机边框
      ctx.strokeStyle = '#666'
      ctx.lineWidth = 2
      ctx.strokeRect(x - 20, y - 30, 40, 60)
      
      // 绘制钻探机图标
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🛠️', x, y)
      
      // 显示激活状态指示器
      if (this.drillMachine.activated) {
        // 已激活，显示工作状态
        if (this.drillMachine.hasCondensationModule) {
          const time = performance.now()
          const pulse = Math.sin(time * 0.005) * 0.3 + 0.7
          
          // 工作指示器（蓝色闪烁）
          ctx.fillStyle = `rgba(100, 200, 255, ${0.5 * pulse})`
          ctx.beginPath()
          ctx.arc(x, y - 40, 8, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // 已激活但未装备冷凝模块，显示警告（红色）
          ctx.fillStyle = 'rgba(255, 100, 100, 0.8)'
          ctx.beginPath()
          ctx.arc(x, y - 40, 8, 0, Math.PI * 2)
          ctx.fill()
        }
      } else {
        // 未激活，显示待激活状态（黄色）
        ctx.fillStyle = 'rgba(255, 200, 100, 0.8)'
        ctx.beginPath()
        ctx.arc(x, y - 40, 8, 0, Math.PI * 2)
        ctx.fill()
      }
      
      // 绘制状态标签
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(x - 50, y - 60, 100, 20)
      ctx.fillStyle = '#fff'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('钻探机', x, y - 48)
      
      // 绘制能量条
      const energyPercentage = (this.drillMachine.energy / this.drillMachine.maxEnergy) * 100
      const energyBarWidth = 80
      const energyBarHeight = 6
      const energyBarX = x - energyBarWidth / 2
      const energyBarY = y - 75
      
      // 能量条背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(energyBarX, energyBarY, energyBarWidth, energyBarHeight)
      
      // 能量条前景（根据能量百分比显示颜色）
      let energyColor = '#0f0' // 绿色（高能量）
      if (energyPercentage < 30) {
        energyColor = '#f00' // 红色（低能量）
      } else if (energyPercentage < 60) {
        energyColor = '#ff0' // 黄色（中等能量）
      }
      
      ctx.fillStyle = energyColor
      ctx.fillRect(energyBarX, energyBarY, energyBarWidth * (energyPercentage / 100), energyBarHeight)
      
      // 能量条边框
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.strokeRect(energyBarX, energyBarY, energyBarWidth, energyBarHeight)
      
      // 显示能量数值
      ctx.fillStyle = '#fff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${Math.floor(this.drillMachine.energy)} / ${this.drillMachine.maxEnergy}`, x, y - 80)
      
      // 显示状态提示
      if (!this.drillMachine.activated) {
        // 未激活，提示激活
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(x - 70, y + 35, 140, 18)
        ctx.fillStyle = '#ffa500'
        ctx.font = '10px Arial'
        ctx.fillText('装备冷凝模块点击激活', x, y + 47)
      } else if (this.drillMachine.energy <= 0) {
        // 已激活但能量耗尽
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(x - 60, y + 35, 120, 18)
        ctx.fillStyle = '#f00'
        ctx.font = '10px Arial'
        ctx.fillText('能量耗尽', x, y + 47)
      } else if (this.drillMachine.hasCondensationModule) {
        // 已激活且正常工作，显示"点击收回"
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(x - 60, y + 35, 120, 18)
        ctx.fillStyle = '#0f0'
        ctx.font = '10px Arial'
        ctx.fillText('点击收回', x, y + 47)
      } else {
        // 已激活但未装备冷凝模块
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(x - 60, y + 35, 120, 18)
        ctx.fillStyle = '#f00'
        ctx.font = '10px Arial'
        ctx.fillText('需装备冷凝模块', x, y + 47)
      }
    },
    
    // 新增方法：保存钻探机能量状态
    saveDrillMachineEnergy() {
      const saved = localStorage.getItem('delta-action-game');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          data.drillMachineEnergy = this.drillMachine.energy;
          localStorage.setItem('delta-action-game', JSON.stringify(data));
        } catch (e) {
          console.error('保存钻探机能量失败:', e);
        }
      }
    },
    
    // 新增方法：添加资源到背包
    addResourceToBackpack(resourceName, resourceType, resourceIcon, count) {
      let remainingCount = count
      
      // 首先尝试在已有相同资源的格子里叠加
      for (let slot of this.player.energySlots) {
        if (slot.resource && slot.resource.type === resourceType) {
          slot.count += remainingCount
          remainingCount = 0
          break
        }
      }
      
      // 如果还有剩余，尝试放入空格子
      if (remainingCount > 0) {
        for (let slot of this.player.energySlots) {
          if (slot.resource === null) {
            slot.resource = {
              name: resourceName,
              type: resourceType,
              value: 0,
              icon: resourceIcon
            }
            slot.count = remainingCount
            slot.icon = resourceIcon
            remainingCount = 0
            break
          }
        }
      }
      
      // 如果还有剩余（背包已满），在控制台输出警告
      if (remainingCount > 0) {
        console.warn(`背包已满，无法添加 ${remainingCount} 个 ${resourceName}`)
      }
    },
    
    fireBullet(e) {
      const weapon = this.player.currentWeapon
      if (!weapon) {
        console.warn('没有装备武器！')
        return
      }
      const ammoType = weapon.type
      
      // 检查子弹数量
      if (!this.player.ammo[ammoType] || this.player.ammo[ammoType] <= 0) {
        this.gameStatus = '没有子弹！'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 1000)
        // 自动停止连射
        if (this.rapidFireInterval) {
          clearInterval(this.rapidFireInterval)
          this.rapidFireInterval = null
          this.input.rapidFire = false
        }
        return
      }
      
      // 检查电击子弹的特殊效果
      if (ammoType === 'electric' && this.player.ammo.electric > 0) {
        // 电击子弹有特殊效果：可以穿透多个怪物
        this.handleElectricBullet(e)
        return
      }
      
      // 使用准星位置（屏幕坐标）来计算射击方向
      const crosshairX = this.crosshair.x
      const crosshairY = this.crosshair.y
      
      // 将准星位置转换为世界坐标（考虑视口偏移）
      const worldCrosshairX = crosshairX - this.viewportOffset.x
      const worldCrosshairY = crosshairY - this.viewportOffset.y
      
      // 检查是否点击到了怪物（使用世界坐标）
      let hitMonster = false
      for (let i = this.monsters.length - 1; i >= 0; i--) {
        const monster = this.monsters[i]
        if (worldCrosshairX >= monster.x && worldCrosshairX <= monster.x + monster.w &&
            worldCrosshairY >= monster.y && worldCrosshairY <= monster.y + monster.h) {
          
          // 消耗子弹
          this.player.ammo[ammoType]--
          
          // 对怪物造成伤害
          monster.hp -= weapon.damage
          
          // 显示伤害效果（使用世界坐标）
          this.showDamageEffect(monster.x + monster.w/2, monster.y + monster.h/2, weapon.damage)
          
          // 检查怪物是否死亡
          if (monster.hp <= 0) {
            this.kills++
            this.money += monster.value
            
            // 怪物掉落物品（已移除宝物掉落）
            if (Math.random() < 0.5) {
              // 掉落子弹（电击子弹）
              this.items.push({
                type: 'ammo',
                x: monster.x,
                y: monster.y,
                w: 15,
                h: 10,
                ammoType: 'electric',
                count: 5,
                color: '#00ffff'
              })
            }
            
            this.monsters.splice(i, 1)
          }
          
          hitMonster = true
          break
        }
      }
      
      // 如果没有点击到怪物，则发射子弹
      if (!hitMonster) {
        // 消耗子弹
        this.player.ammo[ammoType]--
        
        // 计算射击方向向量（使用准星位置，转换为世界坐标）
        const playerCenterX = this.player.x + this.player.w / 2
        const playerCenterY = this.player.y + this.player.h / 2
        
        const dx = worldCrosshairX - playerCenterX
        const dy = worldCrosshairY - playerCenterY
        const length = Math.sqrt(dx * dx + dy * dy)
        
        // 如果长度为0，使用默认方向
        if (length === 0) {
          this.player.facingRight = true
          return
        }
        
        // 归一化方向向量
        const dirX = dx / length
        const dirY = dy / length
        
        // 创建子弹 - 黑色系风格
        this.bullets.push({
          x: playerCenterX,
          y: playerCenterY,
          w: 12, // 增加宽度，更容易看清
          h: 6,  // 增加高度，更容易看清
          vx: dirX * 800,
          vy: dirY * 800,
          damage: weapon.damage,
          color: '#111111' // 黑色系颜色
        })
        
        // 更新玩家朝向
        this.player.facingRight = dirX > 0
        
        // 移除后坐力效果
      }
    },
    
    // 新增方法：显示伤害效果
    showDamageEffect(x, y, damage) {
      // 创建临时伤害文本效果
      const damageText = {
        x: x,
        y: y,
        text: `-${damage}`,
        color: '#ff0000',
        alpha: 1,
        vy: -50
      }
      
      // 添加到临时效果数组
      if (!this.damageEffects) this.damageEffects = []
      this.damageEffects.push(damageText)
      
      // 设置定时器移除效果
      setTimeout(() => {
        if (this.damageEffects) {
          const index = this.damageEffects.indexOf(damageText)
          if (index > -1) {
            this.damageEffects.splice(index, 1)
          }
        }
      }, 1000)
    },
    
    // 创建冲刺视觉效果
    createDashEffect(x, y, dirX, dirY) {
      if (!this.dashEffects) this.dashEffects = []
      
      // 创建冲刺粒子效果
      for (let i = 0; i < 15; i++) {
        const angle = Math.atan2(dirY, dirX) + (Math.random() - 0.5) * 0.5
        const speed = 100 + Math.random() * 150
        this.dashEffects.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 4,
          alpha: 1,
          lifetime: 0.3 + Math.random() * 0.2,
          color: `hsl(${200 + Math.random() * 40}, 80%, 60%)` // 蓝色到青色
        })
      }
    },
    
    // 更新冲刺视觉效果
    updateDashEffects(dt) {
      if (!this.dashEffects) return
      
      for (let i = this.dashEffects.length - 1; i >= 0; i--) {
        const effect = this.dashEffects[i]
        
        // 更新位置
        effect.x += effect.vx * dt
        effect.y += effect.vy * dt
        
        // 更新生命周期和透明度
        effect.lifetime -= dt
        effect.alpha = Math.max(0, effect.lifetime / 0.3)
        
        // 应用摩擦力
        effect.vx *= 0.95
        effect.vy *= 0.95
        
        // 移除过期的效果
        if (effect.lifetime <= 0 || effect.alpha <= 0) {
          this.dashEffects.splice(i, 1)
        }
      }
    },
    
    // 更新电击枪连发系统
    updateElectricGunRapidFire(dt) {
      const gun = this.electricGun
      const now = performance.now()
      
      // 清理过期的点击记录（超过1秒）
      gun.clickHistory = gun.clickHistory.filter(time => now - time < 1000)
    },
    
    // 新增方法：处理电击子弹 - 朝向准星方向（支持连发）
    handleElectricBullet(e) {
      const now = performance.now()
      const gun = this.electricGun
      
      // 记录点击时间
      gun.clickHistory.push(now)
      // 只保留最近1秒内的点击记录
      gun.clickHistory = gun.clickHistory.filter(time => now - time < 1000)
      
      // 计算点击速度（每秒点击次数）
      const clickSpeed = gun.clickHistory.length
      
      // 根据点击速度调整连发奖励（点击越快，冷却时间越短）
      // 每10次/秒点击，减少10ms冷却时间，最多减少到最小冷却时间
      const rapidFireReduction = Math.min(150, (clickSpeed - 1) * 10)
      const currentCooldown = Math.max(gun.minFireCooldown, gun.fireCooldown - rapidFireReduction)
      
      // 检查是否可以射击（冷却时间）
      if (now - gun.lastFireTime < currentCooldown) {
        return // 冷却中，无法射击
      }
      
      // 更新射击时间
      gun.lastFireTime = now
      
      // 消耗电击子弹
      this.player.ammo.electric--
      
      // 使用准星位置（屏幕坐标）来计算射击方向
      const crosshairX = this.crosshair.x
      const crosshairY = this.crosshair.y
      
      // 将准星位置转换为世界坐标（考虑视口偏移）
      const worldCrosshairX = crosshairX - this.viewportOffset.x
      const worldCrosshairY = crosshairY - this.viewportOffset.y
      
      // 计算射击方向向量（使用准星位置）
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      
      const dx = worldCrosshairX - playerCenterX
      const dy = worldCrosshairY - playerCenterY
      const length = Math.sqrt(dx * dx + dy * dy)
      
      // 如果长度为0，使用默认方向
      if (length === 0) {
        return
      }
      
      // 归一化方向向量
      const dirX = dx / length
      const dirY = dy / length
      
      // 创建电击子弹（增强视觉效果，更像真实的子弹）
      this.bullets.push({
        x: playerCenterX,
        y: playerCenterY,
        w: 14,
        h: 14,
        vx: dirX * 1200, // 增加子弹速度，使其更快
        vy: dirY * 1200,
        color: '#00ffff', // 电击特效颜色
        type: 'electric', // 标记为电击子弹
        damage: 15,
        alpha: 1,
        glowIntensity: 1, // 发光强度（用于动画）
        rotation: Math.atan2(dirY, dirX), // 子弹旋转角度
        trail: [] // 尾迹效果数组
      })
      
      // 更新玩家朝向
      this.player.facingRight = dirX > 0
      
      // 注意：电击子弹的碰撞检测在 updateBullets 方法中处理
      // 这样子弹可以正常飞行并显示视觉效果
    },
    
    // 新增方法：显示电击特效
    showElectricEffect(x, y) {
      const electricEffect = {
        x: x,
        y: y,
        radius: 20,
        color: '#00ffff',
        alpha: 1,
        maxRadius: 40
      }
      
      if (!this.electricEffects) this.electricEffects = []
      this.electricEffects.push(electricEffect)
      
      // 设置定时器移除效果
      setTimeout(() => {
        if (this.electricEffects) {
          const index = this.electricEffects.indexOf(electricEffect)
          if (index > -1) {
            this.electricEffects.splice(index, 1)
          }
        }
      }, 500)
    },
    
    // 新增方法：激活光子盾牌
    activatePhotonShield() {
      // 检查能量是否足够（每次激活消耗1点能量）
      if (this.photonShield.energy < 1) {
        this.gameStatus = '光子盾牌能量不足！'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 1000)
        return
      }
      
      // 检查使用次数是否达到上限
      if (this.photonShield.uses >= this.photonShield.maxUses) {
        this.gameStatus = '光子盾牌使用次数已达上限！'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 1000)
        return
      }
      
      // 激活光子盾牌
      this.photonShield.active = true
      this.photonShield.activeTime = performance.now()
      // 消耗1点能量（每次激活消耗1点能量）
      this.photonShield.energy -= 1 
      this.photonShield.uses++ // 增加使用次数
      
      // 计算盾牌位置和角度（朝向准星方向）
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      
      // 将准星位置转换为世界坐标（考虑视口偏移）
      const worldCrosshairX = this.crosshair.x - this.viewportOffset.x
      const worldCrosshairY = this.crosshair.y - this.viewportOffset.y
      
      // 计算准星方向的角度（使用世界坐标）
      const dx = worldCrosshairX - playerCenterX
      const dy = worldCrosshairY - playerCenterY
      // 如果距离为0，使用默认角度
      if (dx === 0 && dy === 0) {
        this.photonShield.angle = 0
      } else {
      this.photonShield.angle = Math.atan2(dy, dx)
      }
      
      // 设置盾牌位置（在玩家前方一定距离）
      const distanceFromPlayer = 40
      this.photonShield.x = playerCenterX + Math.cos(this.photonShield.angle) * distanceFromPlayer - this.photonShield.width / 2
      this.photonShield.y = playerCenterY + Math.sin(this.photonShield.angle) * distanceFromPlayer - this.photonShield.height / 2
      
      // 显示激活提示
      this.gameStatus = '光子盾牌激活！'
      setTimeout(() => {
        if (this.running) this.gameStatus = '进行中'
        }, 1000)
      
      // 添加盾牌激活特效
      this.showShieldEffect(playerCenterX, playerCenterY)
    },
    
    // 新增方法：显示盾牌激活特效
    showShieldEffect(x, y) {
      const shieldEffect = {
        x: x,
        y: y,
        radius: 60,
        color: '#00bcd4',
        alpha: 1,
        maxRadius: 100,
        startTime: performance.now()
      }
      
      if (!this.shieldEffects) this.shieldEffects = []
      this.shieldEffects.push(shieldEffect)
      
      // 设置定时器移除效果
      setTimeout(() => {
        if (this.shieldEffects) {
          const index = this.shieldEffects.indexOf(shieldEffect)
          if (index > -1) {
            this.shieldEffects.splice(index, 1)
          }
        }
      }, 300)
    },
    
    // 新增方法：更新光子盾牌状态
    updatePhotonShield(dt) {
      // 检查盾牌是否激活
      if (this.photonShield.active) {
        const currentTime = performance.now()
        const elapsedTime = (currentTime - this.photonShield.activeTime) / 1000
        
        // 检查持续时间是否结束
        if (elapsedTime >= this.photonShield.duration) {
          this.photonShield.active = false
          return
        }
        
        // 更新盾牌位置（跟随玩家移动）
        const playerCenterX = this.player.x + this.player.w / 2
        const playerCenterY = this.player.y + this.player.h / 2
        const distanceFromPlayer = 40
        
        // 更新盾牌角度和位置（朝向准星方向）
        const worldCrosshairX = this.crosshair.x - this.viewportOffset.x
        const worldCrosshairY = this.crosshair.y - this.viewportOffset.y
        const dx = worldCrosshairX - playerCenterX
        const dy = worldCrosshairY - playerCenterY
        // 如果距离为0，保持当前角度
        if (dx !== 0 || dy !== 0) {
          this.photonShield.angle = Math.atan2(dy, dx)
        }
        
        this.photonShield.x = playerCenterX + Math.cos(this.photonShield.angle) * distanceFromPlayer - this.photonShield.width / 2
        this.photonShield.y = playerCenterY + Math.sin(this.photonShield.angle) * distanceFromPlayer - this.photonShield.height / 2
        
        // 检查怪物子弹与盾牌的碰撞
        this.checkShieldBulletCollisions()
      }
      
      // 自动恢复能量（每5秒恢复1格能量）
      if (this.photonShield.energy < this.photonShield.maxEnergy) {
        if (!this.lastEnergyRecoveryTime) this.lastEnergyRecoveryTime = performance.now()
        const currentTime = performance.now()
        const elapsed = (currentTime - this.lastEnergyRecoveryTime) / 1000
        
        if (elapsed >= 5) {
          this.photonShield.energy = Math.min(this.photonShield.maxEnergy, this.photonShield.energy + 1)
          this.lastEnergyRecoveryTime = currentTime
        }
      }
    },
    
    // 新增方法：检查盾牌与怪物子弹的碰撞
    checkShieldBulletCollisions() {
      if (!this.photonShield.active) return
      
      for (let i = this.monsterBullets.length - 1; i >= 0; i--) {
        const bullet = this.monsterBullets[i]
        
        // 改进的碰撞检测：考虑盾牌的旋转角度
        if (this.checkRotatedRectCollision(bullet, this.photonShield)) {
          // 显示子弹被阻挡的效果
          this.showShieldBlockEffect(bullet.x, bullet.y)
          
          // 移除子弹
          this.monsterBullets.splice(i, 1)
          
          // 显示碰撞提示
          this.gameStatus = '光子盾阻挡了攻击！'
          setTimeout(() => {
            if (this.running) this.gameStatus = '进行中'
          }, 800)
        }
      }
    },
    
    // 新增方法：显示盾牌阻挡子弹的效果
    showShieldBlockEffect(x, y) {
      const blockEffect = {
        x: x,
        y: y,
        radius: 15,
        color: '#00bcd4',
        alpha: 1,
        maxRadius: 30,
        startTime: performance.now()
      }
      
      if (!this.shieldBlockEffects) this.shieldBlockEffects = []
      this.shieldBlockEffects.push(blockEffect)
      
      // 设置定时器移除效果
      setTimeout(() => {
        if (this.shieldBlockEffects) {
          const index = this.shieldBlockEffects.indexOf(blockEffect)
          if (index > -1) {
            this.shieldBlockEffects.splice(index, 1)
          }
        }
      }, 500)
    },
    
    // 新增方法：绘制光子盾牌
    drawPhotonShield() {
      if (!this.photonShield.active) return
      
      const ctx = this.ctx
      const shield = this.photonShield
      
      // 将世界坐标转换为屏幕坐标（因为光子盾在视口变换后绘制）
      const screenX = shield.x + this.viewportOffset.x
      const screenY = shield.y + this.viewportOffset.y
      
      // 保存当前画布状态
      ctx.save()
      
      // 移动到盾牌中心并旋转（使用屏幕坐标）
      ctx.translate(screenX + shield.width / 2, screenY + shield.height / 2)
      ctx.rotate(shield.angle)
      
      // 创建透明能量盾牌效果
      const shieldGradient = ctx.createRadialGradient(
        0, 0, 0,
        0, 0, Math.max(shield.width, shield.height) / 2
      )
      shieldGradient.addColorStop(0, 'rgba(0, 188, 212, 0.8)') // 中心较亮
      shieldGradient.addColorStop(0.5, 'rgba(0, 188, 212, 0.4)') // 中间透明
      shieldGradient.addColorStop(1, 'rgba(0, 188, 212, 0.1)') // 边缘透明
      
      // 绘制盾牌主体
      ctx.fillStyle = shieldGradient
      ctx.fillRect(-shield.width / 2, -shield.height / 2, shield.width, shield.height)
      
      // 绘制盾牌边框（发光效果）
      ctx.strokeStyle = 'rgba(0, 188, 212, 0.6)'
      ctx.lineWidth = 3
      ctx.strokeRect(-shield.width / 2, -shield.height / 2, shield.width, shield.height)
      
      // 绘制内部能量流动效果
      const now = performance.now()
      const flowSpeed = now * 0.01
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1
      
      // 绘制能量流动线
      for (let i = 0; i < 5; i++) {
        const offset = (flowSpeed + i * 0.5) % 2
        const yPos = -shield.height / 2 + offset * shield.height
        
        ctx.beginPath()
        ctx.moveTo(-shield.width / 2, yPos)
        ctx.lineTo(shield.width / 2, yPos)
        ctx.stroke()
      }
      
      // 恢复画布状态
      ctx.restore()
      
      // 绘制盾牌激活特效
      this.drawShieldEffects()
    },
    
    // 新增方法：绘制盾牌特效
    drawShieldEffects() {
      const ctx = this.ctx
      
      // 绘制盾牌激活特效
      if (this.shieldEffects) {
        this.shieldEffects.forEach(effect => {
          const progress = (performance.now() - effect.startTime || performance.now()) / 300
          if (progress >= 1) return
          
          const radius = effect.radius + (effect.maxRadius - effect.radius) * progress
          const alpha = effect.alpha * (1 - progress)
          
          ctx.fillStyle = `rgba(0, 188, 212, ${alpha})`
          ctx.beginPath()
          ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2)
          ctx.fill()
        })
      }
      
      // 绘制子弹阻挡特效
      if (this.shieldBlockEffects) {
        this.shieldBlockEffects.forEach(effect => {
          const progress = (performance.now() - effect.startTime || performance.now()) / 500
          if (progress >= 1) return
          
          const radius = effect.radius + (effect.maxRadius - effect.radius) * progress
          const alpha = effect.alpha * (1 - progress)
          
          ctx.fillStyle = `rgba(0, 188, 212, ${alpha})`
          ctx.beginPath()
          ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2)
          ctx.fill()
        })
      }

    },
    
    // 新增方法：绘制盾牌特效
    drawShieldEffects() {
      const ctx = this.ctx
      
      // 绘制盾牌激活特效
      if (this.shieldEffects) {
        this.shieldEffects.forEach(effect => {
          const progress = (performance.now() - effect.startTime || performance.now()) / 300
          if (progress >= 1) return
          
          const radius = effect.radius + (effect.maxRadius - effect.radius) * progress
          const alpha = effect.alpha * (1 - progress)
          
          ctx.fillStyle = `rgba(0, 188, 212, ${alpha})`
          ctx.beginPath()
          ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2)
          ctx.fill()
        })
      }
      
      // 绘制子弹阻挡特效
      if (this.shieldBlockEffects) {
        this.shieldBlockEffects.forEach(effect => {
          const progress = (performance.now() - effect.startTime || performance.now()) / 500
          if (progress >= 1) return
          
          const radius = effect.radius + (effect.maxRadius - effect.radius) * progress
          const alpha = effect.alpha * (1 - progress)
          
          ctx.fillStyle = `rgba(0, 188, 212, ${alpha})`
          ctx.beginPath()
          ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2)
          ctx.fill()
        })
      }

    },
    
    // 新增方法：绘制盾牌特效
    drawShieldEffects() {
      const ctx = this.ctx
      
      // 绘制盾牌激活特效
      if (this.shieldEffects) {
        this.shieldEffects.forEach(effect => {
          const progress = (performance.now() - effect.startTime || performance.now()) / 300
          if (progress >= 1) return
          
          const radius = effect.radius + (effect.maxRadius - effect.radius) * progress
          const alpha = effect.alpha * (1 - progress)
          
          ctx.fillStyle = `rgba(0, 188, 212, ${alpha})`
          ctx.beginPath()
          ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2)
          ctx.fill()
        })
      }
      
      // 绘制子弹阻挡特效
      if (this.shieldBlockEffects) {
        this.shieldBlockEffects.forEach(effect => {
          const progress = (performance.now() - effect.startTime || performance.now()) / 500
          if (progress >= 1) return
          
          const radius = effect.radius + (effect.maxRadius - effect.radius) * progress
          const alpha = effect.alpha * (1 - progress)
          
          ctx.fillStyle = `rgba(0, 188, 212, ${alpha})`
          ctx.beginPath()
          ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2)
          ctx.fill()
        })
      }

    },
    
    // 新增方法：绘制盾牌特效
    drawShieldEffects() {
      const ctx = this.ctx
      
      // 绘制盾牌激活特效
      if (this.shieldEffects) {
        this.shieldEffects.forEach(effect => {
          const progress = (performance.now() - effect.startTime || performance.now()) / 300
          if (progress >= 1) return
          
          const radius = effect.radius + (effect.maxRadius - effect.radius) * progress
          const alpha = effect.alpha * (1 - progress)
          
          ctx.fillStyle = `rgba(0, 188, 212, ${alpha})`
          ctx.beginPath()
          ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2)
          ctx.fill()
        })
      }
      
      // 绘制子弹阻挡特效
      if (this.shieldBlockEffects) {
        this.shieldBlockEffects.forEach(effect => {
          const progress = (performance.now() - effect.startTime || performance.now()) / 500
          if (progress >= 1) return
          
          const radius = effect.radius + (effect.maxRadius - effect.radius) * progress
          const alpha = effect.alpha * (1 - progress)
          
          ctx.fillStyle = `rgba(0, 188, 212, ${alpha})`
          ctx.beginPath()
          ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2)
          ctx.fill()
        })
      }
    },
    
    jump() {
      if (this.player.onGround) {
        this.player.vy = -this.JUMP_V
        this.player.onGround = false
      }
    },
    
    // 新增：右键向瞄准方向快速冲刺
    handleRightClick(e) {
      e.preventDefault()
      if (!this.running) return
      
      // 检查冲刺冷却时间
      const now = performance.now()
      if (this.player.dashCooldown && now < this.player.dashCooldown) {
        // 冷却中，显示提示
        const remainingTime = ((this.player.dashCooldown - now) / 1000).toFixed(1)
        this.gameStatus = `冲刺冷却中 (${remainingTime}秒)`
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 1000)
        return
      }
      
      // 获取鼠标在画布上的位置（世界坐标）
      const canvas = this.$refs.canvas
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      
      // 计算鼠标的世界坐标
      const mouseWorldX = -this.viewportOffset.x + (e.clientX - rect.left) * scaleX
      const mouseWorldY = -this.viewportOffset.y + (e.clientY - rect.top) * scaleY
      
      // 玩家中心位置（世界坐标）
      const playerCenterX = this.player.x + this.player.w/2
      const playerCenterY = this.player.y + this.player.h/2
      
      // 计算从玩家到鼠标的方向向量
      const dx = mouseWorldX - playerCenterX
      const dy = mouseWorldY - playerCenterY
      const distance = Math.sqrt(dx*dx + dy*dy)
      
      // 如果距离太近，不冲刺
      if (distance < 10) {
        return
      }
      
      // 归一化方向向量
      const normalizedX = dx / distance
      const normalizedY = dy / distance
      
      // 计算冲刺速度（特别快的瞬时速度，但距离适中）
      const dashSpeed = 2400 // 特别快的冲刺速度（提高瞬时速度感）
      const dashForceX = normalizedX * dashSpeed
      const dashForceY = normalizedY * dashSpeed
      
      // 应用冲刺速度（直接设置速度，而不是累加）
      // 冲刺可以在移动中、空中使用，不受当前速度影响
      this.player.vx = dashForceX
      this.player.vy = dashForceY
      
      // 设置冲刺状态
      this.player.isDashing = true
      this.player.dashStartTime = now
      this.player.dashDuration = 100 // 持续时间调整为100毫秒（原来的2/3），总距离约240像素（约为原来的2/3）
      
      // 设置冷却时间（1.5秒）
      this.player.dashCooldown = now + 1500
      
      // 创建冲刺视觉效果
      this.createDashEffect(playerCenterX, playerCenterY, normalizedX, normalizedY)
      
      // 更新玩家朝向
      if (dashForceX > 0) {
        this.player.facingRight = true
      } else if (dashForceX < 0) {
        this.player.facingRight = false
      }
      
      // 显示冲刺信息
      this.gameStatus = '冲刺！'
      setTimeout(() => {
        if (this.running) this.gameStatus = '进行中'
      }, 500)
    },
    
    toggleMute() {
      this.muted = !this.muted
    },
    
    toggleMusic() {
      this.musicEnabled = !this.musicEnabled
      if (this.musicEnabled) {
        this.playMusic()
      } else {
        this.pauseMusic()
      }
    },
    
    initMusic() {
      // 静默处理音乐初始化，不影响游戏功能
      if (this.musicEnabled) {
        try {
          this.backgroundMusic = new Audio()
          // 使用相对路径
          this.backgroundMusic.src = './sounds/background.mp3'
          this.backgroundMusic.loop = true
          this.backgroundMusic.volume = 0.5
          
          // 静默加载，不处理错误
          this.backgroundMusic.load().catch(() => {})
          
          // 用户交互后尝试播放
          const playMusic = () => {
            this.backgroundMusic.play().catch(() => {})
            document.removeEventListener('click', playMusic)
          }
          document.addEventListener('click', playMusic)
        } catch (e) {
          // 完全静默处理错误
        }
      }
    },
    
    playMusic() {
      if (this.backgroundMusic) {
        this.backgroundMusic.play().catch(e => {
          console.log('音乐播放失败，需要用户交互:', e)
        })
      }
    },
    
    pauseMusic() {
      if (this.backgroundMusic) {
        this.backgroundMusic.pause()
      }
    },
    
    triggerAvatarInput() {
      this.$refs.avatarInput.click()
    },
    
    handleAvatarChange(e) {
      const file = e.target.files && e.target.files[0]
      if (!file) return
      
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        this.avatarImg = img
        URL.revokeObjectURL(url)
      }
      img.onerror = () => {
        this.avatarImg = null
        URL.revokeObjectURL(url)
      }
      img.src = url
    },
    
    createLevel(level) {
      this.level = level || 1
      this.obstacles = [] // 清空所有障碍物（包括飞船碎片，它们会在游戏开始时重新生成）
      this.groundGaps = []
      this.speedZones = []
      this.traps = []
      this.items = []
      // this.treasures = [] // 宝物（已移除）
      this.totalDistance = 0
      this.hp = 10000 // 提高血量到10000，便于观察BOSS攻击模式
      this.maxHp = 10000 // 最大血量
      this.invincibleUntil = 0
      this.spawnCursorX = 0
      this.patternIndex = 0
      
      // 初始生成到画布右侧之外一段
      const initialRight = this.canvasWidth + 600
      this.generateSegment(260, initialRight)
      this.spawnCursorX = initialRight
      // 注意：固定陨石会在startGame()中的generateAllRainSeaMeteors()生成
    },
    
    // 随机数生成函数
    rand(min, max) {
      return Math.random() * (max - min) + min
    },
    
    pickInt(min, max) {
      return Math.floor(this.rand(min, max + 1))
    },
    
    // 权重选择函数 - 增加更多有趣的障碍类型
    pickWeighted(entries) {
      const total = entries.reduce((s, e) => s + e.w, 0)
      let r = Math.random() * total
      for (const e of entries) {
        r -= e.w
        if (r <= 0) return e.t
      }
      return entries[entries.length - 1].t
    },
    
    // 分段生成障碍 [fromX, toX)
    generateSegment(fromX, toX, excludeZone = null) {
      const MAX_OBSTACLES_ONSCREEN = 15
      const SEGMENT_SPACING = 180
      const MIN_GAP = 150
      const ARCH_HEIGHT = 80
      
      let x = fromX
      while (x < toX) {
        // 限制屏幕内障碍数量
        const onscreen = this.obstacles.filter(ob => 
          ob.x < this.canvasWidth + 400 && ob.x + ob.w > -60
        ).length
        if (onscreen >= MAX_OBSTACLES_ONSCREEN) break
        
        // 检查是否在排除区域内
        if (excludeZone && x + SEGMENT_SPACING > excludeZone.x && x < excludeZone.x + excludeZone.w) {
          x = excludeZone.x + excludeZone.w + 50 // 跳过排除区域
          continue
        }
        
        // 优化障碍物权重，保留坑洞和玄武岩
        // 玄武岩权重随机化：60-100之间随机，大幅增加生成概率
        const basaltWeight = this.pickInt(60, 100)
        const t = this.pickWeighted([
          { w: 80, t: { type: 'gap', w: this.pickInt(80, 150) } }, // 适中大小的坑洞
          { w: 0, t: { type: 'float', h: this.pickInt(20, 35), w: this.pickInt(50, 80), yOffset: this.pickInt(80, 120), move: Math.random() < 0.5 } }, // 悬浮平台（已取消）
          { w: 0, t: { type: 'floatChain', count: this.pickInt(2, 4), w: 50, h: 16, yStart: this.pickInt(90, 140), gap: 50, amp: 25, freq: 0.4 } }, // 悬浮链（已取消）
          { w: 0, t: { type: 'spikeRow', w: this.pickInt(100, 180), h: 16 } }, // 地刺陷阱（已取消）
          { w: basaltWeight, t: { type: 'basalt', w: this.pickInt(40, 120), h: this.pickInt(8, 20) } }, // 月球玄武岩（随机化权重和尺寸）
          { w: 0, t: { type: 'bird', w: 25, h: 18, ampY: 20, freqY: 0.6 } }, // 飞鸟（已取消）
          { w: 0, t: { type: 'platformCombo', platforms: this.pickInt(2, 4), spacing: this.pickInt(100, 200) } }, // 平台组合（已取消）
          { w: 0, t: { type: 'arch', w: 120, h: ARCH_HEIGHT } }, // 拱形结构（已取消）
          { w: 0, t: { type: 'floatingBlock', w: 40, h: 15, yOffset: this.pickInt(100, 200) } } // 悬浮方块（已取消）
        ])
        
        // 处理不同类型的障碍生成
        let baseX = x
        const last = this.obstacles.length ? this.obstacles[this.obstacles.length - 1] : null
        if (last && baseX < last.x + last.w + MIN_GAP) {
          baseX = last.x + last.w + MIN_GAP
        }
        
        // 悬浮砖头
        if (t.type === 'float') {
          const h = t.h, w = t.w
          const y = this.groundY - t.yOffset - h
          const isStatic = !t.move
          this.obstacles.push({
            x: baseX, y, w, h, vx: 0, color: '#8e44ad',
            isStatic, baseX, amp: isStatic ? 0 : 30, freq: isStatic ? 0 : 0.4,
            phase: 0, prevX: baseX, prevY: y
          })
          x = baseX + SEGMENT_SPACING
          continue
        }
        
        // 悬浮平台链
        if (t.type === 'floatChain') {
          for (let i = 0; i < t.count; i++) {
            const px = baseX + i * (t.w + t.gap)
            const y = this.groundY - t.yStart - t.h
            this.obstacles.push({
              x: px, y, w: t.w, h: t.h, vx: 0, color: '#8e44ad',
              isStatic: false, baseX: px, amp: t.amp, freq: t.freq,
              phase: i * 0.6, prevX: px, prevY: y
            })
          }
          x = baseX + t.count * (t.w + t.gap) + SEGMENT_SPACING
          continue
        }
        
        // 地刺陷阱（无伤害）
        if (t.type === 'spikeRow') {
          this.traps.push({
            type: 'spike', x: baseX, y: this.groundY - t.h,
            w: t.w, h: t.h, damage: 0
          })
          x = baseX + t.w + SEGMENT_SPACING
          continue
        }
        
        // 月球玄武岩
        if (t.type === 'basalt') {
          // 检查与上一个障碍物的最小间隔
          const last = this.obstacles.length ? this.obstacles[this.obstacles.length - 1] : null
          const lastTrap = this.traps.length ? this.traps[this.traps.length - 1] : null
          
          // 随机化玄武岩间距：200-600像素之间
          const minBasaltGap = this.pickInt(200, 600)
          if (lastTrap && lastTrap.type === 'basalt' && baseX < lastTrap.x + lastTrap.w + minBasaltGap) {
            baseX = lastTrap.x + lastTrap.w + minBasaltGap
          }
          
          // 随机化玄武岩高度位置：确保在地面上方可见（突出地面5-15像素）
          const basaltY = this.groundY - t.h - this.pickInt(5, 15)
          
          this.traps.push({
            type: 'basalt', x: baseX, y: basaltY,
            w: t.w, h: t.h, damage: 0 // 移除伤害效果
          })
          
          // 调试信息：每生成10个玄武岩输出一次
          if (this.traps.filter(t => t.type === 'basalt').length % 10 === 0) {
            console.log(`🪨 已生成 ${this.traps.filter(t => t.type === 'basalt').length} 个玄武岩，位置: (${Math.floor(baseX)}, ${Math.floor(basaltY)}), 大小: ${t.w}x${t.h}`)
          }
          // 随机化玄武岩之间的间距
          x = baseX + t.w + this.pickInt(SEGMENT_SPACING * 2, SEGMENT_SPACING * 4)
          continue
        }
        
        // 飞鸟
        if (t.type === 'bird') {
          const baseY = this.groundY - 120
          this.traps.push({
            type: 'bird', x: baseX, y: baseY, w: Math.max(16, Math.min(24, t.w || 20)),
            h: Math.max(12, Math.min(16, t.h || 16)), damage: 1,
            baseY, ampY: t.ampY, freqY: t.freqY, phaseY: 0, vx: -180
          })
          x = baseX + 140 + SEGMENT_SPACING
          continue
        }
        
        // 坑洞
        if (t.type === 'hole') {
          this.groundGaps.push({ x: baseX, w: t.w })
          x = baseX + t.w + SEGMENT_SPACING
          continue
        }
        
        // 大型悬浮平台
        if (t.type === 'floatPlatform') {
          for (let i = 0; i < t.count; i++) {
            const px = baseX + i * (t.w + t.spacing)
            const y = this.groundY - t.yOffset - t.h
            this.obstacles.push({
              x: px, y, w: t.w, h: t.h, vx: 0, color: '#9b59b6',
              isStatic: true, baseX: px, prevX: px, prevY: y
            })
          }
          x = baseX + t.count * (t.w + t.spacing) + SEGMENT_SPACING
          continue
        }
        
        // 螺旋台阶
        if (t.type === 'spiralStairs') {
          for (let s = 0; s < t.steps; s++) {
            const stepH = t.stepH * (s + 1)
            const stepW = t.stepW
            const stepY = this.groundY - t.yStart - stepH
            const stepX = baseX + s * (stepW + 15)
            this.obstacles.push({
              x: stepX, y: stepY, w: stepW, h: stepH,
              vx: 0, color: '#8e44ad', isStatic: true
            })
          }
          x = baseX + t.steps * (t.stepW + 15) + SEGMENT_SPACING
          continue
        }
        
        // 平台组合 - 创建高低错落的平台序列
        if (t.type === 'platformCombo') {
          let lastY = this.groundY - 80
          for (let i = 0; i < t.platforms; i++) {
            const px = baseX + i * t.spacing
            // 让平台高度有变化，但不要太高或太低
            const yVariation = (Math.random() - 0.5) * 60
            const platformY = Math.max(100, Math.min(this.groundY - 50, lastY + yVariation))
            lastY = platformY
            
            this.obstacles.push({
              x: px, y: platformY, w: 60, h: 15, vx: 0, color: '#8e44ad',
              isStatic: true, baseX: px, prevX: px, prevY: platformY
            })
            
            // 30%概率在平台之间添加小障碍
            if (i < t.platforms - 1 && Math.random() < 0.3) {
              const obstacleX = px + 30 + Math.random() * 30
              this.obstacles.push({
                x: obstacleX, y: platformY - 20, w: 20, h: 10, vx: 0, color: '#e74c3c',
                isStatic: true
              })
            }
          }
          x = baseX + t.platforms * t.spacing + SEGMENT_SPACING
          continue
        }
        
        // 拱形结构
        if (t.type === 'arch') {
          const archW = t.w
          const archH = t.h
          const archY = this.groundY - archH
          
          // 绘制拱形
          this.obstacles.push({
            x: baseX, 
            y: archY, 
            w: archW, 
            h: archH,
            type: 'arch',
            color: '#8e44ad'
          })
          
          // 拱形下方添加月球玄武岩
          this.traps.push({
            type: 'basalt',
            x: baseX,
            y: this.groundY - 20,
            w: archW,
            h: 20,
            damage: 0
          })
          
          x = baseX + archW + SEGMENT_SPACING
          continue
        }
        
        // 悬浮方块
        if (t.type === 'floatingBlock') {
          const blockW = t.w
          const blockH = t.h
          const blockY = this.groundY - t.yOffset - blockH
          
          // 生成1-2个一组的悬浮方块（大幅减少数量）
          const groupCount = this.pickInt(1, 2)
          for (let i = 0; i < groupCount; i++) {
            const offsetX = i * (blockW + 30) // 增加间距
            const offsetY = Math.sin(i * 0.8) * 15 // 减小波浪形高度分布
            
            this.obstacles.push({
              x: baseX + offsetX,
              y: blockY + offsetY,
              w: blockW,
              h: blockH,
              type: 'floating',
              color: '#9b59b6',
              isStatic: false,
              baseY: blockY + offsetY,
              amp: 3 + Math.random() * 5, // 减小浮动幅度
              freq: 0.2 + Math.random() * 0.3, // 减小浮动频率
              phase: Math.random() * Math.PI * 2
            })
          }
          
          x = baseX + blockW + SEGMENT_SPACING
          continue
        }
        
        // 基础障碍（地面砖头）
        if (t.type === 'static' || t.type === 'sine' || t.type === 'sineY' || t.type === 'stair') {
          const h = t.h || 30
          // 移除地面上的基础平台和台阶生成
          // 不再生成地面上的方块障碍物
          x = baseX + SEGMENT_SPACING
          continue
        }
        
        x = baseX + SEGMENT_SPACING
      }
      
      // 移除额外随机陷阱，消除所有地下的方块
      
      // 取消汉堡道具生成
    },
    
    // 生成垂直方向的地图段（用于向上/向下移动时）
    generateVerticalSegment(fromX, toX, fromY, toY) {
      const SEGMENT_SPACING_Y = 200 // 垂直方向的间距
      
      let y = fromY
      while (y < toY) {
        // 随机决定是否生成玄武岩（向上移动时生成较少）
        if (Math.random() < 0.3) {
          const basaltX = fromX + Math.random() * (toX - fromX - 120)
          const basaltW = this.pickInt(40, 100)
          const basaltH = this.pickInt(8, 20)
          
          // 检查是否与现有障碍物重叠
          const overlaps = this.traps.some(t => 
            t.type === 'basalt' &&
            Math.abs(t.x - basaltX) < basaltW + 50 &&
            Math.abs(t.y - y) < basaltH + 50
          )
          
          if (!overlaps) {
            this.traps.push({
              type: 'basalt',
              x: basaltX,
              y: y,
              w: basaltW,
              h: basaltH,
              damage: 0
            })
          }
        }
        
        // 随机生成悬浮平台（向上移动时）
        if (Math.random() < 0.2 && fromY < toY) {
          const platformX = fromX + Math.random() * (toX - fromX - 60)
          const platformW = this.pickInt(50, 80)
          const platformH = this.pickInt(15, 25)
          
          // 检查是否与现有障碍物重叠
          const overlaps = this.obstacles.some(ob =>
            Math.abs(ob.x - platformX) < platformW + 30 &&
            Math.abs(ob.y - y) < platformH + 30
          )
          
          if (!overlaps) {
            this.obstacles.push({
              x: platformX,
              y: y,
              w: platformW,
              h: platformH,
              vx: 0,
              color: '#8e44ad',
              isStatic: true,
              baseX: platformX,
              prevX: platformX,
              prevY: y
            })
          }
        }
        
        y += SEGMENT_SPACING_Y
      }
    },
    
    startGame(level) {
      this.running = true
      this.startTime = performance.now()
      this.lastFrame = null
      this.elapsedTime = 0
      this.gameStatus = '进行中'
      this.generatedMeteorRegions = [] // 重置已生成的陨石区域标记
      this.generatedCraterRegions = [] // 重置已生成的撞击坑区域标记
      this.generatedIlmeniteRegions = [] // 重置已生成的钛铁矿区域标记
      this.generatedStormOceanTerrainRegions = [] // 重置已生成的风暴洋地形区域标记
      this.impactCraters = [] // 清空撞击坑数组
      this.hiddenIlmeniteOres = [] // 清空隐藏的钛铁矿
      this.visibleIlmeniteOres = [] // 清空可见的钛铁矿
      // 重置钻探机状态
      this.drillMachine.deployed = false
      this.drillMachine.activated = false
      this.drillMachine.x = 0
      this.drillMachine.y = 0
      this.drillMachine.lastExtractTime = 0
      this.drillMachine.lastEnergyConsumeTime = 0
      this.drillMachine.hasCondensationModule = false
      this.drillMachine.waterIceDrops = []
      this.drillMachine.lastWarningTime = 0
      this.initializePlayerEquipment() // 初始化玩家装备
      this.createLevel(level)
      this.resetPlayer()
      // 在游戏开始时一次性生成所有雨海区域的固定陨石（在resetPlayer之后）
      // 使用分批生成，不会阻塞游戏启动
      this.generateAllRainSeaMeteors()
      // 在游戏开始时一次性生成所有风暴洋区域的飞船碎片
      this.generateAllStormOceanShipDebris()
      // 在风暴洋区域生成洞刺兽
      this.generateStormOceanCaveSpikes()
      
      // 在雨海区域生成飞行小怪物
      this.generateRainSeaFlyingMonsters()
      
      // 在风暴洋区域生成飞行小怪物
      this.generateStormOceanFlyingMonsters()
      
      // 在未知区生成谱尼BOSS（若未被击败）
      try {
        const saved = localStorage.getItem('delta-action-game')
        const data = saved ? JSON.parse(saved) : {}
        const defeated = data && data.flags && data.flags.puniDefeated
        if (!defeated) {
          this.spawnPuniBoss()
        } else {
          this.puniBoss.spawned = false
        }
      } catch (e) {
        // 发生异常时仍尝试生成
        this.spawnPuniBoss()
      }
      this.spawnPuniBoss()
      
      this.player.inShip = true // 确保游戏开始时玩家在飞船内
      
      // 清空所有资源格子，确保每次新游戏开始时资源格子都是空的
      this.player.energySlots.forEach(slot => {
        slot.resource = null
        slot.count = 0
        slot.icon = '📦' // 重置图标
      })
      this.player.currentEnergySlot = 1 // 重置到第一个格子
      this.player.energySlots[0].active = true
      this.player.energySlots.slice(1).forEach(slot => slot.active = false)
      
      // 清空所有怪物子弹，确保游戏开始时没有怪物子弹
      this.monsterBullets = []
      
      // 加载光子盾能量状态
      this.loadPhotonShieldEnergy()
      
      // 加载钻探机能量状态
      this.loadDrillMachineEnergy()
      
      // 初始化音乐
      this.initMusic()
      
      this.gameLoop()
    },
    
    restartGame() {
      this.startGame(this.level)
    },
    
    resetPlayer() {
      // 初始位置在飞船内部
      this.player.x = this.ship.x + this.ship.w/2 - this.player.w/2
      this.player.y = this.ship.y + this.ship.h - this.player.h - 10
      this.player.vx = 0
      this.player.vy = 0
      this.player.onGround = false
      this.player.inShip = true
      
      // 开始开门动画
      this.ship.doorOpen = true
    },
    
    updateShipAnimation(dt) {
      if (this.ship.doorOpen) {
        if (this.player.inShip) {
          // 进入飞船时的关门动画
          if (this.ship.doorProgress > 0) {
            this.ship.doorProgress = Math.max(0, this.ship.doorProgress - dt * 80)
          }
        } else {
          // 离开飞船时的开门动画
          if (this.ship.doorProgress < 100) {
            this.ship.doorProgress += dt * 50
            
            // 当门开到一定程度时让玩家出来
            if (this.ship.doorProgress > 40 && this.isNearShipDoor()) {
              this.player.y = this.ship.y + this.ship.h - this.player.h
            }
          }
        }
      }
    },
    
    // 新增方法：确保玩家初始位置正确
    ensurePlayerOnGround() {
      if (this.player.y + this.player.h < this.groundY) {
        this.player.y = this.groundY - this.player.h
        this.player.onGround = true
      }
    },
    
    gameLoop() {
      if (!this.running) return
      
      const now = performance.now()
      const dt = Math.min(0.05, (now - (this.lastFrame || now)) / 1000)
      this.lastFrame = now
      
      this.update(dt)
      this.render()
      this.elapsedTime = (now - this.startTime) / 1000
      
      this.animationFrameId = requestAnimationFrame(this.gameLoop)
    },
    
    update(dt) {
      const now = performance.now() / 1000
      
      // 更新飞船动画
      this.updateShipAnimation(dt)
      
      // 更新障碍物移动（悬浮砖头等）
      this.obstacles.forEach(ob => {
        ob.prevX = ob.x
        ob.prevY = ob.y
        if (!ob.isStatic) {
          if (ob.type === 'moving_platform') {
            // 可移动平台
            if (ob.moveDirection === 'horizontal') {
              // 水平移动
              ob.x = ob.baseX + Math.sin(now * (Math.PI * 2 * ob.freq) + (ob.phase || 0)) * (ob.amp || 0)
            } else {
              // 垂直移动
              ob.y = ob.baseY + Math.sin(now * (Math.PI * 2 * ob.freq) + (ob.phase || 0)) * (ob.amp || 0)
            }
          } else if (ob.freq !== undefined && !ob.moveDirection) {
            ob.x = ob.baseX + Math.sin(now * (Math.PI * 2 * ob.freq) + (ob.phase || 0)) * (ob.amp || 0)
          }
          if (ob.freqY !== undefined) {
            const baseY = ob.baseY !== undefined ? ob.baseY : ob.y
            ob.y = baseY + Math.sin(now * (Math.PI * 2 * ob.freqY) + (ob.phase || 0)) * (ob.ampY || 0)
          } else if (ob.type === 'floating') {
            // 悬浮方块上下浮动
            ob.y = ob.baseY + Math.sin(now * (Math.PI * 2 * ob.freq) + (ob.phase || 0)) * ob.amp
          } else if (ob.type === 'meteor') {
            // 陨石上下浮动和旋转
            ob.y = ob.baseY + Math.sin(now * (Math.PI * 2 * ob.freq) + (ob.phase || 0)) * ob.amp
            if (ob.rotation !== undefined && ob.rotationSpeed !== undefined) {
              ob.rotation += ob.rotationSpeed * dt * 60 // 旋转
            }
          }
        }
      })
      
      // 更新陷阱移动（飞鸟、移动伤害陷阱、落石等）
      this.traps.forEach(tp => {
        if (tp.type === 'bird') {
          const baseY = tp.baseY !== undefined ? tp.baseY : tp.y
          tp.y = baseY + Math.sin(now * (Math.PI * 2 * (tp.freqY || 0)) + (tp.phaseY || 0)) * (tp.ampY || 0)
          tp.x += (tp.vx || -160) * dt
        } else if (tp.type === 'moving_damage') {
          // 移动伤害陷阱
          if (tp.moveDirection === 'horizontal') {
            tp.x = tp.baseX + Math.sin(now * (Math.PI * 2 * tp.freq) + tp.phase) * tp.amp
          } else {
            tp.y = tp.baseY + Math.sin(now * (Math.PI * 2 * tp.freq) + tp.phase) * tp.amp
          }
        } else if (tp.type === 'falling_rock') {
          // 落石陷阱
          if (!tp.active) {
            tp.activateTimer -= dt * 1000
            if (tp.activateTimer <= 0) {
              tp.active = true
            }
          } else {
            tp.y += tp.vy * dt
            // 如果落石超出区域底部，重置
            if (tp.y > this.groundY + 100) {
              tp.y = tp.baseY
              tp.active = false
              tp.activateTimer = Math.random() * 2000
            }
          }
        } else if (tp.type === 'electric') {
          // 电击陷阱充能
          tp.chargeTime += dt
          tp.pulsePhase += dt * 2
          // 每2秒充能一次，然后激活
          if (tp.chargeTime >= 2) {
            tp.active = true
            tp.chargeTime = 0
          } else if (tp.chargeTime >= 1.5) {
            tp.active = false
          }
        }
      })
      
      // 道具动画更新（已移除汉堡）
      
      // 新增：更新子弹系统
      this.updateBullets(dt)
      
      // 新增：更新怪物子弹系统
      this.updateMonsterBullets(dt)
      
      // 新增：更新怪物系统
      this.updateMonsters(dt)
      
      // 新增：更新晶体碎片系统
      this.updateCrystalFragments(dt)
      
      // 新增：生成陨石撞击坑
      this.generateImpactCraters()
      
      // 新增：生成风暴洋地形
      this.generateStormOceanTerrain()
      
      // 新增：生成隐藏的钛铁矿
      this.generateHiddenIlmeniteOres()
      
      // 新增：如果装备了地质探测器，自动扫描周围的钛铁矿
      this.autoScanForIlmenite()
      
      // 新增：更新电击特效
      this.updateElectricEffects(dt)
      
      // 新增：更新光子盾牌
      this.updatePhotonShield(dt)
      
      // 新增：更新激光工具
      this.updateLaserTool(dt)
      
      // 新增：更新掉落物系统
      this.updateDrops(dt)
      
      // 新增：更新钻探机系统
      this.updateDrillMachine(dt)
      
      // 新增：更新伤害效果
      this.updateDamageEffects(dt)
      
      // 新增：更新冲刺视觉效果
      this.updateDashEffects(dt)
      
      // 新增：更新电击枪连发系统（衰减连发奖励）
      this.updateElectricGunRapidFire(dt)
      
      // 新增：更新BOSS系统
      this.updateBoss(dt)
      
      // 新增：更新谱尼BOSS系统
      this.updatePuniBoss(dt)
      
      // 新增：随机生成怪物和宝物
      this.randomSpawnEntities()
      
      // 更新冲刺状态
      const currentTime = performance.now()
      if (this.player.isDashing) {
        const dashElapsed = currentTime - this.player.dashStartTime
        if (dashElapsed >= this.player.dashDuration) {
          // 冲刺结束，恢复正常物理
          this.player.isDashing = false
          // 冲刺结束后稍微减速（保留更多动量）
          this.player.vx *= 0.7
          this.player.vy *= 0.7
        } else {
          // 冲刺中，保持冲刺速度，不受其他影响
          // 不处理正常移动输入，保持冲刺方向的动量
        }
      } else {
        // 非冲刺状态：正常移动处理
      let moveDir = 0
      if (this.input.left) moveDir -= 1
      if (this.input.right) moveDir += 1
        
        // 根据是否按住Shift键选择移动速度
        const currentMoveSpeed = this.input.run ? this.RUN_SPEED : this.MOVE_SPEED
        this.player.vx = moveDir * currentMoveSpeed
        
        // 更新玩家奔跑状态（用于绘制）
        this.player.isRunning = this.input.run && moveDir !== 0 && this.player.onGround
        
        // 更新奔跑动画时间（用于动画效果）
        if (this.player.isRunning) {
          this.player.runAnimationTime = (this.player.runAnimationTime || 0) + dt * 12 // 快速动画
        } else {
          this.player.runAnimationTime = 0
        }
        
        // 限制最大水平速度（非冲刺时）
        if (Math.abs(this.player.vx) > this.MAX_HORIZONTAL_SPEED) {
          this.player.vx = Math.sign(this.player.vx) * this.MAX_HORIZONTAL_SPEED
        }
      }
      
      // 跳跃
      if (this.input.jump && this.player.onGround) {
        this.player.vy = -this.JUMP_V
        this.player.onGround = false
      }
      
      // 优化的月球物理模拟（冲刺时不受重力和阻力影响）
      if (!this.player.isDashing) {
      this.player.vy += this.GRAVITY * dt
      // 更强的空气阻力，使移动更可控
      this.player.vx *= (1 - this.AIR_RESISTANCE * dt * 2)
      this.player.vy *= (1 - this.AIR_RESISTANCE * dt * 2)
      }
      
      // 限制最大下落速度（增加最大下落速度）
      if (this.player.vy > 1200) {
        this.player.vy = 1200
      }
      
      // 位置更新
      const prevX = this.player.x
      const prevY = this.player.y
      this.player.x += this.player.vx * dt
      this.player.y += this.player.vy * dt
      
      // 移除边界限制，允许无限移动
      // 仅保留地面碰撞检测
      if (this.player.y + this.player.h > this.canvasHeight) {
        this.player.y = this.canvasHeight - this.player.h
        this.player.vy = 0
        this.player.onGround = true
      }
      
      // 地面检测（考虑坑洞）
      const feetCenter = this.player.x + this.player.w / 2
      let onGap = false
      for (const g of this.groundGaps) {
        if (feetCenter >= g.x && feetCenter <= g.x + g.w) {
          onGap = true
          break
        }
      }
      if (!onGap && this.player.y + this.player.h >= this.groundY) {
        this.player.y = this.groundY - this.player.h
        this.player.vy = 0
        this.player.onGround = true
      }
      
      // 障碍物碰撞检测
      for (const ob of this.obstacles) {
        if (this.rectsCollide(this.player, ob)) {
          this.handleObstacleCollision(ob, prevX, prevY)
          break
        }
      }
      
      // 陷阱碰撞检测
      if (performance.now() > this.invincibleUntil) {
        for (const tp of this.traps) {
          if (this.rectsCollide(this.player, tp)) {
            this.handleTrapCollision(tp)
            break
          }
        }
        
        // 处理地面碰撞 - 所有地面都不扣血
        if (this.player.y + this.player.h >= this.groundY && performance.now() > this.invincibleUntil) {
          // 所有地面都是安全区域，不扣血
          // 移除地面碰撞粒子效果，避免效果过重
        }
      }
      
      // 道具碰撞检测
      for (let i = this.items.length - 1; i >= 0; i--) {
        const item = this.items[i]
        if (this.rectsCollide(this.player, item)) {
          this.handleItemCollision(item)
          this.items.splice(i, 1) // 移除已收集的道具
          break
        }
        

      }
      
      // 移除冷却时间相关代码
      
      // 宝物碰撞检测（已移除）
      
      // 无限地图生成
      this.handleInfiniteMapGeneration()
      
      // 游戏结束检查
      if (this.hp <= 0) {
        this.gameOver()
      }
    },
    
    handleObstacleCollision(ob, prevX, prevY) {
      const epsilon = 0.5
      const fromLeftOverlap = (this.player.x + this.player.w) - ob.x
      const fromRightOverlap = (ob.x + ob.w) - this.player.x
      const fromTopOverlap = (this.player.y + this.player.h) - ob.y
      const fromBottomOverlap = (ob.y + ob.h) - this.player.y
      
      const minXOverlap = Math.min(fromLeftOverlap, fromRightOverlap)
      const minYOverlap = Math.min(fromTopOverlap, fromBottomOverlap)
      
      if (minXOverlap < minYOverlap) {
        // 水平碰撞
        if (fromLeftOverlap < fromRightOverlap) {
          this.player.x = ob.x - this.player.w - epsilon
        } else {
          this.player.x = ob.x + ob.w + epsilon
        }
        this.player.vx = 0
      } else {
        // 垂直碰撞
        if (fromTopOverlap < fromBottomOverlap) {
          // 落在障碍物上
          this.player.y = ob.y - this.player.h - epsilon
          this.player.onGround = true
          // 如果障碍物移动，带动玩家
          const obDx = (ob.x - (ob.prevX || ob.x))
          this.player.x += obDx
        } else {
          // 撞到障碍物底部
          this.player.y = ob.y + ob.h + epsilon
        }
        this.player.vy = 0
      }
    },
    
    handleTrapCollision(tp) {
      // 月球玄武岩不扣血
      if (tp.type === 'basalt') {
        // 大幅减少粒子效果，只偶尔显示轻微效果
        if (Math.random() < 0.3) { // 30%概率显示粒子效果
          this.damageEffects.push({
            x: this.player.x + this.player.w * Math.random(),
            y: this.player.y + this.player.h * Math.random(),
            text: '✨',
            color: '#ffffff',
            alpha: 0.3, // 更低的透明度
            vy: -20 - Math.random() * 10 // 更慢的速度
          })
        }
      } else {
        // 其他陷阱的伤害效果
        this.hp = Math.max(0, this.hp - (tp.damage || 1))
        this.invincibleUntil = performance.now() + 800
        // 受伤反馈
        this.player.x -= 8
        this.player.vx = 0
        this.player.vy = -120
      }
    },
    
    handleItemCollision(item) {
      if (item.type === 'ammo') {
        // 收集子弹
        const ammoType = item.ammoType
        if (!this.player.ammo[ammoType]) {
          this.player.ammo[ammoType] = 0
        }
        this.player.ammo[ammoType] += item.count
        this.gameStatus = `获得${item.count}发子弹`
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 1000)
      }
    },
    
    // 宝物碰撞处理（已移除）
    // handleTreasureCollision(treasure) {
    //   this.player.backpack.push(treasure)
    //   this.treasuresCollected++
    //   this.gameStatus = `获得宝物：${treasure.name}`
    //   setTimeout(() => {
    //     if (this.running) this.gameStatus = '进行中'
    //   }, 1500)
    // },
    
    handleInfiniteMapGeneration() {
      // 限制玩家移动在地图边界内
      this.player.x = Math.max(this.mapMinX, Math.min(this.mapMaxX, this.player.x))
      this.player.y = Math.max(this.mapMinY, Math.min(this.mapMaxY, this.player.y))
      
      // 视口偏移计算，让玩家在屏幕中心偏下位置（视野向上偏移）
      const targetX = -this.player.x + this.canvasWidth * 0.5
      const targetY = -this.player.y + this.canvasHeight * 0.65  // 0.65表示玩家在屏幕65%的位置（更靠下，视野更向上）
      
      // 添加平滑过渡效果（增加平滑度，让玩家更接近中心）
      this.viewportOffset.x += (targetX - this.viewportOffset.x) * 0.3
      this.viewportOffset.y += (targetY - this.viewportOffset.y) * 0.3
      
      // 限制视口偏移，防止超出地图边界
      // 视口不能超出地图范围，计算边界限制
      const minViewportX = -this.mapMaxX + this.canvasWidth * 0.5
      const maxViewportX = -this.mapMinX + this.canvasWidth * 0.5
      const minViewportY = -this.mapMaxY + this.canvasHeight * 0.65  // 与targetY保持一致
      const maxViewportY = -this.mapMinY + this.canvasHeight * 0.65  // 与targetY保持一致
      
      this.viewportOffset.x = Math.max(minViewportX, Math.min(maxViewportX, this.viewportOffset.x))
      this.viewportOffset.y = Math.max(minViewportY, Math.min(maxViewportY, this.viewportOffset.y))
      
      // 生成新地图瓦片（在地图边界内）
      const currentTileX = Math.floor(this.player.x / this.tileSize)
      const currentTileY = Math.floor(this.player.y / this.tileSize)
      
      // 检查是否需要生成新瓦片（四个方向）
      if (currentTileX !== this.lastTileX || currentTileY !== this.lastTileY) {
        this.generateMapTiles(currentTileX, currentTileY)
        this.lastTileX = currentTileX
        this.lastTileY = currentTileY
      }
      
      // 陨石现在是固定的，不需要动态生成
      // this.generateRainSeaMeteors() // 已移除动态生成
      
      // 清理离开屏幕太远的对象（Y方向），但保留陨石、飞船碎片和月球幽灵（它们是固定的，不应该被清理）
      const viewportTopY = -this.viewportOffset.y
      const viewportBottomY = -this.viewportOffset.y + this.canvasHeight
      this.obstacles = this.obstacles.filter(ob => 
        ob.type === 'meteor' || // 保留所有陨石
        ob.type === 'floating_platform' || // 保留所有飞船碎片
        (ob.y + ob.h > viewportTopY - 200 && ob.y < viewportBottomY + 200) // 其他障碍物按距离清理
      )
      this.groundGaps = this.groundGaps.filter(g => g.y + g.h > viewportTopY - 200 && g.y < viewportBottomY + 200)
      this.speedZones = this.speedZones.filter(s => s.y + s.h > viewportTopY - 200 && s.y < viewportBottomY + 200)
      this.traps = this.traps.filter(t => t.y + t.h > viewportTopY - 200 && t.y < viewportBottomY + 200)
      this.items = this.items.filter(item => item.y + item.h > viewportTopY - 200 && item.y < viewportBottomY + 200)
      this.bullets = this.bullets.filter(b => b.y + b.h > viewportTopY - 200 && b.y < viewportBottomY + 200)
      // 清理离开屏幕太远的怪物（保留雨海和风暴洋飞虫在各自区域内）
      this.monsters = this.monsters.filter(m => 
        (m.type === 'rain_sea_flyer' && (this.isInRainSeaZone(m.x, m.y) || this.isInStormOceanZone(m.x, m.y))) || // 保留雨海和风暴洋区域内的飞虫
        (m.y + m.h > viewportTopY - 200 && m.y < viewportBottomY + 200) // 其他怪物按距离清理
      )
      this.impactCraters = this.impactCraters.filter(crater => crater.y + crater.h > viewportTopY - 200 && crater.y < viewportBottomY + 200)
      
      // 清理超出地图边界的对象，但保留陨石、飞船碎片和月球幽灵（它们是固定的，不应该被清理）
      this.obstacles = this.obstacles.filter(ob => 
        ob.type === 'meteor' || // 保留所有陨石
        ob.type === 'floating_platform' || // 保留所有飞船碎片
        (ob.x >= this.mapMinX && ob.x <= this.mapMaxX && 
         ob.y >= this.mapMinY && ob.y <= this.mapMaxY) // 其他障碍物按边界清理
      )
      this.groundGaps = this.groundGaps.filter(g => 
        g.x >= this.mapMinX && g.x <= this.mapMaxX && 
        g.y >= this.mapMinY && g.y <= this.mapMaxY
      )
      this.speedZones = this.speedZones.filter(s => 
        s.x >= this.mapMinX && s.x <= this.mapMaxX && 
        s.y >= this.mapMinY && s.y <= this.mapMaxY
      )
      this.traps = this.traps.filter(t => 
        t.x >= this.mapMinX && t.x <= this.mapMaxX && 
        t.y >= this.mapMinY && t.y <= this.mapMaxY
      )
      this.items = this.items.filter(item => 
        item.x >= this.mapMinX && item.x <= this.mapMaxX && 
        item.y >= this.mapMinY && item.y <= this.mapMaxY
      )
      this.bullets = this.bullets.filter(b => 
        b.x >= this.mapMinX && b.x <= this.mapMaxX && 
        b.y >= this.mapMinY && b.y <= this.mapMaxY
      )
      // 清理超出地图边界的怪物（保留雨海和风暴洋飞虫在各自区域内）
      this.monsters = this.monsters.filter(m => 
        (m.type === 'rain_sea_flyer' && (this.isInRainSeaZone(m.x, m.y) || this.isInStormOceanZone(m.x, m.y))) || // 保留雨海和风暴洋区域内的飞虫
        (m.x >= this.mapMinX && m.x <= this.mapMaxX && 
         m.y >= this.mapMinY && m.y <= this.mapMaxY) // 其他怪物按边界清理
      )
      this.impactCraters = this.impactCraters.filter(crater => 
        crater.x >= this.mapMinX && crater.x <= this.mapMaxX && 
        crater.y >= this.mapMinY && crater.y <= this.mapMaxY
      )
      this.hiddenIlmeniteOres = this.hiddenIlmeniteOres.filter(ore => 
        ore.x >= this.mapMinX && ore.x <= this.mapMaxX && 
        ore.y >= this.mapMinY && ore.y <= this.mapMaxY
      )
      this.visibleIlmeniteOres = this.visibleIlmeniteOres.filter(ore => 
        ore.x >= this.mapMinX && ore.x <= this.mapMaxX && 
        ore.y >= this.mapMinY && ore.y <= this.mapMaxY
      )
    },
    
    // 新增方法：随机生成怪物和宝物 - 修改为随机位置生成
    randomSpawnEntities() {
      // 限制整个地图上最多3个怪物（减少数量）
      if (this.monsters.length >= 3) return
      
      // 大幅降低怪物生成概率：每30秒有1%概率生成怪物
      if (Math.random() < 0.01 * (1/60) * 600) {
        const type = 'normal' // 只保留怪兽一号
        
        // 随机生成位置：在地图边界内随机位置生成
        const minX = Math.max(this.mapMinX, this.player.x - 400) // 玩家左侧400像素，但不小于地图边界
        const maxX = Math.min(this.mapMaxX, this.player.x + 800) // 玩家右侧800像素，但不大于地图边界
        const x = minX + Math.random() * (maxX - minX)
        
        // 垂直位置在地图边界内生成（考虑负Y轴）
        const minY = Math.max(this.mapMinY, this.groundY - 400)
        const maxY = Math.min(this.mapMaxY, this.groundY - 50)
        const y = minY + Math.random() * (maxY - minY)
        
        this.generateMonster(x, y, type)
      }
      
      // 宝物生成（已移除）
    },
    
    isOnGap() {
      const feetCenter = this.player.x + this.player.w / 2
      return this.groundGaps.some(gap => 
        feetCenter >= gap.x && feetCenter <= gap.x + gap.w
      )
    },
    
    checkCollisions() {
      // 简化版碰撞检测
      this.obstacles.forEach(obstacle => {
        if (this.rectsCollide(this.player, obstacle)) {
          this.handleCollision(obstacle)
        }
      })
    },
    
    // 新增方法：绘制掉落物
    drawDrops(ctx) {
      this.player.drops.forEach(drop => {
        // 跳过已收集的掉落物
        if (drop.collected) return
        
        const time = performance.now()
        const centerX = drop.x + drop.w/2
        const centerY = drop.y + drop.h/2
        
        // 特殊处理：无尽能源掉落物
        if (drop.isInfiniteEnergy || drop.type === 'infinite_energy' || drop.name === '无尽能源') {
          ctx.save() // 保存画布状态
          
          // 应用旋转（如果有）
          if (drop.rotation !== undefined) {
            ctx.translate(centerX, centerY)
            ctx.rotate(drop.rotation)
            ctx.translate(-centerX, -centerY)
          }
          
          // 更强的闪烁效果
          const pulse = Math.sin(time * 0.005) * 0.4 + 0.6
          const glowPulse = Math.sin(time * 0.003) * 0.3 + 0.7
          
          // 外层光晕（多层发光效果）
          const glowRadius = drop.w/2 + 20 * glowPulse
          const outerGlow = ctx.createRadialGradient(centerX, centerY, drop.w/2, centerX, centerY, glowRadius)
          outerGlow.addColorStop(0, 'rgba(255, 215, 0, 0.8)')
          outerGlow.addColorStop(0.5, 'rgba(255, 255, 0, 0.4)')
          outerGlow.addColorStop(1, 'rgba(255, 215, 0, 0)')
          ctx.fillStyle = outerGlow
        ctx.beginPath()
          ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2)
        ctx.fill()
        
          // 中层光晕
          const midGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, drop.w/2 + 10)
          midGlow.addColorStop(0, 'rgba(255, 255, 0, 0.9)')
          midGlow.addColorStop(0.7, 'rgba(255, 215, 0, 0.6)')
          midGlow.addColorStop(1, 'rgba(255, 215, 0, 0)')
          ctx.fillStyle = midGlow
          ctx.beginPath()
          ctx.arc(centerX, centerY, drop.w/2 + 10, 0, Math.PI * 2)
          ctx.fill()
          
          // 掉落物背景（圆形，金色）
          ctx.fillStyle = `rgba(255, 215, 0, ${0.8 * pulse})`
          ctx.beginPath()
          ctx.arc(centerX, centerY, drop.w/2, 0, Math.PI * 2)
          ctx.fill()
          
          // 掉落物边框（更粗，更亮）
          ctx.strokeStyle = `rgba(255, 255, 0, ${pulse})`
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.arc(centerX, centerY, drop.w/2, 0, Math.PI * 2)
          ctx.stroke()
          
          // 内层边框
          ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.beginPath()
          ctx.arc(centerX, centerY, drop.w/2 - 2, 0, Math.PI * 2)
        ctx.stroke()
        
          // 掉落物图标（更大）
        ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
          ctx.fillText(drop.icon, centerX, centerY)
          
          ctx.restore() // 恢复画布状态
          
          // 掉落物名称（更大更明显，不旋转）
          ctx.fillStyle = '#ffff00'
          ctx.font = 'bold 16px Arial'
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 3
          ctx.strokeText(drop.name, centerX, centerY + drop.h/2 + 20)
          ctx.fillText(drop.name, centerX, centerY + drop.h/2 + 20)
        } else {
          // 普通掉落物的绘制
          const pulse = Math.sin(time * 0.01) * 0.3 + 0.7
        
        // 掉落物背景（圆形）
        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 * pulse})`
        ctx.beginPath()
          ctx.arc(centerX, centerY, drop.w/2, 0, Math.PI * 2)
        ctx.fill()
        
        // 掉落物边框
        ctx.strokeStyle = '#ffd700'
        ctx.lineWidth = 2
        ctx.beginPath()
          ctx.arc(centerX, centerY, drop.w/2, 0, Math.PI * 2)
        ctx.stroke()
        
        // 掉落物图标
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
          ctx.fillText(drop.icon, centerX, centerY)
        
        // 掉落物名称
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px Arial'
          ctx.fillText(drop.name, centerX, centerY + drop.h/2 + 12)
        }
      })
    },
    
    // 绘制激光效果
    drawLaserEffect(ctx) {
      if (!this.player.laserTool.isActive || !this.player.laserTool.targetBasalt) return
      
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      const basaltCenterX = this.player.laserTool.targetBasalt.x + this.player.laserTool.targetBasalt.w / 2
      const basaltCenterY = this.player.laserTool.targetBasalt.y + this.player.laserTool.targetBasalt.h / 2
      
      // 绘制激光束
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5]) // 虚线效果
      ctx.beginPath()
      ctx.moveTo(playerCenterX, playerCenterY)
      ctx.lineTo(basaltCenterX, basaltCenterY)
      ctx.stroke()
      ctx.setLineDash([]) // 重置虚线
      
      // 绘制激光起点（玩家位置）
      ctx.fillStyle = '#00ff00'
      ctx.beginPath()
      ctx.arc(playerCenterX, playerCenterY, 5, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制激光终点（玄武岩位置）
      ctx.fillStyle = '#ff0000'
      ctx.beginPath()
      ctx.arc(basaltCenterX, basaltCenterY, 8, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制挖取进度条
      const progress = this.player.laserTool.miningProgress / this.player.laserTool.miningTime
      const progressBarWidth = 60
      const progressBarHeight = 8
      const progressBarX = basaltCenterX - progressBarWidth / 2
      const progressBarY = basaltCenterY - 20
      
      // 进度条背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 进度条前景
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight)
      
      // 进度条边框
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 显示挖取时间
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `${Math.ceil((this.player.laserTool.miningTime - this.player.laserTool.miningProgress) / 1000)}秒`, 
        basaltCenterX, 
        progressBarY - 5
      )
    },
    
    // 绘制激光效果
    drawLaserEffect(ctx) {
      // 确定目标是钛铁矿、石英岩还是玄武岩
      let targetX, targetY
      let laserColor, miningTime
      if (this.player.laserTool.targetIlmenite) {
        targetX = this.player.laserTool.targetIlmenite.x + this.player.laserTool.targetIlmenite.w / 2
        targetY = this.player.laserTool.targetIlmenite.y + this.player.laserTool.targetIlmenite.h / 2
        laserColor = '#ff6600' // 钛铁矿用橙色
        miningTime = this.player.laserTool.miningTimeIlmenite
      } else if (this.player.laserTool.targetQuartz) {
        targetX = this.player.laserTool.targetQuartz.x + this.player.laserTool.targetQuartz.w / 2
        targetY = this.player.laserTool.targetQuartz.y + this.player.laserTool.targetQuartz.h / 2
        laserColor = '#00bfff' // 石英岩用蓝色
        miningTime = this.player.laserTool.miningTime
      } else if (this.player.laserTool.targetBasalt) {
        targetX = this.player.laserTool.targetBasalt.x + this.player.laserTool.targetBasalt.w / 2
        targetY = this.player.laserTool.targetBasalt.y + this.player.laserTool.targetBasalt.h / 2
        laserColor = '#00ff00' // 玄武岩用绿色
        miningTime = this.player.laserTool.miningTime
      } else {
        return // 没有目标，不绘制
      }
      
      if (!this.player.laserTool.isActive) return
      
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      const basaltCenterX = targetX
      const basaltCenterY = targetY
      ctx.strokeStyle = laserColor
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5]) // 虚线效果
      ctx.beginPath()
      ctx.moveTo(playerCenterX, playerCenterY)
      ctx.lineTo(basaltCenterX, basaltCenterY)
      ctx.stroke()
      ctx.setLineDash([]) // 重置虚线
      
      // 绘制激光起点（玩家位置）
      ctx.fillStyle = laserColor
      ctx.beginPath()
      ctx.arc(playerCenterX, playerCenterY, 5, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制激光终点（目标位置）
      ctx.fillStyle = this.player.laserTool.targetIlmenite ? '#ff8800' : (this.player.laserTool.targetQuartz ? '#ffffff' : '#ff0000')
      ctx.beginPath()
      ctx.arc(basaltCenterX, basaltCenterY, 8, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制挖取进度条
      const progress = this.player.laserTool.miningProgress / miningTime
      const progressBarWidth = 60
      const progressBarHeight = 8
      const progressBarX = basaltCenterX - progressBarWidth / 2
      const progressBarY = basaltCenterY - 20
      
      // 进度条背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 进度条前景（使用与激光相同的颜色）
      ctx.fillStyle = laserColor
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight)
      
      // 进度条边框
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 显示挖取时间
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `${Math.ceil((miningTime - this.player.laserTool.miningProgress) / 1000)}秒`, 
        basaltCenterX, 
        progressBarY - 5
      )
    },
    
    rectsCollide(a, b) {
      return a.x < b.x + b.w && 
             a.x + a.w > b.x && 
             a.y < b.y + b.h && 
             a.y + a.h > b.y
    },
    
    // 旋转矩形碰撞检测（用于光子盾）
    checkRotatedRectCollision(bullet, shield) {
      // 获取盾牌的中心点
      const shieldCenterX = shield.x + shield.width / 2
      const shieldCenterY = shield.y + shield.height / 2
      
      // 获取子弹的中心点
      const bulletCenterX = bullet.x + bullet.w / 2
      const bulletCenterY = bullet.y + bullet.h / 2
      
      // 将子弹坐标转换到盾牌的局部坐标系（考虑旋转）
      const cosAngle = Math.cos(-shield.angle)
      const sinAngle = Math.sin(-shield.angle)
      
      // 计算相对于盾牌中心的坐标
      const relativeX = bulletCenterX - shieldCenterX
      const relativeY = bulletCenterY - shieldCenterY
      
      // 旋转坐标到盾牌局部坐标系
      const localX = relativeX * cosAngle - relativeY * sinAngle
      const localY = relativeX * sinAngle + relativeY * cosAngle
      
      // 检查是否在盾牌的轴对齐边界框内
      const halfWidth = shield.width / 2
      const halfHeight = shield.height / 2
      
      // 考虑子弹的大小
      const bulletHalfWidth = bullet.w / 2
      const bulletHalfHeight = bullet.h / 2
      
      // 检查碰撞
      return Math.abs(localX) <= halfWidth + bulletHalfWidth &&
             Math.abs(localY) <= halfHeight + bulletHalfHeight
    },
    
    // 旋转矩形碰撞检测（用于光子盾）
    checkRotatedRectCollision(bullet, shield) {
      // 获取盾牌的中心点
      const shieldCenterX = shield.x + shield.width / 2
      const shieldCenterY = shield.y + shield.height / 2
      
      // 获取子弹的中心点
      const bulletCenterX = bullet.x + bullet.w / 2
      const bulletCenterY = bullet.y + bullet.h / 2
      
      // 将子弹坐标转换到盾牌的局部坐标系（考虑旋转）
      const cosAngle = Math.cos(-shield.angle)
      const sinAngle = Math.sin(-shield.angle)
      
      // 计算相对于盾牌中心的坐标
      const relativeX = bulletCenterX - shieldCenterX
      const relativeY = bulletCenterY - shieldCenterY
      
      // 旋转坐标到盾牌局部坐标系
      const localX = relativeX * cosAngle - relativeY * sinAngle
      const localY = relativeX * sinAngle + relativeY * cosAngle
      
      // 检查是否在盾牌的轴对齐边界框内
      const halfWidth = shield.width / 2
      const halfHeight = shield.height / 2
      
      // 考虑子弹的大小
      const bulletHalfWidth = bullet.w / 2
      const bulletHalfHeight = bullet.h / 2
      
      // 检查碰撞
      return Math.abs(localX) <= halfWidth + bulletHalfWidth &&
             Math.abs(localY) <= halfHeight + bulletHalfHeight
    },
    
    checkCollisions() {
      // 这个方法现在在update中直接处理，保留空方法避免错误
    },
    
    handleCollision(obstacle) {
      // 简化碰撞处理
      if (performance.now() > this.invincibleUntil) {
        this.hp = Math.max(0, this.hp - 1)
        this.invincibleUntil = performance.now() + 800
        this.player.x -= 8
        this.player.vx = 0
        this.player.vy = -120
      }
    },
    
    gameOver() {
      this.running = false
      this.gameStatus = '任务失败 - 返回基地'
      
      // 游戏失败时不带回任何资源（死亡时资源丢失）
      // 只传递游戏时间和基本玩家数据，不传递资源
      const currentState = {
        gameTime: this.gameTime + this.elapsedTime,
        playerData: {
          electricBullets: 0, // 死亡时子弹也丢失
          hp: 0,
          money: this.money, // 金钱可以保留
          kills: this.kills
        },
        collectedResources: {} // 空的资源对象，表示没有带回任何资源
      }
      
      setTimeout(() => {
        this.$emit('game-over', currentState)
      }, 3000)
    },
    
    generateMapTiles(tileX, tileY) {
      // 生成5x5区域的地图瓦片，确保覆盖所有移动方向
      for (let x = tileX - 2; x <= tileX + 2; x++) {
        for (let y = tileY - 2; y <= tileY + 2; y++) {
          const tileKey = `${x},${y}`
          if (!this.mapTiles.includes(tileKey)) {
            this.mapTiles.push(tileKey)
            // 取消地面上的方块生成，只保留地面瓦片标记
            // 不再生成随机障碍物
          }
        }
      }
    },

    render() {
      const ctx = this.ctx
      const W = this.canvasWidth
      const H = this.canvasHeight
      
      // 清除画布时考虑视口偏移
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.restore()
      
      // 绘制星空背景（固定，不受视口影响）
      ctx.fillStyle = '#000033'
      ctx.fillRect(0, 0, W, H)
      
      // 绘制银河
      ctx.fillStyle = 'rgba(30, 30, 80, 0.4)'
      ctx.beginPath()
      ctx.ellipse(W/2, H/2, W*0.8, H*0.3, 0, 0, Math.PI*2)
      ctx.fill()
      
      // 绘制星星
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * W
        const y = Math.random() * H
        const size = Math.random() * 1.5
        ctx.fillRect(x, y, size, size)
      }
      
      // 绘制闪烁的大星星
      const bigStars = 10
      for (let i = 0; i < bigStars; i++) {
        const x = Math.random() * W
        const y = Math.random() * H * 0.8
        const size = 1 + Math.random() * 2
        const alpha = 0.7 + Math.sin(Date.now()/1000 + i) * 0.3
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI*2)
        ctx.fill()
      }
      
      // 应用视口变换，之后的所有绘制都会跟随视口
      ctx.save()
      ctx.translate(this.viewportOffset.x, this.viewportOffset.y)
      
      // 绘制地图瓦片和背景网格（覆盖整个地图范围）
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      
      // 计算可见区域的世界坐标范围
      const viewportLeft = -this.viewportOffset.x
      const viewportRight = -this.viewportOffset.x + W
      const viewportTop = -this.viewportOffset.y
      const viewportBottom = -this.viewportOffset.y + H
      
      // 扩展绘制范围，确保覆盖整个可见区域
      const gridStartX = Math.max(this.mapMinX, Math.floor(viewportLeft / this.tileSize) * this.tileSize - this.tileSize)
      const gridEndX = Math.min(this.mapMaxX, Math.ceil(viewportRight / this.tileSize) * this.tileSize + this.tileSize)
      const gridStartY = Math.max(this.mapMinY, Math.floor(viewportTop / this.tileSize) * this.tileSize - this.tileSize)
      const gridEndY = Math.min(this.mapMaxY, Math.ceil(viewportBottom / this.tileSize) * this.tileSize + this.tileSize)
      
      // 绘制垂直线
      for (let x = gridStartX; x <= gridEndX; x += this.tileSize) {
        ctx.beginPath()
        ctx.moveTo(x, gridStartY)
        ctx.lineTo(x, gridEndY)
        ctx.stroke()
      }
      
      // 绘制水平线
      for (let y = gridStartY; y <= gridEndY; y += this.tileSize) {
        ctx.beginPath()
        ctx.moveTo(gridStartX, y)
        ctx.lineTo(gridEndX, y)
        ctx.stroke()
      }
      
      // 绘制月球玄武岩地面（在世界坐标系中固定，覆盖整个地图宽度）
      ctx.fillStyle = '#3a3a3a'
      // 地面从 groundY 向下延伸到地图底部
      ctx.fillRect(this.mapMinX, this.groundY, this.mapSize, this.mapMaxY - this.groundY)
      
      // 玄武岩纹理效果（在地图范围内）
      ctx.fillStyle = 'rgba(50, 50, 60, 0.6)'
      const textureStartX = Math.floor(this.mapMinX / 20) * 20
      const textureEndX = Math.ceil(this.mapMaxX / 20) * 20
      for (let i = textureStartX; i <= textureEndX; i += 20) {
        const height = 3 + Math.sin((Date.now() / 300 + i) * 0.3) * 2
        ctx.fillRect(
          i,
          this.groundY - height,
          15, height
        )
      }
      
      // 添加月球表面纹理（在地图范围内）
      ctx.fillStyle = 'rgba(100, 100, 120, 0.3)'
      for (let i = 0; i < 20; i++) {
        const x = this.mapMinX + Math.random() * this.mapSize
        const y = this.groundY + Math.random() * 10
        const size = 5 + Math.random() * 15
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI*2)
        ctx.fill()
      }
      
      // 保留坑洞区域
      ctx.fillStyle = '#000000'
      this.groundGaps.forEach(g => {
        ctx.fillRect(g.x, this.groundY, g.w, this.mapMaxY - this.groundY)
      })
      
      // 绘制月球表面纹理 - 陨石坑（在地图范围内）
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      const craterCount = Math.ceil(this.mapSize / 80)
      for (let i = 0; i < craterCount; i++) {
        const x = this.mapMinX + (i * 80 + (performance.now() / 50) % 80) % this.mapSize
        if (x >= this.mapMinX && x <= this.mapMaxX) {
        const size = 15 + Math.sin(x * 0.1) * 5
        ctx.beginPath()
        ctx.arc(x, this.groundY - size/2, size/2, 0, Math.PI * 2)
        ctx.fill()
        }
      }
      
      // 月球表面颗粒感（在地图范围内）
      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      for (let i = 0; i < 100; i++) {
        const x = this.mapMinX + Math.random() * this.mapSize
        const y = this.groundY + Math.random() * 5
        ctx.fillRect(x, y, 1, 1)
      }
      
      // 绘制永久阴影区
      this.drawShadowZones(ctx)
      
      // 绘制雨海区域
      this.drawRainSeaZone(ctx)
      
      // 绘制风暴洋、澄海玄武岩地区
      this.drawStormOceanZone(ctx)
      
      // 绘制未知区
      this.drawUnknownZone(ctx)
      
      // 绘制陨石撞击坑
      this.drawImpactCraters(ctx)
      
      // 绘制道具
      this.drawItems(ctx)
      
      // 绘制陷阱
      this.drawTraps(ctx)
      
      // 绘制掉落物
      this.drawDrops(ctx)
      
      // 绘制钻探机
      this.drawDrillMachine(ctx)
      
      // 绘制障碍物
      this.obstacles.forEach(ob => {
        if (ob.type === 'meteor') {
          this.drawMeteor(ctx, ob)
        } else if (ob.type === 'floating_platform' || ob.type === 'platform_combo') {
          // 绘制废弃飞船碎片
          this.drawShipDebris(ctx, ob)
        } else {
          // 普通障碍物
        ctx.fillStyle = ob.color
        ctx.fillRect(ob.x, ob.y, ob.w, ob.h)
        // 装饰边框
        ctx.strokeStyle = 'rgba(0,0,0,0.08)'
        ctx.lineWidth = 2
        ctx.strokeRect(ob.x, ob.y, ob.w, ob.h)
        }
      })
      
      // 新增：绘制子弹
      this.drawBullets(ctx)
      
      // 新增：绘制电击特效
      this.drawElectricEffects(ctx)
      
      // 新增：绘制怪物子弹
      this.drawMonsterBullets(ctx)
      
      // 新增：绘制怪物
      this.drawMonsters(ctx)
      
      // 新增：绘制晶体碎片
      this.drawCrystalFragments(ctx)
      
      // 绘制宝物（已移除）
      
      // 新增：绘制BOSS
      this.drawBoss(ctx)
      
      // 绘制谱尼BOSS
      this.drawPuniBoss(ctx)
      
      // 新增：绘制冲刺视觉效果
      this.drawDashEffects(ctx)
      
      // 新增：绘制伤害效果
      this.drawDamageEffects(ctx)
      
      // 绘制废弃飞船
      this.drawAbandonedShip()
      
      // 绘制基地环境装饰
      this.drawBaseEnvironment()
      
      // 绘制玩家（在视口变换内，确保玩家在世界坐标系中正确绘制）
      this.drawPlayer()
      
      // 恢复视口变换
      ctx.restore()
      
      // 新增：绘制光子盾牌（需要在屏幕坐标系中绘制）
      this.drawPhotonShield()
      
      // 绘制HUD信息
      this.drawHUD()
    },
    
    drawItems(ctx) {
      this.items.forEach(item => {
        if (item.type === 'burger') {
          // 绘制汉堡
          ctx.fillStyle = '#ff6b6b' // 面包底部
          ctx.fillRect(item.x, item.y + item.h * 0.6, item.w, item.h * 0.4)
          
          ctx.fillStyle = '#ffd166' // 奶酪
          ctx.fillRect(item.x + 2, item.y + item.h * 0.4, item.w - 4, item.h * 0.2)
          
          ctx.fillStyle = '#ff6b6b' // 面包顶部
          ctx.fillRect(item.x, item.y, item.w, item.h * 0.4)
          
          ctx.fillStyle = '#06d6a0' // 生菜
          ctx.fillRect(item.x + 4, item.y + item.h * 0.3, item.w - 8, 2)
        } else if (item.type === 'chips') {
          // 绘制薯片袋
          ctx.fillStyle = item.color
          ctx.fillRect(item.x, item.y, item.w, item.h)
          
          // 绘制薯片标志
          ctx.fillStyle = '#ff0000'
          ctx.font = 'bold 12px Arial'
          ctx.fillText('Chips', item.x + 5, item.y + 20)
          
          // 冲击波效果
          ctx.strokeStyle = 'rgba(255, 200, 0, 0.5)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(item.x + item.w/2, item.y + item.h/2, 100, 0, Math.PI * 2)
          ctx.stroke()
          
          // 发光效果
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
          ctx.lineWidth = 1
          ctx.strokeRect(item.x, item.y, item.w, item.h)
        }
      })
    },
    
    // 新增方法：绘制掉落物
    drawDrops(ctx) {
      this.player.drops.forEach(drop => {
        // 跳过已收集的掉落物
        if (drop.collected) return
        
        // 绘制掉落物背景（闪烁效果）
        const time = performance.now()
        const pulse = Math.sin(time * 0.01) * 0.3 + 0.7 // 闪烁效果
        
        // 掉落物背景（圆形）
        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 * pulse})`
        ctx.beginPath()
        ctx.arc(drop.x + drop.w/2, drop.y + drop.h/2, drop.w/2, 0, Math.PI * 2)
        ctx.fill()
        
        // 掉落物边框
        ctx.strokeStyle = '#ffd700'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(drop.x + drop.w/2, drop.y + drop.h/2, drop.w/2, 0, Math.PI * 2)
        ctx.stroke()
        
        // 掉落物图标
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(drop.icon, drop.x + drop.w/2, drop.y + drop.h/2)
        
        // 掉落物名称
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px Arial'
        ctx.fillText(drop.name, drop.x + drop.w/2, drop.y + drop.h + 12)
      })
    },
    
    // 新增方法：绘制掉落物
    drawDrops(ctx) {
      this.player.drops.forEach(drop => {
        // 跳过已收集的掉落物
        if (drop.collected) return
        
        // 绘制掉落物背景（闪烁效果）
        const time = performance.now()
        const pulse = Math.sin(time * 0.01) * 0.3 + 0.7 // 闪烁效果
        
        // 掉落物背景（圆形）
        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 * pulse})`
        ctx.beginPath()
        ctx.arc(drop.x + drop.w/2, drop.y + drop.h/2, drop.w/2, 0, Math.PI * 2)
        ctx.fill()
        
        // 掉落物边框
        ctx.strokeStyle = '#ffd700'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(drop.x + drop.w/2, drop.y + drop.h/2, drop.w/2, 0, Math.PI * 2)
        ctx.stroke()
        
        // 掉落物图标
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(drop.icon, drop.x + drop.w/2, drop.y + drop.h/2)
        
        // 掉落物名称
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px Arial'
        ctx.fillText(drop.name, drop.x + drop.w/2, drop.y + drop.h + 12)
      })
    },
    
    // 绘制激光效果
    drawLaserEffect(ctx) {
      if (!this.player.laserTool.isActive || !this.player.laserTool.targetBasalt) return
      
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      const basaltCenterX = this.player.laserTool.targetBasalt.x + this.player.laserTool.targetBasalt.w / 2
      const basaltCenterY = this.player.laserTool.targetBasalt.y + this.player.laserTool.targetBasalt.h / 2
      
      // 绘制激光束
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5]) // 虚线效果
      ctx.beginPath()
      ctx.moveTo(playerCenterX, playerCenterY)
      ctx.lineTo(basaltCenterX, basaltCenterY)
      ctx.stroke()
      ctx.setLineDash([]) // 重置虚线
      
      // 绘制激光起点（玩家位置）
      ctx.fillStyle = '#00ff00'
      ctx.beginPath()
      ctx.arc(playerCenterX, playerCenterY, 5, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制激光终点（玄武岩位置）
      ctx.fillStyle = '#ff0000'
      ctx.beginPath()
      ctx.arc(basaltCenterX, basaltCenterY, 8, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制挖取进度条
      const progress = this.player.laserTool.miningProgress / this.player.laserTool.miningTime
      const progressBarWidth = 60
      const progressBarHeight = 8
      const progressBarX = basaltCenterX - progressBarWidth / 2
      const progressBarY = basaltCenterY - 20
      
      // 进度条背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 进度条前景
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight)
      
      // 进度条边框
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 显示挖取时间
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `${Math.ceil((this.player.laserTool.miningTime - this.player.laserTool.miningProgress) / 1000)}秒`, 
        basaltCenterX, 
        progressBarY - 5
      )
    },
    
    // 绘制激光效果
    drawLaserEffect(ctx) {
      if (!this.player.laserTool.isActive || !this.player.laserTool.targetBasalt) return
      
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      const basaltCenterX = this.player.laserTool.targetBasalt.x + this.player.laserTool.targetBasalt.w / 2
      const basaltCenterY = this.player.laserTool.targetBasalt.y + this.player.laserTool.targetBasalt.h / 2
      
      // 绘制激光束
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5]) // 虚线效果
      ctx.beginPath()
      ctx.moveTo(playerCenterX, playerCenterY)
      ctx.lineTo(basaltCenterX, basaltCenterY)
      ctx.stroke()
      ctx.setLineDash([]) // 重置虚线
      
      // 绘制激光起点（玩家位置）
      ctx.fillStyle = '#00ff00'
      ctx.beginPath()
      ctx.arc(playerCenterX, playerCenterY, 5, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制激光终点（玄武岩位置）
      ctx.fillStyle = '#ff0000'
      ctx.beginPath()
      ctx.arc(basaltCenterX, basaltCenterY, 8, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制挖取进度条
      const progress = this.player.laserTool.miningProgress / this.player.laserTool.miningTime
      const progressBarWidth = 60
      const progressBarHeight = 8
      const progressBarX = basaltCenterX - progressBarWidth / 2
      const progressBarY = basaltCenterY - 20
      
      // 进度条背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 进度条前景
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight)
      
      // 进度条边框
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 显示挖取时间
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `${Math.ceil((this.player.laserTool.miningTime - this.player.laserTool.miningProgress) / 1000)}秒`, 
        basaltCenterX, 
        progressBarY - 5
      )
    },
    
    drawTraps(ctx) {
      const now = performance.now()
      
      // 绘制激光效果
      this.drawLaserEffect(ctx)
      
      // 绘制可见的钛铁矿
      this.visibleIlmeniteOres.forEach(ore => {
        if (ore.mined || !ore.visible) return
        
        const centerX = ore.x + ore.w / 2
        const centerY = ore.y + ore.h / 2
        
        // 检查是否在视口内
        const viewportLeft = -this.viewportOffset.x
        const viewportRight = -this.viewportOffset.x + this.canvasWidth
        const viewportTop = -this.viewportOffset.y
        const viewportBottom = -this.viewportOffset.y + this.canvasHeight
        
        if (centerX < viewportLeft || centerX > viewportRight ||
            centerY < viewportTop || centerY > viewportBottom) {
          return // 不在视口内，不绘制
        }
        
        // 绘制钛铁矿（深灰色金属质感）
        // 主体
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, ore.w / 2)
        gradient.addColorStop(0, '#8b7355') // 内部较亮
        gradient.addColorStop(0.5, '#5a4a3a') // 中间
        gradient.addColorStop(1, '#3a2f25') // 外部较暗
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, ore.w / 2, ore.h / 2, 0, 0, Math.PI * 2)
        ctx.fill()
        
        // 高光
        ctx.fillStyle = 'rgba(200, 180, 160, 0.4)'
        ctx.beginPath()
        ctx.ellipse(centerX - ore.w / 6, centerY - ore.h / 6, ore.w / 4, ore.h / 4, 0, 0, Math.PI * 2)
        ctx.fill()
        
        // 边框
        ctx.strokeStyle = '#2a1f18'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, ore.w / 2, ore.h / 2, 0, 0, Math.PI * 2)
        ctx.stroke()
        
        // 绘制闪烁提示（表示已扫描到）
        const pulseAlpha = 0.3 + Math.sin(now / 300) * 0.2
        ctx.fillStyle = `rgba(255, 200, 100, ${pulseAlpha})`
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, ore.w / 2 + 5, ore.h / 2 + 5, 0, 0, Math.PI * 2)
        ctx.fill()
      })
      
      this.traps.forEach(tp => {
        if (tp.type === 'spike') {
          // 绘制地刺（一排小三角）
          const triW = 12, triH = Math.min(16, tp.h)
          for (let x = tp.x; x < tp.x + tp.w; x += triW) {
            ctx.fillStyle = '#cc3333'
            ctx.beginPath()
            ctx.moveTo(x, this.groundY)
            ctx.lineTo(x + triW / 2, this.groundY - triH)
            ctx.lineTo(x + triW, this.groundY)
            ctx.closePath()
            ctx.fill()
          }
        } else if (tp.type === 'basalt') {
          // 绘制尖状玄武岩突起（使用更明显的深灰蓝色，区别于地面）
          // 玄武岩主体颜色：深灰蓝色，比地面颜色更深更明显
          ctx.fillStyle = '#2a2a3a'
          
          // 先绘制玄武岩主体矩形（作为基础）
          ctx.fillRect(tp.x, tp.y, tp.w, tp.h)
          
          // 创建多个尖状突起
          const spikeCount = Math.max(3, Math.floor(tp.w / 30))
          const spikeWidth = tp.w / spikeCount
          
          for (let i = 0; i < spikeCount; i++) {
            const spikeX = tp.x + i * spikeWidth
            const spikeHeight = 8 + Math.sin((now / 500 + i) * 0.5) * 4 // 动态高度变化
            
            // 绘制尖状三角形（深灰蓝色）
            ctx.fillStyle = '#2a2a3a'
            ctx.beginPath()
            ctx.moveTo(spikeX, tp.y)
            ctx.lineTo(spikeX + spikeWidth / 2, tp.y - spikeHeight)
            ctx.lineTo(spikeX + spikeWidth, tp.y)
            ctx.closePath()
            ctx.fill()
            
            // 添加尖顶高光效果（浅灰蓝色，增加立体感）
            ctx.fillStyle = 'rgba(120, 120, 150, 0.4)'
            ctx.beginPath()
            ctx.moveTo(spikeX + spikeWidth / 4, tp.y - spikeHeight * 0.3)
            ctx.lineTo(spikeX + spikeWidth / 2, tp.y - spikeHeight * 0.9)
            ctx.lineTo(spikeX + spikeWidth * 3/4, tp.y - spikeHeight * 0.3)
            ctx.closePath()
            ctx.fill()
            
            // 添加边缘轮廓（深色，增加可见性）
            ctx.strokeStyle = '#1a1a2a'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(spikeX, tp.y)
            ctx.lineTo(spikeX + spikeWidth / 2, tp.y - spikeHeight)
            ctx.lineTo(spikeX + spikeWidth, tp.y)
            ctx.stroke()
          }
        } else if (tp.type === 'bird') {
          // 绘制飞鸟
          ctx.fillStyle = '#333'
          ctx.fillRect(tp.x, tp.y, tp.w, tp.h)
          // 鸟眼睛
          ctx.fillStyle = '#fff'
          ctx.fillRect(tp.x + tp.w * 0.6, tp.y + tp.h * 0.2, tp.w * 0.25, tp.h * 0.25)
        } else if (tp.type === 'spike_storm') {
          // 绘制风暴洋尖刺陷阱（向上）
          const triW = Math.max(8, tp.w / Math.floor(tp.w / 12))
          const triH = Math.min(tp.h, 30)
          for (let x = tp.x; x < tp.x + tp.w; x += triW) {
            ctx.fillStyle = '#c0392b'
            ctx.beginPath()
            ctx.moveTo(x, tp.y + tp.h)
            ctx.lineTo(x + triW / 2, tp.y + tp.h - triH)
            ctx.lineTo(x + triW, tp.y + tp.h)
            ctx.closePath()
            ctx.fill()
            // 高光
            ctx.fillStyle = 'rgba(255, 100, 100, 0.5)'
            ctx.beginPath()
            ctx.moveTo(x + triW / 4, tp.y + tp.h - triH * 0.3)
            ctx.lineTo(x + triW / 2, tp.y + tp.h - triH * 0.9)
            ctx.lineTo(x + triW * 3/4, tp.y + tp.h - triH * 0.3)
            ctx.closePath()
            ctx.fill()
          }
        } else if (tp.type === 'moving_damage') {
          // 绘制移动伤害陷阱（红色方块，闪烁）
          const trapNow = performance.now() / 1000
          const pulse = Math.sin(trapNow * 5) * 0.3 + 0.7
          ctx.fillStyle = `rgba(231, 76, 60, ${pulse})`
          ctx.fillRect(tp.x, tp.y, tp.w, tp.h)
          // 边框
          ctx.strokeStyle = '#c0392b'
          ctx.lineWidth = 2
          ctx.strokeRect(tp.x, tp.y, tp.w, tp.h)
          // 危险符号
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 16px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('⚠', tp.x + tp.w / 2, tp.y + tp.h / 2)
        } else if (tp.type === 'falling_rock') {
          // 绘制落石陷阱
          if (!tp.active) {
            // 未激活时显示警告
            const trapNow = performance.now() / 1000
            const pulse = Math.sin(trapNow * 3) * 0.5 + 0.5
            ctx.fillStyle = `rgba(127, 140, 141, ${pulse * 0.5})`
            ctx.fillRect(tp.x, tp.y, tp.w, tp.h)
            ctx.strokeStyle = '#95a5a6'
            ctx.lineWidth = 1
            ctx.strokeRect(tp.x, tp.y, tp.w, tp.h)
          } else {
            // 激活时显示落石
            ctx.fillStyle = '#7f8c8d'
            ctx.fillRect(tp.x, tp.y, tp.w, tp.h)
            // 阴影
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
            ctx.fillRect(tp.x + 2, tp.y + 2, tp.w, tp.h)
            // 高光
            ctx.fillStyle = 'rgba(200, 200, 200, 0.3)'
            ctx.fillRect(tp.x, tp.y, tp.w * 0.3, tp.h * 0.3)
            // 边框
            ctx.strokeStyle = '#5a5a5a'
            ctx.lineWidth = 2
            ctx.strokeRect(tp.x, tp.y, tp.w, tp.h)
          }
        } else if (tp.type === 'electric') {
          // 绘制电击陷阱
          const pulse = Math.sin(tp.pulsePhase) * 0.5 + 0.5
          if (tp.active) {
            // 激活时闪烁
            ctx.fillStyle = `rgba(243, 156, 18, ${pulse})`
            ctx.fillRect(tp.x, tp.y, tp.w, tp.h)
            // 电击效果
            ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.moveTo(tp.x + tp.w / 2, tp.y)
            ctx.lineTo(tp.x + tp.w / 3, tp.y + tp.h / 2)
            ctx.lineTo(tp.x + tp.w * 2/3, tp.y + tp.h / 2)
            ctx.lineTo(tp.x + tp.w / 2, tp.y + tp.h)
            ctx.stroke()
          } else {
            // 未激活时显示充能状态
            ctx.fillStyle = `rgba(243, 156, 18, ${0.3 + pulse * 0.2})`
            ctx.fillRect(tp.x, tp.y, tp.w, tp.h)
          }
          // 边框
          ctx.strokeStyle = '#f39c12'
          ctx.lineWidth = 2
          ctx.strokeRect(tp.x, tp.y, tp.w, tp.h)
        }
      })
    },
    
    // 绘制废弃飞船碎片
    drawShipDebris(ctx, debris) {
      const x = debris.x
      const y = debris.y
      const w = Math.max(1, debris.w) // 确保宽度至少为1
      const h = Math.max(1, debris.h) // 确保高度至少为1
      
      // 如果尺寸太小，直接返回，不绘制
      if (w < 5 || h < 5) {
        return
      }
      
      // 使用碎片位置作为种子，确保每次绘制一致
      const seed = Math.abs(Math.floor(Math.abs(x) * 0.1) + Math.floor(Math.abs(y) * 0.1))
      const rng = this.seededRandom(seed)
      
      // 确保随机数生成器返回有效的0-1之间的值
      const safeRng = () => {
        const val = rng()
        // 确保返回值在0-1之间
        return Math.max(0, Math.min(1, val))
      }
      
      // 碎片形状（不规则，模拟破损）
      const shapeType = Math.floor(safeRng() * 3) // 0-2，三种形状
      
      // 金属底色（银色/灰色）
      const baseColor = '#5a5a5a'
      const highlightColor = '#8a8a8a'
      const darkColor = '#3a3a3a'
      const rustColor = '#8b4513'
      
      ctx.save()
      
      // 绘制碎片主体（带不规则边缘）
      if (shapeType === 0) {
        // 矩形碎片（带破损角）
        const damageX1 = safeRng() * w * 0.3
        const damageY1 = safeRng() * h * 0.3
        const damageX2 = w - safeRng() * w * 0.3
        const damageY2 = h - safeRng() * h * 0.3
        
        // 主体
        ctx.fillStyle = baseColor
        ctx.beginPath()
        ctx.moveTo(x + damageX1, y)
        ctx.lineTo(x + w - damageX1 * 0.5, y)
        ctx.lineTo(x + w, y + damageY1)
        ctx.lineTo(x + w, y + h - damageY2)
        ctx.lineTo(x + w - damageX2 * 0.5, y + h)
        ctx.lineTo(x + damageX2, y + h)
        ctx.lineTo(x, y + h - damageY2)
        ctx.lineTo(x, y + damageY1)
        ctx.closePath()
        ctx.fill()
      } else if (shapeType === 1) {
        // 梯形碎片（一侧倾斜）
        ctx.fillStyle = baseColor
        ctx.beginPath()
        ctx.moveTo(x + w * 0.2, y)
        ctx.lineTo(x + w, y + h * 0.1)
        ctx.lineTo(x + w, y + h)
        ctx.lineTo(x, y + h)
        ctx.lineTo(x, y + h * 0.1)
        ctx.closePath()
        ctx.fill()
      } else {
        // 不规则多边形碎片
        ctx.fillStyle = baseColor
        ctx.beginPath()
        ctx.moveTo(x + w * 0.1, y)
        ctx.lineTo(x + w * 0.7, y)
        ctx.lineTo(x + w, y + h * 0.3)
        ctx.lineTo(x + w * 0.9, y + h)
        ctx.lineTo(x + w * 0.3, y + h)
        ctx.lineTo(x, y + h * 0.7)
        ctx.closePath()
        ctx.fill()
      }
      
      // 添加金属高光
      const gradient = ctx.createLinearGradient(x, y, x + w, y + h)
      gradient.addColorStop(0, highlightColor)
      gradient.addColorStop(0.5, baseColor)
      gradient.addColorStop(1, darkColor)
      ctx.fillStyle = gradient
      ctx.globalAlpha = 0.6
      ctx.fill()
      ctx.globalAlpha = 1.0
      
      // 绘制结构线条（模拟飞船面板）
      ctx.strokeStyle = 'rgba(100, 100, 120, 0.8)'
      ctx.lineWidth = 1
      // 水平线条
      for (let i = 1; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(x + w * 0.1, y + (h * i / 3))
        ctx.lineTo(x + w * 0.9, y + (h * i / 3))
        ctx.stroke()
      }
      // 垂直线条
      for (let i = 1; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(x + (w * i / 3), y + h * 0.1)
        ctx.lineTo(x + (w * i / 3), y + h * 0.9)
        ctx.stroke()
      }
      
      // 添加破损和锈迹
      ctx.fillStyle = rustColor
      ctx.globalAlpha = 0.4
      // 随机锈迹点
      for (let i = 0; i < 3; i++) {
        const rustX = x + safeRng() * w
        const rustY = y + safeRng() * h
        const rustSize = Math.max(1, 3 + safeRng() * 5) // 确保半径至少为1
        if (rustSize > 0) {
          ctx.beginPath()
          ctx.arc(rustX, rustY, rustSize, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1.0
      
      // 添加小窗口或指示灯（偶尔）
      if (safeRng() < 0.3) {
        const windowX = x + w * 0.3 + safeRng() * w * 0.4
        const windowY = y + h * 0.3 + safeRng() * h * 0.4
        const windowSize = Math.max(2, 4 + safeRng() * 4) // 确保窗口大小至少为2
        
        // 窗口（深色）
        if (windowSize > 0) {
          ctx.fillStyle = '#1a1a2e'
          ctx.beginPath()
          ctx.arc(windowX, windowY, windowSize, 0, Math.PI * 2)
          ctx.fill()
          
          // 窗口高光
          const highlightSize = Math.max(1, windowSize * 0.5) // 确保高光半径至少为1
          if (highlightSize > 0) {
            ctx.fillStyle = 'rgba(100, 150, 200, 0.3)'
            ctx.beginPath()
            ctx.arc(windowX - windowSize * 0.3, windowY - windowSize * 0.3, highlightSize, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
      
      // 添加边缘高光（模拟金属边缘）
      ctx.strokeStyle = 'rgba(200, 200, 220, 0.6)'
      ctx.lineWidth = 1.5
      // 重新绘制边缘
      ctx.beginPath()
      if (shapeType === 0) {
        const damageX1 = safeRng() * w * 0.3
        const damageY1 = safeRng() * h * 0.3
        const damageX2 = w - safeRng() * w * 0.3
        const damageY2 = h - safeRng() * h * 0.3
        ctx.moveTo(x + damageX1, y)
        ctx.lineTo(x + w - damageX1 * 0.5, y)
        ctx.lineTo(x + w, y + damageY1)
        ctx.lineTo(x + w, y + h - damageY2)
        ctx.lineTo(x + w - damageX2 * 0.5, y + h)
        ctx.lineTo(x + damageX2, y + h)
        ctx.lineTo(x, y + h - damageY2)
        ctx.lineTo(x, y + damageY1)
        ctx.closePath()
      } else if (shapeType === 1) {
        ctx.moveTo(x + w * 0.2, y)
        ctx.lineTo(x + w, y + h * 0.1)
        ctx.lineTo(x + w, y + h)
        ctx.lineTo(x, y + h)
        ctx.lineTo(x, y + h * 0.1)
        ctx.closePath()
      } else {
        ctx.moveTo(x + w * 0.1, y)
        ctx.lineTo(x + w * 0.7, y)
        ctx.lineTo(x + w, y + h * 0.3)
        ctx.lineTo(x + w * 0.9, y + h)
        ctx.lineTo(x + w * 0.3, y + h)
        ctx.lineTo(x, y + h * 0.7)
        ctx.closePath()
      }
      ctx.stroke()
      
      // 添加破损边缘细节
      ctx.strokeStyle = darkColor
      ctx.lineWidth = 2
      // 在边缘添加一些破损线条
      for (let i = 0; i < 2; i++) {
        const edgeX = x + (safeRng() < 0.5 ? 0 : w)
        const edgeY = y + safeRng() * h
        const edgeLength = Math.max(3, 5 + safeRng() * 8) // 确保长度至少为3
        ctx.beginPath()
        if (safeRng() < 0.5) {
          // 水平破损
          ctx.moveTo(edgeX, edgeY)
          ctx.lineTo(edgeX + (edgeX === x ? edgeLength : -edgeLength), edgeY)
        } else {
          // 垂直破损
          ctx.moveTo(edgeX, edgeY)
          ctx.lineTo(edgeX, edgeY + edgeLength)
        }
        ctx.stroke()
      }
      
      ctx.restore()
    },
    
    // 新增方法：绘制掉落物
    drawDrops(ctx) {
      this.player.drops.forEach(drop => {
        // 跳过已收集的掉落物
        if (drop.collected) return
        
        // 绘制掉落物背景（闪烁效果）
        const time = performance.now()
        const pulse = Math.sin(time * 0.01) * 0.3 + 0.7 // 闪烁效果
        
        // 掉落物背景（圆形）
        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 * pulse})`
        ctx.beginPath()
        ctx.arc(drop.x + drop.w/2, drop.y + drop.h/2, drop.w/2, 0, Math.PI * 2)
        ctx.fill()
        
        // 掉落物边框
        ctx.strokeStyle = '#ffd700'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(drop.x + drop.w/2, drop.y + drop.h/2, drop.w/2, 0, Math.PI * 2)
        ctx.stroke()
        
        // 掉落物图标
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(drop.icon, drop.x + drop.w/2, drop.y + drop.h/2)
        
        // 掉落物名称
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px Arial'
        ctx.fillText(drop.name, drop.x + drop.w/2, drop.y + drop.h + 12)
      })
    },
    
    // 新增方法：绘制掉落物
    drawDrops(ctx) {
      this.player.drops.forEach(drop => {
        // 跳过已收集的掉落物
        if (drop.collected) return
        
        // 绘制掉落物背景（闪烁效果）
        const time = performance.now()
        const pulse = Math.sin(time * 0.01) * 0.3 + 0.7 // 闪烁效果
        
        // 掉落物背景（圆形）
        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 * pulse})`
        ctx.beginPath()
        ctx.arc(drop.x + drop.w/2, drop.y + drop.h/2, drop.w/2, 0, Math.PI * 2)
        ctx.fill()
        
        // 掉落物边框
        ctx.strokeStyle = '#ffd700'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(drop.x + drop.w/2, drop.y + drop.h/2, drop.w/2, 0, Math.PI * 2)
        ctx.stroke()
        
        // 掉落物图标
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(drop.icon, drop.x + drop.w/2, drop.y + drop.h/2)
        
        // 掉落物名称
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px Arial'
        ctx.fillText(drop.name, drop.x + drop.w/2, drop.y + drop.h + 12)
      })
    },
    
    // 绘制激光效果
    drawLaserEffect(ctx) {
      if (!this.player.laserTool.isActive || !this.player.laserTool.targetBasalt) return
      
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      const basaltCenterX = this.player.laserTool.targetBasalt.x + this.player.laserTool.targetBasalt.w / 2
      const basaltCenterY = this.player.laserTool.targetBasalt.y + this.player.laserTool.targetBasalt.h / 2
      
      // 绘制激光束
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5]) // 虚线效果
      ctx.beginPath()
      ctx.moveTo(playerCenterX, playerCenterY)
      ctx.lineTo(basaltCenterX, basaltCenterY)
      ctx.stroke()
      ctx.setLineDash([]) // 重置虚线
      
      // 绘制激光起点（玩家位置）
      ctx.fillStyle = '#00ff00'
      ctx.beginPath()
      ctx.arc(playerCenterX, playerCenterY, 5, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制激光终点（玄武岩位置）
      ctx.fillStyle = '#ff0000'
      ctx.beginPath()
      ctx.arc(basaltCenterX, basaltCenterY, 8, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制挖取进度条
      const progress = this.player.laserTool.miningProgress / this.player.laserTool.miningTime
      const progressBarWidth = 60
      const progressBarHeight = 8
      const progressBarX = basaltCenterX - progressBarWidth / 2
      const progressBarY = basaltCenterY - 20
      
      // 进度条背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 进度条前景
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight)
      
      // 进度条边框
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 显示挖取时间
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `${Math.ceil((this.player.laserTool.miningTime - this.player.laserTool.miningProgress) / 1000)}秒`, 
        basaltCenterX, 
        progressBarY - 5
      )
    },
    
    // 绘制激光效果
    drawLaserEffect(ctx) {
      if (!this.player.laserTool.isActive || !this.player.laserTool.targetBasalt) return
      
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      const basaltCenterX = this.player.laserTool.targetBasalt.x + this.player.laserTool.targetBasalt.w / 2
      const basaltCenterY = this.player.laserTool.targetBasalt.y + this.player.laserTool.targetBasalt.h / 2
      
      // 绘制激光束
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5]) // 虚线效果
      ctx.beginPath()
      ctx.moveTo(playerCenterX, playerCenterY)
      ctx.lineTo(basaltCenterX, basaltCenterY)
      ctx.stroke()
      ctx.setLineDash([]) // 重置虚线
      
      // 绘制激光起点（玩家位置）
      ctx.fillStyle = '#00ff00'
      ctx.beginPath()
      ctx.arc(playerCenterX, playerCenterY, 5, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制激光终点（玄武岩位置）
      ctx.fillStyle = '#ff0000'
      ctx.beginPath()
      ctx.arc(basaltCenterX, basaltCenterY, 8, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制挖取进度条
      const progress = this.player.laserTool.miningProgress / this.player.laserTool.miningTime
      const progressBarWidth = 60
      const progressBarHeight = 8
      const progressBarX = basaltCenterX - progressBarWidth / 2
      const progressBarY = basaltCenterY - 20
      
      // 进度条背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 进度条前景
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight)
      
      // 进度条边框
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 显示挖取时间
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `${Math.ceil((this.player.laserTool.miningTime - this.player.laserTool.miningProgress) / 1000)}秒`, 
        basaltCenterX, 
        progressBarY - 5
      )
    },
    
    drawAbandonedShip() {
      const ship = this.ship
      const ctx = this.ctx
      const now = performance.now()
      
      // 基地阴影效果
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 20
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 10
      
      // 创建飞船主体渐变效果 - 更现代化的白灰色调
      const shipGradient = ctx.createLinearGradient(
        ship.x, ship.y,
        ship.x + ship.w, ship.y + ship.h
      )
      shipGradient.addColorStop(0, '#e8e8e8')
      shipGradient.addColorStop(0.3, '#d0d0d0')
      shipGradient.addColorStop(0.7, '#b8b8b8')
      shipGradient.addColorStop(1, '#a0a0a0')
      
      // 飞船主体 - 使用渐变和圆角效果
      ctx.fillStyle = shipGradient
      this.drawRoundedRect(ctx, ship.x, ship.y, ship.w, ship.h, 15)
      
      // 重置阴影
      ctx.shadowBlur = 0
      
      // 飞船金属边框 - 更亮的银色
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 4
      this.drawRoundedRect(ctx, ship.x, ship.y, ship.w, ship.h, 15)
      
      // 内边框 - 增强层次感
      ctx.strokeStyle = 'rgba(100, 150, 200, 0.6)'
      ctx.lineWidth = 2
      this.drawRoundedRect(ctx, ship.x + 2, ship.y + 2, ship.w - 4, ship.h - 4, 12)
      
      // 飞船装饰条纹 - 科技感蓝色
      const stripeGradient = ctx.createLinearGradient(
        ship.x + 10, ship.y + 10,
        ship.x + ship.w - 10, ship.y + 15
      )
      stripeGradient.addColorStop(0, '#64b5f6')
      stripeGradient.addColorStop(0.5, '#42a5f5')
      stripeGradient.addColorStop(1, '#2196f3')
      ctx.fillStyle = stripeGradient
      ctx.fillRect(ship.x + 10, ship.y + 10, ship.w - 20, 5)
      
      // 底部装饰条
      const bottomStripeGradient = ctx.createLinearGradient(
        ship.x + 10, ship.y + ship.h - 15,
        ship.x + ship.w - 10, ship.y + ship.h - 10
      )
      bottomStripeGradient.addColorStop(0, '#64b5f6')
      bottomStripeGradient.addColorStop(0.5, '#42a5f5')
      bottomStripeGradient.addColorStop(1, '#2196f3')
      ctx.fillStyle = bottomStripeGradient
      ctx.fillRect(ship.x + 10, ship.y + ship.h - 15, ship.w - 20, 5)
      
      // 添加金属质感纹理
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(ship.x + 15 + i * 30, ship.y + 20, 25, 2)
      }
      
      // 飞船窗户 - 增强效果，更现代化的设计
      for (let i = 0; i < 3; i++) {
        const windowX = ship.x + 20 + i * 40
        const windowY = ship.y + 30
        
        // 窗户外框 - 银色金属框
        ctx.fillStyle = '#c0c0c0'
        ctx.fillRect(windowX - 3, windowY - 3, 26, 26)
        
        // 窗户内框 - 深灰色
        ctx.fillStyle = '#505050'
        ctx.fillRect(windowX - 1, windowY - 1, 22, 22)
        
        // 窗户玻璃 - 添加发光效果和内部灯光
        const windowGradient = ctx.createRadialGradient(
          windowX + 10, windowY + 10, 0,
          windowX + 10, windowY + 10, 12
        )
        windowGradient.addColorStop(0, '#87ceeb')
        windowGradient.addColorStop(0.5, '#5dade2')
        windowGradient.addColorStop(1, '#3498db')
        ctx.fillStyle = windowGradient
        ctx.fillRect(windowX, windowY, 20, 20)
        
        // 窗户内部灯光 - 动态效果
        const lightAlpha = 0.7 + Math.sin(now / 800 + i * 0.5) * 0.2
        ctx.fillStyle = `rgba(255, 255, 255, ${lightAlpha})`
        ctx.fillRect(windowX + 3, windowY + 3, 14, 14)
        
        // 窗户反光高光 - 动态效果
        const reflectionAlpha = 0.4 + Math.sin(now / 1200 + i) * 0.3
        ctx.fillStyle = `rgba(255, 255, 255, ${reflectionAlpha})`
        ctx.beginPath()
        ctx.moveTo(windowX + 5, windowY + 5)
        ctx.lineTo(windowX + 12, windowY + 5)
        ctx.lineTo(windowX + 5, windowY + 12)
        ctx.closePath()
        ctx.fill()
        
        // 窗户分割线（模拟多格窗户）
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(windowX + 10, windowY)
        ctx.lineTo(windowX + 10, windowY + 20)
        ctx.moveTo(windowX, windowY + 10)
        ctx.lineTo(windowX + 20, windowY + 10)
        ctx.stroke()
      }
      
      // 飞船顶部天线 - 更现代化的设计
      const antennaGradient = ctx.createLinearGradient(
        ship.x + ship.w/2 - 3, ship.y - 20,
        ship.x + ship.w/2 + 3, ship.y - 5
      )
      antennaGradient.addColorStop(0, '#e0e0e0')
      antennaGradient.addColorStop(1, '#b0b0b0')
      ctx.fillStyle = antennaGradient
      ctx.fillRect(ship.x + ship.w/2 - 3, ship.y - 20, 6, 20)
      
      // 天线球体 - 发光效果
      const antennaGlow = ctx.createRadialGradient(
        ship.x + ship.w/2, ship.y - 25, 0,
        ship.x + ship.w/2, ship.y - 25, 12
      )
      antennaGlow.addColorStop(0, 'rgba(100, 200, 255, 0.8)')
      antennaGlow.addColorStop(0.5, 'rgba(100, 200, 255, 0.4)')
      antennaGlow.addColorStop(1, 'rgba(100, 200, 255, 0)')
      ctx.fillStyle = antennaGlow
      ctx.beginPath()
      ctx.arc(ship.x + ship.w/2, ship.y - 25, 12, 0, Math.PI * 2)
      ctx.fill()
      
      // 天线球体主体
      const antennaBallGradient = ctx.createRadialGradient(
        ship.x + ship.w/2, ship.y - 25, 0,
        ship.x + ship.w/2, ship.y - 25, 10
      )
      antennaBallGradient.addColorStop(0, '#ffffff')
      antennaBallGradient.addColorStop(0.5, '#64b5f6')
      antennaBallGradient.addColorStop(1, '#1976d2')
      ctx.fillStyle = antennaBallGradient
      ctx.beginPath()
      ctx.arc(ship.x + ship.w/2, ship.y - 25, 10, 0, Math.PI * 2)
      ctx.fill()
      
      // 天线顶部发光点
      const pulseAlpha = 0.5 + Math.sin(now / 500) * 0.5
      ctx.fillStyle = `rgba(100, 200, 255, ${pulseAlpha})`
      ctx.beginPath()
      ctx.arc(ship.x + ship.w/2, ship.y - 25, 4, 0, Math.PI * 2)
      ctx.fill()
      
      // 舱门 - 更现实的设计
      const doorHeight = 45
      const doorWidth = 35
      const doorOffset = (ship.doorProgress / 100) * doorHeight
      
      // 舱门外框 - 银色金属边框
      ctx.fillStyle = '#d0d0d0'
      ctx.fillRect(
        ship.x + ship.w/2 - doorWidth/2 - 3, 
        ship.y + ship.h - doorHeight - doorOffset - 8, 
        doorWidth + 6, 
        doorHeight + 8
      )
      
      // 舱门内框 - 深灰色
      ctx.fillStyle = '#707070'
      ctx.fillRect(
        ship.x + ship.w/2 - doorWidth/2 - 1, 
        ship.y + ship.h - doorHeight - doorOffset - 6, 
        doorWidth + 2, 
        doorHeight + 6
      )
      
      // 舱门主体 - 金属质感
      const doorGradient = ctx.createLinearGradient(
        ship.x + ship.w/2 - doorWidth/2, 
        ship.y + ship.h - doorHeight - doorOffset,
        ship.x + ship.w/2 + doorWidth/2, 
        ship.y + ship.h - doorOffset
      )
      doorGradient.addColorStop(0, '#b8b8b8')
      doorGradient.addColorStop(0.5, '#909090')
      doorGradient.addColorStop(1, '#686868')
      ctx.fillStyle = doorGradient
      ctx.fillRect(
        ship.x + ship.w/2 - doorWidth/2,
        ship.y + ship.h - doorHeight - doorOffset,
        doorWidth,
        doorHeight
      )
      
      // 舱门把手 - 现代设计
      ctx.fillStyle = '#64b5f6'
      ctx.fillRect(
        ship.x + ship.w/2 - 3, 
        ship.y + ship.h - doorHeight/2 - doorOffset - 6, 
        6, 
        12
      )
      
      // 把手发光效果
      ctx.shadowColor = 'rgba(100, 181, 246, 0.8)'
      ctx.shadowBlur = 8
      ctx.fillRect(
        ship.x + ship.w/2 - 3, 
        ship.y + ship.h - doorHeight/2 - doorOffset - 6, 
        6, 
        12
      )
      ctx.shadowBlur = 0
      
      // 舱门边缘高光
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.lineWidth = 2
      ctx.strokeRect(
        ship.x + ship.w/2 - doorWidth/2 + 1,
        ship.y + ship.h - doorHeight - doorOffset + 1,
        doorWidth - 2,
        doorHeight - 2
      )
      
      // 舱门内部灯光效果（当门打开时）
      if (ship.doorProgress > 50) {
        const doorLightAlpha = (ship.doorProgress / 100) * 0.4
        ctx.fillStyle = `rgba(255, 255, 255, ${doorLightAlpha})`
        ctx.fillRect(
          ship.x + ship.w/2 - doorWidth/2 + 5,
          ship.y + ship.h - doorHeight - doorOffset + 5,
          doorWidth - 10,
          doorHeight - 10
        )
      }
      
      // 飞船底部支架 - 更现实的着陆支架
      const legGradient = ctx.createLinearGradient(
        ship.x, ship.y + ship.h,
        ship.x, ship.y + ship.h + 20
      )
      legGradient.addColorStop(0, '#c0c0c0')
      legGradient.addColorStop(0.5, '#909090')
      legGradient.addColorStop(1, '#606060')
      ctx.fillStyle = legGradient
      
      // 三个着陆支架
      for (let i = 0; i < 3; i++) {
        const legX = ship.x + 30 + i * 60
        
        // 支架主体 - 圆柱形
        ctx.fillRect(legX - 4, ship.y + ship.h, 8, 20)
        
        // 支架细节 - 金属环
      ctx.fillStyle = '#ffffff'
        ctx.fillRect(legX - 5, ship.y + ship.h + 5, 10, 2)
        ctx.fillRect(legX - 5, ship.y + ship.h + 15, 10, 2)
        ctx.fillStyle = legGradient
        
        // 支架底座 - 着陆垫
        const baseGradient = ctx.createRadialGradient(
          legX, ship.y + ship.h + 20, 0,
          legX, ship.y + ship.h + 20, 12
        )
        baseGradient.addColorStop(0, '#808080')
        baseGradient.addColorStop(1, '#404040')
        ctx.fillStyle = baseGradient
        ctx.beginPath()
        ctx.arc(legX, ship.y + ship.h + 20, 12, 0, Math.PI * 2)
        ctx.fill()
        
        // 底座阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 5
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 2
        ctx.beginPath()
        ctx.arc(legX, ship.y + ship.h + 20, 12, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
      
      // 飞船周围的光环效果 - 更柔和
      if (ship.doorOpen) {
        const glowAlpha = 0.2 + Math.sin(now / 600) * 0.15
        ctx.strokeStyle = `rgba(100, 181, 246, ${glowAlpha})`
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.arc(ship.x + ship.w/2, ship.y + ship.h/2, ship.w/2 + 15, 0, Math.PI * 2)
        ctx.stroke()
        
        // 内圈光环
        ctx.strokeStyle = `rgba(100, 181, 246, ${glowAlpha * 0.5})`
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(ship.x + ship.w/2, ship.y + ship.h/2, ship.w/2 + 10, 0, Math.PI * 2)
        ctx.stroke()
      }
      
      // 基地标识牌 - 更现实的设计
      const signWidth = 100
      const signHeight = 30
      const signX = ship.x + ship.w/2 - signWidth/2
      const signY = ship.y - 45
      
      // 标识牌背景
      const signGradient = ctx.createLinearGradient(
        signX, signY,
        signX + signWidth, signY + signHeight
      )
      signGradient.addColorStop(0, '#ffffff')
      signGradient.addColorStop(0.5, '#e0e0e0')
      signGradient.addColorStop(1, '#c0c0c0')
      ctx.fillStyle = signGradient
      this.drawRoundedRect(ctx, signX, signY, signWidth, signHeight, 5)
      
      // 标识牌边框
      ctx.strokeStyle = '#64b5f6'
      ctx.lineWidth = 2
      this.drawRoundedRect(ctx, signX, signY, signWidth, signHeight, 5)
      
      // 标识牌文字
      ctx.fillStyle = '#1976d2'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('月球基地', ship.x + ship.w/2, signY + signHeight/2)
      
      // 标识牌装饰线
      ctx.strokeStyle = '#64b5f6'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(signX + 10, signY + 5)
      ctx.lineTo(signX + signWidth - 10, signY + 5)
      ctx.moveTo(signX + 10, signY + signHeight - 5)
      ctx.lineTo(signX + signWidth - 10, signY + signHeight - 5)
      ctx.stroke()
      
      // 基地标识牌支撑杆
      ctx.fillStyle = '#909090'
      ctx.fillRect(ship.x + ship.w/2 - 2, signY + signHeight, 4, 10)
    },
    
    // 绘制基地植物装饰
    drawBasePlants() {
      const ship = this.ship
      const ctx = this.ctx
      const now = performance.now()
      
      // 未来科技植物 - 发光植物
      for (let i = 0; i < 4; i++) {
        const plantX = ship.x + 20 + i * 40
        const plantY = ship.y + ship.h + 10
        
        // 植物发光效果
        const plantAlpha = 0.6 + Math.sin(now / 600 + i) * 0.3
        const plantGradient = ctx.createRadialGradient(
          plantX, plantY, 0,
          plantX, plantY, 20
        )
        plantGradient.addColorStop(0, `rgba(100, 255, 100, ${plantAlpha})`)
        plantGradient.addColorStop(1, 'rgba(100, 255, 100, 0)')
        
        ctx.fillStyle = plantGradient
        ctx.beginPath()
        ctx.arc(plantX, plantY, 20, 0, Math.PI * 2)
        ctx.fill()
        
        // 植物茎
        ctx.fillStyle = '#4CAF50'
        ctx.fillRect(plantX - 2, plantY, 4, 15)
        
        // 植物叶子
        ctx.fillStyle = '#66BB6A'
        ctx.beginPath()
        ctx.ellipse(plantX, plantY - 5, 8, 12, Math.PI/4, 0, Math.PI * 2)
        ctx.fill()
      }
    },
    
    // 绘制基地环境装饰 - 现实风格白灰色调
    drawBaseEnvironment() {
      const ship = this.ship
      const ctx = this.ctx
      const now = performance.now()
      
      // 基地安全区域标识 - 白灰色调
      ctx.fillStyle = 'rgba(200, 200, 210, 0.08)'
      ctx.fillRect(ship.x - 100, ship.y - 50, ship.w + 200, ship.h + 150)
      
      // 安全区域边框 - 银色边框
      ctx.strokeStyle = 'rgba(180, 180, 200, 0.4)'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 4])
      ctx.strokeRect(ship.x - 100, ship.y - 50, ship.w + 200, ship.h + 150)
      ctx.setLineDash([])
      
      // 基地灯光效果 - 白色/淡蓝色灯光
      for (let i = 0; i < 8; i++) {
        const lightX = ship.x - 80 + i * 40
        const lightY = ship.y - 30
        
        // 灯光发光效果 - 白色/淡蓝色
        const lightAlpha = 0.5 + Math.sin(now / 800 + i) * 0.3
        const lightGradient = ctx.createRadialGradient(
          lightX, lightY, 0,
          lightX, lightY, 30
        )
        lightGradient.addColorStop(0, `rgba(255, 255, 255, ${lightAlpha})`)
        lightGradient.addColorStop(0.5, `rgba(200, 220, 255, ${lightAlpha * 0.6})`)
        lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        
        ctx.fillStyle = lightGradient
        ctx.beginPath()
        ctx.arc(lightX, lightY, 30, 0, Math.PI * 2)
        ctx.fill()
        
        // 灯柱 - 银色金属
        const lightPoleGradient = ctx.createLinearGradient(
          lightX - 3, lightY,
          lightX + 3, lightY + 35
        )
        lightPoleGradient.addColorStop(0, '#e0e0e0')
        lightPoleGradient.addColorStop(1, '#a0a0a0')
        ctx.fillStyle = lightPoleGradient
        ctx.fillRect(lightX - 3, lightY, 6, 35)
        
        // 灯头 - 白色发光
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(lightX, lightY, 4, 0, Math.PI * 2)
        ctx.fill()
        
        // 灯头发光效果
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(lightX, lightY, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
      
      // 基地设备
      this.drawBaseEquipment()
      
      // 基地植物装饰（未来科技植物）
      this.drawBasePlants()
      
      // 基地欢迎标语 - 更优雅的样式
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.font = 'bold 18px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(100, 150, 200, 0.5)'
      ctx.shadowBlur = 5
      ctx.fillText('欢迎回家，宇航员！', ship.x + ship.w/2, ship.y - 80)
      ctx.shadowBlur = 0
    },
    
    // 绘制基地设备 - 现实风格白灰色调
    drawBaseEquipment() {
      const ship = this.ship
      const ctx = this.ctx
      const now = performance.now()
      
      // 太阳能板 - 更现实的设计
      const solarX = ship.x - 120
      const solarY = ship.y + 50
      
      // 太阳能板支架 - 银色金属
      const poleGradient = ctx.createLinearGradient(
        solarX + 40, solarY,
        solarX + 44, solarY + 60
      )
      poleGradient.addColorStop(0, '#e0e0e0')
      poleGradient.addColorStop(1, '#a0a0a0')
      ctx.fillStyle = poleGradient
      ctx.fillRect(solarX + 40, solarY, 4, 60)
      
      // 太阳能板主体 - 深蓝色（模拟太阳能板）
      const solarGradient = ctx.createLinearGradient(
        solarX, solarY - 40,
        solarX + 80, solarY
      )
      solarGradient.addColorStop(0, '#1a237e')
      solarGradient.addColorStop(0.3, '#283593')
      solarGradient.addColorStop(0.7, '#3949ab')
      solarGradient.addColorStop(1, '#3f51b5')
      ctx.fillStyle = solarGradient
      ctx.fillRect(solarX, solarY - 40, 80, 40)
      
      // 太阳能板网格线（模拟太阳能电池板）
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.lineWidth = 1
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.moveTo(solarX + i * 20, solarY - 40)
        ctx.lineTo(solarX + i * 20, solarY)
        ctx.stroke()
      }
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(solarX, solarY - 40 + i * 20)
        ctx.lineTo(solarX + 80, solarY - 40 + i * 20)
        ctx.stroke()
      }
      
      // 太阳能板边框 - 银色
      ctx.strokeStyle = '#c0c0c0'
      ctx.lineWidth = 2
      ctx.strokeRect(solarX, solarY - 40, 80, 40)
      
      // 通讯天线 - 更现实的设计
      const antennaX = ship.x + ship.w + 40
      const antennaY = ship.y + 30
      
      // 天线杆 - 银色金属
      const antennaPoleGradient = ctx.createLinearGradient(
        antennaX, antennaY,
        antennaX + 4, antennaY + 80
      )
      antennaPoleGradient.addColorStop(0, '#e0e0e0')
      antennaPoleGradient.addColorStop(1, '#a0a0a0')
      ctx.fillStyle = antennaPoleGradient
      ctx.fillRect(antennaX, antennaY, 4, 80)
      
      // 天线球体 - 白色/银色
      const antennaGradient = ctx.createRadialGradient(
        antennaX + 2, antennaY - 10, 0,
        antennaX + 2, antennaY - 10, 12
      )
      antennaGradient.addColorStop(0, '#ffffff')
      antennaGradient.addColorStop(0.5, '#e0e0e0')
      antennaGradient.addColorStop(1, '#c0c0c0')
      ctx.fillStyle = antennaGradient
      ctx.beginPath()
      ctx.arc(antennaX + 2, antennaY - 10, 12, 0, Math.PI * 2)
      ctx.fill()
      
      // 天线球体高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.beginPath()
      ctx.arc(antennaX + 2 - 3, antennaY - 10 - 3, 4, 0, Math.PI * 2)
      ctx.fill()
      
      // 设备箱 - 白灰色金属箱
      const boxX = ship.x - 60
      const boxY = ship.y + ship.h - 30
      
      // 设备箱主体 - 金属质感
      const boxGradient = ctx.createLinearGradient(
        boxX, boxY,
        boxX + 40, boxY + 25
      )
      boxGradient.addColorStop(0, '#d0d0d0')
      boxGradient.addColorStop(0.5, '#b0b0b0')
      boxGradient.addColorStop(1, '#909090')
      ctx.fillStyle = boxGradient
      ctx.fillRect(boxX, boxY, 40, 25)
      
      // 设备箱边框
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.strokeRect(boxX, boxY, 40, 25)
      
      // 设备箱细节 - 蓝色指示灯
      ctx.fillStyle = '#64b5f6'
      ctx.fillRect(boxX + 5, boxY + 5, 30, 3)
      ctx.fillRect(boxX + 5, boxY + 12, 30, 3)
      ctx.fillRect(boxX + 5, boxY + 19, 30, 3)
      
      // 指示灯发光效果
      const indicatorAlpha = 0.7 + Math.sin(now / 500) * 0.3
      ctx.fillStyle = `rgba(100, 181, 246, ${indicatorAlpha})`
      ctx.fillRect(boxX + 5, boxY + 5, 30, 3)
    },
    
    // 绘制基地植物装饰
    drawBasePlants() {
      const ship = this.ship
      const ctx = this.ctx
      const now = performance.now()
      
      // 未来科技植物 - 发光植物
      for (let i = 0; i < 4; i++) {
        const plantX = ship.x + 20 + i * 40
        const plantY = ship.y + ship.h + 10
        
        // 植物发光效果
        const plantAlpha = 0.6 + Math.sin(now / 600 + i) * 0.3
        const plantGradient = ctx.createRadialGradient(
          plantX, plantY, 0,
          plantX, plantY, 20
        )
        plantGradient.addColorStop(0, `rgba(100, 255, 100, ${plantAlpha})`)
        plantGradient.addColorStop(1, 'rgba(100, 255, 100, 0)')
        
        ctx.fillStyle = plantGradient
        ctx.beginPath()
        ctx.arc(plantX, plantY, 20, 0, Math.PI * 2)
        ctx.fill()
        
        // 植物茎
        ctx.fillStyle = '#4CAF50'
        ctx.fillRect(plantX - 2, plantY, 4, 15)
        
        // 植物叶子
        ctx.fillStyle = '#66BB6A'
        ctx.beginPath()
        ctx.ellipse(plantX, plantY - 5, 8, 12, Math.PI/4, 0, Math.PI * 2)
        ctx.fill()
      }
    },
    
    drawPlayer() {
      const p = this.player
      const ctx = this.ctx
      
      // 计算身体倾斜角度（在整个绘制函数开始时定义，确保在所有地方可用）
      let bodyLean = 0 // 身体倾斜角度
      if (this.player.vx > 0) {
        bodyLean = this.player.isRunning ? Math.PI/18 : Math.PI/24 // 奔跑时倾斜更多
      } else if (this.player.vx < 0) {
        bodyLean = this.player.isRunning ? -Math.PI/18 : -Math.PI/24
      }
      
      if (this.avatarImg) {
        // 绘制头像
        ctx.save()
        const r = 10
        ctx.beginPath()
        ctx.moveTo(p.x + r, p.y)
        ctx.arcTo(p.x + p.w, p.y, p.x + p.w, p.y + p.h, r)
        ctx.arcTo(p.x + p.w, p.y + p.h, p.x, p.y + p.h, r)
        ctx.arcTo(p.x, p.y + p.h, p.x, p.y, r)
        ctx.arcTo(p.x, p.y, p.x + p.w, p.y, r)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(this.avatarImg, p.x, p.y, p.w, p.h)
        ctx.restore()
      } else {
        // 绘制美化版宇航员
        const pixelSize = Math.max(1, Math.min(p.w, p.h) / 16) // 确保 pixelSize 至少为 1
        
        // 创建渐变效果
        const bodyGradient = ctx.createLinearGradient(
          p.x, p.y, 
          p.x + p.w, p.y + p.h
        )
        bodyGradient.addColorStop(0, '#f8f8f8')
        bodyGradient.addColorStop(1, '#e0e0e0')
        
        const helmetGradient = ctx.createLinearGradient(
          p.x, p.y, 
          p.x + p.w, p.y
        )
        helmetGradient.addColorStop(0, '#e3f2fd')
        helmetGradient.addColorStop(1, '#bbdefb')
        
        const backpackGradient = ctx.createLinearGradient(
          p.x, p.y, 
          p.x + p.w, p.y
        )
        backpackGradient.addColorStop(0, '#37474f')
        backpackGradient.addColorStop(1, '#263238')
        
        // 奔跑时的速度线效果（在身体后面绘制）
        if (this.player.isRunning && p.onGround) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
          ctx.lineWidth = 1
          for (let i = 0; i < 4; i++) {
            const lineX = p.vx > 0 ? p.x - i * 12 : p.x + p.w + i * 12
            const lineY = p.y + pixelSize*8 + i * 3
            const lineLength = 8 + i * 2
            ctx.beginPath()
            ctx.moveTo(lineX, lineY)
            ctx.lineTo(lineX + (p.vx > 0 ? -lineLength : lineLength), lineY)
            ctx.stroke()
          }
        }
        
        // 宇航服身体 - 使用渐变（奔跑时稍微倾斜）
        ctx.save()
        if (this.player.isRunning && p.onGround) {
          ctx.translate(p.x + p.w/2, p.y + p.h/2)
          ctx.rotate(bodyLean * 0.5) // 身体稍微倾斜
          ctx.translate(-(p.x + p.w/2), -(p.y + p.h/2))
        }
        
        ctx.fillStyle = bodyGradient
        ctx.fillRect(p.x + pixelSize*3, p.y + pixelSize*3, pixelSize*10, pixelSize*10)
        
        // 身体边框
        ctx.strokeStyle = '#4a5568'
        ctx.lineWidth = 2
        ctx.strokeRect(p.x + pixelSize*3, p.y + pixelSize*3, pixelSize*10, pixelSize*10)
        
        ctx.restore()
        
        // 背包 - 根据移动方向调整位置（在身体倾斜后绘制）
        ctx.save()
        if (this.player.isRunning && p.onGround) {
          ctx.translate(p.x + p.w/2, p.y + p.h/2)
          ctx.rotate(bodyLean * 0.5)
          ctx.translate(-(p.x + p.w/2), -(p.y + p.h/2))
        }
        
        ctx.fillStyle = backpackGradient
        if (this.player.vx < 0) {
          // 向左移动时背包在右侧
          ctx.fillRect(p.x + pixelSize*11, p.y + pixelSize*6, pixelSize*3, pixelSize*6)
          ctx.strokeStyle = '#546e7a'
          ctx.strokeRect(p.x + pixelSize*11, p.y + pixelSize*6, pixelSize*3, pixelSize*6)
        } else {
          // 向右移动或静止时背包在左侧
          ctx.fillRect(p.x + pixelSize*2, p.y + pixelSize*6, pixelSize*3, pixelSize*6)
          ctx.strokeStyle = '#546e7a'
          ctx.strokeRect(p.x + pixelSize*2, p.y + pixelSize*6, pixelSize*3, pixelSize*6)
        }
        
        // 氧气罐 - 使用渐变
        const tankGradient = ctx.createLinearGradient(
          p.x, p.y, 
          p.x, p.y + p.h
        )
        tankGradient.addColorStop(0, '#78909c')
        tankGradient.addColorStop(1, '#607d8b')
        ctx.fillStyle = tankGradient
        ctx.fillRect(p.x + pixelSize*1, p.y + pixelSize*7, pixelSize*1, pixelSize*4)
        ctx.strokeStyle = '#546e7a'
        ctx.strokeRect(p.x + pixelSize*1, p.y + pixelSize*7, pixelSize*1, pixelSize*4)
        
        ctx.restore()
        
        // 头盔 - 使用渐变和动态效果
        ctx.fillStyle = helmetGradient
        ctx.save()
        
        // 动态倾斜效果（奔跑时更明显）
        let rotation = 0
        if (this.player.vx > 0) {
          rotation = Math.PI/24
        } else if (this.player.vx < 0) {
          rotation = -Math.PI/24
        }
        
        ctx.translate(p.x + pixelSize*8, p.y + pixelSize*5)
        ctx.rotate(rotation)
        
        // 头盔主体
        ctx.beginPath()
        ctx.arc(0, 0, pixelSize*5, 0, Math.PI * 2)
        ctx.fill()
        
        // 头盔边框
        ctx.strokeStyle = '#1976d2'
        ctx.lineWidth = 3
        ctx.stroke()
        
        ctx.restore()
        
        // 面罩反光 - 增强效果
        const visorGradient = ctx.createRadialGradient(
          p.x + pixelSize*8, p.y + pixelSize*5, 0,
          p.x + pixelSize*8, p.y + pixelSize*5, pixelSize*4
        )
        visorGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
        visorGradient.addColorStop(1, 'rgba(200, 230, 255, 0.3)')
        
        ctx.fillStyle = visorGradient
        ctx.beginPath()
        ctx.arc(p.x + pixelSize*8, p.y + pixelSize*5, pixelSize*4, 0, Math.PI * 1.5)
        ctx.fill()
        
        ctx.restore()
        
        // 手臂和腿的动画参数（奔跑时更明显）
        const runAnimTime = this.player.runAnimationTime || 0
        const legPhase = Math.sin(runAnimTime) * 0.5 + 0.5
        const armPhase = Math.sin(runAnimTime + Math.PI) * 0.5 + 0.5 // 手臂与腿相反
        
        // 手臂 - 添加摆动动画（奔跑时更明显）
        const armGradient = ctx.createLinearGradient(
          p.x, p.y, 
          p.x, p.y + p.h
        )
        armGradient.addColorStop(0, '#f8f8f8')
        armGradient.addColorStop(1, '#e0e0e0')
        ctx.fillStyle = armGradient
        
        // 左手臂 - 奔跑时大幅摆动（确保总是绘制）
        ctx.save()
        if (this.player.isRunning && p.onGround) {
          ctx.translate(p.x + p.w/2, p.y + p.h/2)
          ctx.rotate(bodyLean * 0.5)
          ctx.translate(-(p.x + p.w/2), -(p.y + p.h/2))
        }
        
        if (p.vx !== 0 || this.player.isRunning) {
          // 移动或奔跑时手臂摆动
          const leftArmAngle = this.player.isRunning ? (armPhase - 0.5) * Math.PI / 2.5 : (armPhase - 0.5) * Math.PI / 6
          const leftArmLength = pixelSize * 3
          const leftArmX = p.x + pixelSize*4
          const leftArmY = p.y + pixelSize*8
          
          ctx.save()
          ctx.translate(leftArmX, leftArmY)
          ctx.rotate(leftArmAngle)
          ctx.fillRect(0, 0, leftArmLength, pixelSize*1.5)
        ctx.strokeStyle = '#4a5568'
          ctx.lineWidth = 1
          ctx.strokeRect(0, 0, leftArmLength, pixelSize*1.5)
          ctx.restore()
        } else {
          // 静止时手臂下垂
          ctx.fillRect(p.x + pixelSize*4, p.y + pixelSize*8, pixelSize*1.5, pixelSize*3)
          ctx.strokeStyle = '#4a5568'
          ctx.lineWidth = 1
          ctx.strokeRect(p.x + pixelSize*4, p.y + pixelSize*8, pixelSize*1.5, pixelSize*3)
        }
        
        // 右手臂 - 与左手臂相反方向摆动（确保总是绘制）
        if (p.vx !== 0 || this.player.isRunning) {
          // 移动或奔跑时手臂摆动
          const rightArmAngle = this.player.isRunning ? (0.5 - armPhase) * Math.PI / 2.5 : (0.5 - armPhase) * Math.PI / 6
          const rightArmLength = pixelSize * 3
          const rightArmX = p.x + pixelSize*10.5
          const rightArmY = p.y + pixelSize*8
          
          ctx.save()
          ctx.translate(rightArmX, rightArmY)
          ctx.rotate(rightArmAngle)
          ctx.fillRect(0, 0, rightArmLength, pixelSize*1.5)
          ctx.strokeStyle = '#4a5568'
          ctx.lineWidth = 1
          ctx.strokeRect(0, 0, rightArmLength, pixelSize*1.5)
          ctx.restore()
        } else {
          // 静止时手臂下垂
          ctx.fillRect(p.x + pixelSize*10.5, p.y + pixelSize*8, pixelSize*1.5, pixelSize*3)
          ctx.strokeStyle = '#4a5568'
          ctx.lineWidth = 1
          ctx.strokeRect(p.x + pixelSize*10.5, p.y + pixelSize*8, pixelSize*1.5, pixelSize*3)
        }
        
        ctx.restore()
        
        // 腿 - 确保总是绘制（无论什么状态）
        // 重置所有上下文状态，确保不受前面的绘制影响
        ctx.save()
        
        // 设置样式
        ctx.strokeStyle = '#4a5568'
        ctx.lineWidth = 2
        ctx.fillStyle = '#e8e8e8'  // 使用纯色而不是渐变，确保可见
        
        // 计算基础腿部位置（身体底部，身体是从 pixelSize*3 开始，高度 pixelSize*10，所以底部是 pixelSize*13）
        // 身体底部位置：p.y + pixelSize*3 + pixelSize*10 = p.y + pixelSize*13
        const bodyBottomY = p.y + pixelSize * 3 + pixelSize * 10
        const baseLegY = bodyBottomY
        const leftLegBaseX = p.x + pixelSize * 5
        const rightLegBaseX = p.x + pixelSize * 9
        const legWidth = Math.max(2, pixelSize * 2)  // 确保至少2像素宽
        const legHeight = Math.max(4, pixelSize * 2.5)  // 确保至少4像素高，稍微高一点
        
        // 当跳跃时腿部收拢效果
        if (p.vy < 0) {
          // 跳跃时绘制收拢的腿部（一条横线）
          ctx.fillRect(leftLegBaseX, baseLegY, pixelSize * 6, pixelSize)
          ctx.strokeRect(leftLegBaseX, baseLegY, pixelSize * 6, pixelSize)
        } else {
          // 正常状态：总是绘制两条腿
          // 计算腿部摆动（如果移动或奔跑）
          let leftLegSwing = 0
          let leftLegLift = 0
          let rightLegSwing = 0
          let rightLegLift = 0
          
          // 确保 legPhase 有值（即使静止时也使用当前值）
          const currentLegPhase = (legPhase !== undefined && legPhase !== null) ? legPhase : 0.5
          
          if (this.player.isRunning && p.onGround) {
            // 奔跑时大幅度摆动和抬腿
            leftLegSwing = (currentLegPhase - 0.5) * pixelSize * 6
            leftLegLift = Math.abs(currentLegPhase - 0.5) * pixelSize * 2.5
            rightLegSwing = (0.5 - currentLegPhase) * pixelSize * 6
            rightLegLift = Math.abs(0.5 - currentLegPhase) * pixelSize * 2.5
          } else if (Math.abs(p.vx) > 0.1 && p.onGround) {
            // 普通移动时小幅度摆动
            leftLegSwing = (currentLegPhase - 0.5) * pixelSize * 3
            rightLegSwing = (0.5 - currentLegPhase) * pixelSize * 3
          }
          // 静止时 leftLegSwing 和 rightLegSwing 保持为 0，腿在默认位置
          
          // 左腿 - 总是绘制（使用更明显的颜色确保可见）
          const leftLegX = leftLegBaseX + leftLegSwing
          const leftLegY = baseLegY - leftLegLift
          
          // 绘制左腿（使用更明显的填充）
          ctx.fillStyle = '#e8e8e8'
          ctx.fillRect(leftLegX, leftLegY, legWidth, legHeight)
          ctx.strokeStyle = '#4a5568'
          ctx.lineWidth = 2
          ctx.strokeRect(leftLegX, leftLegY, legWidth, legHeight)
          
          // 右腿 - 总是绘制
          const rightLegX = rightLegBaseX + rightLegSwing
          const rightLegY = baseLegY - rightLegLift
          
          // 绘制右腿（使用更明显的填充）
          ctx.fillStyle = '#e8e8e8'
          ctx.fillRect(rightLegX, rightLegY, legWidth, legHeight)
          ctx.strokeStyle = '#4a5568'
          ctx.lineWidth = 2
          ctx.strokeRect(rightLegX, rightLegY, legWidth, legHeight)
        }
        
        ctx.restore()  // 恢复上下文状态
        
        // 添加投影效果（在腿部绘制之后）
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        
        // 奔跑时的额外视觉效果：震动效果（在最后应用）
        if (this.player.isRunning && p.onGround) {
          // 轻微的震动效果（通过快速的小幅度偏移）
          const shakeOffset = Math.sin(runAnimTime * 2) * 0.5
          // 震动效果已通过动画时间实现，这里不需要额外处理
        }
      }
    },
    
    // 新增绘制方法
    drawBullets(ctx) {
      this.bullets.forEach(bullet => {
        // 检查是否为电击子弹
        if (bullet.type === 'electric') {
          ctx.save()
          
          // 更新发光强度动画
          if (bullet.glowIntensity === undefined) bullet.glowIntensity = 1
          bullet.glowIntensity = 0.7 + Math.sin(performance.now() / 50) * 0.3
          
          const centerX = bullet.x + bullet.w / 2
          const centerY = bullet.y + bullet.h / 2
          const rotation = bullet.rotation !== undefined ? bullet.rotation : Math.atan2(bullet.vy, bullet.vx)
          
          // 应用旋转（让子弹朝向飞行方向）
          ctx.translate(centerX, centerY)
          ctx.rotate(rotation)
          
          // 绘制电击子弹尾迹（在子弹后方）
          const trailLength = 25
          const trailGradient = ctx.createLinearGradient(-trailLength, 0, 0, 0)
          trailGradient.addColorStop(0, 'rgba(0, 255, 255, 0)')
          trailGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.4)')
          trailGradient.addColorStop(1, 'rgba(0, 255, 255, 0.8)')
          ctx.fillStyle = trailGradient
          ctx.fillRect(-trailLength, -2, trailLength, 4)
          
          // 绘制电击子弹主体（椭圆形，更像子弹）
          const bulletGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, bullet.w / 2)
          bulletGradient.addColorStop(0, `rgba(255, 255, 255, ${bullet.glowIntensity})`)
          bulletGradient.addColorStop(0.3, `rgba(0, 255, 255, ${bullet.glowIntensity * 0.9})`)
          bulletGradient.addColorStop(0.7, 'rgba(0, 200, 255, 0.8)')
          bulletGradient.addColorStop(1, 'rgba(0, 150, 255, 0.6)')
          
          ctx.fillStyle = bulletGradient
          ctx.beginPath()
          ctx.ellipse(0, 0, bullet.w / 2, bullet.h / 2, 0, 0, Math.PI * 2)
          ctx.fill()
          
          // 绘制电击子弹外圈发光
          const glowGradient = ctx.createRadialGradient(0, 0, bullet.w / 2, 0, 0, bullet.w)
          glowGradient.addColorStop(0, `rgba(0, 255, 255, ${bullet.glowIntensity * 0.5})`)
          glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)')
          ctx.fillStyle = glowGradient
          ctx.beginPath()
          ctx.arc(0, 0, bullet.w, 0, Math.PI * 2)
          ctx.fill()
          
          // 绘制电击核心（高光点）
          ctx.fillStyle = `rgba(255, 255, 255, ${bullet.glowIntensity})`
          ctx.beginPath()
          ctx.arc(0, 0, 3, 0, Math.PI * 2)
          ctx.fill()
          
          // 绘制电击边框（闪电效果）
          ctx.strokeStyle = `rgba(255, 255, 255, ${bullet.glowIntensity * 0.8})`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.ellipse(0, 0, bullet.w / 2, bullet.h / 2, 0, 0, Math.PI * 2)
          ctx.stroke()
          
          // 添加电击闪电效果（从子弹中心向外）
          ctx.strokeStyle = `rgba(0, 255, 255, ${bullet.glowIntensity * 0.6})`
          ctx.lineWidth = 1
          for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 * i) / 3 + performance.now() / 100
            const x1 = Math.cos(angle) * (bullet.w / 2 - 2)
            const y1 = Math.sin(angle) * (bullet.h / 2 - 2)
            const x2 = Math.cos(angle) * (bullet.w / 2 + 3)
            const y2 = Math.sin(angle) * (bullet.h / 2 + 3)
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
          }
          
          ctx.restore()
        } else {
          // 普通子弹 - 黑色系风格
          ctx.fillStyle = '#111111' // 深黑色主体
          ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h)
          
          // 添加子弹金属边框
          ctx.strokeStyle = '#444444'
          ctx.lineWidth = 2
          ctx.strokeRect(bullet.x, bullet.y, bullet.w, bullet.h)
          
          // 添加子弹核心高光 - 银色金属感
          ctx.fillStyle = '#cccccc'
          ctx.fillRect(bullet.x + 1, bullet.y + 1, bullet.w - 2, bullet.h - 2)
          
          // 添加子弹尾迹效果 - 黑色烟雾效果
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
          ctx.fillRect(bullet.x - 10, bullet.y + bullet.h/2 - 1, 10, 2)
          
          // 添加子弹运动轨迹点 - 灰色轨迹
          for (let i = 1; i <= 3; i++) {
            ctx.fillStyle = `rgba(100, 100, 100, ${0.5 - i * 0.15})`
            ctx.fillRect(bullet.x - i * 8, bullet.y + bullet.h/2 - 0.5, 4, 1)
          }
          
          // 添加子弹尖端效果
          ctx.fillStyle = '#222222'
          ctx.fillRect(bullet.x + bullet.w - 2, bullet.y + 1, 2, bullet.h - 2)
        }
      })
    },
    
    // 新增方法：绘制掉落物
    drawDrops(ctx) {
      this.player.drops.forEach(drop => {
        // 跳过已收集的掉落物
        if (drop.collected) return
        
        // 绘制掉落物背景（闪烁效果）
        const time = performance.now()
        const pulse = Math.sin(time * 0.01) * 0.3 + 0.7 // 闪烁效果
        
        // 掉落物背景（圆形）
        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 * pulse})`
        ctx.beginPath()
        ctx.arc(drop.x + drop.w/2, drop.y + drop.h/2, drop.w/2, 0, Math.PI * 2)
        ctx.fill()
        
        // 掉落物边框
        ctx.strokeStyle = '#ffd700'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(drop.x + drop.w/2, drop.y + drop.h/2, drop.w/2, 0, Math.PI * 2)
        ctx.stroke()
        
        // 掉落物图标
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(drop.icon, drop.x + drop.w/2, drop.y + drop.h/2)
        
        // 掉落物名称
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px Arial'
        ctx.fillText(drop.name, drop.x + drop.w/2, drop.y + drop.h + 12)
      })
    },
    
    // 新增方法：绘制掉落物
    drawDrops(ctx) {
      this.player.drops.forEach(drop => {
        // 跳过已收集的掉落物
        if (drop.collected) return
        
        // 绘制掉落物背景（闪烁效果）
        const time = performance.now()
        const pulse = Math.sin(time * 0.01) * 0.3 + 0.7 // 闪烁效果
        
        // 掉落物背景（圆形）
        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 * pulse})`
        ctx.beginPath()
        ctx.arc(drop.x + drop.w/2, drop.y + drop.h/2, drop.w/2, 0, Math.PI * 2)
        ctx.fill()
        
        // 掉落物边框
        ctx.strokeStyle = '#ffd700'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(drop.x + drop.w/2, drop.y + drop.h/2, drop.w/2, 0, Math.PI * 2)
        ctx.stroke()
        
        // 掉落物图标
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(drop.icon, drop.x + drop.w/2, drop.y + drop.h/2)
        
        // 掉落物名称
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px Arial'
        ctx.fillText(drop.name, drop.x + drop.w/2, drop.y + drop.h + 12)
      })
    },
    
    // 绘制激光效果
    drawLaserEffect(ctx) {
      if (!this.player.laserTool.isActive || !this.player.laserTool.targetBasalt) return
      
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      const basaltCenterX = this.player.laserTool.targetBasalt.x + this.player.laserTool.targetBasalt.w / 2
      const basaltCenterY = this.player.laserTool.targetBasalt.y + this.player.laserTool.targetBasalt.h / 2
      
      // 绘制激光束
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5]) // 虚线效果
      ctx.beginPath()
      ctx.moveTo(playerCenterX, playerCenterY)
      ctx.lineTo(basaltCenterX, basaltCenterY)
      ctx.stroke()
      ctx.setLineDash([]) // 重置虚线
      
      // 绘制激光起点（玩家位置）
      ctx.fillStyle = '#00ff00'
      ctx.beginPath()
      ctx.arc(playerCenterX, playerCenterY, 5, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制激光终点（玄武岩位置）
      ctx.fillStyle = '#ff0000'
      ctx.beginPath()
      ctx.arc(basaltCenterX, basaltCenterY, 8, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制挖取进度条
      const progress = this.player.laserTool.miningProgress / this.player.laserTool.miningTime
      const progressBarWidth = 60
      const progressBarHeight = 8
      const progressBarX = basaltCenterX - progressBarWidth / 2
      const progressBarY = basaltCenterY - 20
      
      // 进度条背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 进度条前景
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight)
      
      // 进度条边框
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 显示挖取时间
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `${Math.ceil((this.player.laserTool.miningTime - this.player.laserTool.miningProgress) / 1000)}秒`, 
        basaltCenterX, 
        progressBarY - 5
      )
    },
    
    // 绘制激光效果
    drawLaserEffect(ctx) {
      if (!this.player.laserTool.isActive || !this.player.laserTool.targetBasalt) return
      
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      const basaltCenterX = this.player.laserTool.targetBasalt.x + this.player.laserTool.targetBasalt.w / 2
      const basaltCenterY = this.player.laserTool.targetBasalt.y + this.player.laserTool.targetBasalt.h / 2
      
      // 绘制激光束
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5]) // 虚线效果
      ctx.beginPath()
      ctx.moveTo(playerCenterX, playerCenterY)
      ctx.lineTo(basaltCenterX, basaltCenterY)
      ctx.stroke()
      ctx.setLineDash([]) // 重置虚线
      
      // 绘制激光起点（玩家位置）
      ctx.fillStyle = '#00ff00'
      ctx.beginPath()
      ctx.arc(playerCenterX, playerCenterY, 5, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制激光终点（玄武岩位置）
      ctx.fillStyle = '#ff0000'
      ctx.beginPath()
      ctx.arc(basaltCenterX, basaltCenterY, 8, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制挖取进度条
      const progress = this.player.laserTool.miningProgress / this.player.laserTool.miningTime
      const progressBarWidth = 60
      const progressBarHeight = 8
      const progressBarX = basaltCenterX - progressBarWidth / 2
      const progressBarY = basaltCenterY - 20
      
      // 进度条背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 进度条前景
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight)
      
      // 进度条边框
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
      
      // 显示挖取时间
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `${Math.ceil((this.player.laserTool.miningTime - this.player.laserTool.miningProgress) / 1000)}秒`, 
        basaltCenterX, 
        progressBarY - 5
      )
    },
    
    // 新增方法：绘制电击特效
    drawElectricEffects(ctx) {
      if (!this.electricEffects) return
      
      this.electricEffects.forEach(effect => {
        // 绘制电击光环
        ctx.beginPath()
        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2)
        
        // 电击光环渐变
        const gradient = ctx.createRadialGradient(
          effect.x, effect.y, 0,
          effect.x, effect.y, effect.radius
        )
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)')
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.4)')
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)')
        
        ctx.fillStyle = gradient
        ctx.fill()
        
        // 绘制电击闪电效果
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 3])
        
        // 绘制随机闪电线条
        for (let i = 0; i < 4; i++) {
          const angle = Math.random() * Math.PI * 2
          const length = effect.radius * (0.5 + Math.random() * 0.5)
          const endX = effect.x + Math.cos(angle) * length
          const endY = effect.y + Math.sin(angle) * length
          
          ctx.beginPath()
          ctx.moveTo(effect.x, effect.y)
          ctx.lineTo(endX, endY)
          ctx.stroke()
        }
        
        ctx.setLineDash([])
      })
    },
    
    drawMonsterBullets(ctx) {
      this.monsterBullets.forEach(bullet => {
        if (bullet.type === 'crystal' || bullet.type === 'crystal_direct') {
          // 绘制晶体子弹（透明蓝色，有发光效果）
          ctx.save()
          const crystalGradient = ctx.createRadialGradient(
            bullet.x + bullet.w / 2, bullet.y + bullet.h / 2, 0,
            bullet.x + bullet.w / 2, bullet.y + bullet.h / 2, bullet.w
          )
          crystalGradient.addColorStop(0, 'rgba(135, 206, 235, 0.9)')
          crystalGradient.addColorStop(0.5, 'rgba(135, 206, 235, 0.6)')
          crystalGradient.addColorStop(1, 'rgba(135, 206, 235, 0)')
          
          ctx.fillStyle = crystalGradient
          ctx.beginPath()
          ctx.arc(bullet.x + bullet.w / 2, bullet.y + bullet.h / 2, bullet.w / 2, 0, Math.PI * 2)
          ctx.fill()
          
          // 晶体边框
          ctx.strokeStyle = 'rgba(135, 206, 235, 0.8)'
          ctx.lineWidth = 1.5
          ctx.stroke()
          ctx.restore()
        } else if (bullet.type === 'puni_laser_beam') {
          // 绘制谱尼激光子弹（青色激光，带发光效果，圆周形态）
          ctx.save()
          const centerX = bullet.x + bullet.w / 2
          const centerY = bullet.y + bullet.h / 2
          
          // 外层光晕（更强烈的发光效果）
          ctx.shadowBlur = 20
          ctx.shadowColor = '#00ffff'
          const laserGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, bullet.w * 1.5
          )
          laserGradient.addColorStop(0, 'rgba(0, 255, 255, 1)')
          laserGradient.addColorStop(0.4, 'rgba(0, 255, 255, 0.9)')
          laserGradient.addColorStop(0.7, 'rgba(0, 200, 255, 0.6)')
          laserGradient.addColorStop(1, 'rgba(0, 255, 255, 0)')
          
          ctx.fillStyle = laserGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2)
          ctx.fill()
          
          // 激光核心（更亮的白色中心）
          ctx.shadowBlur = 0
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 3, 0, Math.PI * 2)
          ctx.fill()
          
          // 如果是从圆周攻击发射的子弹，添加额外的视觉效果
          if (bullet.isCircular) {
            // 添加旋转的光环效果
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(centerX, centerY, bullet.w / 2 + 3, 0, Math.PI * 2)
            ctx.stroke()
          }
          
          ctx.restore()
        } else if (bullet.type === 'puni_laser_bullet') {
          // 绘制谱尼激光弹（实体子弹样式，更明显，便于玩家识别和躲避）
          ctx.save()
          const centerX = bullet.x + bullet.w / 2
          const centerY = bullet.y + bullet.h / 2
          
          // 外层光晕（中等强度，让子弹明显但不刺眼）
          ctx.shadowBlur = 25
          ctx.shadowColor = '#00ffff'
          const bulletGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, bullet.w * 1.2
          )
          bulletGradient.addColorStop(0, 'rgba(0, 255, 255, 1)')
          bulletGradient.addColorStop(0.3, 'rgba(0, 255, 255, 0.95)')
          bulletGradient.addColorStop(0.6, 'rgba(0, 200, 255, 0.7)')
          bulletGradient.addColorStop(1, 'rgba(0, 255, 255, 0)')
          
          ctx.fillStyle = bulletGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2)
          ctx.fill()
          
          // 子弹核心（明亮的白色中心，更明显）
          ctx.shadowBlur = 0
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 3.5, 0, Math.PI * 2)
          ctx.fill()
          
          // 子弹边框（清晰的边界，让子弹更像实体）
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2)
          ctx.stroke()
          
          // 如果是从圆周攻击发射的子弹，添加额外的视觉效果
          if (bullet.isCircular) {
            // 添加旋转的光环效果（更明显）
            const rotation = (Date.now() * 0.005) % (Math.PI * 2)
            ctx.save()
            ctx.translate(centerX, centerY)
            ctx.rotate(rotation)
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)'
            ctx.lineWidth = 2.5
            ctx.beginPath()
            ctx.arc(0, 0, bullet.w / 2 + 4, 0, Math.PI * 2)
            ctx.stroke()
            // 添加十字标记，让子弹更明显
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(-bullet.w / 4, 0)
            ctx.lineTo(bullet.w / 4, 0)
            ctx.moveTo(0, -bullet.w / 4)
            ctx.lineTo(0, bullet.w / 4)
            ctx.stroke()
            ctx.restore()
          }
          
          ctx.restore()
        } else if (bullet.type === 'puni_fan_bullet') {
          // 绘制扇形弹幕（红色子弹）
          ctx.save()
          const centerX = bullet.x + bullet.w / 2
          const centerY = bullet.y + bullet.h / 2
          
          ctx.shadowBlur = 15
          ctx.shadowColor = '#ff6b6b'
          const fanGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, bullet.w
          )
          fanGradient.addColorStop(0, 'rgba(255, 107, 107, 1)')
          fanGradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.8)')
          fanGradient.addColorStop(1, 'rgba(255, 107, 107, 0)')
          
          ctx.fillStyle = fanGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        } else if (bullet.type === 'puni_tracking_bullet') {
          // 绘制跟踪子弹（紫色，增强可见性，带追踪尾迹）
          ctx.save()
          const centerX = bullet.x + bullet.w / 2
          const centerY = bullet.y + bullet.h / 2
          
          // 增强发光效果，让子弹更明显
          ctx.shadowBlur = 30
          ctx.shadowColor = 'rgba(255, 0, 255, 0.9)'
          
          // 外层光晕（更大更亮）
          const outerGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, bullet.w * 2
          )
          outerGradient.addColorStop(0, 'rgba(255, 0, 255, 0.8)')
          outerGradient.addColorStop(0.3, 'rgba(255, 0, 255, 0.6)')
          outerGradient.addColorStop(0.6, 'rgba(200, 0, 200, 0.4)')
          outerGradient.addColorStop(1, 'rgba(255, 0, 255, 0)')
          
          ctx.fillStyle = outerGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w, 0, Math.PI * 2)
          ctx.fill()
          
          // 主体渐变
          const trackGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, bullet.w * 1.2
          )
          trackGradient.addColorStop(0, 'rgba(255, 0, 255, 1)')
          trackGradient.addColorStop(0.4, 'rgba(255, 0, 255, 0.95)')
          trackGradient.addColorStop(0.7, 'rgba(200, 0, 200, 0.7)')
          trackGradient.addColorStop(1, 'rgba(255, 0, 255, 0)')
          
          ctx.fillStyle = trackGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2)
          ctx.fill()
          
          // 白色核心（更明显）
          ctx.shadowBlur = 0
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 3.5, 0, Math.PI * 2)
          ctx.fill()
          
          // 添加边框，让子弹边界更清晰
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2)
          ctx.stroke()
          
          ctx.restore()
        } else if (bullet.type === 'puni_spinning_bullet') {
          // 绘制旋转弹幕（绿色，旋转效果）
          ctx.save()
          const centerX = bullet.x + bullet.w / 2
          const centerY = bullet.y + bullet.h / 2
          
          ctx.shadowBlur = 12
          ctx.shadowColor = '#00ff00'
          const spinGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, bullet.w
          )
          spinGradient.addColorStop(0, 'rgba(0, 255, 0, 1)')
          spinGradient.addColorStop(0.6, 'rgba(0, 200, 0, 0.8)')
          spinGradient.addColorStop(1, 'rgba(0, 255, 0, 0)')
          
          ctx.fillStyle = spinGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2)
          ctx.fill()
          
          // 旋转指示线
          if (!bullet.expanding) {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(bullet.orbitCenterX, bullet.orbitCenterY)
            ctx.lineTo(centerX, centerY)
            ctx.stroke()
          }
          ctx.restore()
        } else if (bullet.type === 'yuanqi') {
          // 绘制月球幽灵的元气弹（黄色）
          ctx.save()
          const centerX = bullet.x + bullet.w / 2
          const centerY = bullet.y + bullet.h / 2
          
          // 外层光晕（金黄色发光效果）
          ctx.shadowBlur = 20
          ctx.shadowColor = '#ffd700'
          
          const yuanqiGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, bullet.w / 2
          )
          yuanqiGradient.addColorStop(0, 'rgba(255, 215, 0, 1)')
          yuanqiGradient.addColorStop(0.6, 'rgba(255, 200, 0, 0.8)')
          yuanqiGradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
          
          ctx.fillStyle = yuanqiGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2)
          ctx.fill()
          
          // 核心
          ctx.shadowBlur = 0
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 4, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.restore()
        } else if (bullet.type === 'spell') {
          // 绘制法术弹（紫色追踪弹）
          ctx.save()
          const centerX = bullet.x + bullet.w / 2
          const centerY = bullet.y + bullet.h / 2
          
          ctx.shadowBlur = 15
          ctx.shadowColor = '#9370db'
          
          const spellGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, bullet.w / 2
          )
          spellGradient.addColorStop(0, 'rgba(147, 112, 219, 1)')
          spellGradient.addColorStop(0.6, 'rgba(138, 43, 226, 0.8)')
          spellGradient.addColorStop(1, 'rgba(75, 0, 130, 0)')
          
          ctx.fillStyle = spellGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2)
          ctx.fill()
          
          // 核心
          ctx.shadowBlur = 0
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 5, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.restore()
        } else if (bullet.type === 'puni_yuanqi_bullet') {
          // 绘制黄色元气弹
          ctx.save()
          const centerX = bullet.x + bullet.w / 2
          const centerY = bullet.y + bullet.h / 2
          
          // 外层光晕（金黄色发光效果）
          ctx.shadowBlur = 25
          ctx.shadowColor = '#ffd700'
          const yuanqiGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, bullet.w * 1.5
          )
          yuanqiGradient.addColorStop(0, 'rgba(255, 215, 0, 1)') // 金黄色
          yuanqiGradient.addColorStop(0.3, 'rgba(255, 215, 0, 0.95)')
          yuanqiGradient.addColorStop(0.6, 'rgba(255, 200, 0, 0.7)')
          yuanqiGradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
          
          ctx.fillStyle = yuanqiGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2)
          ctx.fill()
          
          // 元气弹核心（明亮的白色/黄色中心）
          ctx.shadowBlur = 0
          ctx.fillStyle = '#ffff99' // 淡黄色核心
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 3, 0, Math.PI * 2)
          ctx.fill()
          
          // 元气弹边框（金黄色边框）
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2)
          ctx.stroke()
          
          // 添加能量波动效果（外圈）
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2 + 3, 0, Math.PI * 2)
          ctx.stroke()
          
          ctx.restore()
        } else if (bullet.type === 'puni_explosion') {
          // 绘制爆炸效果（橙红色，扩散效果）
          ctx.save()
          const centerX = bullet.x + bullet.w / 2
          const centerY = bullet.y + bullet.h / 2
          const progress = 1 - (bullet.lifetime / 0.3) // 0到1，爆炸进度
          const radius = bullet.explosionRadius * progress
          
          // 爆炸外圈（扩散波纹）
          ctx.shadowBlur = 30
          ctx.shadowColor = '#ff4500'
          const explosionGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
          )
          explosionGradient.addColorStop(0, `rgba(255, 69, 0, ${1 - progress})`)
          explosionGradient.addColorStop(0.5, `rgba(255, 140, 0, ${(1 - progress) * 0.7})`)
          explosionGradient.addColorStop(1, 'rgba(255, 69, 0, 0)')
          
          ctx.fillStyle = explosionGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
          ctx.fill()
          
          // 爆炸核心
          ctx.shadowBlur = 0
          ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        } else if (bullet.type === 'puni_cross_laser') {
          // 绘制十字激光（青色激光束）
          ctx.save()
          const laserLength = 5000
          const laserWidth = bullet.w || 80
          const startX = bullet.startX
          const startY = bullet.startY
          
          // 根据方向绘制激光
          ctx.shadowBlur = 20
          ctx.shadowColor = '#00ffff'
          ctx.strokeStyle = '#00ffff'
          ctx.lineWidth = laserWidth
          ctx.globalAlpha = 0.8
          
          ctx.beginPath()
          if (bullet.direction === 0) { // 右
            ctx.moveTo(startX, startY)
            ctx.lineTo(startX + laserLength, startY)
          } else if (bullet.direction === Math.PI) { // 左
            ctx.moveTo(startX, startY)
            ctx.lineTo(startX - laserLength, startY)
          } else if (bullet.direction === -Math.PI / 2) { // 上
            ctx.moveTo(startX, startY)
            ctx.lineTo(startX, startY - laserLength)
          } else if (bullet.direction === Math.PI / 2) { // 下
            ctx.moveTo(startX, startY)
            ctx.lineTo(startX, startY + laserLength)
          }
          ctx.stroke()
          
          // 激光核心（更亮的中心线）
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = laserWidth * 0.3
          ctx.globalAlpha = 1.0
          ctx.stroke()
          
          ctx.restore()
        } else if (bullet.type === 'puni_tracking_wave') {
          // 绘制追踪能量波（紫色能量球，带尾迹）
          ctx.save()
          const centerX = bullet.x + bullet.w / 2
          const centerY = bullet.y + bullet.h / 2
          
          // 外层光晕
          ctx.shadowBlur = 25
          ctx.shadowColor = '#ff00ff'
          const waveGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, bullet.w
          )
          waveGradient.addColorStop(0, 'rgba(255, 0, 255, 1)')
          waveGradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.8)')
          waveGradient.addColorStop(1, 'rgba(255, 0, 255, 0)')
          
          ctx.fillStyle = waveGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2)
          ctx.fill()
          
          // 核心（白色高光）
          ctx.shadowBlur = 0
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 4, 0, Math.PI * 2)
          ctx.fill()
          
          // 绘制尾迹（显示移动方向）
          const angle = Math.atan2(bullet.vy, bullet.vx)
          const trailLength = 30
          ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.lineTo(
            centerX - Math.cos(angle) * trailLength,
            centerY - Math.sin(angle) * trailLength
          )
          ctx.stroke()
          
          ctx.restore()
        } else if (bullet.type === 'puni_scatter_laser') {
          // 绘制散发激光球（青色激光球，从BOSS中心散射）
          ctx.save()
          const centerX = bullet.x + bullet.w / 2
          const centerY = bullet.y + bullet.h / 2
          const time = performance.now() * 0.001
          
          // 外层大光晕（强烈的发光效果）
          ctx.shadowBlur = 25
          ctx.shadowColor = '#00ffff'
          const outerGlow = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, bullet.w * 2
          )
          outerGlow.addColorStop(0, 'rgba(0, 255, 255, 0.6)')
          outerGlow.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)')
          outerGlow.addColorStop(1, 'rgba(0, 255, 255, 0)')
          
          ctx.fillStyle = outerGlow
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w, 0, Math.PI * 2)
          ctx.fill()
          
          // 中层光晕（激光球主体）
          ctx.shadowBlur = 20
          ctx.shadowColor = '#00ffff'
          const laserGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, bullet.w / 2
          )
          laserGradient.addColorStop(0, 'rgba(0, 255, 255, 1)')
          laserGradient.addColorStop(0.4, 'rgba(0, 200, 255, 0.9)')
          laserGradient.addColorStop(0.7, 'rgba(0, 150, 255, 0.7)')
          laserGradient.addColorStop(1, 'rgba(0, 100, 255, 0.4)')
          
          ctx.fillStyle = laserGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2)
          ctx.fill()
          
          // 核心高光（白色亮点，带脉冲效果）
          const pulse = 0.8 + Math.sin(time * 10) * 0.2
          ctx.shadowBlur = 0
          ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 4, 0, Math.PI * 2)
          ctx.fill()
          
          // 内层亮点（更小的白色核心）
          ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.9})`
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 6, 0, Math.PI * 2)
          ctx.fill()
          
          // 绘制尾迹（显示移动方向，更明显）
          const angle = Math.atan2(bullet.vy, bullet.vx)
          const trailLength = 25
          const trailGradient = ctx.createLinearGradient(
            centerX - Math.cos(angle) * trailLength,
            centerY - Math.sin(angle) * trailLength,
            centerX, centerY
          )
          trailGradient.addColorStop(0, 'rgba(0, 255, 255, 0)')
          trailGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.4)')
          trailGradient.addColorStop(1, 'rgba(0, 255, 255, 0.8)')
          
          ctx.strokeStyle = trailGradient
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.moveTo(centerX - Math.cos(angle) * trailLength, centerY - Math.sin(angle) * trailLength)
          ctx.lineTo(centerX, centerY)
          ctx.stroke()
          
          ctx.restore()
        } else if (bullet.type === 'puni_group_bullet') {
          // 绘制成群子弹（红色子弹，带发光效果）
          ctx.save()
          const centerX = bullet.x + bullet.w / 2
          const centerY = bullet.y + bullet.h / 2
          
          // 外层光晕
          ctx.shadowBlur = 12
          ctx.shadowColor = '#ff6b6b'
          const bulletGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, bullet.w * 1.5
          )
          bulletGradient.addColorStop(0, 'rgba(255, 107, 107, 1)')
          bulletGradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.8)')
          bulletGradient.addColorStop(1, 'rgba(255, 107, 107, 0)')
          
          ctx.fillStyle = bulletGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2)
          ctx.fill()
          
          // 核心（白色高光）
          ctx.shadowBlur = 0
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 4, 0, Math.PI * 2)
          ctx.fill()
          
          // 绘制尾迹（显示移动方向）
          const angle = Math.atan2(bullet.vy, bullet.vx)
          const trailLength = 15
          ctx.strokeStyle = 'rgba(255, 107, 107, 0.6)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(centerX - Math.cos(angle) * trailLength, centerY - Math.sin(angle) * trailLength)
          ctx.lineTo(centerX, centerY)
          ctx.stroke()
          
          ctx.restore()
        } else if (bullet.type === 'straight') {
          // 绘制雨海飞虫的直线子弹（蓝色发光子弹）
          ctx.save()
          const centerX = bullet.x + bullet.w / 2
          const centerY = bullet.y + bullet.h / 2
          
          // 外层光晕
          ctx.shadowBlur = 10
          ctx.shadowColor = '#4a90e2'
          const bulletGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, bullet.w
          )
          bulletGradient.addColorStop(0, 'rgba(74, 144, 226, 1)')
          bulletGradient.addColorStop(0.6, 'rgba(74, 144, 226, 0.8)')
          bulletGradient.addColorStop(1, 'rgba(74, 144, 226, 0)')
          
          ctx.fillStyle = bulletGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 2, 0, Math.PI * 2)
          ctx.fill()
          
          // 核心（白色高光）
          ctx.shadowBlur = 0
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.beginPath()
          ctx.arc(centerX, centerY, bullet.w / 4, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.restore()
        } else {
          // 默认子弹绘制
        ctx.fillStyle = bullet.color
        ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h)
        
        // 添加子弹发光效果
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.lineWidth = 1
        ctx.strokeRect(bullet.x, bullet.y, bullet.w, bullet.h)
        }
      })
    },
    
    drawCrystalFragments(ctx) {
      this.crystalFragments.forEach(fragment => {
        ctx.save()
        // 绘制小晶体碎片（带寒气效果）
        const fragmentAlpha = fragment.lifetime / 10 // 随时间变透明
        const coldGradient = ctx.createRadialGradient(
          fragment.x + fragment.w / 2, fragment.y + fragment.h / 2, 0,
          fragment.x + fragment.w / 2, fragment.y + fragment.h / 2, fragment.w * 2
        )
        coldGradient.addColorStop(0, `rgba(135, 206, 235, ${fragmentAlpha * 0.8})`)
        coldGradient.addColorStop(0.5, `rgba(173, 216, 230, ${fragmentAlpha * 0.4})`)
        coldGradient.addColorStop(1, `rgba(173, 216, 230, 0)`)
        
        ctx.fillStyle = coldGradient
        ctx.beginPath()
        ctx.arc(fragment.x + fragment.w / 2, fragment.y + fragment.h / 2, fragment.w, 0, Math.PI * 2)
        ctx.fill()
        
        // 碎片本体
        ctx.fillStyle = `rgba(135, 206, 235, ${fragmentAlpha})`
        ctx.fillRect(fragment.x, fragment.y, fragment.w, fragment.h)
        ctx.restore()
      })
    },
    
    drawMonsters(ctx) {
      this.monsters.forEach(monster => {
        // 根据怪物类型绘制不同的外观
        if (monster.type === 'normal') {
          // 怪兽一号美化版本
          
          // 绘制怪物身体 - 圆形身体
          const bodyGradient = ctx.createRadialGradient(
            monster.x + monster.w/2, monster.y + monster.h/2, 0,
            monster.x + monster.w/2, monster.y + monster.h/2, monster.w/2
          )
          bodyGradient.addColorStop(0, '#ff8c8c')
          bodyGradient.addColorStop(0.7, '#ff6b6b')
          bodyGradient.addColorStop(1, '#ff4757')
          
          ctx.fillStyle = bodyGradient
          ctx.beginPath()
          ctx.arc(monster.x + monster.w/2, monster.y + monster.h/2, monster.w/2, 0, Math.PI * 2)
          ctx.fill()
          
          // 身体轮廓
          ctx.strokeStyle = '#ff3838'
          ctx.lineWidth = 2
          ctx.stroke()
          
          // 绘制怪物眼睛 - 圆形眼睛
          // 左眼
          const eyeGradient = ctx.createRadialGradient(
            monster.x + monster.w * 0.3, monster.y + monster.h * 0.4, 0,
            monster.x + monster.w * 0.3, monster.y + monster.h * 0.4, 4
          )
          eyeGradient.addColorStop(0, '#fff')
          eyeGradient.addColorStop(0.8, '#ddd')
          eyeGradient.addColorStop(1, '#bbb')
          ctx.fillStyle = eyeGradient
          ctx.beginPath()
          ctx.arc(monster.x + monster.w * 0.3, monster.y + monster.h * 0.4, 4, 0, Math.PI * 2)
          ctx.fill()
          
          // 右眼
          ctx.beginPath()
          ctx.arc(monster.x + monster.w * 0.7, monster.y + monster.h * 0.4, 4, 0, Math.PI * 2)
          ctx.fill()
          
          // 瞳孔
          ctx.fillStyle = '#000'
          ctx.beginPath()
          ctx.arc(monster.x + monster.w * 0.3, monster.y + monster.h * 0.4, 2, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.beginPath()
          ctx.arc(monster.x + monster.w * 0.7, monster.y + monster.h * 0.4, 2, 0, Math.PI * 2)
          ctx.fill()
          
          // 眼睛高光
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(monster.x + monster.w * 0.28, monster.y + monster.h * 0.38, 1, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.beginPath()
          ctx.arc(monster.x + monster.w * 0.68, monster.y + monster.h * 0.38, 1, 0, Math.PI * 2)
          ctx.fill()
          
          // 绘制嘴巴
          ctx.strokeStyle = '#ff3838'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(monster.x + monster.w/2, monster.y + monster.h * 0.7, 6, 0, Math.PI)
          ctx.stroke()
          
          // 绘制小翅膀（因为是空中怪物）
          ctx.fillStyle = '#ff8c8c'
          
          // 左翅膀
          ctx.beginPath()
          ctx.ellipse(monster.x + monster.w * 0.2, monster.y + monster.h * 0.5, 3, 8, 0, 0, Math.PI * 2)
          ctx.fill()
          
          // 右翅膀
          ctx.beginPath()
          ctx.ellipse(monster.x + monster.w * 0.8, monster.y + monster.h * 0.5, 3, 8, 0, 0, Math.PI * 2)
          ctx.fill()
          
        } else if (monster.type === 'cave_spike') {
          // 洞刺兽绘制：像素风格野猪
          ctx.save()
          
          // 像素风格：关闭抗锯齿以获得清晰的像素效果
          ctx.imageSmoothingEnabled = false
          
          const centerX = monster.x + monster.w / 2
          const centerY = monster.y + monster.h / 2
          
          // 判断朝向（面向玩家）
          const playerCenterX = this.player.x + this.player.w / 2
          const monsterCenterX = monster.x + monster.w / 2
          const facingLeft = monsterCenterX > playerCenterX // 如果怪物在玩家右侧，面向左侧
          
          // 像素大小（用于像素艺术效果）
          const pixelSize = 2
          
          // 辅助函数：将坐标对齐到像素网格
          const pixelAlign = (val) => Math.floor(val / pixelSize) * pixelSize
          
          // 绘制身体主体（深红棕色/深栗色）
          ctx.fillStyle = '#8B4513' // 深红棕色
          ctx.fillRect(monster.x + monster.w * 0.2, monster.y + monster.h * 0.3, monster.w * 0.6, monster.h * 0.5)
          
          // 绘制背部高光（浅棕色）
          ctx.fillStyle = '#A0522D' // 浅棕色
          ctx.fillRect(monster.x + monster.w * 0.25, monster.y + monster.h * 0.25, monster.w * 0.5, monster.h * 0.15)
          
          // 绘制肩膀和臀部高光
          ctx.fillRect(monster.x + monster.w * 0.2, monster.y + monster.h * 0.35, monster.w * 0.15, monster.h * 0.1)
          ctx.fillRect(monster.x + monster.w * 0.65, monster.y + monster.h * 0.5, monster.w * 0.15, monster.h * 0.1)
          
          // 绘制腹部阴影（深紫棕色）
          ctx.fillStyle = '#654321' // 深紫棕色
          ctx.fillRect(monster.x + monster.w * 0.25, monster.y + monster.h * 0.6, monster.w * 0.5, monster.h * 0.2)
          
          // 绘制背部脊（深色毛发）
          ctx.fillStyle = '#5C4033' // 深棕色
          ctx.fillRect(monster.x + monster.w * 0.3, monster.y + monster.h * 0.2, monster.w * 0.4, monster.h * 0.05)
          
          // 根据朝向调整绘制位置
          let noseX, tuskX, eyeX, earX, breathX, headX
          if (facingLeft) {
            // 面向左侧（怪物在玩家右侧）
            headX = monster.x + monster.w * 0.05
            noseX = monster.x + monster.w * 0.02
            tuskX = monster.x + monster.w * 0.08
            eyeX = monster.x + monster.w * 0.15
            earX = monster.x + monster.w * 0.12
            breathX = monster.x - 3
          } else {
            // 面向右侧（怪物在玩家左侧）
            headX = monster.x + monster.w * 0.7
            noseX = monster.x + monster.w * 0.83
            tuskX = monster.x + monster.w * 0.67
            eyeX = monster.x + monster.w * 0.6
            earX = monster.x + monster.w * 0.63
            breathX = monster.x + monster.w + 3
          }
          
          // 绘制头部（深红棕色，稍微降低）
          ctx.fillStyle = '#8B4513'
          ctx.fillRect(headX, monster.y + monster.h * 0.35, monster.w * 0.25, monster.h * 0.25)
          
          // 绘制鼻子（浅红棕色，尖端粉红色）
          ctx.fillStyle = '#CD853F' // 浅红棕色
          ctx.fillRect(noseX, monster.y + monster.h * 0.4, monster.w * 0.15, monster.h * 0.12)
          
          // 鼻子尖端（粉红色）
          ctx.fillStyle = '#FFB6C1' // 粉红色
          if (facingLeft) {
            ctx.fillRect(noseX, monster.y + monster.h * 0.4, monster.w * 0.05, monster.h * 0.05)
          } else {
            ctx.fillRect(noseX + monster.w * 0.1, monster.y + monster.h * 0.4, monster.w * 0.05, monster.h * 0.05)
          }
          
          // 绘制鼻孔（深色）
          ctx.fillStyle = '#654321'
          ctx.fillRect(noseX + monster.w * 0.02, monster.y + monster.h * 0.42, 2, 2)
          ctx.fillRect(noseX + monster.w * 0.06, monster.y + monster.h * 0.42, 2, 2)
          
          // 绘制嘴巴（张开，深色内部）
          ctx.fillStyle = '#2C1810' // 深色
          ctx.fillRect(noseX + monster.w * 0.05, monster.y + monster.h * 0.48, monster.w * 0.08, monster.h * 0.04)
          
          // 绘制象牙（米白色/奶油色，向上弯曲）
          ctx.fillStyle = '#F5F5DC' // 米白色
          // 左象牙
          ctx.fillRect(tuskX, monster.y + monster.h * 0.5, 3, 8)
          ctx.fillRect(tuskX - (facingLeft ? 1 : -1), monster.y + monster.h * 0.52, 2, 6)
          // 右象牙
          ctx.fillRect(tuskX + monster.w * 0.05, monster.y + monster.h * 0.5, 3, 8)
          ctx.fillRect(tuskX + monster.w * 0.06 - (facingLeft ? 1 : -1), monster.y + monster.h * 0.52, 2, 6)
          
          // 象牙阴影（深色底部）
          ctx.fillStyle = '#D3D3D3'
          ctx.fillRect(tuskX, monster.y + monster.h * 0.55, 3, 3)
          ctx.fillRect(tuskX + monster.w * 0.05, monster.y + monster.h * 0.55, 3, 3)
          
          // 绘制眼睛（小白色眼睛，深色瞳孔）
          ctx.fillStyle = '#FFFFFF' // 白色
          ctx.fillRect(eyeX, monster.y + monster.h * 0.38, 4, 4)
          ctx.fillStyle = '#000000' // 黑色瞳孔
          ctx.fillRect(eyeX + 1, monster.y + monster.h * 0.39, 2, 2)
          
          // 绘制眉毛（深色，显示愤怒表情）
          ctx.fillStyle = '#5C4033'
          ctx.fillRect(eyeX - 1, monster.y + monster.h * 0.36, 6, 2)
          
          // 绘制耳朵（小尖耳朵）
          ctx.fillStyle = '#8B4513'
            ctx.beginPath()
          ctx.moveTo(earX, monster.y + monster.h * 0.35)
          ctx.lineTo(earX + 4, monster.y + monster.h * 0.3)
          ctx.lineTo(earX + 2, monster.y + monster.h * 0.38)
            ctx.closePath()
            ctx.fill()
            
          // 绘制前腿（粗壮，深紫棕色阴影）
          ctx.fillStyle = '#654321'
          // 前腿位置根据朝向调整
          const frontLegX = facingLeft ? monster.x + monster.w * 0.15 : monster.x + monster.w * 0.73
          const backLegX = facingLeft ? monster.x + monster.w * 0.65 : monster.x + monster.w * 0.25
          
          // 前腿
          ctx.fillRect(frontLegX, monster.y + monster.h * 0.7, monster.w * 0.12, monster.h * 0.3)
          // 前腿高光
          ctx.fillStyle = '#8B4513'
          ctx.fillRect(frontLegX + monster.w * 0.01, monster.y + monster.h * 0.72, monster.w * 0.1, monster.h * 0.1)
          
          // 绘制后腿（粗壮）
          ctx.fillStyle = '#654321'
          ctx.fillRect(backLegX, monster.y + monster.h * 0.75, monster.w * 0.1, monster.h * 0.25)
          // 后腿高光
          ctx.fillStyle = '#8B4513'
          ctx.fillRect(backLegX + monster.w * 0.01, monster.y + monster.h * 0.77, monster.w * 0.08, monster.h * 0.08)
          
          // 绘制尾巴（短而细，卷曲向上，在身体后方）
          const tailX = facingLeft ? monster.x + monster.w * 0.85 : monster.x + monster.w * 0.12
          ctx.fillStyle = '#8B4513'
          ctx.fillRect(tailX, monster.y + monster.h * 0.6, 3, 8)
          ctx.fillRect(tailX + (facingLeft ? 2 : -2), monster.y + monster.h * 0.55, 2, 5)
          
          // 绘制呼吸效果（小白色像素，在鼻子前）
          if (Math.sin(performance.now() * 0.005) > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
            ctx.fillRect(breathX, monster.y + monster.h * 0.45, 2, 2)
          }
          
          // 如果正在冲锋，显示冲锋效果
          if (monster.isCharging) {
            ctx.strokeStyle = '#ff0000'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(monster.x + monster.w / 2, monster.y)
            ctx.lineTo(monster.x + monster.w / 2, monster.y - 10)
            ctx.stroke()
          }
          
          // 恢复抗锯齿
          ctx.imageSmoothingEnabled = true
          ctx.restore()
        } else if (monster.type === 'rain_sea_flyer') {
          // 雨海飞虫：蓝色飞行小怪物，像素风格
          ctx.save()
          
          const centerX = monster.x + monster.w / 2
          const centerY = monster.y + monster.h / 2
          const time = Date.now() * 0.001
          
          // 绘制翅膀动画效果（上下扇动）
          const wingOffset = Math.sin(time * 8) * 3
          
          // 绘制身体（蓝色圆形）
          ctx.fillStyle = '#4a90e2'
          ctx.beginPath()
          ctx.arc(centerX, centerY, monster.w * 0.4, 0, Math.PI * 2)
          ctx.fill()
          
          // 绘制翅膀（左右两侧，带动画）
          ctx.fillStyle = '#6bb3ff'
          // 左翅膀
          ctx.beginPath()
          ctx.ellipse(monster.x + monster.w * 0.2, centerY + wingOffset, monster.w * 0.25, monster.h * 0.3, -0.3, 0, Math.PI * 2)
          ctx.fill()
          // 右翅膀
          ctx.beginPath()
          ctx.ellipse(monster.x + monster.w * 0.8, centerY - wingOffset, monster.w * 0.25, monster.h * 0.3, 0.3, 0, Math.PI * 2)
          ctx.fill()
          
          // 绘制眼睛（白色高光）
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(monster.x + monster.w * 0.35, centerY - 2, 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(monster.x + monster.w * 0.65, centerY - 2, 3, 0, Math.PI * 2)
          ctx.fill()
          
          // 绘制瞳孔（黑色）
          ctx.fillStyle = '#000000'
          ctx.beginPath()
          ctx.arc(monster.x + monster.w * 0.35, centerY - 2, 1.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(monster.x + monster.w * 0.65, centerY - 2, 1.5, 0, Math.PI * 2)
          ctx.fill()
          
          // 绘制轮廓（深蓝色）
          ctx.strokeStyle = '#2a5a8a'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(centerX, centerY, monster.w * 0.4, 0, Math.PI * 2)
          ctx.stroke()
          
          ctx.restore()
        } else {
          // 其他类型怪物保持原有简单绘制
          ctx.fillStyle = monster.color
          ctx.fillRect(monster.x, monster.y, monster.w, monster.h)
          
          // 绘制怪物眼睛
          ctx.fillStyle = '#fff'
          ctx.fillRect(monster.x + monster.w * 0.2, monster.y + monster.h * 0.3, 6, 6)
          ctx.fillRect(monster.x + monster.w * 0.6, monster.y + monster.h * 0.3, 6, 6)
          ctx.fillStyle = '#000'
          ctx.fillRect(monster.x + monster.w * 0.22, monster.y + monster.h * 0.32, 3, 3)
          ctx.fillRect(monster.x + monster.w * 0.62, monster.y + monster.h * 0.32, 3, 3)
        }
        
        // 绘制血条（所有怪物通用）
        const hpRatio = Math.max(0, monster.hp / monster.maxHp)
        
        // 血条背景
        ctx.fillStyle = '#333'
        ctx.fillRect(monster.x - 2, monster.y - 12, monster.w + 4, 6)
        
        // 血条前景
        const hpGradient = ctx.createLinearGradient(monster.x, monster.y - 12, monster.x + monster.w * hpRatio, monster.y - 12)
        if (hpRatio > 0.5) {
          hpGradient.addColorStop(0, '#4CAF50')
          hpGradient.addColorStop(1, '#66BB6A')
        } else if (hpRatio > 0.25) {
          hpGradient.addColorStop(0, '#ff9800')
          hpGradient.addColorStop(1, '#ffb74d')
        } else {
          hpGradient.addColorStop(0, '#f44336')
          hpGradient.addColorStop(1, '#ef5350')
        }
        ctx.fillStyle = hpGradient
        ctx.fillRect(monster.x - 2, monster.y - 12, (monster.w + 4) * hpRatio, 6)
        
        // 血条边框
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1
        ctx.strokeRect(monster.x - 2, monster.y - 12, monster.w + 4, 6)
      })
    },
    
    // drawTreasures(ctx) { // 绘制宝物（已移除）
    //   this.treasures.forEach(treasure => {
    //     ctx.fillStyle = treasure.color
    //     ctx.fillRect(treasure.x, treasure.y, treasure.w, treasure.h)
    //     
    //     // 绘制宝物图标
    //     ctx.fillStyle = '#fff'
    //     ctx.font = '12px Arial'
    //     ctx.fillText(treasure.icon, treasure.x + 4, treasure.y + 15)
    //     
    //     // 发光效果
    //     ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    //     ctx.lineWidth = 1
    //     ctx.strokeRect(treasure.x, treasure.y, treasure.w, treasure.h)
    //   })
    // },
    
    // 生成谱尼BOSS
    spawnPuniBoss() {
      const zone = this.unknownZone
      // 在未知区中心生成
      this.puniBoss.x = zone.x + zone.width / 2 - this.puniBoss.w / 2
      this.puniBoss.y = zone.y + zone.height / 2 - this.puniBoss.h / 2
      this.puniBoss.spawned = true
      this.puniBoss.targetX = this.puniBoss.x
      // 初始化攻击状态
      this.puniBoss.attackCooldown = 0
      this.puniBoss.currentSkill = null
      this.puniBoss.skillCastTime = 0
      this.puniBoss.wasInZone = false
      const puniCenterX = this.puniBoss.x + this.puniBoss.w / 2
      const puniCenterY = this.puniBoss.y + this.puniBoss.h / 2
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      const initialDistance = Math.sqrt(
        Math.pow(playerCenterX - puniCenterX, 2) + 
        Math.pow(playerCenterY - puniCenterY, 2)
      )
      
      console.log('🎮 谱尼BOSS已生成', {
        BOSS中心位置: { x: puniCenterX.toFixed(1), y: puniCenterY.toFixed(1) },
        BOSS范围: { w: this.puniBoss.w, h: this.puniBoss.h },
        玩家中心位置: { x: playerCenterX.toFixed(1), y: playerCenterY.toFixed(1) },
        初始距离: initialDistance.toFixed(1) + 'px',
        攻击范围: this.puniBoss.attackRange + 'px',
        攻击触发: initialDistance <= this.puniBoss.attackRange ? '✅ 立即触发' : '❌ 需要靠近'
      })
      
      // 如果初始距离就在攻击范围内，立即触发攻击
      if (initialDistance <= this.puniBoss.attackRange) {
        this.puniBoss.attackCooldown = 0
        this.puniBoss.wasInZone = true
        console.log('⚡ 玩家已在攻击范围内，BOSS准备立即攻击！')
      }
    },
    
    // 更新谱尼BOSS
    updatePuniBoss(dt) {
      if (!this.puniBoss.spawned) return
      
      const puni = this.puniBoss
      const now = performance.now() / 1000
      
      // 更新动画
      puni.energyBody.glowPhase += dt * 2
      puni.energyBody.glowIntensity = 0.8 + Math.sin(puni.energyBody.glowPhase) * 0.2
      puni.floatPhase += dt * 0.5
      
      // 更新触翼动画
      puni.wings.forEach((wing, i) => {
        wing.phase += dt * (0.5 + i * 0.1)
        wing.glow = 0.5 + Math.sin(wing.phase) * 0.5
        wing.swingPhase += dt * (0.8 + i * 0.2) // 摆动动画
      })
      
      // 更新触手动画（摆动）
      puni.tentacles.forEach((tentacle, i) => {
        tentacle.phase += dt * (0.3 + i * 0.1)
        tentacle.glow = 0.7 + Math.sin(tentacle.phase) * 0.3
        tentacle.swingPhase += dt * (1.0 + i * 0.15) // 摆动速度（每根触手不同）
      })
      
      // 更新封印之石动画
      puni.sealStones.forEach((stone, i) => {
        stone.angle += dt * 0.3
        stone.glow = 0.7 + Math.sin(now * 2 + i) * 0.3
      })
      
      // 更新技能CD
      Object.keys(puni.skillCooldowns).forEach(key => {
        if (puni.skillCooldowns[key] > 0) {
          puni.skillCooldowns[key] = Math.max(0, puni.skillCooldowns[key] - dt)
        }
      })
      
      // 更新攻击冷却
      if (puni.attackCooldown > 0) {
        puni.attackCooldown = Math.max(0, puni.attackCooldown - dt)
      }
      
      // 形态切换：当血量低于50%时切换到进化形态
      const hpPercent = puni.hp / puni.maxHp
      if (hpPercent <= 0.5 && puni.form === 'original') {
        puni.form = 'evolved'
        console.log('🔥 普尼进化！进入进化形态！')
      } else if (hpPercent > 0.5 && puni.form === 'evolved') {
        puni.form = 'original'
        console.log('普尼恢复原初形态')
      }
      
      // 更新buff持续时间
      if (puni.buffs.shengGuangQi > 0) {
        puni.buffs.shengGuangQi = Math.max(0, puni.buffs.shengGuangQi - dt)
      }
      if (puni.buffs.cuiLingShengGuang > 0) {
        puni.buffs.cuiLingShengGuang = Math.max(0, puni.buffs.cuiLingShengGuang - dt)
        // 如果护盾存在，每回合回复体力
        if (puni.buffs.cuiLingShengGuang > 0) {
          puni.hp = Math.min(puni.maxHp, puni.hp + puni.maxHp * 0.01 * dt) // 每秒回复1%血量
        }
      }
      
      // 计算玩家和BOSS之间的距离
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      const puniCenterX = puni.x + puni.w / 2
      const puniCenterY = puni.y + puni.h / 2
      
      const dx = playerCenterX - puniCenterX
      const dy = playerCenterY - puniCenterY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // 检查玩家是否在BOSS攻击范围内
      const playerInAttackRange = distance <= puni.attackRange
      
      // 调试信息：只在进入/离开攻击范围时输出，减少日志
      if (puni.hp > 0) {
        // 只在状态改变时输出
        const stateChanged = (playerInAttackRange && !puni.wasInZone) || (!playerInAttackRange && puni.wasInZone)
        if (stateChanged || (!puni.lastDebugTime || now - puni.lastDebugTime > 5)) {
          puni.lastDebugTime = now
          if (stateChanged || playerInAttackRange) {
            console.log('📍 BOSS:', playerInAttackRange ? '✅ 在攻击范围' : '❌ 不在攻击范围', 
              '距离:', distance.toFixed(0) + 'px', 
              '技能:', puni.currentSkill || '无',
              'CD:', puni.attackCooldown.toFixed(1) + 's')
          }
        }
      }
      
      // 检查玩家是否刚刚进入攻击范围
      const justEnteredRange = playerInAttackRange && !puni.wasInZone
      // 更新wasInZone状态（现在用来表示是否在攻击范围内）
      puni.wasInZone = playerInAttackRange
      
      if (playerInAttackRange && puni.hp > 0) {
        // 玩家进入攻击范围，开始战斗
        // 如果玩家刚刚进入攻击范围，立即重置攻击冷却，让BOSS立即攻击
        if (justEnteredRange) {
          puni.attackCooldown = 0
          puni.currentSkill = null
          puni.skillCastTime = 0
          puni.skillData = null
          console.log('🚨 玩家进入BOSS攻击范围！距离:', distance.toFixed(0) + 'px')
        }
        
        // 确保攻击冷却为0或很小，以便立即攻击
        if (puni.attackCooldown > 0.1 && !puni.currentSkill) {
          puni.attackCooldown = 0 // 直接设置为0，确保能立即选择技能
        }
        
        // AI：选择技能和使用技能
        this.updatePuniBossAI(dt)
        
        // 执行当前技能
        if (puni.currentSkill) {
          this.executePuniSkill(puni.currentSkill, dt)
        } else if (puni.attackCooldown <= 0) {
          // 如果没有选择技能但冷却已结束，强制选择技能
          puni.attackCooldown = 0
          this.updatePuniBossAI(dt)
        }
      } else if (!playerInAttackRange && puni.hp > 0) {
        // 玩家不在攻击范围内，重置攻击状态，这样当玩家进入时会立即攻击
        if (puni.attackCooldown > 0.1) {
          puni.attackCooldown = 0.1 // 减少冷却时间，让BOSS更快攻击
        }
        // 清除当前技能状态
        if (puni.currentSkill) {
          puni.currentSkill = null
          puni.skillCastTime = 0
          puni.skillData = null
        }
      }
      
      // 悬浮移动
      const floatOffset = Math.sin(puni.floatPhase) * 20
      puni.y = (this.unknownZone.y + this.unknownZone.height / 2 - puni.h / 2) + floatOffset
      
      // 水平移动（缓慢追踪玩家）- 只要玩家在攻击范围内就追踪
      if (playerInAttackRange) {
        if (Math.abs(dx) > 50) {
          puni.x += Math.sign(dx) * puni.moveSpeed * dt
        }
      }
      
      // 检查玩家碰撞
      if (this.rectsCollide(this.player, puni) && performance.now() > this.invincibleUntil) {
        // 玩家触碰谱尼造成伤害
        this.hp -= 5
        this.invincibleUntil = performance.now() + 1000
        this.showDamageEffect(this.player.x + this.player.w / 2, this.player.y, 5)
      }
    },
    
    // 扣除普尼10%血量
    damagePuni10Percent() {
      if (!this.puniBoss || !this.puniBoss.spawned || this.puniBoss.hp <= 0) {
        return
      }
      
      const puni = this.puniBoss
      const damage = Math.floor(puni.maxHp * 0.1) // 扣除10%血量
      
      // 扣除血量
      puni.hp = Math.max(0, puni.hp - damage)
      
      // 显示伤害效果
      this.showDamageEffect(puni.x + puni.w / 2, puni.y, damage)
      
      // 缩壳效果（受到攻击时）
      puni.energyBody.isContracted = true
      setTimeout(() => {
        puni.energyBody.isContracted = false
      }, 500)
      
      // 如果谱尼死亡
      if (puni.hp <= 0) {
        this.gameStatus = '谱尼已被击败！无尽能源已掉落！'
        this.money += 10000 // 金钱奖励
        
        // 记录击败标记
        try {
          const saved = localStorage.getItem('delta-action-game')
          const data = saved ? JSON.parse(saved) : {}
          data.flags = data.flags || {}
          data.flags.puniDefeated = true
          localStorage.setItem('delta-action-game', JSON.stringify(data))
        } catch (e) {
          console.error('保存击败标记失败:', e)
        }
        
        // 在普尼位置生成一个大的无尽能源掉落物
        const puniCenterX = puni.x + puni.w / 2
        const puniCenterY = puni.y + puni.h / 2
        
        const infiniteEnergyDrop = {
          name: '无尽能源',
          type: 'infinite_energy',
          value: 9999, // 极高的价值
          icon: '⚡', // 使用闪电图标
          x: puniCenterX - 40, // 掉落物中心位置（更大的尺寸）
          y: puniCenterY - 40,
          w: 80, // 更大的尺寸，更容易看到
          h: 80,
          timestamp: Date.now(),
          collected: false,
          fixedOnGround: false, // 不固定在地面，可以漂浮
          isInfiniteEnergy: true, // 标记为无尽能源，用于特殊绘制
          glowIntensity: 1.0 // 发光强度
        }
        
        this.player.drops.push(infiniteEnergyDrop)
        
        console.log('⚡ 无尽能源掉落物已生成！', {
          位置: { x: infiniteEnergyDrop.x, y: infiniteEnergyDrop.y },
          大小: { w: infiniteEnergyDrop.w, h: infiniteEnergyDrop.h }
        })
        
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 3000)
      }
    },
    
    // 谱尼BOSS AI
    updatePuniBossAI(dt) {
      const puni = this.puniBoss
      
      // 检查玩家是否在攻击范围内
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      const puniCenterX = puni.x + puni.w / 2
      const puniCenterY = puni.y + puni.h / 2
      const dx = playerCenterX - puniCenterX
      const dy = playerCenterY - puniCenterY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const playerInRange = distance <= puni.attackRange
      
      // 如果玩家不在攻击范围内，不选择技能
      if (!playerInRange) {
        return
      }
      
      // 如果当前没有技能在执行，选择新技能
      if (!puni.currentSkill && puni.attackCooldown <= 0) {
        // 根据血量和形态选择技能
        const hpPercent = puni.hp / puni.maxHp
        let availableSkillPool = []
        
        // 原初形态技能池（根据血量阶段）
        if (puni.form === 'original') {
          // 第一阶段（100%-70%）：基础技能
          if (hpPercent > 0.7) {
            availableSkillPool = [
              'siZhouJiGuang',      // 四周激光：散射一圈激光子弹
              'sanSheJiGuangDan',   // 散发激光球：从中心持续散发激光球
              'shiZiJiGuangZhen',    // 十字激光阵：向四个方向发射激光
              'chengQunZiDan'        // 成群子弹：向玩家发射大量子弹
            ]
          }
          // 第二阶段（70%-40%）：增加攻击技能
          else if (hpPercent > 0.4) {
            availableSkillPool = [
              'siZhouJiGuang',      // 四周激光
              'sanSheJiGuangDan',   // 散发激光球
              'shiZiJiGuangZhen',   // 十字激光阵
              'qianLieXuGuangShan', // 千烈虚光闪：扇形光刃
              'shanXingDanMu',      // 扇形弹幕
              'yuanQiDan',          // 元气弹
              'chengQunZiDan'       // 成群子弹：向玩家发射大量子弹
            ]
          }
          // 第三阶段（40%-20%）：增加强力技能
          else if (hpPercent > 0.2) {
            availableSkillPool = [
              'siZhouJiGuang',      // 四周激光
              'sanSheJiGuangDan',   // 散发激光球
              'shiZiJiGuangZhen',   // 十字激光阵
              'qianLieXuGuangShan', // 千烈虚光闪
              'xuanMieLieKongZhen',  // 旋灭裂空阵：旋转攻击
              'shanXingDanMu',      // 扇形弹幕
              'genZongZiDan',       // 跟踪子弹
              'xuanZhuanDanMu',     // 旋转弹幕
              'yuanQiDan',          // 元气弹
              'shengGuangQi',       // 圣光气：强化技能
              'chengQunZiDan'       // 成群子弹：向玩家发射大量子弹
            ]
          }
          // 第四阶段（20%-0%）：所有技能
          else {
            availableSkillPool = [
              'siZhouJiGuang',      // 四周激光
              'sanSheJiGuangDan',   // 散发激光球
              'shiZiJiGuangZhen',    // 十字激光阵
              'qianLieXuGuangShan', // 千烈虚光闪
              'xuanMieLieKongZhen', // 旋灭裂空阵
              'shengLingMoShanGuang', // 圣灵魔闪光：必杀技
              'shengYingLiuGuangPo',  // 圣影流光破
              'cuiLingShengGuang',    // 璀灵圣光：护盾
              'shanXingDanMu',       // 扇形弹幕
              'genZongZiDan',        // 跟踪子弹
              'xuanZhuanDanMu',      // 旋转弹幕
              'lianXuChongCi',       // 连续冲刺
              'jiGuangSaoShe',       // 激光扫射
              'quYuBaoZha',          // 区域爆炸
              'yuanQiDan',           // 元气弹
              'shengGuangQi',        // 圣光气
              'chengQunZiDan'        // 成群子弹：向玩家发射大量子弹
            ]
          }
        }
        // 进化形态：使用追踪能量波和强力技能
        else if (puni.form === 'evolved') {
          if (hpPercent > 0.3) {
            availableSkillPool = [
              'zhuiZongNengLiangBo', // 追踪能量波
              'shanXingDanMu',       // 扇形弹幕
              'genZongZiDan',        // 跟踪子弹
              'xuanZhuanDanMu',      // 旋转弹幕
              'chengQunZiDan'        // 成群子弹：向玩家发射大量子弹
            ]
          } else {
            availableSkillPool = [
              'zhuiZongNengLiangBo', // 追踪能量波
              'shanXingDanMu',       // 扇形弹幕
              'genZongZiDan',        // 跟踪子弹
              'xuanZhuanDanMu',      // 旋转弹幕
              'lianXuChongCi',       // 连续冲刺
              'jiGuangSaoShe',       // 激光扫射
              'quYuBaoZha',          // 区域爆炸
              'shengLingMoShanGuang', // 圣灵魔闪光
              'chengQunZiDan'        // 成群子弹：向玩家发射大量子弹
            ]
          }
        }
        
        // 从可用技能池中选择冷却完成的技能
        const availableSkills = availableSkillPool.filter(s => puni.skillCooldowns[s] <= 0)
          
        if (availableSkills.length > 0) {
          // 随机选择技能（所有技能平等机会）
          const selectedSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)]
          
          puni.currentSkill = selectedSkill
          puni.skillCastTime = 0
          puni.skillData = null // 重置技能数据
          puni.attackCooldown = 0 // 确保攻击冷却为0
          console.log('✅ 谱尼选择技能:', selectedSkill, `(可用技能: ${availableSkills.length}个)`)
        } else {
          // 所有技能都在CD，等待最短的CD
          const allCooldowns = Object.entries(puni.skillCooldowns)
            .filter(([skill, cd]) => availableSkillPool.includes(skill) && cd > 0)
            .map(([skill, cd]) => ({ skill, cd }))
            .sort((a, b) => a.cd - b.cd)
          
          if (allCooldowns.length > 0) {
            const shortestCD = allCooldowns[0].cd
            puni.attackCooldown = Math.min(shortestCD, 0.5) // 等待最多0.5秒
            console.log('谱尼等待技能CD，最短CD:', shortestCD.toFixed(2) + '秒')
          } else {
            // 如果没有可用技能，短暂等待
            puni.attackCooldown = 0.2
            console.log('谱尼所有技能都在CD，等待中...')
          }
        }
      } else if (puni.currentSkill) {
        // 调试信息：正在执行技能
        // console.log('谱尼正在执行技能:', puni.currentSkill, '技能时间:', puni.skillCastTime.toFixed(2))
      } else if (puni.attackCooldown > 0) {
        // 调试信息：攻击冷却中
        // console.log('谱尼攻击冷却中:', puni.attackCooldown.toFixed(2))
      }
    },
    
    // 执行谱尼技能
    executePuniSkill(skillName, dt) {
      const puni = this.puniBoss
      puni.skillCastTime += dt
      
      switch (skillName) {
        case 'siZhouJiGuang':
          this.executeSiZhouJiGuang(dt)
          break
        case 'qianLieXuGuangShan':
          this.executeQianLieXuGuangShan(dt)
          break
        case 'xuanMieLieKongZhen':
          this.executeXuanMieLieKongZhen(dt)
          break
        case 'shengGuangQi':
          this.executeShengGuangQi(dt)
          break
        case 'shengLingMoShanGuang':
          this.executeShengLingMoShanGuang(dt)
          break
        case 'shengYingLiuGuangPo':
          this.executeShengYingLiuGuangPo(dt)
          break
        case 'cuiLingShengGuang':
          this.executeCuiLingShengGuang(dt)
          break
        // 新攻击技能
        case 'shanXingDanMu':
          this.executeShanXingDanMu(dt)
          break
        case 'genZongZiDan':
          this.executeGenZongZiDan(dt)
          break
        case 'xuanZhuanDanMu':
          this.executeXuanZhuanDanMu(dt)
          break
        case 'lianXuChongCi':
          this.executeLianXuChongCi(dt)
          break
        case 'jiGuangSaoShe':
          this.executeJiGuangSaoShe(dt)
          break
        case 'quYuBaoZha':
          this.executeQuYuBaoZha(dt)
          break
        case 'yuanQiDan':
          this.executeYuanQiDan(dt)
          break
        // 形态专属技能
        case 'shiZiJiGuangZhen':
          this.executeShiZiJiGuangZhen(dt)
          break
        case 'zhuiZongNengLiangBo':
          this.executeZhuiZongNengLiangBo(dt)
          break
        case 'sanSheJiGuangDan':
          this.executeSanSheJiGuangDan(dt)
          break
        case 'chengQunZiDan':
          this.executeChengQunZiDan(dt)
          break
      }
    },
    
    // 第一种攻击：散射一圈激光子弹（从身体散发，呈现圆周形态）
    executeSiZhouJiGuang(dt) {
      const puni = this.puniBoss
      
      if (puni.skillCastTime < 0.4) {
        // 蓄力阶段：身体发光聚集能量
        return
      } else if (puni.skillCastTime < 0.8) {
        // 释放阶段：从身体散发一圈激光子弹
        if (!puni.skillData) {
          puni.skillData = { bulletsCreated: false }
        }
        
        if (!puni.skillData.bulletsCreated) {
          const puniCenterX = puni.x + puni.w / 2
          const puniCenterY = puni.y + puni.h / 2
          
          // 计算身体半径（用于确定子弹起始位置）
          const bodyRadius = Math.max(puni.w / 2, puni.h / 2) * 0.8 // 从身体边缘80%位置散发
          
          // 发射一圈激光弹（减少数量，增大间距，更慢速度，便于躲避）
          const bulletCount = 12 // 减少到12发子弹，间距30度（更容易躲避）
          const angleStep = (Math.PI * 2) / bulletCount
          const speed = 80 // 进一步降低速度（从100降到80），让子弹非常缓慢地散射
          
          for (let i = 0; i < bulletCount; i++) {
            const angle = i * angleStep
            
            // 子弹从身体边缘散发（而不是从中心）
            const startX = puniCenterX + Math.cos(angle) * bodyRadius
            const startY = puniCenterY + Math.sin(angle) * bodyRadius * 0.6 // Y轴压缩以适应视角
            
            // 子弹方向（从身体向外，沿径向方向）
            const directionX = Math.cos(angle)
            const directionY = Math.sin(angle)
            
            this.monsterBullets.push({
              x: startX,
              y: startY,
              w: 40, // 进一步增大子弹大小（从36增加到40），让玩家更容易看到和躲避
              h: 40,
              vx: directionX * speed,
              vy: directionY * speed,
              damage: puni.damageValues.siZhouJiGuang,
              type: 'puni_laser_bullet', // 激光子弹类型
              color: '#00ffff', // 青色激光弹
              glow: 1,
              lifetime: 12, // 增加持续时间（从10秒增加到12秒），因为速度更慢了
              trail: [], // 激光轨迹
              // 添加圆周形态的视觉标识
              isCircular: true,
              originalAngle: angle // 保存原始角度，用于视觉效果
            })
          }
          
          puni.skillCooldowns.siZhouJiGuang = 2.5 // 稍微增加冷却时间（从2秒增加到2.5秒），给玩家更多喘息时间
          puni.skillData.bulletsCreated = true
          console.log('💥 谱尼发射慢速激光弹！数量: 12，速度: 80（间距更大，更易躲避）')
        }
      } else if (puni.skillCastTime >= 1.2) {
        // 技能结束
        puni.currentSkill = null
        puni.skillCastTime = 0
        puni.skillData = null
        puni.attackCooldown = 0.2 // 大幅减少攻击冷却时间（从0.5秒减少到0.2秒），让谱尼更频繁攻击
      }
    },
    
    // 千烈虚光闪
    executeQianLieXuGuangShan(dt) {
      const puni = this.puniBoss
      
      if (puni.skillCastTime < 0.5) {
        // 蓄力阶段：头部触条交织
        return
      } else if (puni.skillCastTime < 1.0) {
        // 释放阶段：光球分裂为光刃
        if (!puni.skillData) {
          puni.skillData = { bulletsCreated: false }
        }
        
        if (!puni.skillData.bulletsCreated) {
          // 创建光刃子弹
          const puniCenterX = puni.x + puni.w / 2
          const puniCenterY = puni.y + puni.h / 2
          const playerCenterX = this.player.x + this.player.w / 2
          const playerCenterY = this.player.y + this.player.h / 2
          
          const dx = playerCenterX - puniCenterX
          const dy = playerCenterY - puniCenterY
          const dist = Math.sqrt(dx * dx + dy * dy)
          const angle = Math.atan2(dy, dx)
          
          // 生成扇形光刃（10-15个）
          const bulletCount = 12
          for (let i = 0; i < bulletCount; i++) {
            const spreadAngle = angle + (i - bulletCount / 2) * (Math.PI / 6) / bulletCount
            this.monsterBullets.push({
              x: puniCenterX,
              y: puniCenterY,
              w: 20,
              h: 20,
              vx: Math.cos(spreadAngle) * 600,
              vy: Math.sin(spreadAngle) * 600,
              damage: puni.damageValues.qianLieXuGuangShan,
              type: 'puni_light_blade',
              color: '#ffffff',
              glow: 1,
              lifetime: 2
            })
          }
          
          puni.skillCooldowns.qianLieXuGuangShan = 3
          puni.skillData.bulletsCreated = true
        }
      } else if (puni.skillCastTime >= 1.5) {
        // 技能结束
        puni.currentSkill = null
        puni.skillCastTime = 0
        puni.skillData = null
        puni.attackCooldown = 1
      }
    },
    
    // 旋灭裂空阵
    executeXuanMieLieKongZhen(dt) {
      const puni = this.puniBoss
      
      if (puni.skillCastTime < 0.8) {
        // 蓄力阶段：触翼旋转
        return
      } else if (puni.skillCastTime < 1.5) {
        // 释放阶段：光轮攻击
        if (!puni.skillData) {
          puni.skillData = { bulletCreated: false }
        }
        
        if (!puni.skillData.bulletCreated) {
          const puniCenterX = puni.x + puni.w / 2
          const puniCenterY = puni.y + puni.h / 2
          const playerCenterX = this.player.x + this.player.w / 2
          const playerCenterY = this.player.y + this.player.h / 2
          
          const dx = playerCenterX - puniCenterX
          const dy = playerCenterY - puniCenterY
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          this.monsterBullets.push({
            x: puniCenterX,
            y: puniCenterY,
            w: 40,
            h: 40,
            vx: (dx / dist) * 400,
            vy: (dy / dist) * 400,
            damage: puni.damageValues.xuanMieLieKongZhen,
            type: 'puni_light_wheel',
            color: '#ffd700',
            rotation: 0,
            rotationSpeed: 10,
            lifetime: 3,
            dotDamage: 30, // 后续5回合固定伤害
            dotTurns: 5
          })
          
          puni.skillCooldowns.xuanMieLieKongZhen = 4
          puni.skillData.bulletCreated = true
        }
      } else if (puni.skillCastTime >= 2.0) {
        puni.currentSkill = null
        puni.skillCastTime = 0
        puni.skillData = null
        puni.attackCooldown = 1.5
      }
    },
    
    // 圣光气
    executeShengGuangQi(dt) {
      const puni = this.puniBoss
      
      if (puni.skillCastTime >= 1.0) {
        // 强化完成：下两回合必定暴击
        puni.buffs.shengGuangQi = 10 // 10秒（约2回合）
        puni.skillCooldowns.shengGuangQi = 15
        puni.currentSkill = null
        puni.skillCastTime = 0
        this.gameStatus = '谱尼：圣光气！下两回合必定致命一击！'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 2000)
      }
    },
    
    // 圣灵魔闪光（必杀技）
    executeShengLingMoShanGuang(dt) {
      const puni = this.puniBoss
      
      if (puni.skillCastTime < 1.0) {
        // 蓄力阶段：悬浮升高
        return
      } else if (puni.skillCastTime < 2.5) {
        // 释放阶段：巨型光球
        if (!puni.skillData) {
          puni.skillData = { bulletCreated: false }
        }
        
        if (!puni.skillData.bulletCreated && puni.skillCastTime >= 1.5) {
          const puniCenterX = puni.x + puni.w / 2
          const puniCenterY = puni.y
          
          this.monsterBullets.push({
            x: puniCenterX - 100,
            y: puniCenterY - 200,
            w: 200,
            h: 200,
            vx: 0,
            vy: 150, // 缓慢下落
            damage: puni.damageValues.shengLingMoShanGuang,
            type: 'puni_ultimate_orb',
            color: '#ffffff',
            glow: 1,
            lifetime: 5,
            explosionRadius: 400,
            lifeSteal: true
          })
          
          puni.skillCooldowns.shengLingMoShanGuang = 20
          puni.skillData.bulletCreated = true
        }
      } else if (puni.skillCastTime >= 3.5) {
        puni.currentSkill = null
        puni.skillCastTime = 0
        puni.skillData = null
        puni.attackCooldown = 2
      }
    },
    
    // 圣影流光破
    executeShengYingLiuGuangPo(dt) {
      const puni = this.puniBoss
      
      if (puni.skillCastTime < 0.6) {
        return
      } else if (puni.skillCastTime < 1.2) {
        if (!puni.skillData) {
          puni.skillData = { bulletCreated: false }
        }
        
        if (!puni.skillData.bulletCreated) {
          const puniCenterX = puni.x + puni.w / 2
          const puniCenterY = puni.y + puni.h / 2
          const playerCenterX = this.player.x + this.player.w / 2
          const playerCenterY = this.player.y + this.player.h / 2
          
          const dx = playerCenterX - puniCenterX
          const dy = playerCenterY - puniCenterY
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          this.monsterBullets.push({
            x: puniCenterX,
            y: puniCenterY,
            w: 30,
            h: 30,
            vx: (dx / dist) * 500,
            vy: (dy / dist) * 500,
            damage: puni.damageValues.shengYingLiuGuangPo,
            type: 'puni_shadow_star',
            color: '#9370db',
            lifetime: 3,
            lifeSteal: true,
            lifeStealAmount: 100 // 吸取体力
          })
          
          puni.skillCooldowns.shengYingLiuGuangPo = 5
          puni.skillData.bulletCreated = true
        }
      } else if (puni.skillCastTime >= 1.8) {
        puni.currentSkill = null
        puni.skillCastTime = 0
        puni.skillData = null
        puni.attackCooldown = 1
      }
    },
    
    // 璀灵圣光
    executeCuiLingShengGuang(dt) {
      const puni = this.puniBoss
      
      if (puni.skillCastTime >= 1.0) {
        // 生成护盾和回复效果
        puni.buffs.cuiLingShengGuang = 10 // 10秒
        puni.buffs.shield = puni.maxHp * 0.3 // 30%最大血量护盾
        
        // 回复体力
        puni.hp = Math.min(puni.maxHp, puni.hp + puni.maxHp * 0.1) // 回复10%血量
        
        puni.skillCooldowns.cuiLingShengGuang = 25
        puni.currentSkill = null
        puni.skillCastTime = 0
        this.gameStatus = '谱尼：璀灵圣光！免疫伤害，先手翻倍！'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 2000)
      }
    },
    
    // ========== 新攻击技能实现 ==========
    
    // 技能1：扇形弹幕（向玩家发射扇形分布的子弹）
    executeShanXingDanMu(dt) {
      const puni = this.puniBoss
      
      if (puni.skillCastTime < 0.3) {
        // 蓄力阶段
        return
      } else if (puni.skillCastTime < 0.6) {
        // 释放阶段
        if (!puni.skillData) {
          puni.skillData = { bulletsCreated: false }
        }
        
        if (!puni.skillData.bulletsCreated) {
          const puniCenterX = puni.x + puni.w / 2
          const puniCenterY = puni.y + puni.h / 2
          const playerCenterX = this.player.x + this.player.w / 2
          const playerCenterY = this.player.y + this.player.h / 2
          
          const dx = playerCenterX - puniCenterX
          const dy = playerCenterY - puniCenterY
          const baseAngle = Math.atan2(dy, dx)
          
          // 发射5发扇形子弹
          const bulletCount = 5
          const spreadAngle = Math.PI / 4 // 45度扇形范围
          const speed = 500
          
          for (let i = 0; i < bulletCount; i++) {
            const angle = baseAngle + (i - bulletCount / 2) * (spreadAngle / (bulletCount - 1))
            
            this.monsterBullets.push({
              x: puniCenterX,
              y: puniCenterY,
              w: 16,
              h: 16,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              damage: puni.damageValues.shanXingDanMu,
              type: 'puni_fan_bullet',
              color: '#ff6b6b', // 红色扇形子弹
              glow: 1,
              lifetime: 3
            })
          }
          
          puni.skillCooldowns.shanXingDanMu = 3
          puni.skillData.bulletsCreated = true
        }
      } else if (puni.skillCastTime >= 1.0) {
        puni.currentSkill = null
        puni.skillCastTime = 0
        puni.skillData = null
        puni.attackCooldown = 0.5
      }
    },
    
    // 技能2：跟踪子弹（缓慢跟踪玩家）
    executeGenZongZiDan(dt) {
      const puni = this.puniBoss
      
      if (puni.skillCastTime < 0.4) {
        // 蓄力阶段
        return
      } else if (puni.skillCastTime < 0.8) {
        // 释放阶段
        if (!puni.skillData) {
          puni.skillData = { bulletsCreated: false }
        }
        
        if (!puni.skillData.bulletsCreated) {
          const puniCenterX = puni.x + puni.w / 2
          const puniCenterY = puni.y + puni.h / 2
          
          // 发射6发跟踪子弹（增加数量，但速度更慢，便于玩家躲避）
          const bulletCount = 6
          const initialSpeed = 120 // 降低初始速度（从300降到120），让玩家更容易看到
          
          for (let i = 0; i < bulletCount; i++) {
            // 略微分散的初始角度，让子弹从不同方向发射
            const baseAngle = (Math.PI * 2 * i) / bulletCount
            const spreadAngle = baseAngle + (Math.random() - 0.5) * 0.5 // 增加分散角度
            
            this.monsterBullets.push({
              x: puniCenterX,
              y: puniCenterY,
              w: 20, // 增加子弹大小（从14增加到20），让玩家更容易看到
              h: 20,
              vx: Math.cos(spreadAngle) * initialSpeed,
              vy: Math.sin(spreadAngle) * initialSpeed,
              damage: puni.damageValues.genZongZiDan,
              type: 'puni_tracking_bullet',
              color: '#ff00ff', // 紫色跟踪子弹
              glow: 1,
              lifetime: 8, // 增加持续时间（从6秒增加到8秒），因为速度慢了
              trackSpeed: 120, // 降低跟踪速度（从200降到120），让玩家有更多时间反应
              trackStrength: 0.08 // 降低跟踪强度（从0.15降到0.08），让转向更慢，更容易躲避
            })
          }
          
          puni.skillCooldowns.genZongZiDan = 4
          puni.skillData.bulletsCreated = true
        }
      } else if (puni.skillCastTime >= 1.2) {
        puni.currentSkill = null
        puni.skillCastTime = 0
        puni.skillData = null
        puni.attackCooldown = 0.6
      }
    },
    
    // 技能3：旋转弹幕（环绕BOSS旋转然后扩散）
    executeXuanZhuanDanMu(dt) {
      const puni = this.puniBoss
      
      if (!puni.skillData) {
        // 初始化技能数据，包括半径计算
        const puniCenterX = puni.x + puni.w / 2
        const puniCenterY = puni.y + puni.h / 2
        const radius = Math.max(puni.w / 2, puni.h / 2) * 0.9
        
        puni.skillData = { 
          bulletsCreated: false,
          rotationPhase: 0,
          expandTime: 0,
          angleOffset: Math.random() * Math.PI * 2, // 随机角度偏移，让每次释放位置不同
          bulletCount: 8, // 进一步减少子弹数量（从10减到8），间距45度，更容易躲避
          radius: radius // 立即设置半径，便于特效绘制
        }
      }
      
      if (puni.skillCastTime < 0.6) {
        // 蓄力阶段：显示红色预警标记（增加预警时间，从0.5秒增加到0.6秒）
        puni.skillData.rotationPhase += dt * 1.5 // 降低旋转速度（从2降到1.5），让预警更清晰
        return
      } else if (puni.skillCastTime < 1.0) {
        // 创建旋转子弹（延长创建阶段，从0.8秒增加到1.0秒）
        if (!puni.skillData.bulletsCreated) {
          const puniCenterX = puni.x + puni.w / 2
          const puniCenterY = puni.y + puni.h / 2
          const radius = puni.skillData.radius // 使用已初始化的半径
          
          // 创建8发环绕子弹（减少数量，间距45度，更容易躲避）
          const bulletCount = puni.skillData.bulletCount
          const angleStep = (Math.PI * 2) / bulletCount
          
          for (let i = 0; i < bulletCount; i++) {
            // 使用随机角度偏移，让每次释放位置不同
            const angle = i * angleStep + puni.skillData.angleOffset
            
            this.monsterBullets.push({
              x: puniCenterX + Math.cos(angle) * radius,
              y: puniCenterY + Math.sin(angle) * radius * 0.6,
              w: 16, // 增大子弹大小（从12增加到16），让玩家更容易看到
              h: 16,
              vx: 0,
              vy: 0,
              damage: puni.damageValues.xuanZhuanDanMu,
              type: 'puni_spinning_bullet',
              color: '#00ff00', // 绿色旋转子弹
              glow: 1,
              lifetime: 6, // 增加持续时间（从5秒增加到6秒）
              orbitCenterX: puniCenterX,
              orbitCenterY: puniCenterY,
              orbitRadius: radius,
              orbitAngle: angle, // 使用包含偏移的角度
              orbitSpeed: 2, // 降低旋转速度（从3降到2），让玩家更容易观察
              expanding: false,
              expandSpeed: 250 // 大幅降低扩散速度（从400降到250），让玩家更容易躲避
            })
          }
          
          puni.skillData.bulletsCreated = true
        }
        
        // 更新旋转子弹位置
        puni.skillData.rotationPhase += dt * 1.5
      } else if (puni.skillCastTime < 2.0) {
        // 扩散阶段：子弹向外扩散（延长扩散阶段，从1.5秒增加到2.0秒）
        puni.skillData.expandTime += dt
      } else if (puni.skillCastTime >= 2.5) {
        puni.currentSkill = null
        puni.skillCastTime = 0
        puni.skillData = null
        puni.attackCooldown = 1.0 // 增加攻击冷却（从0.8秒增加到1.0秒），给玩家更多时间
      }
    },
    
    // 技能4：连续冲刺（快速向玩家冲刺3次）
    executeLianXuChongCi(dt) {
      const puni = this.puniBoss
      
      if (!puni.skillData) {
        puni.skillData = {
          dashCount: 0,
          maxDashes: 3,
          dashPhase: 'prepare', // 'prepare', 'dashing', 'recover'
          dashStartTime: 0,
          dashDuration: 0.3,
          recoverDuration: 0.4,
          dashSpeed: 800,
          targetX: 0,
          targetY: 0
        }
      }
      
      const data = puni.skillData
      
      if (data.dashPhase === 'prepare') {
        // 准备阶段：瞄准玩家
        if (puni.skillCastTime >= 0.3) {
          const playerCenterX = this.player.x + this.player.w / 2
          const playerCenterY = this.player.y + this.player.h / 2
          data.targetX = playerCenterX
          data.targetY = playerCenterY
          data.dashPhase = 'dashing'
          data.dashStartTime = puni.skillCastTime
        }
      } else if (data.dashPhase === 'dashing') {
        // 冲刺阶段：快速向玩家移动
        const puniCenterX = puni.x + puni.w / 2
        const puniCenterY = puni.y + puni.h / 2
        
        const dx = data.targetX - puniCenterX
        const dy = data.targetY - puniCenterY
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist > 50) {
          // 继续冲刺
          const moveX = (dx / dist) * data.dashSpeed * dt
          const moveY = (dy / dist) * data.dashSpeed * dt
          puni.x += moveX
          puni.y += moveY
          
          // 检查是否撞到玩家
          if (this.rectsCollide(puni, this.player) && performance.now() > this.invincibleUntil) {
            this.hp -= puni.damageValues.lianXuChongCi
            this.invincibleUntil = performance.now() + 1000
            this.showDamageEffect(this.player.x, this.player.y, puni.damageValues.lianXuChongCi)
          }
        }
        
        // 检查冲刺时间
        if (puni.skillCastTime - data.dashStartTime >= data.dashDuration) {
          data.dashCount++
          if (data.dashCount >= data.maxDashes) {
            // 所有冲刺完成
            puni.currentSkill = null
            puni.skillCastTime = 0
            puni.skillData = null
            puni.attackCooldown = 1.0
            puni.skillCooldowns.lianXuChongCi = 6
          } else {
            // 准备下一次冲刺
            data.dashPhase = 'prepare'
            data.dashStartTime = puni.skillCastTime
          }
        }
      }
    },
    
    // 技能5：激光扫射（持续扫射激光）
    executeJiGuangSaoShe(dt) {
      const puni = this.puniBoss
      
      if (!puni.skillData) {
        puni.skillData = {
          laserCreated: false,
          sweepAngle: 0,
          sweepSpeed: 1.5, // 扫射速度（弧度/秒）
          sweepRange: Math.PI / 2, // 扫射范围（90度）
          laserLength: 1500,
          damageInterval: 0.1, // 伤害间隔
          lastDamageTime: 0
        }
      }
      
      const data = puni.skillData
      
      if (puni.skillCastTime < 0.4) {
        // 蓄力阶段
        return
      } else if (puni.skillCastTime < 2.0) {
        // 扫射阶段
        if (!data.laserCreated) {
          data.laserCreated = true
          // 初始化扫射角度（指向玩家）
          const puniCenterX = puni.x + puni.w / 2
          const puniCenterY = puni.y + puni.h / 2
          const playerCenterX = this.player.x + this.player.w / 2
          const playerCenterY = this.player.y + this.player.h / 2
          
          const dx = playerCenterX - puniCenterX
          const dy = playerCenterY - puniCenterY
          data.sweepAngle = Math.atan2(dy, dx) - data.sweepRange / 2
        }
        
        // 更新扫射角度
        data.sweepAngle += data.sweepSpeed * dt
        
        // 检查激光是否击中玩家
        const currentTime = performance.now()
        if (currentTime - data.lastDamageTime >= data.damageInterval * 1000) {
          const puniCenterX = puni.x + puni.w / 2
          const puniCenterY = puni.y + puni.h / 2
          
          // 计算激光终点
          const laserEndX = puniCenterX + Math.cos(data.sweepAngle) * data.laserLength
          const laserEndY = puniCenterY + Math.sin(data.sweepAngle) * data.laserLength
          
          // 检查玩家是否在激光路径上（简单线段碰撞检测）
          if (this.isPlayerInLaserPath(puniCenterX, puniCenterY, laserEndX, laserEndY, 30)) {
            if (performance.now() > this.invincibleUntil) {
              this.hp -= puni.damageValues.jiGuangSaoShe
              this.invincibleUntil = performance.now() + 100
              this.showDamageEffect(this.player.x, this.player.y, puni.damageValues.jiGuangSaoShe)
              data.lastDamageTime = currentTime
            }
          }
        }
      } else if (puni.skillCastTime >= 2.5) {
        puni.currentSkill = null
        puni.skillCastTime = 0
        puni.skillData = null
        puni.attackCooldown = 0.8
        puni.skillCooldowns.jiGuangSaoShe = 5
      }
    },
    
    // 技能6：区域爆炸（在玩家位置生成爆炸区域）
    executeQuYuBaoZha(dt) {
      const puni = this.puniBoss
      
      if (!puni.skillData) {
        puni.skillData = {
          explosionsCreated: false,
          explosionCount: 0,
          maxExplosions: 3,
          explosionDelay: 0.5,
          lastExplosionTime: 0
        }
      }
      
      const data = puni.skillData
      
      if (puni.skillCastTime < 0.4) {
        // 蓄力阶段：在玩家位置显示警告
        return
      } else if (puni.skillCastTime < 2.0) {
        // 爆炸阶段
        const currentTime = puni.skillCastTime
        
        // 每隔一段时间在玩家当前位置生成爆炸
        if (currentTime - data.lastExplosionTime >= data.explosionDelay && 
            data.explosionCount < data.maxExplosions) {
          
          const playerCenterX = this.player.x + this.player.w / 2
          const playerCenterY = this.player.y + this.player.h / 2
          
          // 创建爆炸效果（使用子弹系统模拟）
          this.monsterBullets.push({
            x: playerCenterX - 100,
            y: playerCenterY - 100,
            w: 200,
            h: 200,
            vx: 0,
            vy: 0,
            damage: puni.damageValues.quYuBaoZha,
            type: 'puni_explosion',
            color: '#ff4500', // 橙红色爆炸
            glow: 1,
            lifetime: 0.3, // 短暂爆炸
            explosionRadius: 150,
            hasHitPlayer: false
          })
          
          data.explosionCount++
          data.lastExplosionTime = currentTime
        }
      } else if (puni.skillCastTime >= 2.5) {
        puni.currentSkill = null
        puni.skillCastTime = 0
        puni.skillData = null
        puni.attackCooldown = 0.6
        puni.skillCooldowns.quYuBaoZha = 4
      }
    },
    
    // 元气弹：以BOSS为中心向四周发射黄色元气弹
    executeYuanQiDan(dt) {
      const puni = this.puniBoss
      
      if (puni.skillCastTime < 0.4) {
        // 蓄力阶段：身体发光聚集能量
        return
      } else if (puni.skillCastTime < 0.8) {
        // 释放阶段：从中心向四周发射黄色元气弹
        if (!puni.skillData) {
          puni.skillData = { bulletsCreated: false }
        }
        
        if (!puni.skillData.bulletsCreated) {
          const puniCenterX = puni.x + puni.w / 2
          const puniCenterY = puni.y + puni.h / 2
          
          // 发射一圈黄色元气弹（数量适中，确保有空隙让玩家躲避）
          const bulletCount = 16 // 16发元气弹，间距22.5度，玩家可以在空隙中躲避
          const angleStep = (Math.PI * 2) / bulletCount
          const speed = 200 // 中等速度，让玩家有反应时间
          
          for (let i = 0; i < bulletCount; i++) {
            const angle = i * angleStep
            
            // 子弹从BOSS中心发射
            const startX = puniCenterX
            const startY = puniCenterY
            
            // 子弹方向（从中心向外，沿径向方向）
            const directionX = Math.cos(angle)
            const directionY = Math.sin(angle)
            
            this.monsterBullets.push({
              x: startX,
              y: startY,
              w: 30, // 元气弹大小
              h: 30,
              vx: directionX * speed,
              vy: directionY * speed,
              damage: puni.damageValues.yuanQiDan,
              type: 'puni_yuanqi_bullet', // 黄色元气弹类型
              color: '#ffd700', // 金黄色
              glow: 1,
              lifetime: 5, // 持续时间
              trail: [] // 轨迹
            })
          }
          
          puni.skillCooldowns.yuanQiDan = 3 // 冷却时间3秒
          puni.skillData.bulletsCreated = true
          console.log('💥 谱尼发射元气弹！数量: 16，黄色，从中心向四周发射')
        }
      } else if (puni.skillCastTime >= 1.2) {
        // 技能结束
        puni.currentSkill = null
        puni.skillCastTime = 0
        puni.skillData = null
        puni.attackCooldown = 0.5
      }
    },
    
    // 原初形态专属技能：十字激光阵（可躲避）
    executeShiZiJiGuangZhen(dt) {
      const puni = this.puniBoss
      const puniCenterX = puni.x + puni.w / 2
      const puniCenterY = puni.y + puni.h / 2
      
      if (puni.skillCastTime < 1.0) {
        // 预警阶段：显示激光路径（1秒预警时间）
        if (!puni.skillData) {
          puni.skillData = { warningShown: false }
        }
        
        // 绘制预警线（在绘制函数中处理）
        puni.skillData.warningPhase = puni.skillCastTime / 1.0 // 0到1的进度
        return
      } else if (puni.skillCastTime < 1.5) {
        // 发射阶段：向四个方向发射激光
        if (!puni.skillData.lasersCreated) {
          const laserLength = 5000 // 激光长度（足够长）
          const laserWidth = 80 // 激光宽度
          const laserSpeed = 800 // 激光速度（很快，但玩家有预警时间）
          
          // 四个方向：上、下、左、右
          const directions = [
            { angle: -Math.PI / 2, name: '上' }, // 上
            { angle: Math.PI / 2, name: '下' },  // 下
            { angle: Math.PI, name: '左' },      // 左
            { angle: 0, name: '右' }             // 右
          ]
          
          directions.forEach(dir => {
            this.monsterBullets.push({
              x: puniCenterX, // 初始位置设为BOSS中心（用于绘制）
              y: puniCenterY,
              w: laserWidth,
              h: laserLength,
              vx: 0, // 激光不移动
              vy: 0,
              damage: puni.damageValues.shiZiJiGuangZhen || 15,
              type: 'puni_cross_laser',
              color: '#00ffff',
              direction: dir.angle,
              startX: puniCenterX, // BOSS中心X
              startY: puniCenterY, // BOSS中心Y
              lifetime: 0.5, // 激光持续0.5秒
              isActive: true
            })
          })
          
          puni.skillCooldowns.shiZiJiGuangZhen = 4 // 冷却时间4秒
          puni.skillData.lasersCreated = true
          console.log('⚡ 普尼释放十字激光阵！向四个方向发射激光，玩家可以通过移动到对角线位置躲避')
        }
      } else if (puni.skillCastTime >= 2.0) {
        // 技能结束
        puni.currentSkill = null
        puni.skillCastTime = 0
        puni.skillData = null
        puni.attackCooldown = 0.5
      }
    },
    
    // 进化形态专属技能：追踪能量波（可躲避）
    executeZhuiZongNengLiangBo(dt) {
      const puni = this.puniBoss
      const puniCenterX = puni.x + puni.w / 2
      const puniCenterY = puni.y + puni.h / 2
      
      if (puni.skillCastTime < 0.5) {
        // 蓄力阶段：身体发光聚集能量
        return
      } else if (puni.skillCastTime < 1.0) {
        // 发射阶段：发射追踪能量波
        if (!puni.skillData) {
          puni.skillData = { waveCreated: false }
        }
        
        if (!puni.skillData.waveCreated) {
          const playerCenterX = this.player.x + this.player.w / 2
          const playerCenterY = this.player.y + this.player.h / 2
          const dx = playerCenterX - puniCenterX
          const dy = playerCenterY - puniCenterY
          const angle = Math.atan2(dy, dx)
          
          // 发射一个缓慢追踪的能量波
          this.monsterBullets.push({
            x: puniCenterX,
            y: puniCenterY,
            w: 60,
            h: 60,
            vx: Math.cos(angle) * 150, // 初始速度较慢
            vy: Math.sin(angle) * 150,
            damage: puni.damageValues.zhuiZongNengLiangBo || 12,
            type: 'puni_tracking_wave',
            color: '#ff00ff',
            trackingSpeed: 80, // 追踪速度（较慢，玩家可以躲避）
            lifetime: 8, // 持续时间8秒
            targetX: playerCenterX,
            targetY: playerCenterY,
            lastUpdateTime: performance.now()
          })
          
          puni.skillCooldowns.zhuiZongNengLiangBo = 5 // 冷却时间5秒
          puni.skillData.waveCreated = true
          console.log('🌀 普尼释放追踪能量波！能量波会缓慢追踪玩家，玩家可以通过移动和跳跃躲避')
        }
      } else if (puni.skillCastTime >= 1.5) {
        // 技能结束
        puni.currentSkill = null
        puni.skillCastTime = 0
        puni.skillData = null
        puni.attackCooldown = 0.5
      }
    },
    
    // 原初形态专属技能：散发激光子弹（持续散发一圈激光子弹，可躲避）
    executeSanSheJiGuangDan(dt) {
      const puni = this.puniBoss
      const puniCenterX = puni.x + puni.w / 2
      const puniCenterY = puni.y + puni.h / 2
      
      if (puni.skillCastTime < 0.3) {
        // 蓄力阶段：身体发光聚集能量
        return
      } else if (puni.skillCastTime < 3.0) {
        // 持续散发阶段：每隔0.2秒散发一圈激光子弹
        if (!puni.skillData) {
          puni.skillData = { 
            lastEmitTime: 0,
            emitCount: 0,
            totalEmits: 12 // 总共散发12圈（持续2.4秒）
          }
        }
        
        const currentTime = puni.skillCastTime
        const emitInterval = 0.2 // 每0.2秒散发一圈
        const timeSinceLastEmit = currentTime - puni.skillData.lastEmitTime
        
        // 如果到了散发时间，发射一圈激光球
        if (timeSinceLastEmit >= emitInterval && puni.skillData.emitCount < puni.skillData.totalEmits) {
          // 发射一圈激光球（数量适中，确保有空隙让玩家躲避）
          const bulletCount = 16 // 16发子弹，间距22.5度，玩家可以在空隙中躲避
          const angleStep = (Math.PI * 2) / bulletCount
          const speed = 180 // 中等速度，让玩家有反应时间
          
          for (let i = 0; i < bulletCount; i++) {
            const angle = i * angleStep
            
            // 子弹从身体中心散射（从BOSS中心发射）
            const startX = puniCenterX
            const startY = puniCenterY
            
            // 子弹方向（从中心向外，沿径向方向）
            const directionX = Math.cos(angle)
            const directionY = Math.sin(angle)
            
            this.monsterBullets.push({
              x: startX - 15, // 从中心开始，减去一半宽度
              y: startY - 15, // 从中心开始，减去一半高度
              w: 30, // 激光球稍大一些
              h: 30,
              vx: directionX * speed,
              vy: directionY * speed,
              damage: puni.damageValues.sanSheJiGuangDan || 8,
              type: 'puni_scatter_laser',
              color: '#00ffff',
              glow: 1,
              lifetime: 6, // 持续时间6秒
              trail: [] // 轨迹
            })
          }
          
          puni.skillData.lastEmitTime = currentTime
          puni.skillData.emitCount++
          
          if (puni.skillData.emitCount % 3 === 0) {
            console.log(`💫 普尼从中心散发激光球！第${puni.skillData.emitCount}圈，共${puni.skillData.totalEmits}圈`)
          }
        }
      } else if (puni.skillCastTime >= 3.5) {
        // 技能结束
        puni.currentSkill = null
        puni.skillCastTime = 0
        puni.skillData = null
        puni.attackCooldown = 0.5
        puni.skillCooldowns.sanSheJiGuangDan = 5 // 冷却时间5秒
        console.log('✅ 散发激光球技能结束')
      }
    },
    
    // 成群子弹技能：向玩家发射大量子弹（所有阶段可用）
    executeChengQunZiDan(dt) {
      const puni = this.puniBoss
      const puniCenterX = puni.x + puni.w / 2
      const puniCenterY = puni.y + puni.h / 2
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      
      if (puni.skillCastTime < 0.3) {
        // 蓄力阶段：身体发光聚集能量
        return
      } else if (puni.skillCastTime < 1.0) {
        // 发射阶段：向玩家方向发射大量子弹
        if (!puni.skillData) {
          puni.skillData = { bulletsCreated: false }
        }
        
        if (!puni.skillData.bulletsCreated) {
          // 计算玩家方向
          const dx = playerCenterX - puniCenterX
          const dy = playerCenterY - puniCenterY
          const baseAngle = Math.atan2(dy, dx)
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // 根据血量阶段调整子弹数量和密度
          const hpPercent = puni.hp / puni.maxHp
          let bulletCount = 20 // 基础数量
          let spreadAngle = Math.PI / 4 // 基础扩散角度（45度）
          let speed = 200 // 基础速度
          
          // 血量越低，子弹越多、越密集
          if (hpPercent <= 0.2) {
            bulletCount = 35 // 第四阶段：35发
            spreadAngle = Math.PI / 3 // 60度扩散
            speed = 250 // 更快
          } else if (hpPercent <= 0.4) {
            bulletCount = 28 // 第三阶段：28发
            spreadAngle = Math.PI / 3.5 // 约51度
            speed = 220
          } else if (hpPercent <= 0.7) {
            bulletCount = 24 // 第二阶段：24发
            spreadAngle = Math.PI / 3.8 // 约47度
            speed = 210
          } else {
            bulletCount = 20 // 第一阶段：20发
            spreadAngle = Math.PI / 4 // 45度
            speed = 200
          }
          
          // 发射成群子弹（扇形分布，朝向玩家）
          for (let i = 0; i < bulletCount; i++) {
            // 计算每发子弹的角度（在基础角度周围扩散）
            const angleOffset = (i - bulletCount / 2) * (spreadAngle / bulletCount)
            const bulletAngle = baseAngle + angleOffset
            
            // 添加随机误差，使子弹更自然
            const randomError = (Math.random() - 0.5) * 0.1 // ±0.05弧度误差
            const finalAngle = bulletAngle + randomError
            
            // 子弹从BOSS中心发射
            const startX = puniCenterX
            const startY = puniCenterY
            
            // 计算子弹速度
            const bulletSpeed = speed + (Math.random() - 0.5) * 30 // 速度有随机变化
            
            this.monsterBullets.push({
              x: startX - 10,
              y: startY - 10,
              w: 20,
              h: 20,
              vx: Math.cos(finalAngle) * bulletSpeed,
              vy: Math.sin(finalAngle) * bulletSpeed,
              damage: puni.damageValues.chengQunZiDan || 6,
              type: 'puni_group_bullet',
              color: '#ff6b6b', // 红色子弹
              glow: 1,
              lifetime: 5, // 持续时间5秒
              trail: []
            })
          }
          
          puni.skillCooldowns.chengQunZiDan = 3 // 冷却时间3秒
          puni.skillData.bulletsCreated = true
          console.log(`💥 普尼发射成群子弹！数量: ${bulletCount}，朝向玩家方向`)
        }
      } else if (puni.skillCastTime >= 1.5) {
        // 技能结束
        puni.currentSkill = null
        puni.skillCastTime = 0
        puni.skillData = null
        puni.attackCooldown = 0.5
      }
    },
    
    // 辅助函数：检查玩家是否在激光路径上
    isPlayerInLaserPath(x1, y1, x2, y2, width) {
      const player = this.player
      const playerCenterX = player.x + player.w / 2
      const playerCenterY = player.y + player.h / 2
      
      // 计算点到线段的距离
      const A = playerCenterX - x1
      const B = playerCenterY - y1
      const C = x2 - x1
      const D = y2 - y1
      
      const dot = A * C + B * D
      const lenSq = C * C + D * D
      let param = -1
      
      if (lenSq !== 0) {
        param = dot / lenSq
      }
      
      let xx, yy
      
      if (param < 0) {
        xx = x1
        yy = y1
      } else if (param > 1) {
        xx = x2
        yy = y2
      } else {
        xx = x1 + param * C
        yy = y1 + param * D
      }
      
      const dx = playerCenterX - xx
      const dy = playerCenterY - yy
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // 检查距离是否在宽度范围内，并且在线段范围内
      return distance <= width && param >= 0 && param <= 1
    },
    
    // 辅助函数：检查位置是否在雨海区域内
    isInRainSeaZone(x, y) {
      const zone = this.rainSeaZone
      return x >= zone.x && x <= zone.x + zone.width &&
             y >= zone.y && y <= zone.y + zone.height
    },
    
    isInStormOceanZone(x, y) {
      const zone = this.stormOceanZone
      return x >= zone.x && x <= zone.x + zone.width &&
             y >= zone.y && y <= zone.y + zone.height
    },
    
    // 绘制谱尼BOSS（根据新设计重新绘制）
    drawPuniBoss(ctx) {
      if (!this.puniBoss.spawned || this.puniBoss.hp <= 0) return
      
      const puni = this.puniBoss
      const centerX = puni.x + puni.w / 2
      const centerY = puni.y + puni.h / 2
      
      // 绘制攻击范围指示器（在BOSS身体之前绘制，作为背景层）
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      const dx = playerCenterX - centerX
      const dy = playerCenterY - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const playerInRange = distance <= puni.attackRange
      
      ctx.save()
      // 攻击范围圆圈（半透明）
      if (playerInRange) {
        // 玩家在范围内：显示红色警告圆圈
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
        ctx.lineWidth = 4
        ctx.setLineDash([15, 10])
        ctx.shadowBlur = 20
        ctx.shadowColor = 'rgba(255, 0, 0, 0.5)'
      } else {
        // 玩家不在范围内：显示淡蓝色圆圈
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.setLineDash([10, 5])
        ctx.shadowBlur = 0
      }
      ctx.beginPath()
      ctx.arc(centerX, centerY, puni.attackRange, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.shadowBlur = 0
      ctx.restore()
      
      // 绘制十字激光阵预警线（在BOSS主体之前绘制）
      if (puni.currentSkill === 'shiZiJiGuangZhen' && puni.skillData && puni.skillData.warningPhase !== undefined) {
        ctx.save()
        const warningPhase = puni.skillData.warningPhase // 0到1的进度
        const laserLength = 5000
        const laserWidth = 80
        
        // 预警线颜色（从黄色渐变到红色，闪烁效果）
        const alpha = 0.3 + Math.sin(warningPhase * Math.PI * 10) * 0.2
        const warningColor = warningPhase < 0.5 
          ? `rgba(255, 255, 0, ${alpha})` // 黄色预警
          : `rgba(255, 0, 0, ${alpha})`   // 红色警告
        
        ctx.strokeStyle = warningColor
        ctx.lineWidth = laserWidth
        ctx.setLineDash([20, 10]) // 虚线效果
        ctx.globalAlpha = alpha
        
        // 绘制四个方向的预警线
        const directions = [
          { angle: -Math.PI / 2, name: '上' }, // 上
          { angle: Math.PI / 2, name: '下' },  // 下
          { angle: Math.PI, name: '左' },      // 左
          { angle: 0, name: '右' }             // 右
        ]
        
        directions.forEach(dir => {
          ctx.beginPath()
          if (dir.angle === 0) { // 右
            ctx.moveTo(centerX, centerY)
            ctx.lineTo(centerX + laserLength, centerY)
          } else if (dir.angle === Math.PI) { // 左
            ctx.moveTo(centerX, centerY)
            ctx.lineTo(centerX - laserLength, centerY)
          } else if (dir.angle === -Math.PI / 2) { // 上
            ctx.moveTo(centerX, centerY)
            ctx.lineTo(centerX, centerY - laserLength)
          } else if (dir.angle === Math.PI / 2) { // 下
            ctx.moveTo(centerX, centerY)
            ctx.lineTo(centerX, centerY + laserLength)
          }
          ctx.stroke()
        })
        
        ctx.setLineDash([])
        ctx.restore()
      }
      
      ctx.save()
      
      // ========== 0. 绘制太空背景元素（在BOSS主体之前绘制）==========
      
      // 1. 绘制星空背景（围绕BOSS的深空区域）
      ctx.save()
      for (let i = 0; i < 100; i++) {
        const starAngle = (Math.PI * 2 * i) / 100 + puni.energyBody.glowPhase * 0.1
        // 使用伪随机数（基于索引）避免闪烁
        const pseudoRand1 = (Math.sin(i * 123.456) + 1) / 2
        const pseudoRand2 = (Math.sin(i * 789.012) + 1) / 2
        const pseudoRand3 = (Math.sin(i * 456.789) + 1) / 2
        const starDistance = 300 + pseudoRand1 * 400
        const starX = centerX + Math.cos(starAngle) * starDistance
        const starY = centerY + Math.sin(starAngle) * starDistance * 0.6
        
        const starSize = pseudoRand2 * 2 + 0.5
        const starBrightness = 0.3 + pseudoRand3 * 0.7
        const twinkle = Math.sin(puni.energyBody.glowPhase * 3 + i) * 0.5 + 0.5
        
        ctx.fillStyle = `rgba(255, 255, 255, ${starBrightness * twinkle * 0.8})`
        ctx.beginPath()
        ctx.arc(starX, starY, starSize, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
      
      // 2. 绘制星云效果（紫红色星云，围绕BOSS）
        ctx.save()
      ctx.globalAlpha = 0.4
      const nebulaGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 500)
      nebulaGradient.addColorStop(0, 'rgba(138, 43, 226, 0.3)') // 蓝紫色
      nebulaGradient.addColorStop(0.4, 'rgba(75, 0, 130, 0.4)') // 深紫色
      nebulaGradient.addColorStop(0.7, 'rgba(139, 0, 139, 0.3)') // 暗紫色
      nebulaGradient.addColorStop(1, 'rgba(25, 25, 112, 0)') // 透明
      
      ctx.fillStyle = nebulaGradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, 500, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.restore()
      
      // 3. 绘制星系旋涡效果（旋转的星云旋臂）
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(puni.energyBody.glowPhase * 0.2)
      for (let arm = 0; arm < 2; arm++) {
        const armAngle = (Math.PI * arm)
        ctx.save()
        ctx.rotate(armAngle)
        
        const spiralGradient = ctx.createLinearGradient(0, 0, 400, 0)
        spiralGradient.addColorStop(0, 'rgba(138, 43, 226, 0)')
        spiralGradient.addColorStop(0.3, 'rgba(75, 0, 130, 0.3)')
        spiralGradient.addColorStop(0.6, 'rgba(139, 0, 139, 0.2)')
        spiralGradient.addColorStop(1, 'rgba(25, 25, 112, 0)')
        
        ctx.strokeStyle = spiralGradient
        ctx.lineWidth = 30
        ctx.beginPath()
        for (let t = 0; t < Math.PI * 2; t += 0.1) {
          const r = 50 + t * 50
          const x = Math.cos(t) * r
          const y = Math.sin(t) * r * 0.3
          if (t === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
        ctx.restore()
      }
      ctx.restore()
      
      // 4. 绘制环绕的行星/星体（围绕BOSS旋转）
      const planetCount = 4
      for (let i = 0; i < planetCount; i++) {
        const planetAngle = (Math.PI * 2 * i) / planetCount + puni.energyBody.glowPhase * 0.3
        const planetDistance = 350 + i * 50
        const planetX = centerX + Math.cos(planetAngle) * planetDistance
        const planetY = centerY + Math.sin(planetAngle) * planetDistance * 0.6
        const planetSize = 15 + i * 3
        
        ctx.save()
        // 行星光晕
        ctx.shadowBlur = 20
        ctx.shadowColor = `rgba(${100 + i * 30}, ${50 + i * 20}, ${150 + i * 50}, 0.6)`
        // 行星主体
        const planetGradient = ctx.createRadialGradient(planetX, planetY, 0, planetX, planetY, planetSize)
        planetGradient.addColorStop(0, `rgba(${150 + i * 30}, ${100 + i * 20}, ${200 + i * 50}, 0.9)`)
        planetGradient.addColorStop(1, `rgba(${75 + i * 15}, ${50 + i * 10}, ${100 + i * 25}, 0.7)`)
        ctx.fillStyle = planetGradient
        ctx.beginPath()
        ctx.arc(planetX, planetY, planetSize, 0, Math.PI * 2)
        ctx.fill()
        
        // 行星表面细节
        ctx.fillStyle = `rgba(${50 + i * 10}, ${30 + i * 5}, ${80 + i * 15}, 0.5)`
        for (let j = 0; j < 3; j++) {
          const detailAngle = (Math.PI * 2 * j) / 3 + planetAngle
          const detailX = planetX + Math.cos(detailAngle) * (planetSize * 0.6)
          const detailY = planetY + Math.sin(detailAngle) * (planetSize * 0.6)
          ctx.beginPath()
          ctx.arc(detailX, detailY, planetSize * 0.2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.shadowBlur = 0
        ctx.restore()
      }
      
      // 5. 绘制宇宙射线（从BOSS中心向外发射的光线）
      ctx.save()
      ctx.translate(centerX, centerY)
      for (let i = 0; i < 12; i++) {
        const rayAngle = (Math.PI * 2 * i) / 12 + puni.energyBody.glowPhase * 0.5
        const rayLength = 400 + Math.sin(puni.energyBody.glowPhase * 2 + i) * 50
        
        const rayGradient = ctx.createLinearGradient(0, 0, Math.cos(rayAngle) * rayLength, Math.sin(rayAngle) * rayLength)
        rayGradient.addColorStop(0, 'rgba(138, 43, 226, 0.8)')
        rayGradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.4)')
        rayGradient.addColorStop(1, 'rgba(138, 43, 226, 0)')
        
        ctx.strokeStyle = rayGradient
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(Math.cos(rayAngle) * rayLength, Math.sin(rayAngle) * rayLength * 0.6)
        ctx.stroke()
      }
      ctx.restore()
      
      // 6. 绘制星尘粒子（围绕BOSS漂浮的微小粒子）
      ctx.save()
      for (let i = 0; i < 50; i++) {
        const dustAngle = (Math.PI * 2 * i) / 50 + puni.energyBody.glowPhase * 0.8
        const dustDistance = 200 + Math.sin(puni.energyBody.glowPhase * 1.5 + i) * 150
        const dustX = centerX + Math.cos(dustAngle) * dustDistance
        const dustY = centerY + Math.sin(dustAngle) * dustDistance * 0.5
        
        // 使用伪随机数（基于索引）避免闪烁
        const pseudoRand = (Math.sin(i * 234.567) + 1) / 2
        const dustSize = 1 + pseudoRand * 2
        const dustAlpha = 0.3 + Math.sin(puni.energyBody.glowPhase * 2 + i) * 0.3
        
        ctx.fillStyle = `rgba(200, 180, 255, ${dustAlpha})`
        ctx.beginPath()
        ctx.arc(dustX, dustY, dustSize, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
      
      // 定义尺寸参数（巨大化，增强压迫感）
      const bodyWidth = 180 // 躯干宽度（增大3倍）
      const bodyHeight = 280 // 躯干高度（增大2倍多）
      const headWidth = 100 // 头部宽度（增大3倍多）
      const headHeight = 120 // 头部高度（增大3倍）
      const headTopY = centerY - bodyHeight / 2 - headHeight // 头部顶部Y坐标
      
      // ========== 1. 绘制下半身（邪恶的暗紫色/黑色分段结构，带红色邪恶眼睛）==========
      const lowerBodyY = centerY + bodyHeight / 2
      const lowerBodyCount = 12 // 增加分段数量（更多眼睛更邪恶）
      const lowerBodyWidth = 140 // 每个分段更大
      const lowerBodyHeight = 200 // 每个分段更高
      
      // 先绘制暗影效果（增强压迫感）
      ctx.save()
      ctx.globalAlpha = 0.6
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.beginPath()
      ctx.arc(centerX, lowerBodyY, bodyWidth * 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      
      for (let i = 0; i < lowerBodyCount; i++) {
        const angle = (Math.PI * 2 * i) / lowerBodyCount + puni.energyBody.glowPhase * 0.1
        const radius = 100 + Math.sin(puni.energyBody.glowPhase + i) * 30
        const segmentX = centerX + Math.cos(angle) * radius
        const segmentY = lowerBodyY + Math.sin(angle) * 40
        
        ctx.save()
        ctx.translate(segmentX, segmentY)
        ctx.rotate(angle)
        
        // 邪恶的暗紫色/黑色结构（带尖刺）
        const segmentGradient = ctx.createLinearGradient(0, -lowerBodyHeight / 2, 0, lowerBodyHeight / 2)
        segmentGradient.addColorStop(0, '#2d1b4e') // 深紫色顶部
        segmentGradient.addColorStop(0.3, '#1a0d2e') // 更深的紫色
        segmentGradient.addColorStop(0.6, '#0d0519') // 接近黑色
        segmentGradient.addColorStop(1, '#000000') // 纯黑色底部
        
        ctx.fillStyle = segmentGradient
        ctx.beginPath()
        ctx.moveTo(0, -lowerBodyHeight / 2) // 顶部尖点（更尖锐）
        ctx.bezierCurveTo(
          -lowerBodyWidth / 2.5, -lowerBodyHeight / 3,
          -lowerBodyWidth / 1.8, 0,
          0, lowerBodyHeight / 2 // 底部宽点
        )
        ctx.bezierCurveTo(
          lowerBodyWidth / 1.8, 0,
          lowerBodyWidth / 2.5, -lowerBodyHeight / 3,
          0, -lowerBodyHeight / 2
        )
        ctx.closePath()
        ctx.fill()
        
        // 邪恶的暗红色边框
        ctx.strokeStyle = '#660000'
        ctx.lineWidth = 4
        ctx.stroke()
        
        // 添加尖刺（增强威胁感）
        ctx.fillStyle = '#1a0000'
        ctx.beginPath()
        ctx.moveTo(0, -lowerBodyHeight / 2 - 15)
        ctx.lineTo(-8, -lowerBodyHeight / 2)
        ctx.lineTo(8, -lowerBodyHeight / 2)
        ctx.closePath()
        ctx.fill()
        
        // 邪恶的红色眼睛（发光的血红色）
        const eyeAlpha = 0.8 + Math.sin(puni.energyBody.glowPhase * 3 + i) * 0.2
        const eyeGlow = Math.sin(puni.energyBody.glowPhase * 4 + i) * 0.5 + 0.5
        
        // 眼睛外层光晕（血红色）
        ctx.shadowBlur = 20 * eyeGlow
        ctx.shadowColor = 'rgba(255, 0, 0, 0.8)'
        ctx.fillStyle = `rgba(255, 0, 0, ${eyeAlpha * 0.6})`
        ctx.beginPath()
        ctx.ellipse(0, 0, 25, 18, 0, 0, Math.PI * 2)
        ctx.fill()
        
        // 眼睛主体（深红色）
        ctx.shadowBlur = 0
        ctx.fillStyle = `rgba(200, 0, 0, ${eyeAlpha})`
        ctx.beginPath()
        ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2)
        ctx.fill()
        
        // 眼睛瞳孔（黑色，更邪恶）
        ctx.fillStyle = `rgba(0, 0, 0, ${eyeAlpha})`
        ctx.beginPath()
        ctx.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2)
        ctx.fill()
        
        // 眼睛高光（白色亮点，增强邪恶感）
        ctx.fillStyle = `rgba(255, 255, 255, ${eyeAlpha})`
        ctx.beginPath()
        ctx.ellipse(-5, -5, 4, 3, 0, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.restore()
      }
      
      // ========== 2. 绘制躯干（邪恶的暗紫色/深红色，巨大而压迫）==========
      ctx.save()
      ctx.translate(centerX, centerY)
      
      // 躯干外层暗影（增强压迫感）
      ctx.shadowBlur = 60
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.beginPath()
      ctx.ellipse(0, 0, bodyWidth / 2 * 1.3, bodyHeight / 2 * 1.3, 0, 0, Math.PI * 2)
      ctx.fill()
      
      // 躯干外层光晕（邪恶的暗红色/紫色）
      ctx.shadowBlur = 50
      ctx.shadowColor = 'rgba(139, 0, 0, 0.8)'
      const torsoGradient = ctx.createLinearGradient(0, -bodyHeight / 2, 0, bodyHeight / 2)
      torsoGradient.addColorStop(0, `rgba(75, 0, 130, ${puni.energyBody.glowIntensity * 0.95})`) // 深紫色
      torsoGradient.addColorStop(0.3, `rgba(139, 0, 0, ${puni.energyBody.glowIntensity})`) // 暗红色
      torsoGradient.addColorStop(0.6, `rgba(75, 0, 130, ${puni.energyBody.glowIntensity * 0.9})`)
      torsoGradient.addColorStop(1, `rgba(25, 0, 51, ${puni.energyBody.glowIntensity * 0.8})`) // 接近黑色
      
      ctx.fillStyle = torsoGradient
      ctx.beginPath()
      // 巨大的椭圆形躯干
      ctx.ellipse(0, 0, bodyWidth / 2, bodyHeight / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      
      // 躯干内部的暗红色能量流动
      ctx.fillStyle = `rgba(139, 0, 0, ${puni.energyBody.glowIntensity * 0.6})`
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8 + puni.energyBody.glowPhase
        const x = Math.cos(angle) * (bodyWidth / 4)
        const y = Math.sin(angle) * (bodyHeight / 4)
      ctx.beginPath()
        ctx.arc(x, y, 15, 0, Math.PI * 2)
      ctx.fill()
      }
      
      // 躯干高光（暗红色）
      ctx.fillStyle = `rgba(139, 0, 0, ${puni.energyBody.glowIntensity * 0.7})`
        ctx.beginPath()
      ctx.ellipse(-bodyWidth / 6, -bodyHeight / 4, bodyWidth / 8, bodyHeight / 8, 0, 0, Math.PI * 2)
        ctx.fill()
      
      ctx.shadowBlur = 0
      ctx.restore()
      
      // ========== 3. 绘制头部（巨大邪恶的头部，血红色眼睛）==========
        ctx.save()
      ctx.translate(centerX, headTopY + headHeight / 2)
      
      // 头部外层暗影
      ctx.shadowBlur = 40
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.beginPath()
      ctx.ellipse(0, 0, headWidth / 2 * 1.2, headHeight / 2 * 1.2, 0, 0, Math.PI * 2)
      ctx.fill()
      
      // 头部外层光晕（邪恶的暗红色/紫色）
      ctx.shadowBlur = 35
      ctx.shadowColor = 'rgba(139, 0, 0, 0.8)'
      const headGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, headWidth / 2)
      headGradient.addColorStop(0, `rgba(75, 0, 130, ${puni.energyBody.glowIntensity})`) // 深紫色中心
      headGradient.addColorStop(0.4, `rgba(139, 0, 0, ${puni.energyBody.glowIntensity * 0.9})`) // 暗红色
      headGradient.addColorStop(0.8, `rgba(75, 0, 130, ${puni.energyBody.glowIntensity * 0.8})`)
      headGradient.addColorStop(1, `rgba(25, 0, 51, ${puni.energyBody.glowIntensity * 0.7})`) // 接近黑色
      
      ctx.fillStyle = headGradient
      ctx.beginPath()
      // 巨大的椭圆形头部
      ctx.ellipse(0, 0, headWidth / 2, headHeight / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      
      // 邪恶的巨大血红色眼睛（增强压迫感）
      const eyeGlow = 0.8 + Math.sin(puni.energyBody.glowPhase * 4) * 0.2
      
      // 左眼
      ctx.save()
      ctx.translate(-headWidth / 3, -headHeight / 6)
      // 眼睛外层光晕（血红色）
      ctx.shadowBlur = 30 * eyeGlow
      ctx.shadowColor = 'rgba(255, 0, 0, 0.9)'
      ctx.fillStyle = `rgba(255, 0, 0, ${eyeGlow * 0.7})`
      ctx.beginPath()
      ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2)
      ctx.fill()
      // 眼睛主体
      ctx.shadowBlur = 0
      ctx.fillStyle = `rgba(200, 0, 0, ${eyeGlow})`
      ctx.beginPath()
      ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2)
      ctx.fill()
      // 瞳孔（黑色）
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2)
      ctx.fill()
      // 高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.beginPath()
      ctx.ellipse(-4, -4, 4, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      
      // 右眼
      ctx.save()
      ctx.translate(headWidth / 3, -headHeight / 6)
      ctx.shadowBlur = 30 * eyeGlow
      ctx.shadowColor = 'rgba(255, 0, 0, 0.9)'
      ctx.fillStyle = `rgba(255, 0, 0, ${eyeGlow * 0.7})`
      ctx.beginPath()
      ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = `rgba(200, 0, 0, ${eyeGlow})`
      ctx.beginPath()
      ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.beginPath()
      ctx.ellipse(-4, -4, 4, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      
      ctx.shadowBlur = 0
      ctx.restore()
      
      // ========== 4. 绘制头顶邪恶的尖刺/角（巨大而威胁）==========
      const crownTopY = headTopY - 150 // 更高的冠冕
      const crownHeight = 150 // 更高的冠冕
      const crownStrands = 8 // 更多尖刺
      
      ctx.save()
      ctx.translate(centerX, crownTopY + crownHeight / 2)
      
      for (let i = 0; i < crownStrands; i++) {
        const angle = (Math.PI * 2 * i) / crownStrands
        const offsetX = Math.cos(angle) * 40
        const strandWidth = 12 + Math.sin(puni.energyBody.glowPhase + i) * 4
        const strandHeight = crownHeight + Math.sin(puni.energyBody.glowPhase * 0.5 + i) * 20
        
        ctx.save()
        ctx.translate(offsetX, 0)
        
        // 邪恶的暗红色/紫色尖刺
        const strandGradient = ctx.createLinearGradient(0, -strandHeight / 2, 0, strandHeight / 2)
        strandGradient.addColorStop(0, `rgba(139, 0, 0, ${puni.energyBody.glowIntensity})`) // 暗红色顶部
        strandGradient.addColorStop(0.5, `rgba(75, 0, 130, ${puni.energyBody.glowIntensity * 0.9})`) // 深紫色
        strandGradient.addColorStop(1, `rgba(25, 0, 51, ${puni.energyBody.glowIntensity * 0.8})`) // 接近黑色
        
        ctx.shadowBlur = 25
        ctx.shadowColor = 'rgba(139, 0, 0, 0.8)'
        ctx.fillStyle = strandGradient
        
        // 绘制尖刺（三角形，更尖锐）
          ctx.beginPath()
        ctx.moveTo(0, -strandHeight / 2) // 顶部尖点
        ctx.lineTo(-strandWidth / 2, strandHeight / 2) // 左下
        ctx.lineTo(strandWidth / 2, strandHeight / 2) // 右下
          ctx.closePath()
          ctx.fill()
          
        // 尖刺边缘高光（暗红色）
        ctx.strokeStyle = `rgba(139, 0, 0, ${puni.energyBody.glowIntensity * 0.8})`
          ctx.lineWidth = 2
          ctx.stroke()
        
        // 尖刺尖端发光（血红色）
        ctx.shadowBlur = 20
        ctx.shadowColor = 'rgba(255, 0, 0, 0.9)'
        ctx.fillStyle = `rgba(255, 0, 0, ${puni.energyBody.glowIntensity * 0.7})`
          ctx.beginPath()
        ctx.arc(0, -strandHeight / 2, 8, 0, Math.PI * 2)
          ctx.fill()
        
        ctx.shadowBlur = 0
        ctx.restore()
      }
        
        ctx.restore()
      
      // ========== 5. 绘制环绕BOSS一周的邪恶巨大触手（360度均匀分布，可摆动）==========
      const tentacleCount = 16 // 总共16根触手，环绕一周
      
      // 绘制环绕一周的触手
      for (let i = 0; i < tentacleCount; i++) {
        // 计算触手根部位置（从BOSS身体周围均匀分布）
        const baseAngle = (Math.PI * 2 * i) / tentacleCount // 360度均匀分布
        const baseRadius = Math.max(bodyWidth / 2, bodyHeight / 2) + 20 // 从身体边缘延伸
        const baseX = centerX + Math.cos(baseAngle) * baseRadius
        const baseY = centerY + Math.sin(baseAngle) * baseRadius * 0.6 // Y轴压缩以适应视角
        
        // 获取触手数据
        const tentacleData = puni.tentacles[i] || puni.wings[i % puni.wings.length] || { 
          phase: 0, 
          glow: 0.8, 
          swingPhase: 0
        }
        
        // 触手延伸角度（从身体向外，稍微向外倾斜）
        const extensionAngle = baseAngle + Math.PI / 8 // 稍微向外倾斜
        // 摆动角度：使用swingPhase创建摆动效果
        const swingAngle = Math.sin(tentacleData.swingPhase + i * 0.3) * (Math.PI / 6) // 摆动幅度
        const currentAngle = extensionAngle + swingAngle
        
        // 触手长度（更长，更威胁）
        const tentacleLength = 180 + Math.sin(tentacleData.phase + i) * 40
        
        // 计算触手末端位置
        const tentacleEndX = baseX + Math.cos(currentAngle) * tentacleLength
        const tentacleEndY = baseY + Math.sin(currentAngle) * tentacleLength
        
        ctx.save()
        
        // 触手渐变（邪恶的暗紫色/暗红色）
        const tentacleGradient = ctx.createLinearGradient(baseX, baseY, tentacleEndX, tentacleEndY)
        tentacleGradient.addColorStop(0, `rgba(75, 0, 130, ${tentacleData.glow * 0.95})`) // 深紫色根部
        tentacleGradient.addColorStop(0.3, `rgba(139, 0, 0, ${tentacleData.glow * 0.9})`) // 暗红色
        tentacleGradient.addColorStop(0.6, `rgba(75, 0, 130, ${tentacleData.glow * 0.85})`)
        tentacleGradient.addColorStop(1, `rgba(25, 0, 51, ${tentacleData.glow * 0.7})`) // 接近黑色末端
        
        // 绘制触手主体（粗壮弯曲，有明显摆动，增强压迫感）
        ctx.shadowBlur = 30
        ctx.shadowColor = 'rgba(139, 0, 0, 0.8)'
        ctx.strokeStyle = tentacleGradient
        const lineWidth = 20 - (i % 4) * 2 // 触手粗细变化
        ctx.lineWidth = lineWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        
        ctx.beginPath()
        ctx.moveTo(baseX, baseY)
        
        // 使用二次贝塞尔曲线创建自然的弯曲摆动效果
        const midX = (baseX + tentacleEndX) / 2
        const midY = (baseY + tentacleEndY) / 2
        // 控制点会根据摆动相位移动，创造摆动效果
        const controlX = midX + Math.sin(tentacleData.swingPhase * 2 + i) * 50
        const controlY = midY + Math.cos(tentacleData.swingPhase * 1.5 + i) * 30
        
        ctx.quadraticCurveTo(controlX, controlY, tentacleEndX, tentacleEndY)
        ctx.stroke()
        
        // 触手末端邪恶的尖刺/爪子
        ctx.shadowBlur = 25 * tentacleData.glow
        ctx.shadowColor = 'rgba(255, 0, 0, 0.9)'
        // 末端发光（血红色）
        ctx.fillStyle = `rgba(255, 0, 0, ${tentacleData.glow * 0.8})`
        ctx.beginPath()
        const tipSize = 12 - (i % 4)
        ctx.arc(tentacleEndX, tentacleEndY, tipSize, 0, Math.PI * 2)
        ctx.fill()
        // 末端尖刺（三角形）
        ctx.fillStyle = `rgba(139, 0, 0, ${tentacleData.glow})`
        ctx.beginPath()
        ctx.moveTo(tentacleEndX, tentacleEndY - tipSize)
        ctx.lineTo(tentacleEndX - (tipSize * 0.8), tentacleEndY + (tipSize * 0.7))
        ctx.lineTo(tentacleEndX + (tipSize * 0.8), tentacleEndY + (tipSize * 0.7))
        ctx.closePath()
        ctx.fill()
        
        ctx.shadowBlur = 0
        ctx.restore()
      }
      
      // ========== 6. 绘制邪恶能量粒子（暗红色/紫色，增强压迫感）==========
      ctx.save()
      // 头部周围的邪恶能量粒子（更大更多）
      for (let i = 0; i < 30; i++) {
        const particleAngle = (Math.PI * 2 * i) / 30 + puni.energyBody.glowPhase
        const particleRadius = 60 + Math.sin(puni.energyBody.glowPhase * 2 + i) * 40
        const particleX = centerX + Math.cos(particleAngle) * particleRadius
        const particleY = headTopY + Math.sin(particleAngle) * particleRadius * 0.5
        
        const particleAlpha = 0.7 + Math.sin(puni.energyBody.glowPhase * 3 + i) * 0.3
        const particleSize = 4 + Math.sin(puni.energyBody.glowPhase * 2 + i) * 2
        
        // 暗红色/紫色粒子
        ctx.shadowBlur = 15
        ctx.shadowColor = 'rgba(139, 0, 0, 0.8)'
        ctx.fillStyle = `rgba(139, 0, 0, ${particleAlpha})`
          ctx.beginPath()
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2)
          ctx.fill()
        }
        
      // 触手周围的邪恶能量粒子
      const particleBaseY = centerY - bodyHeight / 6
      for (let i = 0; i < 25; i++) {
        const side = i % 2 === 0 ? -1 : 1
        const particleAngle = (Math.PI * 2 * i) / 25 + puni.energyBody.glowPhase
        const particleRadius = 120 + Math.sin(puni.energyBody.glowPhase * 2 + i) * 50
        const particleX = centerX + Math.cos(particleAngle) * particleRadius * side
        const particleY = particleBaseY + Math.sin(particleAngle) * particleRadius * 0.3
        
        const particleAlpha = 0.6 + Math.sin(puni.energyBody.glowPhase * 3 + i) * 0.4
        const particleSize = 3 + Math.sin(puni.energyBody.glowPhase * 2 + i) * 2
        
        ctx.shadowBlur = 12
        ctx.shadowColor = 'rgba(139, 0, 0, 0.7)'
        ctx.fillStyle = `rgba(75, 0, 130, ${particleAlpha})`
        ctx.beginPath()
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
      ctx.restore()
      
      // ========== 7. 绘制邪恶的暗影光晕（增强压迫感和邪恶感）==========
      ctx.save()
      ctx.globalAlpha = 0.6 + Math.sin(puni.energyBody.glowPhase * 2) * 0.3
      
      // 中部的暗红色/紫色光晕（水平，更大）
      const haloY = centerY
      const haloWidth = bodyWidth * 3
      const haloHeight = 40
      
      const haloGradient = ctx.createLinearGradient(centerX - haloWidth / 2, haloY, centerX + haloWidth / 2, haloY)
      haloGradient.addColorStop(0, 'rgba(139, 0, 0, 0)')
      haloGradient.addColorStop(0.3, 'rgba(139, 0, 0, 0.8)')
      haloGradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.9)')
      haloGradient.addColorStop(0.7, 'rgba(139, 0, 0, 0.8)')
      haloGradient.addColorStop(1, 'rgba(139, 0, 0, 0)')
      
      ctx.fillStyle = haloGradient
        ctx.beginPath()
      ctx.ellipse(centerX, haloY, haloWidth / 2, haloHeight / 2, 0, 0, Math.PI * 2)
      ctx.fill()
        
      // 外层暗影（增强压迫感）
      ctx.globalAlpha = 0.4
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.beginPath()
      ctx.ellipse(centerX, haloY, haloWidth / 2 * 1.2, haloHeight / 2 * 1.2, 0, 0, Math.PI * 2)
        ctx.fill()
      
      ctx.globalAlpha = 1
      ctx.restore()
      
      // 如果正在释放技能，显示技能特效
      if (puni.currentSkill) {
        this.drawPuniSkillEffect(ctx, puni.currentSkill, puni.skillCastTime)
      }
      
      // 如果处于缩壳状态（能量体收缩）
      if (puni.energyBody.isContracted) {
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.globalAlpha = 0.4
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = bodyWidth * 1.5
        ctx.beginPath()
        ctx.ellipse(0, 0, bodyWidth / 2, bodyHeight / 2, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
      
      // 如果处于圣光气状态，显示暴击光晕（红色）
      if (puni.buffs.shengGuangQi > 0) {
        const bLength = bodyHeight
        const bWidth = bodyWidth
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'
        ctx.lineWidth = 4
        ctx.setLineDash([8, 8])
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, bLength / 2 + 40, bWidth * 3 + 40, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
        
        // 红色光点环绕
        ctx.fillStyle = 'rgba(255, 0, 0, 0.6)'
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 * i) / 12 + puni.energyBody.glowPhase
          const px = centerX + Math.cos(angle) * (bLength / 2 + 30)
          const py = centerY + Math.sin(angle) * (bWidth * 2 + 30)
          ctx.beginPath()
          ctx.arc(px, py, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      
      // 如果处于璀灵圣光状态，显示护盾
      if (puni.buffs.cuiLingShengGuang > 0) {
        const bLength = bodyHeight
        const bWidth = bodyWidth
        const shieldAlpha = 0.4 + Math.sin(puni.energyBody.glowPhase * 2) * 0.3
        ctx.strokeStyle = `rgba(255, 255, 255, ${shieldAlpha})`
        ctx.lineWidth = 5
        ctx.setLineDash([10, 5])
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, bLength / 2 + 50, bWidth * 3 + 50, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
        
        // 绘制七大封印图案（环绕在护盾周围）
        puni.sealStones.forEach((stone, i) => {
          const patternX = centerX + Math.cos(stone.angle) * (bLength / 2 + 40)
          const patternY = centerY + Math.sin(stone.angle) * (bWidth * 2 + 40)
          ctx.fillStyle = `rgba(255, 255, 255, ${shieldAlpha})`
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(stone.sealType, patternX, patternY)
        })
      }
      
      // ========== 8. 绘制额外的太空元素（在BOSS主体之后）==========
      
      // 7. 绘制星座连线效果（连接周围的星体）
      ctx.save()
      ctx.strokeStyle = 'rgba(138, 43, 226, 0.3)'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      
      const constellationStars = []
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8 + puni.energyBody.glowPhase * 0.2
        const distance = 450
        const starX = centerX + Math.cos(angle) * distance
        const starY = centerY + Math.sin(angle) * distance * 0.6
        constellationStars.push({ x: starX, y: starY })
        
        // 绘制星座节点（较大的星）
        ctx.fillStyle = 'rgba(200, 180, 255, 0.8)'
        ctx.beginPath()
        ctx.arc(starX, starY, 4, 0, Math.PI * 2)
        ctx.fill()
      }
      
      // 连接相邻的星座节点
      for (let i = 0; i < constellationStars.length; i++) {
        const next = (i + 1) % constellationStars.length
        ctx.beginPath()
        ctx.moveTo(constellationStars[i].x, constellationStars[i].y)
        ctx.lineTo(constellationStars[next].x, constellationStars[next].y)
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.restore()
      
      // 8. 绘制宇宙能量波纹（从BOSS中心向外扩散的波纹）
      ctx.save()
      for (let wave = 0; wave < 3; wave++) {
        const waveRadius = 300 + wave * 100 + Math.sin(puni.energyBody.glowPhase * 2 + wave) * 30
        const waveAlpha = 0.5 - wave * 0.15
        ctx.strokeStyle = `rgba(138, 43, 226, ${waveAlpha})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, waveRadius, waveRadius * 0.6, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
      
      // 9. 绘制宇宙射线束（从外部射向BOSS的能量束）
      ctx.save()
      for (let i = 0; i < 8; i++) {
        const beamAngle = (Math.PI * 2 * i) / 8 + puni.energyBody.glowPhase * 0.4
        const beamStartDistance = 600
        const beamEndDistance = 400
        const beamStartX = centerX + Math.cos(beamAngle) * beamStartDistance
        const beamStartY = centerY + Math.sin(beamAngle) * beamStartDistance * 0.6
        const beamEndX = centerX + Math.cos(beamAngle) * beamEndDistance
        const beamEndY = centerY + Math.sin(beamAngle) * beamEndDistance * 0.6
        
        const beamGradient = ctx.createLinearGradient(beamStartX, beamStartY, beamEndX, beamEndY)
        beamGradient.addColorStop(0, 'rgba(138, 43, 226, 0)')
        beamGradient.addColorStop(0.7, 'rgba(75, 0, 130, 0.3)')
        beamGradient.addColorStop(1, 'rgba(138, 43, 226, 0.5)')
        
        ctx.strokeStyle = beamGradient
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(beamStartX, beamStartY)
        ctx.lineTo(beamEndX, beamEndY)
        ctx.stroke()
      }
      ctx.restore()
      
      // 10. 绘制小行星带（围绕BOSS的小行星群）
      ctx.save()
      for (let i = 0; i < 20; i++) {
        const asteroidAngle = (Math.PI * 2 * i) / 20 + puni.energyBody.glowPhase * 0.25
        const asteroidDistance = 500 + Math.sin(puni.energyBody.glowPhase + i) * 100
        const asteroidX = centerX + Math.cos(asteroidAngle) * asteroidDistance
        const asteroidY = centerY + Math.sin(asteroidAngle) * asteroidDistance * 0.6
        // 使用伪随机数（基于索引）避免闪烁
        const pseudoRand1 = (Math.sin(i * 123.456) + 1) / 2
        const pseudoRand2 = (Math.sin(i * 789.012) + 1) / 2
        const asteroidSize = 3 + pseudoRand1 * 4
        
        // 小行星旋转
        ctx.save()
        ctx.translate(asteroidX, asteroidY)
        ctx.rotate(puni.energyBody.glowPhase * 2 + i)
        
        ctx.fillStyle = 'rgba(150, 150, 150, 0.7)'
        ctx.beginPath()
        // 不规则形状的小行星（使用伪随机数）
        for (let j = 0; j < 6; j++) {
          const pointAngle = (Math.PI * 2 * j) / 6
          const pointRand = (Math.sin((i + j) * 456.789) + 1) / 2
          const pointRadius = asteroidSize * (0.8 + pointRand * 0.4)
          const px = Math.cos(pointAngle) * pointRadius
          const py = Math.sin(pointAngle) * pointRadius
          if (j === 0) {
            ctx.moveTo(px, py)
          } else {
            ctx.lineTo(px, py)
          }
        }
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      ctx.restore()
      
      // 11. 绘制彗星轨迹（偶尔出现的彗星）
      ctx.save()
      const cometAngle = puni.energyBody.glowPhase * 0.15
      const cometDistance = 550
      const cometX = centerX + Math.cos(cometAngle) * cometDistance
      const cometY = centerY + Math.sin(cometAngle) * cometDistance * 0.6
      
      // 彗星尾巴
      const tailLength = 80
      const tailGradient = ctx.createLinearGradient(
        cometX, cometY,
        cometX - Math.cos(cometAngle + Math.PI) * tailLength,
        cometY - Math.sin(cometAngle + Math.PI) * tailLength
      )
      tailGradient.addColorStop(0, 'rgba(200, 200, 255, 0.8)')
      tailGradient.addColorStop(0.5, 'rgba(150, 150, 255, 0.5)')
      tailGradient.addColorStop(1, 'rgba(100, 100, 255, 0)')
      
      ctx.strokeStyle = tailGradient
      ctx.lineWidth = 8
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cometX, cometY)
      ctx.lineTo(
        cometX - Math.cos(cometAngle + Math.PI) * tailLength,
        cometY - Math.sin(cometAngle + Math.PI) * tailLength
      )
      ctx.stroke()
      
      // 彗星核心
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.beginPath()
      ctx.arc(cometX, cometY, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      
      ctx.restore()
      
      // 绘制血条
      const hpBarWidth = puni.w
      const hpBarHeight = 20
      const hpBarX = puni.x
      const hpBarY = puni.y - 40
      const hpPercent = puni.hp / puni.maxHp
      
      // 血条背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight)
      
      // 血条前景
      const hpColor = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000'
      ctx.fillStyle = hpColor
      ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight)
      
      // 血条边框
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight)
      
      // 血条文字
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `谱尼 HP: ${Math.ceil(puni.hp)} / ${puni.maxHp}`,
        centerX,
        hpBarY + hpBarHeight / 2 + 5
      )
      
      // 如果护盾存在，显示护盾条
      if (puni.buffs.shield > 0) {
        const shieldPercent = puni.buffs.shield / (puni.maxHp * 0.3)
        ctx.fillStyle = 'rgba(0, 255, 255, 0.6)'
        ctx.fillRect(hpBarX, hpBarY - 25, hpBarWidth * shieldPercent, 15)
      }
    },
    
    // 绘制谱尼技能特效
    drawPuniSkillEffect(ctx, skillName, castTime) {
      const puni = this.puniBoss
      const centerX = puni.x + puni.w / 2
      const centerY = puni.y + puni.h / 2
      
      switch (skillName) {
        case 'siZhouJiGuang':
          // 第一种攻击：散射一圈激光子弹 - 蓄力时显示能量聚集效果（圆周形态）
          if (castTime < 0.4) {
            const progress = castTime / 0.4
            const radius = 80 + progress * 60
            const alpha = 0.6 + progress * 0.4
            
            // 能量聚集环（多层，形成圆周形态）
            for (let ring = 0; ring < 3; ring++) {
              const ringRadius = radius + ring * 20
              const ringAlpha = alpha * (1 - ring * 0.3)
              ctx.strokeStyle = `rgba(0, 255, 255, ${ringAlpha})`
              ctx.lineWidth = 4 - ring
              ctx.beginPath()
              ctx.ellipse(centerX, centerY, ringRadius, ringRadius * 0.6, 0, 0, Math.PI * 2)
              ctx.stroke()
            }
            
            // 能量粒子效果（圆周分布，预示子弹位置）
            const particleCount = 32
            for (let i = 0; i < particleCount; i++) {
              const angle = (Math.PI * 2 * i) / particleCount
              const particleRadius = 100 + Math.sin(progress * Math.PI * 4 + i) * 20
              const particleX = centerX + Math.cos(angle) * particleRadius
              const particleY = centerY + Math.sin(angle) * particleRadius * 0.6
              
              const particleAlpha = alpha * (0.7 + Math.sin(progress * Math.PI * 6 + i) * 0.3)
              ctx.fillStyle = `rgba(0, 255, 255, ${particleAlpha})`
              ctx.beginPath()
              ctx.arc(particleX, particleY, 4, 0, Math.PI * 2)
              ctx.fill()
            }
            
            // 中心能量聚集点
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`
            ctx.shadowBlur = 30
            ctx.shadowColor = 'rgba(0, 255, 255, 0.8)'
            ctx.beginPath()
            ctx.arc(centerX, centerY, 20 * progress, 0, Math.PI * 2)
            ctx.fill()
            ctx.shadowBlur = 0
          } else if (castTime < 0.8) {
            // 释放阶段：显示激光发射的爆发效果（圆周形态）
            const releaseProgress = (castTime - 0.4) / 0.4
            const burstRadius = 100 + releaseProgress * 150
            const burstAlpha = (1 - releaseProgress) * 0.8
            
            // 爆发光晕（椭圆形，形成圆周）
            ctx.strokeStyle = `rgba(0, 255, 255, ${burstAlpha})`
            ctx.lineWidth = 5
            ctx.beginPath()
            ctx.ellipse(centerX, centerY, burstRadius, burstRadius * 0.6, 0, 0, Math.PI * 2)
            ctx.stroke()
            
            // 爆发粒子（圆周分布）
            for (let i = 0; i < 16; i++) {
              const angle = (Math.PI * 2 * i) / 16
              const particleDistance = burstRadius * 0.8
              const particleX = centerX + Math.cos(angle) * particleDistance
              const particleY = centerY + Math.sin(angle) * particleDistance * 0.6
              
              ctx.fillStyle = `rgba(0, 255, 255, ${burstAlpha * 0.6})`
              ctx.beginPath()
              ctx.arc(particleX, particleY, 6, 0, Math.PI * 2)
              ctx.fill()
            }
          }
          break
        case 'shengGuangQi':
          // 圣光气：光茧效果
          if (castTime < 1.0) {
            const progress = castTime / 1.0
            const radius = 100 + progress * 50
            const alpha = 0.3 + progress * 0.5
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
            ctx.lineWidth = 5
            ctx.beginPath()
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
            ctx.stroke()
            
            if (progress > 0.5) {
              // 光茧破裂效果
              ctx.fillStyle = `rgba(255, 255, 255, ${(progress - 0.5) * 2})`
              ctx.beginPath()
              ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2)
              ctx.fill()
            }
          }
          break
        case 'shanXingDanMu':
          // 扇形弹幕：扇形能量聚集
          if (castTime < 0.3) {
            const progress = castTime / 0.3
            const playerCenterX = this.player.x + this.player.w / 2
            const playerCenterY = this.player.y + this.player.h / 2
            const dx = playerCenterX - centerX
            const dy = playerCenterY - centerY
            const baseAngle = Math.atan2(dy, dx)
            
            // 扇形指示器
            ctx.strokeStyle = `rgba(255, 107, 107, ${0.5 + progress * 0.5})`
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.moveTo(centerX, centerY)
            const spreadAngle = Math.PI / 4
            for (let i = 0; i < 5; i++) {
              const angle = baseAngle + (i - 2) * (spreadAngle / 4)
              const lineLength = 200 + progress * 100
              const endX = centerX + Math.cos(angle) * lineLength
              const endY = centerY + Math.sin(angle) * lineLength
              ctx.lineTo(endX, endY)
            }
            ctx.stroke()
          }
          break
        case 'genZongZiDan':
          // 跟踪子弹：能量漩涡（6发子弹，显示6个能量漩涡）
          if (castTime < 0.4) {
            const progress = castTime / 0.4
            ctx.strokeStyle = `rgba(255, 0, 255, ${0.6 + progress * 0.4})`
            ctx.lineWidth = 4
            // 显示6个能量漩涡，预示6发子弹的位置
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI * 2 * i) / 6 + progress * Math.PI * 0.5
              const radius = 80 + progress * 60
              const vortexX = centerX + Math.cos(angle) * radius * 0.5
              const vortexY = centerY + Math.sin(angle) * radius * 0.5
              
              // 绘制能量漩涡（小圆圈）
              for (let ring = 0; ring < 2; ring++) {
                const vortexRadius = 20 + ring * 15 + progress * 20
                ctx.beginPath()
                ctx.arc(vortexX, vortexY, vortexRadius, 0, Math.PI * 2)
                ctx.stroke()
              }
            }
            
            // 中心能量聚集点
            ctx.fillStyle = `rgba(255, 0, 255, ${progress})`
            ctx.shadowBlur = 30
            ctx.shadowColor = 'rgba(255, 0, 255, 0.8)'
            ctx.beginPath()
            ctx.arc(centerX, centerY, 25 * progress, 0, Math.PI * 2)
            ctx.fill()
            ctx.shadowBlur = 0
          }
          break
        case 'xuanZhuanDanMu':
          // 旋转弹幕：在子弹将要出现的位置显示红色预警标记
          if (castTime < 0.6) {
            const progress = castTime / 0.6 // 预警时间从0.5秒增加到0.6秒
            const skillData = puni.skillData || {}
            const radius = skillData.radius || Math.max(puni.w / 2, puni.h / 2) * 0.9
            const bulletCount = skillData.bulletCount || 8 // 更新默认值，从10改为8
            const angleOffset = skillData.angleOffset || 0
            const angleStep = (Math.PI * 2) / bulletCount
            const rotationPhase = skillData.rotationPhase || 0
            
            // 绘制红色预警标记（在子弹将要出现的位置）
            ctx.save()
            for (let i = 0; i < bulletCount; i++) {
              // 计算子弹将要出现的角度（包含随机偏移和旋转）
              const angle = i * angleStep + angleOffset + rotationPhase
              
              // 计算子弹在轨道上的位置
              const bulletX = centerX + Math.cos(angle) * radius
              const bulletY = centerY + Math.sin(angle) * radius * 0.6
              
              // 绘制红色预警标记（闪烁效果，提醒玩家子弹将在此位置出现）
              const markerAlpha = 0.6 + Math.sin(progress * Math.PI * 10 + i * 0.5) * 0.4
              
              // 外圈：红色警告圆
              ctx.fillStyle = `rgba(255, 0, 0, ${Math.max(0.4, Math.min(1, markerAlpha))})`
              ctx.shadowBlur = 20
              ctx.shadowColor = 'rgba(255, 0, 0, 0.8)'
              ctx.beginPath()
              ctx.arc(bulletX, bulletY, 12 + progress * 8, 0, Math.PI * 2)
              ctx.fill()
              
              // 中圈：橙色警告圆
              ctx.fillStyle = `rgba(255, 100, 0, ${markerAlpha * 0.8})`
              ctx.shadowBlur = 10
              ctx.shadowColor = 'rgba(255, 100, 0, 0.6)'
              ctx.beginPath()
              ctx.arc(bulletX, bulletY, 8 + progress * 5, 0, Math.PI * 2)
              ctx.fill()
              
              // 内圈：黄色核心
              ctx.fillStyle = `rgba(255, 200, 0, ${markerAlpha * 0.9})`
              ctx.shadowBlur = 0
              ctx.beginPath()
              ctx.arc(bulletX, bulletY, 4 + progress * 3, 0, Math.PI * 2)
              ctx.fill()
              
              // 绘制警告十字标记
              ctx.strokeStyle = `rgba(255, 255, 255, ${markerAlpha * 0.8})`
              ctx.lineWidth = 2
              ctx.beginPath()
              const crossSize = 6 + progress * 4
              ctx.moveTo(bulletX - crossSize, bulletY)
              ctx.lineTo(bulletX + crossSize, bulletY)
              ctx.moveTo(bulletX, bulletY - crossSize)
              ctx.lineTo(bulletX, bulletY + crossSize)
              ctx.stroke()
            }
            ctx.shadowBlur = 0
            ctx.restore()
          }
          break
        case 'lianXuChongCi':
          // 连续冲刺：冲刺轨迹预览
          if (castTime < 0.3) {
            const progress = castTime / 0.3
            const playerCenterX = this.player.x + this.player.w / 2
            const playerCenterY = this.player.y + this.player.h / 2
            
            // 冲刺路径指示
            ctx.strokeStyle = `rgba(255, 165, 0, ${0.5 + progress * 0.5})`
            ctx.lineWidth = 4
            ctx.setLineDash([10, 5])
            ctx.beginPath()
            ctx.moveTo(centerX, centerY)
            ctx.lineTo(playerCenterX, playerCenterY)
            ctx.stroke()
            ctx.setLineDash([])
            
            // 目标点标记
            ctx.fillStyle = `rgba(255, 165, 0, ${progress})`
            ctx.beginPath()
            ctx.arc(playerCenterX, playerCenterY, 15 * progress, 0, Math.PI * 2)
            ctx.fill()
          }
          break
        case 'jiGuangSaoShe':
          // 激光扫射：激光束绘制
          if (castTime >= 0.4 && castTime < 2.0) {
            const data = puni.skillData
            if (data && data.laserCreated) {
              // 绘制激光束
              const laserEndX = centerX + Math.cos(data.sweepAngle) * data.laserLength
              const laserEndY = centerY + Math.sin(data.sweepAngle) * data.laserLength
              
              // 激光渐变
              const laserGradient = ctx.createLinearGradient(centerX, centerY, laserEndX, laserEndY)
              laserGradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)')
              laserGradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.9)')
              laserGradient.addColorStop(1, 'rgba(255, 0, 0, 0.6)')
              
              ctx.strokeStyle = laserGradient
              ctx.lineWidth = 30
              ctx.shadowBlur = 20
              ctx.shadowColor = 'rgba(255, 0, 0, 0.8)'
              ctx.beginPath()
              ctx.moveTo(centerX, centerY)
              ctx.lineTo(laserEndX, laserEndY)
              ctx.stroke()
              ctx.shadowBlur = 0
              
              // 激光核心
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
              ctx.lineWidth = 8
              ctx.beginPath()
              ctx.moveTo(centerX, centerY)
              ctx.lineTo(laserEndX, laserEndY)
              ctx.stroke()
            }
          } else if (castTime < 0.4) {
            // 蓄力阶段：警告效果
            const progress = castTime / 0.4
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.5 + progress * 0.5})`
            ctx.lineWidth = 3
            ctx.setLineDash([5, 5])
            const warnRadius = 100 + progress * 50
            ctx.beginPath()
            ctx.arc(centerX, centerY, warnRadius, 0, Math.PI * 2)
            ctx.stroke()
            ctx.setLineDash([])
          }
          break
        case 'quYuBaoZha':
          // 区域爆炸：警告标记
          if (castTime < 0.4) {
            const progress = castTime / 0.4
            const playerCenterX = this.player.x + this.player.w / 2
            const playerCenterY = this.player.y + this.player.h / 2
            const warnRadius = 150
            
            // 警告圆圈（闪烁）
            const alpha = 0.5 + Math.sin(progress * Math.PI * 10) * 0.3
            ctx.strokeStyle = `rgba(255, 69, 0, ${alpha})`
            ctx.lineWidth = 4
            ctx.setLineDash([8, 4])
            ctx.beginPath()
            ctx.arc(playerCenterX, playerCenterY, warnRadius, 0, Math.PI * 2)
            ctx.stroke()
            ctx.setLineDash([])
            
            // 警告中心标记
            ctx.fillStyle = `rgba(255, 69, 0, ${alpha})`
            ctx.beginPath()
            ctx.arc(playerCenterX, playerCenterY, 10 + progress * 10, 0, Math.PI * 2)
            ctx.fill()
            
            // 警告文字
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
            ctx.font = 'bold 16px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('!', playerCenterX, playerCenterY - warnRadius - 20)
          } else if (castTime >= 0.4 && castTime < 2.0) {
            // 爆炸阶段：显示爆炸标记
            const data = puni.skillData
            if (data && data.explosionCount > 0) {
              // 已经创建了爆炸，这里可以显示额外的效果
            }
          }
          break
      }
    },
    
    drawBoss(ctx) {
      if (!this.boss) return
      
      const boss = this.boss
      
      // 绘制BOSS身体 - 美化版本
      // 身体渐变效果
      const gradient = ctx.createLinearGradient(boss.x, boss.y, boss.x, boss.y + boss.h)
      gradient.addColorStop(0, '#8b0000')
      gradient.addColorStop(0.5, '#b22222')
      gradient.addColorStop(1, '#8b0000')
      ctx.fillStyle = gradient
      
      // 圆角矩形身体
      ctx.beginPath()
      const radius = 15
      ctx.moveTo(boss.x + radius, boss.y)
      ctx.lineTo(boss.x + boss.w - radius, boss.y)
      ctx.quadraticCurveTo(boss.x + boss.w, boss.y, boss.x + boss.w, boss.y + radius)
      ctx.lineTo(boss.x + boss.w, boss.y + boss.h - radius)
      ctx.quadraticCurveTo(boss.x + boss.w, boss.y + boss.h, boss.x + boss.w - radius, boss.y + boss.h)
      ctx.lineTo(boss.x + radius, boss.y + boss.h)
      ctx.quadraticCurveTo(boss.x, boss.y + boss.h, boss.x, boss.y + boss.h - radius)
      ctx.lineTo(boss.x, boss.y + radius)
      ctx.quadraticCurveTo(boss.x, boss.y, boss.x + radius, boss.y)
      ctx.closePath()
      ctx.fill()
      
      // 身体轮廓
      ctx.strokeStyle = '#ff4500'
      ctx.lineWidth = 3
      ctx.stroke()
      
      // 绘制BOSS血条 - 美化版本
      const hpRatio = Math.max(0, boss.hp / boss.maxHp)
      
      // 血条背景
      ctx.fillStyle = '#333'
      ctx.fillRect(boss.x - 5, boss.y - 25, boss.w + 10, 12)
      
      // 血条前景
      const hpGradient = ctx.createLinearGradient(boss.x, boss.y - 25, boss.x + boss.w * hpRatio, boss.y - 25)
      if (hpRatio > 0.7) {
        hpGradient.addColorStop(0, '#4CAF50')
        hpGradient.addColorStop(1, '#66BB6A')
      } else if (hpRatio > 0.3) {
        hpGradient.addColorStop(0, '#ff9800')
        hpGradient.addColorStop(1, '#ffb74d')
      } else {
        hpGradient.addColorStop(0, '#f44336')
        hpGradient.addColorStop(1, '#ef5350')
      }
      ctx.fillStyle = hpGradient
      ctx.fillRect(boss.x - 5, boss.y - 25, (boss.w + 10) * hpRatio, 12)
      
      // 血条边框
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.strokeRect(boss.x - 5, boss.y - 25, boss.w + 10, 12)
      
      // 绘制BOSS眼睛 - 美化版本
      // 左眼
      const eyeGradient = ctx.createRadialGradient(
        boss.x + boss.w * 0.3, boss.y + boss.h * 0.35, 0,
        boss.x + boss.w * 0.3, boss.y + boss.h * 0.35, 12
      )
      eyeGradient.addColorStop(0, '#fff')
      eyeGradient.addColorStop(0.8, '#ddd')
      eyeGradient.addColorStop(1, '#bbb')
      ctx.fillStyle = eyeGradient
      ctx.beginPath()
      ctx.arc(boss.x + boss.w * 0.3, boss.y + boss.h * 0.35, 12, 0, Math.PI * 2)
      ctx.fill()
      
      // 右眼
      ctx.beginPath()
      ctx.arc(boss.x + boss.w * 0.7, boss.y + boss.h * 0.35, 12, 0, Math.PI * 2)
      ctx.fill()
      
      // 瞳孔
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(boss.x + boss.w * 0.3, boss.y + boss.h * 0.35, 6, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(boss.x + boss.w * 0.7, boss.y + boss.h * 0.35, 6, 0, Math.PI * 2)
      ctx.fill()
      
      // 眼睛高光
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(boss.x + boss.w * 0.28, boss.y + boss.h * 0.33, 2, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(boss.x + boss.w * 0.68, boss.y + boss.h * 0.33, 2, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制BOSS角 - 美化版本
      ctx.fillStyle = '#ff4500'
      
      // 左角
      ctx.beginPath()
      ctx.moveTo(boss.x + boss.w * 0.25, boss.y)
      ctx.lineTo(boss.x + boss.w * 0.35, boss.y - 25)
      ctx.lineTo(boss.x + boss.w * 0.45, boss.y)
      ctx.closePath()
      ctx.fill()
      
      // 右角
      ctx.beginPath()
      ctx.moveTo(boss.x + boss.w * 0.55, boss.y)
      ctx.lineTo(boss.x + boss.w * 0.65, boss.y - 25)
      ctx.lineTo(boss.x + boss.w * 0.75, boss.y)
      ctx.closePath()
      ctx.fill()
      
      // 角的光泽效果
      const hornGradient = ctx.createLinearGradient(boss.x + boss.w * 0.35, boss.y - 25, boss.x + boss.w * 0.35, boss.y)
      hornGradient.addColorStop(0, '#ff8c00')
      hornGradient.addColorStop(1, '#ff4500')
      ctx.fillStyle = hornGradient
      
      // 左角光泽
      ctx.beginPath()
      ctx.moveTo(boss.x + boss.w * 0.28, boss.y + 5)
      ctx.lineTo(boss.x + boss.w * 0.33, boss.y - 20)
      ctx.lineTo(boss.x + boss.w * 0.38, boss.y + 5)
      ctx.closePath()
      ctx.fill()
      
      // 右角光泽
      ctx.beginPath()
      ctx.moveTo(boss.x + boss.w * 0.58, boss.y + 5)
      ctx.lineTo(boss.x + boss.w * 0.63, boss.y - 20)
      ctx.lineTo(boss.x + boss.w * 0.68, boss.y + 5)
      ctx.closePath()
      ctx.fill()
      
      // 身体纹理 - 添加一些肌肉线条
      ctx.strokeStyle = '#ff6347'
      ctx.lineWidth = 2
      
      // 胸部线条
      ctx.beginPath()
      ctx.moveTo(boss.x + boss.w * 0.3, boss.y + boss.h * 0.6)
      ctx.lineTo(boss.x + boss.w * 0.7, boss.y + boss.h * 0.6)
      ctx.stroke()
      
      // 腹部线条
      ctx.beginPath()
      ctx.moveTo(boss.x + boss.w * 0.4, boss.y + boss.h * 0.8)
      ctx.lineTo(boss.x + boss.w * 0.6, boss.y + boss.h * 0.8)
      ctx.stroke()
    },
    
    drawHUD() {
      const ctx = this.ctx
      
      // 在舱门附近显示提示
      if (this.isNearShipDoor()) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        const actionText = this.player.inShip ? '按E离开飞船' : '按E返回主界面'
        ctx.fillText(actionText, this.ship.x + this.ship.w/2, this.ship.y + this.ship.h + 40)
      }
      
      // 简化后的背景半透明面板 - 显示地图名称、时间、血量、子弹
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(10, 10, 180, 110)
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)'
      ctx.lineWidth = 2
      ctx.strokeRect(10, 10, 180, 110)
      
      // 显示地图名称
      ctx.fillStyle = '#87CEEB'
      ctx.font = 'bold 14px Arial'
      ctx.fillText(`地图: ${this.mapName}`, 20, 25)
      
      // 显示游戏时间（与初始界面同步更新）
      // 计算当前游戏总时间（初始时间 + 本次游戏时间）
      const totalGameTime = this.gameTime + this.elapsedTime
      
      // 计算当前小时和分钟（与初始界面相同的逻辑）
      const dayNightCycle = (totalGameTime % 1200) / 1200 // 0-1循环，1天=1200秒
      const currentHour = Math.floor(dayNightCycle * 24)
      const currentMinutes = Math.floor((dayNightCycle * 24 % 1) * 60)
      const currentDayCount = Math.floor(totalGameTime / 1200) + 1
      
      // 时间显示 - 简化版
      ctx.fillStyle = '#ffd700'
      ctx.font = 'bold 12px Arial'
      ctx.fillText(`时间: ${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`, 20, 40)
      ctx.fillStyle = '#ffffff'
      ctx.font = '11px Arial'
      ctx.fillText(`第${currentDayCount}天`, 20, 55)
      
      // 血条 - 简化设计
      const barW = 120, barH = 8
      const maxHp = this.maxHp || 10000 // 使用maxHp，如果没有则使用10000
      const hpRatio = Math.max(0, Math.min(1, this.hp / maxHp))
      
      // 血条背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.fillRect(20, 70, barW, barH)
      
      // 血条前景 - 根据血量变化颜色
      let hpColor
      if (hpRatio > 0.6) hpColor = '#4CAF50' // 绿色
      else if (hpRatio > 0.3) hpColor = '#FF9800' // 橙色
      else hpColor = '#F44336' // 红色
      
      ctx.fillStyle = hpColor
      ctx.fillRect(20, 70, Math.max(0, barW * hpRatio), barH)
      
      // 血条边框
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 1
      ctx.strokeRect(20, 70, barW, barH)
      
      // 血量文字
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px Arial'
      ctx.fillText(`HP: ${Math.ceil(this.hp)}/${maxHp}`, 25, 80)
      
      // 子弹信息 - 简化显示
      if (this.player.currentWeapon) {
        const weapon = this.player.currentWeapon
        const ammoCount = this.player.ammo[weapon.type] || 0
        
        // 子弹数量颜色警告
        let ammoColor = '#ffffff'
        if (ammoCount < 10) ammoColor = '#ff6b6b'
        else if (ammoCount < 20) ammoColor = '#ffa726'
        
        ctx.fillStyle = '#9b59b6'
        ctx.font = 'bold 11px Arial'
        ctx.fillText(`子弹: ${ammoCount}`, 20, 95)
      } else {
        // 没有武器时显示默认信息
        ctx.fillStyle = '#cccccc'
        ctx.font = 'bold 11px Arial'
        ctx.fillText('子弹: 0', 20, 85)
      }
      
      // 光子盾牌信息显示
      ctx.fillStyle = '#00bcd4'
      ctx.font = 'bold 11px Arial'
      ctx.fillText(`光子盾: ${this.photonShield.energy}/${this.photonShield.maxEnergy}`, 20, 100)
      
      // 光子盾牌能量条
      const shieldEnergyRatio = Math.max(0, Math.min(1, this.photonShield.energy / this.photonShield.maxEnergy))
      const shieldBarW = 120, shieldBarH = 4
      
      // 能量条背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.fillRect(20, 105, shieldBarW, shieldBarH)
      
      // 能量条前景
      ctx.fillStyle = '#00bcd4'
      ctx.fillRect(20, 105, Math.max(0, shieldBarW * shieldEnergyRatio), shieldBarH)
      
      // 能量条边框
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 1
      ctx.strokeRect(20, 105, shieldBarW, shieldBarH)
      
      // 装备格子显示 - 在右下角显示8个装备格子
      this.drawEquipmentSlots(ctx)
      
      // 能源格子显示 - 在装备格子下方显示8个能源格子
      this.drawEnergySlots(ctx)
      
      // BOSS警告 - 保留在屏幕中央
      if (this.boss) {
        ctx.fillStyle = '#f44336'
        ctx.font = 'bold 20px Arial'
        ctx.fillText('BOSS战！', this.canvasWidth / 2 - 50, 30)
      }
      
      // 绘制小地图 - 在右上角
      this.drawMinimap(ctx)
      
      // 绘制准心 - 实时跟随鼠标光标
      if (this.crosshair.visible && this.running) {
        const x = this.crosshair.x
        const y = this.crosshair.y
        
        // 绘制准心十字线 - 增强视觉效果
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.setLineDash([])
        
        // 添加阴影效果
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 3
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1
        
        // 水平线
        ctx.beginPath()
        ctx.moveTo(x - 15, y)
        ctx.lineTo(x - 5, y)
        ctx.moveTo(x + 5, y)
        ctx.lineTo(x + 15, y)
        ctx.stroke()
        
        // 垂直线
        ctx.beginPath()
        ctx.moveTo(x, y - 15)
        ctx.lineTo(x, y - 5)
        ctx.moveTo(x, y + 5)
        ctx.lineTo(x, y + 15)
        ctx.stroke()
        
        // 重置阴影
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        
        // 中心点 - 红色高亮
        ctx.fillStyle = '#ff0000'
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
        
        // 外圈 - 黑色边框增强对比度
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, Math.PI * 2)
        ctx.stroke()
      }
    },
    
    // 新增方法：绘制小地图
    drawMinimap(ctx) {
      // 小地图尺寸和位置
      const minimapSize = 150
      const minimapPadding = 10
      const minimapX = this.canvasWidth - minimapSize - minimapPadding
      const minimapY = minimapPadding
      
      // 绘制小地图背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize)
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)'
      ctx.lineWidth = 2
      ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize)
      
      // 绘制地图边界（整个地图范围）
      const mapWidth = this.mapMaxX - this.mapMinX // 10000
      const mapHeight = this.mapMaxY - this.mapMinY // 10000
      
      // 计算缩放比例（小地图显示整个地图）
      const scaleX = minimapSize / mapWidth
      const scaleY = minimapSize / mapHeight
      const scale = Math.min(scaleX, scaleY) // 保持比例
      
      // 小地图中心（对应世界坐标原点0,0）
      const minimapCenterX = minimapX + minimapSize / 2
      const minimapCenterY = minimapY + minimapSize / 2
      
      // 绘制地图网格（可选，帮助定位）
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      // 绘制中心十字线（X=0和Y=0）
      ctx.beginPath()
      ctx.moveTo(minimapCenterX, minimapY)
      ctx.lineTo(minimapCenterX, minimapY + minimapSize)
      ctx.moveTo(minimapX, minimapCenterY)
      ctx.lineTo(minimapX + minimapSize, minimapCenterY)
      ctx.stroke()
      
      // 绘制永久阴影区（在小地图上）
      this.shadowZones.forEach(zone => {
        const zoneMinimapX = minimapCenterX + (zone.x * scale)
        const zoneMinimapY = minimapCenterY + (zone.y * scale)
        const zoneMinimapWidth = zone.width * scale
        const zoneMinimapHeight = zone.height * scale
        
        // 检查是否在小地图可见范围内
        if (zoneMinimapX + zoneMinimapWidth >= minimapX && zoneMinimapX <= minimapX + minimapSize &&
            zoneMinimapY + zoneMinimapHeight >= minimapY && zoneMinimapY <= minimapY + minimapSize) {
          // 绘制阴影区（深蓝色半透明）
          ctx.fillStyle = 'rgba(0, 0, 100, 0.6)'
          ctx.fillRect(
            Math.max(minimapX, zoneMinimapX),
            Math.max(minimapY, zoneMinimapY),
            Math.min(zoneMinimapWidth, minimapX + minimapSize - Math.max(minimapX, zoneMinimapX)),
            Math.min(zoneMinimapHeight, minimapY + minimapSize - Math.max(minimapY, zoneMinimapY))
          )
          
          // 阴影区边框
          ctx.strokeStyle = 'rgba(0, 100, 200, 0.8)'
          ctx.lineWidth = 1
          ctx.strokeRect(
            Math.max(minimapX, zoneMinimapX),
            Math.max(minimapY, zoneMinimapY),
            Math.min(zoneMinimapWidth, minimapX + minimapSize - Math.max(minimapX, zoneMinimapX)),
            Math.min(zoneMinimapHeight, minimapY + minimapSize - Math.max(minimapY, zoneMinimapY))
          )
        }
      })
      
      // 绘制未知区（在小地图上，在雨海区之前绘制）
      const unknownZone = this.unknownZone
      const unknownZoneMinimapX = minimapCenterX + (unknownZone.x * scale)
      const unknownZoneMinimapY = minimapCenterY + (unknownZone.y * scale)
      const unknownZoneMinimapWidth = unknownZone.width * scale
      const unknownZoneMinimapHeight = unknownZone.height * scale
      
      // 检查是否在小地图可见范围内
      if (unknownZoneMinimapX + unknownZoneMinimapWidth >= minimapX && unknownZoneMinimapX <= minimapX + minimapSize &&
          unknownZoneMinimapY + unknownZoneMinimapHeight >= minimapY && unknownZoneMinimapY <= minimapY + minimapSize) {
        // 绘制未知区（深紫色半透明，表示未知）
        ctx.fillStyle = 'rgba(75, 0, 130, 0.6)'
        ctx.fillRect(
          Math.max(minimapX, unknownZoneMinimapX),
          Math.max(minimapY, unknownZoneMinimapY),
          Math.min(unknownZoneMinimapWidth, minimapX + minimapSize - Math.max(minimapX, unknownZoneMinimapX)),
          Math.min(unknownZoneMinimapHeight, minimapY + minimapSize - Math.max(minimapY, unknownZoneMinimapY))
        )
        
        // 未知区边框（紫色，带虚线效果）
        ctx.strokeStyle = 'rgba(138, 43, 226, 0.8)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3]) // 虚线效果
        ctx.strokeRect(
          Math.max(minimapX, unknownZoneMinimapX),
          Math.max(minimapY, unknownZoneMinimapY),
          Math.min(unknownZoneMinimapWidth, minimapX + minimapSize - Math.max(minimapX, unknownZoneMinimapX)),
          Math.min(unknownZoneMinimapHeight, minimapY + minimapSize - Math.max(minimapY, unknownZoneMinimapY))
        )
        ctx.setLineDash([]) // 重置虚线
        
        // 未知区标签（如果区域足够大）
        if (unknownZoneMinimapHeight > 15) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.font = 'bold 8px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          const labelX = Math.max(minimapX, unknownZoneMinimapX) + Math.min(unknownZoneMinimapWidth, minimapX + minimapSize - Math.max(minimapX, unknownZoneMinimapX)) / 2
          const labelY = Math.max(minimapY, unknownZoneMinimapY) + Math.min(unknownZoneMinimapHeight, minimapY + minimapSize - Math.max(minimapY, unknownZoneMinimapY)) / 2
          ctx.fillText(unknownZone.name, labelX, labelY)
        }
      }
      
      // 绘制雨海区域（在小地图上）
      const zone = this.rainSeaZone
      const zoneMinimapX = minimapCenterX + (zone.x * scale)
      const zoneMinimapY = minimapCenterY + (zone.y * scale)
      const zoneMinimapWidth = zone.width * scale
      const zoneMinimapHeight = zone.height * scale
      
      // 检查是否在小地图可见范围内
      if (zoneMinimapX + zoneMinimapWidth >= minimapX && zoneMinimapX <= minimapX + minimapSize &&
          zoneMinimapY + zoneMinimapHeight >= minimapY && zoneMinimapY <= minimapY + minimapSize) {
        // 绘制雨海区域（深灰色半透明）
        ctx.fillStyle = 'rgba(50, 50, 50, 0.5)'
        ctx.fillRect(
          Math.max(minimapX, zoneMinimapX),
          Math.max(minimapY, zoneMinimapY),
          Math.min(zoneMinimapWidth, minimapX + minimapSize - Math.max(minimapX, zoneMinimapX)),
          Math.min(zoneMinimapHeight, minimapY + minimapSize - Math.max(minimapY, zoneMinimapY))
        )
        
        // 雨海区域边框
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)'
        ctx.lineWidth = 1
        ctx.strokeRect(
          Math.max(minimapX, zoneMinimapX),
          Math.max(minimapY, zoneMinimapY),
          Math.min(zoneMinimapWidth, minimapX + minimapSize - Math.max(minimapX, zoneMinimapX)),
          Math.min(zoneMinimapHeight, minimapY + minimapSize - Math.max(minimapY, zoneMinimapY))
        )
      }
      
      // 绘制风暴洋、澄海玄武岩地区（在小地图上）
      const stormZone = this.stormOceanZone
      const stormZoneMinimapX = minimapCenterX + (stormZone.x * scale)
      const stormZoneMinimapY = minimapCenterY + (stormZone.y * scale)
      const stormZoneMinimapWidth = stormZone.width * scale
      const stormZoneMinimapHeight = stormZone.height * scale
      
      // 检查是否在小地图可见范围内
      if (stormZoneMinimapX + stormZoneMinimapWidth >= minimapX && stormZoneMinimapX <= minimapX + minimapSize &&
          stormZoneMinimapY + stormZoneMinimapHeight >= minimapY && stormZoneMinimapY <= minimapY + minimapSize) {
        // 绘制风暴洋、澄海玄武岩地区（棕色/橙色半透明，表示玄武岩地区）
        ctx.fillStyle = 'rgba(139, 90, 43, 0.5)'
        ctx.fillRect(
          Math.max(minimapX, stormZoneMinimapX),
          Math.max(minimapY, stormZoneMinimapY),
          Math.min(stormZoneMinimapWidth, minimapX + minimapSize - Math.max(minimapX, stormZoneMinimapX)),
          Math.min(stormZoneMinimapHeight, minimapY + minimapSize - Math.max(minimapY, stormZoneMinimapY))
        )
        
        // 风暴洋、澄海玄武岩地区边框
        ctx.strokeStyle = 'rgba(180, 120, 60, 0.8)'
        ctx.lineWidth = 1
        ctx.strokeRect(
          Math.max(minimapX, stormZoneMinimapX),
          Math.max(minimapY, stormZoneMinimapY),
          Math.min(stormZoneMinimapWidth, minimapX + minimapSize - Math.max(minimapX, stormZoneMinimapX)),
          Math.min(stormZoneMinimapHeight, minimapY + minimapSize - Math.max(minimapY, stormZoneMinimapY))
        )
      }
      
      // 绘制基地位置（原点0,0）- 基地中心在原点
      const baseSize = 6
      ctx.fillStyle = '#00ff00' // 绿色表示基地
      ctx.beginPath()
      ctx.arc(minimapCenterX, minimapCenterY, baseSize, 0, Math.PI * 2)
      ctx.fill()
      // 基地外圈
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.stroke()
      
      // 绘制玩家位置
      const playerMinimapX = minimapCenterX + (this.player.x * scale)
      const playerMinimapY = minimapCenterY + (this.player.y * scale)
      
      // 检查玩家是否在小地图范围内
      if (playerMinimapX >= minimapX && playerMinimapX <= minimapX + minimapSize &&
          playerMinimapY >= minimapY && playerMinimapY <= minimapY + minimapSize) {
        // 玩家位置标记
        ctx.fillStyle = '#ff0000' // 红色表示玩家
        ctx.beginPath()
        ctx.arc(playerMinimapX, playerMinimapY, 4, 0, Math.PI * 2)
        ctx.fill()
        // 玩家外圈
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.5
        ctx.stroke()
        
        // 玩家方向指示（可选，显示玩家朝向）
        const playerAngle = Math.atan2(this.player.vy, this.player.vx) || 0
        ctx.strokeStyle = '#ff0000'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(playerMinimapX, playerMinimapY)
        ctx.lineTo(
          playerMinimapX + Math.cos(playerAngle) * 8,
          playerMinimapY + Math.sin(playerAngle) * 8
        )
        ctx.stroke()
      }
      
      // 绘制地图边界指示（四个角）
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1
      // 左上角
      ctx.fillRect(minimapX, minimapY, 3, 3)
      // 右上角
      ctx.fillRect(minimapX + minimapSize - 3, minimapY, 3, 3)
      // 左下角
      ctx.fillRect(minimapX, minimapY + minimapSize - 3, 3, 3)
      // 右下角
      ctx.fillRect(minimapX + minimapSize - 3, minimapY + minimapSize - 3, 3, 3)
      
      // 绘制小地图标题
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('地图', minimapCenterX, minimapY - 5)
      
      // 绘制图例（可选）
      const legendX = minimapX + 5
      const legendY = minimapY + minimapSize - 30
      ctx.font = '8px Arial'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(legendX, legendY, 6, 6)
      ctx.fillStyle = '#ffffff'
      ctx.fillText('基地', legendX + 10, legendY + 5)
      
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(legendX, legendY + 10, 6, 6)
      ctx.fillStyle = '#ffffff'
      ctx.fillText('玩家', legendX + 10, legendY + 15)
      
      // 阴影区图例
      ctx.fillStyle = 'rgba(0, 0, 100, 0.6)'
      ctx.fillRect(legendX, legendY + 20, 6, 6)
      ctx.fillStyle = '#ffffff'
      ctx.fillText('阴影区', legendX + 10, legendY + 25)
      
      // 雨海区域图例
      ctx.fillStyle = 'rgba(50, 50, 50, 0.5)'
      ctx.fillRect(legendX, legendY + 30, 6, 6)
      ctx.fillStyle = '#ffffff'
      ctx.fillText('雨海', legendX + 10, legendY + 35)
      
      // 风暴洋、澄海玄武岩地区图例
      ctx.fillStyle = 'rgba(139, 90, 43, 0.5)'
      ctx.fillRect(legendX, legendY + 40, 6, 6)
      ctx.fillStyle = '#ffffff'
      ctx.font = '7px Arial'
      ctx.fillText('风暴洋', legendX + 10, legendY + 45)
    },
    
    // 绘制逼真的陨石
    drawMeteor(ctx, meteor) {
      const centerX = meteor.x + meteor.w / 2
      const centerY = meteor.y + meteor.h / 2
      const radius = Math.min(meteor.w, meteor.h) / 2
      const isQuartz = meteor.isQuartz || false // 是否为石英岩
      const baseColor = meteor.baseColor || '#4a4a4a'
      const highlightColor = meteor.highlightColor || '#7a7a7a'
      const darkColor = meteor.darkColor || '#1a1a1a'
      const shapePoints = meteor.shapePoints || []
      
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(meteor.rotation || 0)
      
      // 绘制陨石主体（不规则形状）
      ctx.beginPath()
      if (shapePoints.length > 0) {
        // 使用不规则形状点
        for (let i = 0; i < shapePoints.length; i++) {
          const point = shapePoints[i]
          const x = Math.cos(point.angle) * radius * point.distance
          const y = Math.sin(point.angle) * radius * point.distance
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.closePath()
      } else {
        // 如果没有形状点，使用椭圆（更自然）
        ctx.ellipse(0, 0, radius * (0.85 + Math.random() * 0.15), radius * (0.9 + Math.random() * 0.1), 0, 0, Math.PI * 2)
      }
      
      // 主渐变（从亮到暗）
      const gradient = ctx.createRadialGradient(
        -radius * 0.2, -radius * 0.2, 0,
        0, 0, radius * 1.2
      )
      gradient.addColorStop(0, highlightColor)
      gradient.addColorStop(0.3, baseColor)
      gradient.addColorStop(0.7, baseColor)
      gradient.addColorStop(1, darkColor)
      ctx.fillStyle = gradient
      ctx.fill()
      
      // 高光区域（左上角）
      const highlightGradient = ctx.createRadialGradient(
        -radius * 0.3, -radius * 0.3, 0,
        -radius * 0.3, -radius * 0.3, radius * 0.5
      )
      highlightGradient.addColorStop(0, 'rgba(200, 200, 200, 0.4)')
      highlightGradient.addColorStop(1, 'rgba(200, 200, 200, 0)')
      ctx.fillStyle = highlightGradient
      ctx.fill()
      
      // 绘制坑洞（陨石表面特征）
      const craterData = meteor.craterData || []
      craterData.forEach(crater => {
        // 坑洞位置随陨石旋转（但相对位置固定）
        const craterAngle = crater.angle + (meteor.rotation || 0)
        const craterDist = radius * crater.dist
        const craterX = Math.cos(craterAngle) * craterDist
        const craterY = Math.sin(craterAngle) * craterDist
        const craterSize = radius * crater.size
        
        // 坑洞阴影
        ctx.fillStyle = darkColor + '80' // 半透明
        ctx.beginPath()
        ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2)
        ctx.fill()
        
        // 坑洞内部（更暗）
        ctx.fillStyle = darkColor + 'CC'
        ctx.beginPath()
        ctx.arc(craterX, craterY, craterSize * 0.6, 0, Math.PI * 2)
        ctx.fill()
        
        // 坑洞边缘高光（左上边缘）
        const highlightAngle = Math.atan2(craterY, craterX)
        const highlightX = craterX + Math.cos(highlightAngle - Math.PI / 4) * craterSize * 0.3
        const highlightY = craterY + Math.sin(highlightAngle - Math.PI / 4) * craterSize * 0.3
        ctx.fillStyle = highlightColor + '50'
        ctx.beginPath()
        ctx.arc(highlightX, highlightY, craterSize * 0.2, 0, Math.PI * 2)
        ctx.fill()
        
        // 坑洞边缘高光
        ctx.strokeStyle = highlightColor + '40'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2)
        ctx.stroke()
      })
      
      // 表面纹理细节（随机点）
      const surfaceDetail = meteor.surfaceDetail || 0.5
      if (surfaceDetail > 0.3) {
        ctx.fillStyle = darkColor + '60'
        for (let i = 0; i < 5 + Math.floor(surfaceDetail * 10); i++) {
          const detailAngle = Math.random() * Math.PI * 2
          const detailDist = radius * (0.2 + Math.random() * 0.6)
          const detailX = Math.cos(detailAngle) * detailDist
          const detailY = Math.sin(detailAngle) * detailDist
          const detailSize = 1 + Math.random() * 2
          
          // 检查是否在陨石范围内
          const distFromCenter = Math.sqrt(detailX * detailX + detailY * detailY)
          if (distFromCenter < radius * 0.9) {
            ctx.fillRect(detailX - detailSize / 2, detailY - detailSize / 2, detailSize, detailSize)
          }
        }
      }
      
      // 边缘阴影（增强立体感）
      ctx.strokeStyle = darkColor + 'CC'
      ctx.lineWidth = 2
      ctx.stroke()
      
      // 边缘高光（左上边缘）
      ctx.strokeStyle = highlightColor + '60'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      if (shapePoints.length > 0) {
        for (let i = 0; i < shapePoints.length; i++) {
          const point = shapePoints[i]
          const x = Math.cos(point.angle) * radius * point.distance
          const y = Math.sin(point.angle) * radius * point.distance
          // 只绘制左上部分的边缘
          if (x < radius * 0.3 && y < radius * 0.3) {
            if (i === 0 || i === 1) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
        }
      }
      ctx.stroke()
      
      // 环境光反射（右下角暗部）
      const shadowGradient = ctx.createRadialGradient(
        radius * 0.3, radius * 0.3, 0,
        radius * 0.3, radius * 0.3, radius * 0.6
      )
      shadowGradient.addColorStop(0, darkColor + '80')
      shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = shadowGradient
      ctx.fill()
      
      // 石英岩特殊效果：添加光泽和轻微的发光
      if (isQuartz) {
        // 石英岩光泽效果（左上角高光）
        const quartzGlow = ctx.createRadialGradient(
          -radius * 0.3, -radius * 0.3, 0,
          -radius * 0.3, -radius * 0.3, radius * 0.8
        )
        quartzGlow.addColorStop(0, 'rgba(255, 255, 255, 0.6)')
        quartzGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)')
        quartzGlow.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = quartzGlow
        ctx.fill()
        
        // 石英岩边缘轻微发光
        const time = performance.now()
        const glowIntensity = 0.3 + Math.sin(time * 0.003) * 0.1 // 轻微的呼吸效果
        ctx.strokeStyle = `rgba(255, 255, 255, ${glowIntensity})`
        ctx.lineWidth = 2
        ctx.stroke()
      }
      
      ctx.restore()
    },
    
    // 新增方法：绘制永久阴影区
    drawShadowZones(ctx) {
      // 计算可见区域的世界坐标范围
      const viewportLeft = -this.viewportOffset.x
      const viewportRight = -this.viewportOffset.x + this.canvasWidth
      const viewportTop = -this.viewportOffset.y
      const viewportBottom = -this.viewportOffset.y + this.canvasHeight
      
      this.shadowZones.forEach(zone => {
        const zoneRight = zone.x + zone.width
        const zoneBottom = zone.y + zone.height
        
        // 检查阴影区是否在可见范围内
        if (zoneRight >= viewportLeft && zone.x <= viewportRight &&
            zoneBottom >= viewportTop && zone.y <= viewportBottom) {
          
          // 计算实际绘制区域（与视口重叠的部分）
          const drawX = Math.max(zone.x, viewportLeft)
          const drawY = Math.max(zone.y, viewportTop)
          const drawWidth = Math.min(zoneRight, viewportRight) - drawX
          const drawHeight = Math.min(zoneBottom, viewportBottom) - drawY
          
          // 绘制阴影区覆盖层（深色半透明，表示永久阴影）
          ctx.fillStyle = 'rgba(0, 0, 50, 0.4)'
          ctx.fillRect(drawX, drawY, drawWidth, drawHeight)
          
          // 绘制阴影区边界（深蓝色边框）
          ctx.strokeStyle = 'rgba(0, 100, 200, 0.6)'
          ctx.lineWidth = 2
          ctx.setLineDash([10, 5])
          ctx.strokeRect(drawX, drawY, drawWidth, drawHeight)
          ctx.setLineDash([])
          
          // 绘制阴影区标签（在区域中心）
          const labelX = zone.x + zone.width / 2
          const labelY = zone.y + zone.height / 2
          
          // 检查标签是否在可见范围内
          if (labelX >= viewportLeft && labelX <= viewportRight &&
              labelY >= viewportTop && labelY <= viewportBottom) {
            // 标签背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
            ctx.fillRect(labelX - 50, labelY - 10, 100, 20)
            
            // 标签文字
            ctx.fillStyle = '#00bfff'
            ctx.font = 'bold 12px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(zone.name, labelX, labelY)
            
            // 重置文本对齐
            ctx.textAlign = 'left'
            ctx.textBaseline = 'alphabetic'
          }
        }
      })
    },
    
    // 一次性生成雨海区域的所有固定陨石（在游戏开始时调用）
    generateAllRainSeaMeteors() {
      const zone = this.rainSeaZone
      
      // 使用固定种子确保每次生成的陨石位置一致
      // 将雨海区域分成网格，每个网格生成固定数量的陨石
      const gridSize = 400 // 每个网格400px
      const startGridX = Math.floor(zone.x / gridSize)
      const endGridX = Math.floor((zone.x + zone.width) / gridSize)
      const startGridY = Math.floor(zone.y / gridSize)
      const endGridY = Math.floor((zone.y + zone.height) / gridSize)
      
      // 分批生成陨石，避免一次性生成太多导致卡顿
      const gridWidth = endGridX - startGridX + 1
      const gridHeight = endGridY - startGridY + 1
      const totalGrids = gridWidth * gridHeight
      let processedGrids = 0
      const batchSize = 50 // 每批处理50个网格
      
      const generateBatch = () => {
        const batchEnd = Math.min(processedGrids + batchSize, totalGrids)
        
        for (let idx = processedGrids; idx < batchEnd; idx++) {
          const gx = startGridX + (idx % gridWidth)
          const gy = startGridY + Math.floor(idx / gridWidth)
          
          // 确保网格索引在有效范围内（包括负数网格）
          if (gx >= startGridX && gx <= endGridX && gy >= startGridY && gy <= endGridY) {
            this.generateFixedMeteorGrid(gx, gy, gridSize, zone)
          }
        }
        
        processedGrids = batchEnd
        
        if (processedGrids < totalGrids) {
          // 使用 requestAnimationFrame 分批生成，避免阻塞UI
          requestAnimationFrame(generateBatch)
        }
      }
      
      // 开始分批生成
      generateBatch()
    },
    
    // 生成单个网格的固定陨石（使用固定种子）
    generateFixedMeteorGrid(gx, gy, gridSize, zone) {
      // 使用网格坐标作为种子，确保同一网格总是生成相同位置的陨石
      const seed = gx * 1000 + gy
      const rng = this.seededRandom(seed)
      
      // 在这个网格内生成陨石（每个网格1-2个陨石）
      const meteorCount = Math.floor(rng() * 2) + 1 // 1-2个
      const gridLeft = gx * gridSize
      const gridRight = (gx + 1) * gridSize
      const gridTop = gy * gridSize
      const gridBottom = (gy + 1) * gridSize
      
      // 确保网格与雨海区域有交集，如果没有交集则跳过
      if (gridRight <= zone.x || gridLeft >= zone.x + zone.width ||
          gridBottom <= zone.y || gridTop >= zone.y + zone.height) {
        return // 网格完全在雨海区域外，跳过
      }
      
      // 在当前网格内收集陨石位置（用于快速重叠检查）
      const currentGridMeteors = []
      
      for (let i = 0; i < meteorCount; i++) {
        // 使用固定随机数生成器，确保位置固定
        // 确保生成的陨石在网格和雨海区域的交集内
        const effectiveGridLeft = Math.max(gridLeft, zone.x)
        const effectiveGridRight = Math.min(gridRight, zone.x + zone.width)
        const effectiveGridTop = Math.max(gridTop, zone.y)
        const effectiveGridBottom = Math.min(gridBottom, zone.y + zone.height)
        
        const meteorX = effectiveGridLeft + rng() * (effectiveGridRight - effectiveGridLeft - 100)
        const meteorY = effectiveGridTop + rng() * (effectiveGridBottom - effectiveGridTop - 100)
        
        // 确保陨石在雨海区域内（双重检查）
        if (meteorX < zone.x || meteorX > zone.x + zone.width ||
            meteorY < zone.y || meteorY > zone.y + zone.height) continue
        
        // 固定陨石大小（从50-120）
        const meteorSize = Math.floor(rng() * 71) + 50 // 50-120
        const meteorW = meteorSize
        const meteorH = meteorSize
        
        // 只检查当前网格内已生成的陨石（优化性能，避免遍历整个数组）
        const minGap = 20 // 最小间距减小到20px，允许更紧密
        const overlaps = currentGridMeteors.some(m =>
          Math.abs(m.x - meteorX) < (m.w + meteorW) / 2 + minGap &&
          Math.abs(m.y - meteorY) < (m.h + meteorH) / 2 + minGap
        )
        
        // 允许少量重叠，增加视觉密度
        if (!overlaps || rng() < 0.3) { // 30%概率允许重叠
          // 生成石英岩（20%概率，便于测试，之后可以调回5%）
          const isQuartz = rng() < 0.20
          
          let baseColor, highlightColor, darkColor
          if (isQuartz) {
            // 石英岩（白色系）
            baseColor = '#e0e0e0'
            highlightColor = '#ffffff'
            darkColor = '#b0b0b0'
          } else {
            // 固定陨石类型（不同颜色和特性）
            const meteorType = rng()
            if (meteorType < 0.4) {
              // 普通岩石陨石（40%）
              baseColor = '#5a5a5a'
              highlightColor = '#8a8a8a'
              darkColor = '#2a2a2a'
            } else if (meteorType < 0.7) {
              // 铁质陨石（30%）
              baseColor = '#4a4a4a'
              highlightColor = '#7a7a7a'
              darkColor = '#1a1a1a'
            } else if (meteorType < 0.9) {
              // 深色陨石（20%）
              baseColor = '#3a3a3a'
              highlightColor = '#6a6a6a'
              darkColor = '#1a1a1a'
            } else {
              // 稀有亮色陨石（10%）
              baseColor = '#6a6a5a'
              highlightColor = '#9a9a8a'
              darkColor = '#3a3a2a'
            }
          }
          
          // 创建不规则形状的点（用于绘制不规则陨石）- 使用固定随机数
          const shapePoints = []
          const numPoints = 8 + Math.floor(rng() * 6) // 8-13个点
          for (let p = 0; p < numPoints; p++) {
            const angle = (p / numPoints) * Math.PI * 2
            const distanceVariation = 0.7 + rng() * 0.3 // 0.7-1.0
            shapePoints.push({
              angle: angle,
              distance: distanceVariation
            })
          }
          
          // 生成固定的坑洞位置（在创建时就确定，不再变化）- 使用固定随机数
          const numCraters = Math.floor(rng() * 3) + 1 // 1-3个坑洞
          const craterData = []
          for (let c = 0; c < numCraters; c++) {
            const craterAngle = rng() * Math.PI * 2
            const craterDist = 0.3 + rng() * 0.4 // 距离中心30%-70%
            const craterSize = 0.15 + rng() * 0.15 // 15%-30%半径
            craterData.push({
              angle: craterAngle,
              dist: craterDist,
              size: craterSize
            })
          }
          
          // 创建漂浮陨石（使用固定随机数生成动画参数）
          this.obstacles.push({
            type: 'meteor',
            x: meteorX,
            y: meteorY,
            w: meteorW,
            h: meteorH,
            vx: 0,
            color: baseColor,
            baseColor: baseColor,
            highlightColor: highlightColor,
            darkColor: darkColor,
            isQuartz: isQuartz, // 标记是否为石英岩
            isStatic: false,
            baseX: meteorX,
            baseY: meteorY,
            amp: 5 + rng() * 10, // 浮动幅度5-15px
            freq: 0.1 + rng() * 0.2, // 浮动频率
            phase: rng() * Math.PI * 2, // 随机相位
            prevX: meteorX,
            prevY: meteorY,
            rotation: rng() * Math.PI * 2, // 随机旋转角度
            rotationSpeed: (rng() - 0.5) * 0.02, // 旋转速度
            shapePoints: shapePoints, // 不规则形状点
            craterData: craterData, // 固定的坑洞数据
            surfaceDetail: rng() // 表面细节强度
          })
          
          // 将生成的陨石添加到当前网格列表（用于重叠检查）
          currentGridMeteors.push({
            x: meteorX,
            y: meteorY,
            w: meteorW,
            h: meteorH
          })
        }
      }
    },
    
    // 固定种子随机数生成器（确保每次生成相同的随机数序列）
    seededRandom(seed) {
      let value = seed
      return function() {
        value = (value * 9301 + 49297) % 233280
        return value / 233280
      }
    },
    
    // 生成雨海区域的漂浮陨石（已废弃，保留以防需要）
    generateRainSeaMeteors() {
      const zone = this.rainSeaZone
      
      // 直接检查玩家是否在雨海区域内
      const playerInRainSea = this.player.y >= zone.y && this.player.y <= zone.y + zone.height
      
      if (!playerInRainSea) {
        // 如果玩家不在雨海区域，检查视口是否接近雨海区域
        const viewportTop = -this.viewportOffset.y
        const viewportBottom = -this.viewportOffset.y + this.canvasHeight
        const nearRainSea = (viewportTop <= zone.y + zone.height + 1000 && viewportBottom >= zone.y - 1000)
        if (!nearRainSea) return
      }
      
      // 以玩家位置为中心生成陨石（如果玩家在雨海内），或者以视口为中心
      const centerX = playerInRainSea ? this.player.x : (-this.viewportOffset.x + this.canvasWidth * 0.5)
      const centerY = playerInRainSea ? this.player.y : (-this.viewportOffset.y + this.canvasHeight * 0.5)
      
      // 生成范围：玩家周围2000px范围
      const generateRange = 2000
      const visibleLeft = Math.max(zone.x, centerX - generateRange)
      const visibleRight = Math.min(zone.x + zone.width, centerX + generateRange)
      const visibleTop = Math.max(zone.y, centerY - generateRange)
      const visibleBottom = Math.min(zone.y + zone.height, centerY + generateRange)
      
      // 如果可见区域与雨海区域没有交集，不生成
      if (visibleLeft >= visibleRight || visibleTop >= visibleBottom) return
      
      // 将可见区域分成网格，每个网格检查是否已生成（适中的网格大小）
      const gridSize = 400 // 每个网格400px（适中的网格大小）
      const startGridX = Math.floor(visibleLeft / gridSize)
      const endGridX = Math.floor(visibleRight / gridSize)
      const startGridY = Math.floor(visibleTop / gridSize)
      const endGridY = Math.floor(visibleBottom / gridSize)
      
      // 如果玩家在雨海区域内，优先生成玩家周围的网格
      if (playerInRainSea) {
        // 强制生成玩家当前所在的网格及其周围8个网格
        const playerGridX = Math.floor(centerX / gridSize)
        const playerGridY = Math.floor(centerY / gridSize)
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const gx = playerGridX + dx
            const gy = playerGridY + dy
            const gridKey = `meteor_${gx}_${gy}`
            // 如果这个网格还没生成，立即生成
            if (!this.generatedMeteorRegions.includes(gridKey)) {
              this.generateMeteorGrid(gx, gy, gridSize, zone)
            }
          }
        }
      }
      
      // 生成其他可见区域的网格
      for (let gx = startGridX; gx <= endGridX; gx++) {
        for (let gy = startGridY; gy <= endGridY; gy++) {
          const gridKey = `meteor_${gx}_${gy}`
          
          // 如果这个网格已经生成过陨石，跳过
          if (this.generatedMeteorRegions.includes(gridKey)) continue
          
          // 生成这个网格的陨石
          this.generateMeteorGrid(gx, gy, gridSize, zone)
        }
      }
      
      // 清理太远的已生成标记（避免内存泄漏）
      if (this.generatedMeteorRegions.length > 100) {
        this.generatedMeteorRegions = this.generatedMeteorRegions.slice(-50)
      }
    },
    
    // 生成单个网格的陨石
    generateMeteorGrid(gx, gy, gridSize, zone) {
      const gridKey = `meteor_${gx}_${gy}`
      
      // 标记为已生成
      this.generatedMeteorRegions.push(gridKey)
      
      // 在这个网格内生成陨石（每个网格1-2个陨石，适中的数量）
      const meteorCount = this.pickInt(1, 2)
      const gridLeft = gx * gridSize
      const gridRight = (gx + 1) * gridSize
      const gridTop = gy * gridSize
      const gridBottom = (gy + 1) * gridSize
      
      for (let i = 0; i < meteorCount; i++) {
        // 减小间距，让陨石更紧密
        const meteorX = gridLeft + Math.random() * (gridRight - gridLeft - 100)
        const meteorY = gridTop + Math.random() * (gridBottom - gridTop - 100)
        
        // 确保陨石在雨海区域内
        if (meteorX < zone.x || meteorX > zone.x + zone.width ||
            meteorY < zone.y || meteorY > zone.y + zone.height) continue
        
        // 随机陨石大小（更大块：从50-120）
        const meteorSize = this.pickInt(50, 120)
        const meteorW = meteorSize
        const meteorH = meteorSize
        
        // 检查是否与现有障碍物重叠（允许部分重叠，增加密度）
        const minGap = 20 // 最小间距减小到20px，允许更紧密
        const overlaps = this.obstacles.some(ob =>
          Math.abs(ob.x - meteorX) < (ob.w + meteorW) / 2 + minGap &&
          Math.abs(ob.y - meteorY) < (ob.h + meteorH) / 2 + minGap &&
          ob.type === 'meteor' // 只检查陨石之间的重叠
        )
        
        // 允许少量重叠，增加视觉密度
        if (!overlaps || Math.random() < 0.3) { // 30%概率允许重叠
          // 随机陨石类型（不同颜色和特性）
          const meteorType = Math.random()
          let baseColor, highlightColor, darkColor
          if (meteorType < 0.4) {
            // 普通岩石陨石（40%）
            baseColor = '#5a5a5a'
            highlightColor = '#8a8a8a'
            darkColor = '#2a2a2a'
          } else if (meteorType < 0.7) {
            // 铁质陨石（30%）
            baseColor = '#4a4a4a'
            highlightColor = '#7a7a7a'
            darkColor = '#1a1a1a'
          } else if (meteorType < 0.9) {
            // 深色陨石（20%）
            baseColor = '#3a3a3a'
            highlightColor = '#6a6a6a'
            darkColor = '#1a1a1a'
          } else {
            // 稀有亮色陨石（10%）
            baseColor = '#6a6a5a'
            highlightColor = '#9a9a8a'
            darkColor = '#3a3a2a'
          }
          
          // 创建不规则形状的点（用于绘制不规则陨石）
          const shapePoints = []
          const numPoints = 8 + Math.floor(Math.random() * 6) // 8-13个点
          for (let p = 0; p < numPoints; p++) {
            const angle = (p / numPoints) * Math.PI * 2
            const distanceVariation = 0.7 + Math.random() * 0.3 // 0.7-1.0
            shapePoints.push({
              angle: angle,
              distance: distanceVariation
            })
          }
          
          // 生成固定的坑洞位置（在创建时就确定，不再变化）
          const numCraters = Math.floor(Math.random() * 3) + 1 // 1-3个坑洞
          const craterData = []
          for (let c = 0; c < numCraters; c++) {
            const craterAngle = Math.random() * Math.PI * 2
            const craterDist = 0.3 + Math.random() * 0.4 // 距离中心30%-70%
            const craterSize = 0.15 + Math.random() * 0.15 // 15%-30%半径
            craterData.push({
              angle: craterAngle,
              dist: craterDist,
              size: craterSize
            })
          }
          
          // 创建漂浮陨石
          this.obstacles.push({
            type: 'meteor',
            x: meteorX,
            y: meteorY,
            w: meteorW,
            h: meteorH,
            vx: 0,
            color: baseColor,
            baseColor: baseColor,
            highlightColor: highlightColor,
            darkColor: darkColor,
            isStatic: false,
            baseX: meteorX,
            baseY: meteorY,
            amp: 5 + Math.random() * 10, // 浮动幅度5-15px
            freq: 0.1 + Math.random() * 0.2, // 浮动频率
            phase: Math.random() * Math.PI * 2, // 随机相位
            prevX: meteorX,
            prevY: meteorY,
            rotation: Math.random() * Math.PI * 2, // 随机旋转角度
            rotationSpeed: (Math.random() - 0.5) * 0.02, // 旋转速度
            shapePoints: shapePoints, // 不规则形状点
            craterData: craterData, // 固定的坑洞数据
            surfaceDetail: Math.random() // 表面细节强度
          })
        }
      }
    },
    
    // 绘制雨海区域
    drawRainSeaZone(ctx) {
      const zone = this.rainSeaZone
      const viewportLeft = -this.viewportOffset.x
      const viewportRight = -this.viewportOffset.x + this.canvasWidth
      const viewportTop = -this.viewportOffset.y
      const viewportBottom = -this.viewportOffset.y + this.canvasHeight
      
      const zoneRight = zone.x + zone.width
      const zoneBottom = zone.y + zone.height
      
      // 检查雨海区域是否在可见范围内
      if (zoneRight >= viewportLeft && zone.x <= viewportRight &&
          zoneBottom >= viewportTop && zone.y <= viewportBottom) {
        
        // 计算实际绘制区域（与视口重叠的部分）
        const drawX = Math.max(zone.x, viewportLeft)
        const drawY = Math.max(zone.y, viewportTop)
        const drawWidth = Math.min(zoneRight, viewportRight) - drawX
        const drawHeight = Math.min(zoneBottom, viewportBottom) - drawY
        
        // 绘制雨海区域覆盖层（深灰色半透明，表示陨石密集区域）
        ctx.fillStyle = 'rgba(50, 50, 50, 0.3)'
        ctx.fillRect(drawX, drawY, drawWidth, drawHeight)
        
        // 绘制雨海区域边界（深灰色边框）
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.6)'
        ctx.lineWidth = 2
        ctx.setLineDash([10, 5])
        ctx.strokeRect(drawX, drawY, drawWidth, drawHeight)
        ctx.setLineDash([])
        
        // 绘制雨海区域标签（在区域中心）
        const labelX = zone.x + zone.width / 2
        const labelY = zone.y + zone.height / 2
        
        // 检查标签是否在可见范围内
        if (labelX >= viewportLeft && labelX <= viewportRight &&
            labelY >= viewportTop && labelY <= viewportBottom) {
          // 标签背景
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
          ctx.fillRect(labelX - 60, labelY - 10, 120, 20)
          
          // 标签文字
          ctx.fillStyle = '#cccccc'
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(zone.name, labelX, labelY)
          
          // 重置文本对齐
          ctx.textAlign = 'left'
          ctx.textBaseline = 'alphabetic'
        }
      }
    },
    
    // 新增方法：绘制未知区
    drawUnknownZone(ctx) {
      const zone = this.unknownZone
      const viewportLeft = -this.viewportOffset.x
      const viewportRight = -this.viewportOffset.x + this.canvasWidth
      const viewportTop = -this.viewportOffset.y
      const viewportBottom = -this.viewportOffset.y + this.canvasHeight
      
      const zoneRight = zone.x + zone.width
      const zoneBottom = zone.y + zone.height
      
      // 检查未知区是否在可见范围内
      if (zoneRight >= viewportLeft && zone.x <= viewportRight &&
          zoneBottom >= viewportTop && zone.y <= viewportBottom) {
        
        // 计算实际绘制区域（与视口重叠的部分）
        const drawX = Math.max(zone.x, viewportLeft)
        const drawY = Math.max(zone.y, viewportTop)
        const drawWidth = Math.min(zoneRight, viewportRight) - drawX
        const drawHeight = Math.min(zoneBottom, viewportBottom) - drawY
        
        // 绘制未知区覆盖层（深紫色半透明，表示未知区域）
        ctx.fillStyle = 'rgba(75, 0, 130, 0.25)'
        ctx.fillRect(drawX, drawY, drawWidth, drawHeight)
        
        // 绘制未知区边界（紫色虚线边框）
        ctx.strokeStyle = 'rgba(138, 43, 226, 0.7)'
        ctx.lineWidth = 2
        ctx.setLineDash([15, 10]) // 虚线效果
        ctx.strokeRect(drawX, drawY, drawWidth, drawHeight)
        ctx.setLineDash([])
        
        // 绘制未知区标签（在区域中心）
        const labelX = zone.x + zone.width / 2
        const labelY = zone.y + zone.height / 2
        
        // 检查标签是否在可见范围内
        if (labelX >= viewportLeft && labelX <= viewportRight &&
            labelY >= viewportTop && labelY <= viewportBottom) {
          // 标签背景
          ctx.fillStyle = 'rgba(75, 0, 130, 0.8)'
          ctx.fillRect(labelX - 60, labelY - 10, 120, 20)
          
          // 标签边框
          ctx.strokeStyle = 'rgba(138, 43, 226, 1)'
          ctx.lineWidth = 2
          ctx.strokeRect(labelX - 60, labelY - 10, 120, 20)
          
          // 标签文字
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 14px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(zone.name, labelX, labelY)
          
          // 重置文本对齐
          ctx.textAlign = 'left'
          ctx.textBaseline = 'alphabetic'
        }
      }
    },
    
    // 生成隐藏的钛铁矿（在风暴洋、澄海玄武岩地区，地面下）
    generateHiddenIlmeniteOres() {
      const zone = this.stormOceanZone
      
      // 检查玩家是否在区域内或接近区域
      const playerInZone = 
        this.player.x >= zone.x && 
        this.player.x <= zone.x + zone.width &&
        this.player.y >= zone.y && 
        this.player.y <= zone.y + zone.height
      
      // 检查视口是否接近区域
      const viewportLeft = -this.viewportOffset.x
      const viewportRight = -this.viewportOffset.x + this.canvasWidth
      const viewportTop = -this.viewportOffset.y
      const viewportBottom = -this.viewportOffset.y + this.canvasHeight
      
      const nearZone = 
        viewportRight >= zone.x - 1000 && 
        viewportLeft <= zone.x + zone.width + 1000 &&
        viewportBottom >= zone.y - 1000 && 
        viewportTop <= zone.y + zone.height + 1000
      
      if (!playerInZone && !nearZone) return
      
      // 以玩家位置或视口中心为中心生成钛铁矿
      const centerX = playerInZone ? this.player.x : (viewportLeft + viewportRight) / 2
      const centerY = playerInZone ? this.player.y : (viewportTop + viewportBottom) / 2
      
      // 生成范围：玩家周围2000px范围
      const generateRange = 2000
      const visibleLeft = Math.max(zone.x, centerX - generateRange)
      const visibleRight = Math.min(zone.x + zone.width, centerX + generateRange)
      const visibleTop = Math.max(zone.y, centerY - generateRange)
      const visibleBottom = Math.min(zone.y + zone.height, centerY + generateRange)
      
      // 网格大小：800px（与撞击坑一致）
      const gridSize = 800
      const startGridX = Math.floor(visibleLeft / gridSize)
      const endGridX = Math.floor(visibleRight / gridSize)
      const startGridY = Math.floor(visibleTop / gridSize)
      const endGridY = Math.floor(visibleBottom / gridSize)
      
      for (let gridX = startGridX; gridX <= endGridX; gridX++) {
        for (let gridY = startGridY; gridY <= endGridY; gridY++) {
          const gridKey = `ilmenite_${gridX}_${gridY}`
          
          // 检查该网格是否已生成钛铁矿
          if (this.generatedIlmeniteRegions.includes(gridKey)) continue
          
          // 每个网格有1%的概率生成一个隐藏的钛铁矿（适中的密度）
          if (Math.random() < 0.01) {
            const oreX = gridX * gridSize + Math.random() * (gridSize - 80) + 40
            // 钛铁矿在地面下（Y > 0，即地面下方）
            const oreY = this.groundY + this.pickInt(10, 50) // 地面下10-50px
            
            // 确保钛铁矿在区域内
            if (oreX >= zone.x && oreX <= zone.x + zone.width) {
              // 创建隐藏的钛铁矿
              const oreSize = this.pickInt(40, 60) // 钛铁矿大小
              const ore = {
                type: 'ilmenite',
                x: oreX - oreSize / 2,
                y: oreY - oreSize / 2,
                w: oreSize,
                h: oreSize,
                visible: false, // 默认不可见，需要扫描后显示
                mined: false // 是否已被挖取
              }
              
              this.hiddenIlmeniteOres.push(ore)
              this.generatedIlmeniteRegions.push(gridKey)
            }
          }
        }
      }
    },
    
    // 自动扫描钛铁矿（当装备地质探测器时持续扫描）
    autoScanForIlmenite() {
      // 检查当前装备是否为地质探测器（优先检查工具层）
      let currentSlot = null
      if (this.player.currentToolSlot) {
        currentSlot = this.player.equipmentSlots.find(s => s.id === this.player.currentToolSlot && s.layer === 'tool')
      }
      // 兼容旧代码
      if (!currentSlot) {
        currentSlot = this.player.equipmentSlots[this.player.currentSlot - 1]
      }
      
      if (!currentSlot || currentSlot.type !== 'tool' || currentSlot.name !== '地质探测器') {
        return // 没有装备地质探测器，不扫描
      }
      
      // 检查是否在风暴洋、澄海玄武岩地区
      const zone = this.stormOceanZone
      const playerInZone = 
        this.player.x >= zone.x && 
        this.player.x <= zone.x + zone.width &&
        this.player.y >= zone.y && 
        this.player.y <= zone.y + zone.height
      
      if (!playerInZone) {
        return // 不在区域内，不扫描
      }
      
      // 使用玩家位置作为扫描中心
      const playerCenterX = this.player.x + this.player.w / 2
      const playerCenterY = this.player.y + this.player.h / 2
      
      // 持续扫描（每次只扫描新发现的）
      this.scanForIlmenite(playerCenterX, playerCenterY, true) // true表示静默模式，不显示消息
    },
    
    // 地质探测器扫描（将隐藏的钛铁矿标记为可见）
    scanForIlmenite(worldX, worldY, silent = false) {
      const scanRange = 600 // 扫描范围600px
      let scannedCount = 0
      
      // 调试信息
      if (!silent) {
        console.log('🔍 开始扫描钛铁矿...', {
          扫描位置: { x: Math.floor(worldX), y: Math.floor(worldY) },
          扫描范围: scanRange,
          隐藏钛铁矿总数: this.hiddenIlmeniteOres.length,
          可见钛铁矿总数: this.visibleIlmeniteOres.length
        })
      }
      
      // 检查所有隐藏的钛铁矿
      for (let i = 0; i < this.hiddenIlmeniteOres.length; i++) {
        const ore = this.hiddenIlmeniteOres[i]
        
        // 如果已经可见或已挖取，跳过
        if (ore.visible || ore.mined) continue
        
        // 计算距离
        const oreCenterX = ore.x + ore.w / 2
        const oreCenterY = ore.y + ore.h / 2
        const distance = Math.sqrt(
          Math.pow(worldX - oreCenterX, 2) + 
          Math.pow(worldY - oreCenterY, 2)
        )
        
        // 如果在扫描范围内，标记为可见
        if (distance <= scanRange) {
          ore.visible = true
          // 将可见的钛铁矿添加到可见列表（如果还没有添加）
          if (!this.visibleIlmeniteOres.includes(ore)) {
            this.visibleIlmeniteOres.push(ore)
          }
          scannedCount++
          
          // 调试信息
          if (!silent) {
            console.log(`🔍 发现钛铁矿 #${scannedCount}`, {
              位置: { x: Math.floor(ore.x), y: Math.floor(ore.y) },
              距离: Math.floor(distance)
            })
          }
        }
      }
      
      // 如果不是静默模式，显示扫描结果
      if (!silent) {
        if (scannedCount > 0) {
          this.gameStatus = `扫描发现 ${scannedCount} 个钛铁矿！`
          setTimeout(() => {
            if (this.running) this.gameStatus = '进行中'
          }, 2000)
        } else {
          this.gameStatus = '扫描未发现钛铁矿'
          setTimeout(() => {
            if (this.running) this.gameStatus = '进行中'
          }, 1500)
        }
      }
    },
    
    // 查找附近的钛铁矿
    findNearbyIlmenite(worldX, worldY) {
      const scanRange = this.player.laserTool.miningRange
      let closestIlmenite = null
      let closestDistance = Infinity
      
      // 只检查可见的钛铁矿
      for (let i = 0; i < this.visibleIlmeniteOres.length; i++) {
        const ore = this.visibleIlmeniteOres[i]
        
        // 如果已挖取，跳过
        if (ore.mined) continue
        
        const oreCenterX = ore.x + ore.w / 2
        const oreCenterY = ore.y + ore.h / 2
        const distance = Math.sqrt(
          Math.pow(worldX - oreCenterX, 2) + 
          Math.pow(worldY - oreCenterY, 2)
        )
        
        if (distance <= scanRange && distance < closestDistance) {
          closestDistance = distance
          closestIlmenite = ore
        }
      }
      
      return closestIlmenite
    },
    
    // 一次性生成所有风暴洋区域的飞船碎片（在游戏开始时调用）
    generateAllStormOceanShipDebris() {
      const zone = this.stormOceanZone
      
      // 将风暴洋区域分成网格，每个网格生成固定数量的飞船碎片
      const gridSize = 400 // 每个网格400px
      // 扩大网格范围，确保覆盖整个风暴洋区域
      const startGridX = Math.floor(zone.x / gridSize) - 1
      const endGridX = Math.floor((zone.x + zone.width) / gridSize) + 1
      const startGridY = Math.floor(zone.y / gridSize) - 1
      const endGridY = Math.floor((zone.y + zone.height) / gridSize) + 1
      
      // 分批生成，避免一次性生成太多导致卡顿
      const gridWidth = endGridX - startGridX + 1
      const gridHeight = endGridY - startGridY + 1
      const totalGrids = gridWidth * gridHeight
      let processedGrids = 0
      const batchSize = 50 // 每批处理50个网格
      
      const generateBatch = () => {
        const batchEnd = Math.min(processedGrids + batchSize, totalGrids)
        
        for (let idx = processedGrids; idx < batchEnd; idx++) {
          const gx = startGridX + (idx % gridWidth)
          const gy = startGridY + Math.floor(idx / gridWidth)
          
          if (gx <= endGridX && gy <= endGridY) {
            this.generateShipDebrisGrid(gx, gy, gridSize, zone)
          }
        }
        
        processedGrids = batchEnd
        
        if (processedGrids < totalGrids) {
          // 使用 requestAnimationFrame 分批生成，避免阻塞UI
          requestAnimationFrame(generateBatch)
        }
      }
      
      // 开始分批生成
      generateBatch()
    },
    
    // 生成单个网格的飞船碎片（使用固定种子）
    generateShipDebrisGrid(gx, gy, gridSize, zone) {
      // 使用网格坐标作为种子，确保同一网格总是生成相同位置的碎片
      const seed = gx * 1000 + gy + 10000 // 添加偏移量避免与其他生成器冲突
      const rng = this.seededRandom(seed)
      
      // 每个网格都尝试生成飞船碎片（移除概率限制，增加数量）
      const gridLeft = gx * gridSize
      const gridRight = (gx + 1) * gridSize
      const gridTop = gy * gridSize
      const gridBottom = (gy + 1) * gridSize
      
      // 确保网格与风暴洋区域有交集（不需要完全包含）
      if (gridRight > zone.x && gridLeft < zone.x + zone.width &&
          gridBottom > zone.y && gridTop < zone.y + zone.height) {
        
        // 每个网格随机生成0-2个碎片（增加数量到1.5倍）
        // 10%概率生成1个，70%概率生成2个，20%概率不生成
        // 平均每个网格：0.1 * 1 + 0.7 * 2 = 1.5个（原来是1.1个）
        const rand = rng()
        let debrisCount = 0
        if (rand < 0.1) {
          debrisCount = 1
        } else if (rand < 0.8) {
          debrisCount = 2
        }
        
        for (let i = 0; i < debrisCount; i++) {
          // 使用不同的随机数种子，确保每个碎片位置不同
          const debrisRng = this.seededRandom(seed + i * 1000 + 5000)
          
          // 在整个风暴洋区域内随机分布Y位置（覆盖所有高度）
          // zone.y 是 -750，zone.y + zone.height 是 0，所以从 -750 到 0
          // 增加随机性，让分布更分散
          const debrisY = zone.y + debrisRng() * zone.height
          const debrisX = gridLeft + debrisRng() * (gridRight - gridLeft - 200)
          
          // 确保位置在区域内
          if (debrisX >= zone.x && debrisX <= zone.x + zone.width &&
              debrisY >= zone.y && debrisY <= zone.y + zone.height) {
            
            const platformX = debrisX
            const platformY = Math.max(zone.y + 30, Math.min(this.groundY - 30, debrisY))
            const platformW = Math.floor(debrisRng() * 41) + 60 // 60-100
            const platformH = Math.floor(debrisRng() * 6) + 15 // 15-20
            
            // 检查是否与现有障碍物重叠（增加最小间距，避免过于密集）
            const minGap = 60 // 增加最小间距到60px，让碎片分布更分散
            const overlaps = this.obstacles.some(ob =>
              ob.type === 'floating_platform' &&
              Math.abs(ob.x - platformX) < (ob.w + platformW) / 2 + minGap &&
              Math.abs(ob.y - platformY) < (ob.h + platformH) / 2 + minGap
            )
            
            if (!overlaps) {
              this.obstacles.push({
                type: 'floating_platform',
                x: platformX,
                y: platformY,
                w: platformW,
                h: platformH,
                vx: 0,
                color: '#5a5a5a', // 金属灰色（飞船碎片）
                isStatic: true,
                baseX: platformX,
                prevX: platformX,
                prevY: platformY
              })
            }
          }
        }
      }
    },
    
    // 生成雨海区域的飞行小怪物（完全随机分布）
    generateRainSeaFlyingMonsters() {
      const zone = this.rainSeaZone
      const targetMonsters = 20 // 目标生成20只飞行怪物
      const maxAttempts = 200 // 最多尝试200次，避免无限循环
      
      console.log(`🦋 开始生成雨海飞行怪物，雨海区域: x=${zone.x}, y=${zone.y}, width=${zone.width}, height=${zone.height}`)
      
      let generatedCount = 0
      let attempts = 0
      
      // 在整个雨海区域内完全随机生成飞行怪物
      while (generatedCount < targetMonsters && attempts < maxAttempts) {
        attempts++
        
        // 在整个雨海区域内完全随机选择位置（无任何偏好）
        // 确保X坐标在整个区域内均匀分布
        let monsterX = zone.x + 30 + Math.random() * (zone.width - 60)
        let monsterY = zone.y + 30 + Math.random() * (zone.height - 60)
        
        // 验证生成的位置是否在有效范围内
        if (monsterX < zone.x || monsterX >= zone.x + zone.width ||
            monsterY < zone.y || monsterY >= zone.y + zone.height) {
          continue
        }
        
        // 检查是否与障碍物或其他怪物重叠
        const minDistance = 60 // 最小间距60像素
        const overlaps = this.obstacles.some(ob =>
          Math.abs(ob.x + ob.w/2 - monsterX) < (ob.w + 60) / 2 + minDistance &&
          Math.abs(ob.y + ob.h/2 - monsterY) < (ob.h + 80) / 2 + minDistance
        ) || this.monsters.some(m =>
          m.type === 'rain_sea_flyer' &&
          Math.abs(m.x + m.w/2 - monsterX) < (m.w + 60) / 2 + minDistance &&
          Math.abs(m.y + m.h/2 - monsterY) < (m.h + 80) / 2 + minDistance
        )
        
        if (!overlaps) {
          this.generateMonster(monsterX, monsterY, 'rain_sea_flyer')
          generatedCount++
          if (generatedCount <= 5) {
            console.log(`  🦋 生成雨海飞行怪物 ${generatedCount}: 位置 (${Math.floor(monsterX)}, ${Math.floor(monsterY)})`)
          }
        }
      }
      
      const totalMonsters = this.monsters.filter(m => m.type === 'rain_sea_flyer').length
      console.log(`🦋 已在雨海区域生成 ${totalMonsters} 只飞行怪物 (尝试 ${attempts} 次)`)
    },
    
    // 生成风暴洋区域的飞行怪物
    generateStormOceanFlyingMonsters() {
      const zone = this.stormOceanZone
      const targetMonsters = 15 // 目标生成15只飞行怪物
      const maxAttempts = 200 // 最多尝试200次，避免无限循环
      
      console.log(`🦋 开始生成风暴洋飞行怪物，风暴洋区域: x=${zone.x}, y=${zone.y}, width=${zone.width}, height=${zone.height}`)
      
      let generatedCount = 0
      let attempts = 0
      
      // 在整个风暴洋区域内完全随机生成飞行怪物
      while (generatedCount < targetMonsters && attempts < maxAttempts) {
        attempts++
        
        // 在整个风暴洋区域内完全随机选择位置（无任何偏好）
        // 确保X坐标在整个区域内均匀分布
        let monsterX = zone.x + 30 + Math.random() * (zone.width - 60)
        let monsterY = zone.y + 30 + Math.random() * (zone.height - 60)
        
        // 验证生成的位置是否在有效范围内
        if (monsterX < zone.x || monsterX >= zone.x + zone.width ||
            monsterY < zone.y || monsterY >= zone.y + zone.height) {
          continue
        }
        
        // 检查是否与障碍物或其他怪物重叠
        const minDistance = 60 // 最小间距60像素
        const overlaps = this.obstacles.some(ob =>
          Math.abs(ob.x + ob.w/2 - monsterX) < (ob.w + 60) / 2 + minDistance &&
          Math.abs(ob.y + ob.h/2 - monsterY) < (ob.h + 80) / 2 + minDistance
        ) || this.monsters.some(m =>
          (m.type === 'rain_sea_flyer' || m.type === 'storm_ocean_flyer') &&
          Math.abs(m.x + m.w/2 - monsterX) < (m.w + 60) / 2 + minDistance &&
          Math.abs(m.y + m.h/2 - monsterY) < (m.h + 80) / 2 + minDistance
        )
        
        if (!overlaps) {
          this.generateMonster(monsterX, monsterY, 'rain_sea_flyer') // 使用相同的类型
          generatedCount++
          if (generatedCount <= 5) {
            console.log(`  🦋 生成风暴洋飞行怪物 ${generatedCount}: 位置 (${Math.floor(monsterX)}, ${Math.floor(monsterY)})`)
          }
        }
      }
      
      const totalMonsters = this.monsters.filter(m => m.type === 'rain_sea_flyer').length
      console.log(`🦋 已在风暴洋区域生成 ${generatedCount} 只飞行怪物，总计 ${totalMonsters} 只 (尝试 ${attempts} 次)`)
    },
    
    // 生成风暴洋区域的洞刺兽
    generateStormOceanCaveSpikes() {
      const zone = this.stormOceanZone
      const gridSize = 600 // 网格大小
      const startGridX = Math.floor(zone.x / gridSize) - 1
      const endGridX = Math.floor((zone.x + zone.width) / gridSize) + 1
      
      // 在风暴洋区域的地面生成洞刺兽（Y = groundY附近）
      for (let gx = startGridX; gx <= endGridX; gx++) {
        // 使用固定种子确保每次游戏生成位置一致
        const seed = gx * 1000 + 20000 // 偏移量避免与其他生成器冲突
        const rng = this.seededRandom(seed)
        
        // 每个网格有15%概率生成一只洞刺兽
        if (rng() < 0.15) {
          const gridLeft = gx * gridSize
          const gridRight = (gx + 1) * gridSize
          
          // 确保在风暴洋区域内
          if (gridRight > zone.x && gridLeft < zone.x + zone.width) {
            // 在地面生成（Y = groundY - 高度的一半）
            const caveSpikeX = gridLeft + rng() * (gridRight - gridLeft - 150)
            const caveSpikeY = this.groundY - 25 // 地面位置，减去高度的一半（更新为50/2=25）
            
            // 检查是否与现有障碍物重叠（更新尺寸）
            const overlaps = this.obstacles.some(ob =>
              Math.abs(ob.x - caveSpikeX) < (ob.w + 70) / 2 + 50 &&
              Math.abs(ob.y - caveSpikeY) < (ob.h + 50) / 2 + 50
            ) || this.monsters.some(m =>
              Math.abs(m.x - caveSpikeX) < (m.w + 70) / 2 + 50 &&
              Math.abs(m.y - caveSpikeY) < (m.h + 50) / 2 + 50
            )
            
            if (!overlaps && caveSpikeX >= zone.x && caveSpikeX <= zone.x + zone.width) {
              this.generateMonster(caveSpikeX, caveSpikeY, 'cave_spike')
            }
          }
        }
      }
    },
    
    // 生成风暴洋地形（悬浮平台、台阶等）- 已禁用飞船碎片动态生成
    generateStormOceanTerrain() {
      const zone = this.stormOceanZone
      
      // 检查玩家是否在区域内或接近区域
      const playerInZone = 
        this.player.x >= zone.x && 
        this.player.x <= zone.x + zone.width &&
        this.player.y >= zone.y && 
        this.player.y <= zone.y + zone.height
      
      // 检查视口是否接近区域
      const viewportLeft = -this.viewportOffset.x
      const viewportRight = -this.viewportOffset.x + this.canvasWidth
      const viewportTop = -this.viewportOffset.y
      const viewportBottom = -this.viewportOffset.y + this.canvasHeight
      
      const nearZone = 
        viewportRight >= zone.x - 1000 && 
        viewportLeft <= zone.x + zone.width + 1000 &&
        viewportBottom >= zone.y - 1000 && 
        viewportTop <= zone.y + zone.height + 1000
      
      if (!playerInZone && !nearZone) return
      
      // 以玩家位置或视口中心为中心生成地形
      const centerX = playerInZone ? this.player.x : (viewportLeft + viewportRight) / 2
      const centerY = playerInZone ? this.player.y : (viewportTop + viewportBottom) / 2
      
      // 生成范围：玩家周围2000px范围
      const generateRange = 2000
      const visibleLeft = Math.max(zone.x, centerX - generateRange)
      const visibleRight = Math.min(zone.x + zone.width, centerX + generateRange)
      const visibleTop = Math.max(zone.y, centerY - generateRange)
      const visibleBottom = Math.min(zone.y + zone.height, centerY + generateRange)
      
      if (visibleLeft >= visibleRight || visibleTop >= visibleBottom) return
      
      // 将可见区域分成更小的网格，确保在不同高度都有平台
      const gridSize = 400 // 减小网格到400px，增加密度
      const startGridX = Math.floor(visibleLeft / gridSize)
      const endGridX = Math.floor(visibleRight / gridSize)
      const startGridY = Math.floor(visibleTop / gridSize)
      const endGridY = Math.floor(visibleBottom / gridSize)
      
      // 遍历每个网格，生成地形
      for (let gridX = startGridX; gridX <= endGridX; gridX++) {
        for (let gridY = startGridY; gridY <= endGridY; gridY++) {
          const gridKey = `storm_terrain_${gridX}_${gridY}`
          
          // 检查该网格是否已生成地形
          if (this.generatedStormOceanTerrainRegions.includes(gridKey)) continue
          
          // 标记为已生成
          this.generatedStormOceanTerrainRegions.push(gridKey)
          
          // 确保地形在区域内
          const gridLeft = gridX * gridSize
          const gridRight = (gridX + 1) * gridSize
          const gridTop = gridY * gridSize
          const gridBottom = (gridY + 1) * gridSize
          
          // 每个网格有约5%概率生成地形（增加飞船碎片数量）
          if (Math.random() < 0.05) {
            // 确保在风暴洋区域内
            if (gridTop >= zone.y && gridBottom <= zone.y + zone.height) {
              // 在不同高度均匀分布
              // 将风暴洋区域分成多个高度层
              const zoneHeight = zone.height // 750px
              const layerCount = 4 // 分成4层
              const layerHeight = zoneHeight / layerCount // 每层约187px
              
              // 根据gridY计算应该在哪一层
              const relativeY = gridTop - zone.y
              const layerIndex = Math.floor(relativeY / layerHeight)
              const targetLayerY = zone.y + layerIndex * layerHeight + layerHeight / 2
              
              // 在目标层内随机Y位置
              const terrainY = targetLayerY + (Math.random() - 0.5) * (layerHeight * 0.6)
              const terrainX = gridLeft + Math.random() * (gridRight - gridLeft - 150)
              
              // 随机选择地形类型（增加悬浮平台概率）
              const terrainType = Math.random()
              
              if (terrainType < 0.0) {
                // 悬浮平台（已禁用，改为在游戏开始时一次性生成）
                // this.generateFloatingPlatforms(terrainX, terrainY)
              } else if (terrainType < 0.55) {
                // 玄武岩台阶（40%概率，增加）
                this.generateBasaltSteps(
                  terrainX,
                  terrainY
                )
              } else if (terrainType < 0.8) {
                // 可移动平台（25%概率）
                this.generateMovingPlatforms(
                  terrainX,
                  terrainY
                )
              } else {
                // 小型平台组合（20%概率，增加）
                this.generatePlatformCombo(
                  terrainX,
                  terrainY
                )
              }
            }
          }
        }
      }
      
      // 额外生成一些独立的小平台，确保不同高度都有（减少到七分之一）
      // 在风暴洋区域内，按高度分层生成额外的平台
      const extraPlatformsPerLayer = 1 // 每层额外生成1个平台（减少）
      const layerCount = 5 // 分成5层
      const layerHeight = zone.height / layerCount
      
      for (let layer = 0; layer < layerCount; layer++) {
        const layerY = zone.y + layer * layerHeight + layerHeight / 2
        
        for (let i = 0; i < extraPlatformsPerLayer; i++) {
          // 检查是否在可见范围内
          if (layerY >= visibleTop && layerY <= visibleBottom) {
            const platformX = visibleLeft + Math.random() * (visibleRight - visibleLeft - 100)
            
            // 约1%概率生成额外的小平台（减少到原来的一半：2% / 2 = 1%）
            // 已禁用，改为在游戏开始时一次性生成
            if (false && Math.random() < 0.01) {
              const platformW = this.pickInt(50, 80)
              const platformH = this.pickInt(15, 20)
              const platformY = layerY - platformH / 2
              
              // 检查是否与现有障碍物重叠
              const overlaps = this.obstacles.some(ob =>
                Math.abs(ob.x - platformX) < (ob.w + platformW) / 2 + 40 &&
                Math.abs(ob.y - platformY) < (ob.h + platformH) / 2 + 40
              )
              
              if (!overlaps) {
                this.obstacles.push({
                  type: 'floating_platform',
                  x: platformX,
                  y: platformY,
                  w: platformW,
                  h: platformH,
                  vx: 0,
                  color: '#5a5a5a', // 金属灰色（飞船碎片）
                  isStatic: true,
                  baseX: platformX,
                  prevX: platformX,
                  prevY: platformY
                })
              }
            }
          }
        }
      }
      
      // 生成陷阱（在风暴洋区域）
      this.generateStormOceanTraps(zone, visibleLeft, visibleRight, visibleTop, visibleBottom)
    },
    
    // 生成悬浮平台
    generateFloatingPlatforms(baseX, baseY) {
      // 只生成1个平台，但减少不生成的概率
      // 30%概率不生成（增加生成概率）
      if (Math.random() < 0.3) return
      
      const platformX = baseX
      // 确保平台在风暴洋区域内，使用传入的baseY
      const platformY = Math.max(this.stormOceanZone.y + 30, Math.min(this.groundY - 30, baseY))
      const platformW = this.pickInt(60, 100)
      const platformH = this.pickInt(15, 20)
      
      // 检查是否与现有障碍物重叠
      const overlaps = this.obstacles.some(ob =>
        Math.abs(ob.x - platformX) < (ob.w + platformW) / 2 + 30 &&
        Math.abs(ob.y - platformY) < (ob.h + platformH) / 2 + 30
      )
      
      if (!overlaps) {
        this.obstacles.push({
          type: 'floating_platform',
          x: platformX,
          y: platformY,
          w: platformW,
          h: platformH,
          vx: 0,
          color: '#5a5a5a', // 金属灰色（飞船碎片）
          isStatic: true,
          baseX: platformX,
          prevX: platformX,
          prevY: platformY
        })
      }
    },
    
    // 生成玄武岩台阶
    generateBasaltSteps(baseX, baseY) {
      const stepCount = this.pickInt(1, 2) // 1-2级台阶（减少到七分之一）
      const stepW = this.pickInt(40, 60)
      const stepH = this.pickInt(20, 30)
      const stepSpacing = this.pickInt(15, 25)
      
      for (let i = 0; i < stepCount; i++) {
        const stepX = baseX + i * (stepW + stepSpacing)
        // 确保台阶在风暴洋区域内
        const stepY = Math.max(this.stormOceanZone.y + 30, Math.min(this.groundY - 30, baseY - i * stepH))
        
        // 检查是否与现有障碍物重叠
        const overlaps = this.obstacles.some(ob =>
          Math.abs(ob.x - stepX) < (ob.w + stepW) / 2 + 20 &&
          Math.abs(ob.y - stepY) < (ob.h + stepH) / 2 + 20
        )
        
        if (!overlaps) {
          this.obstacles.push({
            type: 'basalt_step',
            x: stepX,
            y: stepY,
            w: stepW,
            h: stepH,
            vx: 0,
            color: '#2d3436',
            isStatic: true,
            baseX: stepX,
            prevX: stepX,
            prevY: stepY
          })
        }
      }
    },
    
    // 生成可移动平台
    generateMovingPlatforms(baseX, baseY) {
      const platformX = baseX
      // 确保平台在风暴洋区域内，使用传入的baseY
      const platformY = Math.max(this.stormOceanZone.y + 30, Math.min(this.groundY - 30, baseY))
      const platformW = this.pickInt(80, 120)
      const platformH = this.pickInt(15, 20)
      
      // 检查是否与现有障碍物重叠
      const overlaps = this.obstacles.some(ob =>
        Math.abs(ob.x - platformX) < (ob.w + platformW) / 2 + 30 &&
        Math.abs(ob.y - platformY) < (ob.h + platformH) / 2 + 30
      )
      
      if (!overlaps) {
        this.obstacles.push({
          type: 'moving_platform',
          x: platformX,
          y: platformY,
          w: platformW,
          h: platformH,
          vx: 0,
          color: '#a29bfe',
          isStatic: false,
          baseX: platformX,
          baseY: platformY,
          prevX: platformX,
          prevY: platformY,
          amp: this.pickInt(40, 80), // 移动幅度
          freq: 0.1 + Math.random() * 0.1, // 移动频率
          phase: Math.random() * Math.PI * 2,
          moveDirection: Math.random() < 0.5 ? 'horizontal' : 'vertical' // 水平或垂直移动
        })
      }
    },
    
    // 生成平台组合
    generatePlatformCombo(baseX, baseY) {
      const platformCount = this.pickInt(1, 2) // 1-2个平台（减少到七分之一）
      const spacing = this.pickInt(90, 160) // 间距
      
      // 确保在风暴洋区域内，使用传入的baseY
      let lastY = Math.max(this.stormOceanZone.y + 30, Math.min(this.groundY - 50, baseY))
      
      for (let i = 0; i < platformCount; i++) {
        const platformX = baseX + i * spacing
        // 让平台高度有变化
        const yVariation = (Math.random() - 0.5) * 60
        const platformY = Math.max(this.stormOceanZone.y + 50, Math.min(this.groundY - 50, lastY + yVariation))
        lastY = platformY
        
        const platformW = this.pickInt(60, 90)
        const platformH = this.pickInt(15, 20)
        
        // 检查是否与现有障碍物重叠
        const overlaps = this.obstacles.some(ob =>
          Math.abs(ob.x - platformX) < (ob.w + platformW) / 2 + 30 &&
          Math.abs(ob.y - platformY) < (ob.h + platformH) / 2 + 30
        )
        
        if (!overlaps) {
          this.obstacles.push({
            type: 'platform_combo',
            x: platformX,
            y: platformY,
            w: platformW,
            h: platformH,
            vx: 0,
            color: '#5a5a5a', // 金属灰色（飞船碎片）
            isStatic: true,
            baseX: platformX,
            prevX: platformX,
            prevY: platformY
          })
        }
      }
    },
    
    // 生成风暴洋陷阱
    generateStormOceanTraps(zone, visibleLeft, visibleRight, visibleTop, visibleBottom) {
      // 将可见区域分成网格，生成陷阱
      const gridSize = 500 // 陷阱网格大小
      const startGridX = Math.floor(visibleLeft / gridSize)
      const endGridX = Math.floor(visibleRight / gridSize)
      const startGridY = Math.floor(visibleTop / gridSize)
      const endGridY = Math.floor(visibleBottom / gridSize)
      
      // 遍历每个网格，生成陷阱
      for (let gridX = startGridX; gridX <= endGridX; gridX++) {
        for (let gridY = startGridY; gridY <= endGridY; gridY++) {
          const gridKey = `storm_trap_${gridX}_${gridY}`
          
          // 检查该网格是否已生成陷阱（使用不同的标记避免与地形冲突）
          if (this.generatedStormOceanTerrainRegions.includes(gridKey)) continue
          
          // 标记为已生成
          this.generatedStormOceanTerrainRegions.push(gridKey)
          
          // 每个网格有25%概率生成陷阱
          if (Math.random() < 0.25) {
            const gridLeft = gridX * gridSize
            const gridRight = (gridX + 1) * gridSize
            const gridTop = gridY * gridSize
            const gridBottom = (gridY + 1) * gridSize
            
            // 确保在风暴洋区域内
            if (gridTop >= zone.y && gridBottom <= zone.y + zone.height) {
              const trapX = gridLeft + Math.random() * (gridRight - gridLeft - 100)
              const trapY = gridTop + Math.random() * (gridBottom - gridTop - 100)
              
              // 随机选择陷阱类型
              const trapType = Math.random()
              
              if (trapType < 0.35) {
                // 尖刺陷阱（35%概率）
                this.generateSpikeTrap(trapX, trapY)
              } else if (trapType < 0.65) {
                // 移动伤害陷阱（30%概率）
                this.generateMovingDamageTrap(trapX, trapY)
              } else if (trapType < 0.85) {
                // 落石陷阱（20%概率）
                this.generateFallingRockTrap(trapX, trapY)
              } else {
                // 电击陷阱（15%概率）
                this.generateElectricTrap(trapX, trapY)
              }
            }
          }
        }
      }
    },
    
    // 生成尖刺陷阱
    generateSpikeTrap(x, y) {
      const spikeW = this.pickInt(40, 80)
      const spikeH = this.pickInt(20, 35)
      const spikeY = Math.max(this.stormOceanZone.y + 20, Math.min(this.groundY - 20, y))
      
      // 检查是否与现有障碍物或陷阱重叠
      const overlaps = this.obstacles.some(ob =>
        Math.abs(ob.x - x) < (ob.w + spikeW) / 2 + 30 &&
        Math.abs(ob.y - spikeY) < (ob.h + spikeH) / 2 + 30
      ) || this.traps.some(tp =>
        Math.abs(tp.x - x) < (tp.w + spikeW) / 2 + 30 &&
        Math.abs(tp.y - spikeY) < (tp.h + spikeH) / 2 + 30
      )
      
      if (!overlaps) {
        this.traps.push({
          type: 'spike_storm',
          x: x,
          y: spikeY,
          w: spikeW,
          h: spikeH,
          damage: 1,
          color: '#c0392b'
        })
      }
    },
    
    // 生成移动伤害陷阱
    generateMovingDamageTrap(x, y) {
      const trapW = this.pickInt(30, 50)
      const trapH = this.pickInt(30, 50)
      const trapY = Math.max(this.stormOceanZone.y + 30, Math.min(this.groundY - 30, y))
      
      // 检查是否与现有障碍物或陷阱重叠
      const overlaps = this.obstacles.some(ob =>
        Math.abs(ob.x - x) < (ob.w + trapW) / 2 + 30 &&
        Math.abs(ob.y - trapY) < (ob.h + trapH) / 2 + 30
      ) || this.traps.some(tp =>
        Math.abs(tp.x - x) < (tp.w + trapW) / 2 + 30 &&
        Math.abs(tp.y - trapY) < (tp.h + trapH) / 2 + 30
      )
      
      if (!overlaps) {
        this.traps.push({
          type: 'moving_damage',
          x: x,
          y: trapY,
          w: trapW,
          h: trapH,
          damage: 1,
          baseX: x,
          baseY: trapY,
          amp: this.pickInt(60, 120), // 移动幅度
          freq: 0.1 + Math.random() * 0.1, // 移动频率
          phase: Math.random() * Math.PI * 2,
          moveDirection: Math.random() < 0.5 ? 'horizontal' : 'vertical',
          color: '#e74c3c'
        })
      }
    },
    
    // 生成落石陷阱
    generateFallingRockTrap(x, y) {
      const rockW = this.pickInt(25, 40)
      const rockH = this.pickInt(25, 40)
      // 落石从上方生成
      const rockY = this.stormOceanZone.y + 20
      
      // 检查是否与现有障碍物或陷阱重叠
      const overlaps = this.obstacles.some(ob =>
        Math.abs(ob.x - x) < (ob.w + rockW) / 2 + 30 &&
        Math.abs(ob.y - rockY) < (ob.h + rockH) / 2 + 30
      ) || this.traps.some(tp =>
        Math.abs(tp.x - x) < (tp.w + rockW) / 2 + 30 &&
        Math.abs(tp.y - rockY) < (tp.h + rockH) / 2 + 30
      )
      
      if (!overlaps) {
        this.traps.push({
          type: 'falling_rock',
          x: x,
          y: rockY,
          w: rockW,
          h: rockH,
          damage: 1,
          vy: 200 + Math.random() * 100, // 下落速度
          fallDistance: this.pickInt(200, 400), // 下落距离
          baseY: rockY,
          color: '#7f8c8d',
          active: false,
          activateTimer: Math.random() * 2000 // 延迟激活
        })
      }
    },
    
    // 生成电击陷阱
    generateElectricTrap(x, y) {
      const trapW = this.pickInt(35, 50)
      const trapH = this.pickInt(35, 50)
      const trapY = Math.max(this.stormOceanZone.y + 30, Math.min(this.groundY - 30, y))
      
      // 检查是否与现有障碍物或陷阱重叠
      const overlaps = this.obstacles.some(ob =>
        Math.abs(ob.x - x) < (ob.w + trapW) / 2 + 30 &&
        Math.abs(ob.y - trapY) < (ob.h + trapH) / 2 + 30
      ) || this.traps.some(tp =>
        Math.abs(tp.x - x) < (tp.w + trapW) / 2 + 30 &&
        Math.abs(tp.y - trapY) < (tp.h + trapH) / 2 + 30
      )
      
      if (!overlaps) {
        this.traps.push({
          type: 'electric',
          x: x,
          y: trapY,
          w: trapW,
          h: trapH,
          damage: 1,
          color: '#f39c12',
          chargeTime: 0, // 充能时间
          active: false,
          pulsePhase: Math.random() * Math.PI * 2
        })
      }
    },
    
    // 生成陨石撞击坑（在风暴洋、澄海玄武岩地区）
    generateImpactCraters() {
      const zone = this.stormOceanZone
      
      // 检查玩家是否在区域内或接近区域
      const playerInZone = 
        this.player.x >= zone.x && 
        this.player.x <= zone.x + zone.width &&
        this.player.y >= zone.y && 
        this.player.y <= zone.y + zone.height
      
      // 检查视口是否接近区域
      const viewportLeft = -this.viewportOffset.x
      const viewportRight = -this.viewportOffset.x + this.canvasWidth
      const viewportTop = -this.viewportOffset.y
      const viewportBottom = -this.viewportOffset.y + this.canvasHeight
      
      const nearZone = 
        viewportRight >= zone.x - 1000 && 
        viewportLeft <= zone.x + zone.width + 1000 &&
        viewportBottom >= zone.y - 1000 && 
        viewportTop <= zone.y + zone.height + 1000
      
      if (!playerInZone && !nearZone) return
      
      // 以玩家位置或视口中心为中心生成撞击坑
      const centerX = playerInZone ? this.player.x : (viewportLeft + viewportRight) / 2
      const centerY = playerInZone ? this.player.y : (viewportTop + viewportBottom) / 2
      
      // 生成范围：玩家周围2000px范围
      const generateRange = 2000
      const visibleLeft = Math.max(zone.x, centerX - generateRange)
      const visibleRight = Math.min(zone.x + zone.width, centerX + generateRange)
      const visibleTop = Math.max(zone.y, centerY - generateRange)
      const visibleBottom = Math.min(zone.y + zone.height, centerY + generateRange)
      
      if (visibleLeft >= visibleRight || visibleTop >= visibleBottom) return
      
      // 将可见区域分成网格，每个网格检查是否已生成
      const gridSize = 1200 // 每个网格1200px（进一步增大网格，因为撞击坑是非常稀有的事件）
      const startGridX = Math.floor(visibleLeft / gridSize)
      const endGridX = Math.floor(visibleRight / gridSize)
      const startGridY = Math.floor(visibleTop / gridSize)
      const endGridY = Math.floor(visibleBottom / gridSize)
      
      // 遍历每个网格，偶尔生成撞击坑
      for (let gridX = startGridX; gridX <= endGridX; gridX++) {
        for (let gridY = startGridY; gridY <= endGridY; gridY++) {
          const gridKey = `${gridX}_${gridY}`
          
          // 检查该网格是否已生成撞击坑
          if (this.generatedCraterRegions.includes(gridKey)) continue
          
          // 每个网格有0.05%的概率生成一个撞击坑（极小概率事件，非常稀有）
          if (Math.random() < 0.0005) {
            const craterX = gridX * gridSize + Math.random() * (gridSize - 100) + 50
            const craterY = gridY * gridSize + Math.random() * (gridSize - 100) + 50
            
            // 确保撞击坑在区域内
            if (craterX >= zone.x && craterX <= zone.x + zone.width &&
                craterY >= zone.y && craterY <= zone.y + zone.height) {
              
              // 创建撞击坑（在地面上）
              const craterSize = this.pickInt(60, 100) // 撞击坑大小
              // 使用固定种子生成纹理偏移（基于位置）
              const textureSeed = Math.sin(craterX * 0.1) * Math.cos(craterY * 0.1)
              const crater = {
                type: 'impact_crater',
                x: craterX - craterSize / 2,
                y: this.groundY - craterSize / 2, // 撞击坑在地面上
                w: craterSize,
                h: craterSize,
                radius: craterSize / 2,
                collected: false, // 是否已收集
                hasShipPart: Math.random() < 0.20, // 20%概率有飞船零件
                textureSeed: textureSeed // 固定的纹理种子，用于生成一致的内部纹理
              }
              
              this.impactCraters.push(crater)
              this.generatedCraterRegions.push(gridKey)
            }
          }
        }
      }
    },
    
    // 绘制陨石撞击坑（真实效果）
    drawImpactCraters(ctx) {
      const viewportLeft = -this.viewportOffset.x
      const viewportRight = -this.viewportOffset.x + this.canvasWidth
      const viewportTop = -this.viewportOffset.y
      const viewportBottom = -this.viewportOffset.y + this.canvasHeight
      
      this.impactCraters.forEach(crater => {
        // 检查撞击坑是否在可见范围内
        if (crater.collected) return
        
        const craterRight = crater.x + crater.w
        const craterBottom = crater.y + crater.h
        
        if (craterRight >= viewportLeft && crater.x <= viewportRight &&
            craterBottom >= viewportTop && crater.y <= viewportBottom) {
          
          const centerX = crater.x + crater.w / 2
          const centerY = crater.y + crater.h / 2
          const radius = crater.radius
          
          ctx.save()
          
          // 1. 绘制撞击坑外圈阴影（增强深度感）
          const gradient1 = ctx.createRadialGradient(
            centerX, centerY, radius * 0.3,
            centerX, centerY, radius * 1.2
          )
          gradient1.addColorStop(0, 'rgba(0, 0, 0, 0)')
          gradient1.addColorStop(0.3, 'rgba(0, 0, 0, 0.2)')
          gradient1.addColorStop(0.7, 'rgba(20, 20, 20, 0.4)')
          gradient1.addColorStop(1, 'rgba(0, 0, 0, 0.6)')
          ctx.fillStyle = gradient1
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2)
          ctx.fill()
          
          // 2. 绘制撞击坑边缘（略微隆起的地面）
          const rimGradient = ctx.createRadialGradient(
            centerX, centerY, radius * 0.85,
            centerX, centerY, radius * 1.1
          )
          rimGradient.addColorStop(0, 'rgba(100, 90, 80, 0.3)')
          rimGradient.addColorStop(0.5, 'rgba(80, 70, 60, 0.5)')
          rimGradient.addColorStop(1, 'rgba(60, 50, 40, 0.2)')
          ctx.fillStyle = rimGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius * 1.1, 0, Math.PI * 2)
          ctx.fill()
          
          // 3. 绘制撞击坑主体（深色凹陷）
          const craterGradient = ctx.createRadialGradient(
            centerX, centerY + radius * 0.2, radius * 0.2,
            centerX, centerY, radius
          )
          craterGradient.addColorStop(0, 'rgba(10, 10, 10, 0.8)')
          craterGradient.addColorStop(0.4, 'rgba(30, 25, 20, 0.6)')
          craterGradient.addColorStop(0.7, 'rgba(40, 35, 30, 0.4)')
          craterGradient.addColorStop(1, 'rgba(20, 20, 20, 0.2)')
          ctx.fillStyle = craterGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
          ctx.fill()
          
          // 4. 绘制撞击坑内部纹理（不规则阴影，模拟撞击痕迹）
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
          // 绘制一些不规则的内部阴影（使用固定的纹理种子）
          const textureSeed = crater.textureSeed || 0
          for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i + Math.PI / 6 + textureSeed
            const offsetX = Math.cos(angle) * radius * 0.4
            const offsetY = Math.sin(angle) * radius * 0.4
            // 使用基于种子和索引的固定值
            const shadowRadius = radius * (0.2 + (Math.abs(textureSeed + i) % 0.3) * 0.2)
            ctx.beginPath()
            ctx.arc(centerX + offsetX, centerY + offsetY, shadowRadius, 0, Math.PI * 2)
            ctx.fill()
          }
          
          // 5. 绘制撞击坑中心（最深的部分）
          const centerGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius * 0.3
          )
          centerGradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)')
          centerGradient.addColorStop(0.5, 'rgba(15, 15, 15, 0.7)')
          centerGradient.addColorStop(1, 'rgba(25, 25, 25, 0.4)')
          ctx.fillStyle = centerGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2)
          ctx.fill()
          
          // 6. 绘制撞击坑边缘细节（模拟抛射物痕迹）
          ctx.strokeStyle = 'rgba(80, 70, 60, 0.4)'
          ctx.lineWidth = 1
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i
            const startX = centerX + Math.cos(angle) * radius * 0.7
            const startY = centerY + Math.sin(angle) * radius * 0.7
            const endX = centerX + Math.cos(angle) * radius * 0.95
            const endY = centerY + Math.sin(angle) * radius * 0.95
            ctx.beginPath()
            ctx.moveTo(startX, startY)
            ctx.lineTo(endX, endY)
            ctx.stroke()
          }
          
          // 7. 如果撞击坑有飞船零件，显示提示图标（发光效果）
          if (crater.hasShipPart) {
            // 添加发光效果
            const glowGradient = ctx.createRadialGradient(
              centerX, centerY - radius * 0.3, 0,
              centerX, centerY - radius * 0.3, 30
            )
            glowGradient.addColorStop(0, 'rgba(255, 255, 0, 0.6)')
            glowGradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.3)')
            glowGradient.addColorStop(1, 'rgba(255, 255, 0, 0)')
            ctx.fillStyle = glowGradient
            ctx.beginPath()
            ctx.arc(centerX, centerY - radius * 0.3, 30, 0, Math.PI * 2)
            ctx.fill()
            
            // 绘制图标
            ctx.fillStyle = '#ffff00'
            ctx.font = 'bold 20px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('🚀', centerX, centerY - radius * 0.3)
          }
          
          // 8. 绘制撞击坑外圈边框（轻微高光，增强立体感）
          ctx.strokeStyle = 'rgba(120, 110, 100, 0.5)'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
          ctx.stroke()
          
          // 9. 添加顶部高光（模拟光线照射）
          const highlightGradient = ctx.createRadialGradient(
            centerX - radius * 0.3, centerY - radius * 0.3, 0,
            centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.6
          )
          highlightGradient.addColorStop(0, 'rgba(150, 140, 130, 0.2)')
          highlightGradient.addColorStop(1, 'rgba(150, 140, 130, 0)')
          ctx.fillStyle = highlightGradient
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius * 0.9, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.restore()
        }
      })
    },
    
    // 检查撞击坑交互
    checkImpactCraterInteraction(worldX, worldY) {
      for (let i = this.impactCraters.length - 1; i >= 0; i--) {
        const crater = this.impactCraters[i]
        if (crater.collected) continue
        
        // 检查点击位置是否在撞击坑内
        const centerX = crater.x + crater.w / 2
        const centerY = crater.y + crater.h / 2
        const distance = Math.sqrt(
          Math.pow(worldX - centerX, 2) + 
          Math.pow(worldY - centerY, 2)
        )
        
        if (distance <= crater.radius) {
          // 收集撞击坑
          this.collectImpactCrater(crater, i)
          return true
        }
      }
      return false
    },
    
    // 收集撞击坑
    collectImpactCrater(crater, index) {
      crater.collected = true
      
      // 如果撞击坑有飞船零件，生成掉落物
      if (crater.hasShipPart) {
        const centerX = crater.x + crater.w / 2
        const centerY = crater.y + crater.h / 2
        
        // 生成飞船零件掉落物
        const drop = {
          name: '飞船零件',
          type: 'spaceship_part',
          value: 200,
          icon: '🚀',
          x: centerX - 15,
          y: centerY - 15,
          w: 30,
          h: 30,
          timestamp: Date.now(),
          collected: false,
          fixedOnGround: false
        }
        
        this.player.drops.push(drop)
        
        console.log('获得飞船零件！', {
          位置: { x: centerX, y: centerY }
        })
        
        // 显示收集成功消息
        this.gameStatus = '发现飞船零件！'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 2000)
      } else {
        // 没有飞船零件，只显示普通消息
        this.gameStatus = '撞击坑已探索'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 1500)
      }
      
      // 延迟移除撞击坑
      setTimeout(() => {
        const craterIndex = this.impactCraters.findIndex(c => c === crater)
        if (craterIndex !== -1) {
          this.impactCraters.splice(craterIndex, 1)
        }
      }, 1000)
    },
    
    // 绘制风暴洋、澄海玄武岩地区
    drawStormOceanZone(ctx) {
      const zone = this.stormOceanZone
      const viewportLeft = -this.viewportOffset.x
      const viewportRight = -this.viewportOffset.x + this.canvasWidth
      const viewportTop = -this.viewportOffset.y
      const viewportBottom = -this.viewportOffset.y + this.canvasHeight
      
      const zoneRight = zone.x + zone.width
      const zoneBottom = zone.y + zone.height
      
      // 检查风暴洋、澄海玄武岩地区是否在可见范围内
      if (zoneRight >= viewportLeft && zone.x <= viewportRight &&
          zoneBottom >= viewportTop && zone.y <= viewportBottom) {
        
        // 计算实际绘制区域（与视口重叠的部分）
        const drawX = Math.max(zone.x, viewportLeft)
        const drawY = Math.max(zone.y, viewportTop)
        const drawWidth = Math.min(zoneRight, viewportRight) - drawX
        const drawHeight = Math.min(zoneBottom, viewportBottom) - drawY
        
        // 绘制风暴洋、澄海玄武岩地区覆盖层（棕色/橙色半透明，表示玄武岩地区）
        ctx.fillStyle = 'rgba(139, 90, 43, 0.3)'
        ctx.fillRect(drawX, drawY, drawWidth, drawHeight)
        
        // 绘制风暴洋、澄海玄武岩地区边界（棕色/橙色边框）
        ctx.strokeStyle = 'rgba(180, 120, 60, 0.6)'
        ctx.lineWidth = 2
        ctx.setLineDash([10, 5])
        ctx.strokeRect(drawX, drawY, drawWidth, drawHeight)
        ctx.setLineDash([])
        
        // 绘制风暴洋、澄海玄武岩地区标签（在区域中心）
        const labelX = zone.x + zone.width / 2
        const labelY = zone.y + zone.height / 2
        
        // 检查标签是否在可见范围内
        if (labelX >= viewportLeft && labelX <= viewportRight &&
            labelY >= viewportTop && labelY <= viewportBottom) {
          // 标签背景
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
          ctx.fillRect(labelX - 100, labelY - 10, 200, 20)
          
          // 标签文字
          ctx.fillStyle = '#d4a574'
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(zone.name, labelX, labelY)
          
          // 重置文本对齐
          ctx.textAlign = 'left'
          ctx.textBaseline = 'alphabetic'
        }
      }
    },
    
    // 新增方法：绘制装备格子
    drawEquipmentSlots(ctx) {
      const slotSize = 40
      const slotSpacing = 10
      const layerSpacing = 15 // 上下两层之间的间距
      const startX = this.canvasWidth - (slotSize * 8 + slotSpacing * 7) - 20
      
      // 分离武器工具和采集工具
      const weaponSlots = this.player.equipmentSlots.filter(slot => slot.layer === 'weapon') // 上层：武器工具
      const toolSlots = this.player.equipmentSlots.filter(slot => slot.layer === 'tool') // 下层：采集工具
      
      // 计算下层起始Y位置
      const lowerStartY = this.canvasHeight - slotSize - 20
      // 计算上层起始Y位置（在下层上方）
      const upperStartY = lowerStartY - slotSize - layerSpacing
      
      // ========== 绘制上层：武器工具（1-8号格子）==========
      const upperPanelHeight = slotSize + 20
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(startX - 10, upperStartY - 10, slotSize * 8 + slotSpacing * 7 + 20, upperPanelHeight)
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)' // 红色边框表示武器工具
      ctx.lineWidth = 2
      ctx.strokeRect(startX - 10, upperStartY - 10, slotSize * 8 + slotSpacing * 7 + 20, upperPanelHeight)
      
      // 绘制上层标题
      ctx.fillStyle = '#ff6464'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('武器工具（鼠标滚轮切换）', startX, upperStartY - 15)
      
      weaponSlots.forEach((slot, index) => {
        const x = startX + index * (slotSize + slotSpacing)
        const y = upperStartY
        
        // 格子背景
        if (slot.active) {
          // 激活的格子：红色边框
          ctx.fillStyle = 'rgba(255, 100, 100, 0.3)'
          ctx.fillRect(x, y, slotSize, slotSize)
          ctx.strokeStyle = '#ff6464'
          ctx.lineWidth = 3
          ctx.strokeRect(x, y, slotSize, slotSize)
        } else {
          // 未激活的格子：灰色边框
          ctx.fillStyle = 'rgba(128, 128, 128, 0.2)'
          ctx.fillRect(x, y, slotSize, slotSize)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
          ctx.lineWidth = 1
          ctx.strokeRect(x, y, slotSize, slotSize)
        }
        
        // 格子图标
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 20px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(slot.icon, x + slotSize / 2, y + slotSize / 2)
        
        // 格子编号（1-8）
        ctx.fillStyle = slot.active ? '#ff6464' : '#cccccc'
        ctx.font = 'bold 12px Arial'
        ctx.fillText((index + 1).toString(), x + slotSize - 8, y + 12)
        
        // 格子名称
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px Arial'
        ctx.fillText(slot.name, x + slotSize / 2, y + slotSize + 12)
      })
      
      // ========== 绘制下层：采集工具（9-16号格子）==========
      const lowerPanelHeight = slotSize + 20
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(startX - 10, lowerStartY - 10, slotSize * 8 + slotSpacing * 7 + 20, lowerPanelHeight)
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)' // 蓝色边框表示采集工具
      ctx.lineWidth = 2
      ctx.strokeRect(startX - 10, lowerStartY - 10, slotSize * 8 + slotSpacing * 7 + 20, lowerPanelHeight)
      
      // 绘制下层标题
      ctx.fillStyle = '#64c8ff'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('采集工具（数字键1-8切换）', startX, lowerStartY - 15)
      
      toolSlots.forEach((slot, index) => {
        const x = startX + index * (slotSize + slotSpacing)
        const y = lowerStartY
        
        // 格子背景
        if (slot.active) {
          // 激活的格子：蓝色边框
          ctx.fillStyle = 'rgba(100, 200, 255, 0.3)'
          ctx.fillRect(x, y, slotSize, slotSize)
          ctx.strokeStyle = '#64c8ff'
          ctx.lineWidth = 3
          ctx.strokeRect(x, y, slotSize, slotSize)
        } else {
          // 未激活的格子：灰色边框
          ctx.fillStyle = 'rgba(128, 128, 128, 0.2)'
          ctx.fillRect(x, y, slotSize, slotSize)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
          ctx.lineWidth = 1
          ctx.strokeRect(x, y, slotSize, slotSize)
        }
        
        // 格子图标
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 20px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(slot.icon, x + slotSize / 2, y + slotSize / 2)
        
        // 格子编号（显示数字键1-8）
        ctx.fillStyle = slot.active ? '#64c8ff' : '#cccccc'
        ctx.font = 'bold 12px Arial'
        ctx.fillText((index + 1).toString(), x + slotSize - 8, y + 12)
        
        // 格子名称
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px Arial'
        ctx.fillText(slot.name, x + slotSize / 2, y + slotSize + 12)
      })
    },
    
    // 新增方法：绘制能源格子（资源存储格子）
    drawEnergySlots(ctx) {
      const slotSize = 35 // 能源格子稍小一些
      const slotSpacing = 5
      const startX = this.canvasWidth - (slotSize * 8 + slotSpacing * 7) - 20
      const startY = this.canvasHeight - slotSize - 140 // 在装备格子下方（因为现在有两层工具格）
      
      // 绘制能源格子背景面板
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(startX - 10, startY - 10, slotSize * 8 + slotSpacing * 7 + 20, slotSize + 20)
      ctx.strokeStyle = 'rgba(0, 150, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.strokeRect(startX - 10, startY - 10, slotSize * 8 + slotSpacing * 7 + 20, slotSize + 20)
      
      // 绘制8个能源格子
      this.player.energySlots.forEach((slot, index) => {
        const x = startX + index * (slotSize + slotSpacing)
        const y = startY
        
        // 格子背景
        if (slot.active) {
          // 激活的格子：蓝色边框
          ctx.fillStyle = 'rgba(0, 150, 255, 0.3)'
          ctx.fillRect(x, y, slotSize, slotSize)
          ctx.strokeStyle = '#0096ff'
          ctx.lineWidth = 3
          ctx.strokeRect(x, y, slotSize, slotSize)
        } else {
          // 未激活的格子：灰色边框
          ctx.fillStyle = 'rgba(128, 128, 128, 0.2)'
          ctx.fillRect(x, y, slotSize, slotSize)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
          ctx.lineWidth = 1
          ctx.strokeRect(x, y, slotSize, slotSize)
        }
        
        // 格子图标（显示资源图标或默认图标）
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        if (slot.resource) {
          // 有资源：显示资源图标
          ctx.fillText(slot.resource.icon, x + slotSize / 2, y + slotSize / 2 - 5)
          
          // 显示资源数量
          ctx.fillStyle = slot.active ? '#0096ff' : '#cccccc'
          ctx.font = 'bold 10px Arial'
          ctx.fillText(slot.count.toString(), x + slotSize - 6, y + 10)
          
          // 显示资源名称
          ctx.fillStyle = '#ffffff'
          ctx.font = '8px Arial'
          ctx.fillText(slot.resource.name, x + slotSize / 2, y + slotSize + 8)
        } else {
          // 无资源：显示默认图标
          ctx.fillText(slot.icon, x + slotSize / 2, y + slotSize / 2 - 5)
          
          // 格子编号（1-8）
          ctx.fillStyle = slot.active ? '#0096ff' : '#cccccc'
          ctx.font = 'bold 10px Arial'
          ctx.fillText((index + 1).toString(), x + slotSize - 6, y + 10)
          
          // 格子状态
          ctx.fillStyle = '#ffffff'
          ctx.font = '8px Arial'
          ctx.fillText('空', x + slotSize / 2, y + slotSize + 8)
        }
      })
      
      // 绘制能源格子标题
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('资源存储系统', startX, startY - 15)
    },
    
    // 新增方法：绘制能源格子（资源存储格子）
    drawEnergySlots(ctx) {
      const slotSize = 35 // 能源格子稍小一些
      const slotSpacing = 5
      const startX = this.canvasWidth - (slotSize * 8 + slotSpacing * 7) - 20
      const startY = this.canvasHeight - slotSize - 140 // 在装备格子下方（因为现在有两层工具格）
      
      // 绘制能源格子背景面板
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(startX - 10, startY - 10, slotSize * 8 + slotSpacing * 7 + 20, slotSize + 20)
      ctx.strokeStyle = 'rgba(0, 150, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.strokeRect(startX - 10, startY - 10, slotSize * 8 + slotSpacing * 7 + 20, slotSize + 20)
      
      // 绘制8个能源格子
      this.player.energySlots.forEach((slot, index) => {
        const x = startX + index * (slotSize + slotSpacing)
        const y = startY
        
        // 格子背景
        if (slot.active) {
          // 激活的格子：蓝色边框
          ctx.fillStyle = 'rgba(0, 150, 255, 0.3)'
          ctx.fillRect(x, y, slotSize, slotSize)
          ctx.strokeStyle = '#0096ff'
          ctx.lineWidth = 3
          ctx.strokeRect(x, y, slotSize, slotSize)
        } else {
          // 未激活的格子：灰色边框
          ctx.fillStyle = 'rgba(128, 128, 128, 0.2)'
          ctx.fillRect(x, y, slotSize, slotSize)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
          ctx.lineWidth = 1
          ctx.strokeRect(x, y, slotSize, slotSize)
        }
        
        // 格子图标（显示资源图标或默认图标）
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        if (slot.resource) {
          // 有资源：显示资源图标
          ctx.fillText(slot.resource.icon, x + slotSize / 2, y + slotSize / 2 - 5)
          
          // 显示资源数量
          ctx.fillStyle = slot.active ? '#0096ff' : '#cccccc'
          ctx.font = 'bold 10px Arial'
          ctx.fillText(slot.count.toString(), x + slotSize - 6, y + 10)
          
          // 显示资源名称
          ctx.fillStyle = '#ffffff'
          ctx.font = '8px Arial'
          ctx.fillText(slot.resource.name, x + slotSize / 2, y + slotSize + 8)
        } else {
          // 无资源：显示默认图标
          ctx.fillText(slot.icon, x + slotSize / 2, y + slotSize / 2 - 5)
          
          // 格子编号（1-8）
          ctx.fillStyle = slot.active ? '#0096ff' : '#cccccc'
          ctx.font = 'bold 10px Arial'
          ctx.fillText((index + 1).toString(), x + slotSize - 6, y + 10)
          
          // 格子状态
          ctx.fillStyle = '#ffffff'
          ctx.font = '8px Arial'
          ctx.fillText('空', x + slotSize / 2, y + slotSize + 8)
        }
      })
      
      // 绘制能源格子标题
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('资源存储系统', startX, startY - 15)
    },
    
    roundRect(ctx, x, y, w, h, r, fillColor) {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
      ctx.fillStyle = fillColor
      ctx.fill()
    },
    
    cleanup() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
      }
      // 清除连射定时器
      if (this.rapidFireInterval) {
        clearInterval(this.rapidFireInterval)
        this.rapidFireInterval = null
      }
      window.removeEventListener('resize', this.resizeCanvas)
      window.removeEventListener('keydown', this.handleKeyDown)
      window.removeEventListener('keyup', this.handleKeyUp)
      if (this.$refs.canvas) {
        this.$refs.canvas.removeEventListener('click', this.handleMouseShoot)
        this.$refs.canvas.removeEventListener('mousemove', this.handleMouseMove)
        this.$refs.canvas.removeEventListener('mouseenter', this.handleMouseEnter)
        this.$refs.canvas.removeEventListener('mouseleave', this.handleMouseLeave)
        this.$refs.canvas.removeEventListener('wheel', this.handleMouseWheel)
      }
    },
    
    // 新增方法：射击功能
    handleShoot(e) {
      if (!this.running || !this.player.currentWeapon) return
      
      const weapon = this.player.currentWeapon
      const ammoType = weapon.type
      
      // 检查子弹数量
      if (!this.player.ammo[ammoType] || this.player.ammo[ammoType] <= 0) {
        this.gameStatus = '没有子弹！'
        setTimeout(() => {
          if (this.running) this.gameStatus = '进行中'
        }, 1000)
        return
      }
      
      // 消耗子弹
      this.player.ammo[ammoType]--
      
      // 创建子弹
      const bulletX = this.player.facingRight ? this.player.x + this.player.w : this.player.x
      const bulletY = this.player.y + this.player.h / 2
      
      this.bullets.push({
        x: bulletX,
        y: bulletY,
        w: 8,
        h: 4,
        vx: this.player.facingRight ? 800 : -800,
        vy: 0, // 添加垂直速度属性，初始为0
        damage: weapon.damage,
        color: '#ffd700'
      })
    },
    
    // 新增方法：生成怪物
    generateMonster(x, y, type = 'normal') {
      const monsterTypes = {
        normal: { hp: 30, damage: 1, speed: 40, color: '#ff6b6b', value: 50, canFly: false, canShoot: true, name: '怪兽1号' },
        cave_spike: { 
          hp: 60, // 增加生命值
          damage: 5, // 增加伤害
          speed: 200, // 大幅增加移动速度（奔跑速度）
          color: '#9b59b6', 
          value: 100, // 增加价值
          canFly: false, 
          canShoot: true, 
          name: '洞刺兽',
          w: 70, // 增加体型宽度
          h: 50  // 增加体型高度
        },
        lunar_ghost: {
          hp: 30, // 生命值30
          damage: 12, // 镰刀攻击伤害
          speed: 360, // 移动速度特别快
          color: '#9370db', // 紫色
          value: 180, // 价值
          canFly: true, // 可以飞行
          canShoot: true, // 可以释放法术
          name: '月球幽灵',
          w: 60, // 体型宽度
          h: 80  // 体型高度
        },
        rain_sea_flyer: {
          hp: 25, // 生命值25
          damage: 3, // 子弹伤害
          speed: 150, // 飞行速度
          color: '#4a90e2', // 蓝色
          value: 80, // 价值
          canFly: true, // 可以飞行
          canShoot: true, // 可以发射子弹
          name: '雨海飞虫',
          w: 30, // 体型宽度（小怪物）
          h: 30  // 体型高度
        }
      }
      
      const monster = monsterTypes[type] || monsterTypes.normal
      
      // 洞刺兽特殊属性
      const monsterData = {
        x,
        y,
        w: monster.w || 20,
        h: monster.h || 20,
        hp: monster.hp,
        maxHp: monster.hp,
        damage: monster.damage,
        speed: monster.speed,
        color: monster.color,
        value: monster.value,
        type,
        name: monster.name,
        vx: 0,
        canFly: monster.canFly,
        canShoot: monster.canShoot,
        shootCooldown: 0,
        vy: 0,
        baseY: y,
        baseX: x,
        wanderRange: 50 + Math.random() * 50,
        moveDirection: Math.random() > 0.5 ? 1 : -1,
        moveTimer: 0,
        moveDuration: 1 + Math.random() * 2
      }
      
        // 洞刺兽特殊属性
        if (type === 'cave_spike') {
          monsterData.crystalShootCooldown = 0 // 晶体喷射冷却
          monsterData.chargeCooldown = 0 // 冲锋冷却
          monsterData.isCharging = false // 是否正在冲锋
          monsterData.chargeDirection = 0 // 冲锋方向
          monsterData.chargeSpeed = 600 // 大幅增加冲锋速度（15米/秒 = 600像素/秒）
          monsterData.groundY = this.groundY // 记录地面位置（但不限制移动）
          monsterData.crystalGlow = 0 // 晶体发光动画
          monsterData.wanderRange = 200 + Math.random() * 150 // 大幅增加移动范围（200-350像素）
          monsterData.isRunning = false // 是否正在奔跑
          monsterData.runSpeed = 300 // 奔跑速度
          monsterData.chasePlayer = false // 是否追踪玩家
          monsterData.vy = 0 // 垂直速度（允许跳跃和移动）
          monsterData.onGround = false // 是否在地面
        }
        
        // 月球幽灵特殊属性
        if (type === 'lunar_ghost') {
          monsterData.spellCooldown = 0 // 法术攻击冷却
          monsterData.yuanqiCooldown = 0 // 元气弹冷却
          monsterData.teleportCooldown = 0 // 位移冷却
          monsterData.scytheCooldown = 0 // 镰刀攻击冷却
          monsterData.isTeleporting = false // 是否正在位移
          monsterData.teleportTargetX = 0 // 位移目标X
          monsterData.teleportTargetY = 0 // 位移目标Y
          monsterData.isSwingingScythe = false // 是否正在挥舞镰刀
          monsterData.scytheSwingTime = 0 // 镰刀挥舞时间
          monsterData.ghostGlow = 0 // 幽灵发光动画
          monsterData.phase = 0 // 相位（用于闪烁效果）
          // 漂浮相关属性
          monsterData.floatPhase = Math.random() * Math.PI * 2 // 漂浮相位（随机初始值）
          monsterData.floatSpeed = 0.8 + Math.random() * 0.4 // 漂浮速度（0.8-1.2）
          monsterData.floatAmplitude = 15 + Math.random() * 10 // 漂浮幅度（15-25像素）
          monsterData.baseFloatY = y // 基础漂浮Y坐标
          monsterData.initialBaseFloatY = y // 初始基础漂浮Y坐标（用于保持分散，不会被追踪逻辑修改）
          monsterData.floatYWanderRange = 200 + Math.random() * 100 // Y轴徘徊范围（200-300像素）
          monsterData.swayPhase = Math.random() * Math.PI * 2 // 左右摆动相位
          monsterData.swayAmplitude = 5 + Math.random() * 5 // 左右摆动幅度（5-10像素）
          // X轴分散相关属性
          monsterData.baseX = x // 基础X坐标（用于保持分散）
          monsterData.wanderRange = 150 + Math.random() * 150 // 随机移动范围（150-300像素），增大范围确保分散
        }
        
        // 雨海飞虫特殊属性
        if (type === 'rain_sea_flyer') {
          monsterData.baseX = x // 基础X坐标
          monsterData.baseY = y // 基础Y坐标
          monsterData.wanderRange = 200 + Math.random() * 200 // 飞行范围（200-400像素）
          monsterData.flySpeed = 150 + Math.random() * 50 // 飞行速度（150-200）
          monsterData.shootCooldown = 0 // 射击冷却
          monsterData.shootInterval = 2 + Math.random() * 2 // 射击间隔（2-4秒）
          monsterData.flyDirection = Math.random() > 0.5 ? 1 : -1 // 初始飞行方向
          monsterData.flyPhase = Math.random() * Math.PI * 2 // 飞行相位（用于正弦波移动）
          monsterData.flyAmplitude = 30 + Math.random() * 20 // 飞行幅度（30-50像素）
        }
      
      this.monsters.push(monsterData)
    },
    
    // 新增方法：生成宝物
    generateTreasure(x, y) {
      const treasures = [
        { name: '黄金戒指', value: 200, color: '#ffd700', icon: '💍' },
        { name: '钻石', value: 500, color: '#1e90ff', icon: '💎' },
        { name: '古董花瓶', value: 300, color: '#ff6347', icon: '🏺' },
        { name: '神秘卷轴', value: 400, color: '#9b59b6', icon: '📜' },
        { name: '宝石项链', value: 600, color: '#ff4757', icon: '📿' }
      ]
      
      const treasure = treasures[Math.floor(Math.random() * treasures.length)]
      
      // 为宝物生成唯一ID
      const treasureId = Date.now() + Math.random().toString(36).substr(2, 9)
      
      this.treasures.push({
        id: treasureId, // 添加唯一ID
        x,
        y,
        w: 20,
        h: 20,
        ...treasure
      })
    },
    
    // 新增方法：生成BOSS
    spawnBoss() {
      this.boss = {
        x: this.canvasWidth + 200,
        y: this.groundY - 120,
        w: 120,
        h: 120,
        hp: 500,
        maxHp: 500,
        damage: 1,
        speed: 30,
        color: '#8b0000',
        phase: 1,
        attackCooldown: 0
      }
    },
    
    // 新增方法：更新子弹
    updateBullets(dt) {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet = this.bullets[i]
        bullet.x += bullet.vx * dt
        bullet.y += bullet.vy * dt
        
        // 移除超出地图范围的子弹（使用世界坐标边界）
        // 使用地图边界，而不是屏幕边界
        const margin = 500 // 边界外500像素的缓冲
        if (bullet.x < this.mapMinX - margin || bullet.x > this.mapMaxX + margin || 
            bullet.y < this.mapMinY - margin || bullet.y > this.mapMaxY + margin) {
          this.bullets.splice(i, 1)
          continue
        }
        
        // 子弹与怪物碰撞检测
        for (let j = this.monsters.length - 1; j >= 0; j--) {
          const monster = this.monsters[j]
          if (this.rectsCollide(bullet, monster)) {
            monster.hp -= bullet.damage
            this.bullets.splice(i, 1)
            
            // 显示伤害效果
            this.showDamageEffect(monster.x + monster.w/2, monster.y, bullet.damage)
            
            // 如果是电击子弹，显示电击特效
            if (bullet.type === 'electric') {
              this.showElectricEffect(monster.x + monster.w/2, monster.y + monster.h/2)
            }
            
            if (monster.hp <= 0) {
              this.kills++
              this.money += monster.value
              
              // 怪物掉落物品
              if (Math.random() < 0.1) {  // 从30%降低到10%
                this.generateTreasure(monster.x, monster.y)
              }
              if (Math.random() < 0.5) {
                // 掉落子弹（电击子弹）
                this.items.push({
                  type: 'ammo',
                  x: monster.x,
                  y: monster.y,
                  w: 15,
                  h: 10,
                  ammoType: 'electric',
                  count: 5,
                  color: '#00ffff'
                })
              }
              
              this.monsters.splice(j, 1)
            }
            break
          }
        }
        
        // 子弹与谱尼BOSS碰撞检测
        if (this.puniBoss.spawned && this.puniBoss.hp > 0) {
          const puni = this.puniBoss
          if (this.rectsCollide(bullet, puni)) {
            // 检查是否有护盾
            let actualDamage = bullet.damage
            if (puni.buffs.cuiLingShengGuang > 0 && puni.buffs.shield > 0) {
              // 有护盾，先扣除护盾
              if (puni.buffs.shield >= actualDamage) {
                puni.buffs.shield -= actualDamage
                actualDamage = 0
              } else {
                actualDamage -= puni.buffs.shield
                puni.buffs.shield = 0
              }
            }
            
            if (actualDamage > 0) {
              puni.hp -= actualDamage
              this.showDamageEffect(puni.x + puni.w / 2, puni.y, actualDamage)
              
              // 缩壳效果（受到攻击时）
              puni.energyBody.isContracted = true
              setTimeout(() => {
                puni.energyBody.isContracted = false
              }, 500)
              
              // 如果谱尼死亡
              if (puni.hp <= 0) {
                this.gameStatus = '谱尼已被击败！无尽能源已掉落！'
                this.money += 10000 // 金钱奖励
                
                // 记录击败标记
                try {
                  const saved = localStorage.getItem('delta-action-game')
                  const data = saved ? JSON.parse(saved) : {}
                  data.flags = data.flags || {}
                  data.flags.puniDefeated = true
                  localStorage.setItem('delta-action-game', JSON.stringify(data))
                } catch (e) {
                  console.error('保存击败标记失败:', e)
                }
                
                // 在普尼位置生成一个大的无尽能源掉落物
                const puniCenterX = puni.x + puni.w / 2
                const puniCenterY = puni.y + puni.h / 2
                
                const infiniteEnergyDrop = {
                  name: '无尽能源',
                  type: 'infinite_energy',
                  value: 9999, // 极高的价值
                  icon: '⚡', // 使用闪电图标
                  x: puniCenterX - 40, // 掉落物中心位置（更大的尺寸）
                  y: puniCenterY - 40,
                  w: 80, // 更大的尺寸，更容易看到
                  h: 80,
                  timestamp: Date.now(),
                  collected: false,
                  fixedOnGround: false, // 不固定在地面，可以漂浮
                  isInfiniteEnergy: true, // 标记为无尽能源，用于特殊绘制
                  glowIntensity: 1.0 // 发光强度
                }
                
                this.player.drops.push(infiniteEnergyDrop)
                
                console.log('⚡ 无尽能源掉落物已生成（子弹触发）！', {
                  位置: { x: infiniteEnergyDrop.x, y: infiniteEnergyDrop.y },
                  大小: { w: infiniteEnergyDrop.w, h: infiniteEnergyDrop.h }
                })
                
                setTimeout(() => {
                  if (this.running) this.gameStatus = '进行中'
                }, 3000)
              }
            }
            
            this.bullets.splice(i, 1)
            break
          }
        }
        
        // 子弹与BOSS碰撞检测
        if (this.boss && this.rectsCollide(bullet, this.boss)) {
          this.boss.hp -= bullet.damage
          this.bullets.splice(i, 1)
          
          // 显示伤害效果
          this.showDamageEffect(this.boss.x + this.boss.w/2, this.boss.y, bullet.damage)
          
          if (this.boss.hp <= 0) {
            this.gameWin()
          }
        }
      }
    },
    
    // 新增方法：更新怪物子弹
    updateMonsterBullets(dt) {
      for (let i = this.monsterBullets.length - 1; i >= 0; i--) {
        const bullet = this.monsterBullets[i]
        
        // 晶体子弹逻辑（抛物线轨迹，会碎裂）
        if (bullet.type === 'crystal') {
          // 应用重力
          bullet.vy += bullet.gravity * dt
          
          // 更新位置
          bullet.x += bullet.vx * dt
          bullet.y += bullet.vy * dt
          
          // 检查是否落地（Y >= groundY）
          if (bullet.y >= this.groundY - bullet.h) {
            // 晶体碎裂成3片小晶体
            if (bullet.willShatter) {
              for (let j = 0; j < 3; j++) {
                const angle = (Math.PI * 2 * j) / 3 + Math.random() * 0.5
                const speed = 50 + Math.random() * 30
                this.crystalFragments.push({
                  x: bullet.x,
                  y: bullet.y,
                  w: 8,
                  h: 8,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed - 100,
                  lifetime: 10, // 10秒持续时间
                  damage: 0.5, // 持续伤害
                  color: '#87ceeb'
                })
              }
            }
            
            // 移除原子弹
            this.monsterBullets.splice(i, 1)
            continue
          }
          
          // 检查是否击中玩家
          if (this.rectsCollide(bullet, this.player) && performance.now() > this.invincibleUntil) {
            this.hp -= bullet.damage
            this.invincibleUntil = performance.now() + 1000
            this.showDamageEffect(bullet.x, bullet.y, bullet.damage)
            this.monsterBullets.splice(i, 1)
            continue
          }
          
          // 移除超出屏幕的子弹
          if (bullet.x < -100 || bullet.x > this.mapMaxX + 100 || 
              bullet.y < this.mapMinY - 100 || bullet.y > this.mapMaxY + 100) {
            this.monsterBullets.splice(i, 1)
            continue
          }
        }
        
        // 晶体直接射击子弹逻辑（直线轨迹，不落地）
        if (bullet.type === 'crystal_direct') {
          // 更新位置（直线移动，不受重力影响）
          bullet.x += bullet.vx * dt
          bullet.y += bullet.vy * dt
          
          // 检查生命周期
          if (bullet.lifetime !== undefined) {
            bullet.lifetime -= dt
            if (bullet.lifetime <= 0) {
              this.monsterBullets.splice(i, 1)
              continue
            }
          }
          
          // 检查是否击中玩家
          if (this.rectsCollide(bullet, this.player) && performance.now() > this.invincibleUntil) {
            this.hp -= bullet.damage || 2
            this.invincibleUntil = performance.now() + 1000
            this.showDamageEffect(bullet.x, bullet.y, bullet.damage || 2)
            this.monsterBullets.splice(i, 1)
            continue
          }
          
          // 移除超出屏幕的子弹
          if (bullet.x < -100 || bullet.x > this.mapMaxX + 100 || 
              bullet.y < this.mapMinY - 100 || bullet.y > this.mapMaxY + 100) {
            this.monsterBullets.splice(i, 1)
            continue
          }
        }
        
        // 法术弹追踪逻辑
        if (bullet.type === 'spell') {
          // 追踪玩家
          if (bullet.targetX !== undefined && bullet.targetY !== undefined) {
            const dx = bullet.targetX - bullet.x
            const dy = bullet.targetY - bullet.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            
            if (dist > 0) {
              const trackStrength = bullet.trackingSpeed || 3
              bullet.vx += (dx / dist) * trackStrength
              bullet.vy += (dy / dist) * trackStrength
              
              // 限制速度
              const maxSpeed = 300
              const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy)
              if (speed > maxSpeed) {
                bullet.vx = (bullet.vx / speed) * maxSpeed
                bullet.vy = (bullet.vy / speed) * maxSpeed
              }
            }
          }
          
          // 更新位置
          bullet.x += bullet.vx * dt
          bullet.y += bullet.vy * dt
          
          // 检查生命周期
          if (bullet.lifetime !== undefined) {
            bullet.lifetime -= dt
            if (bullet.lifetime <= 0) {
              this.monsterBullets.splice(i, 1)
              continue
            }
          }
        }
        
        // 元气弹逻辑
        if (bullet.type === 'yuanqi') {
          // 更新位置
          bullet.x += bullet.vx * dt
          bullet.y += bullet.vy * dt
          
          // 检查生命周期
          if (bullet.lifetime !== undefined) {
            bullet.lifetime -= dt
            if (bullet.lifetime <= 0) {
              this.monsterBullets.splice(i, 1)
              continue
            }
          }
        }
        
        // 直线子弹逻辑（雨海飞虫发射的子弹）
        if (bullet.type === 'straight') {
          // 更新位置
          bullet.x += bullet.vx * dt
          bullet.y += bullet.vy * dt
          
          // 检查生命周期
          if (bullet.lifetime !== undefined) {
            bullet.lifetime -= dt
            if (bullet.lifetime <= 0) {
              this.monsterBullets.splice(i, 1)
              continue
            }
          }
          
          // 检查是否击中玩家
          if (this.rectsCollide(bullet, this.player) && performance.now() > this.invincibleUntil) {
            this.hp -= bullet.damage || 3
            this.invincibleUntil = performance.now() + 1000
            this.showDamageEffect(bullet.x, bullet.y, bullet.damage || 3)
            this.monsterBullets.splice(i, 1)
            continue
          }
          
          // 移除超出屏幕的子弹
          if (bullet.x < -100 || bullet.x > this.mapMaxX + 100 || 
              bullet.y < this.mapMinY - 100 || bullet.y > this.mapMaxY + 100) {
            this.monsterBullets.splice(i, 1)
            continue
          }
        }
        
        // 追踪元气弹逻辑
        if (bullet.type === 'tracking') {
          // 初始化飞行距离记录
          if (!bullet.startX) {
            bullet.startX = bullet.x
            bullet.startY = bullet.y
            bullet.traveledDistance = 0
          }
          
          // 计算已飞行距离
          bullet.traveledDistance = Math.sqrt(
            Math.pow(bullet.x - bullet.startX, 2) + 
            Math.pow(bullet.y - bullet.startY, 2)
          )
          
          // 如果飞行距离超过300像素，停止追踪
          if (bullet.traveledDistance > 300) {
            // 停止追踪，保持当前速度方向直线飞行
            // 不进行任何追踪计算
          } else {
            // 进一步降低追踪精度：每1秒才更新一次目标位置
            if (!bullet.lastTargetUpdate || performance.now() - bullet.lastTargetUpdate > 1000) {
              // 添加更大的目标位置误差
              const targetErrorX = (Math.random() - 0.5) * 80 // ±40像素误差
              const targetErrorY = (Math.random() - 0.5) * 60 // ±30像素误差
              
              bullet.targetX = this.player.x + this.player.w / 2 + targetErrorX
              bullet.targetY = this.player.y + this.player.h / 2 + targetErrorY
              bullet.lastTargetUpdate = performance.now()
            }
            
            // 计算追踪方向
            const dx = bullet.targetX - (bullet.x + bullet.w / 2)
            const dy = bullet.targetY - (bullet.y + bullet.h / 2)
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance > 0) {
              // 追踪移动，大幅增加追踪误差
              const dirX = dx / distance
              const dirY = dy / distance
              
              // 大幅增加追踪误差（±30度）
              const errorAngle = (Math.random() - 0.5) * Math.PI / 3 // ±30度
              const cosError = Math.cos(errorAngle)
              const sinError = Math.sin(errorAngle)
              
              // 旋转方向向量
              const newDirX = dirX * cosError - dirY * sinError
              const newDirY = dirX * sinError + dirY * cosError
              
              // 进一步降低追踪速度
              bullet.vx = newDirX * bullet.speed * 0.5
              bullet.vy = newDirY * bullet.speed * 0.5
              
              // 添加额外的随机速度波动
              bullet.vx += (Math.random() - 0.5) * 40
              bullet.vy += (Math.random() - 0.5) * 30
            }
          }
        }
        
        // 普尼跟踪子弹逻辑
        if (bullet.type === 'puni_tracking_bullet') {
          // 跟踪玩家
          if (bullet.lifetime > 0) {
            bullet.lifetime -= dt
            
            const playerCenterX = this.player.x + this.player.w / 2
            const playerCenterY = this.player.y + this.player.h / 2
            const bulletCenterX = bullet.x + bullet.w / 2
            const bulletCenterY = bullet.y + bullet.h / 2
            
            const dx = playerCenterX - bulletCenterX
            const dy = playerCenterY - bulletCenterY
            const dist = Math.sqrt(dx * dx + dy * dy)
            
            if (dist > 10) {
              // 计算跟踪方向
              const targetAngle = Math.atan2(dy, dx)
              const currentAngle = Math.atan2(bullet.vy, bullet.vx)
              
              // 计算角度差，限制转向速度
              let angleDiff = targetAngle - currentAngle
              // 归一化角度差到 [-π, π]
              while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
              while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
              
              // 应用跟踪强度限制转向速度
              const maxTurnSpeed = bullet.trackStrength || 0.15
              const turnAmount = Math.max(-maxTurnSpeed, Math.min(maxTurnSpeed, angleDiff))
              const newAngle = currentAngle + turnAmount
              
              // 更新速度
              const speed = bullet.trackSpeed || 200
              bullet.vx = Math.cos(newAngle) * speed
              bullet.vy = Math.sin(newAngle) * speed
            }
          } else {
            // 子弹消失
            this.monsterBullets.splice(i, 1)
            continue
          }
        }
        
        // 普尼旋转弹幕逻辑
        if (bullet.type === 'puni_spinning_bullet') {
          if (!bullet.expanding) {
            // 旋转阶段：围绕BOSS旋转
            bullet.orbitAngle += bullet.orbitSpeed * dt
            
            bullet.x = bullet.orbitCenterX + Math.cos(bullet.orbitAngle) * bullet.orbitRadius - bullet.w / 2
            bullet.y = bullet.orbitCenterY + Math.sin(bullet.orbitAngle) * bullet.orbitRadius * 0.6 - bullet.h / 2
            
            // 检查是否开始扩散（技能执行到扩散阶段）
            const puni = this.puniBoss
            if (puni.currentSkill === 'xuanZhuanDanMu' && puni.skillCastTime >= 1.0) {
              bullet.expanding = true
              // 设置扩散速度方向
              const expandAngle = bullet.orbitAngle
              bullet.vx = Math.cos(expandAngle) * bullet.expandSpeed
              bullet.vy = Math.sin(expandAngle) * bullet.expandSpeed
            }
          } else {
            // 扩散阶段：直线飞行
        bullet.x += bullet.vx * dt
        bullet.y += bullet.vy * dt
            
            bullet.lifetime -= dt
            if (bullet.lifetime <= 0) {
              this.monsterBullets.splice(i, 1)
              continue
            }
          }
        }
        
        // 普尼爆炸逻辑
        if (bullet.type === 'puni_explosion') {
          bullet.lifetime -= dt
          
          // 检查是否击中玩家
          if (!bullet.hasHitPlayer && this.rectsCollide(bullet, this.player) && performance.now() > this.invincibleUntil) {
            this.hp -= bullet.damage
            this.invincibleUntil = performance.now() + 1000
            this.showDamageEffect(this.player.x, this.player.y, bullet.damage)
            bullet.hasHitPlayer = true
          }
          
          // 爆炸持续时间结束后移除
          if (bullet.lifetime <= 0) {
            this.monsterBullets.splice(i, 1)
            continue
          }
        }
        
        // 普尼十字激光逻辑
        if (bullet.type === 'puni_cross_laser') {
          // 更新生命周期
          if (bullet.lifetime !== undefined) {
            bullet.lifetime -= dt
            if (bullet.lifetime <= 0) {
              this.monsterBullets.splice(i, 1)
              continue
            }
          }
          
          // 激光是固定的，从BOSS中心向四个方向延伸
          // 位置已经在创建时设置，这里只需要检查碰撞
          if (bullet.isActive) {
            // 计算激光的实际位置（从BOSS中心延伸）
            const laserLength = 5000
            const laserWidth = bullet.w || 80
            
            // 根据方向计算激光的实际矩形区域
            let laserRect = {
              x: 0,
              y: 0,
              w: 0,
              h: 0
            }
            
            // 根据方向调整矩形
            if (bullet.direction === 0) { // 右
              laserRect.x = bullet.startX
              laserRect.y = bullet.startY - laserWidth / 2
              laserRect.w = laserLength
              laserRect.h = laserWidth
            } else if (bullet.direction === Math.PI) { // 左
              laserRect.x = bullet.startX - laserLength
              laserRect.y = bullet.startY - laserWidth / 2
              laserRect.w = laserLength
              laserRect.h = laserWidth
            } else if (bullet.direction === -Math.PI / 2) { // 上
              laserRect.x = bullet.startX - laserWidth / 2
              laserRect.y = bullet.startY - laserLength
              laserRect.w = laserWidth
              laserRect.h = laserLength
            } else if (bullet.direction === Math.PI / 2) { // 下
              laserRect.x = bullet.startX - laserWidth / 2
              laserRect.y = bullet.startY
              laserRect.w = laserWidth
              laserRect.h = laserLength
            }
            
            // 检查是否击中玩家
            if (this.rectsCollide(laserRect, this.player) && performance.now() > this.invincibleUntil) {
              this.hp -= bullet.damage || 15
              this.invincibleUntil = performance.now() + 1000
              this.showDamageEffect(this.player.x, this.player.y, bullet.damage || 15)
              // 激光击中后不消失，继续存在直到lifetime结束
            }
          }
        }
        
        // 普尼追踪能量波逻辑
        if (bullet.type === 'puni_tracking_wave') {
          // 更新生命周期
          if (bullet.lifetime !== undefined) {
            bullet.lifetime -= dt
            if (bullet.lifetime <= 0) {
              this.monsterBullets.splice(i, 1)
              continue
            }
          }
          
          // 缓慢追踪玩家（每0.5秒更新一次目标）
          const now = performance.now()
          if (!bullet.lastUpdateTime || now - bullet.lastUpdateTime > 500) {
            bullet.targetX = this.player.x + this.player.w / 2
            bullet.targetY = this.player.y + this.player.h / 2
            bullet.lastUpdateTime = now
          }
          
          // 计算追踪方向
          const bulletCenterX = bullet.x + bullet.w / 2
          const bulletCenterY = bullet.y + bullet.h / 2
          const dx = bullet.targetX - bulletCenterX
          const dy = bullet.targetY - bulletCenterY
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist > 0) {
            // 缓慢转向玩家
            const targetAngle = Math.atan2(dy, dx)
            const currentAngle = Math.atan2(bullet.vy, bullet.vx)
            
            let angleDiff = targetAngle - currentAngle
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
            
            // 限制转向速度（较慢，玩家可以躲避）
            const maxTurnSpeed = bullet.trackingSpeed || 80
            const turnAmount = Math.max(-maxTurnSpeed * dt, Math.min(maxTurnSpeed * dt, angleDiff))
            const newAngle = currentAngle + turnAmount
            
            // 更新速度
            const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy)
            bullet.vx = Math.cos(newAngle) * speed
            bullet.vy = Math.sin(newAngle) * speed
          }
          
          // 更新位置
          bullet.x += bullet.vx * dt
          bullet.y += bullet.vy * dt
          
          // 检查是否击中玩家
          if (this.rectsCollide(bullet, this.player) && performance.now() > this.invincibleUntil) {
            this.hp -= bullet.damage || 12
            this.invincibleUntil = performance.now() + 1000
            this.showDamageEffect(bullet.x, bullet.y, bullet.damage || 12)
            this.monsterBullets.splice(i, 1)
            continue
          }
          
          // 移除超出屏幕的子弹
          if (bullet.x < -100 || bullet.x > this.mapMaxX + 100 || 
              bullet.y < this.mapMinY - 100 || bullet.y > this.mapMaxY + 100) {
            this.monsterBullets.splice(i, 1)
            continue
          }
        }
        
        // 普尼散发激光子弹逻辑（直线飞行，不受重力影响）
        if (bullet.type === 'puni_scatter_laser') {
          // 更新位置（直线移动）
          bullet.x += bullet.vx * dt
          bullet.y += bullet.vy * dt
          
          // 检查生命周期
          if (bullet.lifetime !== undefined) {
            bullet.lifetime -= dt
            if (bullet.lifetime <= 0) {
              this.monsterBullets.splice(i, 1)
              continue
            }
          }
          
          // 检查是否击中玩家
          if (this.rectsCollide(bullet, this.player) && performance.now() > this.invincibleUntil) {
            this.hp -= bullet.damage || 8
            this.invincibleUntil = performance.now() + 1000
            this.showDamageEffect(bullet.x, bullet.y, bullet.damage || 8)
            this.monsterBullets.splice(i, 1)
            continue
          }
          
          // 移除超出屏幕的子弹
          if (bullet.x < -100 || bullet.x > this.mapMaxX + 100 || 
              bullet.y < this.mapMinY - 100 || bullet.y > this.mapMaxY + 100) {
            this.monsterBullets.splice(i, 1)
            continue
          }
        }
        
        // 普尼成群子弹逻辑（直线飞行，朝向玩家方向）
        if (bullet.type === 'puni_group_bullet') {
          // 更新位置（直线移动）
          bullet.x += bullet.vx * dt
          bullet.y += bullet.vy * dt
          
          // 检查生命周期
          if (bullet.lifetime !== undefined) {
            bullet.lifetime -= dt
            if (bullet.lifetime <= 0) {
              this.monsterBullets.splice(i, 1)
              continue
            }
          }
          
          // 检查是否击中玩家
          if (this.rectsCollide(bullet, this.player) && performance.now() > this.invincibleUntil) {
            this.hp -= bullet.damage || 6
            this.invincibleUntil = performance.now() + 1000
            this.showDamageEffect(bullet.x, bullet.y, bullet.damage || 6)
            this.monsterBullets.splice(i, 1)
            continue
          }
          
          // 移除超出屏幕的子弹
          if (bullet.x < -100 || bullet.x > this.mapMaxX + 100 || 
              bullet.y < this.mapMinY - 100 || bullet.y > this.mapMaxY + 100) {
            this.monsterBullets.splice(i, 1)
            continue
          }
        }
        
        // 普通子弹移动（排除固定激光、旋转弹幕和已处理的子弹类型）
        if (bullet.type !== 'puni_spinning_bullet' && bullet.type !== 'puni_cross_laser' && 
            bullet.type !== 'puni_scatter_laser' && bullet.type !== 'puni_tracking_wave' &&
            bullet.type !== 'puni_group_bullet' &&
            (bullet.type === 'puni_spinning_bullet' ? bullet.expanding : true)) {
          bullet.x += bullet.vx * dt
          bullet.y += bullet.vy * dt
        }
        
        // 处理子弹生命周期（适用于所有有lifetime属性的子弹）
        if (bullet.lifetime !== undefined && bullet.type !== 'puni_spinning_bullet' && 
            bullet.type !== 'puni_explosion' && bullet.type !== 'puni_cross_laser') {
          bullet.lifetime -= dt
          if (bullet.lifetime <= 0) {
            this.monsterBullets.splice(i, 1)
            continue
          }
        }
        
        // 移除超出屏幕的子弹
        if (bullet.x < -50 || bullet.x > this.canvasWidth + 50 || 
            bullet.y < -50 || bullet.y > this.canvasHeight + 50) {
          this.monsterBullets.splice(i, 1)
          continue
        }
        
        // 怪物子弹与玩家碰撞检测（排除已专门处理的子弹类型）
        if (bullet.type !== 'crystal' && bullet.type !== 'puni_explosion' && 
            bullet.type !== 'puni_scatter_laser' && bullet.type !== 'puni_tracking_wave' &&
            bullet.type !== 'puni_cross_laser' && bullet.type !== 'puni_group_bullet' &&
            this.rectsCollide(bullet, this.player) && performance.now() > this.invincibleUntil) {
          // 检查是否是追踪弹（旧系统）
          if (bullet.type === 'tracking') {
          // 玩家被追踪弹击中不会掉血
          this.invincibleUntil = performance.now() + 1000
          } else {
            // 其他子弹造成伤害
            this.hp -= bullet.damage || 5
            this.invincibleUntil = performance.now() + 1000
            this.showDamageEffect(bullet.x, bullet.y, bullet.damage || 5)
          }
          this.monsterBullets.splice(i, 1)
        }
      }
    },
    
    // 更新晶体碎片系统
    updateCrystalFragments(dt) {
      for (let i = this.crystalFragments.length - 1; i >= 0; i--) {
        const fragment = this.crystalFragments[i]
        
        // 应用重力和摩擦力
        fragment.vy += this.GRAVITY * dt
        fragment.vx *= 0.95 // 水平摩擦力
        fragment.vy *= 0.98 // 垂直摩擦力
        
        // 更新位置
        fragment.x += fragment.vx * dt
        fragment.y += fragment.vy * dt
        
        // 检查是否落地
        if (fragment.y >= this.groundY - fragment.h) {
          fragment.y = this.groundY - fragment.h
          fragment.vy = 0
          fragment.vx *= 0.8 // 落地后减速
        }
        
        // 更新生命周期
        fragment.lifetime -= dt
        
        // 检查是否击中玩家（持续伤害和减速）
        if (this.rectsCollide(fragment, this.player)) {
          // 每秒造成伤害
          if (!fragment.lastDamageTime || performance.now() - fragment.lastDamageTime > 1000) {
            this.hp -= fragment.damage
            this.invincibleUntil = performance.now() + 1000
            this.showDamageEffect(fragment.x, fragment.y, fragment.damage)
            fragment.lastDamageTime = performance.now()
            
            // 降低移动速度15%（持续10秒）
            if (!fragment.slowApplied) {
              const baseMoveSpeed = 280 * 1.3
              const baseRunSpeed = 400 * 1.5
              this.MOVE_SPEED = baseMoveSpeed * 0.85
              this.RUN_SPEED = baseRunSpeed * 0.85
              fragment.slowApplied = true
            }
          }
        }
        
        // 移除过期的碎片
        if (fragment.lifetime <= 0) {
          // 恢复移动速度
          if (fragment.slowApplied) {
            this.MOVE_SPEED = 280 * 1.3
            this.RUN_SPEED = 400 * 1.5
          }
          this.crystalFragments.splice(i, 1)
        }
      }
    },
    
    // 新增方法：更新电击特效
    updateElectricEffects(dt) {
      if (!this.electricEffects) return
      
      // 更新电击特效的半径和透明度
      for (let i = this.electricEffects.length - 1; i >= 0; i--) {
        const effect = this.electricEffects[i]
        
        // 逐渐扩大半径
        effect.radius += dt * 40
        
        // 逐渐减少透明度
        effect.alpha -= dt * 2
        
        // 如果特效消失，移除它
        if (effect.alpha <= 0 || effect.radius >= effect.maxRadius) {
          this.electricEffects.splice(i, 1)
        }
      }
    },
    
    // 新增方法：更新电击特效
    updateElectricEffects(dt) {
      if (!this.electricEffects) return
      
      // 更新电击特效的半径和透明度
      for (let i = this.electricEffects.length - 1; i >= 0; i--) {
        const effect = this.electricEffects[i]
        
        // 逐渐扩大半径
        effect.radius += dt * 40
        
        // 逐渐减少透明度
        effect.alpha -= dt * 2
        
        // 如果特效消失，移除它
        if (effect.alpha <= 0 || effect.radius >= effect.maxRadius) {
          this.electricEffects.splice(i, 1)
        }
      }
    },
    
    // 新增方法：更新怪物 - 修改为小范围移动
    updateMonsters(dt) {
      for (let i = this.monsters.length - 1; i >= 0; i--) {
        const monster = this.monsters[i]
        
        // 月球幽灵跳过普通移动逻辑，使用特殊的漂浮和AI逻辑
        if (monster.type !== 'lunar_ghost') {
        // 小范围移动逻辑
        monster.moveTimer += dt
        if (monster.moveTimer >= monster.moveDuration) {
          // 移动时间结束，改变方向
          monster.moveDirection = Math.random() > 0.5 ? 1 : -1
          monster.moveDuration = 1 + Math.random() * 2 // 新的移动持续时间1-3秒
          monster.moveTimer = 0
        }
        
        // 计算移动速度
        const targetX = monster.baseX + monster.moveDirection * monster.wanderRange
        const distanceToTarget = Math.abs(targetX - monster.x)
        
        // 平滑移动：接近目标时减速
        const moveSpeed = Math.min(monster.speed, distanceToTarget / 0.5)
        monster.vx = monster.moveDirection * moveSpeed
        
        // 更新位置
        monster.x += monster.vx * dt
        }
        
        // 飞行怪物逻辑
        if (monster.canFly) {
          if (monster.type === 'rain_sea_flyer') {
            // 雨海飞虫：在雨海或风暴洋区域内自由飞行
            // 确定当前所在的区域
            let zone = null
            if (this.isInRainSeaZone(monster.x, monster.y)) {
              zone = this.rainSeaZone
            } else if (this.isInStormOceanZone(monster.x, monster.y)) {
              zone = this.stormOceanZone
            } else {
              // 如果不在任何区域内，尝试找到最近的区域
              const distToRainSea = Math.abs(monster.x - (this.rainSeaZone.x + this.rainSeaZone.width / 2))
              const distToStormOcean = Math.abs(monster.x - (this.stormOceanZone.x + this.stormOceanZone.width / 2))
              zone = distToRainSea < distToStormOcean ? this.rainSeaZone : this.stormOceanZone
            }
            
            // 更新飞行相位（用于正弦波移动）
            monster.flyPhase += dt * 2 // 飞行速度
            
            // 计算正弦波移动（上下浮动）
            const floatOffset = Math.sin(monster.flyPhase) * monster.flyAmplitude
            
            // 水平移动（在wanderRange内徘徊）
            const distanceFromBaseX = Math.abs(monster.x - monster.baseX)
            if (distanceFromBaseX > monster.wanderRange) {
              // 如果偏离太远，回到baseX附近
              const backDir = (monster.baseX - monster.x) / distanceFromBaseX
              monster.vx = backDir * monster.flySpeed * 0.5
            } else {
              // 在范围内随机移动
              monster.vx = monster.flyDirection * monster.flySpeed * (0.5 + Math.random() * 0.5)
              // 偶尔改变方向
              if (Math.random() < 0.01) {
                monster.flyDirection *= -1
              }
            }
            
            // 更新位置
            monster.x += monster.vx * dt
            monster.y = monster.baseY + floatOffset
            
            // 限制在当前区域内
            if (monster.x < zone.x) {
              monster.x = zone.x
              monster.flyDirection = 1
            }
            if (monster.x + monster.w > zone.x + zone.width) {
              monster.x = zone.x + zone.width - monster.w
              monster.flyDirection = -1
            }
            if (monster.y < zone.y) {
              monster.y = zone.y
            }
            if (monster.y + monster.h > zone.y + zone.height) {
              monster.y = zone.y + zone.height - monster.h
            }
          } else {
            // 其他飞行怪物保持原有逻辑
            monster.vy += (Math.random() - 0.5) * 200 * dt // 随机垂直移动
            monster.vy = Math.max(-50, Math.min(50, monster.vy)) // 限制垂直速度
            monster.y += monster.vy * dt
            monster.y = Math.max(50, Math.min(this.groundY - 100, monster.y)) // 限制飞行高度
          }
        }
        
        // 怪兽1号追踪元气弹逻辑
        if (monster.canShoot && monster.type === 'normal') {
          monster.shootCooldown -= dt
          
          // 计算与玩家的距离
          const dx = this.player.x - monster.x
          const dy = this.player.y - monster.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // 当玩家靠近时（距离小于300像素）发射追踪元气弹
          if (monster.shootCooldown <= 0 && distance < 300 && Math.random() < 0.3) {
            // 发射追踪元气弹
            this.monsterBullets.push({
              x: monster.x + monster.w / 2,
              y: monster.y + monster.h / 2,
              w: 12,
              h: 12,
              vx: 0,
              vy: 0,
              damage: 1,
              color: '#ff6b6b',
              type: 'tracking', // 标记为追踪弹
              targetX: this.player.x + this.player.w / 2,
              targetY: this.player.y + this.player.h / 2,
              speed: 200,
              trackingSpeed: 5, // 追踪速度
              name: '元气弹'
            })
            
            monster.shootCooldown = 3 // 3秒射击冷却
          }
        }
        
        // 雨海飞虫攻击逻辑
        if (monster.canShoot && monster.type === 'rain_sea_flyer') {
          // 确保 shootCooldown 已初始化
          if (monster.shootCooldown === undefined || monster.shootCooldown === null) {
            monster.shootCooldown = 0
          }
          if (monster.shootInterval === undefined || monster.shootInterval === null) {
            monster.shootInterval = 2 + Math.random() * 2 // 射击间隔（2-4秒）
          }
          
          monster.shootCooldown -= dt
          
          // 计算与玩家的距离
          const dx = this.player.x + this.player.w / 2 - (monster.x + monster.w / 2)
          const dy = this.player.y + this.player.h / 2 - (monster.y + monster.h / 2)
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // 当玩家在范围内（距离小于500像素）时发射子弹
          if (monster.shootCooldown <= 0 && distance < 500) {
            // 计算朝向玩家的方向
            const angle = Math.atan2(dy, dx)
            const bulletSpeed = 250 // 子弹速度
            
            // 发射子弹
            this.monsterBullets.push({
              x: monster.x + monster.w / 2,
              y: monster.y + monster.h / 2,
              w: 8,
              h: 8,
              vx: Math.cos(angle) * bulletSpeed,
              vy: Math.sin(angle) * bulletSpeed,
              damage: monster.damage || 3,
              color: '#4a90e2', // 蓝色子弹
              type: 'straight', // 直线子弹
              lifetime: 3, // 3秒后消失
              name: '飞虫子弹'
            })
            
            monster.shootCooldown = monster.shootInterval || 2 // 使用设定的射击间隔
            
            // 调试信息（每10次攻击输出一次）
            if (Math.random() < 0.1) {
              console.log(`🦋 雨海飞虫攻击: 距离=${Math.floor(distance)}, 冷却=${monster.shootCooldown.toFixed(2)}`)
            }
          }
        }
        
        // 洞刺兽特殊逻辑
        if (monster.type === 'cave_spike') {
          // 更新晶体发光动画
          monster.crystalGlow += dt * 3
          
          // 计算与玩家的距离（像素，1米 = 40像素）
          const dx = this.player.x - (monster.x + monster.w / 2)
          const dy = this.player.y - (monster.y + monster.h / 2)
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // 物理系统：重力和跳跃
          const gravity = this.GRAVITY
          monster.vy += gravity * dt
          
          // 检查是否在地面
          const groundLevel = this.groundY - monster.h / 2
          if (monster.y >= groundLevel) {
            monster.y = groundLevel
            monster.vy = 0
            monster.onGround = true
          } else {
            monster.onGround = false
          }
          
          // 更新Y位置
          monster.y += monster.vy * dt
          
          // 追踪玩家行为：如果玩家在范围内，开始追踪（增加追踪距离）
          if (distance < 1200) { // 30米范围内（增加追踪距离）
            monster.chasePlayer = true
            monster.isRunning = true
          } else {
            monster.chasePlayer = false
            monster.isRunning = false
          }
          
          // 更新射击冷却
          if (monster.crystalShootCooldown > 0) {
            monster.crystalShootCooldown -= dt
          }
          
          // 直接瞄准射击（扩大攻击范围，增加攻击频率）
          if (distance >= 150 && distance <= 800 && monster.crystalShootCooldown <= 0) {
            // 直接瞄准玩家射击（直线轨迹）
            const angle = Math.atan2(dy, dx)
            const speed = 400 // 快速直线速度
            const startX = monster.x + monster.w / 2
            const startY = monster.y + monster.h / 2
            
            this.monsterBullets.push({
              x: startX,
              y: startY,
              w: 18,
              h: 18,
              vx: Math.cos(angle) * speed, // 直接朝向玩家
              vy: Math.sin(angle) * speed,
              damage: 2,
              color: '#87ceeb',
              type: 'crystal_direct', // 新的直接射击类型
              name: '晶体',
              willShatter: true,
              lifetime: 3 // 3秒后消失
            })
            
            monster.crystalShootCooldown = 1.0 // 减少冷却时间（从1.5秒减少到1秒，增加攻击频率）
          }
          
          // 冲锋顶撞攻击（3.75米 = 150像素）- 增加触发距离和频率
          if (distance <= 150 && !monster.isCharging && monster.chargeCooldown <= 0) {
            // 开始冲锋
            monster.isCharging = true
            monster.chargeDirection = dx > 0 ? 1 : -1
            monster.chargeCooldown = 3 // 减少冷却时间（从5秒减少到3秒）
          }
          
          // 冲锋逻辑
          if (monster.isCharging) {
            monster.vx = monster.chargeDirection * monster.chargeSpeed
            
            // 检查是否撞到玩家
        if (this.rectsCollide(monster, this.player) && performance.now() > this.invincibleUntil) {
              // 造成5点伤害（增加伤害）
              this.hp -= monster.damage
              this.invincibleUntil = performance.now() + 1000
              
              // 击退玩家5米（200像素）
              const knockbackDir = this.player.x > monster.x ? 1 : -1
              this.player.vx += knockbackDir * 500 // 增加击退速度
              
              this.showDamageEffect(this.player.x + this.player.w/2, this.player.y + this.player.h/2, monster.damage)
              
              // 结束冲锋
              monster.isCharging = false
              monster.vx = 0
            }
            
            // 冲锋持续1秒后停止（增加持续时间）
            monster.chargeTimer = (monster.chargeTimer || 0) + dt
            if (monster.chargeTimer >= 1.0) {
              monster.isCharging = false
              monster.chargeTimer = 0
              monster.vx = 0
            }
          } else {
            // 移动逻辑：追踪玩家或随机移动
            if (monster.chasePlayer) {
              // 追踪玩家：快速奔跑
              const moveSpeed = monster.isRunning ? monster.runSpeed : monster.speed
              const targetX = this.player.x
              const dirX = targetX > monster.x ? 1 : -1
              const distanceToPlayer = Math.abs(targetX - monster.x)
              
              // 快速移动向玩家
              monster.vx = dirX * Math.min(moveSpeed, distanceToPlayer / 0.2)
              
              // 如果距离较远，可以跳跃
              if (monster.onGround && distanceToPlayer > 200 && Math.random() < 0.3) {
                monster.vy = -400 // 跳跃
              }
            } else {
              // 随机移动：在小范围内移动
              const targetX = monster.baseX + monster.moveDirection * monster.wanderRange
              const distanceToTarget = Math.abs(targetX - monster.x)
              
              // 到达目标后改变方向
              if (distanceToTarget < 10) {
                monster.moveDirection = Math.random() > 0.5 ? 1 : -1
                monster.wanderRange = 150 + Math.random() * 100
              }
              
              // 快速移动
              monster.vx = monster.moveDirection * Math.min(monster.speed * 1.2, distanceToTarget / 0.3)
            }
            
            monster.chargeTimer = 0
            monster.chargeCooldown -= dt
          }
          
          // 更新X位置
          monster.x += monster.vx * dt
          
          // 限制在风暴洋区域内
          const zone = this.stormOceanZone
          if (monster.x < zone.x) monster.x = zone.x
          if (monster.x > zone.x + zone.width) monster.x = zone.x + zone.width
        }
        
        // 月球幽灵已移除，不再处理
        if (false && monster.type === 'lunar_ghost') {
          // 更新幽灵发光动画
          monster.ghostGlow += dt * 4
          monster.phase += dt * 2
          
          // 计算与玩家的距离
          const dx = this.player.x - (monster.x + monster.w / 2)
          const dy = this.player.y - (monster.y + monster.h / 2)
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // 更新冷却时间
          monster.spellCooldown -= dt
          monster.yuanqiCooldown -= dt
          monster.teleportCooldown -= dt
          monster.scytheCooldown -= dt
          
          // 限制在雨海区域内
          const zone = this.rainSeaZone
          
          // AI行为选择
          if (monster.isTeleporting) {
            // 位移中：快速移动到目标位置
            const teleportSpeed = 800 // 非常快的位移速度
            const tdx = monster.teleportTargetX - (monster.x + monster.w / 2)
            const tdy = monster.teleportTargetY - (monster.y + monster.h / 2)
            const tdist = Math.sqrt(tdx * tdx + tdy * tdy)
            
            if (tdist < 10) {
              // 到达目标位置
              monster.isTeleporting = false
              monster.vx = 0
              monster.vy = 0
            } else {
              // 快速移动向目标
              monster.vx = (tdx / tdist) * teleportSpeed
              monster.vy = (tdy / tdist) * teleportSpeed
            }
          } else if (monster.isSwingingScythe) {
            // 挥舞镰刀中：停止移动，挥舞镰刀
            monster.vx = 0
            monster.vy = 0
            monster.scytheSwingTime += dt
            
            // 检查镰刀是否击中玩家（近战范围）
            if (distance < 80 && monster.scytheSwingTime > 0.2 && monster.scytheSwingTime < 0.6) {
              if (performance.now() > this.invincibleUntil) {
                this.hp -= monster.damage
                this.invincibleUntil = performance.now() + 1000
                this.showDamageEffect(this.player.x, this.player.y, monster.damage)
              }
            }
            
            // 挥舞完成
            if (monster.scytheSwingTime >= 0.8) {
              monster.isSwingingScythe = false
              monster.scytheSwingTime = 0
              monster.scytheCooldown = 2 // 2秒冷却
            }
          } else {
            // 正常状态：根据距离选择行为
            if (distance < 100 && monster.scytheCooldown <= 0) {
              // 靠近玩家：挥舞镰刀
              monster.isSwingingScythe = true
              monster.scytheSwingTime = 0
              monster.vx = 0
              monster.vy = 0
            } else if (distance > 400 && monster.teleportCooldown <= 0 && Math.random() < 0.3) {
              // 距离较远：突然位移到玩家附近
              monster.isTeleporting = true
              monster.teleportTargetX = this.player.x + this.player.w / 2 + (Math.random() - 0.5) * 150
              monster.teleportTargetY = this.player.y + this.player.h / 2 + (Math.random() - 0.5) * 150
              monster.teleportCooldown = 4 // 4秒冷却
            } else if (distance < 500 && monster.yuanqiCooldown <= 0 && Math.random() < 0.4) {
              // 中等距离：释放元气弹
              const angle = Math.atan2(dy, dx)
              const bulletCount = 8 // 8发元气弹
              const angleStep = (Math.PI * 2) / bulletCount
              const speed = 200
              
              for (let i = 0; i < bulletCount; i++) {
                const bulletAngle = i * angleStep
                this.monsterBullets.push({
                  x: monster.x + monster.w / 2,
                  y: monster.y + monster.h / 2,
                  w: 25,
                  h: 25,
                  vx: Math.cos(bulletAngle) * speed,
                  vy: Math.sin(bulletAngle) * speed,
                  damage: 5,
                  color: '#ffd700',
                  type: 'yuanqi',
                  name: '元气弹',
                  lifetime: 4
                })
              }
              
              monster.yuanqiCooldown = 3 // 3秒冷却
            } else if (distance < 600 && monster.spellCooldown <= 0 && Math.random() < 0.5) {
              // 中远距离：释放法术攻击（发射3发追踪法术弹）
              for (let i = 0; i < 3; i++) {
                const spreadAngle = (i - 1) * 0.3 // 扇形分布
                const angle = Math.atan2(dy, dx) + spreadAngle
                const speed = 250
                
                this.monsterBullets.push({
                  x: monster.x + monster.w / 2,
                  y: monster.y + monster.h / 2,
                  w: 20,
                  h: 20,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  damage: 4,
                  color: '#9370db',
                  type: 'spell',
                  name: '法术弹',
                  lifetime: 5,
                  targetX: this.player.x + this.player.w / 2,
                  targetY: this.player.y + this.player.h / 2,
                  trackingSpeed: 3 // 追踪速度
                })
              }
              
              monster.spellCooldown = 2.5 // 2.5秒冷却
            }
            
            // 追踪玩家（移动速度特别快，但保持漂浮效果和X轴分散）
            if (!monster.isSwingingScythe && !monster.isTeleporting) {
              const moveSpeed = monster.speed // 350像素/秒，已经很快
              
              // 水平方向：完全保持在baseX附近，不追踪玩家X坐标
              // 确保baseX已初始化（兼容旧数据，只初始化一次）
              if (monster.baseX === undefined || monster.baseX === null) {
                // 如果baseX未设置，使用当前位置作为baseX
                monster.baseX = monster.x
                if (Math.abs(monster.x) > 100) {
                  console.warn(`⚠️ 月球幽灵baseX未设置，使用当前位置: ${monster.x}`)
                }
              }
              
              // 如果baseX为0或接近0，且当前位置不在0附近，说明baseX被错误重置了
              // 使用一个标记来确保只修复一次
              if (!monster._baseXFixed && monster.baseX === 0 && Math.abs(monster.x) > 100) {
                monster.baseX = monster.x
                monster._baseXFixed = true // 标记已修复，避免重复修复
                console.warn(`⚠️ 月球幽灵baseX为0，重新设置为当前位置: ${monster.x}`)
              }
              
              // 确保wanderRange已设置
              if (monster.wanderRange === undefined || monster.wanderRange === null) {
                monster.wanderRange = 100 + Math.random() * 100
              }
              
              const distanceFromBaseX = Math.abs(monster.x - monster.baseX)
              
              // 始终保持在baseX附近徘徊，完全不向玩家X坐标移动
              // 使用更强的回到baseX的力，确保不会聚集
              if (distanceFromBaseX > monster.wanderRange) {
                // 如果偏离baseX太远，强制回到baseX附近
                const backToBaseDir = (monster.baseX - monster.x) / distanceFromBaseX
                monster.vx = backToBaseDir * moveSpeed * 0.8 // 增加回到baseX的速度
              } else {
                // 在baseX附近，随机移动（完全不追踪玩家X坐标）
                // 添加更强的随机性，确保分散
                monster.vx += (Math.random() - 0.5) * 60 * dt // 增加随机移动幅度
                monster.vx = Math.max(-40, Math.min(40, monster.vx)) // 增加最大速度
                
                // 如果随机移动导致偏离baseX太远，添加回到baseX的力
                if (distanceFromBaseX > monster.wanderRange * 0.6) {
                  const backToBaseDir = (monster.baseX - monster.x) / distanceFromBaseX
                  monster.vx += backToBaseDir * moveSpeed * 0.2 * dt // 增加回到baseX的力
                }
              }
              
              // 完全禁止向玩家X坐标移动
              // 如果vx方向是朝向玩家的，且玩家在baseX附近，则反向移动
              const playerX = this.player.x + this.player.w / 2
              const monsterCenterX = monster.x + monster.w / 2
              const distanceToPlayerX = Math.abs(playerX - monsterCenterX)
              const distanceToBaseX = Math.abs(monsterCenterX - monster.baseX)
              
              // 如果玩家在baseX附近，且幽灵正在向玩家移动，则反向
              if (distanceToPlayerX < 200 && distanceToBaseX < monster.wanderRange) {
                const dirToPlayer = (playerX - monsterCenterX) / distanceToPlayerX
                const dirToBase = (monster.baseX - monsterCenterX) / distanceToBaseX
                // 如果移动方向朝向玩家，且与baseX方向相反，则反向
                if (Math.sign(monster.vx) === Math.sign(dirToPlayer) && 
                    Math.sign(dirToPlayer) !== Math.sign(dirToBase)) {
                  monster.vx = -monster.vx * 0.5 // 反向并减速
                }
              }
              
              // 垂直方向：完全保持在初始baseFloatY附近，不追踪玩家Y坐标
              // 确保initialBaseFloatY已初始化（兼容旧数据）
              if (monster.initialBaseFloatY === undefined) {
                monster.initialBaseFloatY = monster.baseFloatY || monster.y
              }
              
              // 确保floatYWanderRange已设置
              if (monster.floatYWanderRange === undefined) {
                monster.floatYWanderRange = 200 + Math.random() * 100
              }
              
              const distanceFromBaseFloatY = Math.abs(monster.baseFloatY - monster.initialBaseFloatY)
              
              // 如果baseFloatY偏离初始值太远，强制回到初始值附近
              if (distanceFromBaseFloatY > monster.floatYWanderRange) {
                const backToBaseFloatYDir = (monster.initialBaseFloatY - monster.baseFloatY) / distanceFromBaseFloatY
                monster.baseFloatY += backToBaseFloatYDir * moveSpeed * 0.5 * dt // 增加回到初始值的速度
              } else {
                // 在初始baseFloatY附近，完全随机调整（不追踪玩家Y坐标）
                // 添加随机调整，确保分散，避免聚集
                monster.baseFloatY += (Math.random() - 0.5) * 30 * dt // 增加随机调整幅度
                
                // 如果随机调整导致偏离initialBaseFloatY太远，添加回到initialBaseFloatY的力
                if (distanceFromBaseFloatY > monster.floatYWanderRange * 0.7) {
                  const backToBaseFloatYDir = (monster.initialBaseFloatY - monster.baseFloatY) / distanceFromBaseFloatY
                  monster.baseFloatY += backToBaseFloatYDir * moveSpeed * 0.2 * dt
                }
              }
              
              // 完全禁止向玩家Y坐标移动
              // 如果玩家在initialBaseFloatY附近，确保baseFloatY不会向玩家移动
              const playerY = this.player.y + this.player.h / 2
              const monsterCenterY = monster.baseFloatY
              const distanceToPlayerY = Math.abs(playerY - monsterCenterY)
              const distanceToInitialBaseFloatY = Math.abs(monsterCenterY - monster.initialBaseFloatY)
              
              // 如果玩家在initialBaseFloatY附近，且baseFloatY正在向玩家移动，则反向
              if (distanceToPlayerY < 400 && distanceToInitialBaseFloatY < monster.floatYWanderRange * 1.2) {
                const dirToPlayer = (playerY - monsterCenterY) / distanceToPlayerY
                const dirToInitial = (monster.initialBaseFloatY - monsterCenterY) / distanceToInitialBaseFloatY
                // 如果方向朝向玩家，且与initialBaseFloatY方向相反，则强制向initialBaseFloatY移动
                if (Math.sign(dirToPlayer) !== Math.sign(dirToInitial) && Math.abs(dirToPlayer) > 0.1) {
                  // 强制向initialBaseFloatY移动，远离玩家
                  const backToInitialDir = (monster.initialBaseFloatY - monsterCenterY) / distanceToInitialBaseFloatY
                  monster.baseFloatY += backToInitialDir * moveSpeed * 0.3 * dt
                }
              }
            }
          }
          
          // 更新位置（月球幽灵的Y坐标已在漂浮逻辑中处理，这里只更新X坐标）
          monster.x += monster.vx * dt
          // 注意：月球幽灵的Y坐标由漂浮逻辑控制，不需要这里更新
          
          // 限制X坐标在雨海区域内（Y坐标限制已在漂浮逻辑中处理）
          if (monster.x < zone.x) {
            monster.x = zone.x
            monster.vx = 0
          }
          if (monster.x + monster.w > zone.x + zone.width) {
            monster.x = zone.x + zone.width - monster.w
            monster.vx = 0
          }
          // Y坐标限制已在漂浮逻辑中处理，这里不需要重复限制
        }
        
        // 怪物攻击玩家（修改为不会掉血，但洞刺兽的冲锋攻击已在上面处理）
        if (monster.type !== 'cave_spike' && 
            this.rectsCollide(monster, this.player) && performance.now() > this.invincibleUntil) {
          // 玩家碰到怪兽不会掉血
          this.invincibleUntil = performance.now() + 1000
        }
        
        // 移除超出屏幕的怪物
        if (monster.x < -100) {
          this.monsters.splice(i, 1)
        }
      }
    },
    
    // 新增方法：更新BOSS
    updateBoss(dt) {
      if (!this.boss) return
      
      this.boss.attackCooldown -= dt
      
      // BOSS移动
      if (this.boss.x > this.canvasWidth - 200) {
        this.boss.x -= this.boss.speed * dt
      }
      
      // BOSS攻击（修改为不会掉血）
      if (this.boss.attackCooldown <= 0 && this.rectsCollide(this.boss, this.player)) {
        // 玩家碰到BOSS不会掉血
        this.boss.attackCooldown = 2 // 2秒攻击冷却
      }
    },
    
    // 新增方法：更新伤害效果
    updateDamageEffects(dt) {
      if (!this.damageEffects) return
      
      for (let i = this.damageEffects.length - 1; i >= 0; i--) {
        const effect = this.damageEffects[i]
        effect.y += effect.vy * dt
        effect.alpha -= dt
        
        // 移除透明度为0的效果
        if (effect.alpha <= 0) {
          this.damageEffects.splice(i, 1)
        }
      }
    },
    
    // 新增方法：绘制伤害效果
    // 绘制冲刺视觉效果
    drawDashEffects(ctx) {
      if (!this.dashEffects || this.dashEffects.length === 0) return
      
      ctx.save()
      this.dashEffects.forEach(effect => {
        ctx.globalAlpha = effect.alpha
        ctx.fillStyle = effect.color
        ctx.beginPath()
        ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2)
        ctx.fill()
        
        // 添加发光效果
        ctx.shadowColor = effect.color
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(effect.x, effect.y, effect.size * 0.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })
      ctx.globalAlpha = 1
      ctx.restore()
    },
    
    drawDamageEffects(ctx) {
      if (!this.damageEffects) return
      
      this.damageEffects.forEach(effect => {
        ctx.save()
        ctx.globalAlpha = effect.alpha
        ctx.fillStyle = effect.color
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(effect.text, effect.x, effect.y)
        ctx.restore()
      })
    },
    
    // 新增方法：游戏胜利
    gameWin() {
      this.running = false
      this.gameStatus = '胜利！成功撤离'
      
      // 保存战利品到储藏柜（不保存子弹，子弹需要重新购买）
      this.saveLootToStorage()
      
      setTimeout(() => {
        this.$emit('game-over')
      }, 3000)
    },
    
    // 新增方法：保存战利品
    saveLootToStorage() {
      const saved = localStorage.getItem('delta-action-game')
      const data = saved ? JSON.parse(saved) : {}
      
      // 保存收集的宝物
      data.storageTreasures = data.storageTreasures || []
      data.storageTreasures.push(...this.player.backpack)
      
      // 保存金钱（不保存子弹，子弹需要重新购买）
      data.money = (data.money || 0) + this.money
      
      // 保存游戏时间状态（累加当前游戏时间）
      const currentGameTime = this.gameTime + this.elapsedTime
      data.gameTime = currentGameTime // 直接使用当前游戏时间，不累加
      
      // 注意：不保存子弹，子弹会在游戏结束后消耗完
      
      localStorage.setItem('delta-action-game', JSON.stringify(data))
    },
    
    // 新增方法：保存部分战利品（失败时）
    savePartialLoot() {
      const saved = localStorage.getItem('delta-action-game')
      const data = saved ? JSON.parse(saved) : {}
      
      // 失败时只能带回30%的宝物
      const keepCount = Math.max(1, Math.floor(this.player.backpack.length * 0.3))
      const keptTreasures = this.player.backpack.slice(0, keepCount)
      
      data.storageTreasures = data.storageTreasures || []
      data.storageTreasures.push(...keptTreasures)
      
      // 失败时只能带回50%的金钱
      const keptMoney = Math.floor(this.money * 0.5)
      data.money = (data.money || 0) + keptMoney
      
      // 保存能源系统状态（不重置为200）
      data.energy = data.energy || 200 // 如果之前没有保存过能源，使用默认值200
      
      // 保存游戏时间状态（累加当前游戏时间）
      const currentGameTime = this.gameTime + this.elapsedTime
      data.gameTime = currentGameTime // 直接使用当前游戏时间，不累加
      
      localStorage.setItem('delta-action-game', JSON.stringify(data))
    },
    
    // 新增方法：装备格子切换
    switchEquipmentSlot(slotIndex) {
      // 检查索引是否有效
      if (slotIndex < 0 || slotIndex >= this.player.equipmentSlots.length) {
        return
      }
      
      // 更新所有格子的激活状态
      this.player.equipmentSlots.forEach((slot, index) => {
        slot.active = (index === slotIndex)
      })
      
      // 更新当前选中格子
      this.player.currentSlot = slotIndex + 1
      
      // 根据格子类型执行相应操作
      const currentSlot = this.player.equipmentSlots[slotIndex]
      
      if (currentSlot.type === 'weapon') {
        // 切换到武器
        this.player.currentWeapon = { name: '电击枪', type: 'electric', damage: 15 }
        this.gameStatus = `已切换到：${currentSlot.name}`
      } else if (currentSlot.type === 'shield') {
        // 切换到光子盾
        this.player.currentWeapon = null
        this.gameStatus = `已切换到：${currentSlot.name}`
      } else if (currentSlot.type === 'laser') {
        // 切换到激光工具（包括基础激光镐和高级激光镐）
        this.player.currentWeapon = null
        this.gameStatus = `已切换到：${currentSlot.name}`
      } else if (currentSlot.type === 'tool') {
        // 切换到工具（钻探机、地质探测器、机械拆解机等）
        this.player.currentWeapon = null
        this.gameStatus = `已切换到：${currentSlot.name}`
      } else if (currentSlot.type === 'module') {
        // 切换到模块（冷凝模块等）
        this.player.currentWeapon = null
        this.gameStatus = `已切换到：${currentSlot.name}`
      } else if (currentSlot.type === 'empty') {
        // 空格子
        this.player.currentWeapon = null
        this.gameStatus = '当前格子为空'
      }
      
      setTimeout(() => {
        if (this.running) this.gameStatus = '进行中'
      }, 1000)
    },
    
    // 新增方法：能源格子切换
    switchEnergySlot(slotIndex) {
      // 检查索引是否有效
      if (slotIndex < 0 || slotIndex >= this.player.energySlots.length) {
        return
      }
      
      // 更新所有能源格子的激活状态
      this.player.energySlots.forEach((slot, index) => {
        slot.active = (index === slotIndex)
      })
      
      // 更新当前选中能源格子
      this.player.currentEnergySlot = slotIndex + 1
      
      // 显示能源格子切换提示
      const currentSlot = this.player.energySlots[slotIndex]
      this.gameStatus = `已切换到：${currentSlot.name} (${currentSlot.energy}%)`
      
      setTimeout(() => {
        if (this.running) this.gameStatus = '进行中'
      }, 1000)
    },
    
    // 新增方法：能源格子切换
    switchEnergySlot(slotIndex) {
      // 检查索引是否有效
      if (slotIndex < 0 || slotIndex >= this.player.energySlots.length) {
        return
      }
      
      // 更新所有能源格子的激活状态
      this.player.energySlots.forEach((slot, index) => {
        slot.active = (index === slotIndex)
      })
      
      // 更新当前选中能源格子
      this.player.currentEnergySlot = slotIndex + 1
      
      // 显示能源格子切换提示
      const currentSlot = this.player.energySlots[slotIndex]
      this.gameStatus = `已切换到：${currentSlot.name} (${currentSlot.energy}%)`
      
      setTimeout(() => {
        if (this.running) this.gameStatus = '进行中'
      }, 1000)
    },
    
    // 新增方法：武器切换
    switchWeapon(index) {
      // 定义默认武器列表（只保留电击枪）
      const defaultWeapons = [
        { name: '电击枪', type: 'electric', damage: 15 }
      ]
      
      // 检查索引是否有效
      if (index < 0 || index >= defaultWeapons.length) {
        return
      }
      
      // 切换到指定武器
      this.player.currentWeapon = defaultWeapons[index]
      
      // 显示武器切换提示
      this.gameStatus = `已切换到：${this.player.currentWeapon.name}`
      setTimeout(() => {
        if (this.running) this.gameStatus = '进行中'
      }, 1000)
    }
  }
}
</script>

<style scoped>
.game-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.game-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100vh;
}

canvas {
  background: linear-gradient(#d0f0ff, #ffffff);
  border: 4px solid #66c2ff;
  border-radius: 8px;
  touch-action: none;
  width: 100%;
  height: 100%;
  max-width: 1400px;
  max-height: 800px;
}

/* 普尼扣血按钮样式 */
.puni-damage-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  border: 2px solid #ff4757;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
  transition: all 0.3s;
  z-index: 1000;
}

.puni-damage-btn:hover {
  background: linear-gradient(135deg, #ff5252 0%, #e63946 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
}

.puni-damage-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(255, 107, 107, 0.4);
}

.hud {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  max-width: 96vw;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 10px 20px;
  background: rgba(0,0,0,0.7);
  border-radius: 10px;
}

.info {
  font-size: 14px;
  color: #045;
  display: flex;
  gap: 12px;
  align-items: center;
}

.buttons {
  display: flex;
  gap: 12px;
}

button {
  padding: 10px 16px;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: white;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  min-width: 80px;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  filter: brightness(1.1);
}

button:active {
  transform: translateY(0);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.btn-restart {
  background: linear-gradient(135deg, #e74c3c, #ff6b6b);
  border-color: rgba(231, 76, 60, 0.5);
}

.btn-mute {
  background: linear-gradient(135deg, #3498db, #4fc3f7);
  border-color: rgba(52, 152, 219, 0.5);
}

.btn-avatar {
  background: linear-gradient(135deg, #9b59b6, #ba68c8);
  border-color: rgba(155, 89, 182, 0.5);
}

.btn-music {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  border-color: rgba(39, 174, 96, 0.5);
}

.controls {
  position: fixed;
  right: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.control-btn {
  padding: 20px 25px;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  user-select: none;
  cursor: pointer;
  color: white;
  font-size: 18px;
  font-weight: bold;
  min-width: 80px;
  text-align: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.control-btn:active {
  transform: scale(0.95);
  background: linear-gradient(135deg, #357abd, #2c5aa0);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.control-btn:hover {
  filter: brightness(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.message {
  margin-top: 10px;
  color: #104;
  font-weight: 600;
}

.error {
  color: #b00;
  margin-top: 8px;
  white-space: pre-wrap;
}

@media (max-width: 520px) {
  .hud {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>e
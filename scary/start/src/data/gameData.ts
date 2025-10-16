// 游戏数据配置
export interface Scene {
  id: string
  name: string
  description: string
  objects: GameObject[]
  npcs: NPC[]
  clues: string[]
}

export interface GameObject {
  id: string
  name: string
  type: 'door' | 'container' | 'item' | 'clue'
  description: string
  interaction: string
  requiredItem?: string
  result: string
}

export interface NPC {
  id: string
  name: string
  description: string
  dialogues: Dialogue[]
  clues: string[]
}

export interface Dialogue {
  id: string
  text: string
  nextDialogue?: string
  givesItem?: string
  givesClue?: string
}

// 游戏场景数据
export const gameScenes: Scene[] = [
  {
    id: 'corridor_1f',
    name: '教学楼 - 一楼走廊',
    description: '昏暗的走廊，墙上挂着老旧的画框，空气中弥漫着霉味...',
    objects: [
      {
        id: 'classroom_door',
        name: '教室门',
        type: 'door',
        description: '一扇紧闭的教室门，上面有锈迹斑斑的锁',
        interaction: '尝试打开教室门',
        requiredItem: '旧钥匙',
        result: '门打开了！里面传来奇怪的声音...'
      },
      {
        id: 'locker',
        name: '储物柜',
        type: 'container',
        description: '一个生锈的储物柜，编号为13',
        interaction: '检查储物柜',
        result: '在储物柜里找到了一把旧钥匙'
      },
      {
        id: 'notice_board',
        name: '公告栏',
        type: 'clue',
        description: '学校的公告栏，贴满了各种通知',
        interaction: '阅读公告',
        result: '公告上写着：最近有学生失踪，请各位同学注意安全'
      },
      {
        id: 'stairs',
        name: '楼梯',
        type: 'door',
        description: '通往二楼的楼梯，上面布满了灰尘',
        interaction: '上楼',
        result: '楼梯发出吱呀声，上面似乎有什么东西在动...'
      }
    ],
    npcs: [
      {
        id: 'janitor',
        name: '老校工',
        description: '一个看起来疲惫的老校工，正在打扫卫生',
        dialogues: [
          {
            id: 'dialogue_1',
            text: '这么晚了还在学校？最近不太平，早点回家吧。',
            nextDialogue: 'dialogue_2',
            givesClue: '校工提到最近有奇怪的事情发生'
          },
          {
            id: 'dialogue_2',
            text: '我听说13号储物柜里有些奇怪的东西...',
            givesItem: '储物柜钥匙提示'
          }
        ],
        clues: ['校工似乎知道些什么']
      }
    ],
    clues: [
      '走廊的监控摄像头似乎坏了',
      '墙上有一道奇怪的划痕',
      '空气中弥漫着淡淡的消毒水味道'
    ]
  },
  {
    id: 'classroom_1f',
    name: '101教室',
    description: '空荡荡的教室，桌椅摆放整齐，但总觉得有人在看着你...',
    objects: [
      {
        id: 'teacher_desk',
        name: '讲台',
        type: 'container',
        description: '老师的讲台，上面放着粉笔和教案',
        interaction: '检查讲台',
        result: '在教案中发现了一张奇怪的照片'
      },
      {
        id: 'student_desk',
        name: '学生课桌',
        type: 'container',
        description: '一张普通的课桌，上面刻着名字',
        interaction: '检查课桌',
        result: '在抽屉里发现了一本日记'
      },
      {
        id: 'blackboard',
        name: '黑板',
        type: 'clue',
        description: '黑板上写着未擦干净的数学公式',
        interaction: '查看黑板',
        result: '公式下面似乎隐藏着其他文字'
      }
    ],
    npcs: [],
    clues: [
      '教室的时钟停在午夜12点',
      '窗户外面似乎有人影闪过',
      '听到远处传来的脚步声'
    ]
  },
  {
    id: 'library',
    name: '图书馆',
    description: '寂静的图书馆，书架上的书散发着陈旧的气息...',
    objects: [
      {
        id: 'ancient_books',
        name: '古籍区',
        type: 'clue',
        description: '存放着古老的书籍，有些书页已经发黄',
        interaction: '查阅古籍',
        result: '在一本古籍中发现了一张神秘的地图'
      },
      {
        id: 'study_table',
        name: '学习桌',
        type: 'container',
        description: '一张布满灰尘的学习桌',
        interaction: '检查学习桌',
        result: '在抽屉里找到了一本学生的笔记'
      },
      {
        id: 'restricted_section',
        name: '禁书区',
        type: 'door',
        description: '被锁住的禁书区，需要特殊权限才能进入',
        interaction: '尝试进入禁书区',
        requiredItem: '管理员钥匙',
        result: '禁书区里藏着学校的秘密档案'
      }
    ],
    npcs: [
      {
        id: 'librarian',
        name: '图书管理员',
        description: '一位严肃的图书管理员，似乎知道很多秘密',
        dialogues: [
          {
            id: 'lib_dialogue_1',
            text: '这里不欢迎外人，请离开。',
            nextDialogue: 'lib_dialogue_2',
            givesClue: '管理员态度异常强硬'
          },
          {
            id: 'lib_dialogue_2',
            text: '除非你有校长的许可...',
            givesItem: '校长办公室线索'
          }
        ],
        clues: ['管理员似乎隐瞒着什么']
      }
    ],
    clues: [
      '图书馆的监控摄像头被故意遮挡',
      '某些书籍被标记为"失踪"',
      '闻到一股奇怪的香味'
    ]
  },
  {
    id: 'principal_office',
    name: '校长办公室',
    description: '豪华的办公室，墙上挂着历任校长的照片...',
    objects: [
      {
        id: 'desk',
        name: '办公桌',
        type: 'container',
        description: '校长的办公桌，上面放着各种文件',
        interaction: '搜查办公桌',
        result: '发现了一份关于学生失踪的机密文件'
      },
      {
        id: 'safe',
        name: '保险柜',
        type: 'container',
        description: '一个老式保险柜，需要密码才能打开',
        interaction: '尝试打开保险柜',
        requiredItem: '保险柜密码',
        result: '保险柜里藏着最终的真相'
      },
      {
        id: 'photo_wall',
        name: '照片墙',
        type: 'clue',
        description: '墙上挂着学校的历史照片',
        interaction: '查看照片',
        result: '发现一张照片中的人物与失踪学生很像'
      }
    ],
    npcs: [],
    clues: [
      '办公室的窗户被木板封死',
      '闻到浓重的消毒水味道',
      '听到奇怪的敲击声'
    ]
  }
]

// 游戏物品数据
export const gameItems = {
  'old_key': {
    name: '旧钥匙',
    description: '一把生锈的旧钥匙，上面刻着数字13',
    usage: '可以打开13号储物柜'
  },
  'diary': {
    name: '日记本',
    description: '一个学生的日记本，记录着学校的秘密',
    usage: '阅读可以获得重要线索'
  },
  'photo': {
    name: '照片',
    description: '一张奇怪的照片，上面的人影模糊不清',
    usage: '可能是重要证据'
  },
  'map': {
    name: '神秘地图',
    description: '一张标记着学校秘密通道的地图',
    usage: '可以找到隐藏的通道'
  },
  'notes': {
    name: '学生笔记',
    description: '记录着学校异常现象的笔记',
    usage: '包含重要线索'
  },
  'admin_key': {
    name: '管理员钥匙',
    description: '可以打开禁书区的钥匙',
    usage: '进入图书馆禁书区'
  },
  'safe_code': {
    name: '保险柜密码',
    description: '校长保险柜的密码',
    usage: '打开校长办公室的保险柜'
  },
  'final_clue': {
    name: '最终线索',
    description: '揭开真相的关键证据',
    usage: '完成游戏的必要物品'
  }
}

// 游戏成就系统
export const achievements = [
  {
    id: 'first_clue',
    name: '第一滴血',
    description: '找到第一个线索',
    icon: '🔍'
  },
  {
    id: 'key_finder',
    name: '钥匙大师',
    description: '找到所有隐藏的钥匙',
    icon: '🔑'
  },
  {
    id: 'truth_seeker',
    name: '真相追寻者',
    description: '解开所有谜题',
    icon: '🎯'
  }
]
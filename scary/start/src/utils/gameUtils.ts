// 游戏工具函数

// 生成随机恐怖事件
export const generateHorrorEvent = (): string => {
  const events = [
    '你听到远处传来脚步声...',
    '灯光突然闪烁了一下...',
    '感觉有人在背后看着你...',
    '听到微弱的哭泣声...',
    '温度突然下降了...',
    '看到墙上有影子闪过...',
    '闻到一股奇怪的味道...',
    '书本突然从书架上掉下来...'
  ]
  return events[Math.floor(Math.random() * events.length)]
}

// 检查游戏进度
export const checkGameProgress = (clues: string[], inventory: string[]) => {
  const totalClues = 20 // 总线索数
  const progress = (clues.length / totalClues) * 100
  
  if (progress >= 80 && inventory.includes('最终线索')) {
    return '游戏即将完成！真相就在眼前...'
  } else if (progress >= 50) {
    return '调查进展顺利，继续寻找线索...'
  } else if (progress >= 25) {
    return '刚开始调查，还有很多秘密等待发现...'
  } else {
    return '刚刚开始探索，保持警惕...'
  }
}

// 格式化游戏时间
export const formatGameTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}小时${mins}分钟`
}

// 验证物品使用
export const validateItemUsage = (itemName: string, target: string): boolean => {
  const validCombinations: Record<string, string[]> = {
    '旧钥匙': ['教室门', '13号储物柜'],
    '管理员钥匙': ['禁书区'],
    '保险柜密码': ['保险柜'],
    '神秘地图': ['古籍区']
  }
  
  return validCombinations[itemName]?.includes(target) || false
}

// 计算游戏评分
export const calculateGameScore = (clues: string[], inventory: string[], playTime: number): number => {
  const clueScore = clues.length * 10
  const itemScore = inventory.length * 5
  const timeBonus = Math.max(0, 100 - playTime) // 时间越短分数越高
  
  return clueScore + itemScore + timeBonus
}

// 生成谜题提示
export const generatePuzzleHint = (puzzleType: string): string => {
  const hints: Record<string, string> = {
    'door': '检查周围环境，也许钥匙就在附近...',
    'container': '仔细搜索每个角落，不要错过任何细节...',
    'clue': '注意观察异常现象，它们可能指向重要线索...',
    'npc': '尝试不同的对话选项，每个人都有自己的秘密...'
  }
  
  return hints[puzzleType] || '保持冷静，仔细观察...'
}

// 保存游戏数据到本地存储
export const saveGameData = (gameState: any): void => {
  try {
    const saveData = {
      ...gameState,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
    localStorage.setItem('scary_campus_save', JSON.stringify(saveData))
  } catch (error) {
    console.error('保存游戏失败:', error)
  }
}

// 从本地存储加载游戏数据
export const loadGameData = (): any | null => {
  try {
    const saveData = localStorage.getItem('scary_campus_save')
    if (saveData) {
      return JSON.parse(saveData)
    }
  } catch (error) {
    console.error('加载游戏失败:', error)
  }
  return null
}
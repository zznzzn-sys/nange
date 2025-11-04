import React, { useState, useEffect } from 'react'
import { gameScenes, gameItems } from './data/gameData'
import { soundManager } from './utils/soundManager'
import './App.css'

// 调试：检查导入是否成功
console.log('App.tsx 开始执行')
console.log('gameScenes:', gameScenes)
console.log('gameItems:', gameItems)
console.log('soundManager:', soundManager)

interface GameState {
  currentSceneId: string
  inventory: string[]
  clues: string[]
  currentDialogue: string | null
  isGameStarted: boolean
  achievements: string[]
  playTime: number
  horrorEvents: string[]
  gameCompleted: boolean
}

function App() {
  console.log('App组件渲染开始')
  
  const [gameState, setGameState] = useState<GameState>({
    currentSceneId: 'home',
    inventory: [],
    clues: [],
    currentDialogue: null,
    isGameStarted: false,
    achievements: [],
    playTime: 0,
    horrorEvents: [],
    gameCompleted: false
  })

  console.log('gameState:', gameState)

  const [isMuted, setIsMuted] = useState(false)
  const [showHorrorEvent, setShowHorrorEvent] = useState(false)
  const [currentHorrorEvent, setCurrentHorrorEvent] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showStory, setShowStory] = useState(false)

  useEffect(() => {
    // 初始化音效系统
    soundManager.preloadSounds()
    
    // 游戏计时器
    const timer = setInterval(() => {
      if (gameState.isGameStarted && !gameState.gameCompleted) {
        setGameState(prev => ({ ...prev, playTime: prev.playTime + 1 }))
      }
    }, 60000) // 每分钟更新一次

    // 随机恐怖事件
    const horrorTimer = setInterval(() => {
      if (gameState.isGameStarted && !gameState.gameCompleted && Math.random() < 0.3) {
        const events = [
          '你听到远处传来脚步声...',
          '灯光突然闪烁了一下...',
          '感觉有人在背后看着你...',
          '听到微弱的哭泣声...',
          '温度突然下降了...',
          '看到墙上有影子闪过...'
        ]
        const event = events[Math.floor(Math.random() * events.length)]
        setCurrentHorrorEvent(event)
        setShowHorrorEvent(true)
        setTimeout(() => setShowHorrorEvent(false), 3000)
        
        setGameState(prev => ({
          ...prev,
          horrorEvents: [...prev.horrorEvents, event]
        }))
      }
    }, 30000) // 每30秒可能触发一次

    return () => {
      clearInterval(timer)
      clearInterval(horrorTimer)
    }
  }, [gameState.isGameStarted, gameState.gameCompleted])

  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      currentSceneId: 'corridor_1f',
      isGameStarted: true
    }))
    soundManager.playSound('click')
    // 在用户交互后启动背景音乐
    soundManager.playBackgroundMusic(0.3)
  }

  const backToHome = () => {
    setGameState({
      currentSceneId: 'home',
      inventory: [],
      clues: [],
      currentDialogue: null,
      isGameStarted: false,
      achievements: [],
      playTime: 0,
      horrorEvents: [],
      gameCompleted: false
    })
    soundManager.playSound('click')
    // 在用户交互后启动背景音乐
    soundManager.playBackgroundMusic(0.3)
  }

  const addToInventory = (itemId: string) => {
    const item = gameItems[itemId as keyof typeof gameItems]
    if (item && !gameState.inventory.includes(item.name)) {
      setGameState(prev => ({
        ...prev,
        inventory: [...prev.inventory, item.name]
      }))
      soundManager.playSound('discover', 0.7)
      addClue(`获得了物品: ${item.name}`)
      
      // 检查成就
      if (gameState.inventory.length === 0) {
        addAchievement('first_clue')
      }
      if (gameState.inventory.filter(i => i.includes('钥匙')).length >= 3) {
        addAchievement('key_finder')
      }
    }
  }

  const addAchievement = (achievementId: string) => {
    if (!gameState.achievements.includes(achievementId)) {
      setGameState(prev => ({
        ...prev,
        achievements: [...prev.achievements, achievementId]
      }))
      soundManager.playSound('discover', 1.0)
    }
  }

  const addClue = (clue: string) => {
    if (!gameState.clues.includes(clue)) {
      setGameState(prev => ({
        ...prev,
        clues: [...prev.clues, clue]
      }))
      soundManager.playSound('discover', 0.5)
      
      // 检查游戏完成条件
      if (gameState.clues.length >= 15 && gameState.inventory.includes('最终线索')) {
        completeGame()
      }
      
      // 检查成就
      if (gameState.clues.length === 1) {
        addAchievement('first_clue')
      }
      if (gameState.clues.length >= 10) {
        addAchievement('truth_seeker')
      }
    }
  }

  const completeGame = () => {
    setGameState(prev => ({
      ...prev,
      gameCompleted: true
    }))
    soundManager.playSound('discover', 1.0)
  }

  const interactWithObject = (object: any) => {
    soundManager.playSound('click')
    
    if (object.requiredItem) {
      const hasItem = gameState.inventory.includes(object.requiredItem)
      if (hasItem) {
        addClue(object.result)
        if (object.givesItem) {
          // 直接使用物品名称而不是ID
          const itemName = gameItems[object.givesItem as keyof typeof gameItems]?.name
          if (itemName) {
            addToInventory(object.givesItem)
          }
        }
        // 特殊场景切换逻辑
        if (object.id === 'classroom_door' && hasItem) {
          setTimeout(() => {
            changeScene('classroom_1f')
            addClue('进入了101教室...')
          }, 1000)
        }
        if (object.id === 'stairs') {
          setTimeout(() => {
            changeScene('library')
            addClue('来到了图书馆...')
          }, 1000)
        }
      } else {
        addClue(object.description + ' - 需要' + object.requiredItem)
      }
    } else {
      addClue(object.result)
      if (object.givesItem) {
        // 直接使用物品名称而不是ID
        const itemName = gameItems[object.givesItem as keyof typeof gameItems]?.name
        if (itemName) {
          addToInventory(object.givesItem)
        }
      }
      // 特殊物品触发场景切换
      if (object.id === 'ancient_books' && gameState.inventory.includes('神秘地图')) {
        setTimeout(() => {
          changeScene('principal_office')
          addClue('根据地图找到了校长办公室的秘密入口...')
        }, 1500)
      }
      // 其他特殊交互
      if (object.id === 'restricted_section' && gameState.inventory.includes('管理员钥匙')) {
        setTimeout(() => {
          addClue('成功进入了禁书区，发现了重要文件...')
          addToInventory('final_clue')
        }, 1000)
      }
      if (object.id === 'safe' && gameState.inventory.includes('保险柜密码')) {
        setTimeout(() => {
          addClue('保险柜打开了！里面藏着最终的真相...')
          addToInventory('final_clue')
        }, 1000)
      }
    }
  }

  const changeScene = (sceneId: string) => {
    console.log('=== 开始场景切换 ===')
    console.log('目标场景ID:', sceneId)
    console.log('当前场景ID:', gameState.currentSceneId)
    
    // 检查场景是否存在
    const targetScene = gameScenes.find(scene => scene.id === sceneId)
    console.log('找到的目标场景:', targetScene)
    console.log('所有可用场景ID:', gameScenes.map(s => s.id))
    
    if (!targetScene) {
      console.error('❌ 场景不存在:', sceneId)
      addClue(`无法进入场景: ${sceneId}`)
      return
    }
    
    // 播放音效
    soundManager.playSound('door_open')
    
    // 使用函数式更新确保状态正确更新
    setGameState(prevState => {
      console.log('更新前的状态:', prevState.currentSceneId)
      const newState = {
        ...prevState,
        currentSceneId: sceneId
      }
      console.log('更新后的状态:', newState.currentSceneId)
      return newState
    })
    
    // 添加场景切换线索
    addClue(`进入了${targetScene.name}...`)
    console.log('✅ 场景切换完成:', sceneId)
  }

  const saveGame = () => {
    const saveData = {
      ...gameState,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('scary_campus_save', JSON.stringify(saveData))
    addClue('游戏已保存')
    soundManager.playSound('discover')
  }

  const loadGame = () => {
    const saveData = localStorage.getItem('scary_campus_save')
    if (saveData) {
      const loadedState = JSON.parse(saveData)
      setGameState(loadedState)
      addClue('游戏已加载')
      soundManager.playSound('discover')
    } else {
      addClue('没有找到保存的游戏')
    }
  }

  const toggleMute = () => {
    const muted = soundManager.toggleMute()
    setIsMuted(muted)
    soundManager.playSound('click')
  }

  const toggleSettings = () => {
    setShowSettings(!showSettings)
    soundManager.playSound('click')
  }

  const toggleAchievements = () => {
    setShowAchievements(!showAchievements)
    soundManager.playSound('click')
  }

  const toggleStory = () => {
    setShowStory(!showStory)
    soundManager.playSound('click')
  }

  const achievements = [
    { id: 'first_clue', name: '第一滴血', description: '找到第一条线索', unlocked: gameState.clues.length > 0 },
    { id: 'collector', name: '收藏家', description: '收集5件物品', unlocked: gameState.inventory.length >= 5 },
    { id: 'explorer', name: '探索者', description: '访问所有场景', unlocked: false },
    { id: 'detective', name: '侦探', description: '找到10条线索', unlocked: gameState.clues.length >= 10 }
  ]

  const currentScene = gameScenes.find(scene => scene.id === gameState.currentSceneId)

  // 调试信息
  console.log('=== 组件渲染调试信息 ===')
  console.log('当前场景ID:', gameState.currentSceneId)
  console.log('找到的场景:', currentScene)
  console.log('所有场景ID:', gameScenes.map(s => s.id))
  console.log('当前场景对象:', currentScene)
  console.log('=== 调试信息结束 ===')

  // 主菜单界面
  if (gameState.currentSceneId === 'home') {
    console.log('显示主菜单')
    return (
      <div className="app" style={{ minHeight: '100vh', overflow: 'auto' }}>
        <div className="terror-bg" style={{ minHeight: '100vh', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          <div className="main-menu flicker" style={{ 
            background: 'rgba(0, 0, 0, 0.9)', 
            padding: '2rem', 
            borderRadius: '15px', 
            border: '2px solid #8b0000', 
            textAlign: 'center',
            maxWidth: '600px',
            width: '90%',
            margin: '3rem auto 2rem auto',
            overflow: 'visible'
          }}>
            <h1 className="game-title terror-text" style={{ color: '#8b0000', fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: '0' }}>恐怖校园</h1>
            <p className="game-description" style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '1.5rem', marginTop: '0' }}>探索真相，揭开校园的秘密...</p>
            
            <div className="menu-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <button className="menu-button terror-button" onClick={startGame} style={{ padding: '1rem 2rem', background: 'linear-gradient(45deg, #8b0000, #dc143c)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>
                🎮 开始游戏
              </button>
              <button className="menu-button terror-button" onClick={loadGame} style={{ padding: '1rem 2rem', background: 'linear-gradient(45deg, #8b0000, #dc143c)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>
                🔄 继续游戏
              </button>
              <button className="menu-button terror-button" onClick={toggleSettings} style={{ padding: '1rem 2rem', background: 'linear-gradient(45deg, #8b0000, #dc143c)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>
                ⚙️ 游戏设置
              </button>
              <button className="menu-button terror-button" onClick={toggleAchievements} style={{ padding: '1rem 2rem', background: 'linear-gradient(45deg, #8b0000, #dc143c)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>
                🏆 成就系统
              </button>
              <button className="menu-button terror-button" onClick={toggleStory} style={{ padding: '1rem 2rem', background: 'linear-gradient(45deg, #8b0000, #dc143c)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>
                📖 故事背景
              </button>
              <button className="menu-button terror-button" onClick={toggleMute} style={{ padding: '1rem 2rem', background: 'linear-gradient(45deg, #8b0000, #dc143c)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>
                {isMuted ? '🔇 取消静音' : '🔊 静音'}
              </button>
              <button className="menu-button terror-button" onClick={saveGame} style={{ padding: '1rem 2rem', background: 'linear-gradient(45deg, #8b0000, #dc143c)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>
                💾 保存游戏
              </button>
            </div>
            
            <div className="game-info" style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              <h3 style={{ color: '#8b0000', marginBottom: '1rem', borderBottom: '1px solid #8b0000', paddingBottom: '0.5rem' }}>游戏特点:</h3>
              <ul style={{ listStyle: 'none', padding: '0' }}>
                <li style={{ padding: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>🔍 探索式解谜玩法</li>
                <li style={{ padding: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>🎭 剧本杀式剧情推进</li>
                <li style={{ padding: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>🎵 沉浸式音效体验</li>
                <li style={{ padding: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>📖 丰富的故事线索</li>
                <li style={{ padding: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>👻 恐怖氛围营造</li>
                <li style={{ padding: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>🎮 多结局系统</li>
              </ul>
            </div>

            {/* 设置模态窗口 */}
            {showSettings && (
              <div className="modal-overlay" onClick={toggleSettings}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h3>⚙️ 游戏设置</h3>
                  <div className="setting-item">
                    <label>音效音量</label>
                    <input type="range" min="0" max="100" defaultValue="80" />
                  </div>
                  <div className="setting-item">
                    <label>恐怖效果强度</label>
                    <input type="range" min="0" max="100" defaultValue="60" />
                  </div>
                  <div className="setting-item">
                    <label>自动保存</label>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <button className="modal-close" onClick={toggleSettings}>关闭</button>
                </div>
              </div>
            )}

            {/* 成就模态窗口 */}
            {showAchievements && (
              <div className="modal-overlay" onClick={toggleAchievements}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h3>🏆 成就系统</h3>
                  <div className="achievements-list">
                    {achievements.map(achievement => (
                      <div key={achievement.id} className={`achievement ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
                        <span className="achievement-icon">
                          {achievement.unlocked ? '✅' : '🔒'}
                        </span>
                        <div className="achievement-info">
                          <h4>{achievement.name}</h4>
                          <p>{achievement.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="modal-close" onClick={toggleAchievements}>关闭</button>
                </div>
              </div>
            )}

            {/* 故事背景模态窗口 */}
            {showStory && (
              <div className="modal-overlay" onClick={toggleStory}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h3>📖 故事背景</h3>
                  <div className="story-content">
                    <p>深夜的校园，月光透过窗户洒在空荡的走廊上...</p>
                    <p>十年前，这所学校发生了一起神秘的失踪案件。据说每到午夜，走廊里就会传来脚步声...</p>
                    <p>作为转校生的你，意外发现了这个秘密。现在，你必须揭开真相，否则...</p>
                    <p>探索校园的每个角落，收集线索，解开谜题，找到最终的答案。</p>
                  </div>
                  <button className="modal-close" onClick={toggleStory}>关闭</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 游戏场景界面
  if (currentScene) {
    return (
      <div className="app">
        <div className="game-scene terror-bg">
          <div className="game-header">
            <div className="header-left">
              <button className="back-button" onClick={backToHome}>返回主菜单</button>
              <button className="save-button" onClick={saveGame}>💾 保存</button>
            </div>
            <h2 className="scene-title">{currentScene.name}</h2>
            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                className="mute-button" 
                onClick={toggleMute}
                style={{ 
                  background: '#333', 
                  border: '1px solid #8b0000', 
                  padding: '8px 12px', 
                  borderRadius: '4px', 
                  color: 'white', 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              
              {/* 场景导航按钮组 */}
              <div className="scene-nav" style={{ 
                display: 'flex', 
                gap: '8px', 
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #8b0000'
              }}>
                <SceneNavButton 
                  sceneId="corridor_1f"
                  currentSceneId={gameState.currentSceneId}
                  label="🚪 走廊"
                  onClick={changeScene}
                />
                <SceneNavButton 
                  sceneId="classroom_1f"
                  currentSceneId={gameState.currentSceneId}
                  label="🏫 教室"
                  onClick={changeScene}
                />
                <SceneNavButton 
                  sceneId="library"
                  currentSceneId={gameState.currentSceneId}
                  label="📚 图书馆"
                  onClick={changeScene}
                />
                <SceneNavButton 
                  sceneId="principal_office"
                  currentSceneId={gameState.currentSceneId}
                  label="🏢 校长室"
                  onClick={changeScene}
                />
              </div>
            </div>
          </div>
          
          <div className="game-content">
            <div className="game-area">
              <div className="scene-description">
                <p>{currentScene.description}</p>
              </div>
              
              <div className="interactive-objects">
                {currentScene.objects.map((object, index) => (
                  <div 
                    key={object.id}
                    className={`object ${object.type}`}
                    onClick={() => interactWithObject(object)}
                  >
                    <span>{object.name}</span>
                    <div className="object-tooltip">{object.description}</div>
                  </div>
                ))}
                
                {currentScene.npcs.map((npc, index) => (
                  <div 
                    key={npc.id}
                    className="object npc"
                    onClick={() => {
                      const firstDialogue = npc.dialogues[0]
                      addClue(`与${npc.name}对话: ${firstDialogue.text}`)
                      soundManager.playSound('click')
                      
                      // 处理对话结果
                      if (firstDialogue.givesItem) {
                        addToInventory(firstDialogue.givesItem)
                      }
                      if (firstDialogue.givesClue) {
                        addClue(firstDialogue.givesClue)
                      }
                    }}
                  >
                    <span>{npc.name}</span>
                    <div className="object-tooltip">{npc.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="game-ui">
              <div className="inventory-panel">
                <h3>📦 物品栏</h3>
                <div className="inventory-items">
                  {gameState.inventory.map((item, index) => (
                    <div key={index} className="inventory-item">
                      {item}
                    </div>
                  ))}
                  {gameState.inventory.length === 0 && (
                    <div className="empty-inventory">暂无物品</div>
                  )}
                </div>
              </div>
              
              <div className="clues-panel">
                <h3>🔍 线索 ({gameState.clues.length}/15)</h3>
                <div className="clues-list">
                  {gameState.clues.map((clue, index) => (
                    <div key={index} className="clue-item">
                      {clue}
                    </div>
                  ))}
                  {gameState.clues.length === 0 && (
                    <div className="empty-clues">暂无线索</div>
                  )}
                </div>
              </div>
              
              <div className="progress-panel">
                <h3>📊 游戏进度</h3>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(gameState.clues.length / 15) * 100}%` }}
                  ></div>
                </div>
                <div className="progress-stats">
                  <span>线索: {gameState.clues.length}/15</span>
                  <span>物品: {gameState.inventory.length}</span>
                  <span>时间: {Math.floor(gameState.playTime / 60)}小时{gameState.playTime % 60}分钟</span>
                </div>
              </div>
            </div>
          </div>

          {showHorrorEvent && (
            <div className="horror-event-notification">
              <span>{currentHorrorEvent}</span>
            </div>
          )}

          {gameState.gameCompleted && (
            <div className="game-completed-overlay">
              <div className="game-completed-content">
                <h2>🎉 游戏完成！</h2>
                <p>恭喜你揭开了校园的秘密！</p>
                <div className="completion-stats">
                  <p>总游戏时间: {Math.floor(gameState.playTime / 60)}小时{gameState.playTime % 60}分钟</p>
                  <p>收集线索: {gameState.clues.length}条</p>
                  <p>获得物品: {gameState.inventory.length}件</p>
                  <p>解锁成就: {gameState.achievements.length}个</p>
                </div>
                <button className="back-to-menu-button" onClick={backToHome}>
                  返回主菜单
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 错误处理：如果currentSceneId既不是'home'也找不到对应的场景
  return (
    <div className="app">
      <div className="error-page terror-bg">
        <div className="error-content">
          <h1 className="error-title">❌ 场景错误</h1>
          <p>找不到场景: {gameState.currentSceneId}</p>
          <button className="error-button" onClick={backToHome}>
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  )
}

// 场景导航按钮组件
interface SceneNavButtonProps {
  sceneId: string
  currentSceneId: string
  label: string
  onClick: (sceneId: string) => void
}

const SceneNavButton: React.FC<SceneNavButtonProps> = ({ 
  sceneId, 
  currentSceneId, 
  label, 
  onClick 
}) => {
  const isActive = currentSceneId === sceneId
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log(`🔄 点击场景按钮: ${sceneId}`)
    console.log(`当前场景: ${currentSceneId}`)
    console.log(`目标场景: ${sceneId}`)
    console.log(`按钮是否激活: ${isActive}`)
    
    // 确保点击事件被正确处理
    setTimeout(() => {
      onClick(sceneId)
    }, 10)
  }
  
  return (
    <button 
      onClick={handleClick}
      className={`nav-button ${isActive ? 'active' : ''}`}
      style={{ 
        background: isActive ? '#8b0000' : '#333',
        border: '1px solid #8b0000',
        padding: '8px 12px',
        borderRadius: '4px',
        color: 'white',
        cursor: 'pointer',
        fontSize: '12px',
        minWidth: '70px',
        transition: 'all 0.3s ease',
        opacity: isActive ? 1 : 0.8,
        zIndex: 1000,
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1'
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = isActive ? '1' : '0.8'
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {label}
    </button>
  )
}

export default App
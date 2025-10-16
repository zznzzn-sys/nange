import React, { useState, useEffect } from 'react'
import { gameScenes, gameItems } from './data/gameData'
import { soundManager } from './utils/soundManager'
import './App.css'

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

  const [isMuted, setIsMuted] = useState(false)
  const [showHorrorEvent, setShowHorrorEvent] = useState(false)
  const [currentHorrorEvent, setCurrentHorrorEvent] = useState('')

  useEffect(() => {
    // 初始化音效系统
    soundManager.preloadSounds()
    soundManager.playBackgroundMusic(0.3)
    
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
  }

  const backToHome = () => {
    setGameState({
      currentSceneId: 'home',
      inventory: [],
      clues: [],
      currentDialogue: null,
      isGameStarted: false
    })
    soundManager.playSound('click')
  }

  const addToInventory = (itemId: string) => {
    const item = gameItems[itemId as keyof typeof gameItems]
    if (item && !gameState.inventory.includes(item.name)) {
      setGameState(prev => ({
        ...prev,
        inventory: [...prev.inventory, item.name]
      }))
      soundManager.playSound('discover', 0.7)
      
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
          addToInventory(object.givesItem)
        }
        // 特殊场景切换逻辑
        if (object.id === 'classroom_door' && hasItem) {
          setTimeout(() => {
            setGameState(prev => ({
              ...prev,
              currentSceneId: 'classroom_1f'
            }))
            addClue('进入了101教室...')
          }, 1000)
        }
        if (object.id === 'stairs') {
          setTimeout(() => {
            setGameState(prev => ({
              ...prev,
              currentSceneId: 'library'
            }))
            addClue('来到了图书馆...')
          }, 1000)
        }
      } else {
        addClue(object.description + ' - 需要' + object.requiredItem)
      }
    } else {
      addClue(object.result)
      if (object.givesItem) {
        addToInventory(object.givesItem)
      }
      // 特殊物品触发场景切换
      if (object.id === 'ancient_books' && gameState.inventory.includes('神秘地图')) {
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            currentSceneId: 'principal_office'
          }))
          addClue('根据地图找到了校长办公室的秘密入口...')
        }, 1500)
      }
    }
  }

  const changeScene = (sceneId: string) => {
    soundManager.playSound('door_open')
    setGameState(prev => ({
      ...prev,
      currentSceneId: sceneId
    }))
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

  const currentScene = gameScenes.find(scene => scene.id === gameState.currentSceneId)

  if (gameState.currentSceneId === 'home') {
    return (
      <div className="app">
        <div className="home-page terror-bg">
          <div className="main-menu flicker">
            <h1 className="game-title terror-text">恐怖校园</h1>
            <p className="game-description">探索真相，揭开校园的秘密...</p>
            
            <div className="menu-buttons">
              <button className="menu-button terror-button" onClick={startGame}>
                开始游戏
              </button>
              <button className="menu-button terror-button" onClick={loadGame}>
                继续游戏
              </button>
              <button className="menu-button terror-button" onClick={toggleMute}>
                {isMuted ? '🔇 取消静音' : '🔊 静音'}
              </button>
              <button className="menu-button terror-button" onClick={saveGame}>
                💾 保存游戏
              </button>
            </div>
            
            <div className="game-info">
              <h3>游戏特点:</h3>
              <ul>
                <li>🔍 探索式解谜玩法</li>
                <li>🎭 剧本杀式剧情推进</li>
                <li>🎵 沉浸式音效体验</li>
                <li>📖 丰富的故事线索</li>
                <li>👻 恐怖氛围营造</li>
                <li>🎮 多结局系统</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
            <div className="header-right">
              <button className="mute-button" onClick={toggleMute}>
                {isMuted ? '🔇' : '🔊'}
              </button>
              <div className="scene-nav">
                <button 
                  className="nav-button" 
                  onClick={() => changeScene('corridor_1f')}
                  disabled={currentScene.id === 'corridor_1f'}
                >
                  走廊
                </button>
                <button 
                  className="nav-button" 
                  onClick={() => changeScene('classroom_1f')}
                  disabled={currentScene.id === 'classroom_1f'}
                >
                  教室
                </button>
                <button 
                  className="nav-button" 
                  onClick={() => changeScene('library')}
                  disabled={currentScene.id === 'library'}
                >
                  图书馆
                </button>
                <button 
                  className="nav-button" 
                  onClick={() => changeScene('principal_office')}
                  disabled={currentScene.id === 'principal_office'}
                >
                  校长室
                </button>
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
                    onClick={() => addClue(`与${npc.name}对话: ${npc.dialogues[0].text}`)}
                  >
                    <span>{npc.name}</span>
                    <div className="object-tooltip">{npc.description}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="game-ui">
              <div className="inventory-panel">
                <h3>📦 物品栏 ({gameState.inventory.length}/10)</h3>
                <div className="inventory-items">
                  {gameState.inventory.map((item, index) => (
                    <div key={index} className="inventory-item">
                      {item}
                    </div>
                  ))}
                  {gameState.inventory.length === 0 && (
                    <div className="empty-message">物品栏为空</div>
                  )}
                </div>
              </div>
              
              <div className="clues-panel">
                <h3>🔍 线索 ({gameState.clues.length})</h3>
                <div className="clues-list">
                  {gameState.clues.map((clue, index) => (
                    <div key={index} className="clue-item">
                      {clue}
                    </div>
                  ))}
                  {gameState.clues.length === 0 && (
                    <div className="empty-message">暂无线索</div>
                  )}
                </div>
              </div>

              <div className="progress-panel">
                <h3>📊 游戏进度</h3>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(gameState.clues.length / 20) * 100}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  线索收集: {gameState.clues.length}/20
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 恐怖事件提示 */}
        {showHorrorEvent && (
          <div className="horror-event-notification">
            <div className="horror-event-content">
              <span className="horror-icon">👻</span>
              <p>{currentHorrorEvent}</p>
            </div>
          </div>
        )}

        {/* 游戏完成界面 */}
        {gameState.gameCompleted && (
          <div className="game-completion-overlay">
            <div className="completion-modal">
              <h2>🎉 游戏完成！</h2>
              <p>你成功揭开了校园的秘密！</p>
              
              <div className="completion-stats">
                <div className="stat">
                  <span>游戏时间:</span>
                  <span>{Math.floor(gameState.playTime / 60)}小时{gameState.playTime % 60}分钟</span>
                </div>
                <div className="stat">
                  <span>收集线索:</span>
                  <span>{gameState.clues.length}/20</span>
                </div>
                <div className="stat">
                  <span>获得物品:</span>
                  <span>{gameState.inventory.length}/8</span>
                </div>
                <div className="stat">
                  <span>解锁成就:</span>
                  <span>{gameState.achievements.length}/3</span>
                </div>
              </div>

              <div className="completion-actions">
                <button className="menu-button terror-button" onClick={backToHome}>
                  返回主菜单
                </button>
                <button className="menu-button terror-button" onClick={() => window.location.reload()}>
                  重新开始
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="app">
      <div className="error-page terror-bg">
        <div className="error-message">
          <h2>场景加载错误</h2>
          <p>无法找到场景: {gameState.currentSceneId}</p>
          <button className="back-button" onClick={backToHome}>返回主菜单</button>
        </div>
      </div>
    </div>
  )
}

export default App
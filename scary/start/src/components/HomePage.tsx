import React from 'react'
import './HomePage.css'

function HomePage() {
  const startGame = () => {
    alert('游戏即将开始...')
  }

  return (
    <div className="home-page terror-bg">
      <div className="main-menu flicker">
        <h1 className="game-title terror-text">恐怖校园</h1>
        <p className="game-description">探索真相，揭开校园的秘密...</p>
        
        <div className="menu-buttons">
          <button className="menu-button terror-button" onClick={startGame}>
            开始游戏
          </button>
          <button className="menu-button terror-button">
            继续游戏
          </button>
          <button className="menu-button terror-button">
            设置
          </button>
        </div>
        
        <div className="game-info">
          <h3>游戏特点:</h3>
          <ul>
            <li>🔍 探索式解谜玩法</li>
            <li>🎭 剧本杀式剧情推进</li>
            <li>🎵 沉浸式音效体验</li>
            <li>📖 丰富的故事线索</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default HomePage
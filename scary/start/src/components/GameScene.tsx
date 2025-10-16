import React from 'react'
import './GameScene.css'

function GameScene() {
  return (
    <div className="game-scene">
      <div className="game-container">
        <h2>游戏场景</h2>
        <p>游戏开发中...</p>
        <div className="development-status">
          <h3>当前开发进度:</h3>
          <ul>
            <li>✅ React基础框架搭建完成</li>
            <li>✅ TypeScript配置完成</li>
            <li>🔄 Phaser.js游戏引擎集成中</li>
            <li>🔄 游戏场景开发中</li>
            <li>🔄 交互系统开发中</li>
          </ul>
        </div>
        <button className="back-button" onClick={() => window.history.back()}>
          返回主菜单
        </button>
      </div>
    </div>
  )
}

export default GameScene
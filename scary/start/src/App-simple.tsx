import React from 'react'
import './App.css'

function App() {
  return (
    <div className="app">
      <div className="home-page terror-bg">
        <div className="main-menu flicker">
          <h1 className="game-title terror-text">恐怖校园</h1>
          <p>游戏开发中...</p>
          <div className="development-info">
            <h3>项目状态:</h3>
            <ul>
              <li>✅ 项目基础框架搭建完成</li>
              <li>✅ React + TypeScript 配置完成</li>
              <li>✅ Vite 构建工具配置完成</li>
              <li>🔄 Phaser.js 游戏引擎集成中</li>
              <li>🔄 游戏剧情系统开发中</li>
              <li>🔄 音效系统开发中</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
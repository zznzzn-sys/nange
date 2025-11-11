<template>
  <div id="app">
    <StartMenu v-if="currentView === 'menu'" @start-game="handleStartGame" />
    <GamePage v-else-if="currentView === 'game'" :player-data="playerData" :game-time="gameTime" @game-over="handleGameOver" @return-to-menu="handleReturnToMenu" />
  </div>
</template>

<script>
import StartMenu from './components/StartMenu.vue'
import GamePage from './components/GamePage.vue'

export default {
  name: 'App',
  components: {
    StartMenu,
    GamePage
  },
  data() {
    return {
      currentView: 'menu',
      playerData: null,
      gameTime: 0
    }
  },
  methods: {
    handleStartGame(payload) {
      console.log('游戏开始触发，来源:', payload.fromDoor ? '舱门' : '按钮')
      this.playerData = payload.playerData || {}
      this.currentView = 'game'
    },
    handleGameOver(gameState) {
      console.log('游戏结束，游戏状态:', gameState)
      
      // 更新游戏时间
      if (gameState && gameState.gameTime !== undefined) {
        this.gameTime = gameState.gameTime
      }
      
      // 死亡时不保存资源（资源丢失）
      if (gameState && gameState.collectedResources) {
        // 如果是空的资源对象，不保存（死亡情况）
        if (Object.keys(gameState.collectedResources).length === 0) {
          console.log('死亡，资源丢失')
          // 显示资源丢失提示
          setTimeout(() => {
            alert('⚠ 任务失败！\n\n由于死亡，所有采集的资源都已丢失。\n\n下次探险时请小心！')
          }, 1000)
        } else {
          // 正常返回时有资源，保存到localStorage
          this.saveResourcesToStorage(gameState.collectedResources)
        }
      } else {
        // 如果没有collectedResources字段，也显示死亡提示
        setTimeout(() => {
          alert('⚠ 任务失败！\n\n由于死亡，所有采集的资源都已丢失。\n\n下次探险时请小心！')
        }, 1000)
      }
      
      // 从localStorage加载保存的游戏时间
      const saved = localStorage.getItem('delta-action-game')
      if (saved) {
        try {
          const data = JSON.parse(saved)
          if (data.gameTime !== undefined) {
            this.gameTime = data.gameTime
          }
        } catch (e) {
          console.error('Failed to load saved game time:', e)
        }
      }
      
      this.currentView = 'menu'
    },
    handleReturnToMenu(gameState) {
      console.log('返回主菜单，游戏状态:', gameState)
      
      // 更新游戏时间
      if (gameState && gameState.gameTime !== undefined) {
        this.gameTime = gameState.gameTime
      }
      
      // 更新玩家数据
      if (gameState && gameState.playerData) {
        this.playerData = { ...this.playerData, ...gameState.playerData }
      }
      
      // 保存收集的资源到localStorage
      if (gameState && gameState.collectedResources) {
        this.saveResourcesToStorage(gameState.collectedResources)
      }
      
      // 切换回主菜单
      this.currentView = 'menu'
    },
    // 资源名称映射（将GamePage中的资源名称映射到StartMenu中的资源名称）
    mapResourceName(resourceName) {
      const nameMap = {
        '玄武岩模块': '月球玄武岩', // 玄武岩模块 → 月球玄武岩
        // 可以添加更多映射
      }
      return nameMap[resourceName] || resourceName
    },
    
    // 保存资源到localStorage
    saveResourcesToStorage(resources) {
      const saved = localStorage.getItem('delta-action-game')
      const data = saved ? JSON.parse(saved) : {}
      
      // 初始化workbenchResources如果不存在
      if (!data.workbenchResources) {
        data.workbenchResources = {
          '玄武岩模块': 100,
          '能源晶体': 100,
          '稀有金属': 100,
          '电子元件': 100,
          '月球玄武岩': 100,
          '月球硅石': 100,
          '钛铁矿': 100,
          '氦-3': 100,
          '月球水冰': 100,
          '氦-3模块': 110,
          '月球硅石模块': 110,
          '石英模块': 100,
          '废弃卫星的太阳能电池板': 100,
          '飞船零件': 0
        }
      }
      
      // 累加收集的资源（使用名称映射）
      Object.keys(resources).forEach(resourceName => {
        const mappedName = this.mapResourceName(resourceName)
        if (data.workbenchResources[mappedName] !== undefined) {
          data.workbenchResources[mappedName] += resources[resourceName]
        } else {
          data.workbenchResources[mappedName] = resources[resourceName]
        }
      })
      
      localStorage.setItem('delta-action-game', JSON.stringify(data))
      console.log('资源已保存到储藏库:', resources)
      
      // 显示资源带回提示
      const resourceEntries = Object.keys(resources).map(name => {
        const mappedName = this.mapResourceName(name)
        return { name: mappedName, count: resources[name] }
      })
      
      if (resourceEntries.length > 0) {
        const totalCount = resourceEntries.reduce((sum, item) => sum + item.count, 0)
        const resourceList = resourceEntries.map(item => `${item.name} x${item.count}`).join('\n')
        
        // 延迟显示提示，确保StartMenu已经加载
        setTimeout(() => {
          alert(`✓ 资源已成功带回基地！\n\n共带回 ${totalCount} 单位资源：\n${resourceList}\n\n可在工作台的"资源储藏"中查看`)
        }, 1000)
      }
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  background: #e9f7ff;
}

#app {
  min-height: 100vh;
}
</style>
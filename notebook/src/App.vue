<template>
  <div id="app">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-brand">
        <h1>📖 故事工坊</h1>
        <span class="nav-subtitle">AI驱动小说创作平台</span>
      </div>
      <div class="nav-links">
        <router-link to="/" class="nav-link">创作中心</router-link>
        <router-link to="/novels" class="nav-link">作品管理</router-link>
        <router-link to="/characters" class="nav-link">角色档案</router-link>
        <router-link to="/ai-assistant" class="nav-link">AI助手</router-link>
        <router-link to="/analytics" class="nav-link">数据洞察</router-link>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- AI助手浮动按钮 -->
    <div class="ai-assistant-float" @click="toggleAIPanel">
      <div class="ai-icon">🤖</div>
      <span class="ai-label">AI助手</span>
    </div>

    <!-- 底部信息 -->
    <footer class="footer">
      <p>&copy; 2025 故事工坊 - AI驱动小说创作与管理平台</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isAIPanelOpen = ref(false)

const toggleAIPanel = () => {
  isAIPanelOpen.value = !isAIPanelOpen.value
  // 这里可以添加打开AI助手面板的逻辑
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.nav-brand h1 {
  color: #2d3748;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
}

.nav-subtitle {
  font-size: 0.9rem;
  color: #718096;
  margin-left: 0.5rem;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: #4a5568;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
  font-weight: 500;
  position: relative;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.footer {
  background: rgba(45, 55, 72, 0.9);
  color: white;
  text-align: center;
  padding: 1.5rem;
  margin-top: auto;
  backdrop-filter: blur(10px);
}

.ai-assistant-float {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 20px rgba(255, 107, 107, 0.3);
  transition: all 0.3s ease;
  z-index: 1000;
}

.ai-assistant-float:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 25px rgba(255, 107, 107, 0.4);
}

.ai-icon {
  font-size: 1.5rem;
}

.ai-label {
  font-weight: 600;
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .nav-links {
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .nav-link {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .ai-assistant-float {
    bottom: 1rem;
    right: 1rem;
    padding: 0.75rem 1rem;
  }
  
  .ai-label {
    display: none;
  }
}
</style>
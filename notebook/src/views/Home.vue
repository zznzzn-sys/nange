<template>
  <div class="home">
    <div class="hero-section">
      <h1>欢迎使用 Notebook</h1>
      <p class="subtitle">一个简洁高效的笔记和任务管理应用</p>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">📝</div>
          <h3>智能笔记</h3>
          <p>创建、编辑和管理您的笔记，支持富文本格式</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">✅</div>
          <h3>任务管理</h3>
          <p>跟踪您的待办事项，设置优先级和截止日期</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>快速响应</h3>
          <p>基于Vue 3的现代化界面，提供流畅的用户体验</p>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <h2>快速开始</h2>
      <div class="action-buttons">
        <router-link to="/notes" class="action-button primary">
          <span>📝 开始记笔记</span>
        </router-link>
        <router-link to="/tasks" class="action-button secondary">
          <span>✅ 管理任务</span>
        </router-link>
      </div>
    </div>

    <div class="stats-section">
      <div class="stat-item">
        <div class="stat-number">0</div>
        <div class="stat-label">笔记数量</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">0</div>
        <div class="stat-label">待完成任务</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">0</div>
        <div class="stat-label">已完成任务</div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 首页组件逻辑
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  text-align: center;
  padding: 3rem 0;
}

.hero-section h1 {
  font-size: 3rem;
  color: #2d3748;
  margin-bottom: 1rem;
  font-weight: 700;
}

.subtitle {
  font-size: 1.25rem;
  color: #718096;
  margin-bottom: 3rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  color: #2d3748;
  margin-bottom: 1rem;
}

.feature-card p {
  color: #718096;
  line-height: 1.6;
}

.quick-actions {
  text-align: center;
  padding: 3rem 0;
  background: #f7fafc;
  margin: 3rem -2rem;
  padding-left: 2rem;
  padding-right: 2rem;
}

.quick-actions h2 {
  font-size: 2rem;
  color: #2d3748;
  margin-bottom: 2rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.action-button {
  display: inline-flex;
  align-items: center;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 1.1rem;
}

.action-button.primary {
  background: #667eea;
  color: white;
}

.action-button.primary:hover {
  background: #5a67d8;
  transform: translateY(-2px);
}

.action-button.secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.action-button.secondary:hover {
  background: #667eea;
  color: white;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.stat-item {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 3rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #718096;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .hero-section h1 {
    font-size: 2rem;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .action-button {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }
}
</style>
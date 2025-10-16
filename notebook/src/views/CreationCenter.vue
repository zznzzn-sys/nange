<template>
  <div class="creation-center">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>创作中心</h1>
      <p class="subtitle">开始您的AI辅助小说创作之旅</p>
      <div class="header-actions">
        <button class="action-btn primary" @click="startNewNovel">
          <span class="btn-icon">🆕</span>
          新建作品
        </button>
        <button class="action-btn secondary" @click="importNovel">
          <span class="btn-icon">📥</span>
          导入作品
        </button>
      </div>
    </div>

    <!-- 快速创作面板 -->
    <div class="quick-creation">
      <h2>快速创作</h2>
      <div class="creation-cards">
        <div class="creation-card" @click="startAIWriting">
          <div class="card-icon">🤖</div>
          <h3>AI智能创作</h3>
          <p>基于AI模型生成小说开头和情节</p>
          <div class="card-badge">智能推荐</div>
        </div>
        <div class="creation-card" @click="startTemplateWriting">
          <div class="card-icon">📋</div>
          <h3>模板创作</h3>
          <p>使用预设模板快速开始创作</p>
          <div class="card-badge">快速开始</div>
        </div>
        <div class="creation-card" @click="startCollaboration">
          <div class="card-icon">👥</div>
          <h3>协作创作</h3>
          <p>邀请他人共同创作一部作品</p>
          <div class="card-badge">多人协作</div>
        </div>
      </div>
    </div>

    <!-- 最近作品 -->
    <div class="recent-works">
      <div class="section-header">
        <h2>最近作品</h2>
        <button class="view-all-btn" @click="viewAllWorks">
          查看全部
        </button>
      </div>
      <div class="works-grid">
        <div class="work-card" v-for="work in recentWorks" :key="work.id">
          <div class="work-cover">
            <span class="cover-icon">{{ work.icon }}</span>
          </div>
          <div class="work-info">
            <h4>{{ work.title }}</h4>
            <p class="work-description">{{ work.description }}</p>
            <div class="work-meta">
              <span class="meta-item">
                <span class="meta-icon">📖</span>
                {{ work.wordCount }}
              </span>
              <span class="meta-item">
                <span class="meta-icon">📅</span>
                {{ work.lastUpdate }}
              </span>
            </div>
            <div class="work-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{width: work.progress + '%'}"></div>
              </div>
              <span class="progress-text">{{ work.progress }}%</span>
            </div>
          </div>
          <div class="work-actions">
            <button class="action-btn small" @click="continueWriting(work.id)">
              继续创作
            </button>
            <button class="action-btn small secondary" @click="editWork(work.id)">
              编辑
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- AI创作建议 -->
    <div class="ai-suggestions">
      <h2>AI创作建议</h2>
      <div class="suggestions-list">
        <div class="suggestion-item" v-for="suggestion in aiSuggestions" :key="suggestion.id">
          <div class="suggestion-icon">{{ suggestion.icon }}</div>
          <div class="suggestion-content">
            <h4>{{ suggestion.title }}</h4>
            <p>{{ suggestion.description }}</p>
            <div class="suggestion-tags">
              <span class="tag" v-for="tag in suggestion.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>
          <div class="suggestion-actions">
            <button class="action-btn small primary" @click="applySuggestion(suggestion.id)">
              应用建议
            </button>
            <button class="action-btn small" @click="dismissSuggestion(suggestion.id)">
              忽略
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创作统计 -->
    <div class="creation-stats">
      <h2>创作统计</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalWords }}</div>
          <div class="stat-label">总创作字数</div>
          <div class="stat-trend positive">+12%</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.activeProjects }}</div>
          <div class="stat-label">进行中项目</div>
          <div class="stat-trend positive">+2</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.completedChapters }}</div>
          <div class="stat-label">已完成章节</div>
          <div class="stat-trend positive">+5</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.writingStreak }}</div>
          <div class="stat-label">连续创作天数</div>
          <div class="stat-trend positive">+3</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const recentWorks = ref([
  {
    id: 1,
    title: '星辰之海',
    description: '一部关于星际探险的科幻小说',
    icon: '🚀',
    wordCount: '5.8万字',
    lastUpdate: '2天前',
    progress: 65
  },
  {
    id: 2,
    title: '迷雾之城',
    description: '悬疑推理题材的都市小说',
    icon: '🏙️',
    wordCount: '3.2万字',
    lastUpdate: '1天前',
    progress: 45
  },
  {
    id: 3,
    title: '时光旅人',
    description: '穿越时空的浪漫爱情故事',
    icon: '⏰',
    wordCount: '8.1万字',
    lastUpdate: '3天前',
    progress: 80
  }
])

const aiSuggestions = ref([
  {
    id: 1,
    icon: '💡',
    title: '增加情节反转',
    description: '建议在下一章加入一个意想不到的情节转折',
    tags: ['情节', '悬念', '节奏']
  },
  {
    id: 2,
    icon: '🎭',
    title: '深化角色关系',
    description: '主角与配角的互动可以更加丰富和深入',
    tags: ['角色', '关系', '互动']
  },
  {
    id: 3,
    icon: '📈',
    title: '优化叙事节奏',
    description: '当前章节的叙事节奏可以适当加快',
    tags: ['节奏', '叙事', '结构']
  }
])

const stats = ref({
  totalWords: '17.1万',
  activeProjects: '3',
  completedChapters: '24',
  writingStreak: '15天'
})

const startNewNovel = () => {
  console.log('开始新作品创作')
}

const importNovel = () => {
  console.log('导入作品')
}

const startAIWriting = () => {
  console.log('开始AI智能创作')
}

const startTemplateWriting = () => {
  console.log('开始模板创作')
}

const startCollaboration = () => {
  console.log('开始协作创作')
}

const continueWriting = (workId) => {
  console.log('继续创作作品:', workId)
}

const editWork = (workId) => {
  console.log('编辑作品:', workId)
}

const viewAllWorks = () => {
  console.log('查看全部作品')
}

const applySuggestion = (suggestionId) => {
  console.log('应用建议:', suggestionId)
}

const dismissSuggestion = (suggestionId) => {
  console.log('忽略建议:', suggestionId)
}
</script>

<style scoped>
.creation-center {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  color: #2d3748;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #718096;
  margin-bottom: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.action-btn.small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.btn-icon {
  font-size: 1.2rem;
}

.quick-creation {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.quick-creation h2 {
  color: #2d3748;
  margin-bottom: 1.5rem;
}

.creation-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.creation-card {
  background: #f7fafc;
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.creation-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  background: white;
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.creation-card h3 {
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.creation-card p {
  color: #718096;
  margin-bottom: 1rem;
}

.card-badge {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.recent-works {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  color: #2d3748;
  margin: 0;
}

.view-all-btn {
  background: none;
  border: 1px solid #e2e8f0;
  color: #667eea;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-all-btn:hover {
  background: #667eea;
  color: white;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.work-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.work-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.work-cover {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.cover-icon {
  font-size: 2rem;
  color: white;
}

.work-info {
  flex: 1;
}

.work-info h4 {
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.work-description {
  color: #718096;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.work-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #a0aec0;
  font-size: 0.9rem;
}

.meta-icon {
  font-size: 1rem;
}

.work-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  color: #4a5568;
  font-size: 0.9rem;
  font-weight: 600;
}

.work-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.ai-suggestions {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.ai-suggestions h2 {
  color: #2d3748;
  margin-bottom: 1.5rem;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.suggestion-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.suggestion-icon {
  font-size: 2rem;
}

.suggestion-content {
  flex: 1;
}

.suggestion-content h4 {
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.suggestion-content p {
  color: #718096;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.suggestion-tags {
  display: flex;
  gap: 0.5rem;
}

.tag {
  background: #f7fafc;
  color: #4a5568;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
}

.suggestion-actions {
  display: flex;
  gap: 0.5rem;
}

.creation-stats {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.creation-stats h2 {
  color: #2d3748;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  text-align: center;
  padding: 1.5rem;
  background: #f7fafc;
  border-radius: 0.75rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #718096;
  margin-bottom: 0.5rem;
}

.stat-trend {
  font-size: 0.9rem;
  font-weight: 600;
}

.stat-trend.positive {
  color: #48bb78;
}

@media (max-width: 768px) {
  .creation-cards {
    grid-template-columns: 1fr;
  }
  
  .works-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .suggestion-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .suggestion-actions {
    align-self: stretch;
    justify-content: space-between;
  }
}
</style>
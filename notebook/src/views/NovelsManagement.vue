<template>
  <div class="novels-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>作品管理</h1>
      <p class="subtitle">管理您的所有小说作品</p>
      <div class="header-tools">
        <div class="search-box">
          <input type="text" v-model="searchQuery" placeholder="搜索作品..." />
          <span class="search-icon">🔍</span>
        </div>
        <div class="filter-options">
          <select v-model="filterStatus">
            <option value="all">全部状态</option>
            <option value="draft">草稿</option>
            <option value="writing">创作中</option>
            <option value="completed">已完成</option>
            <option value="published">已发布</option>
          </select>
          <select v-model="sortBy">
            <option value="updated">最近更新</option>
            <option value="created">创建时间</option>
            <option value="title">作品名称</option>
            <option value="words">字数排序</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 作品列表 -->
    <div class="novels-list">
      <div class="list-header">
        <span class="header-item">作品信息</span>
        <span class="header-item">字数</span>
        <span class="header-item">状态</span>
        <span class="header-item">最后更新</span>
        <span class="header-item">操作</span>
      </div>
      
      <div class="novel-item" v-for="novel in filteredNovels" :key="novel.id">
        <div class="novel-info">
          <div class="novel-cover">
            <span class="cover-icon">{{ novel.icon }}</span>
          </div>
          <div class="novel-details">
            <h4 class="novel-title">{{ novel.title }}</h4>
            <p class="novel-description">{{ novel.description }}</p>
            <div class="novel-tags">
              <span class="tag" v-for="tag in novel.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
        
        <div class="novel-word-count">
          <span class="word-count">{{ novel.wordCount }}</span>
        </div>
        
        <div class="novel-status">
          <span class="status-badge" :class="novel.status">{{ getStatusText(novel.status) }}</span>
        </div>
        
        <div class="novel-update-time">
          <span class="update-time">{{ novel.lastUpdate }}</span>
        </div>
        
        <div class="novel-actions">
          <button class="action-btn small" @click="editNovel(novel.id)">
            <span class="btn-icon">✏️</span>
            编辑
          </button>
          <button class="action-btn small secondary" @click="viewNovel(novel.id)">
            <span class="btn-icon">👁️</span>
            查看
          </button>
          <div class="more-actions">
            <button class="more-btn" @click="toggleMoreActions(novel.id)">
              <span class="more-icon">⋯</span>
            </button>
            <div class="dropdown-menu" v-if="activeDropdown === novel.id">
              <button @click="exportNovel(novel.id)">导出作品</button>
              <button @click="duplicateNovel(novel.id)">复制作品</button>
              <button @click="archiveNovel(novel.id)">归档作品</button>
              <button @click="deleteNovel(novel.id)" class="danger">删除作品</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-if="filteredNovels.length === 0">
      <div class="empty-icon">📚</div>
      <h3>暂无作品</h3>
      <p>开始创作您的第一部小说吧！</p>
      <button class="action-btn primary" @click="createNewNovel">
        <span class="btn-icon">🆕</span>
        创建新作品
      </button>
    </div>

    <!-- 统计信息 -->
    <div class="management-stats">
      <div class="stat-item">
        <div class="stat-value">{{ stats.totalNovels }}</div>
        <div class="stat-label">总作品数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.totalWords }}</div>
        <div class="stat-label">总字数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.avgRating }}</div>
        <div class="stat-label">平均评分</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.completionRate }}</div>
        <div class="stat-label">完成率</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')
const filterStatus = ref('all')
const sortBy = ref('updated')
const activeDropdown = ref(null)

const novels = ref([
  {
    id: 1,
    title: '星辰之海',
    description: '一部关于星际探险的科幻小说',
    icon: '🚀',
    wordCount: '58,423',
    status: 'writing',
    lastUpdate: '2天前',
    tags: ['科幻', '冒险', '太空']
  },
  {
    id: 2,
    title: '迷雾之城',
    description: '悬疑推理题材的都市小说',
    icon: '🏙️',
    wordCount: '32,156',
    status: 'writing',
    lastUpdate: '1天前',
    tags: ['悬疑', '推理', '都市']
  },
  {
    id: 3,
    title: '时光旅人',
    description: '穿越时空的浪漫爱情故事',
    icon: '⏰',
    wordCount: '81,789',
    status: 'completed',
    lastUpdate: '3天前',
    tags: ['爱情', '穿越', '浪漫']
  },
  {
    id: 4,
    title: '龙之秘境',
    description: '奇幻世界的冒险史诗',
    icon: '🐉',
    wordCount: '45,672',
    status: 'published',
    lastUpdate: '5天前',
    tags: ['奇幻', '冒险', '史诗']
  },
  {
    id: 5,
    title: '暗夜侦探',
    description: '维多利亚时代的侦探故事',
    icon: '🔍',
    wordCount: '28,934',
    status: 'draft',
    lastUpdate: '1周前',
    tags: ['侦探', '历史', '悬疑']
  }
])

const stats = ref({
  totalNovels: '12',
  totalWords: '247,974',
  avgRating: '4.7',
  completionRate: '75%'
})

const filteredNovels = computed(() => {
  let filtered = novels.value
  
  // 搜索过滤
  if (searchQuery.value) {
    filtered = filtered.filter(novel => 
      novel.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      novel.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      novel.tags.some(tag => tag.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
  }
  
  // 状态过滤
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(novel => novel.status === filterStatus.value)
  }
  
  // 排序
  filtered = [...filtered].sort((a, b) => {
    switch (sortBy.value) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'words':
        return parseInt(b.wordCount.replace(/,/g, '')) - parseInt(a.wordCount.replace(/,/g, ''))
      case 'created':
        return b.id - a.id
      case 'updated':
      default:
        return new Date(b.lastUpdate) - new Date(a.lastUpdate)
    }
  })
  
  return filtered
})

const getStatusText = (status) => {
  const statusMap = {
    draft: '草稿',
    writing: '创作中',
    completed: '已完成',
    published: '已发布'
  }
  return statusMap[status] || status
}

const toggleMoreActions = (novelId) => {
  activeDropdown.value = activeDropdown.value === novelId ? null : novelId
}

const editNovel = (novelId) => {
  console.log('编辑作品:', novelId)
  activeDropdown.value = null
}

const viewNovel = (novelId) => {
  console.log('查看作品:', novelId)
  activeDropdown.value = null
}

const exportNovel = (novelId) => {
  console.log('导出作品:', novelId)
  activeDropdown.value = null
}

const duplicateNovel = (novelId) => {
  console.log('复制作品:', novelId)
  activeDropdown.value = null
}

const archiveNovel = (novelId) => {
  console.log('归档作品:', novelId)
  activeDropdown.value = null
}

const deleteNovel = (novelId) => {
  console.log('删除作品:', novelId)
  activeDropdown.value = null
}

const createNewNovel = () => {
  console.log('创建新作品')
}
</script>

<style scoped>
.novels-management {
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

.header-tools {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  font-size: 1rem;
}

.search-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
}

.filter-options {
  display: flex;
  gap: 0.5rem;
}

.filter-options select {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
}

.novels-list {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.list-header {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #4a5568;
}

.novel-item {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
  transition: all 0.3s ease;
}

.novel-item:hover {
  background: #f7fafc;
}

.novel-item:last-child {
  border-bottom: none;
}

.novel-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.novel-cover {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-icon {
  font-size: 1.5rem;
  color: white;
}

.novel-details {
  flex: 1;
}

.novel-title {
  color: #2d3748;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.novel-description {
  color: #718096;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.novel-tags {
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

.word-count {
  color: #4a5568;
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.draft {
  background: #fed7d7;
  color: #c53030;
}

.status-badge.writing {
  background: #fed7d7;
  color: #c53030;
}

.status-badge.completed {
  background: #c6f6d5;
  color: #276749;
}

.status-badge.published {
  background: #bee3f8;
  color: #2c5aa0;
}

.update-time {
  color: #718096;
  font-size: 0.9rem;
}

.novel-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.action-btn.small {
  padding: 0.375rem 0.75rem;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-icon {
  font-size: 1rem;
}

.more-actions {
  position: relative;
}

.more-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1.2rem;
  color: #a0aec0;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 120px;
}

.dropdown-menu button {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dropdown-menu button:hover {
  background: #f7fafc;
}

.dropdown-menu button.danger {
  color: #c53030;
}

.dropdown-menu button.danger:hover {
  background: #fed7d7;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #718096;
  margin-bottom: 2rem;
}

.management-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.stat-item {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #718096;
}

@media (max-width: 768px) {
  .header-tools {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .list-header {
    display: none;
  }
  
  .novel-item {
    grid-template-columns: 1fr;
    gap: 1rem;
    text-align: center;
  }
  
  .novel-info {
    flex-direction: column;
    text-align: center;
  }
  
  .novel-actions {
    justify-content: center;
  }
  
  .management-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
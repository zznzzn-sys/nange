<template>
  <div class="characters-archive">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>角色档案</h1>
      <p class="subtitle">管理您的所有小说角色</p>
      <div class="header-actions">
        <button class="action-btn primary" @click="createNewCharacter">
          <span class="btn-icon">➕</span>
          新建角色
        </button>
        <button class="action-btn secondary" @click="importCharacters">
          <span class="btn-icon">📥</span>
          导入角色
        </button>
        <button class="action-btn secondary" @click="generateCharacter">
          <span class="btn-icon">🤖</span>
          AI生成角色
        </button>
      </div>
    </div>

    <!-- 角色筛选 -->
    <div class="character-filters">
      <div class="filter-group">
        <label>作品筛选:</label>
        <select v-model="filterNovel">
          <option value="all">全部作品</option>
          <option v-for="novel in novels" :key="novel.id" :value="novel.id">
            {{ novel.title }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>角色类型:</label>
        <select v-model="filterType">
          <option value="all">全部类型</option>
          <option value="protagonist">主角</option>
          <option value="supporting">配角</option>
          <option value="antagonist">反派</option>
          <option value="minor">次要角色</option>
        </select>
      </div>
      <div class="search-box">
        <input type="text" v-model="searchQuery" placeholder="搜索角色..." />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <!-- 角色列表 -->
    <div class="characters-grid">
      <div class="character-card" v-for="character in filteredCharacters" :key="character.id">
        <div class="character-header">
          <div class="character-avatar">
            <span class="avatar-icon">{{ character.avatar }}</span>
          </div>
          <div class="character-info">
            <h4 class="character-name">{{ character.name }}</h4>
            <p class="character-novel">{{ character.novelTitle }}</p>
            <div class="character-tags">
              <span class="tag type" :class="character.type">{{ getTypeText(character.type) }}</span>
              <span class="tag importance" :class="character.importance">{{ getImportanceText(character.importance) }}</span>
            </div>
          </div>
          <div class="character-actions">
            <button class="action-btn small" @click="editCharacter(character.id)">
              <span class="btn-icon">✏️</span>
            </button>
            <button class="action-btn small secondary" @click="viewCharacter(character.id)">
              <span class="btn-icon">👁️</span>
            </button>
          </div>
        </div>
        
        <div class="character-details">
          <div class="detail-item">
            <span class="detail-label">年龄:</span>
            <span class="detail-value">{{ character.age }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">性别:</span>
            <span class="detail-value">{{ character.gender }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">职业:</span>
            <span class="detail-value">{{ character.occupation }}</span>
          </div>
        </div>
        
        <div class="character-description">
          <p>{{ character.description }}</p>
        </div>
        
        <div class="character-traits">
          <h5>性格特点</h5>
          <div class="traits-list">
            <span class="trait" v-for="trait in character.traits" :key="trait">{{ trait }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-if="filteredCharacters.length === 0">
      <div class="empty-icon">👥</div>
      <h3>暂无角色</h3>
      <p>开始创建您的第一个小说角色吧！</p>
      <button class="action-btn primary" @click="createNewCharacter">
        <span class="btn-icon">➕</span>
        创建角色
      </button>
    </div>

    <!-- 角色统计 -->
    <div class="character-stats">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalCharacters }}</div>
          <div class="stat-label">总角色数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👑</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.protagonists }}</div>
          <div class="stat-label">主角数量</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎭</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.antagonists }}</div>
          <div class="stat-label">反派数量</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.avgComplexity }}</div>
          <div class="stat-label">平均复杂度</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const filterNovel = ref('all')
const filterType = ref('all')
const searchQuery = ref('')

const novels = ref([
  { id: 1, title: '星辰之海' },
  { id: 2, title: '迷雾之城' },
  { id: 3, title: '时光旅人' },
  { id: 4, title: '龙之秘境' },
  { id: 5, title: '暗夜侦探' }
])

const characters = ref([
  {
    id: 1,
    name: '林星辰',
    novelId: 1,
    novelTitle: '星辰之海',
    avatar: '🚀',
    type: 'protagonist',
    importance: 'high',
    age: '28岁',
    gender: '男',
    occupation: '星际探险家',
    description: '勇敢无畏的星际探险家，拥有丰富的太空航行经验和对未知世界的探索热情。',
    traits: ['勇敢', '智慧', '果断', '好奇']
  },
  {
    id: 2,
    name: '苏菲亚',
    novelId: 1,
    novelTitle: '星辰之海',
    avatar: '👩‍🚀',
    type: 'supporting',
    importance: 'high',
    age: '26岁',
    gender: '女',
    occupation: '天体物理学家',
    description: '天才天体物理学家，对宇宙奥秘有着深刻的理解和独特的见解。',
    traits: ['聪明', '理性', '专注', '温柔']
  },
  {
    id: 3,
    name: '暗影之王',
    novelId: 4,
    novelTitle: '龙之秘境',
    avatar: '🐉',
    type: 'antagonist',
    importance: 'high',
    age: '未知',
    gender: '男',
    occupation: '黑暗领主',
    description: '掌控黑暗力量的远古存在，企图统治整个奇幻世界。',
    traits: ['强大', '狡猾', '冷酷', '野心']
  },
  {
    id: 4,
    name: '艾米丽',
    novelId: 5,
    novelTitle: '暗夜侦探',
    avatar: '🔍',
    type: 'protagonist',
    importance: 'high',
    age: '32岁',
    gender: '女',
    occupation: '私家侦探',
    description: '维多利亚时代最杰出的女侦探，以敏锐的观察力和逻辑推理能力闻名。',
    traits: ['敏锐', '冷静', '正义', '独立']
  }
])

const stats = ref({
  totalCharacters: '24',
  protagonists: '8',
  antagonists: '4',
  avgComplexity: '8.2/10'
})

const filteredCharacters = computed(() => {
  let filtered = characters.value
  
  // 作品筛选
  if (filterNovel.value !== 'all') {
    filtered = filtered.filter(char => char.novelId === parseInt(filterNovel.value))
  }
  
  // 类型筛选
  if (filterType.value !== 'all') {
    filtered = filtered.filter(char => char.type === filterType.value)
  }
  
  // 搜索过滤
  if (searchQuery.value) {
    filtered = filtered.filter(char => 
      char.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      char.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      char.novelTitle.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  return filtered
})

const getTypeText = (type) => {
  const typeMap = {
    protagonist: '主角',
    supporting: '配角',
    antagonist: '反派',
    minor: '次要角色'
  }
  return typeMap[type] || type
}

const getImportanceText = (importance) => {
  const importanceMap = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return importanceMap[importance] || importance
}

const createNewCharacter = () => {
  console.log('创建新角色')
}

const importCharacters = () => {
  console.log('导入角色')
}

const generateCharacter = () => {
  console.log('AI生成角色')
}

const editCharacter = (characterId) => {
  console.log('编辑角色:', characterId)
}

const viewCharacter = (characterId) => {
  console.log('查看角色:', characterId)
}
</script>

<style scoped>
.characters-archive {
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
  padding: 0.5rem;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.btn-icon {
  font-size: 1.2rem;
}

.character-filters {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  color: #4a5568;
  font-weight: 500;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
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

.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.character-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.character-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.character-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.character-avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 2rem;
  color: white;
}

.character-info {
  flex: 1;
}

.character-name {
  color: #2d3748;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.character-novel {
  color: #718096;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.character-tags {
  display: flex;
  gap: 0.5rem;
}

.tag {
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.tag.type {
  background: #f7fafc;
  color: #4a5568;
}

.tag.importance {
  background: #fed7d7;
  color: #c53030;
}

.tag.importance.high {
  background: #fed7d7;
  color: #c53030;
}

.tag.importance.medium {
  background: #fef5e7;
  color: #d69e2e;
}

.tag.importance.low {
  background: #f0fff4;
  color: #38a169;
}

.character-actions {
  display: flex;
  gap: 0.25rem;
}

.character-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 0.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.detail-label {
  font-size: 0.8rem;
  color: #718096;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-weight: 600;
  color: #2d3748;
}

.character-description {
  margin-bottom: 1rem;
}

.character-description p {
  color: #718096;
  line-height: 1.4;
  font-size: 0.9rem;
}

.character-traits h5 {
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.traits-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.trait {
  background: #e6fffa;
  color: #234e52;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
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

.character-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #718096;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
  }
  
  .character-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .characters-grid {
    grid-template-columns: 1fr;
  }
  
  .character-details {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .character-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
<template>
  <div class="notes">
    <div class="notes-header">
      <h1>笔记管理</h1>
      <div class="header-actions">
        <button @click="showCreateModal = true" class="btn-primary">
          <span>+ 新建笔记</span>
        </button>
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索笔记..." 
            class="search-input"
          >
          <span class="search-icon">🔍</span>
        </div>
      </div>
    </div>

    <div class="notes-content">
      <div class="notes-grid">
        <div 
          v-for="note in filteredNotes" 
          :key="note.id" 
          class="note-card"
          @click="editNote(note)"
        >
          <div class="note-header">
            <h3 class="note-title">{{ note.title }}</h3>
            <div class="note-actions">
              <button @click.stop="deleteNote(note.id)" class="btn-icon" title="删除">
                🗑️
              </button>
            </div>
          </div>
          <p class="note-content">{{ note.content }}</p>
          <div class="note-footer">
            <span class="note-date">{{ formatDate(note.createdAt) }}</span>
            <span class="note-tag" :class="note.category">{{ note.category }}</span>
          </div>
        </div>

        <div v-if="filteredNotes.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>暂无笔记</h3>
          <p>点击"新建笔记"开始记录您的想法</p>
        </div>
      </div>
    </div>

    <!-- 创建/编辑笔记模态框 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingNote ? '编辑笔记' : '新建笔记' }}</h3>
          <button @click="closeModal" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>标题</label>
            <input v-model="noteForm.title" type="text" class="form-input" placeholder="输入笔记标题">
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea 
              v-model="noteForm.content" 
              class="form-textarea" 
              placeholder="输入笔记内容..."
              rows="6"
            ></textarea>
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="noteForm.category" class="form-select">
              <option value="work">工作</option>
              <option value="personal">个人</option>
              <option value="study">学习</option>
              <option value="other">其他</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">取消</button>
          <button @click="saveNote" class="btn-primary">
            {{ editingNote ? '更新' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 笔记数据结构
const notes = ref([])
const searchQuery = ref('')
const showCreateModal = ref(false)
const editingNote = ref(null)

// 笔记表单
const noteForm = ref({
  title: '',
  content: '',
  category: 'work'
})

// 过滤笔记
const filteredNotes = computed(() => {
  if (!searchQuery.value) return notes.value
  return notes.value.filter(note => 
    note.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 方法
const editNote = (note) => {
  editingNote.value = note
  noteForm.value = { ...note }
  showCreateModal.value = true
}

const deleteNote = (id) => {
  if (confirm('确定要删除这个笔记吗？')) {
    notes.value = notes.value.filter(note => note.id !== id)
    saveToLocalStorage()
  }
}

const saveNote = () => {
  if (!noteForm.value.title.trim()) {
    alert('请输入笔记标题')
    return
  }

  if (editingNote.value) {
    // 更新现有笔记
    const index = notes.value.findIndex(note => note.id === editingNote.value.id)
    if (index !== -1) {
      notes.value[index] = { ...noteForm.value, id: editingNote.value.id }
    }
  } else {
    // 创建新笔记
    const newNote = {
      id: Date.now(),
      ...noteForm.value,
      createdAt: new Date().toISOString()
    }
    notes.value.unshift(newNote)
  }

  saveToLocalStorage()
  closeModal()
}

const closeModal = () => {
  showCreateModal.value = false
  editingNote.value = null
  noteForm.value = {
    title: '',
    content: '',
    category: 'work'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const saveToLocalStorage = () => {
  localStorage.setItem('notebook-notes', JSON.stringify(notes.value))
}

const loadFromLocalStorage = () => {
  const saved = localStorage.getItem('notebook-notes')
  if (saved) {
    notes.value = JSON.parse(saved)
  }
}

onMounted(() => {
  loadFromLocalStorage()
})
</script>

<style scoped>
.notes {
  max-width: 1200px;
  margin: 0 auto;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.notes-header h1 {
  font-size: 2.5rem;
  color: #2d3748;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-primary:hover {
  background: #5a67d8;
}

.search-box {
  position: relative;
}

.search-input {
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  width: 250px;
  font-size: 1rem;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.note-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid #e2e8f0;
}

.note-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.note-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
  flex: 1;
}

.note-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  font-size: 1.1rem;
}

.btn-icon:hover {
  background: #f7fafc;
}

.note-content {
  color: #4a5568;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #718096;
}

.note-tag {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.note-tag.work { background: #bee3f8; color: #2c5282; }
.note-tag.personal { background: #c6f6d5; color: #276749; }
.note-tag.study { background: #fefcbf; color: #744210; }
.note-tag.other { background: #e9d8fd; color: #553c9a; }

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  color: #718096;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #4a5568;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #718096;
}

.btn-close:hover {
  color: #2d3748;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #4a5568;
}

.form-input, .form-textarea, .form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

@media (max-width: 768px) {
  .notes-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .search-input {
    width: 200px;
  }
  
  .notes-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>
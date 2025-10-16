<template>
  <div class="tasks">
    <div class="tasks-header">
      <h1>任务管理</h1>
      <div class="header-actions">
        <button @click="showCreateModal = true" class="btn-primary">
          <span>+ 新建任务</span>
        </button>
        <div class="filter-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.value" 
            @click="activeTab = tab.value"
            :class="['tab-button', { active: activeTab === tab.value }]"
          >
            {{ tab.label }} ({{ getTaskCount(tab.value) }})
          </button>
        </div>
      </div>
    </div>

    <div class="tasks-content">
      <div class="tasks-list">
        <div 
          v-for="task in filteredTasks" 
          :key="task.id" 
          class="task-item"
          :class="{ completed: task.completed, priority: task.priority === 'high' }"
        >
          <div class="task-checkbox">
            <input 
              type="checkbox" 
              :checked="task.completed" 
              @change="toggleTask(task.id)"
              class="checkbox"
            >
          </div>
          <div class="task-content">
            <div class="task-header">
              <h3 class="task-title" :class="{ completed: task.completed }">
                {{ task.title }}
              </h3>
              <div class="task-actions">
                <button @click="editTask(task)" class="btn-icon" title="编辑">
                  ✏️
                </button>
                <button @click="deleteTask(task.id)" class="btn-icon" title="删除">
                  🗑️
                </button>
              </div>
            </div>
            <p class="task-description">{{ task.description }}</p>
            <div class="task-meta">
              <span class="task-date" v-if="task.dueDate">
                截止: {{ formatDate(task.dueDate) }}
              </span>
              <span class="task-priority" :class="task.priority">
                {{ getPriorityLabel(task.priority) }}
              </span>
              <span class="task-category">{{ task.category }}</span>
            </div>
          </div>
        </div>

        <div v-if="filteredTasks.length === 0" class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>{{ getEmptyMessage() }}</h3>
          <p>{{ getEmptyDescription() }}</p>
        </div>
      </div>
    </div>

    <!-- 创建/编辑任务模态框 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingTask ? '编辑任务' : '新建任务' }}</h3>
          <button @click="closeModal" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>任务标题</label>
            <input v-model="taskForm.title" type="text" class="form-input" placeholder="输入任务标题">
          </div>
          <div class="form-group">
            <label>任务描述</label>
            <textarea 
              v-model="taskForm.description" 
              class="form-textarea" 
              placeholder="输入任务描述..."
              rows="4"
            ></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>优先级</label>
              <select v-model="taskForm.priority" class="form-select">
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
            <div class="form-group">
              <label>分类</label>
              <select v-model="taskForm.category" class="form-select">
                <option value="work">工作</option>
                <option value="personal">个人</option>
                <option value="study">学习</option>
                <option value="shopping">购物</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>截止日期</label>
            <input v-model="taskForm.dueDate" type="date" class="form-input">
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-secondary">取消</button>
          <button @click="saveTask" class="btn-primary">
            {{ editingTask ? '更新' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 任务数据结构
const tasks = ref([])
const activeTab = ref('all')
const showCreateModal = ref(false)
const editingTask = ref(null)

// 标签页配置
const tabs = [
  { label: '全部', value: 'all' },
  { label: '待完成', value: 'active' },
  { label: '已完成', value: 'completed' },
  { label: '高优先级', value: 'high' }
]

// 任务表单
const taskForm = ref({
  title: '',
  description: '',
  priority: 'medium',
  category: 'work',
  dueDate: '',
  completed: false
})

// 过滤任务
const filteredTasks = computed(() => {
  let filtered = tasks.value
  
  switch (activeTab.value) {
    case 'active':
      filtered = filtered.filter(task => !task.completed)
      break
    case 'completed':
      filtered = filtered.filter(task => task.completed)
      break
    case 'high':
      filtered = filtered.filter(task => task.priority === 'high' && !task.completed)
      break
  }
  
  return filtered.sort((a, b) => {
    // 高优先级在前，然后按截止日期排序
    if (a.priority === 'high' && b.priority !== 'high') return -1
    if (b.priority === 'high' && a.priority !== 'high') return 1
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate)
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return 0
  })
})

// 方法
const getTaskCount = (type) => {
  switch (type) {
    case 'all': return tasks.value.length
    case 'active': return tasks.value.filter(task => !task.completed).length
    case 'completed': return tasks.value.filter(task => task.completed).length
    case 'high': return tasks.value.filter(task => task.priority === 'high' && !task.completed).length
    default: return 0
  }
}

const editTask = (task) => {
  editingTask.value = task
  taskForm.value = { ...task }
  showCreateModal.value = true
}

const deleteTask = (id) => {
  if (confirm('确定要删除这个任务吗？')) {
    tasks.value = tasks.value.filter(task => task.id !== id)
    saveToLocalStorage()
  }
}

const toggleTask = (id) => {
  const task = tasks.value.find(task => task.id === id)
  if (task) {
    task.completed = !task.completed
    task.completedAt = task.completed ? new Date().toISOString() : null
    saveToLocalStorage()
  }
}

const saveTask = () => {
  if (!taskForm.value.title.trim()) {
    alert('请输入任务标题')
    return
  }

  if (editingTask.value) {
    // 更新现有任务
    const index = tasks.value.findIndex(task => task.id === editingTask.value.id)
    if (index !== -1) {
      tasks.value[index] = { ...taskForm.value, id: editingTask.value.id }
    }
  } else {
    // 创建新任务
    const newTask = {
      id: Date.now(),
      ...taskForm.value,
      createdAt: new Date().toISOString(),
      completed: false
    }
    tasks.value.unshift(newTask)
  }

  saveToLocalStorage()
  closeModal()
}

const closeModal = () => {
  showCreateModal.value = false
  editingTask.value = null
  taskForm.value = {
    title: '',
    description: '',
    priority: 'medium',
    category: 'work',
    dueDate: '',
    completed: false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getPriorityLabel = (priority) => {
  const labels = { low: '低', medium: '中', high: '高' }
  return labels[priority] || priority
}

const getEmptyMessage = () => {
  const messages = {
    all: '暂无任务',
    active: '没有待完成的任务',
    completed: '还没有完成的任务',
    high: '没有高优先级任务'
  }
  return messages[activeTab.value] || '暂无任务'
}

const getEmptyDescription = () => {
  const descriptions = {
    all: '点击"新建任务"开始规划您的日程',
    active: '所有任务都已完成！',
    completed: '开始完成任务来查看完成记录',
    high: '当前没有高优先级的任务'
  }
  return descriptions[activeTab.value] || '点击"新建任务"开始规划您的日程'
}

const saveToLocalStorage = () => {
  localStorage.setItem('notebook-tasks', JSON.stringify(tasks.value))
}

const loadFromLocalStorage = () => {
  const saved = localStorage.getItem('notebook-tasks')
  if (saved) {
    tasks.value = JSON.parse(saved)
  }
}

onMounted(() => {
  loadFromLocalStorage()
})
</script>

<style scoped>
.tasks {
  max-width: 1200px;
  margin: 0 auto;
}

.tasks-header {
  margin-bottom: 2rem;
}

.tasks-header h1 {
  font-size: 2.5rem;
  color: #2d3748;
  margin-bottom: 1.5rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-tabs {
  display: flex;
  background: #f7fafc;
  border-radius: 0.5rem;
  padding: 0.25rem;
}

.tab-button {
  background: none;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  color: #718096;
  transition: all 0.3s ease;
}

.tab-button.active {
  background: white;
  color: #667eea;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-button:hover:not(.active) {
  color: #4a5568;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-item {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  transition: all 0.3s ease;
}

.task-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.task-item.priority {
  border-left: 4px solid #e53e3e;
}

.task-item.completed {
  opacity: 0.7;
  background: #f7fafc;
}

.task-checkbox {
  flex-shrink: 0;
}

.checkbox {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.375rem;
  border: 2px solid #cbd5e0;
  cursor: pointer;
}

.checkbox:checked {
  background: #48bb78;
  border-color: #48bb78;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.task-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
  flex: 1;
}

.task-title.completed {
  text-decoration: line-through;
  color: #718096;
}

.task-actions {
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
  opacity: 0.7;
}

.btn-icon:hover {
  opacity: 1;
  background: #f7fafc;
}

.task-description {
  color: #4a5568;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.task-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
}

.task-date {
  color: #718096;
}

.task-priority {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 600;
  font-size: 0.75rem;
}

.task-priority.low { background: #c6f6d5; color: #276749; }
.task-priority.medium { background: #fefcbf; color: #744210; }
.task-priority.high { background: #fed7d7; color: #c53030; }

.task-category {
  background: #e9d8fd;
  color: #553c9a;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.empty-state {
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
  min-height: 100px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary:hover {
  background: #5a67d8;
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
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-tabs {
    order: -1;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .task-item {
    flex-direction: column;
  }
  
  .task-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .task-actions {
    align-self: flex-end;
  }
}
</style>
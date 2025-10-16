<template>
  <div class="settings">
    <div class="settings-header">
      <h1>设置</h1>
      <p class="subtitle">管理您的应用偏好和配置</p>
    </div>

    <div class="settings-content">
      <div class="settings-grid">
        <!-- 外观设置 -->
        <div class="settings-section">
          <h2>外观设置</h2>
          <div class="settings-group">
            <div class="setting-item">
              <label for="theme">主题模式</label>
              <select id="theme" v-model="settings.theme" class="form-select">
                <option value="light">浅色模式</option>
                <option value="dark">深色模式</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>
            <div class="setting-item">
              <label for="language">语言</label>
              <select id="language" v-model="settings.language" class="form-select">
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
            <div class="setting-item">
              <label for="fontSize">字体大小</label>
              <select id="fontSize" v-model="settings.fontSize" class="form-select">
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 笔记设置 -->
        <div class="settings-section">
          <h2>笔记设置</h2>
          <div class="settings-group">
            <div class="setting-item">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.autoSave" class="checkbox">
                <span>自动保存笔记</span>
              </label>
              <p class="setting-description">启用后，笔记内容将自动保存</p>
            </div>
            <div class="setting-item">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.spellCheck" class="checkbox">
                <span>拼写检查</span>
              </label>
              <p class="setting-description">启用拼写检查功能</p>
            </div>
            <div class="setting-item">
              <label for="defaultCategory">默认分类</label>
              <select id="defaultCategory" v-model="settings.defaultCategory" class="form-select">
                <option value="work">工作</option>
                <option value="personal">个人</option>
                <option value="study">学习</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 任务设置 -->
        <div class="settings-section">
          <h2>任务设置</h2>
          <div class="settings-group">
            <div class="setting-item">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.taskNotifications" class="checkbox">
                <span>任务提醒</span>
              </label>
              <p class="setting-description">任务到期时发送提醒</p>
            </div>
            <div class="setting-item">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.autoComplete" class="checkbox">
                <span>自动完成过期任务</span>
              </label>
              <p class="setting-description">过期任务自动标记为完成</p>
            </div>
            <div class="setting-item">
              <label for="defaultPriority">默认优先级</label>
              <select id="defaultPriority" v-model="settings.defaultPriority" class="form-select">
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 数据管理 -->
        <div class="settings-section">
          <h2>数据管理</h2>
          <div class="settings-group">
            <div class="setting-item">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.cloudSync" class="checkbox">
                <span>云同步</span>
              </label>
              <p class="setting-description">将数据同步到云端（需要登录）</p>
            </div>
            <div class="setting-item">
              <button @click="exportData" class="btn-secondary">
                📤 导出数据
              </button>
              <p class="setting-description">导出所有笔记和任务数据</p>
            </div>
            <div class="setting-item">
              <button @click="importData" class="btn-secondary">
                📥 导入数据
              </button>
              <p class="setting-description">从文件导入数据</p>
            </div>
            <div class="setting-item">
              <button @click="clearData" class="btn-danger">
                🗑️ 清除所有数据
              </button>
              <p class="setting-description">删除所有本地数据（不可恢复）</p>
            </div>
          </div>
        </div>

        <!-- 关于 -->
        <div class="settings-section">
          <h2>关于应用</h2>
          <div class="about-content">
            <div class="app-info">
              <div class="app-icon">📓</div>
              <div class="app-details">
                <h3>Notebook</h3>
                <p>版本 1.0.0</p>
                <p>一个简洁高效的笔记和任务管理应用</p>
              </div>
            </div>
            <div class="about-links">
              <a href="#" class="link">用户协议</a>
              <a href="#" class="link">隐私政策</a>
              <a href="#" class="link">帮助文档</a>
              <a href="#" class="link">反馈建议</a>
            </div>
          </div>
        </div>
      </div>

      <!-- 保存按钮 -->
      <div class="settings-footer">
        <button @click="saveSettings" class="btn-primary">
          保存设置
        </button>
        <button @click="resetSettings" class="btn-secondary">
          恢复默认
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 设置数据
const settings = ref({
  // 外观设置
  theme: 'light',
  language: 'zh-CN',
  fontSize: 'medium',
  
  // 笔记设置
  autoSave: true,
  spellCheck: true,
  defaultCategory: 'work',
  
  // 任务设置
  taskNotifications: true,
  autoComplete: false,
  defaultPriority: 'medium',
  
  // 数据管理
  cloudSync: false
})

// 方法
const saveSettings = () => {
  localStorage.setItem('notebook-settings', JSON.stringify(settings.value))
  alert('设置已保存！')
}

const resetSettings = () => {
  if (confirm('确定要恢复默认设置吗？')) {
    settings.value = {
      theme: 'light',
      language: 'zh-CN',
      fontSize: 'medium',
      autoSave: true,
      spellCheck: true,
      defaultCategory: 'work',
      taskNotifications: true,
      autoComplete: false,
      defaultPriority: 'medium',
      cloudSync: false
    }
    saveSettings()
  }
}

const exportData = () => {
  const notes = localStorage.getItem('notebook-notes') || '[]'
  const tasks = localStorage.getItem('notebook-tasks') || '[]'
  const settingsData = localStorage.getItem('notebook-settings') || '{}'
  
  const exportData = {
    notes: JSON.parse(notes),
    tasks: JSON.parse(tasks),
    settings: JSON.parse(settingsData),
    exportDate: new Date().toISOString()
  }
  
  const dataStr = JSON.stringify(exportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  
  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `notebook-backup-${new Date().toISOString().split('T')[0]}.json`
  link.click()
}

const importData = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result)
          
          if (data.notes) localStorage.setItem('notebook-notes', JSON.stringify(data.notes))
          if (data.tasks) localStorage.setItem('notebook-tasks', JSON.stringify(data.tasks))
          if (data.settings) {
            settings.value = { ...settings.value, ...data.settings }
            saveSettings()
          }
          
          alert('数据导入成功！')
        } catch (error) {
          alert('导入失败：文件格式不正确')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

const clearData = () => {
  if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
    localStorage.removeItem('notebook-notes')
    localStorage.removeItem('notebook-tasks')
    alert('所有数据已清除')
  }
}

const loadSettings = () => {
  const saved = localStorage.getItem('notebook-settings')
  if (saved) {
    settings.value = { ...settings.value, ...JSON.parse(saved) }
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings {
  max-width: 1000px;
  margin: 0 auto;
}

.settings-header {
  text-align: center;
  margin-bottom: 3rem;
}

.settings-header h1 {
  font-size: 2.5rem;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  color: #718096;
}

.settings-grid {
  display: grid;
  gap: 2rem;
}

.settings-section {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.settings-section h2 {
  font-size: 1.5rem;
  color: #2d3748;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #667eea;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-item label {
  font-weight: 600;
  color: #4a5568;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.375rem;
  border: 2px solid #cbd5e0;
}

.setting-description {
  font-size: 0.875rem;
  color: #718096;
  margin: 0;
}

.form-select {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
}

.btn-primary, .btn-secondary, .btn-danger {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.btn-danger {
  background: #fed7d7;
  color: #c53030;
}

.btn-danger:hover {
  background: #feb2b2;
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app-icon {
  font-size: 3rem;
}

.app-details h3 {
  font-size: 1.5rem;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
}

.app-details p {
  color: #718096;
  margin: 0;
}

.about-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.link {
  color: #667eea;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background 0.3s ease;
}

.link:hover {
  background: #f7fafc;
}

.settings-footer {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 768px) {
  .settings-section {
    padding: 1.5rem;
  }
  
  .settings-footer {
    flex-direction: column;
  }
  
  .about-links {
    grid-template-columns: 1fr;
  }
}
</style>
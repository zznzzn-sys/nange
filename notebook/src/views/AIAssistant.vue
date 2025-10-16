<template>
  <div class="ai-assistant">
    <!-- AI助手头部 -->
    <div class="ai-header">
      <h1>AI创作助手</h1>
      <p class="subtitle">三级AI智能体协同工作，为您的创作提供全方位支持</p>
      <div class="ai-status">
        <div class="status-item online">
          <span class="status-dot"></span>
          <span>作品级AI: 在线</span>
        </div>
        <div class="status-item online">
          <span class="status-dot"></span>
          <span>章节级AI: 在线</span>
        </div>
        <div class="status-item online">
          <span class="status-dot"></span>
          <span>角色级AI: 在线</span>
        </div>
      </div>
    </div>

    <!-- AI功能面板 -->
    <div class="ai-panels">
      <!-- 作品级AI面板 -->
      <div class="ai-panel work-ai">
        <div class="panel-header">
          <div class="panel-icon">📚</div>
          <h3>作品级AI - 总编剧</h3>
          <span class="panel-badge">作品级</span>
        </div>
        <div class="panel-content">
          <p class="panel-description">负责作品整体架构、情节主线设计和一致性检查</p>
          <div class="ai-features">
            <div class="feature-item">
              <span class="feature-icon">🎯</span>
              <span>情节主线设计</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔗</span>
              <span>角色关系图谱</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📊</span>
              <span>节奏评估报告</span>
            </div>
          </div>
          <div class="ai-actions">
            <button class="action-btn primary" @click="analyzePlot">
              <span class="btn-icon">🔍</span>
              分析情节
            </button>
            <button class="action-btn secondary" @click="generateOutline">
              <span class="btn-icon">📝</span>
              生成大纲
            </button>
          </div>
        </div>
      </div>

      <!-- 章节级AI面板 -->
      <div class="ai-panel chapter-ai">
        <div class="panel-header">
          <div class="panel-icon">📖</div>
          <h3>章节级AI - 写作搭档</h3>
          <span class="panel-badge">章节级</span>
        </div>
        <div class="panel-content">
          <p class="panel-description">协助章节内容创作、文风模仿和语法校对</p>
          <div class="ai-features">
            <div class="feature-item">
              <span class="feature-icon">✍️</span>
              <span>文风一致性检查</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💬</span>
              <span>对话润色优化</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📝</span>
              <span>语法校对纠错</span>
            </div>
          </div>
          <div class="ai-actions">
            <button class="action-btn primary" @click="polishChapter">
              <span class="btn-icon">✨</span>
              润色章节
            </button>
            <button class="action-btn secondary" @click="checkConsistency">
              <span class="btn-icon">✅</span>
              检查一致性
            </button>
          </div>
        </div>
      </div>

      <!-- 角色级AI面板 -->
      <div class="ai-panel character-ai">
        <div class="panel-header">
          <div class="panel-icon">👥</div>
          <h3>角色级AI - 灵魂塑造者</h3>
          <span class="panel-badge">角色级</span>
        </div>
        <div class="panel-content">
          <p class="panel-description">负责角色行为一致性、对话风格和成长轨迹</p>
          <div class="ai-features">
            <div class="feature-item">
              <span class="feature-icon">🎭</span>
              <span>角色行为分析</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💭</span>
              <span>内心独白生成</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📈</span>
              <span>成长轨迹建议</span>
            </div>
          </div>
          <div class="ai-actions">
            <button class="action-btn primary" @click="analyzeCharacter">
              <span class="btn-icon">🔍</span>
              分析角色
            </button>
            <button class="action-btn secondary" @click="generateDialogue">
              <span class="btn-icon">💬</span>
              生成对话
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- AI聊天界面 -->
    <div class="ai-chat">
      <div class="chat-header">
        <h3>AI创作对话</h3>
        <div class="chat-actions">
          <button class="action-btn small" @click="clearChat">
            <span class="btn-icon">🗑️</span>
            清空对话
          </button>
          <button class="action-btn small" @click="exportChat">
            <span class="btn-icon">📤</span>
            导出对话
          </button>
        </div>
      </div>
      <div class="chat-messages">
        <div v-for="message in chatMessages" :key="message.id" 
             :class="['message', message.type]">
          <div class="message-avatar">
            <span v-if="message.type === 'user'">👤</span>
            <span v-else>🤖</span>
          </div>
          <div class="message-content">
            <div class="message-text">{{ message.text }}</div>
            <div class="message-time">{{ message.time }}</div>
          </div>
        </div>
      </div>
      <div class="chat-input">
        <textarea v-model="userInput" placeholder="向AI助手提问..." 
                  @keydown.enter.prevent="sendMessage"></textarea>
        <button class="send-btn" @click="sendMessage">
          <span class="send-icon">🚀</span>
          发送
        </button>
      </div>
    </div>

    <!-- AI建议区域 -->
    <div class="ai-suggestions">
      <h3>智能创作建议</h3>
      <div class="suggestions-grid">
        <div class="suggestion-card" v-for="suggestion in aiSuggestions" :key="suggestion.id">
          <div class="suggestion-header">
            <span class="suggestion-icon">{{ suggestion.icon }}</span>
            <span class="suggestion-type">{{ suggestion.type }}</span>
          </div>
          <div class="suggestion-content">
            <h4>{{ suggestion.title }}</h4>
            <p>{{ suggestion.description }}</p>
          </div>
          <div class="suggestion-actions">
            <button class="action-btn small" @click="applySuggestion(suggestion.id)">
              应用建议
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const chatMessages = ref([
  {
    id: 1,
    type: 'ai',
    text: '您好！我是您的AI创作助手。我可以帮助您进行情节设计、角色塑造和章节润色。有什么我可以帮您的吗？',
    time: '09:00'
  }
])

const userInput = ref('')
const aiSuggestions = ref([
  {
    id: 1,
    icon: '💡',
    type: '情节建议',
    title: '增加情节反转',
    description: '建议在第5章加入一个意想不到的反转，提升读者兴趣'
  },
  {
    id: 2,
    icon: '🎭',
    type: '角色优化',
    title: '主角性格深化',
    description: '主角的性格特点可以更加鲜明，建议增加内心独白'
  },
  {
    id: 3,
    icon: '📊',
    type: '节奏调整',
    title: '节奏优化建议',
    description: '第3章到第4章的节奏可以适当加快，保持读者注意力'
  }
])

const sendMessage = () => {
  if (userInput.value.trim()) {
    // 添加用户消息
    chatMessages.value.push({
      id: Date.now(),
      type: 'user',
      text: userInput.value,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    })

    // 模拟AI回复
    setTimeout(() => {
      chatMessages.value.push({
        id: Date.now() + 1,
        type: 'ai',
        text: '这是一个模拟的AI回复。在实际应用中，这里会调用真实的AI模型来生成回复。',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      })
    }, 1000)

    userInput.value = ''
  }
}

const clearChat = () => {
  chatMessages.value = [chatMessages.value[0]] // 保留第一条欢迎消息
}

const exportChat = () => {
  console.log('导出对话记录')
}

const analyzePlot = () => {
  console.log('分析情节')
}

const generateOutline = () => {
  console.log('生成大纲')
}

const polishChapter = () => {
  console.log('润色章节')
}

const checkConsistency = () => {
  console.log('检查一致性')
}

const analyzeCharacter = () => {
  console.log('分析角色')
}

const generateDialogue = () => {
  console.log('生成对话')
}

const applySuggestion = (suggestionId) => {
  console.log('应用建议:', suggestionId)
}
</script>

<style scoped>
.ai-assistant {
  max-width: 1200px;
  margin: 0 auto;
}

.ai-header {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.ai-header h1 {
  color: #2d3748;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #718096;
  margin-bottom: 1.5rem;
}

.ai-status {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #48bb78;
}

.status-item.online .status-dot {
  background: #48bb78;
}

.ai-panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.ai-panel {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.ai-panel:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.panel-icon {
  font-size: 2rem;
}

.panel-header h3 {
  color: #2d3748;
  margin: 0;
  flex: 1;
}

.panel-badge {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.panel-description {
  color: #718096;
  margin-bottom: 1.5rem;
  line-height: 1.4;
}

.ai-features {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4a5568;
}

.feature-icon {
  font-size: 1.2rem;
}

.ai-actions {
  display: flex;
  gap: 0.5rem;
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

.ai-chat {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chat-header h3 {
  color: #2d3748;
  margin: 0;
}

.chat-messages {
  height: 300px;
  overflow-y: auto;
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
}

.message {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f7fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.message-content {
  flex: 1;
}

.message-text {
  background: #f7fafc;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  color: #2d3748;
}

.message.user .message-text {
  background: #667eea;
  color: white;
}

.message-time {
  font-size: 0.8rem;
  color: #a0aec0;
  margin-top: 0.25rem;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
}

.chat-input textarea {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  resize: none;
  height: 60px;
}

.send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0 1.5rem;
  border-radius: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.ai-suggestions {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.ai-suggestions h3 {
  color: #2d3748;
  margin-bottom: 1.5rem;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.suggestion-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.3s ease;
}

.suggestion-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.suggestion-icon {
  font-size: 1.5rem;
}

.suggestion-type {
  background: #f7fafc;
  color: #4a5568;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
}

.suggestion-content h4 {
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.suggestion-content p {
  color: #718096;
  font-size: 0.9rem;
  line-height: 1.4;
}

.suggestion-actions {
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .ai-panels {
    grid-template-columns: 1fr;
  }
  
  .ai-status {
    flex-direction: column;
    gap: 1rem;
  }
  
  .suggestions-grid {
    grid-template-columns: 1fr;
  }
  
  .chat-input {
    flex-direction: column;
  }
  
  .send-btn {
    align-self: flex-end;
    width: auto;
  }
}
</style>
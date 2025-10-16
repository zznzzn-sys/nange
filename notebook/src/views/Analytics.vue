<template>
  <div class="analytics">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>数据洞察</h1>
      <p class="subtitle">基于AI分析的创作数据洞察，帮助您优化创作策略</p>
      <div class="time-filter">
        <label>时间范围:</label>
        <select v-model="timeRange">
          <option value="7d">最近7天</option>
          <option value="30d">最近30天</option>
          <option value="90d">最近90天</option>
          <option value="1y">最近1年</option>
        </select>
      </div>
    </div>

    <!-- 关键指标 -->
    <div class="key-metrics">
      <div class="metric-card">
        <div class="metric-icon">📖</div>
        <div class="metric-info">
          <div class="metric-value">{{ metrics.totalWords }}</div>
          <div class="metric-label">总字数</div>
          <div class="metric-change positive">+12%</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">👥</div>
        <div class="metric-info">
          <div class="metric-value">{{ metrics.totalReaders }}</div>
          <div class="metric-label">读者数量</div>
          <div class="metric-change positive">+8%</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">⭐</div>
        <div class="metric-info">
          <div class="metric-value">{{ metrics.avgRating }}</div>
          <div class="metric-label">平均评分</div>
          <div class="metric-change positive">+0.2</div>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">💬</div>
        <div class="metric-info">
          <div class="metric-value">{{ metrics.totalComments }}</div>
          <div class="metric-label">评论数量</div>
          <div class="metric-change positive">+15%</div>
        </div>
      </div>
    </div>

    <!-- AI分析报告 -->
    <div class="ai-reports">
      <h3>AI创作分析报告</h3>
      <div class="reports-grid">
        <div class="report-card">
          <div class="report-header">
            <span class="report-icon">🎯</span>
            <h4>情节分析</h4>
          </div>
          <div class="report-content">
            <p>您的作品情节发展节奏良好，但建议在第5章增加一些悬念元素...</p>
            <div class="report-score">
              <span class="score-label">情节评分:</span>
              <span class="score-value">8.5/10</span>
            </div>
          </div>
          <button class="action-btn small" @click="viewPlotReport">
            查看详情
          </button>
        </div>

        <div class="report-card">
          <div class="report-header">
            <span class="report-icon">👥</span>
            <h4>角色分析</h4>
          </div>
          <div class="report-content">
            <p>主角性格鲜明，但配角塑造可以更加立体，建议增加配角背景故事...</p>
            <div class="report-score">
              <span class="score-label">角色评分:</span>
              <span class="score-value">7.8/10</span>
            </div>
          </div>
          <button class="action-btn small" @click="viewCharacterReport">
            查看详情
          </button>
        </div>

        <div class="report-card">
          <div class="report-header">
            <span class="report-icon">📊</span>
            <h4>读者反馈分析</h4>
          </div>
          <div class="report-content">
            <p>读者对第3章的反响很好，建议延续这种写作风格和情感表达...</p>
            <div class="report-score">
              <span class="score-label">读者满意度:</span>
              <span class="score-value">92%</span>
            </div>
          </div>
          <button class="action-btn small" @click="viewReaderReport">
            查看详情
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const timeRange = ref('30d')

const metrics = ref({
  totalWords: '15.8万',
  totalReaders: '2.4k',
  avgRating: '4.7',
  totalComments: '356'
})

const viewPlotReport = () => {
  console.log('查看情节分析报告')
}

const viewCharacterReport = () => {
  console.log('查看角色分析报告')
}

const viewReaderReport = () => {
  console.log('查看读者反馈报告')
}
</script>

<style scoped>
.analytics {
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

.time-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-filter label {
  color: #4a5568;
  font-weight: 500;
}

.time-filter select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
}

.key-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.metric-icon {
  font-size: 2.5rem;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.metric-label {
  color: #718096;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.metric-change {
  font-size: 0.8rem;
  font-weight: 600;
}

.metric-change.positive {
  color: #48bb78;
}

.ai-reports {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.ai-reports h3 {
  color: #2d3748;
  margin-bottom: 1.5rem;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.report-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.report-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.report-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.report-icon {
  font-size: 1.5rem;
}

.report-header h4 {
  color: #2d3748;
  margin: 0;
}

.report-content p {
  color: #718096;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.report-score {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-label {
  color: #4a5568;
}

.score-value {
  font-weight: 600;
  color: #667eea;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .key-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .reports-grid {
    grid-template-columns: 1fr;
  }
}
</style>
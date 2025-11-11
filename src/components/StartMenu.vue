<template>
  <div class="space-station">
    <!-- 流星元素 -->
    <div class="meteor meteor-1"></div>
    <div class="meteor meteor-2"></div>
    <div class="meteor meteor-3"></div>
    <div class="meteor meteor-4"></div>
    
    <div class="station-background">
      <div class="debug-info" v-if="false">
        宇航员位置: ({{astronautX}}, {{astronautY}})<br>
        舱门状态: {{canExit ? '可离开' : '不可离开'}}
      </div>
      
      <div class="station-walls"></div>
      <div class="station-floor"></div>
      
      <div class="control-panel"></div>
      <div class="equipment"></div>
      
      <!-- 能源系统机器 -->
      <div 
        class="energy-machine"
        :class="{ 'can-interact': canInteractWithEnergy }"
        @click="handleEnergyMachineClick"
      >
        <div class="machine-body"></div>
        <div class="energy-display">
          <div class="energy-label">能源系统</div>
          <div class="energy-bar">
            <div class="energy-fill" :style="{ width: energyPercentage + '%' }"></div>
          </div>
          <div class="energy-value">{{ energy }} / {{ maxEnergy }}</div>
        </div>
        <div class="interact-prompt" v-if="canInteractWithEnergy">按E键打开能源面板</div>
      </div>
      
      <!-- 统一充能装置 -->
      <div 
        class="universal-charger"
        :class="{ 'can-interact': canInteractWithCharger }"
        @click="handleChargerClick"
      >
        <div class="charger-body"></div>
        <div class="charger-display">
          <div class="charger-label">充能装置</div>
          <div class="charger-status">
            <div class="charger-icon">⚡</div>
            <div class="charger-info">统一充能系统</div>
          </div>
          <div class="charger-value">选择设备进行充能</div>
        </div>
        <div class="interact-prompt" v-if="canInteractWithCharger">按E键打开充能面板</div>
      </div>
      
      <!-- 工作台装置 -->
      <div 
        class="workbench"
        :class="{ 'can-interact': canInteractWithWorkbench }"
        @click="handleWorkbenchClick"
      >
        <div class="workbench-body"></div>
        <div class="workbench-display">
          <div class="workbench-label">工作台</div>
          <div class="workbench-status">
            <div class="workbench-icon">🔧</div>
            <div class="workbench-info">资源管理</div>
          </div>
          <div class="workbench-value">当前界面: {{ currentWorkbenchTab }}</div>
        </div>
        <div class="interact-prompt" v-if="canInteractWithWorkbench">按E键打开工作台</div>
      </div>
      
      <!-- 矿石筛选机装置 -->
      <div 
        class="ore-sorter"
        :class="{ 'can-interact': canInteractWithOreSorter }"
        @click="handleOreSorterClick"
      >
        <div class="ore-sorter-body"></div>
        <div class="ore-sorter-display">
          <div class="ore-sorter-label">矿石筛选机</div>
          <div class="ore-sorter-status">
            <div class="ore-sorter-icon">🔬</div>
            <div class="ore-sorter-info">石英模块 → 月球硅石</div>
          </div>
          <div class="ore-sorter-value">石英模块: {{ workbenchResources['石英模块'] || 0 }}</div>
        </div>
        <div class="interact-prompt" v-if="canInteractWithOreSorter">按E键打开筛选机</div>
      </div>
      
      <!-- 机械拆解机装置 -->
      <div 
        class="disassembler"
        :class="{ 'can-interact': canInteractWithDisassembler && hasDisassembler }"
        @click="handleDisassemblerClick"
      >
        <div class="disassembler-body"></div>
        <div class="disassembler-display">
          <div class="disassembler-label">机械拆解机</div>
          <div class="disassembler-status">
            <div class="disassembler-icon">🔧</div>
            <div class="disassembler-info" v-if="hasDisassembler">已解锁</div>
            <div class="disassembler-info" v-else>需合成</div>
          </div>
          <div class="disassembler-value" v-if="hasDisassembler">状态: 就绪</div>
          <div class="disassembler-value" v-else>未拥有工具</div>
        </div>
        <div class="interact-prompt" v-if="canInteractWithDisassembler && hasDisassembler">按E键打开拆解机</div>
        <div class="interact-prompt locked" v-else-if="canInteractWithDisassembler && !hasDisassembler">需要先合成机械拆解机</div>
      </div>
      
      <div 
        class="airlock-door"
        :class="{ 'can-exit': canExit }"
        @click="handleDoorClick"
      >
        <div class="door-panel"></div>
        <div class="exit-prompt" v-if="canExit">按E键离开太空舱</div>
      </div>
      
      <div 
        class="astronaut" 
        :style="{ 
          left: astronautX + 'px', 
          top: astronautY + 'px',
          transform: `scaleX(${facingRight ? 1 : -1})`
        }"
      >
        <div class="visor"></div>
        <div class="backpack"></div>
        <div class="oxygen-tank"></div>
        <div class="arm left"></div>
        <div class="arm right"></div>
        <div class="leg left"></div>
        <div class="leg right"></div>
      </div>
      
      <div class="time-display">
        <div class="time">{{timeDisplay}}</div>
        <div class="day-count">太空流浪的第{{Math.floor(gameTime/1200)+1}}天</div>
      </div>
      
      <!-- 统一充能面板 -->
      <div class="charging-panel" v-if="showChargingPanel">
        <div class="panel-header">
          <div class="panel-title">⚡ 充能装置</div>
          <div class="panel-subtitle">选择要充能的设备</div>
        </div>
        
        <div class="energy-status">
          <div class="status-item">
            <span class="label">当前能源:</span>
            <span class="value">{{ energy }} / {{ maxEnergy }}</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: energyPercentage + '%' }"></div>
            </div>
          </div>
        </div>
        
        <div class="charging-devices">
          <!-- 电击枪充能 -->
          <div class="charging-device" @click="chargeDevice('electricGun')">
            <div class="device-icon">⚡</div>
            <div class="device-name">电击枪</div>
            <div class="device-status">
              <div class="device-info">10能源 → 30子弹</div>
              <div class="device-value">当前: {{ electricBullets }} 发</div>
            </div>
            <div class="device-action">点击充能</div>
          </div>
          
          <!-- 光子盾充能 -->
          <div class="charging-device" @click="chargeDevice('photonShield')">
            <div class="device-icon">🛡️</div>
            <div class="device-name">光子盾</div>
            <div class="device-status">
              <div class="device-info">10能源 → 20能量</div>
              <div class="device-value">当前: {{ photonShieldEnergy }} / 20</div>
            </div>
            <div class="device-action">点击充能</div>
          </div>
          
          <!-- 钻探机充能 -->
          <div class="charging-device" @click="chargeDevice('drillMachine')">
            <div class="device-icon">🛠️</div>
            <div class="device-name">钻探机</div>
            <div class="device-status">
              <div class="device-info">10能源 → 100能量</div>
              <div class="device-value">当前: {{ drillMachineEnergy }} / 100</div>
            </div>
            <div class="device-action">点击充能</div>
          </div>
        </div>
        
        <div class="panel-close-hint">按ESC键关闭面板</div>
      </div>
      
      <!-- 能源系统面板 -->
      <div class="energy-system-panel" v-if="showEnergyPanel">
        <div class="panel-header">
          <div class="panel-title">⚡ 能源系统</div>
          <div class="panel-subtitle">能源管理与升级</div>
        </div>
        
        <div class="energy-status">
          <div class="status-item">
            <span class="label">当前能源:</span>
            <span class="value">{{ energy }} / {{ maxEnergy }}</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: energyPercentage + '%' }"></div>
            </div>
          </div>
          <div class="status-item">
            <span class="label">能源上限:</span>
            <span class="value">{{ maxEnergy }} 点</span>
          </div>
          <div class="status-item">
            <span class="label">已安装充电板:</span>
            <span class="value">{{ solarPanelsUsed }} 个</span>
        </div>
        </div>
        
        <div class="solar-panel-section" v-if="workbenchResources['太阳能充电板'] > 0">
          <div class="section-title">使用太阳能充电板</div>
          <div class="solar-panel-info">
            <div class="info-item">
              <span class="info-label">拥有数量:</span>
              <span class="info-value">{{ workbenchResources['太阳能充电板'] }} 个</span>
            </div>
            <div class="info-item">
              <span class="info-label">效果:</span>
              <span class="info-value">增加10点能源上限</span>
            </div>
          </div>
          <button class="use-solar-panel-btn" @click="useSolarPanel">
            使用太阳能充电板
          </button>
        </div>
        <div class="no-solar-panel" v-else>
          <div class="no-item-text">暂无太阳能充电板</div>
          <div class="hint-text">可在资源合成中合成太阳能充电板</div>
        </div>
        
        <div class="panel-close-hint">按ESC键关闭面板</div>
      </div>
      
      <!-- 机械拆解机面板 -->
      <div class="disassembler-panel" v-if="showDisassemblerPanel">
        <div class="panel-header">
          <div class="panel-title">🔧 机械拆解机</div>
          <div class="panel-subtitle">拆解系统</div>
          <button class="close-btn" @click="showDisassemblerPanel = false">×</button>
        </div>
        
        <div class="disassembler-content">
          <div class="disassembler-info">
            <div class="info-item">
              <span class="info-label">功能：</span>
              <span class="info-value">拆解废弃卫星太阳能电池板</span>
            </div>
            <div class="info-item">
              <span class="info-label">拆解产物：</span>
              <span class="info-value">可回收5-8单位月球硅石模块</span>
            </div>
            <div class="info-item">
              <span class="info-label">当前库存：</span>
              <span class="info-value">{{ workbenchResources['废弃卫星的太阳能电池板'] || 0 }} 个太阳能电池板</span>
            </div>
          </div>
          
          <div class="disassembler-controls">
            <div class="input-group">
              <label>拆解数量：</label>
              <input 
                type="number" 
                v-model.number="disassemblerInputAmount" 
                :min="1" 
                :max="workbenchResources['废弃卫星的太阳能电池板'] || 0"
                class="amount-input"
              />
              <button 
                class="btn-max"
                @click="disassemblerInputAmount = workbenchResources['废弃卫星的太阳能电池板'] || 0"
              >
                最大
              </button>
            </div>
            
            <button 
              class="btn-disassemble"
              :disabled="!canDisassemble()"
              @click="performDisassembling()"
            >
              开始拆解
            </button>
            
            <div class="result-preview" v-if="disassemblerInputAmount > 0">
              <div class="preview-item">
                <span>消耗：</span>
                <span class="resource-name">🔋 废弃卫星的太阳能电池板 x{{ disassemblerInputAmount }}</span>
              </div>
              <div class="preview-arrow">↓</div>
              <div class="preview-item">
                <span>获得：</span>
                <span class="resource-name">💎 月球硅石模块 x{{ getDisassembleOutput() }}</span>
                <span class="output-range">(5-8单位/个)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 矿石筛选机面板 -->
      <div class="ore-sorter-panel" v-if="showOreSorterPanel">
        <div class="panel-header">
          <div class="panel-title">🔬 矿石筛选机</div>
          <div class="panel-subtitle">石英模块筛选系统</div>
          <button class="close-btn" @click="showOreSorterPanel = false">×</button>
        </div>
        
        <div class="ore-sorter-content">
          <div class="sorter-info">
            <div class="info-item">
              <span class="info-label">功能：</span>
              <span class="info-value">将石英模块筛选为高纯度月球硅石模块</span>
            </div>
            <div class="info-item">
              <span class="info-label">转换比例：</span>
              <span class="info-value">1 个石英模块 → 1 个月球硅石模块</span>
            </div>
            <div class="info-item">
              <span class="info-label">当前库存：</span>
              <span class="info-value">{{ workbenchResources['石英模块'] || 0 }} 个石英模块</span>
            </div>
          </div>
          
          <div class="sorter-controls">
            <div class="input-group">
              <label>筛选数量：</label>
              <input 
                type="number" 
                v-model.number="oreSorterInputAmount" 
                :min="1" 
                :max="workbenchResources['石英模块'] || 0"
                class="amount-input"
              />
              <button 
                class="btn-max"
                @click="oreSorterInputAmount = workbenchResources['石英模块'] || 0"
              >
                最大
              </button>
            </div>
            
            <button 
              class="btn-sort"
              :disabled="!canSortQuartz()"
              @click="performQuartzSorting()"
            >
              开始筛选
            </button>
            
            <div class="result-preview" v-if="oreSorterInputAmount > 0">
              <div class="preview-item">
                <span>消耗：</span>
                <span class="resource-name">💎 石英模块 x{{ oreSorterInputAmount }}</span>
              </div>
              <div class="preview-arrow">↓</div>
              <div class="preview-item">
                <span>获得：</span>
                <span class="resource-name">💎 月球硅石模块 x{{ oreSorterInputAmount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 工作台面板 -->
      <div class="workbench-panel" v-if="showWorkbenchPanel">
        <div class="panel-header">
          <div class="panel-title">🔧 工作台系统</div>
          <div class="panel-subtitle">资源管理与合成</div>
        </div>
        
        <!-- 选项卡 -->
        <div class="workbench-tabs">
          <button 
            v-for="tab in ['资源储藏', '资源合成', '工具库', '资源图鉴']" 
            :key="tab"
            :class="{ active: currentWorkbenchTab === tab }"
            @click="switchWorkbenchTab(tab)"
            class="tab-btn"
          >
            {{ tab }}
          </button>
        </div>
        
        <!-- 资源储藏界面 -->
        <div class="resource-storage" v-if="currentWorkbenchTab === '资源储藏'">
          <div class="storage-header">
            <div class="storage-title">资源储藏库</div>
            <div class="storage-capacity">容量: 无限</div>
          </div>
          
          <div class="storage-grid">
            <div 
              v-for="(count, resource) in workbenchResources" 
              :key="resource"
              class="resource-slot"
              :class="{ empty: count === 0 }"
            >
              <div class="resource-icon">{{ getResourceIcon(resource) }}</div>
              <div class="resource-name">{{ resource }}</div>
              <div class="resource-count">{{ count }}</div>
            </div>
          </div>
          
          <div class="storage-info">
            <div class="info-text">将收集到的资源存入储藏库，方便后续使用</div>
          </div>
        </div>
        
        <!-- 资源合成界面 -->
        <div class="resource-crafting" v-if="currentWorkbenchTab === '资源合成'">
          <div class="crafting-header">
            <div class="crafting-title">资源合成</div>
            <div class="crafting-subtitle">将基础资源合成为工具和模块</div>
          </div>
          
          <div class="crafting-list">
            <div 
              v-for="(recipe, recipeName) in craftingRecipes" 
              :key="recipeName"
              class="crafting-item"
              :class="{ 'can-craft': canCraft(recipeName), 'cannot-craft': !canCraft(recipeName) }"
            >
              <div class="crafting-item-header">
                <span class="crafting-icon">{{ recipe.icon }}</span>
                <span class="crafting-item-name">{{ recipeName }}</span>
                <span class="crafting-type-badge" :class="recipe.type">
                  {{ recipe.type === 'tool' ? '工具' : '模块' }}
                </span>
              </div>
              <div class="crafting-item-content">
                <div class="crafting-description">{{ recipe.description }}</div>
                <div class="crafting-ingredients">
                  <div class="ingredient-title">所需材料:</div>
                  <div 
                    v-for="(amount, ingredient) in recipe.ingredients" 
                    :key="ingredient"
                    class="ingredient-item"
                    :class="{ 'sufficient': hasEnoughResource(ingredient, amount, recipe), 'insufficient': !hasEnoughResource(ingredient, amount, recipe) }"
                  >
                    <span class="ingredient-check">{{ hasEnoughResource(ingredient, amount, recipe) ? '✓' : '✗' }}</span>
                    <span class="ingredient-name">{{ ingredient }}</span>
                    <span class="ingredient-amount">x{{ amount }}</span>
                    <span class="ingredient-available" v-if="!isTool(ingredient)">
                      (拥有: {{ getResourceCount(ingredient) }})
                    </span>
                  </div>
                  <div class="crafting-note" v-if="recipe.note">
                    <span class="note-label">注意:</span>
                    <span class="note-text">{{ recipe.note }}</span>
                  </div>
                </div>
                <button 
                  class="craft-button"
                  :class="{ 'can-craft': canCraft(recipeName), 'cannot-craft': !canCraft(recipeName) }"
                  :disabled="!canCraft(recipeName)"
                  @click="performCraft(recipeName)"
                >
                  {{ canCraft(recipeName) ? '合成' : '材料不足' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 工具库界面 -->
        <div class="tool-storage" v-if="currentWorkbenchTab === '工具库'">
          <div class="storage-header">
            <div class="storage-title">工具库</div>
            <div class="storage-capacity">已拥有工具: {{ getOwnedToolsCount() }}</div>
          </div>
          
          <div class="storage-grid">
            <div 
              v-for="(toolInfo, toolName) in getAllTools()" 
              :key="toolName"
              class="resource-slot"
              :class="{ 'empty': !isToolOwned(toolName), 'owned': isToolOwned(toolName) }"
            >
              <div class="resource-icon">{{ getToolIcon(toolName) }}</div>
              <div class="resource-name">{{ toolName }}</div>
              <div class="resource-count" v-if="isToolOwned(toolName)">
                {{ getToolCount(toolName) > 1 ? `x${getToolCount(toolName)}` : '✓' }}
              </div>
              <div class="resource-count" v-else>✗</div>
            </div>
          </div>
          
          <div class="storage-info">
            <div class="info-text">查看已拥有的工具和模块，可在游戏中随时使用</div>
          </div>
        </div>
        
        <!-- 资源图鉴界面 -->
        <div class="resource-encyclopedia" v-if="currentWorkbenchTab === '资源图鉴'">
          <div class="encyclopedia-header">
            <div class="encyclopedia-title">📚 图鉴系统</div>
            <div class="encyclopedia-subtitle">
              全面了解游戏中的武器、工具、资源、怪物和装置
            </div>
          </div>
          
          <!-- 分类选择器 -->
          <div class="encyclopedia-categories">
            <button 
              v-for="category in encyclopediaCategories" 
              :key="category.key"
              class="category-btn"
              :class="{ active: currentEncyclopediaCategory === category.key }"
              @click="currentEncyclopediaCategory = category.key"
            >
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-name">{{ category.name }}</span>
              <span class="category-count">({{ getCategoryCount(category.key) }})</span>
            </button>
          </div>
          
          <div class="encyclopedia-list">
            <!-- 武器图鉴 -->
            <template v-if="currentEncyclopediaCategory === 'all' || currentEncyclopediaCategory === 'weapon'">
              <div 
                v-for="(info, weapon) in weaponEncyclopedia" 
                :key="'weapon-' + weapon"
                class="encyclopedia-item"
              >
                <div class="encyclopedia-item-header">
                  <span class="encyclopedia-icon">{{ info.icon }}</span>
                  <span class="encyclopedia-resource-name">{{ weapon }}</span>
                  <span class="encyclopedia-type-badge weapon-badge">武器</span>
                </div>
                <div class="encyclopedia-item-content">
                  <div class="encyclopedia-detail">
                    <span class="detail-label">类型:</span>
                    <span class="detail-value">{{ info.type }}</span>
                  </div>
                  <div class="encyclopedia-detail">
                    <span class="detail-label">获取方式:</span>
                    <span class="detail-value">{{ info.acquisition }}</span>
                  </div>
                  <div class="encyclopedia-detail">
                    <span class="detail-label">描述:</span>
                    <span class="detail-value">{{ info.description }}</span>
                  </div>
                  <div class="encyclopedia-detail">
                    <span class="detail-label">使用方法:</span>
                    <span class="detail-value">{{ info.usage }}</span>
                  </div>
                  <div class="encyclopedia-detail" v-if="info.stats">
                    <span class="detail-label">属性:</span>
                    <span class="detail-value">{{ info.stats }}</span>
                  </div>
                  <div class="encyclopedia-detail">
                    <span class="detail-label">使用要求:</span>
                    <span class="detail-value">{{ info.requirement }}</span>
                  </div>
                </div>
              </div>
            </template>
            
            <!-- 工具图鉴 -->
            <template v-if="currentEncyclopediaCategory === 'all' || currentEncyclopediaCategory === 'tool'">
              <div 
                v-for="(info, tool) in toolEncyclopedia" 
                :key="'tool-' + tool"
                class="encyclopedia-item"
              >
                <div class="encyclopedia-item-header">
                  <span class="encyclopedia-icon">{{ info.icon }}</span>
                  <span class="encyclopedia-resource-name">{{ tool }}</span>
                  <span class="encyclopedia-type-badge tool-badge">{{ info.type }}</span>
                </div>
                <div class="encyclopedia-item-content">
                  <div class="encyclopedia-detail">
                    <span class="detail-label">获取方式:</span>
                    <span class="detail-value">{{ info.acquisition }}</span>
                  </div>
                  <div class="encyclopedia-detail">
                    <span class="detail-label">描述:</span>
                    <span class="detail-value">{{ info.description }}</span>
                  </div>
                  <div class="encyclopedia-detail">
                    <span class="detail-label">使用方法:</span>
                    <span class="detail-value">{{ info.usage }}</span>
                  </div>
                  <div class="encyclopedia-detail" v-if="info.stats">
                    <span class="detail-label">属性:</span>
                    <span class="detail-value">{{ info.stats }}</span>
                  </div>
                  <div class="encyclopedia-detail">
                    <span class="detail-label">使用要求:</span>
                    <span class="detail-value">{{ info.requirement }}</span>
                  </div>
                </div>
              </div>
            </template>
            
            <!-- 资源图鉴 -->
            <template v-if="currentEncyclopediaCategory === 'all' || currentEncyclopediaCategory === 'resource'">
            <div 
              v-for="(info, resource) in resourceEncyclopedia" 
              :key="'resource-' + resource"
              class="encyclopedia-item"
            >
              <div class="encyclopedia-item-header">
                <span class="encyclopedia-icon">{{ info.icon }}</span>
                <span class="encyclopedia-resource-name">{{ resource }}</span>
                <span class="encyclopedia-type-badge resource-badge">资源</span>
              </div>
              <div class="encyclopedia-item-content">
                <div class="encyclopedia-detail">
                  <span class="detail-label">获取场景:</span>
                  <span class="detail-value">{{ info.location }}</span>
                </div>
                <div class="encyclopedia-detail">
                  <span class="detail-label">所需工具:</span>
                  <span class="detail-value">{{ info.tool }}</span>
                </div>
                <div class="encyclopedia-detail">
                  <span class="detail-label">工具合成配方:</span>
                  <span class="detail-value">{{ info.toolRecipe }}</span>
                </div>
                <div class="encyclopedia-detail">
                  <span class="detail-label">获取机制:</span>
                  <span class="detail-value">{{ info.mechanism }}</span>
                </div>
                <div class="encyclopedia-detail" v-if="info.usage">
                  <span class="detail-label">用途:</span>
                  <span class="detail-value">{{ info.usage }}</span>
                </div>
              </div>
            </div>
            </template>
            
            <!-- 怪物图鉴 -->
            <template v-if="currentEncyclopediaCategory === 'all' || currentEncyclopediaCategory === 'monster'">
            <div 
              v-for="(info, monster) in monsterEncyclopedia" 
              :key="'monster-' + monster"
              class="encyclopedia-item"
            >
              <div class="encyclopedia-item-header">
                <span class="encyclopedia-icon">{{ info.icon }}</span>
                <span class="encyclopedia-resource-name">{{ monster }}</span>
                <span class="encyclopedia-type-badge monster-badge">怪物</span>
              </div>
              <div class="encyclopedia-item-content">
                <div class="encyclopedia-detail">
                  <span class="detail-label">出现位置:</span>
                  <span class="detail-value">{{ info.location }}</span>
                </div>
                <div class="encyclopedia-detail">
                  <span class="detail-label">生命值:</span>
                  <span class="detail-value">{{ info.hp }}</span>
                </div>
                  <div class="encyclopedia-detail" v-if="info.value">
                  <span class="detail-label">价值:</span>
                  <span class="detail-value">{{ info.value }} 金币</span>
                </div>
                  <div class="encyclopedia-detail" v-if="info.appearance">
                  <span class="detail-label">外观特征:</span>
                  <span class="detail-value">{{ info.appearance }}</span>
                </div>
                  <div class="encyclopedia-detail" v-if="info.attack1">
                  <span class="detail-label">攻击方式1:</span>
                  <span class="detail-value">{{ info.attack1 }}</span>
                </div>
                  <div class="encyclopedia-detail" v-if="info.attack2">
                  <span class="detail-label">攻击方式2:</span>
                  <span class="detail-value">{{ info.attack2 }}</span>
                </div>
                  <div class="encyclopedia-detail" v-if="info.skills">
                    <span class="detail-label">技能:</span>
                    <span class="detail-value">{{ info.skills }}</span>
                  </div>
                  <div class="encyclopedia-detail" v-if="info.weakness">
                  <span class="detail-label">弱点:</span>
                  <span class="detail-value">{{ info.weakness }}</span>
                </div>
              </div>
            </div>
            </template>
            
            <!-- 装置图鉴 -->
            <template v-if="currentEncyclopediaCategory === 'all' || currentEncyclopediaCategory === 'device'">
            <div 
                v-for="(info, device) in deviceEncyclopedia" 
                :key="'device-' + device"
                class="encyclopedia-item"
            >
              <div class="encyclopedia-item-header">
                <span class="encyclopedia-icon">{{ info.icon }}</span>
                  <span class="encyclopedia-resource-name">{{ device }}</span>
                  <span class="encyclopedia-type-badge device-badge">装置</span>
              </div>
              <div class="encyclopedia-item-content">
                <div class="encyclopedia-detail">
                    <span class="detail-label">类型:</span>
                    <span class="detail-value">{{ info.type }}</span>
                </div>
                <div class="encyclopedia-detail">
                    <span class="detail-label">位置:</span>
                    <span class="detail-value">{{ info.location }}</span>
                  </div>
                  <div class="encyclopedia-detail">
                    <span class="detail-label">功能:</span>
                    <span class="detail-value">{{ info.function }}</span>
                </div>
                <div class="encyclopedia-detail">
                  <span class="detail-label">使用方法:</span>
                  <span class="detail-value">{{ info.usage }}</span>
                </div>
                  <div class="encyclopedia-detail" v-if="info.requirements">
                  <span class="detail-label">使用要求:</span>
                    <span class="detail-value">{{ info.requirements }}</span>
                </div>
              </div>
            </div>
            </template>
          </div>
        </div>
        
        <div class="panel-close-hint">按ESC键关闭工作台</div>
      </div>
      
      <button @click="startGame" class="start-btn">发射!</button>
      
      <!-- 增加资源按钮 -->
      <button @click="addResources100" class="add-resources-btn">资源+100</button>
      
      <!-- 重置到第一天按钮 -->
      <button @click="resetToDayOne" class="reset-btn">重置到第一天</button>
    </div>
    
      <!-- AI机器人（星璇） -->
      <div 
        class="ai-robot"
        :class="{ 'can-interact': canInteractWithAI }"
        :style="{ left: aiRobotX + 'px', bottom: aiRobotY + 'px' }"
        @click="handleAIClick"
      >
        <div class="ai-screen">
          <div class="ai-face">🤖</div>
          <div class="ai-status" v-if="canInteractWithAI">按E键对话</div>
        </div>
        <div class="ai-stand">
          <div class="ai-wheels">
            <div class="ai-wheel wheel-left"></div>
            <div class="ai-wheel wheel-right"></div>
          </div>
        </div>
      </div>
      
      <!-- AI对话面板 -->
      <div v-if="showAIPanel" class="ai-dialogue-panel">
        <div class="ai-dialogue-header">
          <div class="ai-avatar">🤖</div>
          <div class="ai-name">AI星璇</div>
          <button @click="closeAIPanel" class="ai-close-btn">×</button>
        </div>
        <div class="ai-dialogue-content">
          <div v-if="!canEscape" class="ai-status-info">
            <div class="escape-progress-title">逃离进度</div>
            <div class="escape-requirements">
              <div 
                v-for="(required, resource) in escapeRequirements" 
                :key="resource"
                class="requirement-item"
                :class="{ 'completed': getResourceCount(resource) >= required }"
              >
                <span class="requirement-icon">{{ getResourceIcon(resource) }}</span>
                <span class="requirement-name">{{ resource }}</span>
                <span class="requirement-progress">
                  {{ getResourceCount(resource) }} / {{ required }}
                </span>
                <span class="requirement-status" v-if="getResourceCount(resource) >= required">✓</span>
              </div>
            </div>
            <div class="escape-progress-bar">
              <div class="progress-fill" :style="{ width: escapeProgressPercentage + '%' }"></div>
              <div class="progress-text">{{ escapeProgressPercentage.toFixed(0) }}%</div>
            </div>
            <div class="escape-remaining" v-if="remainingResourcesArray.length">
              <div class="escape-remaining-title">还缺少：</div>
              <ul class="escape-remaining-list">
                <li v-for="item in remainingResourcesArray" :key="'remain-' + item.name">
                  {{ item.name }} x{{ item.remaining }}
                </li>
              </ul>
              <button class="escape-btn" @click="reportRemainingResources">请汇报剩余需求</button>
            </div>
          </div>
          <div v-else class="ai-escape-ready">
            <div class="escape-ready-message">所有资源已集齐！</div>
            <button @click="startEscapeSequence" class="escape-btn">启动逃离序列</button>
          </div>
        </div>
      </div>
      
      <!-- 结局剧情对话 -->
      <div v-if="showEndingDialogue" class="ending-dialogue-overlay">
        <!-- 飞船起飞动画场景（最后一段对话时显示） -->
        <div v-if="isEscapeAnimation" class="escape-animation-scene">
          <canvas ref="escapeCanvas" class="escape-canvas"></canvas>
        </div>
        <div class="dialogue-container" :class="{ 'fade-out': isEscapeAnimation }">
          <div class="dialogue-scene">
            <div class="scene-description">{{ currentEndingScene }}</div>
          </div>
          <div class="dialogue-box">
            <div class="dialogue-speaker">{{ currentEndingSpeaker }}</div>
            <div class="dialogue-text">{{ currentEndingText }}</div>
            <div class="dialogue-controls">
              <button @click="nextEndingDialogue" class="dialogue-next-btn" v-if="!isEscapeAnimation">
                {{ isLastEndingDialogue ? '观看结局动画' : '继续' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 开场剧情对话 -->
    <div v-if="showOpeningDialogue" class="opening-dialogue-overlay">
      <div class="dialogue-container">
        <div class="dialogue-scene">
          <div class="scene-description">{{ currentSceneDescription }}</div>
        </div>
        <div class="dialogue-box">
          <div class="dialogue-speaker">{{ currentSpeaker }}</div>
          <div class="dialogue-text">{{ currentDialogueText }}</div>
          <div class="dialogue-controls">
            <button @click="nextDialogue" class="dialogue-next-btn">
              {{ isLastDialogue ? '开始游戏' : '继续' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StartMenu',
  data() {
    return {
      astronautX: 300,
      astronautY: 200,
      facingRight: true,
      speed: 6,
      canExit: false,
      keys: {
        w: false,
        a: false,
        s: false,
        d: false,
        e: false
      },
      gameTime: 0, // 游戏时间（秒）
      gameSpeed: 1, // 时间流逝速度
      dayNightCycle: 0, // 0-1表示昼夜周期
      currentHour: 6, // 当前小时（6点为早晨）
      timeDisplay: '06:00',
      energy: 200, // 初始能量200点
      maxEnergy: 200, // 最大能源上限（初始200，可通过太阳能充电板增加）
      solarPanelsUsed: 0, // 已使用的太阳能充电板数量
      canInteractWithEnergy: false, // 是否可以与能源系统交互
      showEnergyPanel: false, // 是否显示能源系统面板
      electricBullets: 0, // 电击子弹数量
      canInteractWithCharger: false, // 是否可以与统一充能装置交互
      photonShieldEnergy: 0, // 光子盾能量
      drillMachineEnergy: 0, // 钻探机能量
      lastChargeTime: 0, // 上次充电时间
      isChargingActive: false, // 充电状态指示
      showChargingPanel: false, // 是否显示充能面板
      canInteractWithWorkbench: false, // 是否可以与工作台交互
      showWorkbenchPanel: false, // 是否显示工作台面板
      canInteractWithOreSorter: false, // 是否可以与矿石筛选机交互
      showOreSorterPanel: false, // 是否显示矿石筛选机面板
      oreSorterInputAmount: 1, // 矿石筛选机输入数量
      canInteractWithDisassembler: false, // 是否可以与机械拆解机交互
      showDisassemblerPanel: false, // 是否显示机械拆解机面板
      disassemblerInputAmount: 1, // 机械拆解机输入数量
      currentWorkbenchTab: '资源储藏', // 当前工作台界面
      // AI交互与结局对话控制
      canInteractWithAI: false,
      showAIPanel: false,
      showEndingDialogue: false,
      endingDialogueIndex: 0,
      // 逃离动画相关
      escapeAnimationFrame: null,
      escapeAnimationTime: 0,
      escapeSceneIndex: 0, // 当前镜头索引
      escapeScenes: [
        { name: 'moon_surface', duration: 4 },      // 镜头1：月球表面准备起飞
        { name: 'takeoff', duration: 5 },            // 镜头2：起飞
        { name: 'space_flight', duration: 8 },       // 镜头3：太空飞行
        { name: 'approach_earth', duration: 5 },     // 镜头4：接近地球
        { name: 'landing', duration: 4 },            // 镜头5：降落
        { name: 'fade_out', duration: 2 }            // 镜头6：淡出
      ],
      // AI机器人位置和移动
      aiRobotX: 400,
      aiRobotY: 150,
      aiRobotVx: 0.5, // 水平速度
      aiRobotVy: 0, // 垂直速度（暂时不用）
      aiRobotMoveTimer: 0, // 移动计时器
      aiRobotChangeDirectionTime: 3000, // 每3秒改变方向
      aiRobotLastMoveTime: null, // 上次移动时间
      currentEncyclopediaCategory: 'all', // 当前图鉴分类：all, weapon, tool, resource, monster, device
      encyclopediaCategories: [
        { key: 'all', name: '全部', icon: '📚' },
        { key: 'weapon', name: '武器', icon: '⚔️' },
        { key: 'tool', name: '工具', icon: '🛠️' },
        { key: 'resource', name: '资源', icon: '🧱' },
        { key: 'monster', name: '怪物', icon: '👾' },
        { key: 'device', name: '装置', icon: '⚙️' }
      ],
      // 逃离所需资源（用于AI汇报与结局判断）
      escapeRequirements: {
        '月球玄武岩': 200,
        '钛铁矿': 50,
        '月球硅石模块': 80,
        '月球水冰': 40,
        '飞船零件': 8,
        '无尽能源': 1
      },
      // 开场剧情对话系统
      showOpeningDialogue: false, // 是否显示开场对话
      dialogueIndex: 0, // 当前对话索引
      openingDialogues: [
        {
          scene: '788飞船号主驾驶舱。烟雾弥漫，警报灯微弱地闪烁，屏幕上布满雪花。你（队长）从破碎的主控台前醒来，头部一阵剧痛。',
          speaker: '队长',
          text: '（咳嗽着，声音因疼痛而沙哑）"星璇？星璇，报告情况！我们……我们遭遇了什么？其他人呢？"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"队长，生命体征已确认。很高兴您能恢复意识。正在为您调取事件记录。"'
        },
        {
          scene: '',
          speaker: '队长',
          text: '"我的头……像被陨石砸过。最后记得的，是我们正在着陆轨道上……"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"记录显示，本机于标准时间14:32成功进入月球轨道并开始降落程序。在距离月表3公里时，月球背面阴影区——即我们此次的任务目标——发生高能生命反应。"'
        },
        {
          scene: '',
          speaker: '队长',
          text: '"高能生命反应？说清楚点！"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"一个巨大的、未被记录的生物实体从阴影中显现。它……攻击了我们。其释放的能量脉冲瞬间过载了我们的护盾和主推进器。我们被迫进行了紧急硬着陆。"'
        },
        {
          scene: '',
          speaker: '队长',
          text: '（环顾四周死寂的船舱，心中一沉）"硬着陆……船员状态报告？"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"……很遗憾，队长。788飞船号共12名乘员，目前只扫描到您一人的生命信号。撞击瞬间，结构性损坏主要集中在船员休息舱和动力舱。"'
        },
        {
          scene: '',
          speaker: '队长',
          text: '（一拳砸在控制台上，但很快强迫自己冷静下来）"该死……星璇，飞船现状如何？"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"飞船状况：严重损坏。主引擎离线，能量核心临界休眠，生命维持系统仅能在本舱室维持最低功率72小时。外层装甲破损率47%，我们被困在这里了。"'
        },
        {
          scene: '',
          speaker: '队长',
          text: '"也就是说，我们动不了了？通讯呢？能联系地球吗？"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"长距离通讯阵列在坠落中已完全损毁。我们与地球失去了联系。"'
        },
        {
          scene: '',
          speaker: '队长',
          text: '（深吸一口气）"所以，我们是月球上唯一的幸存者，被困在一个破铁罐子里，外面还有个能击落飞船的怪物……生存指南是什么，星璇？"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"分析结论：唯一的生还路径是修复飞船。我已制定初步修复方案。但执行该方案，需要大量本地资源。"'
        },
        {
          scene: '',
          speaker: '队长',
          text: '"月球上的资源？比如？"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"例如：月球玄武岩用于修补船体结构，钛铁矿用于重启能量核心，月球硅石用于恢复生命维持系统全功能，月球水冰用于维持生存所需，石英模块可用于合成关键组件，以及飞船零件用于修复核心系统。这些物资散落在我们周围的坠毁区域和更远的月球表面上。"'
        },
        {
          scene: '',
          speaker: '队长',
          text: '"明白了，像个捡破烂的。但我们没有这里的资源分布图。"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"请放心，队长。飞船数据库中的"月球资源图鉴"模块奇迹般地完好无损。它已在我的工作台界面激活。您可以随时查阅，它会扫描并记录您发现的所有可用资源信息，并标注其大致用途，辅助您进行收集决策。"'
        },
        {
          scene: '',
          speaker: '队长',
          text: '（站起身，活动了一下酸痛的身体，眼神变得坚定）"好吧，没有时间哀悼了。星璇，在我外出时，维持住船舱的基本环境。"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"明白，队长。我会监控您的生命体征和周围环境。请注意安全，那个巨大的生命体信号……虽然已退回阴影区，但并未消失。愿您顺利，788飞船的最后希望。"'
        }
      ],
      // 结局剧情对话
      endingDialogues: [
        {
          scene: '788飞船号主驾驶舱。与开场时的破败不同，舱内虽然依旧留有战斗的痕迹，但指示灯大部分恢复了绿色，引擎发出低沉而稳定的嗡鸣。你（队长）站在主控台前，身上带着硝烟与磨损的痕迹，但眼神锐利如鹰。',
          speaker: '队长',
          text: '（抹去额角的汗水与油污，长长地舒了一口气）"星璇，最终系统自检。报告状态！"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"所有系统报告：就绪。船体结构修复度91%，足以支撑返航。能量核心输出稳定，达到峰值110%。生命维持系统全功能恢复。导航系统已重新校准，锁定地球坐标。"'
        },
        {
          scene: '',
          speaker: '队长',
          text: '"很好……我们做到了。"（他的目光投向窗外，那片曾经蛰伏着巨大阴影的月球区域，如今只剩下一个巨大的坑洞和四散的奇异残骸）"那个东西……"黯影利维坦"的残骸信号确认消失了吗？"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"确认。目标生命信号已完全消散。队长，您的战斗数据已被记录。分析显示，该生物的核心能量与导致我们坠毁的脉冲同源。您不仅为我们复仇，也为后续可能的调查消除了最大威胁。"'
        },
        {
          scene: '',
          speaker: '队长',
          text: '（沉默片刻，声音低沉）"不是为了复仇，星璇。是为了生存，也是为了……告慰所有没能回去的队员。"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"理解。他们的牺牲，已被记录在飞船的核心记忆体中。我们将带着他们的故事回家。"'
        },
        {
          scene: '',
          speaker: '队长',
          text: '（点点头，手指在控制台上熟练地操作着）"启动发射序列。是时候离开这个鬼地方了。"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"发射序列启动。倒计时60秒。请确认所有资源已固定。"'
        },
        {
          scene: '',
          speaker: '队长',
          text: '（系好安全带，最后看了一眼这片荒凉而危险的土地）"所有资源，包括我们收集的所有矿物、晶体，还有从那个怪物身上采集到的"活性暗物质样本"，都已妥善存放。这些……将是地球了解这里发生一切的关键。"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"资源图鉴已更新至100%。这份完整的数据库，其价值无法估量。队长，这趟旅程，您证明了人类在绝境中的坚韧与智慧。"'
        },
        {
          scene: '',
          speaker: '队长',
          text: '（嘴角露出一丝疲惫但真诚的微笑）"不，星璇，是我们证明了。没有你，我早就死在月尘里了。准备好了吗？让我们……回家。"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"当然，队长。坐标：地球。任务最终阶段：回家。"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"倒计时：3… 2… 1…"'
        },
        {
          scene: '',
          speaker: 'AI星璇',
          text: '"788飞船，起飞！"'
        },
        {
          scene: '剧烈的推背感传来，飞船稳健地挣脱月球的引力，朝着深邃宇宙中那颗蓝色的美丽星球飞去。主屏幕上，地球的影像越来越大，越来越清晰。',
          speaker: 'AI星璇',
          text: '（轻声，如同最后的旁白）"欢迎回家，队长。愿月光，永不再如此冰冷。"'
        }
      ],
      workbenchResources: { // 工作台资源存储
        '月球玄武岩': 0,
        '月球硅石': 0,
        '钛铁矿': 0,
        '月球水冰': 0,
        '月球硅石模块': 0,
        '石英模块': 0,
        '废弃卫星的太阳能电池板': 0,
        '飞船零件': 0,
        '太阳能充电板': 0,
        '无尽能源': 0
      },
      // 合成配方数据
      craftingRecipes: {
        '钻探机': {
          icon: '🛠️',
          type: 'tool',
          ingredients: {
            '月球玄武岩': 5,
            '月球硅石模块': 2
          },
          description: '用于提取月球水冰的专用设备'
        },
        '冷凝模块': {
          icon: '❄️',
          type: 'module',
          ingredients: {
            '月球硅石模块': 3,
            '钛铁矿': 1
          },
          description: '钻探机的配套模块，用于冷凝提取的水冰'
        },
        '高级激光镐': {
          icon: '⚡',
          type: 'tool',
          ingredients: {
            '基础激光镐': 1, // 特殊标记，需要玩家拥有
            '钛铁矿': 3,
            '月球硅石模块': 2
          },
          requiresTool: '基础激光镐',
          description: '用于挖掘深层岩石的高级工具'
        },
        '地质探测器': {
          icon: '📡',
          type: 'tool',
          ingredients: {
            '月球硅石模块': 2,
            '月球玄武岩': 1
          },
          description: '用于定位深层矿点的探测设备'
        },
        '机械拆解机': {
          icon: '🔧',
          type: 'tool',
          ingredients: {
            '钛铁矿': 3,
            '月球硅石模块': 2,
            '月球玄武岩': 1
          },
          description: '用于拆解陨石和废弃探测器的机械装置'
        },
        '太阳能充电板': {
          icon: '☀️',
          type: 'module',
          ingredients: {
            '钛铁矿': 2,
            '月球玄武岩': 3,
            '石英模块': 2
          },
          description: '可以增加能源系统10点能源上限的充电板'
        }
      },
      // 已拥有的工具（初始装备）
      ownedTools: {
        '基础激光镐': true,
        '电击枪': true,
        '光子盾': true
      },
      // 资源图鉴数据
      resourceEncyclopedia: {
        '月球玄武岩': {
          icon: '🪨',
          location: '月球表面任意区域',
          tool: '基础激光镐',
          toolRecipe: '初始任务解锁，无需合成',
          mechanism: '点击挖掘，每3秒获取1单位'
        },
        '无尽能源': {
          icon: '♾️',
          location: '击败未知区BOSS「谱尼」后唯一获得',
          tool: '无',
          toolRecipe: '不可合成',
          mechanism: '击败谱尼后自动存入工作台资源储藏（仅1份，除非重置第一天）',
          usage: '飞船最终修复与起飞的关键能源核心，逃离时必需'
        },
        '月球水冰': {
          icon: '🧊',
          location: '南极/北极永久阴影区',
          tool: '钻探机 + 冷凝模块',
          toolRecipe: '钻探机：5单位玄武岩 + 2单位硅石；冷凝模块：3单位硅石 + 1单位钛铁矿',
          mechanism: '抵达阴影区后部署钻探机，每10秒提取2单位水冰，需消耗1单位能源维持运转'
        },
        '钛铁矿': {
          icon: '⛏️',
          location: '风暴洋、澄海玄武岩深层区',
          tool: '高级激光镐，且需先解锁"地质探测器"定位矿点',
          toolRecipe: '高级激光镐：基础激光镐 + 3单位钛铁矿 + 2单位硅石；地质探测器：2单位硅石 + 1单位玄武岩',
          mechanism: '挖掘深层岩石，每5秒获取1单位'
        },
        '陨石碎片': {
          icon: '🌠',
          location: '随机刷新的陨石撞击坑',
          tool: '机械拆解机',
          toolRecipe: '3单位钛铁矿 + 2单位硅石 + 1单位玄武岩',
          mechanism: '撞击坑生成后1小时内可拆解，每次拆解获取2-5单位碎片，同时有30%概率获得探测器残骸'
        },
        '飞船零件': {
          icon: '🚀',
          location: '废弃探测器遗址、陨石撞击坑',
          tool: '机械拆解机（与获取陨石碎片所用工具相同）',
          toolRecipe: '同机械拆解机合成配方，即3单位钛铁矿 + 2单位硅石 + 1单位玄武岩',
          mechanism: '拆解废弃探测器有50%概率获得1个零件（共需8种零件）；陨石撞击坑有20%概率掉落1个零件'
        },
        '月球硅石': {
          icon: '💎',
          location: '月球"雨海"区域（浅色石英岩），废弃卫星太阳能电池板',
          tool: '矿石筛选机（常规方式），机械拆解机（特殊方式）',
          toolRecipe: '矿石筛选机：需先合成；机械拆解机：3单位钛铁矿 + 2单位硅石 + 1单位玄武岩',
          mechanism: '常规：在"雨海"区域挖掘浅色石英岩，用矿石筛选机分离出高纯度硅石；特殊：拆解废弃卫星的太阳能电池板，可回收5-8个单位硅石（无需筛选）',
          usage: '升级能源设备：向太阳能板中添加硅石涂层，可提升15%白天发电效率；制作信号增幅器：在远距采矿点搭建增幅器，可避免因距离过远导致的设备失控'
        },
        '硫铁矿': {
          icon: '🔥',
          location: '月球"澄海"边缘的红色矿脉，陨石撞击坑（偶尔刷新）',
          tool: '高级激光镐（基础镐无法破坏矿脉）',
          toolRecipe: '高级激光镐：基础激光镐 + 3单位钛铁矿 + 2单位硅石',
          mechanism: '在"澄海"边缘的红色矿脉中开采，需用高级激光镐；偶尔随陨石撞击坑刷新，与陨石碎片一同获取（单次最多3个单位）',
          usage: '制作防腐剂：向食物储存仓添加硫铁矿提炼的防腐剂，可延长月球土豆保质期50%；应急发电：将硫铁矿与水混合，通过化学发电装置产生临时电能（1单位可供电1小时，适合夜间能源中断时应急）；修复密封层：基地因陨石撞击出现裂缝时，用硫铁矿混合玄武岩制作密封胶，可快速封堵漏洞（不修复会持续流失氧气）'
        },
        '废弃卫星的太阳能电池板': {
          icon: '🔋',
          location: '风暴洋、澄海玄武岩地区',
          tool: '基础激光镐',
          toolRecipe: '初始任务解锁，无需合成',
          mechanism: '在风暴洋、澄海玄武岩地区挖掘玄武岩时，有30%的概率掉落废弃卫星的太阳能电池板',
          usage: '拆解回收：可使用机械拆解机拆解，回收5-8单位高纯度月球硅石（无需筛选）；能源升级：修复后可作为基地能源系统的补充电源，白天额外提供20点能源上限；信号增强：改装后可增强基地与外界的通讯信号强度，提高远距离采矿设备的稳定性'
        },
        '石英模块': {
          icon: '💎',
          location: '月球"雨海"区域（浅色石英岩）',
          tool: '基础激光镐或高级激光镐',
          toolRecipe: '初始任务解锁，无需合成',
          mechanism: '在"雨海"区域挖掘浅色石英岩获得石英模块，需要使用矿石筛选机筛选为高纯度月球硅石模块',
          usage: '筛选加工：使用矿石筛选机将石英模块筛选为月球硅石模块，比例为1:1；合成材料：可用于合成太阳能充电板等物品'
        },
        '月球硅石模块': {
          icon: '💎',
          location: '矿石筛选机加工、机械拆解机拆解',
          tool: '矿石筛选机、机械拆解机',
          toolRecipe: '矿石筛选机：需先合成；机械拆解机：3单位钛铁矿 + 2单位硅石 + 1单位玄武岩',
          mechanism: '常规：使用矿石筛选机将石英模块筛选为月球硅石模块；特殊：使用机械拆解机拆解废弃卫星的太阳能电池板，可回收5-8单位（无需筛选）',
          usage: '合成材料：用于合成各种工具和模块的重要材料；升级能源设备：向太阳能板中添加硅石涂层，可提升15%白天发电效率；制作信号增幅器：在远距采矿点搭建增幅器，可避免因距离过远导致的设备失控'
        }
      },
      // 武器图鉴数据
      weaponEncyclopedia: {
        '电击枪': {
          icon: '⚡',
          type: '远程武器',
          acquisition: '初始装备',
          description: '用于防御和战斗的电击武器，发射高能电击子弹对敌人造成伤害',
          usage: '使用鼠标左键或空格键发射电击子弹攻击敌人。每次攻击消耗1发电击子弹。在太空舱内的统一充能装置可以消耗10点能源充能，获得30发电击子弹。',
          stats: '伤害：15点 | 射速：快速 | 弹容量：30发',
          requirement: '需要在太空舱内的统一充能装置充能，消耗能源'
        },
        '光子盾': {
          icon: '🛡️',
          type: '防御装备',
          acquisition: '初始装备',
          description: '提供防护能量的防御系统，能够吸收和阻挡敌人的攻击',
          usage: '按空格键激活光子盾牌，在玩家周围形成防护屏障。激活后可以阻挡敌人的攻击，每次阻挡消耗1点能量。在太空舱内的统一充能装置可以消耗10点能源充能，获得20点光子盾能量（最大20点）。',
          stats: '防护值：20点 | 持续时间：短暂 | 冷却时间：无',
          requirement: '需要在太空舱内的统一充能装置充能，消耗能源'
        }
      },
      
      // 怪物图鉴数据
      monsterEncyclopedia: {
        '洞刺兽': {
          icon: '🦏',
          type: '普通怪物',
          location: '风暴洋、澄海玄武岩地区',
          hp: 60,
          value: 100,
          appearance: '体型类似地球野猪，背部凸起布满透明棱柱状晶体，晶体可吸收月球白天的太阳辐射；腹部为柔软的淡紫色皮肤，布满细小血管；四肢粗壮，蹄子能刨开月壤快速移动，移动时背部晶体会发出微弱蓝光。',
          attack1: '晶体喷射：当玩家距离 5-10 米时，背部晶体脱离身体，以抛物线轨迹快速射向玩家，晶体落地后会碎裂成 3 片小晶体，小晶体在 10 秒内持续释放低温寒气，同时移动速度降低 15%。',
          attack2: '冲锋顶撞：若玩家进入 3 米范围，晶洞刺兽会压低身体，以每秒 12 米的速度冲锋，撞击后造成 5 点物理伤害，同时将玩家击退 5 米。',
          weakness: '保持距离，避免近战。利用远程武器攻击其背部的晶体弱点'
        },
        '月球幽灵': {
          icon: '👻',
          type: '普通怪物',
          location: '雨海区域',
          hp: 30,
          value: 150,
          appearance: '半透明的紫色幽灵，拥有红色的发光眼睛，可以在空中自由飞行。手持巨大的镰刀，具有强大的法术能力。',
          attack1: '法术攻击：发射3发追踪法术弹，造成4点伤害。法术弹会追踪玩家位置。',
          attack2: '元气弹：向四周发射8发黄色元气弹，造成5点伤害。弹幕间距较大，玩家可以在空隙中躲避。',
          attack3: '突然位移：当距离玩家较远时，会突然位移到玩家附近，移动速度极快（800像素/秒）。',
          attack4: '镰刀攻击：当靠近玩家时（距离小于100像素），会挥舞镰刀进行近战攻击，造成8点伤害。',
          weakness: '保持移动，避免被近身。注意躲避法术弹和元气弹。月球幽灵移动速度很快，需要提前预判位置。'
        },
        '谱尼': {
          icon: '👾',
          type: 'BOSS',
          location: '未知区域',
          hp: 5000,
          appearance: '巨大的宇宙生物，拥有暗紫色和暗红色的身体，血红色的发光眼睛，尖锐的触手和尖刺。身体周围环绕着触手，具有强大的宇宙能量。',
          skills: '元气弹：向四周发射黄色元气弹，造成8点伤害 | 四周激光：从身体散发慢速激光子弹，形成圆周弹幕，造成5点伤害 | 旋转弹幕：释放旋转的绿色激光弹幕，造成6点伤害',
          attack1: '元气弹：以自身为中心向四周发射16发黄色元气弹，弹幕间距较大，玩家可以在空隙中躲避',
          attack2: '四周激光：从身体边缘向四周发射12发慢速青色激光弹，子弹速度较慢，便于玩家识别和躲避',
          weakness: '保持移动，观察弹幕空隙。注意BOSS的攻击范围，及时躲避'
        }
      },
      
      // 工具图鉴数据
      toolEncyclopedia: {
        '基础激光镐': {
          icon: '🔨',
          type: '工具',
          acquisition: '初始任务解锁，无需合成',
          description: '基础的挖掘工具，用于在月球表面挖掘玄武岩',
          usage: '在月球表面任意区域挖掘，每3秒可获取1单位月球玄武岩。点击挖掘目标即可开始挖掘，消耗激光能量。',
          requirement: '无特殊要求，初始装备'
        },
        '电击枪': {
          icon: '⚡',
          type: '武器',
          acquisition: '初始装备',
          description: '用于防御和战斗的电击武器',
          usage: '发射电击子弹攻击敌人，每次攻击消耗子弹。在太空舱内的工作台可以消耗10点能源充能，获得30发电击子弹。',
          requirement: '需要在太空舱内的工作台充能，消耗能源'
        },
        '光子盾': {
          icon: '🛡️',
          type: '防御装备',
          acquisition: '初始装备',
          description: '提供防护能量的防御系统',
          usage: '吸收伤害，保护玩家免受攻击。在太空舱内的工作台可以消耗10点能源充能，获得20点光子盾能量（最大20点）。',
          requirement: '需要在太空舱内的工作台充能，消耗能源'
        },
        '太阳能充电板': {
          icon: '☀️',
          type: '模块',
          acquisition: '资源合成：钛铁矿 x2 + 月球玄武岩 x3 + 石英模块 x2',
          description: '可以增加能源系统10点能源上限的充电板',
          usage: '在能源系统面板中使用，每次使用可以增加10点能源上限。可在资源储藏中查看拥有的数量。',
          requirement: '需要在工作台的资源合成中合成'
        }
      }
    }
  },
      // 装置图鉴数据
      deviceEncyclopedia: {
        '工作台': {
          icon: '🔧',
          description: '管理与合成资源的核心装置，可进行资源储藏、资源合成及查看图鉴。',
          location: '飞船舱内',
          usage: '靠近后按E打开，使用上方选项卡切换不同功能界面。'
        },
        '能源系统': {
          icon: '🔋',
          description: '显示并管理基地能源上限与当前能量。',
          location: '飞船舱内',
          usage: '靠近后按E打开，可查看能量并使用太阳能充电板提升上限。'
        },
        '统一充能装置': {
          icon: '⚡',
          description: '为电击枪、光子盾、钻探机等设备进行统一充能。',
          location: '飞船舱内',
          usage: '靠近后按E打开，选择目标设备进行充能（消耗能源）。'
        },
        '矿石筛选机': {
          icon: '🔬',
          description: '将石英模块筛选为月球硅石模块（1:1）。',
          location: '飞船舱内',
          usage: '靠近后按E打开，输入数量进行筛选。'
        },
        '机械拆解机': {
          icon: '🧰',
          description: '拆解废弃卫星的太阳能电池板，回收5-8个月球硅石模块/个。',
          location: '飞船舱内',
          usage: '靠近后按E打开；需先拥有工具“机械拆解机”。'
        },
        '太阳能充电板': {
          icon: '☀️',
          description: '用于提升能源上限的模块，每安装一块+10上限。',
          location: '工作台合成/获得后存放于工作台',
          usage: '在能源系统面板中使用，永久提升最大能源值并累计安装数量。'
    }
  },
  mounted() {
    // 从localStorage加载保存的能源值、游戏时间和资源
    const saved = localStorage.getItem('delta-action-game');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.energy !== undefined) {
          this.energy = data.energy;
        }
        if (data.gameTime !== undefined) {
          this.gameTime = data.gameTime;
        }
        if (data.photonShieldEnergy !== undefined) {
          this.photonShieldEnergy = data.photonShieldEnergy;
        }
        if (data.drillMachineEnergy !== undefined) {
          this.drillMachineEnergy = data.drillMachineEnergy;
        }
        // 加载保存的资源
        if (data.workbenchResources) {
          // 处理旧的"氦-3月球硅石模块"，如果存在则删除（只改内存，不写回存档）
          if (data.workbenchResources['氦-3月球硅石模块'] !== undefined) {
            delete data.workbenchResources['氦-3月球硅石模块'];
          }
          // 严格使用存档中的数量，不做任何赠送或写回
          const oldResources = { ...this.workbenchResources };
          this.workbenchResources = { ...this.workbenchResources, ...data.workbenchResources };
          
          // 调试信息：检查无尽能源是否正确加载
          const infiniteEnergy = this.workbenchResources['无尽能源'] || 0;
          const savedInfiniteEnergy = data.workbenchResources['无尽能源'] || 0;
          if (savedInfiniteEnergy > 0) {
            console.log('📦 资源加载完成:', {
              '无尽能源（存档中）': savedInfiniteEnergy,
              '无尽能源（加载后）': infiniteEnergy,
              '加载成功': infiniteEnergy === savedInfiniteEnergy
            });
          }
        }
        // 加载已拥有的工具
        if (data.ownedTools) {
          this.ownedTools = { ...this.ownedTools, ...data.ownedTools };
        }
        // 确保初始装备始终存在（即使存档中没有）
        this.ownedTools['基础激光镐'] = this.ownedTools['基础激光镐'] || true;
        this.ownedTools['电击枪'] = this.ownedTools['电击枪'] || true;
        this.ownedTools['光子盾'] = this.ownedTools['光子盾'] || true;
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    }
    
    // 确保CSS动画加载
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { box-shadow: 0 0 5px #ff5555; background: #444; }
        50% { box-shadow: 0 0 20px #ff5555; background: #555; }
        100% { box-shadow: 0 0 5px #ff5555; background: #444; }
      }
      @keyframes day-night {
        0% { background-color: #0a0a2a; } /* 深夜 */
        25% { background-color: #1a3a8f; } /* 清晨 */
        50% { background-color: #87CEEB; } /* 正午 */
        75% { background-color: #FF7F50; } /* 黄昏 */
        100% { background-color: #0a0a2a; } /* 深夜 */
      }
    `;
    document.head.appendChild(style);

    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    window.addEventListener('keyup', this.handleKeyUp, { passive: false });
    this.gameLoop = setInterval(this.updatePosition, 16);
    this.timeLoop = setInterval(this.updateTime, 1000); // 每秒更新时间
    
    this.$nextTick(() => {
      const door = document.querySelector('.airlock-door');
      door.classList.add('force-render');
      setTimeout(() => door.classList.remove('force-render'), 100);
      
      // 检查是否是第一次进入游戏（是否已看过开场剧情）
      const hasSeenOpening = localStorage.getItem('has-seen-opening-dialogue');
      if (!hasSeenOpening) {
        // 第一次进入，显示开场剧情
        this.showOpeningDialogue = true;
        this.dialogueIndex = 0;
      }
    });
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    clearInterval(this.gameLoop);
    clearInterval(this.timeLoop);
    // 清理逃离动画
    this.stopEscapeAnimation();
  },
  watch: {
    // 监听动画状态，自动启动动画
    isEscapeAnimation(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.startEscapeAnimation();
        });
      } else {
        this.stopEscapeAnimation();
      }
    }
  },
  computed: {
    // 当前场景描述
    currentSceneDescription() {
      if (this.dialogueIndex < this.openingDialogues.length) {
        return this.openingDialogues[this.dialogueIndex].scene;
      }
      return '';
    },
    // 当前说话者
    currentSpeaker() {
      if (this.dialogueIndex < this.openingDialogues.length) {
        return this.openingDialogues[this.dialogueIndex].speaker;
      }
      return '';
    },
    // 当前对话文本
    currentDialogueText() {
      if (this.dialogueIndex < this.openingDialogues.length) {
        return this.openingDialogues[this.dialogueIndex].text;
      }
      return '';
    },
    // 是否是最后一句对话
    isLastDialogue() {
      return this.dialogueIndex >= this.openingDialogues.length - 1;
    },
    energyPercentage() {
      return (this.energy / this.maxEnergy) * 100;
    },
    nextChargeTime() {
      // 计算距离下次充电还有多少分钟（游戏内时间）
      const timeSinceLastCharge = this.gameTime - this.lastChargeTime;
      const timeToNextCharge = Math.max(0, 50 - (timeSinceLastCharge % 50)); // 游戏内1小时=50秒
      return Math.ceil(timeToNextCharge / 50 * 60); // 转换为现实分钟
    },
    chargingStatusText() {
      if (this.energy >= 200) {
        return '能源已满';
      } else if (this.isChargingActive) {
        return '充电中...';
      } else {
        return '等待充电';
      }
    },
    // 检查是否拥有机械拆解机工具（计算属性，响应式更新）
    hasDisassembler() {
      return this.isToolOwned('机械拆解机');
    },
    // 计算逃离进度百分比
    escapeProgressPercentage() {
      let totalRequired = 0;
      let totalCollected = 0;
      
      Object.keys(this.escapeRequirements).forEach(resource => {
        const required = this.escapeRequirements[resource];
        const collected = Math.min(this.getResourceCount(resource), required);
        totalRequired += required;
        totalCollected += collected;
      });
      
      return totalRequired > 0 ? (totalCollected / totalRequired) * 100 : 0;
    },
    // 检查是否可以逃离
    canEscape() {
      return Object.keys(this.escapeRequirements).every(resource => {
        return this.getResourceCount(resource) >= this.escapeRequirements[resource];
      });
    },
    // 剩余资源列表（数组，便于展示）
    remainingResourcesArray() {
      return Object.keys(this.escapeRequirements)
        .map(name => {
          const need = this.escapeRequirements[name];
          const have = this.getResourceCount(name);
          return { name, remaining: Math.max(0, need - have) };
        })
        .filter(item => item.remaining > 0);
    },
    // 当前结局场景描述
    currentEndingScene() {
      if (this.endingDialogueIndex < this.endingDialogues.length) {
        return this.endingDialogues[this.endingDialogueIndex].scene;
      }
      return '';
    },
    // 当前结局说话者
    currentEndingSpeaker() {
      if (this.endingDialogueIndex < this.endingDialogues.length) {
        return this.endingDialogues[this.endingDialogueIndex].speaker;
      }
      return '';
    },
    // 当前结局对话文本
    currentEndingText() {
      if (this.endingDialogueIndex < this.endingDialogues.length) {
        return this.endingDialogues[this.endingDialogueIndex].text;
      }
      return '';
    },
    // 是否是最后一句结局对话
    isLastEndingDialogue() {
      return this.endingDialogueIndex >= this.endingDialogues.length - 1;
    },
    // 是否显示逃离动画（最后一段对话时显示）
    isEscapeAnimation() {
      return this.showEndingDialogue && 
             this.endingDialogueIndex === this.endingDialogues.length - 1 &&
             this.endingDialogues[this.endingDialogueIndex]?.scene?.includes('飞船稳健地挣脱月球的引力');
    }
  },
  methods: {
    // 下一句对话
    nextDialogue() {
      if (this.isLastDialogue) {
        // 对话结束，标记已看过，关闭对话，返回初始界面
        localStorage.setItem('has-seen-opening-dialogue', 'true');
        this.showOpeningDialogue = false;
      } else {
        // 继续下一句对话
        this.dialogueIndex++;
      }
    },
    startGame() {
      this.$emit('start-game', {
        playerData: {
          electricBullets: this.electricBullets,
          photonShieldEnergy: this.photonShieldEnergy,
          drillMachineEnergy: this.drillMachineEnergy
        },
        gameTime: this.gameTime
      });
    },
    // 重置到第一天
    // AI交互方法
    handleAIClick() {
      if (this.canInteractWithAI) {
        this.showAIPanel = true;
      }
    },
    closeAIPanel() {
      this.showAIPanel = false;
    },
    // 启动逃离序列
    startEscapeSequence() {
      if (!this.canEscape) {
        alert('资源尚未集齐，无法启动逃离序列！');
        return;
      }
      
      if (!confirm('确定要启动逃离序列吗？\n这将触发结局剧情，游戏将结束。')) {
        return;
      }
      
      // 关闭AI面板，显示结局对话
      this.showAIPanel = false;
      this.showEndingDialogue = true;
      this.endingDialogueIndex = 0;
    },
    // 下一句结局对话
    nextEndingDialogue() {
      if (this.isLastEndingDialogue) {
        // 到达最后一段对话，启动动画（动画会自动播放并最终回到游戏开始）
        this.$nextTick(() => {
          if (this.isEscapeAnimation) {
            this.startEscapeAnimation();
          }
        });
      } else {
        // 继续下一句对话
        this.endingDialogueIndex++;
      }
    },
    // 启动逃离动画
    startEscapeAnimation() {
      if (!this.$refs.escapeCanvas) return;
      
      const canvas = this.$refs.escapeCanvas;
      const ctx = canvas.getContext('2d');
      
      // 设置画布大小的函数
      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      
      // 初始设置
      resizeCanvas();
      
      // 监听窗口大小改变
      window.addEventListener('resize', resizeCanvas);
      
      // 保存清理函数
      this._escapeResizeHandler = resizeCanvas;
      
      this.escapeAnimationTime = 0;
      this.escapeSceneIndex = 0;
      this.drawEscapeAnimation(ctx, canvas);
    },
    // 绘制逃离动画
    drawEscapeAnimation(ctx, canvas) {
      const time = this.escapeAnimationTime;
      const width = canvas.width;
      const height = canvas.height;
      
      // 计算当前镜头和进度
      let sceneTime = 0;
      let currentScene = null;
      let sceneProgress = 0;
      
      for (let i = 0; i < this.escapeScenes.length; i++) {
        const scene = this.escapeScenes[i];
        if (time < sceneTime + scene.duration) {
          currentScene = scene;
          this.escapeSceneIndex = i;
          sceneProgress = (time - sceneTime) / scene.duration;
          break;
        }
        sceneTime += scene.duration;
      }
      
      // 如果所有镜头都播放完毕，自动回到游戏开始
      if (!currentScene) {
        this.stopEscapeAnimation();
        this.showEndingDialogue = false;
        this.resetToDayOneAfterEscape();
        return;
      }
      
      // 根据当前镜头绘制不同场景
      switch (currentScene.name) {
        case 'moon_surface':
          this.drawMoonSurfaceScene(ctx, width, height, sceneProgress);
          break;
        case 'takeoff':
          this.drawTakeoffScene(ctx, width, height, sceneProgress);
          break;
        case 'space_flight':
          this.drawSpaceFlightScene(ctx, width, height, sceneProgress);
          break;
        case 'approach_earth':
          this.drawApproachEarthScene(ctx, width, height, sceneProgress);
          break;
        case 'landing':
          this.drawLandingScene(ctx, width, height, sceneProgress);
          break;
        case 'fade_out':
          this.drawFadeOutScene(ctx, width, height, sceneProgress);
          break;
      }
      
      // 更新动画时间
      this.escapeAnimationTime += 0.016; // 约60fps
      
      // 继续动画
      if (this.isEscapeAnimation && this.showEndingDialogue) {
        this.escapeAnimationFrame = requestAnimationFrame(() => {
          this.drawEscapeAnimation(ctx, canvas);
        });
      }
    },
    // 镜头1：月球表面准备起飞
    drawMoonSurfaceScene(ctx, width, height, progress) {
      // 深空背景
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, width, height);
      
      // 星空
      this.drawStars(ctx, width, height, this.escapeAnimationTime);
      
      // 绘制月球表面（从下方视角）
      const moonY = height * 0.85;
      const moonRadius = width * 0.6;
      
      // 月球表面渐变
      const moonGradient = ctx.createRadialGradient(
        width / 2, moonY, 0,
        width / 2, moonY, moonRadius
      );
      moonGradient.addColorStop(0, '#d0d0d0');
      moonGradient.addColorStop(0.5, '#b0b0b0');
      moonGradient.addColorStop(1, '#808080');
      
      ctx.fillStyle = moonGradient;
      ctx.beginPath();
      ctx.ellipse(width / 2, moonY, moonRadius, moonRadius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 月球表面细节（陨石坑、岩石）
      ctx.fillStyle = '#909090';
      for (let i = 0; i < 15; i++) {
        const x = (width * 0.2) + (i * 50) % (width * 0.6);
        const y = moonY - 20 + Math.sin(i) * 10;
        const size = 5 + (i % 3) * 3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 绘制飞船（在月球表面）
      const shipX = width * 0.3;
      const shipY = moonY - 40;
      const shipSize = 30;
      
      ctx.save();
      ctx.translate(shipX, shipY);
      
      // 飞船主体
      ctx.fillStyle = '#666666';
      ctx.beginPath();
      ctx.moveTo(shipSize, 0);
      ctx.lineTo(-shipSize * 0.6, -shipSize * 0.4);
      ctx.lineTo(-shipSize * 0.2, 0);
      ctx.lineTo(-shipSize * 0.6, shipSize * 0.4);
      ctx.closePath();
      ctx.fill();
      
      // 飞船细节（窗户、标志）
      ctx.fillStyle = '#4a90e2';
      ctx.beginPath();
      ctx.arc(shipSize * 0.3, 0, shipSize * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      // 引擎准备启动（闪烁效果）
      if (progress > 0.5) {
        const flameSize = (progress - 0.5) * 20;
        const flameGradient = ctx.createLinearGradient(-shipSize * 0.2, 0, -shipSize * 1.2, 0);
        flameGradient.addColorStop(0, `rgba(255, 107, 0, ${(progress - 0.5) * 2})`);
        flameGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        ctx.fillStyle = flameGradient;
        ctx.beginPath();
        ctx.ellipse(-shipSize * 0.2, 0, flameSize, flameSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
      
      // 文字提示（淡入）
      if (progress > 0.3) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(progress - 0.3) * 1.43})`;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('788飞船准备起飞...', width / 2, height * 0.2);
      }
    },
    // 镜头2：起飞
    drawTakeoffScene(ctx, width, height, progress) {
      // 深空背景
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, width, height);
      
      // 星空
      this.drawStars(ctx, width, height, this.escapeAnimationTime);
      
      // 月球（在下方，逐渐变小）
      const moonY = height * 0.85 - progress * height * 0.3;
      const moonSize = width * 0.6 * (1 - progress * 0.5);
      
      if (moonSize > 0) {
        const moonGradient = ctx.createRadialGradient(
          width / 2, moonY, 0,
          width / 2, moonY, moonSize
        );
        moonGradient.addColorStop(0, '#d0d0d0');
        moonGradient.addColorStop(1, '#808080');
        
        ctx.fillStyle = moonGradient;
        ctx.beginPath();
        ctx.ellipse(width / 2, moonY, moonSize, moonSize * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 飞船（从月球表面上升）
      const shipStartY = height * 0.85 - 40;
      const shipY = shipStartY - progress * height * 0.4;
      const shipX = width * 0.3;
      const shipSize = 30;
      
      ctx.save();
      ctx.translate(shipX, shipY);
      ctx.rotate(-Math.PI / 2); // 垂直向上
      
      // 飞船主体
      ctx.fillStyle = '#666666';
      ctx.beginPath();
      ctx.moveTo(0, -shipSize);
      ctx.lineTo(-shipSize * 0.4, shipSize * 0.6);
      ctx.lineTo(0, shipSize * 0.2);
      ctx.lineTo(shipSize * 0.4, shipSize * 0.6);
      ctx.closePath();
      ctx.fill();
      
      // 强烈的引擎火焰
      const flameSize = 25 + Math.sin(this.escapeAnimationTime * 15) * 8;
      const flameGradient = ctx.createLinearGradient(0, shipSize * 0.2, 0, shipSize * 1.5);
      flameGradient.addColorStop(0, '#ff6b00');
      flameGradient.addColorStop(0.3, '#ffd700');
      flameGradient.addColorStop(0.6, '#ffff00');
      flameGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
      
      ctx.fillStyle = flameGradient;
      ctx.beginPath();
      ctx.ellipse(0, shipSize * 0.2, flameSize, flameSize * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 引擎粒子效果
      for (let i = 0; i < 20; i++) {
        const particleY = shipSize * 0.2 + Math.random() * flameSize * 2;
        const particleX = (Math.random() - 0.5) * flameSize;
        const particleSize = Math.random() * 3;
        ctx.fillStyle = `rgba(255, ${200 + Math.random() * 55}, 0, ${1 - particleY / (flameSize * 2)})`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    },
    // 镜头3：太空飞行
    drawSpaceFlightScene(ctx, width, height, progress) {
      // 深空背景
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, width, height);
      
      // 丰富的星空（更多星星）
      this.drawStars(ctx, width, height, this.escapeAnimationTime, 300);
      
      // 地球（在远处，逐渐变大）
      const earthSize = 80 + progress * 200;
      const earthX = width / 2;
      const earthY = height / 2;
      
      // 绘制地球
      const earthGradient = ctx.createRadialGradient(
        earthX, earthY, 0,
        earthX, earthY, earthSize
      );
      earthGradient.addColorStop(0, '#6bb3ff');
      earthGradient.addColorStop(0.3, '#5ba3f5');
      earthGradient.addColorStop(0.6, '#4a90e2');
      earthGradient.addColorStop(1, '#2a5a8a');
      
      ctx.fillStyle = earthGradient;
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthSize, 0, Math.PI * 2);
      ctx.fill();
      
      // 地球大气层光晕
      ctx.strokeStyle = 'rgba(135, 206, 250, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthSize + 5, 0, Math.PI * 2);
      ctx.stroke();
      
      // 地球大陆
      ctx.fillStyle = '#2d5016';
      ctx.beginPath();
      ctx.arc(earthX - earthSize * 0.3, earthY - earthSize * 0.2, earthSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(earthX + earthSize * 0.2, earthY + earthSize * 0.3, earthSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(earthX - earthSize * 0.1, earthY + earthSize * 0.4, earthSize * 0.25, 0, Math.PI * 2);
      ctx.fill();
      
      // 地球云层
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(earthX - earthSize * 0.2, earthY - earthSize * 0.1, earthSize * 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      // 月球（在左下角，逐渐变小）
      const moonSize = 60 - progress * 50;
      const moonX = width * 0.15;
      const moonY = height * 0.75;
      
      if (moonSize > 0) {
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 月球细节
        ctx.fillStyle = '#a0a0a0';
        ctx.beginPath();
        ctx.arc(moonX - moonSize * 0.3, moonY - moonSize * 0.2, moonSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 飞船（从月球飞向地球）
      const shipProgress = progress;
      const shipX = moonX + (earthX - moonX) * shipProgress;
      const shipY = moonY + (earthY - moonY) * shipProgress;
      const shipSize = 25;
      const shipAngle = Math.atan2(earthY - moonY, earthX - moonX);
      
      ctx.save();
      ctx.translate(shipX, shipY);
      ctx.rotate(shipAngle);
      
      // 飞船主体
      ctx.fillStyle = '#666666';
      ctx.beginPath();
      ctx.moveTo(shipSize, 0);
      ctx.lineTo(-shipSize * 0.6, -shipSize * 0.4);
      ctx.lineTo(-shipSize * 0.2, 0);
      ctx.lineTo(-shipSize * 0.6, shipSize * 0.4);
      ctx.closePath();
      ctx.fill();
      
      // 飞船窗户
      ctx.fillStyle = '#4a90e2';
      ctx.beginPath();
      ctx.arc(shipSize * 0.3, 0, shipSize * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      // 引擎火焰
      const flameSize = 18 + Math.sin(this.escapeAnimationTime * 10) * 5;
      const flameGradient = ctx.createLinearGradient(-shipSize * 0.2, 0, -shipSize * 1.5, 0);
      flameGradient.addColorStop(0, '#ff6b00');
      flameGradient.addColorStop(0.5, '#ffd700');
      flameGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
      
      ctx.fillStyle = flameGradient;
      ctx.beginPath();
      ctx.ellipse(-shipSize * 0.2, 0, flameSize, flameSize * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      
      // 飞行轨迹
      if (shipProgress > 0.1) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * (1 - shipProgress)})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(moonX, moonY);
        ctx.lineTo(shipX, shipY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    },
    // 镜头4：接近地球
    drawApproachEarthScene(ctx, width, height, progress) {
      // 深空背景
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, width, height);
      
      // 星空
      this.drawStars(ctx, width, height, this.escapeAnimationTime);
      
      // 地球（占据大部分屏幕）
      const earthSize = 250 + progress * 150;
      const earthX = width / 2;
      const earthY = height / 2;
      
      // 地球主体
      const earthGradient = ctx.createRadialGradient(
        earthX, earthY, 0,
        earthX, earthY, earthSize
      );
      earthGradient.addColorStop(0, '#6bb3ff');
      earthGradient.addColorStop(0.2, '#5ba3f5');
      earthGradient.addColorStop(0.5, '#4a90e2');
      earthGradient.addColorStop(1, '#1a4a7a');
      
      ctx.fillStyle = earthGradient;
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthSize, 0, Math.PI * 2);
      ctx.fill();
      
      // 地球大气层（更明显）
      ctx.strokeStyle = 'rgba(135, 206, 250, 0.6)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthSize + 8, 0, Math.PI * 2);
      ctx.stroke();
      
      // 详细的大陆
      ctx.fillStyle = '#2d5016';
      // 大陆1
      ctx.beginPath();
      ctx.arc(earthX - earthSize * 0.3, earthY - earthSize * 0.2, earthSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
      // 大陆2
      ctx.beginPath();
      ctx.arc(earthX + earthSize * 0.2, earthY + earthSize * 0.3, earthSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
      // 大陆3
      ctx.beginPath();
      ctx.arc(earthX - earthSize * 0.1, earthY + earthSize * 0.4, earthSize * 0.25, 0, Math.PI * 2);
      ctx.fill();
      // 大陆4
      ctx.beginPath();
      ctx.arc(earthX + earthSize * 0.4, earthY - earthSize * 0.3, earthSize * 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      // 云层（更多）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 8; i++) {
        const cloudX = earthX + (Math.sin(i) * earthSize * 0.6);
        const cloudY = earthY + (Math.cos(i) * earthSize * 0.6);
        const cloudSize = earthSize * (0.15 + Math.random() * 0.1);
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, cloudSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 飞船（接近地球）
      const shipX = width * 0.2 + progress * width * 0.3;
      const shipY = height * 0.3 + progress * height * 0.2;
      const shipSize = 30;
      const shipAngle = Math.PI / 4 + progress * Math.PI / 4;
      
      ctx.save();
      ctx.translate(shipX, shipY);
      ctx.rotate(shipAngle);
      
      // 飞船主体
      ctx.fillStyle = '#666666';
      ctx.beginPath();
      ctx.moveTo(shipSize, 0);
      ctx.lineTo(-shipSize * 0.6, -shipSize * 0.4);
      ctx.lineTo(-shipSize * 0.2, 0);
      ctx.lineTo(-shipSize * 0.6, shipSize * 0.4);
      ctx.closePath();
      ctx.fill();
      
      // 飞船细节
      ctx.fillStyle = '#4a90e2';
      ctx.beginPath();
      ctx.arc(shipSize * 0.3, 0, shipSize * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      // 引擎火焰（调整方向）
      const flameSize = 20 + Math.sin(this.escapeAnimationTime * 12) * 6;
      const flameGradient = ctx.createLinearGradient(-shipSize * 0.2, 0, -shipSize * 1.5, 0);
      flameGradient.addColorStop(0, '#ff6b00');
      flameGradient.addColorStop(0.5, '#ffd700');
      flameGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
      
      ctx.fillStyle = flameGradient;
      ctx.beginPath();
      ctx.ellipse(-shipSize * 0.2, 0, flameSize, flameSize * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    },
    // 镜头5：降落
    drawLandingScene(ctx, width, height, progress) {
      // 地球表面视角
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
      skyGradient.addColorStop(0, '#87ceeb');
      skyGradient.addColorStop(0.5, '#4a90e2');
      skyGradient.addColorStop(1, '#2a5a8a');
      
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);
      
      // 云层
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let i = 0; i < 5; i++) {
        const cloudX = (width * 0.2) + (i * width * 0.15) + Math.sin(this.escapeAnimationTime + i) * 20;
        const cloudY = height * 0.2 + Math.sin(i) * 30;
        const cloudSize = 40 + i * 10;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, cloudSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 地面
      const groundY = height * 0.7;
      const groundGradient = ctx.createLinearGradient(0, groundY, 0, height);
      groundGradient.addColorStop(0, '#8b7355');
      groundGradient.addColorStop(1, '#5a4a3a');
      
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, groundY, width, height - groundY);
      
      // 地面细节（建筑、树木等）
      ctx.fillStyle = '#4a4a4a';
      // 建筑1
      ctx.fillRect(width * 0.2, groundY - 60, 40, 60);
      // 建筑2
      ctx.fillRect(width * 0.6, groundY - 80, 50, 80);
      // 建筑3
      ctx.fillRect(width * 0.8, groundY - 40, 30, 40);
      
      // 飞船（从天空降落）
      const shipY = height * 0.1 - progress * height * 0.4;
      const shipX = width / 2;
      const shipSize = 40;
      
      ctx.save();
      ctx.translate(shipX, shipY);
      
      // 飞船主体
      ctx.fillStyle = '#666666';
      ctx.beginPath();
      ctx.moveTo(0, -shipSize);
      ctx.lineTo(-shipSize * 0.4, shipSize * 0.6);
      ctx.lineTo(0, shipSize * 0.2);
      ctx.lineTo(shipSize * 0.4, shipSize * 0.6);
      ctx.closePath();
      ctx.fill();
      
      // 降落时的反推火焰
      const flameSize = 30 + Math.sin(this.escapeAnimationTime * 20) * 10;
      const flameGradient = ctx.createLinearGradient(0, shipSize * 0.2, 0, shipSize * 2);
      flameGradient.addColorStop(0, '#ff6b00');
      flameGradient.addColorStop(0.3, '#ffd700');
      flameGradient.addColorStop(0.6, '#ffff00');
      flameGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
      
      ctx.fillStyle = flameGradient;
      ctx.beginPath();
      ctx.ellipse(0, shipSize * 0.2, flameSize, flameSize * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      
      // 降落时的文字
      if (progress > 0.5) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(progress - 0.5) * 2})`;
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('欢迎回家，队长', width / 2, height * 0.9);
      }
    },
    // 镜头6：淡出
    drawFadeOutScene(ctx, width, height, progress) {
      // 黑色淡出
      ctx.fillStyle = `rgba(0, 0, 0, ${progress})`;
      ctx.fillRect(0, 0, width, height);
    },
    // 绘制星空（辅助函数）
    drawStars(ctx, width, height, time, count = 200) {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < count; i++) {
        const x = (i * 37) % width;
        const y = (i * 73) % height;
        const size = Math.sin(time * 0.5 + i) * 0.5 + 1;
        const brightness = 0.5 + Math.sin(time * 0.3 + i * 0.1) * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    // 停止逃离动画
    stopEscapeAnimation() {
      if (this.escapeAnimationFrame) {
        cancelAnimationFrame(this.escapeAnimationFrame);
        this.escapeAnimationFrame = null;
      }
      // 移除窗口大小改变监听器
      if (this._escapeResizeHandler) {
        window.removeEventListener('resize', this._escapeResizeHandler);
        this._escapeResizeHandler = null;
      }
      this.escapeAnimationTime = 0;
    },
    // 逃离后重置到第一天
    resetToDayOneAfterEscape() {
      // 重置游戏数据
      const initialData = {
        // 游戏时间重置到0（第一天）
        gameTime: 0,
        // 能源重置到初始值
        energy: 200,
        maxEnergy: 200,
        solarPanelsUsed: 0,
        // 武器能量重置
        electricBullets: 0,
        photonShieldEnergy: 0,
        drillMachineEnergy: 0,
        lastChargeTime: 0,
        // 资源重置（全部为0）
        workbenchResources: {
          '月球玄武岩': 0,
          '月球硅石': 0,
          '钛铁矿': 0,
          '月球水冰': 0,
          '月球硅石模块': 0,
          '石英模块': 0,
          '废弃卫星的太阳能电池板': 0,
          '飞船零件': 0,
          '太阳能充电板': 0,
          '无尽能源': 0
        },
        // 工具重置（只保留基础激光镐、电击枪、光子盾）
        ownedTools: {
          '基础激光镐': true,
          '电击枪': true,
          '光子盾': true
        },
        // 清除击败BOSS等标记
        flags: {
          puniDefeated: false
        }
      };
      
      // 保存到localStorage
      localStorage.setItem('delta-action-game', JSON.stringify(initialData));
      
      // 重置开场剧情对话标记，让玩家重新体验开场剧情
      localStorage.removeItem('has-seen-opening-dialogue');
      
      // 更新当前组件的数据
      this.gameTime = 0;
      this.currentHour = 6;
      this.dayNightCycle = 0;
      this.timeDisplay = '06:00';
      this.energy = 200;
      this.maxEnergy = 200;
      this.solarPanelsUsed = 0;
      this.electricBullets = 0;
      this.photonShieldEnergy = 0;
      this.drillMachineEnergy = 0;
      this.lastChargeTime = 0;
      this.workbenchResources = {
        '月球玄武岩': 0,
        '月球硅石': 0,
        '钛铁矿': 0,
        '月球水冰': 0,
        '月球硅石模块': 0,
        '石英模块': 0,
        '废弃卫星的太阳能电池板': 0,
        '飞船零件': 0,
        '太阳能充电板': 0,
        '无尽能源': 0
      };
      this.ownedTools = {
        '基础激光镐': true,
        '电击枪': true,
        '光子盾': true
      };
      
      // 显示成功消息
      alert('恭喜您完成了《月球求生记》！\n\n您成功收集了所有资源，修复了飞船，并逃离了月球。\n\n游戏已重置到第一天，您可以重新开始新的冒险！');
      
      // 刷新页面以应用所有更改
      setTimeout(() => {
        location.reload();
      }, 500);
    },
    // 向AI请求汇报剩余资源
    reportRemainingResources() {
      if (!this.remainingResourcesArray.length) {
        alert('报告：所有资源已集齐，可以随时启动逃离序列。');
        return;
      }
      const lines = this.remainingResourcesArray.map(item => `${item.name} x${item.remaining}`);
      alert(`报告：当前仍需资源如下：\n\n${lines.join('\n')}\n\n请继续收集，完成后可启动逃离序列。`);
    },
    // 增加所有资源100
    addResources100() {
      // 遍历所有资源，每个增加100
      Object.keys(this.workbenchResources).forEach(resource => {
        if (!this.workbenchResources[resource]) {
          this.workbenchResources[resource] = 0;
        }
        this.workbenchResources[resource] += 100;
      });
      
      // 保存到localStorage
      this.saveWorkbenchResources();
      
      // 显示成功消息
      alert('所有资源已增加100！\n\n当前资源数量：\n' + 
        Object.keys(this.workbenchResources).map(resource => 
          `${resource}: ${this.workbenchResources[resource]}`
        ).join('\n'));
    },
    resetToDayOne() {
      // 确认对话框
      if (!confirm('确定要重置到第一天吗？\n\n这将清除：\n- 所有资源（全部归零）\n- 所有已解锁的装置\n- 所有合成的工具（除了高级激光镐、电击枪、光子盾）\n- 游戏时间重置到第一天\n\n保留：\n- 高级激光镐\n- 电击枪\n- 光子盾\n\n此操作无法撤销！')) {
        return;
      }
      
      // 重置游戏数据
      const initialData = {
        // 游戏时间重置到0（第一天）
        gameTime: 0,
        // 能源重置到初始值
        energy: 200,
        maxEnergy: 200,
        solarPanelsUsed: 0,
        // 武器能量重置
        electricBullets: 0,
        photonShieldEnergy: 0,
        drillMachineEnergy: 0,
        lastChargeTime: 0,
        // 资源重置（全部为0）
        workbenchResources: {
          '月球玄武岩': 0,
          '月球硅石': 0,
          '钛铁矿': 0,
          '月球水冰': 0,
          '月球硅石模块': 0,
          '石英模块': 0,
          '废弃卫星的太阳能电池板': 0,
          '飞船零件': 0,
          '太阳能充电板': 0,
          '无尽能源': 0
        },
        // 工具重置（只保留基础激光镐、电击枪、光子盾）
        ownedTools: {
          '基础激光镐': true,
          '电击枪': true,
          '光子盾': true
          // 注意：不再保留高级激光镐，需后续自行合成升级
        },
        // 清除击败BOSS等标记
        flags: {
          puniDefeated: false
        }
      };
      
      // 保存到localStorage
      localStorage.setItem('delta-action-game', JSON.stringify(initialData));
      
      // 重置开场剧情对话标记，让玩家重新体验开场剧情
      localStorage.removeItem('has-seen-opening-dialogue');
      
      // 更新当前组件的数据
      this.gameTime = 0;
      this.currentHour = 6;
      this.dayNightCycle = 0;
      this.timeDisplay = '06:00';
      this.energy = 200;
      this.maxEnergy = 200;
      this.solarPanelsUsed = 0;
      this.electricBullets = 0;
      this.photonShieldEnergy = 0;
      this.drillMachineEnergy = 0;
      this.lastChargeTime = 0;
      this.workbenchResources = {
        '月球玄武岩': 0,
        '月球硅石': 0,
        '钛铁矿': 0,
        '月球水冰': 0,
        '月球硅石模块': 0,
        '石英模块': 0,
        '废弃卫星的太阳能电池板': 0,
        '飞船零件': 0,
        '太阳能充电板': 0
      };
      this.ownedTools = {
        '基础激光镐': true,
        '电击枪': true,
        '光子盾': true
      };
      
      // 显示成功消息
      alert('已成功重置到第一天！\n\n当前状态：\n- 游戏时间：第一天 06:00\n- 能源：200 / 200\n- 资源：全部为0\n- 工具：基础激光镐、电击枪、光子盾（高级激光镐需合成）\n- 装置：全部未解锁\n\n页面将刷新以应用所有更改。');
      
      // 刷新页面以应用所有更改
      setTimeout(() => {
        location.reload();
      }, 500);
    },
    handleEnergyMachineClick() {
      if (this.canInteractWithEnergy) {
        const machine = document.querySelector('.energy-machine');
        machine.classList.add('click-feedback');
        setTimeout(() => machine.classList.remove('click-feedback'), 300);
        this.showEnergyPanel = true;
      }
    },
    // 使用太阳能充电板
    useSolarPanel() {
      if (!this.workbenchResources['太阳能充电板'] || this.workbenchResources['太阳能充电板'] <= 0) {
        alert('没有可用的太阳能充电板！');
        return;
      }
      
      // 消耗1个太阳能充电板
      this.workbenchResources['太阳能充电板'] -= 1;
      
      // 同时更新ownedTools中的数量（如果存在）
      if (this.ownedTools['太阳能充电板']) {
        const currentCount = typeof this.ownedTools['太阳能充电板'] === 'number' ? this.ownedTools['太阳能充电板'] : 0;
        if (currentCount > 0) {
          this.$set ? this.$set(this.ownedTools, '太阳能充电板', currentCount - 1) : (this.ownedTools['太阳能充电板'] = currentCount - 1);
        }
      }
      
      // 增加能源上限10点
      const oldMaxEnergy = this.maxEnergy;
      this.maxEnergy += 10;
      this.solarPanelsUsed += 1;
      
      // 保存状态
      this.saveEnergyState();
      this.saveWorkbenchResources();
      this.saveCraftingState();
      
      alert(`成功安装太阳能充电板！
能源上限增加：${oldMaxEnergy} → ${this.maxEnergy}
当前能源上限：${this.maxEnergy} 点
已安装充电板：${this.solarPanelsUsed} 个`);
    },
    // 统一充能装置点击处理
    handleChargerClick() {
      if (this.canInteractWithCharger) {
        const charger = document.querySelector('.universal-charger');
        charger.classList.add('click-feedback');
        setTimeout(() => charger.classList.remove('click-feedback'), 300);
        this.showChargingPanel = true;
      }
    },
    
    // 统一充能函数 - 根据设备类型进行充能
    chargeDevice(deviceType) {
      switch (deviceType) {
        case 'electricGun':
        this.chargeElectricGun();
          break;
        case 'photonShield':
          this.chargePhotonShield();
          break;
        case 'drillMachine':
          this.chargeDrillMachine();
          break;
      }
    },
    
    // 电击枪充能
    chargeElectricGun() {
      // 检查能源是否足够
      if (this.energy < 10) {
        alert('能源不足！需要10点能源才能充电。');
        return;
      }
      
      // 消耗10点能源，增加30发电击子弹
      this.energy -= 10;
      this.electricBullets += 30;
      
      // 保存能源状态到localStorage
      this.saveEnergyState();
      
      // 显示充电成功信息
      alert(`充电成功！
消耗10点能源
获得30发电击子弹
当前电击子弹：${this.electricBullets}发`);
      
      // 更新游戏数据，传递电击子弹数量
      this.$emit('update-player-data', {
        electricBullets: this.electricBullets
      });
    },
    
    // 光子盾充能
    chargePhotonShield() {
      // 检查能源是否足够（需要10点能源充能）
      if (this.energy < 10) {
        alert('能源不足！需要10点能源才能充能光子盾。');
        return;
      }
      
      // 检查光子盾能量是否已满（最大20点能量）
      if (this.photonShieldEnergy >= 20) {
        alert('光子盾能量已满！');
        return;
      }
      
      // 消耗10点能源，增加20点光子盾能量
      this.energy -= 10;
      this.photonShieldEnergy = Math.min(20, this.photonShieldEnergy + 20);
      
      // 保存能源状态到localStorage
      this.saveEnergyState();
      
      // 显示充能成功信息
      alert(`光子盾充能成功！
消耗10点能源
获得20点光子盾能量
当前光子盾能量：${this.photonShieldEnergy} / 20`);
      
      // 更新游戏数据，传递光子盾能量
      this.$emit('update-player-data', {
        photonShieldEnergy: this.photonShieldEnergy
      });
    },
    
    // 钻探机充能
    chargeDrillMachine() {
      // 检查能源是否足够（需要10点能源充能）
      if (this.energy < 10) {
        alert('能源不足！需要10点能源才能充能钻探机。');
        return;
      }
      
      // 检查钻探机能量是否已满（最大100点能量）
      if (this.drillMachineEnergy >= 100) {
        alert('钻探机能量已满！');
        return;
      }
      
      // 消耗10点能源，增加100点钻探机能量
      this.energy -= 10;
      this.drillMachineEnergy = Math.min(100, this.drillMachineEnergy + 100);
      
      // 保存能源状态到localStorage
      this.saveEnergyState();
      
      // 显示充能成功信息
      alert(`充能成功！
消耗10点能源
获得100点钻探机能量
当前钻探机能量：${this.drillMachineEnergy} / 100`);
      
      // 更新游戏数据，传递钻探机能量
      this.$emit('update-player-data', {
        drillMachineEnergy: this.drillMachineEnergy
      });
    },
    
    // 新增方法：保存能源状态
    saveEnergyState() {
      const saved = localStorage.getItem('delta-action-game');
      const data = saved ? JSON.parse(saved) : {};
      data.energy = this.energy;
      data.maxEnergy = this.maxEnergy;
      data.solarPanelsUsed = this.solarPanelsUsed;
      data.photonShieldEnergy = this.photonShieldEnergy;
      data.drillMachineEnergy = this.drillMachineEnergy;
      localStorage.setItem('delta-action-game', JSON.stringify(data));
      
      // 更新能源系统视觉效果
      this.updateEnergyVisuals();
    },
    // 保存工作台资源
    saveWorkbenchResources() {
      const saved = localStorage.getItem('delta-action-game');
      const data = saved ? JSON.parse(saved) : {};
      data.workbenchResources = { ...this.workbenchResources };
      localStorage.setItem('delta-action-game', JSON.stringify(data));
    },
    handleKeyDown(e) {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'e'].includes(key)) {
        this.keys[key] = true;
        if (key === 'a') this.facingRight = false;
        if (key === 'd') this.facingRight = true;
      }
      
      // ESC键关闭所有面板
      if (key === 'escape') {
        this.showChargingPanel = false;
        this.showWorkbenchPanel = false;
        this.showOreSorterPanel = false;
        this.showDisassemblerPanel = false;
        this.showEnergyPanel = false;
      }
    },
    handleKeyUp(e) {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'e'].includes(key)) {
        this.keys[key] = false;
      }
      if (key === 'e') {
        if (this.canExit) {
          this.handleDoorClick();
        } else if (this.canInteractWithWorkbench) {
          this.handleWorkbenchClick();
        } else if (this.canInteractWithOreSorter) {
          this.handleOreSorterClick();
        } else if (this.canInteractWithDisassembler) {
          this.handleDisassemblerClick();
        } else if (this.canInteractWithAI) {
          this.handleAIClick();
        } else if (this.canInteractWithEnergy) {
          // 打开能源系统面板
          this.handleEnergyMachineClick();
        } else if (this.canInteractWithCharger) {
          this.handleChargerClick();
        }
      }
      
      // ESC键关闭AI面板
      if (key === 'Escape' || key === 'escape') {
        if (this.showAIPanel) {
          this.closeAIPanel();
        }
      }
    },
    handleDoorClick() {
      if (this.canExit) {
        const door = document.querySelector('.airlock-door');
        door.classList.add('click-feedback');
        setTimeout(() => door.classList.remove('click-feedback'), 300);
        this.$emit('start-game', {
          fromDoor: true,
          playerData: {
            electricBullets: this.electricBullets,
            photonShieldEnergy: this.photonShieldEnergy,
            drillMachineEnergy: this.drillMachineEnergy
          }
        });
      }
    },
    
    // 工作台交互方法
    handleWorkbenchClick() {
      if (this.canInteractWithWorkbench) {
        const workbench = document.querySelector('.workbench');
        workbench.classList.add('click-feedback');
        setTimeout(() => workbench.classList.remove('click-feedback'), 300);
        this.showWorkbenchPanel = !this.showWorkbenchPanel;
        
        // 如果打开工作台，默认显示资源图鉴，便于直接查看
        if (this.showWorkbenchPanel) {
          this.currentWorkbenchTab = '资源图鉴';
        }
      }
    },
    
    // 矿石筛选机交互方法
    handleOreSorterClick() {
      if (this.canInteractWithOreSorter) {
        const oreSorter = document.querySelector('.ore-sorter');
        oreSorter.classList.add('click-feedback');
        setTimeout(() => oreSorter.classList.remove('click-feedback'), 300);
        this.showOreSorterPanel = !this.showOreSorterPanel;
        
        // 如果打开筛选机面板，重置输入数量为1
        if (this.showOreSorterPanel) {
          this.oreSorterInputAmount = 1;
        }
      }
    },
    
    // 机械拆解机交互方法
    handleDisassemblerClick() {
      if (this.canInteractWithDisassembler) {
        if (!this.hasDisassembler) {
          alert('需要先合成机械拆解机工具才能使用此装置！\n\n合成配方：\n钛铁矿 x3\n月球硅石模块 x2\n月球玄武岩 x1');
          return;
        }
        
        const disassembler = document.querySelector('.disassembler');
        disassembler.classList.add('click-feedback');
        setTimeout(() => disassembler.classList.remove('click-feedback'), 300);
        this.showDisassemblerPanel = !this.showDisassemblerPanel;
        
        // 如果打开拆解机面板，重置输入数量为1
        if (this.showDisassemblerPanel) {
          this.disassemblerInputAmount = 1;
        }
      }
    },
    
    // 检查是否可以拆解
    canDisassemble() {
      const batteryCount = this.workbenchResources['废弃卫星的太阳能电池板'] || 0;
      return batteryCount >= this.disassemblerInputAmount && this.disassemblerInputAmount > 0 && this.hasDisassembler;
    },
    
    // 获取拆解产出数量（5-8单位/个）
    getDisassembleOutput() {
      if (this.disassemblerInputAmount <= 0) return 0;
      // 每个太阳能电池板可以拆解出5-8个月球硅石模块
      // 这里计算最小和最大可能的产出
      const minOutput = this.disassemblerInputAmount * 5;
      const maxOutput = this.disassemblerInputAmount * 8;
      return `${minOutput}-${maxOutput}`;
    },
    
    // 执行拆解
    performDisassembling() {
      if (!this.canDisassemble()) {
        if (!this.hasDisassembler) {
          alert('需要先合成机械拆解机工具！');
        } else {
          alert('太阳能电池板不足！');
        }
        return;
      }
      
      const batteryCount = this.workbenchResources['废弃卫星的太阳能电池板'] || 0;
      if (batteryCount < this.disassemblerInputAmount) {
        alert(`太阳能电池板不足！当前只有 ${batteryCount} 个，需要 ${this.disassemblerInputAmount} 个。`);
        return;
      }
      
      // 消耗太阳能电池板
      this.workbenchResources['废弃卫星的太阳能电池板'] -= this.disassemblerInputAmount;
      
      // 计算产出（每个5-8单位，随机）
      let totalOutput = 0;
      for (let i = 0; i < this.disassemblerInputAmount; i++) {
        const output = Math.floor(Math.random() * 4) + 5; // 5-8随机
        totalOutput += output;
      }
      
      // 产出月球硅石模块
      this.workbenchResources['月球硅石模块'] = (this.workbenchResources['月球硅石模块'] || 0) + totalOutput;
      
      // 保存状态
      this.saveCraftingState();
      
      // 显示成功消息
      alert(`拆解成功！\n消耗：${this.disassemblerInputAmount} 个废弃卫星的太阳能电池板\n获得：${totalOutput} 个月球硅石模块\n\n当前库存：\n太阳能电池板：${this.workbenchResources['废弃卫星的太阳能电池板']} 个\n月球硅石模块：${this.workbenchResources['月球硅石模块']} 个`);
      
      // 重置输入数量
      this.disassemblerInputAmount = 1;
    },
    
    // 检查是否可以筛选石英
    canSortQuartz() {
      const quartzCount = this.workbenchResources['石英模块'] || 0;
      return quartzCount >= this.oreSorterInputAmount && this.oreSorterInputAmount > 0;
    },
    
    // 执行石英筛选
    performQuartzSorting() {
      if (!this.canSortQuartz()) {
        alert('石英模块不足！');
        return;
      }
      
      const quartzCount = this.workbenchResources['石英模块'] || 0;
      if (quartzCount < this.oreSorterInputAmount) {
        alert(`石英模块不足！当前只有 ${quartzCount} 个，需要 ${this.oreSorterInputAmount} 个。`);
        return;
      }
      
      // 消耗石英模块
      this.workbenchResources['石英模块'] -= this.oreSorterInputAmount;
      
      // 产出月球硅石模块（1:1比例）
      const siliconOutput = this.oreSorterInputAmount;
      this.workbenchResources['月球硅石模块'] = (this.workbenchResources['月球硅石模块'] || 0) + siliconOutput;
      
      // 保存状态
      this.saveCraftingState();
      
      // 显示成功消息
      alert(`筛选成功！\n消耗：${this.oreSorterInputAmount} 个石英模块\n获得：${siliconOutput} 个月球硅石模块\n\n当前库存：\n石英模块：${this.workbenchResources['石英模块']} 个\n月球硅石模块：${this.workbenchResources['月球硅石模块']} 个`);
      
      // 重置输入数量
      this.oreSorterInputAmount = 1;
    },
    
    // 切换工作台选项卡
    switchWorkbenchTab(tab) {
      this.currentWorkbenchTab = tab;
      // 切换到图鉴时，默认显示全部
      if (tab === '资源图鉴') {
        this.currentEncyclopediaCategory = 'all';
      }
    },
    
    // 获取分类数量
    getCategoryCount(categoryKey) {
      switch (categoryKey) {
        case 'all':
          return (this.weaponEncyclopedia ? Object.keys(this.weaponEncyclopedia).length : 0) + 
                 (this.toolEncyclopedia ? Object.keys(this.toolEncyclopedia).length : 0) + 
                 (this.resourceEncyclopedia ? Object.keys(this.resourceEncyclopedia).length : 0) + 
                 (this.monsterEncyclopedia ? Object.keys(this.monsterEncyclopedia).length : 0) + 
                 (this.deviceEncyclopedia ? Object.keys(this.deviceEncyclopedia).length : 0);
        case 'weapon':
          return this.weaponEncyclopedia ? Object.keys(this.weaponEncyclopedia).length : 0;
        case 'tool':
          return this.toolEncyclopedia ? Object.keys(this.toolEncyclopedia).length : 0;
        case 'resource':
          return this.resourceEncyclopedia ? Object.keys(this.resourceEncyclopedia).length : 0;
        case 'monster':
          return this.monsterEncyclopedia ? Object.keys(this.monsterEncyclopedia).length : 0;
        case 'device':
          return this.deviceEncyclopedia ? Object.keys(this.deviceEncyclopedia).length : 0;
        default:
          return 0;
      }
    },
    
    // 获取资源图标
    getResourceIcon(resource) {
      const icons = {
        '月球玄武岩': '🪨',
        '月球硅石': '💎',
        '钛铁矿': '⛏️',
        '月球水冰': '🧊',
        '月球硅石模块': '💎',
        '石英模块': '💎',
        '废弃卫星的太阳能电池板': '🔋',
        '飞船零件': '🚀',
        '无尽能源': '♾️'
      };
      return icons[resource] || '📦';
    },
    
    // 检查是否可以合成某个物品
    canCraft(recipeName) {
      const recipe = this.craftingRecipes[recipeName];
      if (!recipe) return false;
      
      for (const [ingredient, amount] of Object.entries(recipe.ingredients)) {
        // 检查是否是工具
        if (recipe.requiresTool && ingredient === recipe.requiresTool) {
          if (!this.ownedTools[ingredient]) {
            return false;
          }
          continue;
        }
        
        // 检查资源数量
        const currentAmount = this.workbenchResources[ingredient] || 0;
        if (currentAmount < amount) {
          return false;
        }
      }
      
      return true;
    },
    
    // 检查是否有足够的资源
    hasEnoughResource(ingredient, amount, recipe) {
      // 如果是需要工具的情况
      if (recipe.requiresTool && ingredient === recipe.requiresTool) {
        return this.ownedTools[ingredient] || false;
      }
      
      // 如果是普通资源
      const currentAmount = this.workbenchResources[ingredient] || 0;
      return currentAmount >= amount;
    },
    
    // 检查是否是工具
    isTool(ingredient) {
      return this.ownedTools.hasOwnProperty(ingredient);
    },
    
    // 获取资源数量
    getResourceCount(ingredient) {
      return this.workbenchResources[ingredient] || 0;
    },
    
    // 获取所有工具（包括合成配方中的工具和图鉴中的工具）
    getAllTools() {
      const tools = {};
      // 从合成配方中获取工具
      Object.keys(this.craftingRecipes).forEach(recipeName => {
        const recipe = this.craftingRecipes[recipeName];
        if (recipe.type === 'tool' || recipe.type === 'module') {
          tools[recipeName] = {
            icon: recipe.icon,
            type: recipe.type,
            description: recipe.description
          };
        }
      });
      // 从工具图鉴中获取工具（如果不在合成配方中）
      Object.keys(this.toolEncyclopedia).forEach(toolName => {
        if (!tools[toolName]) {
          tools[toolName] = {
            icon: this.toolEncyclopedia[toolName].icon,
            type: this.toolEncyclopedia[toolName].type,
            description: this.toolEncyclopedia[toolName].description
          };
        }
      });
      return tools;
    },
    
    // 获取工具图标
    getToolIcon(toolName) {
      // 先从合成配方中查找
      if (this.craftingRecipes[toolName]) {
        return this.craftingRecipes[toolName].icon;
      }
      // 再从工具图鉴中查找
      if (this.toolEncyclopedia[toolName]) {
        return this.toolEncyclopedia[toolName].icon;
      }
      // 默认图标
      return '🔧';
    },
    
    // 检查工具是否已拥有
    isToolOwned(toolName) {
      // 特殊处理：太阳能充电板从workbenchResources中检查
      if (toolName === '太阳能充电板') {
        return (this.workbenchResources[toolName] || 0) > 0;
      }
      return this.ownedTools[toolName] === true || (typeof this.ownedTools[toolName] === 'number' && this.ownedTools[toolName] > 0);
    },
    
    // 获取工具数量
    getToolCount(toolName) {
      // 特殊处理：太阳能充电板从workbenchResources中获取
      if (toolName === '太阳能充电板') {
        return this.workbenchResources[toolName] || 0;
      }
      if (this.ownedTools[toolName] === true) {
        return 1;
      }
      if (typeof this.ownedTools[toolName] === 'number') {
        return this.ownedTools[toolName];
      }
      return 0;
    },
    
    // 获取已拥有工具数量
    getOwnedToolsCount() {
      let count = 0;
      Object.keys(this.ownedTools).forEach(toolName => {
        if (this.ownedTools[toolName] === true || (typeof this.ownedTools[toolName] === 'number' && this.ownedTools[toolName] > 0)) {
          count++;
        }
      });
      return count;
    },
    
    // 执行合成
    performCraft(recipeName) {
      const recipe = this.craftingRecipes[recipeName];
      if (!recipe || !this.canCraft(recipeName)) {
        alert('材料不足，无法合成！');
        return;
      }
      
      // 消耗材料
      for (const [ingredient, amount] of Object.entries(recipe.ingredients)) {
        if (recipe.requiresTool && ingredient === recipe.requiresTool) {
          // 工具类消耗，不需要从资源中扣除（基础激光镐会保留，高级激光镐会添加）
          continue;
        }
        
        if (this.workbenchResources[ingredient] >= amount) {
          this.workbenchResources[ingredient] -= amount;
        }
      }
      
      // 添加工具到已拥有列表
      if (recipe.type === 'tool') {
        // 如果是高级激光镐，需要先移除基础激光镐
        if (recipeName === '高级激光镐') {
          this.ownedTools['基础激光镐'] = false;
        }
        
        // 使用Vue.set确保响应式更新（如果是Vue 2）或者直接赋值（Vue 3）
        this.$set ? this.$set(this.ownedTools, recipeName, true) : (this.ownedTools[recipeName] = true);
        alert(`合成成功！获得 ${recipeName}`);
      } else if (recipe.type === 'module') {
        // 模块类物品可以重复合成
        // 如果是太阳能充电板，添加到workbenchResources和ownedTools中
        if (recipeName === '太阳能充电板') {
          if (!this.workbenchResources[recipeName]) {
            this.workbenchResources[recipeName] = 0;
          }
          this.workbenchResources[recipeName] += 1;
          
          // 同时添加到ownedTools中，以便在工具库中显示
          if (!this.ownedTools[recipeName]) {
            this.$set ? this.$set(this.ownedTools, recipeName, 0) : (this.ownedTools[recipeName] = 0);
          }
          const newCount = (this.ownedTools[recipeName] || 0) + 1;
          this.$set ? this.$set(this.ownedTools, recipeName, newCount) : (this.ownedTools[recipeName] = newCount);
          
          alert(`合成成功！获得 ${recipeName} x${this.workbenchResources[recipeName]}`);
        } else {
          // 其他模块类物品
        if (!this.ownedTools[recipeName]) {
          this.$set ? this.$set(this.ownedTools, recipeName, 0) : (this.ownedTools[recipeName] = 0);
        }
        const newCount = (this.ownedTools[recipeName] || 0) + 1;
        this.$set ? this.$set(this.ownedTools, recipeName, newCount) : (this.ownedTools[recipeName] = newCount);
        alert(`合成成功！获得 ${recipeName} x${newCount}`);
        }
      }
      
      // 保存状态
      this.saveCraftingState();
    },
    
    // 保存合成状态
    saveCraftingState() {
      const saved = localStorage.getItem('delta-action-game');
      const data = saved ? JSON.parse(saved) : {};
      data.workbenchResources = this.workbenchResources;
      data.ownedTools = this.ownedTools;
      localStorage.setItem('delta-action-game', JSON.stringify(data));
    },
    
    updateTime() {
      // 游戏内1天=现实20分钟 (1200秒)
      this.gameTime += this.gameSpeed;
      this.dayNightCycle = (this.gameTime % 1200) / 1200; // 0-1循环
      this.currentHour = Math.floor(this.dayNightCycle * 24);
      
      // 更新时间显示 (HH:MM)
      const minutes = Math.floor((this.dayNightCycle * 24 % 1) * 60);
      this.timeDisplay = `${this.currentHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // 根据时间调整游戏速度 (白天快，夜晚慢)
      const isDaytime = this.currentHour >= 6 && this.currentHour < 18;
      this.gameSpeed = isDaytime ? 1.5 : 0.8;
      
      // 每小时自动充电5格电
      if (Math.floor(this.gameTime) % 50 === 0) { // 游戏内1小时=50秒
        this.autoChargeEnergy();
      }
      
      // 每60秒保存一次游戏时间到localStorage
      if (Math.floor(this.gameTime) % 60 === 0) {
        this.saveGameTime();
      }
    },
    
    // 新增方法：保存游戏时间
    saveGameTime() {
      const saved = localStorage.getItem('delta-action-game');
      const data = saved ? JSON.parse(saved) : {};
      data.gameTime = this.gameTime;
      localStorage.setItem('delta-action-game', JSON.stringify(data));
    },
    
    // 新增方法：自动充电
    autoChargeEnergy() {
      // 每小时充电5格电，但不超过最大值
      if (this.energy < this.maxEnergy) {
        this.energy = Math.min(this.maxEnergy, this.energy + 5);
        this.lastChargeTime = this.gameTime;
        this.isChargingActive = true;
        this.saveEnergyState();
        
        // 更新能源系统的视觉效果
        this.updateEnergyVisuals();
        
        // 充电完成后重置状态
        setTimeout(() => {
          this.isChargingActive = false;
        }, 2000);
      }
    },
    
    // 新增方法：更新能源系统视觉效果
    updateEnergyVisuals() {
      const energyMachine = document.querySelector('.energy-machine');
      if (energyMachine) {
        // 根据能源百分比调整视觉效果
        const energyPercent = this.energyPercentage;
        
        // 更新能源条颜色
        const energyFill = energyMachine.querySelector('.energy-fill');
        if (energyFill) {
          let fillColor;
          if (energyPercent > 70) fillColor = '#55ff55';
          else if (energyPercent > 30) fillColor = '#ffff55';
          else fillColor = '#ff5555';
          
          energyFill.style.background = `linear-gradient(90deg, ${fillColor}, ${fillColor}dd)`;
        }
        
        // 更新能源系统发光效果
        if (energyPercent > 80) {
          energyMachine.style.boxShadow = '0 0 20px #55ff55';
        } else if (energyPercent > 50) {
          energyMachine.style.boxShadow = '0 0 15px #ffff55';
        } else if (energyPercent > 20) {
          energyMachine.style.boxShadow = '0 0 10px #ff5555';
        } else {
          energyMachine.style.boxShadow = '0 0 5px #ff5555';
        }
      }
    },

    updatePosition() {
      let moving = false;
      let direction = '';
      
      const door = document.querySelector('.airlock-door');
      const doorRect = door.getBoundingClientRect();
      const stationRect = document.querySelector('.station-background').getBoundingClientRect();
      
      const doorX = doorRect.left - stationRect.left;
      const doorY = doorRect.top - stationRect.top;
      
      const distance = Math.sqrt(
        Math.pow(this.astronautX - doorX, 2) + 
        Math.pow(this.astronautY - doorY, 2)
      );
      
      this.canExit = distance < 100;
      door.classList.toggle('can-exit', this.canExit);

      // 检测与能源机器的距离
      const energyMachine = document.querySelector('.energy-machine');
      if (energyMachine) {
        const machineRect = energyMachine.getBoundingClientRect();
        const machineX = machineRect.left - stationRect.left;
        const machineY = machineRect.top - stationRect.top;
        
        const machineDistance = Math.sqrt(
          Math.pow(this.astronautX - machineX, 2) + 
          Math.pow(this.astronautY - machineY, 2)
        );
        
        this.canInteractWithEnergy = machineDistance < 100;
        energyMachine.classList.toggle('can-interact', this.canInteractWithEnergy);
      }

      // 检测与统一充能装置的距离
      const universalCharger = document.querySelector('.universal-charger');
      if (universalCharger) {
        const chargerRect = universalCharger.getBoundingClientRect();
        const chargerX = chargerRect.left - stationRect.left;
        const chargerY = chargerRect.top - stationRect.top;
        
        const chargerDistance = Math.sqrt(
          Math.pow(this.astronautX - chargerX, 2) + 
          Math.pow(this.astronautY - chargerY, 2)
        );
        
        this.canInteractWithCharger = chargerDistance < 100;
        universalCharger.classList.toggle('can-interact', this.canInteractWithCharger);
      }

      // 检测与工作台的距离
      const workbench = document.querySelector('.workbench');
      if (workbench) {
        const workbenchRect = workbench.getBoundingClientRect();
        const workbenchX = workbenchRect.left - stationRect.left;
        const workbenchY = workbenchRect.top - stationRect.top;
        
        const workbenchDistance = Math.sqrt(
          Math.pow(this.astronautX - workbenchX, 2) + 
          Math.pow(this.astronautY - workbenchY, 2)
        );
        
        this.canInteractWithWorkbench = workbenchDistance < 100;
        workbench.classList.toggle('can-interact', this.canInteractWithWorkbench);
      }

      // 检测与矿石筛选机的距离
      const oreSorter = document.querySelector('.ore-sorter');
      if (oreSorter) {
        const oreSorterRect = oreSorter.getBoundingClientRect();
        const oreSorterX = oreSorterRect.left - stationRect.left;
        const oreSorterY = oreSorterRect.top - stationRect.top;
        
        const oreSorterDistance = Math.sqrt(
          Math.pow(this.astronautX - oreSorterX, 2) + 
          Math.pow(this.astronautY - oreSorterY, 2)
        );
        
        this.canInteractWithOreSorter = oreSorterDistance < 100;
        oreSorter.classList.toggle('can-interact', this.canInteractWithOreSorter);
      }

      // 检测与机械拆解机的距离
      const disassembler = document.querySelector('.disassembler');
      if (disassembler) {
        const disassemblerRect = disassembler.getBoundingClientRect();
        const disassemblerX = disassemblerRect.left - stationRect.left;
        const disassemblerY = disassemblerRect.top - stationRect.top;
        
        const disassemblerDistance = Math.sqrt(
          Math.pow(this.astronautX - disassemblerX, 2) + 
          Math.pow(this.astronautY - disassemblerY, 2)
        );
        
        this.canInteractWithDisassembler = disassemblerDistance < 100;
        disassembler.classList.toggle('can-interact', this.canInteractWithDisassembler && this.hasDisassembler);
      }

      // AI机器人移动逻辑
      const currentTime = Date.now();
      if (!this.aiRobotLastMoveTime) {
        this.aiRobotLastMoveTime = currentTime;
      }
      const deltaTime = currentTime - this.aiRobotLastMoveTime;
      this.aiRobotLastMoveTime = currentTime;
      
      this.aiRobotMoveTimer += deltaTime;
      if (this.aiRobotMoveTimer >= this.aiRobotChangeDirectionTime) {
        // 随机改变方向
        this.aiRobotVx = (Math.random() - 0.5) * 1.5; // -0.75 到 0.75
        this.aiRobotMoveTimer = 0;
      }
      
      // 更新AI机器人位置（使用后面声明的stationWidth和stationHeight）
      this.aiRobotX += this.aiRobotVx * (deltaTime / 16); // 根据实际时间差调整速度

      if (this.keys.w && this.keys.a) {
        this.astronautY -= this.speed * 0.7;
        this.astronautX -= this.speed * 0.7;
        direction = 'up-left';
        moving = true;
      } else if (this.keys.w && this.keys.d) {
        this.astronautY -= this.speed * 0.7;
        this.astronautX += this.speed * 0.7;
        direction = 'up-right';
        moving = true;
      } else if (this.keys.s && this.keys.a) {
        this.astronautY += this.speed * 0.7;
        this.astronautX -= this.speed * 0.7;
        direction = 'down-left';
        moving = true;
      } else if (this.keys.s && this.keys.d) {
        this.astronautY += this.speed * 0.7;
        this.astronautX += this.speed * 0.7;
        direction = 'down-right';
        moving = true;
      } else if (this.keys.w) {
        this.astronautY -= this.speed;
        direction = 'up';
        moving = true;
      } else if (this.keys.s) {
        this.astronautY += this.speed;
        direction = 'down';
        moving = true;
      } else if (this.keys.a) {
        this.astronautX -= this.speed;
        direction = 'left';
        moving = true;
      } else if (this.keys.d) {
        this.astronautX += this.speed;
        direction = 'right';
        moving = true;
      }
      
      const stationWidth = document.querySelector('.station-background').offsetWidth;
      const stationHeight = document.querySelector('.station-background').offsetHeight;
      this.astronautX = Math.max(80, Math.min(stationWidth - 80, this.astronautX));
      this.astronautY = Math.max(120, Math.min(stationHeight - 120, this.astronautY));
      
      // AI机器人边界检测，确保AI机器人在太空舱内
      const aiRobotWidth = 80;
      const aiRobotHeight = 120;
      this.aiRobotX = Math.max(50, Math.min(stationWidth - aiRobotWidth - 50, this.aiRobotX));
      this.aiRobotY = Math.max(120, Math.min(stationHeight - aiRobotHeight - 50, this.aiRobotY));
      
      // 检测与AI机器人的距离（使用动态位置）
      const aiX = this.aiRobotX + aiRobotWidth / 2;
      const aiY = stationHeight - this.aiRobotY - aiRobotHeight / 2;
      
      const aiDistance = Math.sqrt(
        Math.pow(this.astronautX - aiX, 2) + 
        Math.pow(this.astronautY - aiY, 2)
      );
      
      this.canInteractWithAI = aiDistance < 100;
      const aiRobot = document.querySelector('.ai-robot');
      if (aiRobot) {
        aiRobot.classList.toggle('can-interact', this.canInteractWithAI);
      }
      
      const astronaut = document.querySelector('.astronaut');
      if (moving) {
        astronaut.setAttribute('data-direction', direction);
        astronaut.style.animationPlayState = 'running';
      } else {
        astronaut.style.animationPlayState = 'paused';
      }
      
      const scale = 0.8 + (this.astronautY / 600) * 0.4;
      astronaut.style.transform = `scale(${scale})`;
    }
  }
}
</script>

<style scoped>
.space-station {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: 
    radial-gradient(circle at 20% 30%, rgba(100, 150, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(255, 200, 100, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(150, 100, 255, 0.1) 0%, transparent 70%),
    linear-gradient(180deg, #0a0a2a 0%, #000000 100%);
  animation: day-night 1200s linear infinite;
}

/* 动态星星背景 */
.space-station::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    /* 大星星 */
    radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(2px 2px at 60% 70%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(2px 2px at 30% 80%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(2px 2px at 10% 50%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(2px 2px at 40% 10%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(2px 2px at 80% 60%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(2px 2px at 70% 20%, rgba(255, 255, 255, 0.8), transparent),
    /* 中星星 */
    radial-gradient(1.5px 1.5px at 50% 50%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1.5px 1.5px at 80% 20%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1.5px 1.5px at 70% 40%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 90% 90%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1.5px 1.5px at 15% 75%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1.5px 1.5px at 25% 15%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 55% 85%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 85% 35%, rgba(255, 255, 255, 0.7), transparent),
    /* 小星星 */
    radial-gradient(1px 1px at 35% 25%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 65% 45%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 45% 65%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 75% 75%, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1px 1px at 5% 35%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 95% 55%, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 18% 90%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 88% 8%, rgba(255, 255, 255, 0.6), transparent);
  background-size: 
    200% 200%, 180% 180%, 190% 190%, 210% 210%, 185% 185%, 175% 175%, 195% 195%, 
    160% 160%, 170% 170%, 165% 165%, 180% 180%, 175% 175%, 185% 185%, 190% 190%, 195% 195%,
    150% 150%, 155% 155%, 160% 160%, 165% 165%, 170% 170%, 175% 175%, 180% 180%, 185% 185%;
  background-position: 
    0% 0%, 20% 30%, 40% 60%, 60% 10%, 80% 50%, 10% 80%, 30% 20%, 
    50% 70%, 70% 40%, 90% 90%, 15% 15%, 85% 85%, 25% 75%, 55% 25%, 75% 55%, 95% 35%,
    35% 25%, 65% 45%, 45% 65%, 75% 75%, 5% 35%, 95% 55%, 18% 90%, 88% 8%;
  animation: stars-twinkle 8s ease-in-out infinite alternate;
  pointer-events: none;
  z-index: 0;
}

/* 动态星云效果 */
.space-station::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(ellipse 800px 400px at 20% 30%, rgba(100, 150, 255, 0.2) 0%, transparent 70%),
    radial-gradient(ellipse 600px 300px at 80% 70%, rgba(255, 200, 100, 0.15) 0%, transparent 70%),
    radial-gradient(ellipse 500px 250px at 50% 50%, rgba(150, 100, 255, 0.1) 0%, transparent 70%);
  animation: nebula-drift 30s ease-in-out infinite alternate;
  pointer-events: none;
  z-index: 0;
}

/* 流星动画 */
@keyframes meteor {
  0% {
    transform: translateX(-100px) translateY(-100px) rotate(45deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(100vw + 200px)) translateY(calc(100vh + 200px)) rotate(45deg);
    opacity: 0;
  }
}

@keyframes meteor-alt {
  0% {
    transform: translateX(calc(100vw + 100px)) translateY(-100px) rotate(-45deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateX(-200px) translateY(calc(100vh + 200px)) rotate(-45deg);
    opacity: 0;
  }
}

@keyframes stars-twinkle {
  0% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
}

@keyframes nebula-drift {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0.6;
  }
  33% {
    transform: translate(5%, 3%) scale(1.1);
    opacity: 0.8;
  }
  66% {
    transform: translate(-3%, 5%) scale(0.9);
    opacity: 0.7;
  }
  100% {
    transform: translate(2%, -2%) scale(1.05);
    opacity: 0.75;
  }
}

/* 流星样式 */
.meteor {
  position: absolute;
  width: 2px;
  height: 100px;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 1) 0%, 
    rgba(100, 200, 255, 0.8) 30%,
    rgba(255, 255, 255, 0.6) 60%,
    transparent 100%);
  border-radius: 50%;
  box-shadow: 
    0 0 10px rgba(255, 255, 255, 0.8),
    0 0 20px rgba(100, 200, 255, 0.6),
    0 0 30px rgba(255, 255, 255, 0.4);
  pointer-events: none;
  z-index: 1;
  transform-origin: top center;
}

.meteor-1 {
  top: 10%;
  left: 10%;
  width: 3px;
  height: 120px;
  animation: meteor 8s linear infinite;
  animation-delay: 0s;
}

.meteor-2 {
  top: 30%;
  left: 80%;
  width: 2px;
  height: 80px;
  animation: meteor-alt 12s linear infinite;
  animation-delay: 3s;
}

.meteor-3 {
  top: 60%;
  left: 5%;
  width: 2.5px;
  height: 100px;
  animation: meteor 10s linear infinite;
  animation-delay: 6s;
}

.meteor-4 {
  top: 20%;
  left: 85%;
  width: 2px;
  height: 90px;
  animation: meteor-alt 15s linear infinite;
  animation-delay: 9s;
}

.station-background {
  position: relative;
  width: 90vw;
  height: 80vh;
  max-width: 1200px;
  max-height: 900px;
  margin: 5vh auto;
  background: 
    linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 50%, #1a1a2e 100%),
    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(100, 150, 255, 0.03) 2px, rgba(100, 150, 255, 0.03) 4px);
  border: 8px solid #2a3a4a;
  box-shadow: 
    0 0 0 4px #1a2a3a,
    inset 0 0 100px rgba(100, 150, 255, 0.1),
    0 0 50px rgba(0, 0, 0, 0.8);
  overflow: visible;
  position: relative;
  z-index: 2;
}

.station-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 50% 50%, rgba(100, 150, 255, 0.05) 0%, transparent 70%),
    repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(100, 150, 255, 0.02) 10px, rgba(100, 150, 255, 0.02) 20px);
  pointer-events: none;
  z-index: 0;
}

.debug-info {
  position: absolute;
  top: 10px;
  left: 10px;
  color: white;
  background: rgba(0,0,0,0.7);
  padding: 10px;
  z-index: 100;
}

.station-walls {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    linear-gradient(90deg, rgba(100, 150, 255, 0.15) 1px, transparent 1px),
    linear-gradient(0deg, rgba(100, 150, 255, 0.15) 1px, transparent 1px),
    linear-gradient(135deg, rgba(100, 150, 255, 0.08) 1px, transparent 1px),
    linear-gradient(45deg, rgba(100, 150, 255, 0.08) 1px, transparent 1px);
  background-size: 40px 40px, 40px 40px, 20px 20px, 20px 20px;
  z-index: 1;
}

.station-walls::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    repeating-linear-gradient(90deg, 
      transparent 0px, 
      transparent 39px, 
      rgba(100, 150, 255, 0.1) 39px, 
      rgba(100, 150, 255, 0.1) 40px
    ),
    repeating-linear-gradient(0deg, 
      transparent 0px, 
      transparent 39px, 
      rgba(100, 150, 255, 0.1) 39px, 
      rgba(100, 150, 255, 0.1) 40px
    );
  pointer-events: none;
}

.station-floor {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 15%;
  min-height: 150px;
  background: 
    linear-gradient(45deg, rgba(100, 150, 255, 0.2) 1px, transparent 1px),
    linear-gradient(-45deg, rgba(100, 150, 255, 0.2) 1px, transparent 1px),
    linear-gradient(180deg, rgba(50, 100, 150, 0.3) 0%, rgba(20, 50, 100, 0.1) 100%);
  background-size: 50px 50px, 50px 50px, 100% 100%;
  border-top: 4px solid rgba(100, 150, 255, 0.4);
  box-shadow: 
    0 -10px 30px rgba(0, 0, 0, 0.6),
    inset 0 10px 20px rgba(100, 150, 255, 0.1);
  z-index: 1;
}

.station-floor::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 48px,
    rgba(100, 150, 255, 0.15) 48px,
    rgba(100, 150, 255, 0.15) 50px
  );
  pointer-events: none;
}

.control-panel {
  position: absolute;
  right: 50px;
  bottom: 120px;
  width: 150px;
  height: 80px;
  background: 
    linear-gradient(135deg, #2a3a4a 0%, #1a2a3a 100%),
    radial-gradient(circle at 50% 50%, rgba(100, 150, 255, 0.2) 0%, transparent 70%);
  border: 3px solid rgba(100, 150, 255, 0.6);
  box-shadow: 
    inset 0 0 20px rgba(100, 150, 255, 0.1),
    0 0 20px rgba(100, 150, 255, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.4);
  position: relative;
  z-index: 5;
}

.control-panel::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    rgba(100, 200, 255, 0.8) 0px,
    rgba(100, 200, 255, 0.8) 4px,
    transparent 4px,
    transparent 8px
  );
}

.equipment {
  position: absolute;
  left: 50px;
  bottom: 120px;
  width: 100px;
  height: 100px;
  background: 
    linear-gradient(135deg, #1a2a3a 0%, #0a1a2a 100%),
    radial-gradient(circle at 50% 50%, rgba(100, 150, 255, 0.15) 0%, transparent 70%);
  border: 3px solid rgba(100, 150, 255, 0.5);
  box-shadow: 
    inset 0 0 15px rgba(100, 150, 255, 0.1),
    0 0 15px rgba(100, 150, 255, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.4);
  position: relative;
  z-index: 5;
}

.airlock-door {
  position: absolute;
  right: 20px;
  bottom: 120px;
  width: 60px;
  height: 120px;
  background: 
    linear-gradient(135deg, #2a3a4a 0%, #1a2a3a 100%),
    radial-gradient(circle at 50% 50%, rgba(100, 150, 255, 0.2) 0%, transparent 70%);
  border: 3px solid rgba(100, 150, 255, 0.6);
  box-shadow: 
    inset 0 0 20px rgba(100, 150, 255, 0.1),
    0 0 20px rgba(100, 150, 255, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.4);
  transform: translateZ(0);
  will-change: transform, box-shadow, background;
  backface-visibility: hidden;
  z-index: 5;
}

.airlock-door.force-render {
  animation: pulse 0.1s;
}

.airlock-door.can-exit {
  background: 
    linear-gradient(135deg, #3a4a5a 0%, #2a3a4a 100%),
    radial-gradient(circle at 50% 50%, rgba(255, 100, 100, 0.3) 0%, transparent 70%) !important;
  border-color: #ff6666 !important;
  box-shadow: 
    0 0 25px rgba(255, 100, 100, 0.6),
    inset 0 0 30px rgba(255, 100, 100, 0.2),
    0 0 50px rgba(255, 100, 100, 0.3) !important;
  cursor: pointer;
  animation: door-pulse 1.5s infinite !important;
  transform: translateZ(0) scale(1.02);
}

.airlock-door.click-feedback {
  transform: translateZ(0) scale(0.97);
  background: #ff6666 !important;
  transition: all 0.3s;
}

.door-panel {
  position: absolute;
  left: 8px;
  top: 15px;
  width: 44px;
  height: 90px;
  background: 
    linear-gradient(135deg, #1a1a2e 0%, #0a0a1e 100%),
    repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(100, 150, 255, 0.1) 4px, rgba(100, 150, 255, 0.1) 5px);
  border: 2px solid rgba(100, 150, 255, 0.4);
  box-shadow: 
    inset 0 0 10px rgba(100, 150, 255, 0.1),
    0 0 10px rgba(0, 0, 0, 0.3);
}

@keyframes door-pulse {
  0%, 100% {
    box-shadow: 
      0 0 20px rgba(255, 100, 100, 0.5),
      inset 0 0 25px rgba(255, 100, 100, 0.15),
      0 0 40px rgba(255, 100, 100, 0.25);
  }
  50% {
    box-shadow: 
      0 0 35px rgba(255, 100, 100, 0.7),
      inset 0 0 40px rgba(255, 100, 100, 0.25),
      0 0 60px rgba(255, 100, 100, 0.4);
  }
}

.exit-prompt {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.7);
  color: #ff5555;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
}

.astronaut {
  position: absolute;
  width: 60px;
  height: 80px;
  transform-style: preserve-3d;
  transition: all 0.2s ease;
  transform-origin: bottom center;
  filter: drop-shadow(0 4px 12px rgba(100, 150, 255, 0.3)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  z-index: 10;
}

.astronaut::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: 
    linear-gradient(135deg, #ffffff 0%, #e0e8f0 30%, #c0d0e0 60%, #a0b8c8 100%),
    radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.8) 0%, transparent 50%);
  border-radius: 8px 8px 4px 4px;
  box-shadow: 
    inset 0 0 0 2px rgba(100, 150, 255, 0.6),
    inset 0 0 20px rgba(100, 150, 255, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(100, 150, 255, 0.1);
  border: 2px solid rgba(100, 150, 255, 0.8);
  position: relative;
}

/* 头盔 */
.astronaut::after {
  content: '';
  position: absolute;
  top: -8px;
  left: -4px;
  width: 68px;
  height: 45px;
  background: 
    linear-gradient(135deg, #e8f4ff 0%, #c8e4ff 30%, #a8d4ff 60%, #88c4ff 100%),
    radial-gradient(ellipse at 50% 30%, rgba(255, 255, 255, 0.9) 0%, transparent 70%);
  border-radius: 50% 50% 45% 45%;
  border: 3px solid rgba(100, 150, 255, 0.9);
  box-shadow: 
    inset 0 0 0 2px rgba(255, 255, 255, 0.8),
    inset 0 -10px 20px rgba(100, 150, 255, 0.3),
    0 4px 12px rgba(100, 150, 255, 0.4),
    0 0 30px rgba(100, 150, 255, 0.2);
  z-index: 2;
}

/* 面罩反光 */
.astronaut .visor {
  position: absolute;
  top: 10px;
  left: 14px;
  width: 38px;
  height: 26px;
  background: 
    linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(200, 230, 255, 0.9) 50%, rgba(150, 200, 255, 0.8) 100%),
    radial-gradient(ellipse at 30% 30%, rgba(255, 255, 255, 0.9) 0%, transparent 60%);
  border-radius: 15px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: 
    inset 0 2px 6px rgba(255, 255, 255, 0.9),
    inset 0 -2px 4px rgba(100, 150, 255, 0.3),
    0 0 15px rgba(100, 150, 255, 0.4);
  z-index: 3;
}

/* 背包 */
.astronaut .backpack {
  position: absolute;
  width: 22px;
  height: 38px;
  background: 
    linear-gradient(135deg, #2a3a4a 0%, #1a2a3a 50%, #0a1a2a 100%),
    radial-gradient(circle at 50% 30%, rgba(100, 150, 255, 0.3) 0%, transparent 70%);
  top: 20px;
  left: 2px;
  border-radius: 5px;
  box-shadow: 
    inset 0 0 0 2px rgba(100, 150, 255, 0.5),
    inset 0 0 10px rgba(100, 150, 255, 0.2),
    0 3px 8px rgba(0, 0, 0, 0.4),
    0 0 15px rgba(100, 150, 255, 0.1);
  border: 2px solid rgba(100, 150, 255, 0.6);
  z-index: 1;
}

.astronaut .backpack::before {
  content: '';
  position: absolute;
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  background: rgba(100, 200, 255, 0.8);
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(100, 200, 255, 0.6);
  animation: pulse-light 2s infinite;
}

/* 氧气罐 */
.astronaut .oxygen-tank {
  position: absolute;
  width: 10px;
  height: 28px;
  background: 
    linear-gradient(135deg, #5a7a8a 0%, #4a6a7a 50%, #3a5a6a 100%),
    radial-gradient(circle at 50% 50%, rgba(100, 200, 255, 0.4) 0%, transparent 70%);
  top: 28px;
  left: 1px;
  border-radius: 5px;
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(100, 150, 255, 0.3),
    0 0 10px rgba(100, 150, 255, 0.2);
  border: 1px solid rgba(100, 150, 255, 0.5);
  z-index: 1;
}

/* 腿部 */
.astronaut .leg {
  position: absolute;
  bottom: 0;
  width: 16px;
  height: 26px;
  background: 
    linear-gradient(135deg, #ffffff 0%, #e0e8f0 30%, #c0d0e0 60%, #a0b8c8 100%),
    radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
  border: 2px solid rgba(100, 150, 255, 0.7);
  border-radius: 0 0 4px 4px;
  box-shadow: 
    0 3px 6px rgba(0, 0, 0, 0.2),
    inset 0 0 0 1px rgba(100, 150, 255, 0.3),
    0 0 10px rgba(100, 150, 255, 0.1);
}

.astronaut .leg.left {
  left: 11px;
}

.astronaut .leg.right {
  right: 11px;
}

/* 手臂 */
.astronaut .arm {
  position: absolute;
  width: 12px;
  height: 32px;
  background: 
    linear-gradient(135deg, #ffffff 0%, #e0e8f0 30%, #c0d0e0 60%, #a0b8c8 100%),
    radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
  border: 2px solid rgba(100, 150, 255, 0.7);
  top: 16px;
  border-radius: 4px;
  box-shadow: 
    0 3px 6px rgba(0, 0, 0, 0.2),
    inset 0 0 0 1px rgba(100, 150, 255, 0.3),
    0 0 10px rgba(100, 150, 255, 0.1);
}

.astronaut .arm.left {
  left: -8px;
}

.astronaut .arm.right {
  right: -8px;
}

@keyframes pulse-light {
  0%, 100% {
    opacity: 0.6;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) scale(1.2);
  }
}

/* 行走动画 */
@keyframes walk {
  0%, 100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-5px);
  }
  75% {
    transform: translateY(5px);
  }
}

@keyframes leg-swing {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(15deg);
  }
  75% {
    transform: rotate(-15deg);
  }
}

.astronaut.walking {
  animation: walk 0.6s infinite;
}

.astronaut.walking .leg.left {
  animation: leg-swing 0.6s infinite;
}

.astronaut.walking .leg.right {
  animation: leg-swing 0.6s infinite 0.3s;
}

@keyframes walk {
  0% { background-position: 0 0; }
  100% { background-position: -192px 0; }
}

.astronaut[data-direction="up"] { 
  background-position-y: -144px;
  transform: rotateX(10deg) rotateZ(0deg);
}
.astronaut[data-direction="up-right"] { 
  background-position-y: -96px;
  transform: rotateX(10deg) rotateZ(-45deg);
}
.astronaut[data-direction="right"] { 
  background-position-y: -48px;
  transform: rotateX(10deg) rotateZ(-90deg);
}
.astronaut[data-direction="down-right"] { 
  background-position-y: 0;
  transform: rotateX(10deg) rotateZ(-135deg);
}
.astronaut[data-direction="down"] { 
  background-position-y: -144px;
  transform: rotateX(10deg) rotateZ(180deg);
}
.astronaut[data-direction="down-left"] { 
  background-position-y: -96px;
  transform: rotateX(10deg) rotateZ(135deg);
}
.astronaut[data-direction="left"] { 
  background-position-y: -48px;
  transform: rotateX(10deg) rotateZ(90deg);
}
.astronaut[data-direction="up-left"] { 
  background-position-y: 0;
  transform: rotateX(10deg) rotateZ(45deg);
}

.astronaut::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 12px;
  width: 24px;
  height: 8px;
  background: rgba(0,0,0,0.3);
  border-radius: 50%;
  filter: blur(4px);
  transform: rotateX(75deg) scale(0.8);
  transform-origin: top center;
  transition: all 0.2s;
}

.time-display {
  position: absolute;
  top: 20px;
  right: 20px;
  background: 
    linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(20, 30, 50, 0.85) 100%),
    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(100, 150, 255, 0.1) 2px, rgba(100, 150, 255, 0.1) 3px);
  color: white;
  padding: 12px 16px;
  border-radius: 6px;
  border: 2px solid rgba(100, 150, 255, 0.5);
  box-shadow: 
    inset 0 0 15px rgba(100, 150, 255, 0.1),
    0 0 20px rgba(100, 150, 255, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.5);
  font-family: 'Courier New', monospace;
  text-align: center;
  z-index: 10;
}

.time {
  font-size: 20px;
  font-weight: bold;
  color: rgba(100, 200, 255, 1);
  text-shadow: 0 0 10px rgba(100, 200, 255, 0.6);
  margin-bottom: 4px;
}

.day-count {
  font-size: 11px;
  opacity: 0.9;
  font-style: italic;
  color: rgba(200, 220, 255, 0.8);
}

.start-btn {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: none;
  padding: 12px 24px;
  font-size: 18px;
  font-family: 'Courier New', monospace;
  background-color: #ff5555;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 0 4px 0 #aa0000;
  transition: all 0.2s;
}

.start-btn:hover {
  background-color: #ff3333;
  transform: translateX(-50%) translateY(2px);
  box-shadow: 0 2px 0 #aa0000;
}

/* 重置按钮样式 */
.reset-btn {
  position: absolute;
  bottom: 30px;
  right: 50px;
  padding: 12px 24px;
  font-size: 16px;
  font-family: 'Courier New', monospace;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 0 4px 0 #495057;
  transition: all 0.2s;
  z-index: 1000;
}

.reset-btn:hover {
  background-color: #5a6268;
  transform: translateY(2px);
  box-shadow: 0 2px 0 #495057;
}

.reset-btn:active {
  transform: translateY(4px);
  box-shadow: 0 0 0 #495057;
}

/* 增加资源按钮样式 */
.add-resources-btn {
  position: absolute;
  bottom: 30px;
  right: 220px;
  padding: 12px 24px;
  font-size: 16px;
  font-family: 'Courier New', monospace;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 0 4px 0 #1e7e34;
  transition: all 0.2s;
  z-index: 1000;
}

.add-resources-btn:hover {
  background-color: #218838;
  transform: translateY(2px);
  box-shadow: 0 2px 0 #1e7e34;
}

.add-resources-btn:active {
  transform: translateY(4px);
  box-shadow: 0 0 0 #1e7e34;
}

/* 能源系统机器样式 */
.energy-machine {
  position: absolute;
  left: 150px;
  bottom: 120px;
  width: 120px;
  height: 180px;
  background: 
    linear-gradient(135deg, #2a3a4a 0%, #1a2a3a 100%),
    radial-gradient(circle at 50% 50%, rgba(100, 200, 255, 0.25) 0%, transparent 70%);
  border: 3px solid rgba(100, 200, 255, 0.6);
  box-shadow: 
    inset 0 0 25px rgba(100, 200, 255, 0.15),
    0 0 25px rgba(100, 200, 255, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.4);
  transform: translateZ(0);
  will-change: transform, box-shadow, background;
  backface-visibility: hidden;
  z-index: 5;
}

.energy-machine.can-interact {
  background: 
    linear-gradient(135deg, #3a4a5a 0%, #2a3a4a 100%),
    radial-gradient(circle at 50% 50%, rgba(100, 200, 255, 0.35) 0%, transparent 70%) !important;
  border-color: rgba(100, 200, 255, 0.9) !important;
  box-shadow: 
    0 0 30px rgba(100, 200, 255, 0.5),
    inset 0 0 35px rgba(100, 200, 255, 0.2),
    0 0 50px rgba(100, 200, 255, 0.3) !important;
  cursor: pointer;
  animation: energy-pulse 1.5s infinite !important;
  transform: translateZ(0) scale(1.02);
}

@keyframes energy-pulse {
  0%, 100% {
    box-shadow: 
      0 0 25px rgba(100, 200, 255, 0.4),
      inset 0 0 30px rgba(100, 200, 255, 0.15),
      0 0 45px rgba(100, 200, 255, 0.25);
  }
  50% {
    box-shadow: 
      0 0 40px rgba(100, 200, 255, 0.6),
      inset 0 0 45px rgba(100, 200, 255, 0.25),
      0 0 65px rgba(100, 200, 255, 0.4);
  }
}

/* 枪支充电装置样式 */
/* 统一充能装置样式 */
.universal-charger {
  position: absolute;
  left: 500px;
  top: 120px;
  width: 160px;
  height: 180px;
  background: 
    linear-gradient(135deg, #2a3a4a 0%, #1a2a3a 100%),
    radial-gradient(circle at 50% 50%, rgba(100, 200, 255, 0.3) 0%, transparent 70%);
  border: 3px solid rgba(100, 200, 255, 0.6);
  box-shadow: 
    inset 0 0 25px rgba(100, 200, 255, 0.15),
    0 0 25px rgba(100, 200, 255, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.4);
  transform: translateZ(0);
  will-change: transform, box-shadow, background;
  backface-visibility: hidden;
  z-index: 5;
}

.universal-charger.can-interact {
  background: 
    linear-gradient(135deg, #3a4a5a 0%, #2a3a4a 100%),
    radial-gradient(circle at 50% 50%, rgba(100, 200, 255, 0.4) 0%, transparent 70%) !important;
  border-color: rgba(100, 200, 255, 0.9) !important;
  box-shadow: 
    0 0 30px rgba(100, 200, 255, 0.5),
    inset 0 0 35px rgba(100, 200, 255, 0.2),
    0 0 50px rgba(100, 200, 255, 0.3) !important;
  cursor: pointer;
  animation: universal-charger-pulse 1.5s infinite !important;
  transform: translateZ(0) scale(1.02);
}

.universal-charger.click-feedback {
  transform: translateZ(0) scale(0.97);
  background: rgba(100, 200, 255, 0.8) !important;
  transition: all 0.3s;
}

@keyframes universal-charger-pulse {
  0%, 100% {
    box-shadow: 
      0 0 25px rgba(100, 200, 255, 0.4),
      inset 0 0 30px rgba(100, 200, 255, 0.15),
      0 0 45px rgba(100, 200, 255, 0.25);
  }
  50% {
    box-shadow: 
      0 0 40px rgba(100, 200, 255, 0.6),
      inset 0 0 45px rgba(100, 200, 255, 0.25),
      0 0 65px rgba(100, 200, 255, 0.4);
  }
}

.charger-body {
  position: absolute;
  top: 25px;
  left: 25px;
  width: 110px;
  height: 100px;
  background: 
    linear-gradient(135deg, #1a1a2e 0%, #0a0a1e 100%),
    repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(100, 200, 255, 0.1) 4px, rgba(100, 200, 255, 0.1) 5px);
  border: 2px solid rgba(100, 200, 255, 0.4);
  box-shadow: 
    inset 0 0 10px rgba(100, 200, 255, 0.1),
    0 0 10px rgba(0, 0, 0, 0.3);
}

.charger-display {
  position: absolute;
  bottom: 10px;
  left: 10px;
  width: 120px;
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 5px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  text-align: center;
}

.charger-label {
  font-weight: bold;
  margin-bottom: 3px;
  color: #ffaa00;
}

.charger-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 3px 0;
}

.charger-icon {
  font-size: 14px;
  margin-right: 5px;
}

.charger-info {
  font-size: 9px;
  opacity: 0.8;
}

.charger-value {
  font-size: 9px;
  opacity: 0.8;
  margin-top: 2px;
}

.gun-charger .interact-prompt {
  position: absolute;
  bottom: -35px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.7);
  color: #ffc864;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  font-size: 11px;
}

@keyframes charger-pulse {
  0%, 100% {
    box-shadow: 
      0 0 25px rgba(255, 200, 100, 0.4),
      inset 0 0 30px rgba(255, 200, 100, 0.15),
      0 0 45px rgba(255, 200, 100, 0.25);
  }
  50% {
    box-shadow: 
      0 0 40px rgba(255, 200, 100, 0.6),
      inset 0 0 45px rgba(255, 200, 100, 0.25),
      0 0 65px rgba(255, 200, 100, 0.4);
  }
}

@keyframes shield-pulse {
  0%, 100% {
    box-shadow: 
      0 0 25px rgba(100, 255, 255, 0.4),
      inset 0 0 30px rgba(100, 255, 255, 0.15),
      0 0 45px rgba(100, 255, 255, 0.25);
}
  50% {
    box-shadow: 
      0 0 40px rgba(100, 255, 255, 0.6),
      inset 0 0 45px rgba(100, 255, 255, 0.25),
      0 0 65px rgba(100, 255, 255, 0.4);
  }
}


.charger-display {
  position: absolute;
  bottom: 10px;
  left: 10px;
  width: 120px;
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 5px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  text-align: center;
}

.charger-label {
  font-weight: bold;
  margin-bottom: 3px;
  color: #ffaa00;
}

.charger-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 3px 0;
}

.charger-icon {
  font-size: 14px;
  margin-right: 5px;
}

.charger-info {
  font-size: 9px;
  opacity: 0.8;
}

.charger-value {
  font-size: 9px;
  opacity: 0.8;
  margin-top: 2px;
}

@keyframes charger-pulse {
  0% { box-shadow: 0 0 5px #ffaa00; background: #444; }
  50% { box-shadow: 0 0 20px #ffaa00; background: #555; }
  100% { box-shadow: 0 0 5px #ffaa00; background: #444; }
}

.energy-machine.can-interact {
  background: #444 !important;
  border-color: #55ff55 !important;
  box-shadow: 0 0 15px #55ff55 !important;
  cursor: pointer;
  animation: energy-pulse 1.5s infinite !important;
  transform: translateZ(0) scale(1.01);
}

.energy-machine.click-feedback {
  transform: translateZ(0) scale(0.98);
  background: #55ff55 !important;
  transition: all 0.3s;
}

.machine-body {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 80px;
  height: 100px;
  background: #222;
  border: 3px solid #444;
}

.energy-display {
  position: absolute;
  bottom: 10px;
  left: 10px;
  width: 100px;
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 5px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  text-align: center;
}

.energy-label {
  font-weight: bold;
  margin-bottom: 3px;
  color: #55ff55;
}

.energy-bar {
  width: 100%;
  height: 8px;
  background: #333;
  border: 1px solid #555;
  border-radius: 2px;
  overflow: hidden;
  margin: 3px 0;
}

.energy-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff5555, #ffff55, #55ff55);
  transition: all 0.5s ease;
  box-shadow: 0 0 5px currentColor;
}

.energy-value {
  font-size: 9px;
  opacity: 0.8;
}

.interact-prompt {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.7);
  color: #55ff55;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  font-size: 12px;
}

@keyframes energy-pulse {
  0% { box-shadow: 0 0 5px #55ff55; background: #444; }
  50% { box-shadow: 0 0 20px #55ff55; background: #555; }
  100% { box-shadow: 0 0 5px #55ff55; background: #444; }
}


/* 工作台装置样式 */
.workbench {
  position: absolute;
  left: 450px;
  bottom: 120px;
  width: 130px;
  height: 150px;
  background: 
    linear-gradient(135deg, #2a3a4a 0%, #1a2a3a 100%),
    radial-gradient(circle at 50% 50%, rgba(255, 107, 53, 0.25) 0%, transparent 70%);
  border: 3px solid rgba(255, 107, 53, 0.6);
  box-shadow: 
    inset 0 0 25px rgba(255, 107, 53, 0.15),
    0 0 25px rgba(255, 107, 53, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.4);
  transform: translateZ(0);
  will-change: transform, box-shadow, background;
  backface-visibility: hidden;
  z-index: 5;
}

.workbench.can-interact {
  background: 
    linear-gradient(135deg, #3a4a5a 0%, #2a3a4a 100%),
    radial-gradient(circle at 50% 50%, rgba(255, 107, 53, 0.35) 0%, transparent 70%) !important;
  border-color: rgba(255, 107, 53, 0.9) !important;
  box-shadow: 
    0 0 30px rgba(255, 107, 53, 0.5),
    inset 0 0 35px rgba(255, 107, 53, 0.2),
    0 0 50px rgba(255, 107, 53, 0.3) !important;
  cursor: pointer;
  animation: pulse-workbench 1.5s infinite !important;
  transform: translateZ(0) scale(1.02);
}

@keyframes pulse-workbench {
  0%, 100% {
    box-shadow: 
      0 0 25px rgba(255, 107, 53, 0.4),
      inset 0 0 30px rgba(255, 107, 53, 0.15),
      0 0 45px rgba(255, 107, 53, 0.25);
  }
  50% {
    box-shadow: 
      0 0 40px rgba(255, 107, 53, 0.6),
      inset 0 0 45px rgba(255, 107, 53, 0.25),
      0 0 65px rgba(255, 107, 53, 0.4);
  }
}

.workbench.click-feedback {
  transform: translateZ(0) scale(0.97);
  background: rgba(255, 107, 53, 0.8) !important;
  transition: all 0.3s;
}

.workbench-body {
  position: absolute;
  top: 30px;
  left: 20px;
  width: 90px;
  height: 80px;
  background: 
    linear-gradient(135deg, #1a1a2e 0%, #0a0a1e 100%),
    repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255, 107, 53, 0.1) 4px, rgba(255, 107, 53, 0.1) 5px);
  border: 2px solid rgba(255, 107, 53, 0.4);
  border-radius: 4px;
  box-shadow: 
    inset 0 0 10px rgba(255, 107, 53, 0.1),
    0 0 10px rgba(0, 0, 0, 0.3);
}

.workbench-body::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 3px;
  background: rgba(255, 107, 53, 0.6);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(255, 107, 53, 0.4);
}

.workbench-body::after {
  content: '';
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 3px;
  height: 40px;
  background: rgba(255, 107, 53, 0.6);
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(255, 107, 53, 0.4);
}

.workbench-display {
  position: absolute;
  bottom: 10px;
  left: 10px;
  width: 110px;
  background: 
    linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 20, 40, 0.9) 100%),
    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255, 107, 53, 0.1) 2px, rgba(255, 107, 53, 0.1) 3px);
  color: white;
  padding: 5px;
  border-radius: 3px;
  border: 1px solid rgba(255, 107, 53, 0.4);
  box-shadow: 
    inset 0 0 10px rgba(255, 107, 53, 0.1),
    0 0 10px rgba(0, 0, 0, 0.5);
  font-family: 'Courier New', monospace;
  font-size: 10px;
  text-align: center;
}

.workbench-label {
  font-weight: bold;
  margin-bottom: 3px;
  color: #ff6b35;
}

.workbench-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 3px 0;
}

.workbench-icon {
  font-size: 14px;
  margin-right: 5px;
}

.workbench-info {
  font-size: 9px;
  opacity: 0.8;
}

.workbench-value {
  font-size: 8px;
  opacity: 0.7;
  margin-top: 2px;
  color: #cccccc;
}

.workbench .interact-prompt {
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.7);
  color: #ff6b35;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  font-size: 11px;
}

/* 矿石筛选机装置样式 */
.ore-sorter {
  position: absolute;
  left: 300px;
  top: 120px;
  width: 130px;
  height: 150px;
  background: 
    linear-gradient(135deg, #2a3a4a 0%, #1a2a3a 100%),
    radial-gradient(circle at 50% 50%, rgba(150, 100, 255, 0.25) 0%, transparent 70%);
  border: 3px solid rgba(150, 100, 255, 0.6);
  box-shadow: 
    inset 0 0 25px rgba(150, 100, 255, 0.15),
    0 0 25px rgba(150, 100, 255, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.4);
  transform: translateZ(0);
  will-change: transform, box-shadow, background;
  backface-visibility: hidden;
  z-index: 5;
}

.ore-sorter.can-interact {
  background: 
    linear-gradient(135deg, #3a4a5a 0%, #2a3a4a 100%),
    radial-gradient(circle at 50% 50%, rgba(150, 100, 255, 0.35) 0%, transparent 70%) !important;
  border-color: rgba(150, 100, 255, 0.9) !important;
  box-shadow: 
    0 0 30px rgba(150, 100, 255, 0.5),
    inset 0 0 35px rgba(150, 100, 255, 0.2),
    0 0 50px rgba(150, 100, 255, 0.3) !important;
  cursor: pointer;
  animation: sorter-pulse 1.5s infinite !important;
  transform: translateZ(0) scale(1.02);
}

@keyframes sorter-pulse {
  0%, 100% {
    box-shadow: 
      0 0 25px rgba(150, 100, 255, 0.4),
      inset 0 0 30px rgba(150, 100, 255, 0.15),
      0 0 45px rgba(150, 100, 255, 0.25);
  }
  50% {
    box-shadow: 
      0 0 40px rgba(150, 100, 255, 0.6),
      inset 0 0 45px rgba(150, 100, 255, 0.25),
      0 0 65px rgba(150, 100, 255, 0.4);
  }
}

.ore-sorter.click-feedback {
  transform: translateZ(0) scale(0.97);
  background: rgba(150, 100, 255, 0.8) !important;
  transition: all 0.3s;
}

.ore-sorter-body {
  position: absolute;
  top: 30px;
  left: 20px;
  width: 90px;
  height: 80px;
  background: 
    linear-gradient(135deg, #1a1a2e 0%, #0a0a1e 100%),
    repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(150, 100, 255, 0.1) 4px, rgba(150, 100, 255, 0.1) 5px);
  border: 2px solid rgba(150, 100, 255, 0.4);
  border-radius: 4px;
  box-shadow: 
    inset 0 0 10px rgba(150, 100, 255, 0.1),
    0 0 10px rgba(0, 0, 0, 0.3);
}

.ore-sorter-display {
  position: absolute;
  bottom: 10px;
  left: 10px;
  width: 110px;
  background: 
    linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 20, 40, 0.9) 100%),
    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(150, 100, 255, 0.1) 2px, rgba(150, 100, 255, 0.1) 3px);
  color: white;
  padding: 5px;
  border-radius: 3px;
  border: 1px solid rgba(150, 100, 255, 0.4);
  box-shadow: 
    inset 0 0 10px rgba(150, 100, 255, 0.1),
    0 0 10px rgba(0, 0, 0, 0.5);
  font-family: 'Courier New', monospace;
  font-size: 10px;
  text-align: center;
}

.ore-sorter-label {
  font-weight: bold;
  margin-bottom: 3px;
  color: #9664ff;
}

.ore-sorter-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 3px 0;
}

.ore-sorter-icon {
  font-size: 14px;
  margin-right: 5px;
}

.ore-sorter-info {
  font-size: 9px;
  opacity: 0.8;
}

.ore-sorter-value {
  font-size: 9px;
  opacity: 0.8;
  margin-top: 2px;
}

.ore-sorter .interact-prompt {
  position: absolute;
  bottom: -35px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.7);
  color: #9664ff;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  font-size: 11px;
}

/* 机械拆解机装置样式 */
.disassembler {
  position: absolute;
  left: 720px;
  bottom: 120px;
  width: 130px;
  height: 150px;
  background: 
    linear-gradient(135deg, #2a3a4a 0%, #1a2a3a 100%),
    radial-gradient(circle at 50% 50%, rgba(255, 165, 0, 0.25) 0%, transparent 70%);
  border: 3px solid rgba(255, 165, 0, 0.6);
  box-shadow: 
    inset 0 0 25px rgba(255, 165, 0, 0.15),
    0 0 25px rgba(255, 165, 0, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.4);
  transform: translateZ(0);
  will-change: transform, box-shadow, background;
  backface-visibility: hidden;
  z-index: 5;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.disassembler.can-interact {
  background: 
    linear-gradient(135deg, #3a4a5a 0%, #2a3a4a 100%),
    radial-gradient(circle at 50% 50%, rgba(255, 165, 0, 0.35) 0%, transparent 70%) !important;
  border-color: rgba(255, 165, 0, 0.9) !important;
  box-shadow: 
    0 0 30px rgba(255, 165, 0, 0.5),
    inset 0 0 35px rgba(255, 165, 0, 0.2),
    0 0 50px rgba(255, 165, 0, 0.3) !important;
  cursor: pointer;
  animation: disassembler-pulse 1.5s infinite !important;
  transform: translateZ(0) scale(1.02);
  opacity: 1;
}

@keyframes disassembler-pulse {
  0%, 100% {
    box-shadow: 
      0 0 25px rgba(255, 165, 0, 0.4),
      inset 0 0 30px rgba(255, 165, 0, 0.15),
      0 0 45px rgba(255, 165, 0, 0.25);
  }
  50% {
    box-shadow: 
      0 0 40px rgba(255, 165, 0, 0.6),
      inset 0 0 45px rgba(255, 165, 0, 0.25),
      0 0 65px rgba(255, 165, 0, 0.4);
  }
}

.disassembler.click-feedback {
  transform: translateZ(0) scale(0.97);
  background: rgba(255, 165, 0, 0.8) !important;
  transition: all 0.3s;
}

.disassembler-body {
  position: absolute;
  top: 30px;
  left: 20px;
  width: 90px;
  height: 80px;
  background: 
    linear-gradient(135deg, #1a1a2e 0%, #0a0a1e 100%),
    repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255, 165, 0, 0.1) 4px, rgba(255, 165, 0, 0.1) 5px);
  border: 2px solid rgba(255, 165, 0, 0.4);
  border-radius: 4px;
  box-shadow: 
    inset 0 0 10px rgba(255, 165, 0, 0.1),
    0 0 10px rgba(0, 0, 0, 0.3);
}

.disassembler-display {
  position: absolute;
  bottom: 10px;
  left: 10px;
  width: 110px;
  background: 
    linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 20, 40, 0.9) 100%),
    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255, 165, 0, 0.1) 2px, rgba(255, 165, 0, 0.1) 3px);
  color: white;
  padding: 5px;
  border-radius: 3px;
  border: 1px solid rgba(255, 165, 0, 0.4);
  box-shadow: 
    inset 0 0 10px rgba(255, 165, 0, 0.1),
    0 0 10px rgba(0, 0, 0, 0.5);
  font-family: 'Courier New', monospace;
  font-size: 10px;
  text-align: center;
}

.disassembler-label {
  font-weight: bold;
  margin-bottom: 3px;
  color: #ffa500;
}

.disassembler-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 3px 0;
}

.disassembler-icon {
  font-size: 14px;
  margin-right: 5px;
}

.disassembler-info {
  font-size: 9px;
  opacity: 0.8;
}

.disassembler-value {
  font-size: 9px;
  opacity: 0.8;
  margin-top: 2px;
}

.disassembler .interact-prompt {
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.7);
  color: #ffa500;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  font-size: 11px;
}

.disassembler .interact-prompt.locked {
  color: #ff5555;
}

/* 机械拆解机面板样式 */
.disassembler-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  max-height: 80vh;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #ffa500;
  border-radius: 8px;
  padding: 20px;
  font-family: 'Courier New', monospace;
  color: white;
  box-shadow: 0 0 30px rgba(255, 165, 0, 0.4);
  backdrop-filter: blur(5px);
  z-index: 100;
  overflow-y: auto;
}

.disassembler-panel .panel-header {
  border-bottom: 1px solid #ffa500;
  margin-bottom: 15px;
  padding-bottom: 10px;
}

.disassembler-panel .panel-title {
  color: #ffa500;
  font-size: 18px;
}

.disassembler-panel .panel-subtitle {
  color: #cccccc;
  font-size: 12px;
  margin-top: 5px;
}

.disassembler-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.disassembler-info {
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 6px;
  padding: 15px;
}

.btn-disassemble {
  padding: 12px;
  background: linear-gradient(135deg, rgba(255, 165, 0, 0.8) 0%, rgba(255, 165, 0, 0.6) 100%);
  border: 2px solid #ffa500;
  border-radius: 6px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Courier New', monospace;
}

.btn-disassemble:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(255, 165, 0, 1) 0%, rgba(255, 165, 0, 0.8) 100%);
  box-shadow: 0 0 20px rgba(255, 165, 0, 0.5);
  transform: translateY(-2px);
}

.btn-disassemble:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.output-range {
  font-size: 11px;
  color: #cccccc;
  margin-left: 5px;
  opacity: 0.8;
}

/* 矿石筛选机面板样式 */
.ore-sorter-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  max-height: 80vh;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #9664ff;
  border-radius: 8px;
  padding: 20px;
  font-family: 'Courier New', monospace;
  color: white;
  box-shadow: 0 0 30px rgba(150, 100, 255, 0.4);
  backdrop-filter: blur(5px);
  z-index: 100;
  overflow-y: auto;
}

.ore-sorter-panel .panel-header {
  border-bottom: 1px solid #9664ff;
  margin-bottom: 15px;
  padding-bottom: 10px;
}

.ore-sorter-panel .panel-title {
  color: #9664ff;
  font-size: 18px;
}

.ore-sorter-panel .panel-subtitle {
  color: #cccccc;
  font-size: 12px;
  margin-top: 5px;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  color: #9664ff;
  font-size: 24px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(150, 100, 255, 0.2);
  transform: rotate(90deg);
}

.ore-sorter-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sorter-info {
  background: rgba(150, 100, 255, 0.1);
  border: 1px solid rgba(150, 100, 255, 0.3);
  border-radius: 6px;
  padding: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #9664ff;
  font-weight: bold;
  min-width: 100px;
}

.info-value {
  color: #ffffff;
  text-align: right;
}

.sorter-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-group label {
  color: #cccccc;
  font-size: 14px;
  min-width: 80px;
}

.amount-input {
  flex: 1;
  padding: 8px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(150, 100, 255, 0.5);
  border-radius: 4px;
  color: white;
  font-size: 14px;
  font-family: 'Courier New', monospace;
}

.amount-input:focus {
  outline: none;
  border-color: #9664ff;
  box-shadow: 0 0 10px rgba(150, 100, 255, 0.3);
}

.btn-max {
  padding: 8px 15px;
  background: rgba(150, 100, 255, 0.3);
  border: 1px solid rgba(150, 100, 255, 0.5);
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.btn-max:hover {
  background: rgba(150, 100, 255, 0.5);
  border-color: #9664ff;
}

.btn-sort {
  padding: 12px;
  background: linear-gradient(135deg, rgba(150, 100, 255, 0.8) 0%, rgba(150, 100, 255, 0.6) 100%);
  border: 2px solid #9664ff;
  border-radius: 6px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Courier New', monospace;
}

.btn-sort:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(150, 100, 255, 1) 0%, rgba(150, 100, 255, 0.8) 100%);
  box-shadow: 0 0 20px rgba(150, 100, 255, 0.5);
  transform: translateY(-2px);
}

.btn-sort:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-preview {
  background: rgba(150, 100, 255, 0.1);
  border: 1px solid rgba(150, 100, 255, 0.3);
  border-radius: 6px;
  padding: 15px;
  text-align: center;
}

.preview-item {
  margin: 10px 0;
  font-size: 14px;
  color: #ffffff;
}

.preview-arrow {
  font-size: 20px;
  color: #9664ff;
  margin: 5px 0;
}

.resource-name {
  color: #9664ff;
  font-weight: bold;
  margin-left: 5px;
}

/* 统一充能面板样式 */
.charging-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 450px;
  background: rgba(0, 0, 0, 0.95);
  border: 3px solid #64c8ff;
  border-radius: 12px;
  padding: 20px;
  font-family: 'Courier New', monospace;
  color: white;
  box-shadow: 0 0 30px rgba(100, 200, 255, 0.4);
  backdrop-filter: blur(10px);
  z-index: 1000;
}

.charging-panel .panel-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 12px;
  border-bottom: 2px solid #64c8ff;
}

.charging-panel .panel-title {
  font-size: 20px;
  font-weight: bold;
  color: #64c8ff;
  margin-bottom: 5px;
}

.charging-panel .panel-subtitle {
  font-size: 12px;
  color: #aaaaaa;
  opacity: 0.8;
}

.energy-status {
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(100, 200, 255, 0.1);
  border-radius: 6px;
  border: 1px solid #64c8ff;
}

.energy-status .status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.energy-status .status-item .label {
  color: #cccccc;
  font-size: 13px;
}

.energy-status .status-item .value {
  color: #64c8ff;
  font-weight: bold;
  font-size: 13px;
}

.energy-status .progress-bar {
  width: 100%;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
}

.energy-status .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #64c8ff, #96c8ff);
  transition: all 0.5s ease;
  box-shadow: 0 0 5px rgba(100, 200, 255, 0.6);
}

.charging-devices {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 15px;
}

.charging-device {
  background: rgba(100, 200, 255, 0.1);
  border: 2px solid #64c8ff;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 15px;
}

.charging-device:hover {
  background: rgba(100, 200, 255, 0.2);
  border-color: #96c8ff;
  transform: translateX(5px);
  box-shadow: 0 0 15px rgba(100, 200, 255, 0.3);
}

.charging-device .device-icon {
  font-size: 32px;
  width: 50px;
  text-align: center;
}

.charging-device .device-name {
  font-size: 16px;
  font-weight: bold;
  color: #64c8ff;
  min-width: 80px;
}

.charging-device .device-status {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.charging-device .device-info {
  font-size: 12px;
  color: #aaaaaa;
}

.charging-device .device-value {
  font-size: 13px;
  color: #ffffff;
  font-weight: bold;
}

.charging-device .device-action {
  font-size: 12px;
  color: #64c8ff;
  padding: 6px 12px;
  background: rgba(100, 200, 255, 0.2);
  border-radius: 4px;
  border: 1px solid #64c8ff;
}

.charging-panel .panel-close-hint {
  text-align: center;
  font-size: 11px;
  color: #aaaaaa;
  margin-top: 10px;
  opacity: 0.7;
  font-style: italic;
}


/* 能源系统面板样式 */
.energy-system-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 450px;
  background: rgba(0, 0, 0, 0.95);
  border: 3px solid #55ff55;
  border-radius: 12px;
  padding: 20px;
  font-family: 'Courier New', monospace;
  color: white;
  box-shadow: 0 0 30px rgba(85, 255, 85, 0.4);
  backdrop-filter: blur(10px);
  z-index: 1000;
}

.energy-system-panel .panel-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 12px;
  border-bottom: 2px solid #55ff55;
}

.energy-system-panel .panel-title {
  font-size: 20px;
  font-weight: bold;
  color: #55ff55;
  margin-bottom: 5px;
}

.energy-system-panel .panel-subtitle {
  font-size: 12px;
  color: #aaaaaa;
  opacity: 0.8;
}

.energy-system-panel .energy-status {
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(85, 255, 85, 0.1);
  border-radius: 6px;
  border: 1px solid #55ff55;
}

.energy-system-panel .energy-status .status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.energy-system-panel .energy-status .status-item:last-child {
  margin-bottom: 0;
}

.energy-system-panel .energy-status .label {
  color: #cccccc;
  font-size: 13px;
}

.energy-system-panel .energy-status .value {
  color: #55ff55;
  font-weight: bold;
  font-size: 13px;
}

.energy-system-panel .energy-status .progress-bar {
  width: 100%;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
}

.energy-system-panel .energy-status .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #55ff55, #88ff88);
  transition: all 0.5s ease;
  box-shadow: 0 0 5px rgba(85, 255, 85, 0.6);
}

.solar-panel-section {
  margin-bottom: 15px;
  padding: 15px;
  background: rgba(255, 200, 100, 0.1);
  border-radius: 8px;
  border: 2px solid rgba(255, 200, 100, 0.5);
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #ffc864;
  margin-bottom: 12px;
  text-align: center;
}

.solar-panel-info {
  margin-bottom: 12px;
}

.solar-panel-info .info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.solar-panel-info .info-label {
  color: #cccccc;
  font-size: 12px;
}

.solar-panel-info .info-value {
  color: #ffc864;
  font-weight: bold;
  font-size: 12px;
}

.use-solar-panel-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #ffc864, #ffaa00);
  border: 2px solid #ffaa00;
  border-radius: 6px;
  color: #000;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Courier New', monospace;
  }

.use-solar-panel-btn:hover {
  background: linear-gradient(135deg, #ffaa00, #ff8800);
  box-shadow: 0 0 15px rgba(255, 200, 100, 0.5);
  transform: translateY(-2px);
  }

.use-solar-panel-btn:active {
  transform: translateY(0);
}

.no-solar-panel {
  padding: 20px;
  text-align: center;
  background: rgba(100, 100, 100, 0.1);
  border-radius: 8px;
  border: 1px solid #555;
}

.no-item-text {
  font-size: 14px;
  color: #aaaaaa;
  margin-bottom: 8px;
}

.hint-text {
  font-size: 11px;
  color: #888888;
  font-style: italic;
}

.energy-system-panel .panel-close-hint {
  text-align: center;
  font-size: 11px;
  color: #aaaaaa;
  margin-top: 10px;
  opacity: 0.7;
  font-style: italic;
}

/* 工作台面板样式 */
.workbench-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  background: rgba(0, 0, 0, 0.95);
  border: 3px solid #ff6b35;
  border-radius: 12px;
  padding: 20px;
  font-family: 'Courier New', monospace;
  color: white;
  box-shadow: 0 0 30px rgba(255, 107, 53, 0.4);
  backdrop-filter: blur(10px);
  z-index: 1000;
}

.workbench-panel .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ff6b35;
}

.workbench-panel .panel-title {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b35;
}

.workbench-panel .panel-subtitle {
  font-size: 12px;
  color: #cccccc;
  opacity: 0.8;
}

/* 工作台选项卡样式 */
.workbench-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #444;
}

.tab-btn {
  flex: 1;
  padding: 8px 12px;
  background: #333;
  border: none;
  color: #cccccc;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  background: #444;
  color: #ffffff;
}

.tab-btn.active {
  background: #ff6b35;
  color: #000000;
  border-bottom: 2px solid #ff6b35;
  font-weight: bold;
}

/* 资源储藏界面样式 */
.resource-storage {
  min-height: 200px;
}

/* 工具库界面样式 */
.tool-storage {
  min-height: 200px;
}

.resource-slot.owned {
  border-color: #55ff55;
  background: rgba(85, 255, 85, 0.1);
}

.resource-slot.owned:hover {
  border-color: #55ff55;
  box-shadow: 0 0 15px rgba(85, 255, 85, 0.3);
  transform: translateY(-2px);
}

.storage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.storage-title {
  font-size: 16px;
  font-weight: bold;
  color: #ff6b35;
}

.storage-capacity {
  font-size: 12px;
  color: #cccccc;
  opacity: 0.8;
}

.storage-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.resource-slot {
  background: #222;
  border: 2px solid #444;
  border-radius: 6px;
  padding: 10px;
  text-align: center;
  transition: all 0.3s;
}

.resource-slot.empty {
  opacity: 0.5;
  border-style: dashed;
}

.resource-slot:hover {
  border-color: #ff6b35;
  transform: translateY(-2px);
}

.resource-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.resource-name {
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 3px;
  color: #ffffff;
}

.resource-count {
  font-size: 10px;
  color: #ff6b35;
  font-weight: bold;
}

.storage-info {
  text-align: center;
  padding: 10px;
  background: rgba(255, 107, 53, 0.1);
  border-radius: 4px;
  border: 1px solid #ff6b35;
}

.info-text {
  font-size: 11px;
  color: #cccccc;
  line-height: 1.4;
}

/* 资源合成和资源图鉴界面样式 */
.resource-crafting {
  min-height: 200px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.resource-encyclopedia {
  min-height: 200px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.crafting-header, .encyclopedia-header {
  text-align: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #444;
}

.crafting-title, .encyclopedia-title {
  font-size: 16px;
  font-weight: bold;
  color: #ff6b35;
  margin-bottom: 5px;
}

.crafting-subtitle, .encyclopedia-subtitle {
  font-size: 12px;
  color: #cccccc;
  opacity: 0.8;
}

.crafting-info {
  text-align: center;
  padding: 20px;
  background: rgba(255, 107, 53, 0.1);
  border-radius: 6px;
  border: 1px solid #ff6b35;
}

/* 资源合成列表样式 */
.crafting-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.crafting-item {
  background: #222;
  border: 2px solid #444;
  border-radius: 6px;
  padding: 12px;
  transition: all 0.3s;
}

.crafting-item.can-craft {
  border-color: #555;
}

.crafting-item.can-craft:hover {
  border-color: #ff6b35;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 107, 53, 0.2);
}

.crafting-item.cannot-craft {
  opacity: 0.6;
  border-color: #333;
}

.crafting-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #444;
}

.crafting-icon {
  font-size: 24px;
}

.crafting-item-name {
  font-size: 14px;
  font-weight: bold;
  color: #ff6b35;
  flex: 1;
}

.crafting-type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.crafting-type-badge.tool {
  background: #ff6b35;
  color: #000;
}

.crafting-type-badge.module {
  background: #00bcd4;
  color: #000;
}

.crafting-item-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.crafting-description {
  font-size: 11px;
  color: #cccccc;
  margin-bottom: 5px;
}

.crafting-ingredients {
  font-size: 10px;
  color: #aaaaaa;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.ingredient-title {
  font-weight: bold;
  color: #ff6b35;
  margin-bottom: 6px;
}

.ingredient-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 10px;
}

.ingredient-item.sufficient {
  color: #55ff55;
}

.ingredient-item.insufficient {
  color: #ff5555;
}

.ingredient-check {
  font-weight: bold;
  min-width: 12px;
}

.ingredient-name {
  flex: 1;
}

.ingredient-amount {
  color: #cccccc;
}

.ingredient-available {
  color: #888;
  font-size: 9px;
}

.crafting-note {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #444;
  font-size: 9px;
  color: #ffaa00;
}

.note-label {
  font-weight: bold;
}

.note-text {
  margin-left: 4px;
}

.craft-button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Courier New', monospace;
  margin-top: 8px;
}

.craft-button.can-craft {
  background: #ff6b35;
  color: #000;
}

.craft-button.can-craft:hover {
  background: #ff8c5a;
  transform: scale(1.05);
}

.craft-button.cannot-craft {
  background: #444;
  color: #888;
  cursor: not-allowed;
}

.craft-button:disabled {
  opacity: 0.6;
}

/* 图鉴分类选择器样式 */
.encyclopedia-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(255, 107, 53, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(255, 107, 53, 0.3);
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #555;
  border-radius: 6px;
  color: #cccccc;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Courier New', monospace;
}

.category-btn:hover {
  background: rgba(255, 107, 53, 0.2);
  border-color: #ff6b35;
  transform: translateY(-2px);
}

.category-btn.active {
  background: linear-gradient(135deg, #ff6b35, #ff8c5a);
  border-color: #ff6b35;
  color: #000;
  box-shadow: 0 0 10px rgba(255, 107, 53, 0.5);
}

.category-icon {
  font-size: 14px;
}

.category-name {
  font-size: 12px;
}

.category-count {
  font-size: 10px;
  opacity: 0.8;
}

/* 资源图鉴列表样式 */
.encyclopedia-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 5px;
}

.encyclopedia-list::-webkit-scrollbar {
  width: 6px;
}

.encyclopedia-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.encyclopedia-list::-webkit-scrollbar-thumb {
  background: rgba(255, 107, 53, 0.5);
  border-radius: 3px;
}

.encyclopedia-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 107, 53, 0.7);
}

.encyclopedia-item {
  background: #222;
  border: 2px solid #444;
  border-radius: 6px;
  padding: 12px;
  transition: all 0.3s;
}

.encyclopedia-item:hover {
  border-color: #ff6b35;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 107, 53, 0.2);
}

.encyclopedia-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #444;
}

.encyclopedia-icon {
  font-size: 24px;
}

.encyclopedia-resource-name {
  font-size: 14px;
  font-weight: bold;
  color: #ff6b35;
  flex: 1;
}

.encyclopedia-type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.resource-badge {
  background: #00bcd4;
  color: #000;
}

.tool-badge {
  background: #ff6b35;
  color: #000;
}

.weapon-badge {
  background: #ff4444;
  color: #fff;
}

.monster-badge {
  background: #9b59b6;
  color: #fff;
}

.device-badge {
  background: #3498db;
  color: #fff;
}

.tool-item {
  border-left: 3px solid #ff6b35;
}

.encyclopedia-item-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.encyclopedia-detail {
  display: flex;
  gap: 8px;
  font-size: 11px;
  line-height: 1.6;
}

.detail-label {
  color: #ff6b35;
  min-width: 90px;
  font-weight: bold;
  flex-shrink: 0;
}

.detail-value {
  color: #ffffff;
  flex: 1;
}

.workbench-panel .panel-close-hint {
  text-align: center;
  font-size: 10px;
  color: #ff6b35;
  margin-top: 15px;
  opacity: 0.7;
  font-style: italic;
}

/* 开场剧情对话样式 */
.opening-dialogue-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.5s ease-in;
}

/* 结局剧情对话样式 */
.ending-dialogue-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  z-index: 10000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.5s ease-in;
  overflow: hidden;
}

.escape-animation-scene {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10001;
}

.escape-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.dialogue-container.fade-out {
  opacity: 0.3;
  transition: opacity 1s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialogue-container {
  width: 90%;
  max-width: 800px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #0f3460;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 0 30px rgba(0, 150, 255, 0.3);
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialogue-scene {
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-left: 3px solid #0096ff;
  border-radius: 5px;
}

.scene-description {
  color: #b0c4de;
  font-size: 14px;
  line-height: 1.6;
  font-style: italic;
  text-align: center;
}

.dialogue-box {
  background: rgba(15, 52, 96, 0.5);
  border: 1px solid #0f3460;
  border-radius: 8px;
  padding: 20px;
}

.dialogue-speaker {
  color: #00d4ff;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  border-bottom: 1px solid rgba(0, 212, 255, 0.3);
  padding-bottom: 10px;
}

.dialogue-text {
  color: #e0e0e0;
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 20px;
  min-height: 80px;
  text-align: left;
}

.dialogue-controls {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.dialogue-next-btn {
  padding: 12px 30px;
  background: linear-gradient(135deg, #0096ff 0%, #00d4ff 100%);
  border: none;
  border-radius: 5px;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(0, 150, 255, 0.4);
  font-family: 'Courier New', monospace;
}

.dialogue-next-btn:hover {
  background: linear-gradient(135deg, #00b4ff 0%, #00e4ff 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 150, 255, 0.6);
}

.dialogue-next-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(0, 150, 255, 0.4);
}

/* AI机器人样式 */
.ai-robot {
  position: absolute;
  width: 80px;
  height: 120px;
  z-index: 100;
  cursor: pointer;
  transition: transform 0.1s linear;
}

.ai-robot.can-interact {
  transform: scale(1.1);
  filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.6));
}

.ai-screen {
  width: 70px;
  height: 50px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 3px solid #0f3460;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  margin: 0 auto;
  position: relative;
}

.ai-face {
  font-size: 24px;
  margin-bottom: 4px;
}

.ai-status {
  font-size: 8px;
  color: #00d4ff;
  text-align: center;
  font-family: 'Courier New', monospace;
}

.ai-stand {
  width: 30px;
  height: 70px;
  background: linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 100%);
  border: 2px solid #0f3460;
  border-radius: 4px;
  margin: 0 auto;
  margin-top: -2px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  position: relative;
}

/* AI机器人轮子容器 */
.ai-wheels {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  align-items: center;
}

/* AI机器人轮子 */
.ai-wheel {
  width: 12px;
  height: 12px;
  background: radial-gradient(circle, #3a3a4e 0%, #1a1a2e 100%);
  border: 2px solid #0f3460;
  border-radius: 50%;
  box-shadow: 
    inset 0 0 5px rgba(0, 0, 0, 0.5),
    0 2px 5px rgba(0, 0, 0, 0.3);
  animation: wheel-rotate 0.8s linear infinite;
  position: relative;
}

/* 轮子上的细节线条 */
.ai-wheel::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background: #0f3460;
  transform: translateY(-50%);
}

.ai-wheel::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 100%;
  background: #0f3460;
  transform: translateX(-50%);
}

.wheel-left {
  animation-direction: normal;
}

.wheel-right {
  animation-direction: normal;
}

@keyframes wheel-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* AI对话面板样式 */
.ai-dialogue-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  max-width: 90%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #0f3460;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 0 30px rgba(0, 150, 255, 0.3);
  z-index: 5000;
  animation: slideUp 0.3s ease-out;
}

.ai-dialogue-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.3);
}

.ai-avatar {
  font-size: 32px;
  margin-right: 15px;
}

.ai-name {
  flex: 1;
  color: #00d4ff;
  font-size: 20px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.ai-close-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  transition: all 0.3s;
}

.ai-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.ai-dialogue-content {
  color: #e0e0e0;
}

.escape-progress-title {
  font-size: 18px;
  font-weight: bold;
  color: #00d4ff;
  margin-bottom: 15px;
  text-align: center;
  font-family: 'Courier New', monospace;
}

.escape-requirements {
  margin-bottom: 20px;
}

.requirement-item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
  border-left: 3px solid #6c757d;
  transition: all 0.3s;
}

.requirement-item.completed {
  border-left-color: #00d4ff;
  background: rgba(0, 212, 255, 0.1);
}

.requirement-icon {
  font-size: 20px;
  margin-right: 10px;
}

.requirement-name {
  flex: 1;
  font-size: 14px;
}

.requirement-progress {
  font-size: 14px;
  color: #b0c4de;
  margin-right: 10px;
  font-family: 'Courier New', monospace;
}

.requirement-item.completed .requirement-progress {
  color: #00d4ff;
}

.requirement-status {
  color: #00d4ff;
  font-size: 18px;
  font-weight: bold;
}

.escape-progress-bar {
  position: relative;
  width: 100%;
  height: 30px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 15px;
  overflow: hidden;
  border: 2px solid #0f3460;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0096ff 0%, #00d4ff 100%);
  transition: width 0.5s ease;
  border-radius: 15px;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
}

.ai-escape-ready {
  text-align: center;
  padding: 20px;
}

.escape-ready-message {
  font-size: 20px;
  color: #00d4ff;
  font-weight: bold;
  margin-bottom: 20px;
  font-family: 'Courier New', monospace;
}

.escape-btn {
  padding: 15px 40px;
  font-size: 18px;
  font-weight: bold;
  background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
  transition: all 0.3s;
  font-family: 'Courier New', monospace;
}

.escape-btn:hover {
  background: linear-gradient(135deg, #ff8c42 0%, #ffaa55 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.6);
}

.escape-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(255, 107, 53, 0.4);
}
</style>
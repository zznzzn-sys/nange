// 简化版游戏状态管理
interface GameState {
  currentScene: string
  inventory: string[]
  clues: string[]
  isGameStarted: boolean
}

const initialState: GameState = {
  currentScene: 'home',
  inventory: [],
  clues: [],
  isGameStarted: false
}

// 简单的状态管理函数
export const gameStore = {
  getState: () => initialState,
  setState: (newState: Partial<GameState>) => {
    Object.assign(initialState, newState)
  },
  addToInventory: (item: string) => {
    initialState.inventory.push(item)
  },
  addClue: (clue: string) => {
    initialState.clues.push(clue)
  },
  startGame: () => {
    initialState.isGameStarted = true
    initialState.currentScene = 'game'
  }
}

export const useGameStore = {
  getState: () => initialState
}
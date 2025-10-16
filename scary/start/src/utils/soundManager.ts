// 音效管理器
export class SoundManager {
  private static instance: SoundManager
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private backgroundMusic: HTMLAudioElement | null = null
  private isMuted = false

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager()
    }
    return SoundManager.instance
  }

  // 预加载音效
  preloadSounds() {
    const soundFiles = [
      { name: 'click', url: '/assets/sounds/click.mp3' },
      { name: 'footstep', url: '/assets/sounds/footstep.mp3' },
      { name: 'door_open', url: '/assets/sounds/door_open.mp3' },
      { name: 'discover', url: '/assets/sounds/discover.mp3' },
      { name: 'ambient', url: '/assets/sounds/ambient.mp3' }
    ]

    soundFiles.forEach(sound => {
      const audio = new Audio()
      audio.preload = 'auto'
      this.sounds.set(sound.name, audio)
    })
  }

  // 播放音效
  playSound(soundName: string, volume: number = 0.5) {
    if (this.isMuted) return

    try {
      const audio = this.sounds.get(soundName)
      if (audio) {
        audio.volume = volume
        audio.currentTime = 0
        audio.play().catch(error => {
          console.log(`音效播放失败: ${soundName}`, error)
        })
      } else {
        // 如果音效文件不存在，使用默认音效
        this.playDefaultSound(soundName, volume)
      }
    } catch (error) {
      console.log('音效播放失败:', error)
    }
  }

  // 播放默认音效（当音效文件不存在时）
  private playDefaultSound(soundName: string, volume: number) {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // 根据音效类型设置不同的音调
    switch (soundName) {
      case 'click':
        oscillator.frequency.value = 800
        break
      case 'discover':
        oscillator.frequency.value = 1200
        break
      case 'footstep':
        oscillator.frequency.value = 300
        break
      default:
        oscillator.frequency.value = 440
    }

    gainNode.gain.value = volume
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  // 播放背景音乐
  playBackgroundMusic(volume: number = 0.3) {
    if (this.isMuted) return

    try {
      if (!this.backgroundMusic) {
        this.backgroundMusic = new Audio()
        this.backgroundMusic.loop = true
        this.backgroundMusic.volume = volume
        this.backgroundMusic.play().catch(error => {
          console.log('背景音乐播放失败:', error)
        })
      }
    } catch (error) {
      console.log('背景音乐播放失败:', error)
    }
  }

  // 停止背景音乐
  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause()
      this.backgroundMusic.currentTime = 0
    }
  }

  // 静音/取消静音
  toggleMute() {
    this.isMuted = !this.isMuted
    if (this.backgroundMusic) {
      this.backgroundMusic.muted = this.isMuted
    }
    return this.isMuted
  }

  // 设置音量
  setVolume(volume: number) {
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = Math.max(0, Math.min(1, volume))
    }
  }

  // 停止所有音效
  stopAllSounds() {
    this.sounds.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
    this.stopBackgroundMusic()
  }
}

export const soundManager = SoundManager.getInstance()
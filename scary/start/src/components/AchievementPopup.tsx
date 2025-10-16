import React, { useEffect, useState } from 'react'
import { achievements } from '../data/gameData'

interface AchievementPopupProps {
  achievementId: string
  onClose: () => void
}

function AchievementPopup({ achievementId, onClose }: AchievementPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const achievement = achievements.find(a => a.id === achievementId)

  useEffect(() => {
    if (achievement) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 500)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [achievement, onClose])

  if (!achievement || !isVisible) return null

  return (
    <div className="achievement-popup">
      <div className="achievement-content">
        <div className="achievement-icon">{achievement.icon}</div>
        <div className="achievement-info">
          <h4 className="achievement-title">成就解锁！</h4>
          <h3 className="achievement-name">{achievement.name}</h3>
          <p className="achievement-desc">{achievement.description}</p>
        </div>
      </div>
    </div>
  )
}

export default AchievementPopup
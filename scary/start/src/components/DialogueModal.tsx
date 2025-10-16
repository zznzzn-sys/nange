import React from 'react'
import './DialogueModal.css'

interface DialogueModalProps {
  isOpen: boolean
  dialogue: {
    text: string
    speaker: string
    choices?: Array<{
      text: string
      action: () => void
    }>
  }
  onClose: () => void
}

function DialogueModal({ isOpen, dialogue, onClose }: DialogueModalProps) {
  if (!isOpen) return null

  return (
    <div className="dialogue-modal-overlay">
      <div className="dialogue-modal">
        <div className="dialogue-header">
          <h3 className="speaker-name">{dialogue.speaker}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="dialogue-content">
          <p className="dialogue-text">{dialogue.text}</p>
        </div>

        {dialogue.choices && dialogue.choices.length > 0 && (
          <div className="dialogue-choices">
            {dialogue.choices.map((choice, index) => (
              <button
                key={index}
                className="choice-button"
                onClick={() => {
                  choice.action()
                  onClose()
                }}
              >
                {choice.text}
              </button>
            ))}
          </div>
        )}
        
        {(!dialogue.choices || dialogue.choices.length === 0) && (
          <div className="dialogue-actions">
            <button className="continue-button" onClick={onClose}>
              继续
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DialogueModal
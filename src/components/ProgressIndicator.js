import React from 'react';
import { Oval } from 'react-loader-spinner';

// A more sophisticated loading indicator that shows real progress
const ProgressIndicator = ({ status, progress }) => {
  // Calculate the progress percentage, defaulting to indeterminate (-1) if not provided
  const progressPercentage = progress >= 0 ? progress : -1;
  
  // Different loading messages based on progress
  let stage = 'thinking';
  if (progress > 70) {
    stage = 'finalizing';
  } else if (progress > 40) {
    stage = 'animating';
  } else if (progress > 20) {
    stage = 'speaking';
  }
  
  // Custom animation for Benjamin Franklin
  const animation = {
    thinking: {
      color: '#2a623d',
      icon: '💭',
      message: status || 'Franklin is pondering your inquiry...'
    },
    speaking: {
      color: '#2f6da1',
      icon: '🔊',
      message: status || 'Franklin is formulating his response...'
    },
    animating: {
      color: '#9c6b1f',
      icon: '🎭',
      message: status || 'Franklin is preparing to address you...'
    },
    finalizing: {
      color: '#634288',
      icon: '✨',
      message: status || 'Franklin is about to appear...'
    }
  };
  
  const currentStage = animation[stage];
  
  return (
    <div className="loading-container">
      <div className="progress-indicator">
        <div className="icon-container">
          <span className="animated-icon">{currentStage.icon}</span>
        </div>
        <Oval
          height={60}
          width={60}
          color={currentStage.color}
          visible={true}
          ariaLabel="loading-indicator"
          secondaryColor="#f5f1e6"
          strokeWidth={4}
          strokeWidthSecondary={4}
        />
        
        {progressPercentage >= 0 && (
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${progressPercentage}%`,
                backgroundColor: currentStage.color
              }}
            />
          </div>
        )}
      </div>
      
      <p className="status-message">{currentStage.message}</p>
    </div>
  );
};

export default ProgressIndicator;
import React from 'react';

const ErrorDisplay = ({ error, retry }) => {
  if (!error) return null;
  
  return (
    <div className="error-message">
      <p>{error}</p>
      {retry && (
        <button 
          onClick={retry}
          className="retry-button"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;

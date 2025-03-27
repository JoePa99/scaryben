import React, { useState, useCallback, useEffect } from 'react';
import { submitQuestion } from '../services/apiService';
import ProgressIndicator from './ProgressIndicator';
import ErrorDisplay from './ErrorDisplay';
import { initializeSocket } from '../utils/socketService';

const QuestionForm = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [progress, setProgress] = useState(-1);
  const [answer, setAnswer] = useState('');

  // Initialize socket connection
  useEffect(() => {
    initializeSocket();
  }, []);

  const handleStatusUpdate = useCallback((newStatus) => {
    setStatus(newStatus);
  }, []);

  const handleProgressUpdate = useCallback((newProgress) => {
    setProgress(newProgress);
  }, []);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!question.trim()) return;

    console.log('Submitting question:', question);
    try {
      setLoading(true);
      setError('');
      setVideoUrl('');
      setAnswer('');
      setProgress(0);

      console.log('Starting question submission process...');
      const response = await submitQuestion(
        question, 
        handleStatusUpdate,
        handleProgressUpdate
      );
      
      console.log('Received response:', response);
      setVideoUrl(response.videoUrl);
      setAnswer(response.answer);
      console.log('Video URL set to:', response.videoUrl);
    } catch (err) {
      console.error('Error during question submission:', err);
      setError(
        err.message || 
        'An error occurred while processing your question. Please try again.'
      );
    } finally {
      setLoading(false);
      setProgress(-1);
      setStatus('');
      console.log('Question submission process completed');
    }
  };

  const handleRetry = () => {
    handleSubmit();
  };

  return (
    <div>
      <form className="question-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <textarea
            rows="3"
            placeholder="Ask Benjamin Franklin about the national debt..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading || !question.trim()}>
          Ask Franklin
        </button>
      </form>

      {loading && (
        <ProgressIndicator status={status} progress={progress} />
      )}

      {error && <ErrorDisplay error={error} retry={handleRetry} />}

      {videoUrl && (
        <div className="response-container">
          <div className="video-container">
            <video 
              width="100%" 
              controls 
              autoPlay 
              src={videoUrl}
              onError={(e) => console.error("Video error:", e.target.error, "Video URL:", videoUrl)}
            />
            {/* Debug info to see the URL */}
            <div className="debug-info" style={{fontSize: '10px', color: '#999', marginTop: '5px'}}>
              Video URL: {videoUrl}
            </div>
          </div>
          
          <div className="answer-text">
            <h3>Benjamin Franklin's Response</h3>
            <blockquote>
              {answer}
            </blockquote>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionForm;
import { useState, useEffect } from 'react';
import Head from 'next/head';

// Force clean deployment to pick up new environment variables
export default function Debug() {
  const [debug, setDebug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/debug');
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setDebug(data);
      } catch (err) {
        console.error('Error fetching debug info:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDebugInfo();
  }, []);

  const renderApiSection = (name, testResult) => {
    if (!testResult) return null;
    
    const isSuccess = testResult.success;
    
    return (
      <div className={`api-section ${isSuccess ? 'success' : 'failure'}`}>
        <h3>{name} API</h3>
        {isSuccess ? (
          <div className="success-badge">Connected Successfully</div>
        ) : (
          <div className="error-badge">Connection Failed</div>
        )}
        
        <div className="details">
          {isSuccess ? (
            <pre>{JSON.stringify(testResult, null, 2)}</pre>
          ) : (
            <>
              <div className="error-message">{testResult.error}</div>
              <h4>Details:</h4>
              <pre>{JSON.stringify(testResult.details, null, 2)}</pre>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <Head>
        <title>Franklin Debugger</title>
        <meta name="description" content="Debug API connections for Franklin" />
      </Head>

      <header>
        <h1>Franklin API Diagnostics</h1>
        <p>Check the status of all API connections needed for the application.</p>
        <a href="/" className="back-link">↩ Back to Main App</a>
      </header>

      <main>
        {loading ? (
          <div className="loading">Loading diagnostic information...</div>
        ) : error ? (
          <div className="error-container">
            <h2>Error Loading Diagnostics</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        ) : (
          <div className="debug-results">
            <div className="timestamp">
              <p>Diagnostic run at: {debug?.timestamp}</p>
            </div>
            
            <h2>Environment Variables</h2>
            <div className="env-variables">
              <pre>{JSON.stringify(debug?.results?.environment, null, 2)}</pre>
            </div>
            
            <h2>API Connection Tests</h2>
            {renderApiSection('OpenAI', debug?.results?.tests?.openai)}
            {renderApiSection('ElevenLabs', debug?.results?.tests?.elevenlabs)}
            {renderApiSection('D-ID', debug?.results?.tests?.did)}
            {renderApiSection('Cloudinary', debug?.results?.tests?.cloudinary)}
          </div>
        )}
      </main>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, 
            Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
        }
        
        header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eaeaea;
        }
        
        h1 {
          margin-bottom: 0.5rem;
        }
        
        .back-link {
          display: inline-block;
          margin-top: 1rem;
          color: #0070f3;
          text-decoration: none;
        }
        
        .loading {
          text-align: center;
          padding: 2rem;
          font-style: italic;
        }
        
        .error-container {
          background: #fff5f5;
          border: 1px solid #feb2b2;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .error-container h2 {
          color: #e53e3e;
          margin-top: 0;
        }
        
        .error-container button {
          background: #0070f3;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .debug-results {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
        }
        
        .timestamp {
          font-style: italic;
          color: #666;
          margin-bottom: 1.5rem;
        }
        
        .env-variables {
          background: #f1f1f1;
          border-radius: 4px;
          padding: 1rem;
          margin-bottom: 2rem;
          overflow-x: auto;
        }
        
        .api-section {
          margin-bottom: 2rem;
          border-radius: 8px;
          padding: 1rem;
        }
        
        .success {
          background: #f0fff4;
          border: 1px solid #c6f6d5;
        }
        
        .failure {
          background: #fff5f5;
          border: 1px solid #feb2b2;
        }
        
        .success-badge, .error-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        
        .success-badge {
          background: #c6f6d5;
          color: #22543d;
        }
        
        .error-badge {
          background: #feb2b2;
          color: #742a2a;
        }
        
        .details {
          background: white;
          border-radius: 4px;
          padding: 1rem;
          overflow-x: auto;
        }
        
        .error-message {
          color: #e53e3e;
          margin-bottom: 1rem;
          font-weight: 600;
        }
        
        pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
      `}</style>
    </div>
  );
}
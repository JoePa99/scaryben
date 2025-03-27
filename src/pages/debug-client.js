import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Tell Next.js this is a client-only component
export const getStaticProps = async () => {
  return {
    props: {}
  };
};

export default function DebugClient() {
  const [status, setStatus] = useState('Initializing...');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [browserInfo, setBrowserInfo] = useState({});

  const testDirectApi = async () => {
    try {
      setStatus('Testing direct API connection...');
      const response = await axios.get('/api/question-direct');
      setResult(response.data);
      setStatus('API test completed successfully');
    } catch (error) {
      setError(error.response?.data || error.message);
      setStatus('API test failed');
    }
  };

  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      // Capture browser info safely
      setBrowserInfo({
        userAgent: window.navigator?.userAgent || 'Unknown',
        url: window.location?.href || 'Unknown',
        time: new Date().toISOString()
      });
      
      testDirectApi();
    }
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Franklin API Debug Client</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Status: {status}</h2>
        <button onClick={testDirectApi}>
          Test API Connection Again
        </button>
      </div>
      
      {error && (
        <div style={{ 
          backgroundColor: '#ffeeee', 
          padding: '10px', 
          border: '1px solid #ffaaaa',
          marginBottom: '20px'
        }}>
          <h3>Error:</h3>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
      
      {result && (
        <div style={{ 
          backgroundColor: '#eeffee', 
          padding: '10px', 
          border: '1px solid #aaffaa'
        }}>
          <h3>Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      
      <div style={{ marginTop: '40px' }}>
        <h2>Environment Information</h2>
        <ul>
          <li>
            <strong>Browser:</strong> {browserInfo.userAgent}
          </li>
          <li>
            <strong>Page URL:</strong> {browserInfo.url}
          </li>
          <li>
            <strong>Time:</strong> {browserInfo.time || new Date().toISOString()}
          </li>
        </ul>
      </div>
    </div>
  );
}
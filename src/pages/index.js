import Head from 'next/head';
import QuestionForm from '../components/QuestionForm';

// Updated version to force rebuild and pick up env vars
export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Franklin Debt Advisor</title>
        <meta name="description" content="Ask Benjamin Franklin about the U.S. national debt" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="header">
        <h1>Ask Benjamin Franklin About The National Debt</h1>
        <p>Type your question below and hear directly from the founding father himself</p>
      </header>

      <main>
        <QuestionForm />
        
        <div className="debug-panel">
          <h3>Troubleshooting</h3>
          <a href="/api/debug" target="_blank" rel="noopener noreferrer" className="debug-link">
            Access API Diagnostics
          </a>
        </div>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Franklin Debt Advisor</p>
      </footer>

      <style jsx>{`
        .debug-panel {
          margin-top: 2rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #dee2e6;
        }
        
        .debug-link {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: #0070f3;
          color: white;
          border-radius: 4px;
          text-decoration: none;
          margin-top: 0.5rem;
        }
        
        .debug-link:hover {
          background: #0051a8;
        }
      `}</style>
    </div>
  );
}

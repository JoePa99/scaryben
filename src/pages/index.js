import Head from 'next/head';
import QuestionForm from '../components/QuestionForm';

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
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Franklin Debt Advisor</p>
      </footer>
    </div>
  );
}

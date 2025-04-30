// /app/page.tsx (main UI for MiniMind)
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ kid: string; parent: string; fun: string } | null>(null);

  const handleExplain = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);

    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center px-4 py-10">
      <h1 className="text-4xl font-bold mb-6 text-center">MiniMind 🧠</h1>
      <p className="mb-4 text-center text-lg">Explain anything like I&apos;m 5</p>

      <div className="w-full max-w-md">
        <input
          type="text"
          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 text-white"
          placeholder="Ask anything... (e.g., What is a black hole?)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleExplain(); }}
        />
        <button
          onClick={handleExplain}
          className="mt-4 w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
        >
          {loading ? 'Thinking...' : 'Explain it'}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            className="mt-8 w-full max-w-xl space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="p-4 kid-font rounded-lg bg-indigo-100 dark:bg-indigo-800">
                <h2>🧒 For Kids:</h2>
                <p>{result.kid}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="p-4 font-sans rounded-lg bg-green-100 dark:bg-green-800">
                <h2 className="">👨‍👩 For Parents:</h2>
                <p>{result.parent}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <div className="p-4 font-mono rounded-lg bg-yellow-100 dark:bg-yellow-700">
                <h2 className="">💡 Fun Thought:</h2>
                <p>{result.fun}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

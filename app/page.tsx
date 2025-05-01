// /app/page.tsx (main UI for MiniMind)
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function HomePage() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ kid: string; parent: string; fun: string } | null>(null);
  const [thinkingMsg, setThinkingMsg] = useState("Thinking");


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
    setThinkingMsg(getRandomMessage());
    setLoading(false);
  };

  const thinkingMessages = [
    "Consulting the goldfish",
    "Calling Grandma",
    "Googling like a genius",
    "Reading the dictionary",
    "Pacing in circles",
    "Asking a librarian",
    "Staring into space",
    "Whispering to the wind",
    "Rummaging through the attic",
    "Tapping on the chalkboard",
    "Building a brainstorm",
    "Checking under the bed",
    "Listening to old podcasts",
    "Drawing diagrams in the air",
    "Hopping between ideas",
    "Double-checking everything",
    "Taking a thinking walk",
    "Rewinding the brain",
    "Breaking out the big books",
    "Connecting the imaginary dots",
  ];
  
  
  const getRandomMessage = () =>
    thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="header mb-4 flex flex-wrap align-center items-center justify-center">
      <img className="logo" src="../mmlogo.png" alt="" />
      <h1 className="other-font text-4xl font-bold ml-1 text-center"> MiniMind</h1>
      </div>
      
      <p className="mb-4 other-font text-center text-lg">Big questions, little answers.</p>

      <div className="w-full max-w-md">
        <input
          type="text"
          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 text-white other-font focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          placeholder="Ask anything... (e.g., What is a black hole?)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleExplain(); }}
        />
        {loading ? (
          <div className="flex justify-center other-font items-center gap-1 mt-4 font-sans text-white text-lg">
            <span className="text-base sm:text-lg">{thinkingMsg}</span>
            <span className="text-4xl gap-2 animate-bounce delay-[0ms]">.</span>
            <span className="text-4xl gap-2 animate-bounce delay-[150ms]">.</span>
            <span className="text-4xl gap-2 animate-bounce delay-[300ms]">.</span>
          </div>
        ) : (
          <button
            onClick={handleExplain}
            className="mt-4 w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-800 text-white other-font hover:cursor-pointer text-lg transition duration-300"
          >
            Explain it
          </button>
        )}
        
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
              <div className="p-4 other-font rounded-lg bg-green-100 dark:bg-green-800">
                <h2 className="">👨‍👩 For Parents:</h2>
                <p>{result.parent}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <div className="p-4 other-font rounded-lg bg-yellow-100 dark:bg-yellow-700">
                <h2 className="">💡 Fun Thought:</h2>
                <p>{result.fun}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="jon">Built with <Heart size={20} className="mx-1 translate-y-0.5" /> by <a className="underline mx-1" href="https://x.com/JontheNerd_" target='_blank'> Jon</a></p>
    </main>
  );
}

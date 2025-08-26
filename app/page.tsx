// /app/page.tsx (main UI for MiniMind)
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';

export default function HomePage() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ kid: string; parent: string; fun: string } | null>(null);
  const [thinkingMsg, setThinkingMsg] = useState("Thinking");
  const [user, setUser] = useState<User | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);


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
    <main className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img className="h-8 w-auto" src="/mmlogo.png" alt="MiniMind" />
            <h1 className="text-xl font-bold">MiniMind</h1>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/pricing" className="text-gray-300 hover:text-white transition">
              Pricing
            </Link>
            {user ? (
              <Link
                href="/app"
                className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition"
              >
                Go to App
              </Link>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/auth/login"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="header mb-8 flex flex-wrap align-center items-center justify-center">
          <img className="logo h-16 w-auto" src="/mmlogo.png" alt="" />
          <h1 className="other-font text-5xl font-bold ml-2 text-center">MiniMind</h1>
        </div>

        <p className="mb-8 other-font text-center text-xl text-gray-300">Big questions, little answers.</p>

        {!user && (
          <div className="mb-8 text-center">
            <p className="text-gray-400 mb-4">Try it out below, or sign up for unlimited access!</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/auth/signup"
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-medium transition"
              >
                <span>Start Free</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition"
              >
                View Plans
              </Link>
            </div>
          </div>
        )}

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
            className="mt-4 w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-800 text-white other-font hover:cursor-pointer text-lg transition duration-300 flex items-center justify-center"
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
              <div className="p-4 kid-font rounded-lg bg-indigo-800">
                <h2>🧒 For Kids:</h2>
                <p>{result.kid}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="p-4 other-font rounded-lg bg-green-800">
                <h2 className="">👨‍👩 For Parents:</h2>
                <p>{result.parent}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <div className="p-4 other-font rounded-lg bg-yellow-700">
                <h2 className="">💡 Fun Thought:</h2>
                <p>{result.fun}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-16 text-center text-gray-400">
        <p>Built with <Heart size={16} className="inline mx-1" /> by <a className="underline" href="https://x.com/JontheNerd_" target='_blank'>Jon</a></p>
      </footer>
      </div>
    </main>
  );
}

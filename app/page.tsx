// /app/page.tsx (main UI for MiniMind)
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';

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
  }, [supabase.auth]);


  const handleExplain = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle rate limit or other errors
        if (res.status === 429) {
          setResult({
            kid: "Oops! You've tried a few questions already.",
            parent: data.error || "Rate limit reached. Sign up for unlimited access!",
            fun: "Sign up to ask unlimited questions and unlock bedtime stories, learning mode, and more! 🌟"
          });
        } else {
          setResult({
            kid: "Something went wrong, but don't worry!",
            parent: "There was a technical issue. Please try again in a moment.",
            fun: "While you wait, why not sign up to unlock all our amazing features? 🚀"
          });
        }
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error('Error:', error);
      setResult({
        kid: "Hmm, something's not working right now.",
        parent: "There was a connection issue. Please check your internet and try again.",
        fun: "Technology can be tricky sometimes! Sign up to get the best experience. 💫"
      });
    }

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
        <div className="max-w-4xl px-2 sm:px-6 mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <Image className="h-6 sm:h-8 w-auto flex-shrink-0" src="/mmlogo.png" alt="MiniMind" width={32} height={32} />
            <h1 className="text-lg sm:text-xl font-bold truncate">MiniMind</h1>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-4 flex-shrink-0">
            <Link href="/pricing" className="hidden sm:block text-gray-300 hover:text-white transition">
              Pricing
            </Link>
            {user ? (
              <Link
                href="/app"
                className="bg-indigo-600 hover:bg-indigo-700 px-3 sm:px-4 py-2 rounded-lg font-medium transition text-sm sm:text-base"
              >
                Go to App
              </Link>
            ) : (
              <div className="flex space-x-1 sm:space-x-2">
                <Link
                  href="/auth/login"
                  className="text-gray-300 hover:text-white px-2 sm:px-3 py-2 rounded-lg transition text-sm sm:text-base"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-indigo-600 hover:bg-indigo-700 px-3 sm:px-4 py-2 rounded-lg font-medium transition text-sm sm:text-base"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-flex-start px-4 py-5 sm:py-5">

        {/* Signup buttons section - in a box */}
        {!user && (
          <div className="w-full max-w-lg mb-6 sm:mb-8">
            <div className="home-plus flex justify-between gap-4 bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-6 shadow-lg text-center">
              <p className="text-gray-400  text-sm sm:text-base">Want unlimited access and more features?</p>
              <div className="">
                {/*<Link
                  href="/auth/signup"
                  className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base"
                >
                  <span>Start Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link> */}
                <Link
                  href="/pricing"
                  className="bg-indigo-600 hover:bg-indigo-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base"
                >
                  Get Plus
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Logo and branding - no box */}
        

        {/* Try section - no box */}
        {!user && (
          <div className="w-full max-w-lg mb-6 sm:mb-8">
            <div className="text-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">🚀 Try MiniMind Free</h2>
              <p className="text-gray-400 text-sm sm:text-base px-2">Ask any question and get kid-friendly explanations instantly!</p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white other-font focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Ask anything... (e.g., What is a black hole?)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleExplain(); }}
              />
              {loading ? (
                <div className="flex justify-center other-font items-center gap-1 py-3 font-sans text-white">
                  <span className="text-sm">{thinkingMsg}</span>
                  <span className="text-xl sm:text-2xl gap-2 animate-bounce delay-[0ms]">.</span>
                  <span className="text-xl sm:text-2xl gap-2 animate-bounce delay-[150ms]">.</span>
                  <span className="text-xl sm:text-2xl gap-2 animate-bounce delay-[300ms]">.</span>
                </div>
              ) : (
                <button
                  onClick={handleExplain}
                  className="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white other-font hover:cursor-pointer font-medium transition duration-300 flex items-center justify-center text-sm sm:text-base"
                >
                  Explain it ✨
                </button>
              )}
            </div>
          </div>
        )}


        {/* For authenticated users, show the input below */}
        {user && (
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
        )}

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

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="text-center"
            >
              <div className="p-6 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 border border-indigo-500">
                <h3 className="text-lg font-bold mb-2">🌟 Want More?</h3>
                <p className="text-sm mb-4 text-gray-200">
                  Get unlimited questions, bedtime stories, personalized learning, and more!
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <a
                    href="/auth/signup"
                    className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition"
                  >
                    Sign Up Free
                  </a>
                  <a
                    href="/pricing"
                    className="px-4 py-2 bg-indigo-700 text-white rounded-lg font-medium hover:bg-indigo-800 transition border border-indigo-500"
                  >
                    View Plans
                  </a>
                </div>
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

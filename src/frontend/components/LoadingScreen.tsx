"use client";

import { motion } from "framer-motion";
import { Flower } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Preparing Your Bouquet" }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
      {/* 背景の装飾 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px] animate-pulse" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mb-6 p-6 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-rose-100 dark:border-rose-900/20 text-rose-500"
        >
          <Flower className="w-12 h-12" />
        </motion.div>
        
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xl font-serif font-bold tracking-widest text-zinc-800 dark:text-zinc-200 uppercase text-center px-4">
            {message}
          </span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-rose-400"
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flower } from "lucide-react";

interface BouquetButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
}

let particleIdCounter = 0;

export function BouquetButton({ onClick, disabled = false }: BouquetButtonProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const lastParticleTimeRef = useRef<number>(0);

  const handleClick = useCallback(() => {
    if (disabled) return;
    
    // カウントアップ(データ通信用バッファ)は確実に毎クリック実行
    onClick();

    const now = Date.now();
    // 超高速連打（連打ツール等）で画面が固まるのを防ぐため、
    // 視覚エフェクト（パーティクルDOMの追加）は 50ms 間隔に間引く
    if (now - lastParticleTimeRef.current < 50) {
      return;
    }
    lastParticleTimeRef.current = now;
    
    // パーティクルの生成 (クリックごとに複数の花びら)
    const newParticles = Array.from({ length: 3 }).map(() => ({
      id: particleIdCounter++,
      x: (Math.random() - 0.5) * 100, // -50px to +50px
      y: (Math.random() - 0.5) * -100 - 50, // 上方向に飛ぶ
    }));

    setParticles((prev) => {
      // 画面上のDOMが多すぎると重くなるため、最大45個（15回分）に制限する
      const next = [...prev, ...newParticles];
      return next.length > 45 ? next.slice(next.length - 45) : next;
    });

    // 一定時間後にパーティクルを消す
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 1000);
  }, [onClick, disabled]);

  return (
    <div className="relative inline-block">
      {/* ブーケ投下ボタン */}
      <motion.button
        onClick={handleClick}
        disabled={disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          group relative flex items-center justify-center gap-2 rounded-full px-6 py-3 font-bold text-white shadow-lg transition-all
          ${disabled 
            ? "bg-zinc-500 cursor-not-allowed opacity-50" 
            : "bg-gradient-to-r from-rose-600 to-rose-500 hover:shadow-[0_0_20px_rgba(225,29,72,0.6)]"
          }
        `}
      >
        <Flower className="h-5 w-5 transition-transform group-active:rotate-12" />
        <span>ブーケを贈る</span>
        
        {/* クリック時の波紋エフェクト */}
        {!disabled && (
          <div className="absolute inset-0 rounded-full ring-2 ring-rose-400 opacity-0 group-active:animate-ping" />
        )}
      </motion.button>

      {/* パーティクルエフェクト描画領域 */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, x: 0, y: 0, scale: 0.5, rotate: 0 }}
              animate={{ 
                opacity: 0, 
                x: p.x, 
                y: p.y, 
                scale: Math.random() * 0.5 + 1,
                rotate: Math.random() * 180 - 90 
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute text-rose-500"
            >
              <Flower className="h-6 w-6" fill="currentColor" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

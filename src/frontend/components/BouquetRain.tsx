"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flower } from "lucide-react";

interface Bouquet {
  id: number;
  x: number;
  delay: number;
  rotation: number;
  size: number;
}

interface BouquetRainProps {
  triggerCount: number; // この値が増えるたびに花を降らせる
  initialCount?: number; // 最初から底に溜まっている数
}

export function BouquetRain({ triggerCount, initialCount = 0 }: BouquetRainProps) {
  const [fallingBouquets, setFallingBouquets] = useState<Bouquet[]>([]);
  const [settledBouquets, setSettledBouquets] = useState<Bouquet[]>([]);

  // 現在の山の高さ (vh) を計算 (500個で50vh)
  const currentPileHeight = Math.min(((initialCount + triggerCount) / 500) * 50, 50);

  // 初期表示時に底に花を配置
  useEffect(() => {
    const count = Math.min(initialCount, 40);
    const initial: Bouquet[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: 0,
      rotation: Math.random() * 360,
      size: 15 + Math.random() * 15,
      // 山の高さの範囲内（下3/4）に配置
      settledBottom: Math.random() * currentPileHeight * 0.75,
    }));
    setSettledBouquets(initial);
  }, [initialCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const spawnBouquet = useCallback((count: number = 1) => {
    const newItems: (Bouquet & { settledBottom: number })[] = [];
    for (let i = 0; i < count; i++) {
      newItems.push({
        id: Date.now() + Math.random() + i,
        x: Math.random() * 100,
        delay: Math.random() * (count > 10 ? 3 : 0.5),
        rotation: Math.random() * 360,
        size: 15 + Math.random() * 25,
        // 着地点を山の高さの下3/4までに制限
        settledBottom: Math.random() * currentPileHeight * 0.75,
      });
    }

    setFallingBouquets((prev) => [...prev, ...newItems]);

    // 落下完了処理
    newItems.forEach((item) => {
      setTimeout(() => {
        setFallingBouquets((prev) => prev.filter((b) => b.id !== item.id));
        setSettledBouquets((prev) => {
          const next = [...prev, item as any];
          return next.slice(-40);
        });
      }, 2500 + (item.delay * 1000));
    });
  }, [currentPileHeight]);

  // triggerCount が増えるたびに花を降らせる
  useEffect(() => {
    if (triggerCount > 0) {
      spawnBouquet(1);
    }
  }, [triggerCount, spawnBouquet]);

  // 初回ロード時のお祝い
  useEffect(() => {
    if (initialCount === 0) return;
    const rainCount = Math.min(Math.max(Math.floor(initialCount / 30), 5), 30);
    const timer = setTimeout(() => spawnBouquet(rainCount), 500);
    return () => clearTimeout(timer);
  }, [spawnBouquet, initialCount]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* 降っている花 */}
      <AnimatePresence>
        {fallingBouquets.map((b: any) => (
          <motion.div
            key={b.id}
            initial={{ y: -50, opacity: 0, rotate: 0 }}
            animate={{ 
              // 画面上部から「100vh - 山の高さ」まで落とす
              y: `${100 - b.settledBottom}vh`, 
              opacity: [0, 1, 1, 0.7], 
              rotate: b.rotation + 360 
            }}
            transition={{ duration: 2.2, ease: "easeIn", delay: b.delay }}
            className="absolute text-rose-400"
            style={{ 
              left: `${b.x}%`,
              width: b.size, 
              height: b.size 
            }}
          >
            <Flower size={b.size} fill="currentColor" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 下に溜まっている花 */}
      <div className="absolute bottom-0 left-0 right-0 w-full h-full">
        {settledBouquets.map((b: any) => (
          <div
            key={b.id}
            className="absolute text-rose-300/30"
            style={{ 
              left: `${b.x}%`, 
              transform: `rotate(${b.rotation}deg)`,
              bottom: `${b.settledBottom}vh`, // 山の高さに合わせて配置
              width: b.size * 0.7,
              height: b.size * 0.7
            }}
          >
            <Flower size={b.size * 0.7} fill="currentColor" />
          </div>
        ))}
      </div>

      {/* 背景の溜まり演出（実際の獲得数に基づいて伸びる） */}
      <motion.div 
        initial={{ height: 0 }}
        animate={{ height: `${currentPileHeight}vh` }}
        transition={{ duration: 2.5, ease: "easeOut" }}
        className="absolute bottom-0 left-0 right-0"
        style={{ 
          // ライトモードでは少し濃いめのピンク、ダークモードでは明るめのピンクでグラデーションを構成
          background: `linear-gradient(to top, 
            var(--pile-color-solid) 0%, 
            var(--pile-color-solid) 50%, 
            var(--pile-color-fade) 80%, 
            transparent 100%
          )`,
        }}
      />
      
      {/* モード別の色定義（CSS変数） */}
      <style jsx>{`
        div {
          --pile-color-solid: rgba(251, 113, 133, 0.4);
          --pile-color-fade: rgba(251, 113, 133, 0.15);
        }
        :global(.dark) div {
          --pile-color-solid: rgba(254, 226, 226, 0.5);
          --pile-color-fade: rgba(254, 226, 226, 0.2);
        }
      `}</style>
    </div>
  );
}

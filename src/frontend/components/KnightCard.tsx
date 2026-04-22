import { useState } from "react";
import { BouquetButton } from "./BouquetButton";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

interface KnightCardProps {
  knightName: string;
  avatarUrl?: string;
  mySentCount: number;
  onThrowBouquet: (amount: number) => void;
  isOwner?: boolean;
  isLocked?: boolean;
}

export function KnightCard({ 
  knightName, 
  avatarUrl,
  mySentCount, 
  onThrowBouquet, 
  isOwner = false,
  isLocked = false,
}: KnightCardProps) {
  
  const [customAmount, setCustomAmount] = useState<number>(50);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/80 p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-sm transition-all"
    >
      {/* 背景の装飾的なグラデーション */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-600/5 blur-[80px] pointer-events-none" />

      <div className="flex flex-col items-center gap-6 relative z-10">
        <h3 className="text-3xl font-serif font-bold tracking-widest text-zinc-800 dark:text-zinc-100 text-center">
          {knightName}
        </h3>

        {/* キャラクター画像 (存在する場合) */}
        {avatarUrl && (
          <div className={`w-full grid gap-4 ${
            (avatarUrl.split(",").filter(u => u.trim()).length || 0) > 1 
              ? "grid-cols-2 max-w-lg" 
              : "grid-cols-1 max-w-[240px]"
          }`}>
            {avatarUrl.split(",").filter(u => u.trim()).map((url, i) => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={url} 
                  alt={`${knightName} ${i + 1}`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        )}
        
        {/* 自分が贈ったブーケの数 */}
        <div className="flex flex-col items-center">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
            あなたが贈ったブーケ
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-6xl font-bold text-rose-500 tracking-tighter">
              {mySentCount.toLocaleString()}
            </span>
            <span className="text-lg text-rose-500/70 font-semibold">本</span>
          </div>
        </div>

        <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800 my-2" />

        {/* コントロールパネル (投下ボタン群) */}
        <div className="flex flex-col items-center gap-4 w-full">
          
          {/* メインアクション：+1 連打ボタン (常に表示) */}
          <div className="flex justify-center w-full">
            <BouquetButton onClick={() => onThrowBouquet(1)} disabled={isLocked} />
          </div>

          {/* まとめて贈るトグルボタン */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 mt-2 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            まとめて贈る / 取り消し
          </button>

          {/* アドバンスドオプション（トグル展開時のみ表示） */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden flex flex-col items-center gap-5 w-full pt-2"
              >
                <div className="flex flex-wrap justify-center items-center gap-3">
                  <button 
                    onClick={() => onThrowBouquet(-10)} 
                    disabled={isLocked}
                    className="w-12 h-12 rounded-full flex justify-center items-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-95 shadow-sm disabled:opacity-50"
                  >
                    -10
                  </button>
                  <button 
                    onClick={() => onThrowBouquet(-1)} 
                    disabled={isLocked}
                    className="w-12 h-12 rounded-full flex justify-center items-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors active:scale-95 shadow-sm disabled:opacity-50"
                  >
                    -1
                  </button>
                  
                  <div className="w-px h-8 bg-zinc-300 dark:bg-zinc-700 mx-2" />
                  
                  <button 
                    onClick={() => onThrowBouquet(10)} 
                    disabled={isLocked}
                    className="w-12 h-12 rounded-full flex justify-center items-center bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 font-bold hover:bg-rose-200 dark:hover:bg-rose-800/60 transition-colors active:scale-95 shadow-sm border border-rose-200 dark:border-rose-800/50 disabled:opacity-50"
                  >
                    +10
                  </button>
                  <button 
                    onClick={() => onThrowBouquet(100)} 
                    disabled={isLocked}
                    className="w-12 h-12 rounded-full flex justify-center items-center bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 font-bold hover:bg-rose-200 dark:hover:bg-rose-800/60 transition-colors active:scale-95 shadow-sm border border-rose-200 dark:border-rose-800/50 disabled:opacity-50"
                  >
                    +100
                  </button>
                </div>

                {/* 好きな数アクション */}
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950/50 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800/80">
                  <button 
                    onClick={() => onThrowBouquet(-customAmount)} 
                    disabled={customAmount <= 0}
                    className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    -{customAmount || 0}
                  </button>
                  
                  <div className="flex items-center gap-1">
                    <input 
                      type="number" 
                      min="1"
                      max="1000000"
                      value={customAmount} 
                      onChange={(e) => setCustomAmount(Math.min(1000000, Math.max(1, Number(e.target.value))))} 
                      className="w-20 bg-transparent text-center text-xl font-bold text-zinc-900 dark:text-zinc-100 outline-none border-b-2 border-rose-500/50 focus:border-rose-500 transition-colors"
                    />
                    <span className="text-zinc-500 font-medium">本</span>
                  </div>

                  <button 
                    onClick={() => onThrowBouquet(customAmount)} 
                    disabled={customAmount <= 0 || isLocked}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold hover:from-rose-500 hover:to-rose-400 shadow-md shadow-rose-500/20 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +{customAmount || 0}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Character {
  id: string;
  name: string;
  avatarUrl: string | null;
  totalBouquets: number;
}

export default function OverlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params?.id as string;
  const token = searchParams.get("token");

  const [characters, setCharacters] = useState<Character[]>([]);
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedId, setLastUpdatedId] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !token) {
      setError("Room ID and Token are required");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/overlay?token=${token}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load overlay data");
        }
        const data = await res.json();
        setCharacters(data.characters);
        setRoomName(data.room.name);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // SSE connection
    const eventSource = new EventSource(`/api/rooms/${roomId}/events`);
    
    eventSource.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        if (type === 'CHARACTER_UPDATE') {
          setCharacters(prev => prev.map(c => 
            c.id === data.id 
              ? { ...c, totalBouquets: data.total_bouquets_received } 
              : c
          ));
          setLastUpdatedId(data.id);
          setTimeout(() => setLastUpdatedId(null), 1000);
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [roomId, token]);

  if (isLoading) return null;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black/50 text-white font-bold p-4 text-center">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="overlay-wrapper min-h-screen w-full bg-transparent p-4">
      <div className="overlay-container flex flex-col gap-4">
        <AnimatePresence>
          {characters.map((char) => (
            <motion.div 
              key={char.id} 
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`char-item char-${char.id} flex items-center gap-4 bg-zinc-900/40 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-xl`}
            >
              <div className="char-image-container flex gap-2 shrink-0">
                {char.avatarUrl ? (
                  char.avatarUrl.split(",").filter(u => u.trim()).slice(0, 2).map((url, i) => (
                    <div key={i} className="char-image-box w-16 h-12 rounded-lg overflow-hidden border border-white/20 bg-zinc-800 shadow-inner">
                      <img src={url} alt="" className="char-image w-full h-full object-cover" />
                    </div>
                  ))
                ) : (
                  <div className="char-image-box w-16 h-12 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center shadow-inner">
                     <div className="w-6 h-6 rounded-full bg-rose-500/20" />
                  </div>
                )}
              </div>
              <div className="char-info flex flex-col min-w-0">
                <div className="char-name text-white font-bold text-lg truncate drop-shadow-md">
                  {char.name}
                </div>
                <div className="char-count-wrapper flex items-baseline gap-1">
                  <motion.span 
                    key={char.totalBouquets}
                    animate={lastUpdatedId === char.id ? { scale: [1, 1.2, 1], color: ["#fb7185", "#f43f5e", "#fb7185"] } : {}}
                    transition={{ duration: 0.3 }}
                    className="char-count text-rose-400 font-black text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                  >
                    {char.totalBouquets.toLocaleString()}
                  </motion.span>
                  <span className="char-unit text-rose-400/80 text-xs font-bold">本</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

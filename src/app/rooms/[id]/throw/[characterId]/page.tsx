"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CharacterCard } from "@/frontend/components/CharacterCard";
import { useBouquetSender } from "@/frontend/hooks/useBouquetSender";
import { useUser } from "@/frontend/contexts/AuthContext";
import { LoadingScreen } from "@/frontend/components/LoadingScreen";

export default function ThrowBouquetPage() {
  const params = useParams();
  const router = useRouter();
  
  const roomId = params?.id as string;
  const characterId = params?.characterId as string;

  const [character, setCharacter] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUser();
  const currentUserId = user?.id ?? "";

  // APIからキャラクター情報(と自分が送った数)を取得
  useEffect(() => {
    if (!currentUserId) return;
    const fetchCharacter = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}?userId=${currentUserId}`);
        if (!res.ok) throw new Error("データの取得に失敗しました");
        const data = await res.json();
        
        const targetChar = data.characters.find((c: any) => c.id === characterId);
        if (!targetChar) throw new Error("指定されたキャラが見つかりません");

        if (data.stellaBattleActive) {
          router.push(`/rooms/${roomId}`);
          return;
        }

        setCharacter(targetChar);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "エラー");
      }
    };
    fetchCharacter();
  }, [roomId, characterId, currentUserId]);

  // ステラバトル開始の監視
  useEffect(() => {
    const eventSource = new EventSource(`/api/rooms/${roomId}/events`);
    eventSource.onmessage = (event) => {
      try {
        const { type } = JSON.parse(event.data);
        if (type === 'STELLA_BATTLE_START') {
          router.push(`/rooms/${roomId}`);
        }
      } catch (err) {
        console.error(err);
      }
    };
    return () => eventSource.close();
  }, [roomId, router]);

  const { localCount, handleThrow, isLocked } = useBouquetSender(
    roomId,
    characterId,
    currentUserId,
    character?.mySentCount || 0
  );

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  }

  if (!character) {
    return <LoadingScreen message="Preparing the Character" />;
  }

  const isOwner = character.ownerId === currentUserId;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* 戻るボタン */}
      <div className="w-full max-w-lg mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>一覧へ戻る</span>
        </button>
      </div>

      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold text-zinc-500 dark:text-zinc-400 mb-2">
            対象のキャラ
          </h2>
        </div>
        
        <CharacterCard
          characterName={character.name}
          avatarUrl={character.avatarUrl}
          mySentCount={localCount}
          onThrowBouquet={handleThrow}
          isOwner={isOwner}
          isLocked={isLocked}
        />
      </div>
    </main>
  );
}

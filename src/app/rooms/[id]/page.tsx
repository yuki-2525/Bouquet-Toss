"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Flower, Plus, ArrowRight, GripVertical, CheckCircle2, XCircle, Pencil, Share2, Copy, Check, TrendingUp, ArrowLeft, Users, X } from "lucide-react";
import { useUser } from "@/frontend/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// 型定義
import { LoadingScreen } from "@/frontend/components/LoadingScreen";

interface Character {
  id: string;
  name: string;
  avatarUrl: string | null;
  ownerId: string;
  mySentCount: number;
  totalBouquets: number | null;
}

interface RoomData {
  id: string;
  name: string;
  createdBy: string;
  characters: Character[];
  members: { id: string; name: string; avatarUrl: string | null }[];
}

// ドラッグ可能なキャラクターカードコンポーネント
function SortableCharacterItem({
  char,
  roomId,
  isEditMode,
  router,
}: {
  char: Character;
  roomId: string;
  isEditMode: boolean;
  router: any;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: char.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {isEditMode ? (
        // 編集モード: ドラッグハンドル付きカード
        <div className="group flex items-center justify-between overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/80 p-4 sm:p-6 border-2 border-rose-400/60 shadow-sm gap-4 cursor-default select-none">
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              {...attributes}
              {...listeners}
              className="touch-none shrink-0 text-zinc-400 hover:text-rose-500 transition-colors cursor-grab active:cursor-grabbing p-1"
              aria-label="ドラッグして並び替え"
            >
              <GripVertical className="w-6 h-6" />
            </button>
            <div className="w-20 h-14 sm:w-28 sm:h-20 shrink-0 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
              {char.avatarUrl ? (
                <div className={`grid w-full h-full ${char.avatarUrl.split(",").filter(u => u.trim()).length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {char.avatarUrl.split(",").filter(u => u.trim()).map((url, i) => (
                    <img key={i} src={url} alt={`${char.name} ${i + 1}`} className="w-full h-full object-cover" />
                  ))}
                </div>
              ) : (
                <Flower className="h-6 w-6 sm:h-8 sm:w-8 opacity-40" />
              )}
            </div>
            <h3 className="text-lg sm:text-2xl font-serif font-bold text-zinc-800 dark:text-zinc-100">
              {char.name}
            </h3>
          </div>
        </div>
      ) : (
        // 通常モード: カード
        <div
          onClick={() => router.push(`/rooms/${roomId}/throw/${char.id}`)}
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/80 p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md hover:border-rose-500/50 cursor-pointer"
        >
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-20 h-14 sm:w-28 sm:h-20 shrink-0 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 transition-transform group-hover:scale-[1.03] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
              {char.avatarUrl ? (
                <div className={`grid w-full h-full ${char.avatarUrl.split(",").filter(u => u.trim()).length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {char.avatarUrl.split(",").filter(u => u.trim()).map((url, i) => (
                    <img key={i} src={url} alt={`${char.name} ${i + 1}`} className="w-full h-full object-cover" />
                  ))}
                </div>
              ) : (
                <Flower className="h-6 w-6 sm:h-8 sm:w-8 opacity-40" />
              )}
            </div>
            <h3 className="text-lg sm:text-2xl font-serif font-bold text-zinc-800 dark:text-zinc-100">
              {char.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-zinc-400 group-hover:text-rose-500 transition-colors">
            {char.totalBouquets !== null && (
              <Link
                href={`/rooms/${roomId}/characters/${char.id}/stats`}
                className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 transition-all mr-2"
                title="キャラの統計を見る"
                onClick={(e) => e.stopPropagation()} // 親の onClick 発火を防ぐ
              >
                <TrendingUp className="w-5 h-5" />
              </Link>
            )}
            <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
              投下画面へ
            </span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params?.id as string) || "mock-room-id";

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableChars, setEditableChars] = useState<Character[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { user } = useUser();
  const currentUserId = user?.id;

  const searchParams = useSearchParams();
  const autoPass = searchParams?.get("pass");
  const [isCopying, setIsCopying] = useState(false);
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchRoom = async () => {
      try {
        // 1. 自動認証（passパラメータがある場合）
        if (autoPass) {
          const unlockRes = await fetch(`/api/rooms/${roomId}/unlock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: autoPass, userId: currentUserId }),
          });
          if (unlockRes.ok) {
            router.replace(`/rooms/${roomId}`);
            return;
          }
        }

        // 2. ルーム情報の取得
        const res = await fetch(`/api/rooms/${roomId}?userId=${currentUserId}`);
        if (res.status === 403) {
          router.push(`/rooms/${roomId}/unlock`);
          return;
        }
        if (!res.ok) throw new Error('ルームが見つかりません');
        
        const data = await res.json();
        setRoomData(data);
        setEditableChars(data.characters);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();

    // 3. リアルタイム更新（SSE）の開始
    const eventSource = new EventSource(`/api/rooms/${roomId}/events`);
    
    eventSource.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        
        if (type === 'CHARACTER_UPDATE') {
          setRoomData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              characters: prev.characters.map(c => 
                c.id === data.id 
                  ? { ...c, totalBouquets: data.total_bouquets_received } 
                  : c
              )
            };
          });
        } else if (type === 'CHARACTER_INSERT') {
          // 重複チェックをしてから追加
          setRoomData(prev => {
            if (!prev || prev.characters.some(c => c.id === data.id)) return prev;
            const newChar = {
              id: data.id,
              name: data.name,
              avatarUrl: data.avatar_url,
              ownerId: data.user_id,
              mySentCount: 0,
              totalBouquets: data.total_bouquets_received
            };
            return { ...prev, characters: [...prev.characters, newChar] };
          });
        } else if (type === 'MEMBERS_UPDATE') {
          setRoomData(prev => prev ? { ...prev, members: data } : prev);
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE error, reconnecting...", err);
      // EventSource は自動で再接続を試みます
    };

    return () => {
      eventSource.close();
    };
  }, [roomId, currentUserId, autoPass, router]);

  const copyInviteUrl = () => {
    if (!roomData) return;
    // 実際にはAPIからパスワードを取得する手段がないため（セキュリティ上）、
    // ルーム作成時か管理者にしか分からないはずですが、
    // ここでは「現在のパスワード付きURL」を作るためのUIとして用意します。
    // ※パスワード自体は roomData に含めていないため、プロンプトで入力させるか
    // 作成者のみが知っている前提となります。
    const pass = window.prompt("共有用パスワードを入力してください（招待URLに埋め込まれます）");
    if (!pass) return;

    const url = `${window.location.origin}/rooms/${roomId}?pass=${encodeURIComponent(pass)}`;
    navigator.clipboard.writeText(url);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };

  // ドラッグ操作のセンサー設定（マウス/タッチ両対応）
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setEditableChars((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleEditStart = () => {
    setEditableChars(roomData!.characters);
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setEditableChars(roomData!.characters);
    setIsEditMode(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/characters/order`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          characters: editableChars.map((char, index) => ({
            id: char.id,
            sort_order: index,
          })),
        }),
      });

      if (!res.ok) throw new Error("保存に失敗しました");

      // ローカルのデータも更新
      setRoomData((prev) => prev ? { ...prev, characters: editableChars } : prev);
      setIsEditMode(false);
    } catch (err) {
      console.error(err);
      alert("並び順の保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsSaving(false);
    }
  };

  const [isAdding, setIsAdding] = useState(false);
  const [newCharName, setNewCharName] = useState("");
  const [newAvatarUrl, setNewAvatarUrl] = useState("");

  const handleAddCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName || !currentUserId) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCharName,
          avatarUrl: newAvatarUrl || null,
          roomId,
          userId: currentUserId,
        }),
      });

      if (!res.ok) throw new Error("追加に失敗しました");
      
      const newChar = await res.json();
      setRoomData(prev => prev ? {
        ...prev,
        characters: [...prev.characters, newChar]
      } : prev);
      
      setIsAdding(false);
      setNewCharName("");
      setNewAvatarUrl("");
    } catch (err) {
      alert("追加に失敗しました");
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Entering the Room" />;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <h2 className="text-2xl font-bold text-red-500">エラー</h2>
        <p className="text-zinc-500">{error}</p>
        <Link href="/" className="text-rose-500 underline">トップへ戻る</Link>
      </div>
    );
  }

  if (!roomData) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const isRoomCreator = !!currentUserId && roomData.createdBy === currentUserId;
  const displayChars = isEditMode ? editableChars : roomData.characters;

  return (
    <main className="container mx-auto px-4 py-12 min-h-screen relative pb-32">
      {/* 戻る導線 */}
      <div className="max-w-3xl mx-auto mb-8">
        <Link 
          href="/rooms" 
          className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-rose-500 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          ルーム一覧へ戻る
        </Link>
      </div>

      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold font-serif mb-4">{roomData.name}</h1>
        <div className="flex flex-col items-center gap-4">
          <p className="text-zinc-500 dark:text-zinc-400 max-w-lg">
            {isEditMode
              ? "ドラッグして並び替えてください"
              : "このセッションに登場するキャラたちです。クリックしてブーケを贈りましょう。"}
          </p>
          
          {!isEditMode && (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={copyInviteUrl}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:border-rose-400 hover:text-rose-500 transition-all shadow-sm"
              >
                {isCopying ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {isCopying ? "コピーしました！" : "招待URL（パスワード付き）をコピー"}
              </button>

              {/* 参加メンバー一覧 */}
              <button 
                onClick={() => setIsMemberListOpen(true)}
                className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group/members"
              >
                <div className="flex -space-x-2 overflow-hidden">
                  {(roomData.members || []).slice(0, 5).map((member) => (
                    <div
                      key={member.id}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-zinc-100 dark:bg-zinc-800 overflow-hidden"
                      title={member.name}
                    >
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-zinc-400">
                          {member.name ? member.name[0] : "?"}
                        </div>
                      )}
                    </div>
                  ))}
                  {(roomData.members?.length || 0) > 5 && (
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                      +{(roomData.members?.length || 0) - 5}
                    </div>
                  )}
                </div>
                <span className="text-xs text-zinc-400 font-bold ml-1 group-hover/members:text-rose-500 transition-colors">
                  {(roomData.members?.length || 0)} 人が参加中
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* メンバー一覧モーダル */}
      <AnimatePresence>
        {isMemberListOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMemberListOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                  <Users className="w-5 h-5 text-rose-500" />
                  <h2 className="text-xl font-bold">参加中のユーザー</h2>
                </div>
                <button 
                  onClick={() => setIsMemberListOpen(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
                {(roomData.members || []).map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-zinc-400">{member.name ? member.name[0] : "?"}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-zinc-800 dark:text-zinc-100">{member.name}</p>
                      {member.id === roomData.createdBy && (
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-900/30 text-rose-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Owner</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 text-center">
                <p className="text-xs text-zinc-400 font-medium">
                  ルーム内にアクセスしたユーザーがここに表示されます
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto">
        {/* ルーム作成者のみ表示: 編集・保存・キャンセルボタン */}
        {isRoomCreator && (
          <div className="flex justify-end mb-4 gap-2">
            {isEditMode ? (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm shadow-rose-500/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSaving ? "保存中..." : "順番を保存する"}
                </button>
              </>
            ) : (
              <button
                onClick={handleEditStart}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                順番を並び替える
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {isEditMode ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displayChars.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {displayChars.map((char) => (
                  <SortableCharacterItem
                    key={char.id}
                    char={char}
                    roomId={roomId}
                    isEditMode={true}
                    router={router}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            displayChars.map((char) => (
              <SortableCharacterItem
                key={char.id}
                char={char}
                roomId={roomId}
                isEditMode={false}
                router={router}
              />
            ))
          )}

          {/* 騎士追加カード (全員に表示) */}
          {!isEditMode && (
            <div className="mt-4">
              {isAdding ? (
                <form onSubmit={handleAddCharacter} className="flex flex-col gap-4 p-6 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-rose-500 shadow-lg transition-all">
                  <div className="space-y-3">
                    <div className="text-left">
                      <label className="block text-xs font-bold text-zinc-400 uppercase mb-1 ml-1">キャラの名前</label>
                      <input
                        type="text"
                        placeholder="例: ステラ"
                        value={newCharName}
                        onChange={(e) => setNewCharName(e.target.value)}
                        autoFocus
                        required
                        className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div className="text-left">
                      <label className="block text-xs font-bold text-zinc-400 uppercase mb-1 ml-1">画像URL (任意)</label>
                      <input
                        type="url"
                        placeholder="https://example.com/avatar.png"
                        value={newAvatarUrl}
                        onChange={(e) => setNewAvatarUrl(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setNewAvatarUrl("");
                        setNewCharName("");
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl text-sm font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20"
                    >
                      キャラを登録する
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full flex items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-all group"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-bold">キャラを追加する</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

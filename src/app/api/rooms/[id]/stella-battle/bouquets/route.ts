import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/backend/db/supabase-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  const { characterId, amount } = await request.json(); // amount は正負の整数

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminSupabase = createAdminClient();

  // 1. ルームのステラバトル状態を確認
  const { data: room } = await adminSupabase
    .from('rooms')
    .select('stella_battle_active')
    .eq('id', roomId)
    .single();

  if (!room?.stella_battle_active) {
    return NextResponse.json({ error: 'Stella Battle is not active' }, { status: 400 });
  }

  // 2. 数値を更新 (キャラクターテーブルを直接更新)
  // RPCを使わずに単純な加算を行う（ステラバトル用なので、厳密なログ不要の想定）
  const { data: char, error: updateError } = await adminSupabase
    .rpc('increment_stella_bouquets', {
      p_character_id: characterId,
      p_amount: amount
    });

  // RPCがない場合のために、直接SQLを実行するか取得→更新を行う
  // ここでは確実性のために取得→更新で行います（小規模ならこれで十分）
  const { data: currentChar } = await adminSupabase
    .from('characters')
    .select('stella_battle_bouquets, name')
    .eq('id', characterId)
    .single();

  if (!currentChar) return NextResponse.json({ error: 'Character not found' }, { status: 404 });

  const newCount = Math.max(0, (Number(currentChar.stella_battle_bouquets) || 0) + amount);

  const { data: updatedChar, error } = await adminSupabase
    .from('characters')
    .update({ stella_battle_bouquets: newCount })
    .eq('id', characterId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

  // 3. SSEで全ユーザーに通知
  await adminSupabase.channel(`room:${roomId}`).send({
    type: 'broadcast',
    event: 'STELLA_BATTLE_UPDATE',
    payload: { 
      id: characterId, 
      stella_battle_bouquets: newCount 
    }
  });

  return NextResponse.json({ 
    success: true, 
    id: characterId, 
    stella_battle_bouquets: newCount 
  });
}

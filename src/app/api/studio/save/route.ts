import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/studio/save
 * Guarda el contenido del documento en Supabase.
 * Valida que el usuario tenga acceso a ese documento antes de escribir.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      documentId: string | null;
      title: string;
      content: Record<string, unknown>;
      wordCount: number;
    };

    const { documentId, title, content, wordCount } = body;

    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que el documento pertenece a la org del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        title: title.trim() || 'Documento sin título',
        content: content as any,
        word_count: wordCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('org_id', profile.org_id);

    if (updateError) {
      console.error('[studio/save] Supabase error:', updateError);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[studio/save] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

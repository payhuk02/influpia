import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { rateLimit, rateLimitHeaders, clientIp } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';

const EMBEDDING_MODEL = 'text-embedding-3-small';

async function createEmbedding(input: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('EMBEDDINGS_NOT_CONFIGURED');
  }

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input }),
  });

  if (!res.ok) {
    console.error('Embedding API error:', res.status, await res.text());
    throw new Error('EMBEDDING_REQUEST_FAILED');
  }

  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0].embedding;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth required: /api/* is excluded from the middleware matcher
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting : le matching IA appelle un fournisseur payant.
    const LIMIT = 10;
    const limitResult = rateLimit(`ai-matching:${user.id}`, { limit: LIMIT, windowMs: 60_000 });
    if (!limitResult.ok) {
      return NextResponse.json(
        { success: false, error: 'Trop de requêtes, réessayez dans un instant.' },
        { status: 429, headers: rateLimitHeaders(limitResult, LIMIT) }
      );
    }



    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const { campaign_id, brand_industry, objectives } = body as {
      campaign_id?: string;
      brand_industry?: string;
      objectives?: string;
    };

    // Contexte de la campagne (si fourni) pour enrichir la requête sémantique
    let campaignContext = '';
    if (campaign_id) {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('title, description, objectives, content_types, target_platforms')
        .eq('id', campaign_id)
        .maybeSingle();

      if (campaign) {
        campaignContext = [
          campaign.title,
          campaign.description,
          campaign.objectives,
          campaign.content_types?.join(', '),
          campaign.target_platforms?.join(', '),
        ]
          .filter(Boolean)
          .join(' — ');
      }
    }

    const query = [campaignContext, brand_industry, objectives]
      .filter((v) => typeof v === 'string' && v.trim().length > 0)
      .join(' — ')
      .slice(0, 4000);

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Contexte de matching vide' },
        { status: 400 },
      );
    }

    let query_embedding: number[];
    try {
      query_embedding = await createEmbedding(query);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'EMBEDDING_REQUEST_FAILED';
      if (message === 'EMBEDDINGS_NOT_CONFIGURED') {
        return NextResponse.json(
          {
            success: false,
            error:
              "Le matching IA n'est pas configuré (variable d'environnement OPENAI_API_KEY manquante).",
          },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { success: false, error: 'Service d\'embeddings indisponible' },
        { status: 502 },
      );
    }

    const { data: matches, error } = await supabase.rpc('match_influencers', {
      query_embedding,
      match_threshold: 0.7,
      match_count: 5,
    });

    if (error) {
      console.error('Vector match error:', error);
      throw error;
    }

    await logAudit({
      actorId: user.id,
      action: 'ai_matching.run',
      targetType: 'campaign',
      targetId: campaign_id ?? null,
      metadata: { matches: Array.isArray(matches) ? matches.length : 0 },
      ip: clientIp(request),
    });

    return NextResponse.json(
      { success: true, matches },
      { headers: rateLimitHeaders(limitResult, LIMIT) }
    );
  } catch (error) {
    console.error('AI Matching Error:', error);
    return NextResponse.json({ success: false, error: 'Matching failed' }, { status: 500 });
  }
}

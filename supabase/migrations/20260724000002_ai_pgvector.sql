-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to influencers
ALTER TABLE public.influencers ADD COLUMN embedding vector(1536);

-- 3. Create a function to match influencers based on embeddings
CREATE OR REPLACE FUNCTION match_influencers (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  display_name text,
  niches text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    influencers.id,
    influencers.display_name,
    influencers.niches,
    1 - (influencers.embedding <=> query_embedding) AS similarity
  FROM influencers
  WHERE 1 - (influencers.embedding <=> query_embedding) > match_threshold
  ORDER BY influencers.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

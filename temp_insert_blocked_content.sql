INSERT INTO public.blocked_content (content_type, blocked_value, reason) VALUES
  ('keyword', 'viagra', 'Spam'),
  ('keyword', 'casino', 'Gambling'),
  ('keyword', 'porn', 'Adult content'),
  ('domain', 'malware.com', 'Malware'),
  ('domain', 'phishing.net', 'Phishing')
ON CONFLICT DO NOTHING;

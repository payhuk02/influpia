INSERT INTO public.moderation_rules (rule_name, rule_type, content_types, conditions, action, severity) VALUES
  ('Prohibited Keywords', 'keyword', ARRAY['campaign', 'message', 'deliverable'], 
   '{"keywords": ["scam", "fraud", "illegal", "hack", "pirate"], "match_type": "exact"}'::jsonb, 'flag', 'high'),
  ('Spam Detection', 'spam_detection', ARRAY['message', 'comment'],
   '{"max_repeated_chars": 10, "max_caps_ratio": 0.7, "min_length": 5}'::jsonb, 'flag', 'medium'),
  ('Link Safety Check', 'link_check', ARRAY['campaign', 'message'],
   '{"blocked_domains": ["malware.com", "phishing.net"], "require_https": true}'::jsonb, 'flag', 'high');

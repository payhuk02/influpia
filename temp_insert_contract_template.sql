INSERT INTO public.contract_templates (name, description, template_type, content, variables) VALUES
  ('Standard Campaign Contract', 'Contrat standard pour campagnes d''influence', 'standard', 
'# CONTRAT DE COLLABORATION INFLUENCER

## Entre les parties :
**Le Donneur d''ordre** : {{brand_name}}
**L''Influenceur** : {{influencer_name}}

## Objet du contrat
Collaboration pour la campagne : {{campaign_title}}

## Livrables
{{deliverables_list}}

## Modalités de paiement
**Montant total** : {{total_amount}} {{currency}}
Paiement sécurisé via escrow Influpia

---
Fait le {{contract_date}}',
'{"brand_name": {"type": "text"}, "influencer_name": {"type": "text"}, "campaign_title": {"type": "text"}, "deliverables_list": {"type": "text"}, "total_amount": {"type": "number"}, "currency": {"type": "text"}, "contract_date": {"type": "date"}}'::jsonb
  )
ON CONFLICT (name) DO NOTHING;

-- Update constraint on collaborations status
ALTER TABLE public.collaborations DROP CONSTRAINT IF EXISTS collaborations_status_check;

ALTER TABLE public.collaborations ADD CONSTRAINT collaborations_status_check 
CHECK (status IN ('in_progress', 'escrow_secured', 'submitted', 'approved', 'paid', 'refunded', 'cancelled'));

-- Optionnel: Re-notify schema cache
NOTIFY pgrst, 'reload schema';

-- Add options for room owner privileges
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS allow_owner_manage_all BOOLEAN DEFAULT false;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS allow_owner_view_stats BOOLEAN DEFAULT true;

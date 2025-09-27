-- Drop the old Medical stock table since we have the new medicines table
DROP TABLE IF EXISTS public."Medical stock";

-- Create import_logs table for tracking bulk imports
CREATE TABLE public.import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  import_type TEXT NOT NULL, -- 'pdf', 'excel', 'csv'
  total_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  error_details JSONB,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own import logs" ON public.import_logs
FOR ALL USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'low_stock', 'expiry_alert', 'high_sales'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notifications" ON public.notifications
FOR ALL USING (auth.uid() = user_id);
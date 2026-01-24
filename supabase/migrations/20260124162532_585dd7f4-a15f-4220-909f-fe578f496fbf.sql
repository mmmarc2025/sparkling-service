-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_type TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create system_settings table
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Public can insert bookings (for the booking form)
CREATE POLICY "Anyone can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (true);

-- Public can read bookings (for admin - we'll add auth later)
CREATE POLICY "Anyone can view bookings"
ON public.bookings
FOR SELECT
USING (true);

-- Public can update bookings (for admin status changes)
CREATE POLICY "Anyone can update bookings"
ON public.bookings
FOR UPDATE
USING (true);

-- Public can read system settings
CREATE POLICY "Anyone can view system settings"
ON public.system_settings
FOR SELECT
USING (true);

-- Public can insert/update system settings
CREATE POLICY "Anyone can manage system settings"
ON public.system_settings
FOR ALL
USING (true);

-- Insert default system prompt
INSERT INTO public.system_settings (key, value, description)
VALUES ('GEMINI_SYSTEM_PROMPT', 'You are a helpful car wash assistant. Help customers book appointments and answer questions about our services.', 'System instruction for the LINE Bot AI assistant');
-- ============================================
-- SECURITY FIX: Create user roles system
-- ============================================

-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create policy for user_roles (only service role can manage)
CREATE POLICY "Service role manages user_roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- SECURITY FIX: Secure bookings table
-- ============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can update bookings" ON public.bookings;

-- Create admin-only policies for SELECT and UPDATE
CREATE POLICY "Admins can view bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Keep the service role policy for edge functions
CREATE POLICY "Service role full access bookings"
ON public.bookings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- SECURITY FIX: Secure chat_history table
-- ============================================

-- The existing "Service Role Full Access" policy is correct (only service role via edge functions)
-- No additional changes needed for chat_history

-- ============================================
-- SECURITY FIX: Secure system_settings table
-- ============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;

-- Create admin-only policies
CREATE POLICY "Admins can view system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage system settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role needs access for edge functions
CREATE POLICY "Service role full access system settings"
ON public.system_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- SECURITY FIX: Secure services table
-- ============================================

-- Drop overly permissive admin policy
DROP POLICY IF EXISTS "Admin Full Access" ON public.services;

-- Create proper admin policy using role check
CREATE POLICY "Admins can manage services"
ON public.services
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- SECURITY FIX: Add input validation constraints
-- ============================================

-- Add constraints to bookings table
ALTER TABLE public.bookings 
ADD CONSTRAINT check_name_length CHECK (length(customer_name) <= 100);

ALTER TABLE public.bookings
ADD CONSTRAINT check_phone_format CHECK (phone ~ '^[0-9+\-() ]{6,20}$');

ALTER TABLE public.bookings
ADD CONSTRAINT check_service_length CHECK (length(service_type) <= 100);
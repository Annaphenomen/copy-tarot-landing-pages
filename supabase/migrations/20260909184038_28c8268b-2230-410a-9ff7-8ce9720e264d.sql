CREATE SEQUENCE IF NOT EXISTS public.order_seq START 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_seq integer;
GRANT USAGE, SELECT ON SEQUENCE public.order_seq TO service_role;
CREATE OR REPLACE FUNCTION public.next_order_code()
RETURNS TABLE (seq integer, code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE s integer;
BEGIN
  s := nextval('public.order_seq')::integer;
  RETURN QUERY SELECT s, 'RS-' || lpad((((s * 137) % 1000))::text, 3, '0');
END;
$$;
REVOKE ALL ON FUNCTION public.next_order_code() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_order_code() TO service_role;
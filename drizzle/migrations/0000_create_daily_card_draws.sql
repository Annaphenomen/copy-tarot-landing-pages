CREATE TABLE public.daily_card_draws (
  ip_hash text NOT NULL,
  day date NOT NULL,
  card_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ip_hash, day)
);

GRANT ALL ON public.daily_card_draws TO service_role;

ALTER TABLE public.daily_card_draws ENABLE ROW LEVEL SECURITY;
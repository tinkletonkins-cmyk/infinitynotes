-- Update the default invite_code to generate a short 5-character alphanumeric code
ALTER TABLE public.voids 
ALTER COLUMN invite_code SET DEFAULT upper(substring(replace(encode(extensions.gen_random_bytes(4), 'base64'), '/', ''), 1, 5));
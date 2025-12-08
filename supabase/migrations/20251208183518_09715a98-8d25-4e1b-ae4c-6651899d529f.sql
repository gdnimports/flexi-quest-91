-- Add INSERT policy for gym-logos bucket (the SELECT policy already exists)
CREATE POLICY "Authenticated users can upload gym logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gym-logos' AND auth.role() = 'authenticated');
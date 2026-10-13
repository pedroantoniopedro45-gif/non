/*
# FINAL LICENSE HARDENING

This migration enforces a deny-by-default posture for public license tables.
The app should use the server-side Edge Function only; direct browser access to
`licenses` and `activations` is blocked even if a user manipulates the frontend.
*/

DROP POLICY IF EXISTS "deny_all_anon_licenses" ON public.licenses;
CREATE POLICY "deny_all_anon_licenses"
ON public.licenses FOR ALL
TO anon
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "deny_all_authenticated_licenses" ON public.licenses;
CREATE POLICY "deny_all_authenticated_licenses"
ON public.licenses FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "deny_all_anon_activations" ON public.activations;
CREATE POLICY "deny_all_anon_activations"
ON public.activations FOR ALL
TO anon
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "deny_all_authenticated_activations" ON public.activations;
CREATE POLICY "deny_all_authenticated_activations"
ON public.activations FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

REVOKE ALL PRIVILEGES ON TABLE public.licenses FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.activations FROM anon, authenticated;

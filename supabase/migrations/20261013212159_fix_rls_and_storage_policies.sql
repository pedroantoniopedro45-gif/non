/*
# Corrigir RLS e políticas de storage para licenças

1. Corrigir policy UPDATE de license_purchase_requests
- A policy atual permite reverter um pedido aprovado/rejeitado para pending_verification.
- Nova policy só permite transição de pending_verification para approved ou rejected.
- Isto previne manipulação inconsistente do estado dos pedidos.

2. Adicionar policy DELETE para storage.objects (bucket license-receipts)
- Permite que admins eliminem recibos de pedidos rejeitados ou antigos.
- Restrito ao bucket license-receipts e role admin.

3. Nenhuma alteração a dados existentes.
*/

DROP POLICY IF EXISTS "Admins can review license requests" ON public.license_purchase_requests;

CREATE POLICY "Admins can review license requests"
ON public.license_purchase_requests FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  AND status IN ('approved', 'rejected')
);

DROP POLICY IF EXISTS "Admins can delete license receipts" ON storage.objects;
CREATE POLICY "Admins can delete license receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'license-receipts'
  AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

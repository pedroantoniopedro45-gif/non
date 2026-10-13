/*
# Harden license data access and create application storage buckets

1. Storage buckets
- `avicontrol-assets`: bucket público apenas para leitura de ficheiros não sensíveis da aplicação.
- `avicontrol-backups`: bucket privado reservado para cópias de segurança futuras; não permite acesso direto de clientes.
- Ambos limitam o tamanho dos ficheiros e os tipos MIME aceites.

2. License security
- `public.licenses` e `public.activations` continuam com RLS ativo.
- O acesso direto dos papéis `anon` e `authenticated` às tabelas de licenciamento é removido.
- A validação e ativação continuam a funcionar através da Edge Function `verify-license`, que usa a chave de serviço no servidor.
- Nenhum dado existente é apagado ou alterado.

3. Storage security
- O bucket de assets é explicitamente público apenas por ser destinado a ficheiros não sensíveis.
- O bucket de backups é privado.
- Não são criadas permissões de escrita, substituição ou eliminação para clientes.
- As tabelas internas do Storage não são alteradas porque são geridas pelo Supabase.

4. Important notes
- A aplicação não contém atualmente um fluxo de upload de ficheiros de utilizador.
- Ficheiros sensíveis devem usar `avicontrol-backups` através de uma função de servidor e URLs assinados de curta duração.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avicontrol-assets', 'avicontrol-assets', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']),
  ('avicontrol-backups', 'avicontrol-backups', false, 52428800, ARRAY['application/json', 'application/zip', 'text/plain'])
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "anon_read_licenses" ON public.licenses;
DROP POLICY IF EXISTS "anon_insert_licenses" ON public.licenses;
DROP POLICY IF EXISTS "anon_update_licenses" ON public.licenses;
DROP POLICY IF EXISTS "anon_delete_licenses" ON public.licenses;
DROP POLICY IF EXISTS "anon_read_activations" ON public.activations;
DROP POLICY IF EXISTS "anon_insert_activations" ON public.activations;
DROP POLICY IF EXISTS "anon_update_activations" ON public.activations;
DROP POLICY IF EXISTS "anon_delete_activations" ON public.activations;

REVOKE ALL PRIVILEGES ON TABLE public.licenses FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.activations FROM anon, authenticated;

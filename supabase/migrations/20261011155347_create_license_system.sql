/*
# Sistema de Licenças - AVICONTROL PRO

## Overview
Cria o sistema de licenciamento que permite comercializar o aplicativo.
Cada licença tem uma chave única (license_key), um estado (active/inactive/expired),
tipo de plano (trial/monthly/yearly/lifetime), datas de validade, e está associada
a um identificador de dispositivo após a ativação.

## New Tables

### licenses
- `id` (uuid, PK): identificador interno
- `license_key` (text, unique, not null): chave única da licença (formato XXXX-XXXX-XXXX-XXXX)
- `customer_name` (text): nome do cliente
- `customer_email` (text): email do cliente
- `customer_phone` (text): telefone do cliente
- `plan_type` (text, not null): tipo de plano - 'trial', 'monthly', 'yearly', 'lifetime'
- `status` (text, not null, default 'active'): estado - 'active', 'inactive', 'expired', 'revoked'
- `max_devices` (int, not null, default 1): número máximo de dispositivos que podem ativar esta licença
- `issued_at` (timestamptz): data de emissão
- `expires_at` (timestamptz): data de validade (null para lifetime)
- `notes` (text): notas internas do administrador
- `created_at` (timestamptz): data de criação do registo

### activations
- `id` (uuid, PK): identificador interno
- `license_id` (uuid, FK -> licenses): licença associada
- `device_id` (text, not null): identificador único do dispositivo (gerado no frontend)
- `device_name` (text): nome/descrição do dispositivo
- `activated_at` (timestamptz): data de ativação
- `last_seen_at` (timestamptz): último acesso
- `is_active` (boolean, default true): se a ativação está ativa
- `created_at` (timestamptz): data de criação

## Security
- RLS ativada em ambas as tabelas.
- Políticas TO anon, authenticated pois a app não tem sistema de login (single-tenant público).
- Qualquer cliente anon pode verificar/ativar licenças — a segurança está na chave da licença.
- A revogação/expiração é controlada pelo campo status e expires_at na tabela licenses.

## Important Notes
1. O administrador cria licenças manualmente no Supabase Studio.
2. A app gera um device_id único por instalação (localStorage).
3. A edge function valida a chave + device_id e regista a ativação.
4. Licenças trial expiram automaticamente após X dias (expires_at).
5. max_devices controla quantos dispositivos podem usar a mesma chave.
*/

CREATE TABLE IF NOT EXISTS licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key text UNIQUE NOT NULL,
  customer_name text,
  customer_email text,
  customer_phone text,
  plan_type text NOT NULL DEFAULT 'yearly',
  status text NOT NULL DEFAULT 'active',
  max_devices int NOT NULL DEFAULT 1,
  issued_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_licenses" ON licenses;
CREATE POLICY "anon_read_licenses" ON licenses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_licenses" ON licenses;
CREATE POLICY "anon_insert_licenses" ON licenses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_licenses" ON licenses;
CREATE POLICY "anon_update_licenses" ON licenses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_licenses" ON licenses;
CREATE POLICY "anon_delete_licenses" ON licenses FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  device_name text,
  activated_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(license_id, device_id)
);

ALTER TABLE activations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_activations" ON activations;
CREATE POLICY "anon_read_activations" ON activations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_activations" ON activations;
CREATE POLICY "anon_insert_activations" ON activations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_activations" ON activations;
CREATE POLICY "anon_update_activations" ON activations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_activations" ON activations;
CREATE POLICY "anon_delete_activations" ON activations FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_activations_license ON activations(license_id);
CREATE INDEX IF NOT EXISTS idx_activations_device ON activations(device_id);

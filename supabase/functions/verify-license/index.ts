import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface LicenseRow {
  id: string;
  license_key: string;
  customer_name: string | null;
  plan_type: string;
  status: string;
  max_devices: number;
  expires_at: string | null;
}

interface ActivationRow {
  id: string;
  is_active: boolean;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const licenseKey = typeof body.license_key === "string" ? body.license_key.trim().toUpperCase() : "";
    const deviceId = typeof body.device_id === "string" ? body.device_id.trim() : "";
    const deviceName = typeof body.device_name === "string" ? body.device_name.slice(0, 100) : "Dispositivo desconhecido";
    const action = body.action === "activate" ? "activate" : "verify";

    if (!licenseKey || !deviceId) {
      return jsonResponse({ valid: false, error: "Chave de licença e identificador do dispositivo são obrigatórios." }, 400);
    }

    // 1. Buscar a licença pela chave
    const { data: license, error: licError } = await adminClient
      .from("licenses")
      .select("id, license_key, customer_name, plan_type, status, max_devices, expires_at")
      .eq("license_key", licenseKey)
      .maybeSingle();

    if (licError || !license) {
      return jsonResponse({ valid: false, error: "Chave de licença não encontrada." });
    }

    const lic = license as LicenseRow;

    // 2. Verificar estado da licença
    if (lic.status === "revoked") {
      return jsonResponse({ valid: false, error: "Esta licença foi revogada. Contacte o fornecedor." });
    }
    if (lic.status === "inactive") {
      return jsonResponse({ valid: false, error: "Esta licença está inativa. Contacte o fornecedor." });
    }

    // 3. Verificar validade
    const now = new Date();
    if (lic.expires_at && new Date(lic.expires_at) < now) {
      await adminClient.from("licenses").update({ status: "expired" }).eq("id", lic.id);
      return jsonResponse({ valid: false, error: "Esta licença expirou. Contacte o fornecedor para renovar." });
    }

    const licensePayload = {
      key: lic.license_key,
      plan_type: lic.plan_type,
      customer_name: lic.customer_name,
      expires_at: lic.expires_at,
      max_devices: lic.max_devices,
    };

    // 4. Buscar ativação existente para este dispositivo
    const { data: existingAct } = await adminClient
      .from("activations")
      .select("id, is_active")
      .eq("license_id", lic.id)
      .eq("device_id", deviceId)
      .maybeSingle();

    if (existingAct) {
      // Dispositivo já tem ativação — atualizar last_seen
      await adminClient
        .from("activations")
        .update({ last_seen_at: now.toISOString(), is_active: true })
        .eq("id", (existingAct as ActivationRow).id);

      return jsonResponse({ valid: true, license: licensePayload, already_activated: true });
    }

    // 5. Nova ativação — verificar limite de dispositivos
    if (action === "activate") {
      // Contar ativações ativas
      const { count } = await adminClient
        .from("activations")
        .select("*", { count: "exact", head: true })
        .eq("license_id", lic.id)
        .eq("is_active", true);

      if ((count || 0) >= lic.max_devices) {
        return jsonResponse({
          valid: false,
          error: `Esta licença já atingiu o limite de ${lic.max_devices} dispositivo(s). Contacte o fornecedor para aumentar o limite.`,
        });
      }

      // Tentar inserir — o UNIQUE(license_id, device_id) previne duplicação mesmo sob concorrência
      const { error: insertError } = await adminClient.from("activations").insert({
        license_id: lic.id,
        device_id: deviceId,
        device_name: deviceName,
        activated_at: now.toISOString(),
        last_seen_at: now.toISOString(),
        is_active: true,
      });

      if (insertError) {
        // Se violou a restrição única, o dispositivo foi ativado entretanto — tratar como já ativado
        if (insertError.message.includes("duplicate") || insertError.message.includes("unique")) {
          return jsonResponse({ valid: true, license: licensePayload, already_activated: true });
        }
        return jsonResponse({ valid: false, error: "Erro ao ativar a licença. Tente novamente." }, 500);
      }

      return jsonResponse({ valid: true, license: licensePayload, already_activated: false });
    }

    // 6. Apenas verificar (action !== "activate") — dispositivo sem ativação
    return jsonResponse({
      valid: false,
      error: "Esta licença ainda não foi ativada neste dispositivo. Ative primeiro.",
      needs_activation: true,
    });
  } catch {
    return jsonResponse({ valid: false, error: "Erro interno do servidor." }, 500);
  }
});

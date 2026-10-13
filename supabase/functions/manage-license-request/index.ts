import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const planSettings = {
  monthly: { days: 30 },
  yearly: { days: 365 },
  lifetime: { days: null },
} as const;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) return jsonResponse({ success: false, error: "Não autorizado." }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validar a sessão do utilizador com o anon key + token do utilizador
    const authClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: userData } = await authClient.auth.getUser();
    if (userData.user?.app_metadata?.role !== "admin") {
      return jsonResponse({ success: false, error: "Não autorizado." }, 403);
    }

    const body = await req.json();
    const requestId = typeof body.request_id === "string" ? body.request_id : "";
    const action = body.action === "approve" || body.action === "reject" ? body.action : null;
    if (!requestId || !action) return jsonResponse({ success: false, error: "Pedido inválido." }, 400);

    const adminClient = createClient(url, serviceRoleKey);

    // Buscar o pedido — usar SELECT FOR UPDATE via RPC para garantir exclusão mútua
    // Como Edge Functions não suportam transações nativas, usamos uma atualização condicional
    // para garantir que apenas um admin processa cada pedido.
    //
    // Rejeição: atualizar de pending_verification -> rejected atomicamente
    if (action === "reject") {
      const { data: rejected, error: rejectError } = await adminClient
        .from("license_purchase_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: userData.user.id,
        })
        .eq("id", requestId)
        .eq("status", "pending_verification")
        .select("id")
        .maybeSingle();

      if (rejectError) return jsonResponse({ success: false, error: "Não foi possível atualizar o pedido." }, 500);
      if (!rejected) return jsonResponse({ success: false, error: "Pedido já foi processado ou não existe." }, 409);

      return jsonResponse({ success: true, status: "rejected" });
    }

    // Aprovação:
    // 1. Atualizar pending_verification -> approved atomicamente (previne aprovação dupla)
    // 2. Se a atualização afetar 0 linhas, o pedido já foi processado
    // 3. Só depois criar a licença
    const reviewedAt = new Date().toISOString();
    const { data: approved, error: approveError } = await adminClient
      .from("license_purchase_requests")
      .update({
        status: "approved",
        reviewed_at: reviewedAt,
        reviewed_by: userData.user.id,
      })
      .eq("id", requestId)
      .eq("status", "pending_verification")
      .select("id, license_type")
      .maybeSingle();

    if (approveError) return jsonResponse({ success: false, error: "Não foi possível atualizar o pedido." }, 500);
    if (!approved) return jsonResponse({ success: false, error: "Pedido já foi processado ou não existe." }, 409);

    const setting = planSettings[(approved as { license_type: keyof typeof planSettings }).license_type] ??
      planSettings.yearly;

    const licenseKey = Array.from({ length: 4 }, () =>
      crypto.randomUUID().replaceAll("-", "").slice(0, 4).toUpperCase()
    ).join("-");

    const expiresAt = setting.days === null
      ? null
      : new Date(Date.now() + setting.days * 86400000).toISOString();

    const { error: licenseError } = await adminClient.from("licenses").insert({
      license_key: licenseKey,
      plan_type: (approved as { license_type: string }).license_type,
      status: "active",
      max_devices: 1,
      issued_at: reviewedAt,
      expires_at: expiresAt,
    });

    if (licenseError) {
      // Reverter o pedido para pending_verification se a criação da licença falhar
      await adminClient
        .from("license_purchase_requests")
        .update({ status: "pending_verification", reviewed_at: null, reviewed_by: null })
        .eq("id", requestId);

      return jsonResponse({ success: false, error: "Não foi possível criar a licença." }, 500);
    }

    return jsonResponse({ success: true, status: "approved", license_key: licenseKey });
  } catch {
    return jsonResponse({ success: false, error: "Erro interno." }, 500);
  }
});

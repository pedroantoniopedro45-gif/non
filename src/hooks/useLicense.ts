import { useCallback, useEffect, useState } from "react";

export interface LicenseInfo {
  key: string;
  plan_type: string;
  customer_name: string | null;
  expires_at: string | null;
  max_devices: number;
}

export type LicenseState =
  | { status: "loading" }
  | { status: "valid"; license: LicenseInfo }
  | { status: "invalid"; error: string }
  | { status: "none" };

const STORAGE_KEY = "avicontrol-license";
const DEVICE_KEY = "avicontrol-device-id";
// Tempo entre verificações online (24h em ms)
const VERIFY_INTERVAL = 24 * 60 * 60 * 1000;

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = "dev-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

interface StoredLicense {
  license_key: string;
  license: LicenseInfo;
  verified_at: number;
}

function getStoredLicense(): StoredLicense | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredLicense;
  } catch {
    return null;
  }
}

function storeLicense(key: string, license: LicenseInfo) {
  const data: StoredLicense = {
    license_key: key,
    license,
    verified_at: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearStoredLicense() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useLicense() {
  const [state, setState] = useState<LicenseState>({ status: "loading" });
  const deviceId = getOrCreateDeviceId();

  const verifyOnline = useCallback(
    async (key: string, action: "verify" | "activate" = "verify"): Promise<{ valid: boolean; license?: LicenseInfo; error?: string; needs_activation?: boolean }> => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const apiUrl = `${supabaseUrl}/functions/v1/verify-license`;

      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({
          license_key: key,
          device_id: deviceId,
          device_name: navigator.userAgent.slice(0, 100),
          action,
        }),
      });

      if (!resp.ok) {
        return { valid: false, error: "Erro de comunicação com o servidor de licenças." };
      }

      const data = await resp.json();
      if (data.valid && data.license) {
        return { valid: true, license: data.license as LicenseInfo };
      }
      return { valid: false, error: data.error || "Licença inválida.", needs_activation: data.needs_activation };
    },
    [deviceId]
  );

  const checkLicense = useCallback(async () => {
    const stored = getStoredLicense();
    if (!stored) {
      setState({ status: "none" });
      return;
    }

    // Verificar se a licença armazenada já expirou localmente
    if (stored.license.expires_at) {
      const exp = new Date(stored.license.expires_at);
      if (exp < new Date()) {
        clearStoredLicense();
        setState({ status: "invalid", error: "A sua licença expirou. Contacte o fornecedor para renovar." });
        return;
      }
    }

    // Verificar online periodicamente
    const timeSinceVerify = Date.now() - stored.verified_at;
    if (timeSinceVerify < VERIFY_INTERVAL) {
      // Ainda dentro do período — usar cache local
      setState({ status: "valid", license: stored.license });
      return;
    }

    // Verificar online
    try {
      const result = await verifyOnline(stored.license_key, "verify");
      if (result.valid && result.license) {
        storeLicense(stored.license_key, result.license);
        setState({ status: "valid", license: result.license });
      } else {
        clearStoredLicense();
        setState({ status: "invalid", error: result.error || "Licença inválida." });
      }
    } catch {
      // Sem ligação à internet — usar cache local se ainda válida
      setState({ status: "valid", license: stored.license });
    }
  }, [verifyOnline]);

  const activateLicense = useCallback(
    async (key: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await verifyOnline(key, "activate");
        if (result.valid && result.license) {
          storeLicense(key.trim().toUpperCase(), result.license);
          setState({ status: "valid", license: result.license });
          return { success: true };
        }
        return { success: false, error: result.error || "Não foi possível ativar a licença." };
      } catch {
        return { success: false, error: "Erro de ligação. Verifique a sua internet e tente novamente." };
      }
    },
    [verifyOnline]
  );

  const deactivateLicense = useCallback(() => {
    clearStoredLicense();
    setState({ status: "none" });
  }, []);

  useEffect(() => {
    checkLicense();
  }, [checkLicense]);

  return { state, activateLicense, deactivateLicense, checkLicense, deviceId };
}
